import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Circle, Pencil, Pentagon, MousePointer, Trash2, Undo, RotateCcw, Download } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import "./map-drawing-tool.css";

interface MapDrawingToolProps {
  onAreaSelected: (coordinates: { lat: number; lng: number }[]) => void;
  apiKey: string;
  onDrawingChange?: (isDrawing: boolean) => void;
  externalDrawing?: boolean;
  onSearchSelect?: (location: { lat: number; lng: number }) => void;
  searchValue?: string;
  searchTrigger?: number;
}

type DrawMode = 'select' | 'freehand' | 'circle' | 'polygon';

interface Shape {
  type: 'polygon' | 'circle';
  instance: google.maps.Polygon | google.maps.Circle;
}

export const MapDrawingTool = ({ onAreaSelected, apiKey, onDrawingChange, externalDrawing, onSearchSelect, searchValue, searchTrigger }: MapDrawingToolProps) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [activeMode, setActiveMode] = useState<DrawMode>("select");
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedShapes, setSelectedShapes] = useState<Shape[]>([]);
  const [history, setHistory] = useState<Shape[]>([]);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);
  
  // Freehand drawing state
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentPath, setCurrentPath] = useState<google.maps.LatLng[]>([]);
  const [polyline, setPolyline] = useState<google.maps.Polyline | null>(null);
  const lastPointRef = useRef<google.maps.LatLng | null>(null);
  
  // Circle/radius state
  const [radiusValue, setRadiusValue] = useState(1000);

  // Initialize map
  useEffect(() => {
    if (!window.google || !mapRef.current) return;

    const mapStyles = [
      { featureType: "all", elementType: "labels", stylers: [{ visibility: "off" }] },
      { featureType: "administrative", elementType: "labels", stylers: [{ visibility: "on" }] },
      { featureType: "road", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "transit", elementType: "all", stylers: [{ visibility: "off" }] },
      { featureType: "water", elementType: "all", stylers: [{ color: "#effefd" }] }
    ];

    const mapInstance = new google.maps.Map(mapRef.current, {
      center: { lat: 37.0902, lng: -95.7129 },
      zoom: 4,
      mapTypeId: "roadmap",
      gestureHandling: "greedy",
      styles: mapStyles,
    });

    setMap(mapInstance);
    geocoderRef.current = new google.maps.Geocoder();

    mapInstance.addListener("click", (e: google.maps.MapMouseEvent) => {
      if (selectedShapes.length > 0 && activeMode === 'select') {
        selectedShapes.forEach(shape => setShapeHighlight(shape, false));
        setSelectedShapes([]);
      }
    });
  }, [selectedShapes, activeMode]);

  // Freehand drawing
  useEffect(() => {
    if (!map) return;

    let moveListener: google.maps.MapsEventListener | null = null;
    let upListener: google.maps.MapsEventListener | null = null;
    const minDistance = 5; // minimum distance in meters between points

    const distanceMeters = (p1: google.maps.LatLng, p2: google.maps.LatLng) =>
      google.maps.geometry.spherical.computeDistanceBetween(p1, p2);

    const startDraw = (e: any) => {
      if (activeMode !== 'freehand') return;
      setIsDrawing(true);
      onDrawingChange?.(true);
      const newPolyline = new google.maps.Polyline({
        map,
        strokeColor: '#FF0000',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        path: [],
      });
      setPolyline(newPolyline);
      setCurrentPath([]);
      lastPointRef.current = null;

      const drawMove = (latLng: google.maps.LatLng) => {
        if (lastPointRef.current && distanceMeters(latLng, lastPointRef.current) < minDistance) return;
        const path = [...currentPath, latLng];
        setCurrentPath(path);
        newPolyline.setPath(path);
        lastPointRef.current = latLng;
      };

      const finishDraw = () => {
        setIsDrawing(false);
        onDrawingChange?.(false);
        if (newPolyline) newPolyline.setMap(null);
        if (currentPath.length === 0) {
          if (moveListener) moveListener.remove();
          if (upListener) upListener.remove();
          moveListener = null;
          upListener = null;
          return;
        }

      const polygon = new google.maps.Polygon({
        map,
        paths: currentPath,
        strokeColor: '#007BFF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#007BFF',
        fillOpacity: 0.25,
        editable: true,
        draggable: false,
      });

      const shape: Shape = { type: 'polygon', instance: polygon };
      
      google.maps.event.addListener(polygon, "click", (evt: any) => {
        evt.stop();
        handleShapeClick(shape);
      });

      setShapes((prev) => [...prev, shape]);
      setHistory((prev) => [...prev, shape]);
        setCurrentPath([]);
        if (moveListener) moveListener.remove();
        if (upListener) upListener.remove();
        moveListener = null;
        upListener = null;
        extractCoordinates();
        toast.success("Shape drawn!");
      };

      moveListener = map.addListener('mousemove', (evt: any) => drawMove(evt.latLng));
      upListener = map.addListener('mouseup', finishDraw);
    };

    map.addListener('mousedown', startDraw);
    map.addListener('touchstart', (e: any) => {
      if (e.touches && e.touches.length > 0) startDraw(e);
    });

    return () => {
      google.maps.event.clearListeners(map, 'mousedown');
      google.maps.event.clearListeners(map, 'touchstart');
      if (moveListener) moveListener.remove();
      if (upListener) upListener.remove();
    };
  }, [map, activeMode, currentPath, onDrawingChange]);

  // Circle/radius drawing
  useEffect(() => {
    if (!map) return;

    const clickListener = map.addListener('click', (e: any) => {
      if (activeMode !== 'circle') return;

      const circle = new google.maps.Circle({
        map,
        center: e.latLng,
        radius: radiusValue,
        strokeColor: '#007BFF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#007BFF',
        fillOpacity: 0.25,
        editable: true,
        draggable: false,
      });

      const shape: Shape = { type: 'circle', instance: circle };
      
      google.maps.event.addListener(circle, "click", (evt: any) => {
        evt.stop();
        handleShapeClick(shape);
      });

      setShapes((prev) => [...prev, shape]);
      setHistory((prev) => [...prev, shape]);
      extractCoordinates();
      toast.success("Circle drawn!");
      setActiveMode("select");
      onDrawingChange?.(false);
    });

    return () => {
      google.maps.event.removeListener(clickListener);
    };
  }, [map, activeMode, radiusValue, onDrawingChange]);

  // Polygon drawing
  useEffect(() => {
    if (!map || activeMode !== 'polygon') return;

    let polygonPath: google.maps.LatLng[] = [];
    let polygonLine: google.maps.Polyline | null = null;
    const listeners: google.maps.MapsEventListener[] = [];

    const clickListener = map.addListener('click', (e: any) => {
      polygonPath.push(e.latLng);
      
      if (!polygonLine) {
        polygonLine = new google.maps.Polyline({
          map,
          path: polygonPath,
          strokeColor: '#FF0000',
          strokeWeight: 2,
        });
      } else {
        polygonLine.setPath(polygonPath);
      }
    });

    const dblClickListener = map.addListener('dblclick', (e: any) => {
      if (polygonPath.length < 3) {
        toast.error("Need at least 3 points for a polygon");
        return;
      }

      if (polygonLine) polygonLine.setMap(null);

      const polygon = new google.maps.Polygon({
        map,
        paths: polygonPath,
        strokeColor: '#007BFF',
        strokeOpacity: 0.8,
        strokeWeight: 2,
        fillColor: '#007BFF',
        fillOpacity: 0.25,
        editable: true,
        draggable: false,
      });

      const shape: Shape = { type: 'polygon', instance: polygon };
      
      google.maps.event.addListener(polygon, "click", (evt: any) => {
        evt.stop();
        handleShapeClick(shape);
      });

      setShapes((prev) => [...prev, shape]);
      setHistory((prev) => [...prev, shape]);
      extractCoordinates();
      toast.success("Polygon drawn!");
      setActiveMode("select");
      onDrawingChange?.(false);
      
      polygonPath = [];
      polygonLine = null;
    });

    listeners.push(clickListener, dblClickListener);

    return () => {
      listeners.forEach(listener => google.maps.event.removeListener(listener));
      if (polygonLine) polygonLine.setMap(null);
    };
  }, [map, activeMode, onDrawingChange]);

  const extractCoordinates = () => {
    const allCoordinates: { lat: number; lng: number }[] = [];
    
    shapes.forEach((shape) => {
      if (shape.type === 'polygon') {
        const path = (shape.instance as google.maps.Polygon).getPath();
        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          allCoordinates.push({ lat: point.lat(), lng: point.lng() });
        }
      } else if (shape.type === 'circle') {
        const center = (shape.instance as google.maps.Circle).getCenter();
        if (center) {
          allCoordinates.push({ lat: center.lat(), lng: center.lng() });
        }
      }
    });
    
    if (allCoordinates.length > 0) {
      onAreaSelected(allCoordinates);
    }
  };

  const handleShapeClick = (shape: Shape) => {
    if (activeMode !== 'select') return;

    const isSelected = selectedShapes.includes(shape);
    if (isSelected) {
      setSelectedShapes(selectedShapes.filter((s) => s !== shape));
      setShapeHighlight(shape, false);
    } else {
      setSelectedShapes([...selectedShapes, shape]);
      setShapeHighlight(shape, true);
    }
  };

  const setShapeHighlight = (shape: Shape, highlight: boolean) => {
    const color = highlight ? '#FF0000' : '#007BFF';
    if (shape.type === 'polygon') {
      (shape.instance as google.maps.Polygon).setOptions({ strokeColor: color });
    } else if (shape.type === 'circle') {
      (shape.instance as google.maps.Circle).setOptions({ strokeColor: color });
    }
  };

  // Drag selected shapes
  useEffect(() => {
    if (!map || selectedShapes.length === 0 || activeMode !== 'select') return;

    let startLatLng: google.maps.LatLng | null = null;
    let dragListener: google.maps.MapsEventListener | null = null;
    let upListener: google.maps.MapsEventListener | null = null;

    const startDrag = (e: any) => {
      if (activeMode !== 'select' || selectedShapes.length === 0) return;
      startLatLng = e.latLng;
      dragListener = map.addListener('mousemove', onDrag);
      upListener = map.addListener('mouseup', stopDrag);
    };

    const onDrag = (e: any) => {
      if (!startLatLng) return;
      const latDiff = e.latLng.lat() - startLatLng.lat();
      const lngDiff = e.latLng.lng() - startLatLng.lng();

      selectedShapes.forEach((shape) => {
        if (shape.type === 'polygon') {
          const paths = (shape.instance as google.maps.Polygon).getPath().getArray();
          const newPaths = paths.map((pt) => new google.maps.LatLng(pt.lat() + latDiff, pt.lng() + lngDiff));
          (shape.instance as google.maps.Polygon).setPath(newPaths);
        } else if (shape.type === 'circle') {
          const center = (shape.instance as google.maps.Circle).getCenter();
          if (center) {
            (shape.instance as google.maps.Circle).setCenter(
              new google.maps.LatLng(center.lat() + latDiff, center.lng() + lngDiff)
            );
          }
        }
      });

      startLatLng = e.latLng;
    };

    const stopDrag = () => {
      if (dragListener) dragListener.remove();
      if (upListener) upListener.remove();
      dragListener = null;
      upListener = null;
      startLatLng = null;
      extractCoordinates();
    };

    const downListener = map.addListener('mousedown', startDrag);

    return () => {
      google.maps.event.removeListener(downListener);
      if (dragListener) dragListener.remove();
      if (upListener) upListener.remove();
    };
  }, [map, selectedShapes, activeMode]);

  const getPolygonCentroid = (polygon: google.maps.Polygon): google.maps.LatLng => {
    const path = polygon.getPath().getArray();
    let lat = 0;
    let lng = 0;
    path.forEach(p => {
      lat += p.lat();
      lng += p.lng();
    });
    return new google.maps.LatLng(lat / path.length, lng / path.length);
  };

  const exportShapesData = async () => {
    if (!map || !geocoderRef.current || shapes.length === 0) {
      toast.error("No shapes to export");
      return;
    }

    toast.info("Exporting shape data...");
    const exportData: any[] = [];

    for (const shape of shapes) {
      let latLng: google.maps.LatLng;
      if (shape.type === 'circle') {
        const center = (shape.instance as google.maps.Circle).getCenter();
        if (!center) continue;
        latLng = center;
      } else if (shape.type === 'polygon') {
        latLng = getPolygonCentroid(shape.instance as google.maps.Polygon);
      } else {
        continue;
      }

      const result = await new Promise<any>((resolve) => {
        geocoderRef.current!.geocode({ location: latLng }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            const comp = results[0].address_components;
            const zip = comp.find(ac => ac.types.includes('postal_code'))?.long_name || '';
            const city = comp.find(ac => ac.types.includes('locality'))?.long_name || '';
            const state = comp.find(ac => ac.types.includes('administrative_area_level_1'))?.short_name || '';
            resolve({ zip, city, state, lat: latLng.lat(), lng: latLng.lng(), type: shape.type });
          } else {
            resolve({ zip: '', city: '', state: '', lat: latLng.lat(), lng: latLng.lng(), type: shape.type });
          }
        });
      });

      exportData.push(result);
    }

    console.log('Exported Shape Data:', exportData);
    
    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'shapes-export.json';
    link.click();
    URL.revokeObjectURL(url);
    
    toast.success(`Exported ${exportData.length} shapes`);
  };
  
  // Handle search from parent component
  useEffect(() => {
    if (searchTrigger && searchTrigger > 0 && searchValue && searchValue.trim() && map) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ address: searchValue }, (results, status) => {
        if (status === "OK" && results && results[0]) {
          const location = results[0].geometry.location;
          
          // Zoom to show approximately 50 mile radius (zoom level 9-10)
          map.setCenter(location);
          map.setZoom(9);
          
          new google.maps.Marker({
            position: location,
            map: map,
            title: searchValue,
            animation: google.maps.Animation.DROP,
          });

          onSearchSelect?.({ lat: location.lat(), lng: location.lng() });
          toast.success(`Zoomed to ${searchValue} (~50 mile view)`);
        } else {
          toast.error("Location not found. Please try a different search.");
        }
      });
    }
  }, [searchTrigger, searchValue, map]);

  const setMode = (mode: DrawMode) => {
    setActiveMode(mode);
    onDrawingChange?.(mode !== "select");
  };

  // Update cursor class based on mode
  useEffect(() => {
    if (!mapRef.current) return;
    
    mapRef.current.classList.remove('map-freehand', 'map-select', 'map-circle', 'map-polygon');
    
    if (activeMode === 'freehand') mapRef.current.classList.add('map-freehand');
    if (activeMode === 'select') mapRef.current.classList.add('map-select');
    if (activeMode === 'circle') mapRef.current.classList.add('map-circle');
    if (activeMode === 'polygon') mapRef.current.classList.add('map-polygon');
  }, [activeMode]);

  const clearAll = () => {
    shapes.forEach((shape) => shape.instance.setMap(null));
    setShapes([]);
    setHistory([]);
    setSelectedShapes([]);
    onAreaSelected([]);
    toast.info("All drawings cleared");
  };

  const deleteSelected = () => {
    if (selectedShapes.length === 0) {
      toast.error("No shapes selected");
      return;
    }
    selectedShapes.forEach((shape) => shape.instance.setMap(null));
    setShapes((prev) => prev.filter((s) => !selectedShapes.includes(s)));
    setHistory((prev) => prev.filter((s) => !selectedShapes.includes(s)));
    setSelectedShapes([]);
    extractCoordinates();
    toast.info(`Deleted ${selectedShapes.length} shape(s)`);
  };

  const undo = () => {
    if (history.length === 0) {
      toast.error("Nothing to undo");
      return;
    }
    const lastShape = history[history.length - 1];
    lastShape.instance.setMap(null);
    setShapes((prev) => prev.filter((s) => s !== lastShape));
    setHistory((prev) => prev.slice(0, -1));
    setSelectedShapes((prev) => prev.filter((s) => s !== lastShape));
    extractCoordinates();
    toast.info("Last action undone");
  };

  const undoLastPoint = () => {
    if (currentPath.length > 0) {
      const newPath = currentPath.slice(0, -1);
      setCurrentPath(newPath);
      if (polyline) polyline.setPath(newPath);
      toast.info("Removed last point");
    } else {
      toast.error("No points to undo");
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <div className="absolute top-3 left-3 z-10 flex gap-2 flex-wrap">
          <div className="flex gap-1 bg-background/95 backdrop-blur p-1 rounded-lg shadow-lg border">
            <Button
              type="button"
              size="sm"
              variant={activeMode === "freehand" ? "default" : "outline"}
              onClick={() => setMode("freehand")}
              title="Freehand Draw"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeMode === "circle" ? "default" : "outline"}
              onClick={() => setMode("circle")}
              title="Circle"
            >
              <Circle className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant={activeMode === "polygon" ? "default" : "outline"}
              onClick={() => setMode("polygon")}
              title="Polygon"
            >
              <Pentagon className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="flex gap-1 bg-background/95 backdrop-blur p-1 rounded-lg shadow-lg border">
            <Button
              type="button"
              size="sm"
              variant={activeMode === "select" ? "default" : "outline"}
              onClick={() => setMode("select")}
              title="Select"
            >
              <MousePointer className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={deleteSelected}
              title="Delete Selected"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={undo}
              title="Undo Last Shape"
            >
              <Undo className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={clearAll}
              title="Clear All"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>

          {activeMode === 'freehand' && isDrawing && (
            <div className="bg-background/95 backdrop-blur p-1 rounded-lg shadow-lg border">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={undoLastPoint}
                title="Undo Last Point"
              >
                <Undo className="h-4 w-4 mr-1" />
                Point
              </Button>
            </div>
          )}
          
          {shapes.length > 0 && (
            <div className="bg-background/95 backdrop-blur p-1 rounded-lg shadow-lg border">
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={exportShapesData}
                title="Export Shape Data"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          )}
          
          {activeMode === "circle" && (
            <div className="bg-background/95 backdrop-blur p-2 rounded-lg shadow-lg border">
              <Label className="text-xs mb-1 block">Radius: {radiusValue}m</Label>
              <Slider
                value={[radiusValue]}
                onValueChange={(value) => setRadiusValue(value[0])}
                min={100}
                max={5000}
                step={100}
                className="w-32"
              />
            </div>
          )}
        </div>
        
        <div
          ref={mapRef} 
          className="w-full h-[500px] rounded-lg border"
        />
      </div>
      
      <p className="text-sm text-muted-foreground">
        {activeMode === "freehand" && "Click and drag to draw a freehand shape. Click 'Undo Point' to remove the last point while drawing."}
        {activeMode === "circle" && "Click on the map to place a circle. Adjust radius with the slider."}
        {activeMode === "polygon" && "Click to add points. Double-click to complete the polygon."}
      </p>
      {selectedShapes.length > 0 && (
        <p className="text-sm font-medium text-primary">
          {selectedShapes.length} shape(s) selected
        </p>
      )}
    </div>
  );
};
