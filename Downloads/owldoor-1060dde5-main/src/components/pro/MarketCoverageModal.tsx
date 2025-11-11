import { useState, useRef, useCallback, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Circle, Pencil, X, ArrowLeft, Search, Lock, Unlock, Trash2, MapPinIcon } from "lucide-react";
import { LoadScript, Autocomplete, GoogleMap, Circle as MapCircle, Marker } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { z } from "zod";

const libraries: ("places")[] = ["places"];

const citySchema = z.object({
  name: z.string().trim().min(1, "City name is required").max(200),
  placeId: z.string().trim().min(1),
});

const radiusCircleSchema = z.object({
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  radius: z.number().min(1000).max(200000),
});

const coverageSchema = z.object({
  name: z.string().trim().min(1, "Coverage name is required").max(100),
  cities: z.array(citySchema).optional(),
  circles: z.array(radiusCircleSchema).optional(),
});

type City = z.infer<typeof citySchema>;
type RadiusCircle = z.infer<typeof radiusCircleSchema>;

interface MarketCoverageModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MarketCoverageModal({ open, onOpenChange }: MarketCoverageModalProps) {
  const [step, setStep] = useState<'select' | 'cities' | 'radius' | 'draw'>('select');
  const [coverageName, setCoverageName] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [circles, setCircles] = useState<RadiusCircle[]>([]);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const [saving, setSaving] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [defaultRadius, setDefaultRadius] = useState(16);
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 32.7157, lng: -117.1611 });
  
  const inputRef = useRef<HTMLInputElement | null>(null);
  const mapRef = useRef<google.maps.Map | null>(null);
  const searchAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
  };

  const handleMethodSelect = (method: 'cities' | 'radius' | 'draw') => {
    setStep(method);
  };

  const handleBack = () => {
    setStep('select');
    setCities([]);
    setCircles([]);
    setCoverageName("");
  };

  // Cities autocomplete handlers
  const onCityLoad = (auto: google.maps.places.Autocomplete) => {
    setAutocomplete(auto);
  };

  const onCityPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.place_id && place.formatted_address) {
        const newCity: City = {
          name: place.formatted_address,
          placeId: place.place_id,
        };

        const exists = cities.some(c => c.placeId === newCity.placeId);
        if (!exists) {
          setCities([...cities, newCity]);
          if (inputRef.current) {
            inputRef.current.value = '';
          }
        } else {
          toast.error("City already added");
        }
      }
    }
  };

  const removeCity = (placeId: string) => {
    setCities(cities.filter(c => c.placeId !== placeId));
  };

  // Radius map handlers
  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng && step === 'radius') {
      const newCircle: RadiusCircle = {
        center: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        },
        radius: defaultRadius * 1609.34,
      };
      setCircles([...circles, newCircle]);
    }
  };

  const removeCircle = (index: number) => {
    setCircles(circles.filter((_, i) => i !== index));
  };

  const onSearchPlaceChanged = () => {
    if (searchAutocompleteRef.current) {
      const place = searchAutocompleteRef.current.getPlace();
      if (place.geometry?.location && mapRef.current) {
        mapRef.current.panTo(place.geometry.location);
        mapRef.current.setZoom(12);
      }
    }
  };

  // Save handlers
  const handleSaveClick = () => {
    if (step === 'cities' && cities.length === 0) {
      toast.error("Add at least one city");
      return;
    }
    if (step === 'radius' && circles.length === 0) {
      toast.error("Add at least one radius circle");
      return;
    }
    setShowNameDialog(true);
  };

  const handleSave = async () => {
    try {
      const validated = coverageSchema.parse({
        name: coverageName,
        cities: step === 'cities' ? cities : undefined,
        circles: step === 'radius' ? circles : undefined,
      });

      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save");
        return;
      }

      let data: any = {};
      if (step === 'cities') {
        data = { cities: validated.cities };
      } else if (step === 'radius') {
        data = { circles: validated.circles };
      }

      const { error } = await supabase
        .from("market_coverage")
        .insert({
          user_id: user.id,
          coverage_type: step === 'draw' ? 'polygon' : step,
          name: validated.name,
          data,
        });

      if (error) throw error;

      toast.success("Market coverage saved!");
      onOpenChange(false);
      handleBack();
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to save market coverage");
      }
    } finally {
      setSaving(false);
      setShowNameDialog(false);
    }
  };

  const renderSelectionStep = () => (
    <>
      <DialogHeader>
        <DialogTitle className="text-3xl font-bold text-center mb-2">
          Set Up Your Market Coverage
        </DialogTitle>
        <p className="text-muted-foreground text-center text-lg">
          Choose the method that works best for defining your service area
        </p>
      </DialogHeader>

      <div className="grid md:grid-cols-3 gap-6 mt-6">
        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 hover:border-primary"
          onClick={() => handleMethodSelect('cities')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <MapPin className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">Type in Cities</CardTitle>
            <CardDescription className="text-base">
              Search and select multiple cities you work in
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Choose This Method
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 hover:border-primary"
          onClick={() => handleMethodSelect('radius')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Circle className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">Radius Circles</CardTitle>
            <CardDescription className="text-base">
              Place radius circles on a map to define your area
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Choose This Method
            </Button>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-all cursor-pointer hover:scale-105 border-2 hover:border-primary"
          onClick={() => handleMethodSelect('draw')}
        >
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-20 w-20 rounded-full bg-primary/10 flex items-center justify-center">
              <Pencil className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="text-xl">Draw Custom Area</CardTitle>
            <CardDescription className="text-base">
              Draw freehand polygons to define your exact coverage
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button className="w-full" size="lg">
              Choose This Method
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );

  const renderCitiesStep = () => (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Type in Cities You Work</h2>
        </div>

        <div className="space-y-2">
          <Label>Search and Add Cities</Label>
          <Autocomplete
            onLoad={onCityLoad}
            onPlaceChanged={onCityPlaceChanged}
            options={{
              types: ['(cities)'],
            }}
          >
            <Input 
              ref={inputRef}
              placeholder="Type city name..." 
            />
          </Autocomplete>
        </div>

        {cities.length > 0 && (
          <div className="space-y-2">
            <Label>Selected Cities ({cities.length})</Label>
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {cities.map((city) => (
                <div
                  key={city.placeId}
                  className="flex items-center justify-between p-3 bg-muted rounded-lg"
                >
                  <span className="text-sm">{city.name}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeCity(city.placeId)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button onClick={handleSaveClick} disabled={cities.length === 0} className="flex-1">
            Save Coverage
          </Button>
        </div>
      </div>
    </LoadScript>
  );

  const renderRadiusStep = () => (
    <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
      <div className="space-y-4">
        <div className="flex items-center gap-2 mb-4">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <h2 className="text-2xl font-bold">Radius Circles Coverage</h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-2">
            <Autocomplete
              onLoad={(autocomplete) => { searchAutocompleteRef.current = autocomplete; }}
              onPlaceChanged={onSearchPlaceChanged}
            >
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={18} />
                <Input placeholder="Search for a location..." className="pl-10" />
              </div>
            </Autocomplete>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsLocked(!isLocked)}
              title={isLocked ? 'Unlock Map' : 'Lock Map'}
            >
              {isLocked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />}
            </Button>
          </div>

          <div className="bg-muted p-3 rounded-lg">
            <p className="text-sm flex items-center gap-2">
              <MapPinIcon size={16} />
              Click on the map to place radius circles
            </p>
          </div>

          <div className="space-y-2">
            <Label>Circle Radius: <span className="font-bold text-primary">{defaultRadius} miles</span></Label>
            <input
              type="range"
              min="1"
              max="100"
              value={defaultRadius}
              onChange={(e) => setDefaultRadius(Number(e.target.value))}
              className="w-full h-2 bg-muted rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>1 mile</span>
              <span>100 miles</span>
            </div>
          </div>

          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={mapCenter}
            zoom={10}
            onClick={handleMapClick}
            onLoad={(map) => { mapRef.current = map; }}
            options={{
              mapTypeId: 'terrain',
              draggable: !isLocked,
              scrollwheel: !isLocked,
              zoomControl: !isLocked,
              disableDoubleClickZoom: isLocked,
              streetViewControl: false,
              fullscreenControl: false,
            }}
          >
            {circles.map((circle, index) => (
              <>
                <Marker
                  key={`marker-${index}`}
                  position={{ lat: circle.center.lat, lng: circle.center.lng }}
                  title={`Circle ${index + 1}`}
                />
                <MapCircle
                  key={`circle-${index}`}
                  center={{ lat: circle.center.lat, lng: circle.center.lng }}
                  radius={circle.radius}
                  options={{
                    fillColor: 'hsl(var(--primary))',
                    fillOpacity: 0.15,
                    strokeWeight: 2,
                    strokeColor: 'hsl(var(--primary))',
                    strokeOpacity: 0.8,
                  }}
                />
              </>
            ))}
          </GoogleMap>

          {circles.length > 0 && (
            <div className="bg-muted p-3 rounded-lg space-y-2">
              <p className="text-sm font-medium">Coverage Areas ({circles.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {circles.map((circle, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span>Circle {index + 1}: {(circle.radius / 1609.34).toFixed(1)} mi</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCircle(index)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
              Cancel
            </Button>
            <Button onClick={handleSaveClick} disabled={circles.length === 0} className="flex-1">
              Save Coverage
            </Button>
          </div>
        </div>
      </div>
    </LoadScript>
  );

  const renderDrawStep = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <Button variant="ghost" size="sm" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
        <h2 className="text-2xl font-bold">Draw Custom Area</h2>
      </div>
      <div className="text-center py-12">
        <p className="text-muted-foreground">Drawing feature coming soon. Please use Cities or Radius for now.</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        {step === 'select' && renderSelectionStep()}
        {step === 'cities' && renderCitiesStep()}
        {step === 'radius' && renderRadiusStep()}
        {step === 'draw' && renderDrawStep()}
      </DialogContent>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name This Coverage Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="coverage-name">Coverage Area Name</Label>
              <Input
                id="coverage-name"
                placeholder="e.g., My Primary Territory"
                value={coverageName}
                onChange={(e) => setCoverageName(e.target.value)}
                maxLength={100}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && coverageName.trim()) {
                    handleSave();
                  }
                }}
              />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setShowNameDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={saving || !coverageName.trim()} className="flex-1">
                {saving ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Dialog>
  );
}
