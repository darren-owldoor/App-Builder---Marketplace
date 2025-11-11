import { useState, useRef, useCallback } from "react";
import { GoogleMap, LoadScript, Circle, Marker, Autocomplete } from "@react-google-maps/api";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MapPin, Plus, Trash2, Navigation, Circle as CircleIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CoverageArea {
  id: string;
  type: 'zip' | 'radius' | 'city';
  name: string;
  data: any;
  color: string;
}

interface ProCoverageManagerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  proId: string;
  onSave?: () => void;
}

const libraries: ("places" | "geometry")[] = ["places", "geometry"];
const colors = ["#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

export function ProCoverageManager({ open, onOpenChange, proId, onSave }: ProCoverageManagerProps) {
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);
  const [activeTab, setActiveTab] = useState("zip");
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapZoom, setMapZoom] = useState(10);
  const [loading, setLoading] = useState(false);
  
  // Zip entry
  const [zipInput, setZipInput] = useState("");
  
  // City entry
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  
  // Radius entry
  const [radiusCenter, setRadiusCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusDistance, setRadiusDistance] = useState("25");
  const [radiusAddress, setRadiusAddress] = useState("");
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  const handleAddZipCode = async () => {
    if (!zipInput.trim() || !geocoderRef.current) {
      toast.error("Enter a valid ZIP code");
      return;
    }

    geocoderRef.current.geocode({ address: zipInput }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;

        const newArea: CoverageArea = {
          id: `zip-${Date.now()}`,
          type: 'zip',
          name: zipInput,
          data: {
            zip: zipInput,
            center: { lat: location.lat(), lng: location.lng() },
          },
          color: colors[coverageAreas.length % colors.length],
        };

        setCoverageAreas([...coverageAreas, newArea]);
        setZipInput("");
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setMapZoom(12);
        toast.success(`ZIP ${zipInput} added`);
      } else {
        toast.error("Invalid ZIP code");
      }
    });
  };

  const handleAddCity = async () => {
    if (!cityInput.trim() || !stateInput || !geocoderRef.current) {
      toast.error("Enter city and state");
      return;
    }

    const address = `${cityInput}, ${stateInput}, USA`;
    
    geocoderRef.current.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;

        const newArea: CoverageArea = {
          id: `city-${Date.now()}`,
          type: 'city',
          name: `${cityInput}, ${stateInput}`,
          data: {
            city: cityInput,
            state: stateInput,
            center: { lat: location.lat(), lng: location.lng() },
          },
          color: colors[coverageAreas.length % colors.length],
        };

        setCoverageAreas([...coverageAreas, newArea]);
        setCityInput("");
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setMapZoom(11);
        toast.success(`${cityInput}, ${stateInput} added`);
      } else {
        toast.error("Invalid city");
      }
    });
  };

  const handleAddressSearch = async () => {
    if (!radiusAddress.trim() || !geocoderRef.current) return;

    geocoderRef.current.geocode({ address: radiusAddress }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setRadiusCenter({ lat: location.lat(), lng: location.lng() });
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setMapZoom(10);
      } else {
        toast.error("Address not found");
      }
    });
  };

  const handleAddRadius = () => {
    if (!radiusCenter) {
      toast.error("Select a location first");
      return;
    }

    const radiusMiles = parseFloat(radiusDistance);
    if (isNaN(radiusMiles) || radiusMiles <= 0) {
      toast.error("Invalid radius");
      return;
    }

    const newArea: CoverageArea = {
      id: `radius-${Date.now()}`,
      type: 'radius',
      name: `${radiusMiles} mile radius`,
      data: {
        center: radiusCenter,
        radius: radiusMiles,
        radiusMeters: radiusMiles * 1609.34,
      },
      color: colors[coverageAreas.length % colors.length],
    };

    setCoverageAreas([...coverageAreas, newArea]);
    setRadiusCenter(null);
    setRadiusAddress("");
    toast.success(`${radiusMiles} mile radius added`);
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (activeTab === 'radius' && e.latLng) {
      setRadiusCenter({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  };

  const handleRemoveArea = (id: string) => {
    setCoverageAreas(coverageAreas.filter(area => area.id !== id));
    toast.success("Area removed");
  };

  const handleSave = async () => {
    if (coverageAreas.length === 0) {
      toast.error("Add at least one coverage area");
      return;
    }

    setLoading(true);
    try {
      // Get current coverage areas
      const { data: proData } = await supabase
        .from('pros')
        .select('coverage_areas')
        .eq('id', proId)
        .single();

      let existingAreas = [];
      if (proData?.coverage_areas && Array.isArray(proData.coverage_areas)) {
        existingAreas = proData.coverage_areas;
      }

      // Merge with new areas
      const allAreas = [...existingAreas, ...coverageAreas.map(area => ({
        type: area.type,
        name: area.name,
        data: area.data,
      }))];

      // Update pros table
      const { error } = await supabase
        .from('pros')
        .update({ coverage_areas: allAreas })
        .eq('id', proId);

      if (error) throw error;

      toast.success(`Added ${coverageAreas.length} coverage area(s)`);
      onOpenChange(false);
      setCoverageAreas([]);
      if (onSave) onSave();
    } catch (error) {
      console.error('Error saving coverage:', error);
      toast.error("Failed to save coverage");
    } finally {
      setLoading(false);
    }
  };

  const mapContainerStyle = {
    width: '100%',
    height: '400px',
    borderRadius: '12px',
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Coverage Areas</DialogTitle>
          <DialogDescription>
            Add cities, ZIP codes, or radius circles to define your service area
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Left - Coverage List & Controls */}
          <div className="space-y-4">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="zip">ZIP</TabsTrigger>
                <TabsTrigger value="city">City</TabsTrigger>
                <TabsTrigger value="radius">Radius</TabsTrigger>
              </TabsList>

              <TabsContent value="zip" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter ZIP code"
                    value={zipInput}
                    onChange={(e) => setZipInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddZipCode()}
                    maxLength={5}
                  />
                  <Button onClick={handleAddZipCode} size="sm">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="city" className="space-y-3">
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    placeholder="City"
                    value={cityInput}
                    onChange={(e) => setCityInput(e.target.value)}
                    className="col-span-2"
                  />
                  <Select value={stateInput} onValueChange={setStateInput}>
                    <SelectTrigger>
                      <SelectValue placeholder="State" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button onClick={handleAddCity} size="sm" className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Add City
                </Button>
              </TabsContent>

              <TabsContent value="radius" className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter address"
                    value={radiusAddress}
                    onChange={(e) => setRadiusAddress(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                  />
                  <Button onClick={handleAddressSearch} size="sm" variant="outline">
                    <Navigation className="w-4 h-4" />
                  </Button>
                </div>
                <Select value={radiusDistance} onValueChange={setRadiusDistance}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5 miles</SelectItem>
                    <SelectItem value="10">10 miles</SelectItem>
                    <SelectItem value="25">25 miles</SelectItem>
                    <SelectItem value="50">50 miles</SelectItem>
                    <SelectItem value="100">100 miles</SelectItem>
                  </SelectContent>
                </Select>
                <Button
                  onClick={handleAddRadius}
                  disabled={!radiusCenter}
                  size="sm"
                  className="w-full"
                >
                  <CircleIcon className="w-4 h-4 mr-2" />
                  Add Radius
                </Button>
              </TabsContent>
            </Tabs>

            {coverageAreas.length > 0 && (
              <Card>
                <CardContent className="p-4 space-y-2">
                  <Label className="text-sm font-semibold">
                    Coverage Areas ({coverageAreas.length})
                  </Label>
                  {coverageAreas.map((area) => (
                    <div
                      key={area.id}
                      className="flex items-center justify-between p-2 border rounded"
                    >
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: area.color }}
                        />
                        <span className="text-sm">{area.name}</span>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveArea(area.id)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right - Map */}
          <div>
            <LoadScript
              googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
              libraries={libraries}
            >
              <GoogleMap
                mapContainerStyle={mapContainerStyle}
                center={mapCenter}
                zoom={mapZoom}
                onLoad={onMapLoad}
                onClick={handleMapClick}
                options={{
                  streetViewControl: false,
                  mapTypeControl: false,
                  fullscreenControl: false,
                }}
              >
                {coverageAreas
                  .filter(area => area.type === 'zip' || area.type === 'city')
                  .map((area) => (
                    <Marker
                      key={area.id}
                      position={area.data.center}
                      icon={{
                        path: google.maps.SymbolPath.CIRCLE,
                        fillColor: area.color,
                        fillOpacity: 0.6,
                        strokeColor: area.color,
                        strokeWeight: 2,
                        scale: 8,
                      }}
                    />
                  ))}

                {coverageAreas
                  .filter(area => area.type === 'radius')
                  .map((area) => (
                    <Circle
                      key={area.id}
                      center={area.data.center}
                      radius={area.data.radiusMeters}
                      options={{
                        fillColor: area.color,
                        fillOpacity: 0.2,
                        strokeColor: area.color,
                        strokeWeight: 2,
                      }}
                    />
                  ))}

                {radiusCenter && activeTab === 'radius' && (
                  <Circle
                    center={radiusCenter}
                    radius={parseFloat(radiusDistance) * 1609.34}
                    options={{
                      fillColor: "#3b82f6",
                      fillOpacity: 0.2,
                      strokeColor: "#3b82f6",
                      strokeWeight: 2,
                    }}
                  />
                )}
              </GoogleMap>
            </LoadScript>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              onOpenChange(false);
              setCoverageAreas([]);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={coverageAreas.length === 0 || loading}
          >
            {loading ? 'Saving...' : `Save ${coverageAreas.length} Area(s)`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
