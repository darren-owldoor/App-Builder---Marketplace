import { useEffect, useState, useRef } from "react";
import { GoogleMap, LoadScript, Marker, Circle, DrawingManager } from '@react-google-maps/api';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Circle as CircleIcon, Pencil, Trash2 } from 'lucide-react';

// Geocoding cache
const geocodeCache: Record<string, { lat: number; lng: number }> = {};

interface Agent {
  id: string;
  full_name: string;
  cities?: string[] | null;
  states?: string[] | null;
  zip_codes?: string[] | null;
  counties?: string[] | null;
  city: string | null;
  state: string | null;
  pipeline_stage?: string;
  status?: string;
}

interface AgentMapViewProps {
  agents: Agent[];
  onAgentClick?: (agent: Agent) => void;
  onSave?: (data: { polygons: any[]; circles: any[] }) => void;
  showSaveButton?: boolean;
}

const libraries: ("drawing" | "places")[] = ["drawing"];

type DrawingMode = "polygon" | null;

const AgentMapView = ({ agents, onAgentClick, onSave, showSaveButton = false }: AgentMapViewProps) => {
  const [loading, setLoading] = useState(true);
  const [markers, setMarkers] = useState<Array<{ lat: number; lng: number; agent: Agent }>>([]);
  const [filteredMarkers, setFilteredMarkers] = useState<Array<{ lat: number; lng: number; agent: Agent }>>([]);
  const [drawingMode, setDrawingMode] = useState<DrawingMode>(null);
  const [radiusCircle, setRadiusCircle] = useState<{ lat: number; lng: number; radius: number } | null>(null);
  const [drawnShapes, setDrawnShapes] = useState<any[]>([]);
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
  const mapRef = useRef<google.maps.Map | null>(null);

  const mapContainerStyle = {
    width: '100%',
    height: '600px',
  };

  const center = {
    lat: 39.8283,
    lng: -98.5795,
  };

  // Preprocess addresses
  const preprocessAddress = (agent: Agent) => {
    const addressParts = [];
    if (agent.cities?.[0]) addressParts.push(agent.cities[0]);
    else if (agent.city) addressParts.push(agent.city);

    if (agent.states?.[0]) addressParts.push(agent.states[0]);
    else if (agent.state) addressParts.push(agent.state);

    if (agent.zip_codes?.[0]) addressParts.push(agent.zip_codes[0]);

    return addressParts.length > 0 ? `${addressParts.join(', ')}, USA` : null;
  };

  // Load cache from localStorage on mount
  useEffect(() => {
    const cachedData = localStorage.getItem('geocodeCache');
    if (cachedData) Object.assign(geocodeCache, JSON.parse(cachedData));

    return () => {
      localStorage.setItem('geocodeCache', JSON.stringify(geocodeCache));
    };
  }, []);

  // Geocode agents with caching
  useEffect(() => {
    const geocodeAgents = async () => {
      setLoading(true);
      const newMarkers: Array<{ lat: number; lng: number; agent: Agent }> = [];

      for (const agent of agents.slice(0, 100)) {
        const address = preprocessAddress(agent);
        if (!address) continue;

        // Check cache
        if (geocodeCache[address]) {
          newMarkers.push({ lat: geocodeCache[address].lat, lng: geocodeCache[address].lng, agent });
          continue;
        }

        try {
          const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`
          );
          const data = await response.json();

          if (data.results?.[0]) {
            const { lat, lng } = data.results[0].geometry.location;
            geocodeCache[address] = { lat, lng }; // cache it
            newMarkers.push({ lat, lng, agent });
          }

          await new Promise((resolve) => setTimeout(resolve, 50)); // smaller delay for speed
        } catch (error) {
          console.error(`Error geocoding ${agent.full_name}:`, error);
        }
      }

      setMarkers(newMarkers);
      setFilteredMarkers(newMarkers);
      setLoading(false);
    };

    geocodeAgents();
  }, [agents, apiKey]);

  // Display all markers (removed search/filter functionality)
  useEffect(() => {
    setFilteredMarkers(markers);
  }, [markers]);

  const handleDrawingComplete = (shape: google.maps.MVCObject) => {
    setDrawnShapes(prev => [...prev, shape]);
  };

  const handleClearDrawings = () => {
    drawnShapes.forEach(shape => {
      if ('setMap' in shape && typeof shape.setMap === 'function') {
        shape.setMap(null);
      }
    });
    setDrawnShapes([]);
    setRadiusCircle(null);
  };

  const handleAddRadiusCircle = () => {
    if (mapRef.current) {
      const center = mapRef.current.getCenter();
      if (center) {
        setRadiusCircle({
          lat: center.lat(),
          lng: center.lng(),
          radius: 50000, // 50km default
        });
      }
    }
  };

  const handleSave = () => {
    const polygons = drawnShapes.map(shape => {
      if ('getPath' in shape && typeof shape.getPath === 'function') {
        const path = shape.getPath();
        const coordinates: Array<{ lat: number; lng: number }> = [];
        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          coordinates.push({ lat: point.lat(), lng: point.lng() });
        }
        return coordinates;
      }
      return null;
    }).filter(Boolean);

    const circles = radiusCircle ? [{
      lat: radiusCircle.lat,
      lng: radiusCircle.lng,
      radius: radiusCircle.radius
    }] : [];

    onSave?.({ polygons, circles });
  };

  if (loading) {
    return (
      <div className="h-[600px] rounded-lg border bg-card flex items-center justify-center">
        <div className="flex items-center gap-2">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm text-muted-foreground">Loading map...</p>
        </div>
      </div>
    );
  }

  if (!apiKey) {
    return (
      <div className="h-[600px] rounded-lg border bg-card flex items-center justify-center p-6">
        <p className="text-sm text-muted-foreground">Google Maps API key not configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <div className="flex gap-2 flex-wrap items-center justify-between">
          <div className="flex gap-2 flex-wrap">
            <Button
              variant={drawingMode === "polygon" ? "default" : "outline"}
              size="sm"
              onClick={() => setDrawingMode(drawingMode === "polygon" ? null : "polygon")}
            >
              <Pencil className="h-4 w-4 mr-2" />
              Draw Area
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleAddRadiusCircle}
            >
              <CircleIcon className="h-4 w-4 mr-2" />
              Add Radius
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearDrawings}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Clear All
            </Button>
          </div>
          {showSaveButton && (
            <Button
              variant="default"
              size="sm"
              onClick={handleSave}
              disabled={drawnShapes.length === 0 && !radiusCircle}
            >
              Save Coverage Area
            </Button>
          )}
        </div>
      </Card>

      <div className="h-[600px] rounded-lg border border-border overflow-hidden">
        <LoadScript googleMapsApiKey={apiKey} libraries={libraries}>
          <GoogleMap
            mapContainerStyle={mapContainerStyle}
            center={center}
            zoom={4}
            onLoad={(map) => { mapRef.current = map; }}
          >
            {filteredMarkers.map((marker, index) => (
              <Marker
                key={index}
                position={{ lat: marker.lat, lng: marker.lng }}
                title={marker.agent.full_name}
                onClick={() => onAgentClick?.(marker.agent)}
              />
            ))}
            
            {drawingMode === "polygon" && (
              <DrawingManager
                drawingMode={google.maps.drawing.OverlayType.POLYGON}
                onPolygonComplete={(polygon) => {
                  handleDrawingComplete(polygon);
                  setDrawingMode(null);
                }}
                options={{
                  drawingControl: false,
                  polygonOptions: {
                    fillColor: '#2196F3',
                    fillOpacity: 0.3,
                    strokeWeight: 2,
                    strokeColor: '#2196F3',
                    editable: true,
                    draggable: true,
                  },
                }}
              />
            )}

            {radiusCircle && (
              <Circle
                center={{ lat: radiusCircle.lat, lng: radiusCircle.lng }}
                radius={radiusCircle.radius}
                options={{
                  fillColor: '#FF5722',
                  fillOpacity: 0.2,
                  strokeWeight: 2,
                  strokeColor: '#FF5722',
                  editable: true,
                  draggable: true,
                }}
              />
            )}
          </GoogleMap>
        </LoadScript>
      </div>
    </div>
  );
};

export default AgentMapView;
