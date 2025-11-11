import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { GoogleMap, LoadScript, Circle, Autocomplete, Marker } from "@react-google-maps/api";
import { Trash2, Search, ZoomIn, ZoomOut, Lock, Unlock, MapPin } from "lucide-react";
import { z } from "zod";
import { useGoogleMapsApiKey } from "@/hooks/useGoogleMapsApiKey";

const libraries: ("places")[] = ["places"];

const radiusCircleSchema = z.object({
  center: z.object({
    lat: z.number(),
    lng: z.number(),
  }),
  radius: z.number().min(1000).max(200000),
});

const coverageSchema = z.object({
  name: z.string().trim().min(1, "Coverage name is required").max(100),
  circles: z.array(radiusCircleSchema).min(1, "Add at least one radius circle"),
});

type RadiusCircle = z.infer<typeof radiusCircleSchema>;

const MarketCoverageRadius = () => {
  const navigate = useNavigate();
  const { apiKey, loading: apiKeyLoading } = useGoogleMapsApiKey();
  const [coverageName, setCoverageName] = useState("");
  const [circles, setCircles] = useState<RadiusCircle[]>([]);
  const [saving, setSaving] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tutorialStep, setTutorialStep] = useState(1);
  const [defaultRadius, setDefaultRadius] = useState(16); // in miles (converted from 10 miles)
  // Default to San Diego
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>({ lat: 32.7157, lng: -117.1611 });
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [loadingLocation, setLoadingLocation] = useState(false);
  const mapRef = useRef<google.maps.Map | null>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const locationAutocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  const mapContainerStyle = {
    width: '100%',
    height: '100vh',
  };

  // Optional: Fetch user's license state to update map center, but don't block on it
  useEffect(() => {
    const fetchUserLocation = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: agent } = await supabase
          .from("pros")
          .select("state_license")
          .eq("user_id", user.id)
          .single();

        if (agent?.state_license && window.google?.maps) {
          // Geocode the state to get coordinates
          const geocoder = new google.maps.Geocoder();
          geocoder.geocode({ address: agent.state_license + ", USA" }, (results, status) => {
            if (status === "OK" && results && results[0]) {
              const location = results[0].geometry.location;
              setMapCenter({ lat: location.lat(), lng: location.lng() });
            }
          });
        }
      } catch (error) {
        console.error("Error fetching user location:", error);
      }
    };

    if (window.google?.maps) {
      fetchUserLocation();
    }
  }, []);

  const handleLocationSubmit = () => {
    if (locationAutocompleteRef.current) {
      const place = locationAutocompleteRef.current.getPlace();
      if (place.geometry?.location) {
        setMapCenter({ lat: place.geometry.location.lat(), lng: place.geometry.location.lng() });
        setShowLocationPrompt(false);
        setShowTutorial(true);
      } else {
        toast.error("Please select a valid location");
      }
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (e.latLng) {
      const newCircle: RadiusCircle = {
        center: {
          lat: e.latLng.lat(),
          lng: e.latLng.lng(),
        },
        radius: defaultRadius * 1609.34, // Convert miles to meters
      };
      setCircles([...circles, newCircle]);

      // Dismiss tutorial when circle is placed
      if (tutorialStep === 2) {
        setTimeout(() => setShowTutorial(false), 1500);
      }
    }
  };

  const handleZoomIn = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 4;
      mapRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = () => {
    if (mapRef.current) {
      const currentZoom = mapRef.current.getZoom() || 4;
      mapRef.current.setZoom(currentZoom - 1);
    }
  };

  const toggleLock = () => {
    const newLockState = !isLocked;
    setIsLocked(newLockState);

    // Advance tutorial when map is locked for the first time
    if (newLockState && tutorialStep === 1) {
      setTutorialStep(2);
    }
  };

  const removeCircle = (index: number) => {
    setCircles(circles.filter((_, i) => i !== index));
  };

  const onPlaceChanged = () => {
    if (autocompleteRef.current) {
      const place = autocompleteRef.current.getPlace();
      if (place.geometry?.location && mapRef.current) {
        mapRef.current.panTo(place.geometry.location);
        mapRef.current.setZoom(12);
      }
    }
  };

  const handleSaveClick = () => {
    if (circles.length === 0) {
      toast.error("Add at least one radius circle");
      return;
    }
    setShowNameDialog(true);
  };

  const handleSave = async () => {
    try {
      const validated = coverageSchema.parse({
        name: coverageName,
        circles,
      });

      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save");
        return;
      }

      // Geocode the circles to get zip codes, cities, states, and counties
      const zipRadiuses = validated.circles.map(circle => ({
        zip: `${circle.center.lat},${circle.center.lng}`,
        radius: circle.radius / 1609.34 // Convert meters to miles
      }));

      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-area', {
        body: {
          method: 'zip',
          zipRadiuses,
          coordinates: validated.circles.map(c => c.center)
        }
      });

      if (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        toast.error("Failed to geocode coverage area");
        return;
      }

      const { error } = await supabase
        .from("market_coverage")
        .insert({
          user_id: user.id,
          coverage_type: "radius",
          name: validated.name,
          data: { 
            circles: validated.circles,
            zipCodes: geocodeData?.zipCodes || [],
            cities: geocodeData?.cities || [],
            states: geocodeData?.states || [],
            counties: geocodeData?.counties || [],
            coordinates: geocodeData?.coordinates || []
          },
        });

      if (error) throw error;

      // Mark market coverage as completed
      await supabase
        .from("pros")
        .update({ market_coverage_completed: true })
        .eq("user_id", user.id);

      toast.success("Market coverage saved!");
      setShowNameDialog(false);
      navigate("/agents/map");
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
      } else {
        toast.error("Failed to save market coverage");
      }
    } finally {
      setSaving(false);
    }
  };


  if (apiKeyLoading || !apiKey) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative w-full h-screen bg-gray-100">
      <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
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
            fullscreenControl: true,
            mapTypeControl: true,
            mapTypeControlOptions: {
              style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
              position: google.maps.ControlPosition.TOP_RIGHT,
              mapTypeIds: ['terrain', 'satellite', 'roadmap']
            },
          }}
        >
          {circles.map((circle, index) => (
            <>
              <Marker
                key={`marker-${index}`}
                position={{ lat: circle.center.lat, lng: circle.center.lng }}
                title={`Circle ${index + 1}`}
              />
              <Circle
                key={`circle-${index}`}
                center={{ lat: circle.center.lat, lng: circle.center.lng }}
                radius={circle.radius}
                options={{
                  fillColor: '#35a87e',
                  fillOpacity: 0.15,
                  strokeWeight: 2,
                  strokeColor: '#35a87e',
                  strokeOpacity: 0.8,
                  editable: false,
                  draggable: false,
                }}
              />
            </>
          ))}
        </GoogleMap>

        {/* Control Panel */}
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-4 w-80 space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-bold text-gray-800">Coverage Map</h1>
            <button
              onClick={toggleLock}
              className={`p-2 rounded-lg transition-colors ${
                isLocked 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'text-white hover:opacity-90'
              }`}
              style={!isLocked ? { backgroundColor: '#35a87e' } : {}}
              title={isLocked ? 'Unlock Map' : 'Lock Map'}
            >
              {isLocked ? <Lock size={20} /> : <Unlock size={20} />}
            </button>
          </div>

          {/* Search Input */}
          <Autocomplete
            onLoad={(autocomplete) => { autocompleteRef.current = autocomplete; }}
            onPlaceChanged={onPlaceChanged}
          >
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <Input
                placeholder="Search for a location..."
                className="pl-10"
              />
            </div>
          </Autocomplete>

          {/* Instructions */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-3" style={{ backgroundColor: '#f0f5f2', borderColor: '#b3ccb8' }}>
            <p className="text-sm font-medium flex items-start gap-2" style={{ color: '#35a87e' }}>
              <MapPin size={16} className="mt-0.5 flex-shrink-0" />
              <span>Click on the map to drop a pin and draw a circle</span>
            </p>
          </div>

          {/* Radius Slider */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Circle Radius: <span className="text-green-700 font-bold">{defaultRadius} miles</span>
            </label>
            
            {/* Custom Animated Slider */}
            <div className="relative pt-8 pb-4">
              <input
                type="range"
                min="1"
                max="100"
                value={defaultRadius}
                onChange={(e) => setDefaultRadius(Number(e.target.value))}
                className="slider-input"
                style={{
                  width: '100%',
                  height: '8px',
                  background: `linear-gradient(to right, #35a87e 0%, #35a87e ${defaultRadius}%, #b3ccb8 ${defaultRadius}%, #b3ccb8 100%)`,
                  borderRadius: '10px',
                  outline: 'none',
                  appearance: 'none',
                  WebkitAppearance: 'none',
                  cursor: 'pointer',
                  position: 'relative'
                }}
              />
              
              {/* Animated value display */}
              <div 
                className="absolute top-0 transform -translate-x-1/2 transition-all duration-300 ease-out"
                style={{
                  left: `${defaultRadius}%`,
                }}
              >
                <div className="relative">
                  <div 
                    className="px-3 py-1 rounded-full text-white text-xs font-bold shadow-lg transform hover:scale-110 transition-transform"
                    style={{
                      background: 'linear-gradient(135deg, #35a87e 0%, #3a6b4f 100%)',
                    }}
                  >
                    {defaultRadius}
                  </div>
                  {/* Arrow pointer */}
                  <div 
                    className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0"
                    style={{
                      borderLeft: '6px solid transparent',
                      borderRight: '6px solid transparent',
                      borderTop: '6px solid #3a6b4f',
                      top: '100%'
                    }}
                  />
                </div>
              </div>

              <style>{`
                .slider-input::-webkit-slider-thumb {
                  -webkit-appearance: none;
                  appearance: none;
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: #35a87e;
                  cursor: pointer;
                  box-shadow: 0 2px 6px rgba(80, 134, 102, 0.4);
                  transition: all 0.2s ease;
                  border: 3px solid white;
                }

                .slider-input::-webkit-slider-thumb:hover {
                  transform: scale(1.2);
                  box-shadow: 0 3px 8px rgba(80, 134, 102, 0.6);
                }

                .slider-input::-webkit-slider-thumb:active {
                  transform: scale(1.1);
                }

                .slider-input::-moz-range-thumb {
                  width: 24px;
                  height: 24px;
                  border-radius: 50%;
                  background: #35a87e;
                  cursor: pointer;
                  box-shadow: 0 2px 6px rgba(53, 168, 126, 0.4);
                  transition: all 0.2s ease;
                  border: 3px solid white;
                }

                .slider-input::-moz-range-thumb:hover {
                  transform: scale(1.2);
                  box-shadow: 0 3px 8px rgba(80, 134, 102, 0.6);
                }

                .slider-input::-moz-range-thumb:active {
                  transform: scale(1.1);
                }
              `}</style>
            </div>
            
            <div className="flex justify-between text-xs text-gray-500">
              <span>1 mile</span>
              <span>100 miles</span>
            </div>
          </div>

          {/* Lock Status */}
          {isLocked && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-sm text-red-800 font-medium flex items-center gap-2">
                <Lock size={16} />
                Map is locked - Click on map to place pin
              </p>
            </div>
          )}

          {/* Circles List */}
          {circles.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-medium text-gray-600">Coverage Areas ({circles.length})</p>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {circles.map((circle, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-800">Circle {index + 1}: {(circle.radius / 1609.34).toFixed(1)} mi</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeCircle(index)}
                      className="h-6 w-6 p-0"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
              Cancel
            </Button>
            <Button 
              onClick={handleSaveClick} 
              disabled={circles.length === 0} 
              className="flex-1"
              style={{ backgroundColor: '#35a87e', color: 'white' }}
            >
              Save
            </Button>
          </div>
        </div>

        {/* Tutorial Overlay */}
        {showTutorial && (
          <div className="absolute inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 transition-opacity duration-300">
            <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-4 transform transition-all duration-300 scale-100">
              {/* Step 1: Lock Map */}
              {tutorialStep === 1 && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full" style={{ backgroundColor: '#b3ccb8' }}>
                    <Lock style={{ color: '#35a87e' }} size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Step 1: Lock Map Here</h2>
                    <p className="text-gray-600">
                      First, position the map where you want to place your pin. Then click the <strong>Lock button</strong> in the top left corner to prevent the map from moving while you work.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: '#35a87e' }}></div>
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  </div>
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Skip tutorial
                  </button>
                </div>
              )}

              {/* Step 2: Draw Radius */}
              {tutorialStep === 2 && (
                <div className="text-center space-y-6">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full">
                    <MapPin className="text-green-600" size={32} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Step 2: Draw Your Radius</h2>
                    <p className="text-gray-600">
                      Great! Now <strong>click anywhere on the map</strong> to drop a pin. A circle will automatically appear. Use the slider to adjust the radius from 1-100 miles.
                    </p>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                    <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                  </div>
                  <button
                    onClick={() => setShowTutorial(false)}
                    className="text-sm text-gray-500 hover:text-gray-700 underline"
                  >
                    Skip tutorial
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </LoadScript>

      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Name This Coverage Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="dialog-name">Coverage Area Name</Label>
              <Input
                id="dialog-name"
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
    </div>
  );
};

export default MarketCoverageRadius;
