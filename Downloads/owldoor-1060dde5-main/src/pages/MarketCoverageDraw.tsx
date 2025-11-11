import { useState, useCallback, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, Square, Hand, Undo, Download, Lock, Unlock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const MarketCoverageDraw = () => {
  const navigate = useNavigate();
  const [mapLoaded, setMapLoaded] = useState(false);
  const [drawingMode, setDrawingMode] = useState<'polygon' | 'rectangle' | null>(null);
  const [shapes, setShapes] = useState<(google.maps.Polygon | google.maps.Rectangle)[]>([]);
  const [selectedShape, setSelectedShape] = useState<google.maps.Polygon | google.maps.Rectangle | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [totalArea, setTotalArea] = useState(0);
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [coverageName, setCoverageName] = useState('');
  const [saving, setSaving] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const drawingManagerRef = useRef<google.maps.drawing.DrawingManager | null>(null);
  const shapesRef = useRef<(google.maps.Polygon | google.maps.Rectangle)[]>([]);

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

  // Load Google Maps Script with Drawing Library
  useEffect(() => {
    if (!apiKey) {
      toast.error('Google Maps API key is not configured');
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=drawing,geometry,places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setMapLoaded(true);
    document.head.appendChild(script);
    
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, [apiKey]);

  // Calculate area of shape in square miles
  const calculateArea = useCallback((shape: google.maps.Polygon | google.maps.Rectangle) => {
    if (!shape) return 0;
    
    let area = 0;
    if ('getPath' in shape) {
      // Polygon
      area = google.maps.geometry.spherical.computeArea(shape.getPath());
    } else if ('getBounds' in shape) {
      // Rectangle
      const bounds = shape.getBounds();
      if (bounds) {
        const ne = bounds.getNorthEast();
        const sw = bounds.getSouthWest();
        const path = [
          sw,
          new google.maps.LatLng(ne.lat(), sw.lng()),
          ne,
          new google.maps.LatLng(sw.lat(), ne.lng())
        ];
        area = google.maps.geometry.spherical.computeArea(path);
      }
    }
    
    // Convert square meters to square miles
    return area / 2589988.11;
  }, []);

  // Update total area
  const updateTotalArea = useCallback(() => {
    const total = shapesRef.current.reduce((sum, shape) => {
      return sum + calculateArea(shape);
    }, 0);
    setTotalArea(total);
  }, [calculateArea]);

  // Initialize Map
  useEffect(() => {
    if (!mapLoaded || mapRef.current) return;

    const map = new google.maps.Map(document.getElementById('draw-map')!, {
      center: { lat: 39.8283, lng: -98.5795 },
      zoom: 12,
      mapTypeId: 'roadmap',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
    });

    mapRef.current = map;

    // Initialize Drawing Manager
    const drawingManager = new google.maps.drawing.DrawingManager({
      drawingMode: null,
      drawingControl: false,
      polygonOptions: {
        fillColor: '#FF6B6B',
        fillOpacity: 0.35,
        strokeWeight: 2,
        strokeColor: '#C92A2A',
        clickable: true,
        editable: true,
        draggable: true,
        zIndex: 1
      },
      rectangleOptions: {
        fillColor: '#4DABF7',
        fillOpacity: 0.35,
        strokeWeight: 2,
        strokeColor: '#1971C2',
        clickable: true,
        editable: true,
        draggable: true,
        zIndex: 1
      }
    });

    drawingManager.setMap(map);
    drawingManagerRef.current = drawingManager;

    // Listen for shape completion
    google.maps.event.addListener(drawingManager, 'overlaycomplete', (event: any) => {
      const newShape = event.overlay;
      shapesRef.current.push(newShape);
      setShapes([...shapesRef.current]);
      updateTotalArea();

      // Add click listener to select shape
      newShape.addListener('click', () => {
        setSelectedShape(newShape);
        highlightShape(newShape);
      });

      // Add listener for shape changes
      if (event.type === 'polygon') {
        google.maps.event.addListener(newShape.getPath(), 'set_at', updateTotalArea);
        google.maps.event.addListener(newShape.getPath(), 'insert_at', updateTotalArea);
      } else if (event.type === 'rectangle') {
        google.maps.event.addListener(newShape, 'bounds_changed', updateTotalArea);
      }

      // Reset drawing mode
      drawingManager.setDrawingMode(null);
      setDrawingMode(null);
    });

    // Add search autocomplete
    const input = document.getElementById('draw-search-input') as HTMLInputElement;
    if (input) {
      const autocomplete = new google.maps.places.Autocomplete(input);
      autocomplete.bindTo('bounds', map);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        map.setCenter(place.geometry.location);
        map.setZoom(14);
      });
    }
  }, [mapLoaded, updateTotalArea]);

  // Highlight selected shape
  const highlightShape = (shape: google.maps.Polygon | google.maps.Rectangle) => {
    shapesRef.current.forEach(s => {
      s.setOptions({ fillOpacity: 0.35, strokeWeight: 2 });
    });
    
    if (shape) {
      shape.setOptions({ fillOpacity: 0.55, strokeWeight: 3 });
    }
  };

  // Toggle drawing mode
  const toggleDrawingMode = (mode: 'polygon' | 'rectangle') => {
    if (!drawingManagerRef.current) return;

    if (drawingMode === mode) {
      drawingManagerRef.current.setDrawingMode(null);
      setDrawingMode(null);
    } else {
      const modeMap = {
        'polygon': google.maps.drawing.OverlayType.POLYGON,
        'rectangle': google.maps.drawing.OverlayType.RECTANGLE
      };
      drawingManagerRef.current.setDrawingMode(modeMap[mode]);
      setDrawingMode(mode);
    }
  };

  // Delete selected shape
  const deleteSelectedShape = () => {
    if (!selectedShape) return;

    selectedShape.setMap(null);
    shapesRef.current = shapesRef.current.filter(s => s !== selectedShape);
    setShapes([...shapesRef.current]);
    setSelectedShape(null);
    updateTotalArea();
  };

  // Delete all shapes
  const clearAllShapes = () => {
    shapesRef.current.forEach(shape => shape.setMap(null));
    shapesRef.current = [];
    setShapes([]);
    setSelectedShape(null);
    setTotalArea(0);
  };

  // Undo last shape
  const undoLastShape = () => {
    if (shapesRef.current.length === 0) return;

    const lastShape = shapesRef.current.pop();
    lastShape?.setMap(null);
    setShapes([...shapesRef.current]);
    updateTotalArea();
  };

  // Toggle map lock
  const toggleLock = useCallback(() => {
    if (!mapRef.current) return;
    
    const newLockState = !isLocked;
    setIsLocked(newLockState);

    mapRef.current.setOptions({
      draggable: !newLockState,
      scrollwheel: !newLockState,
      zoomControl: !newLockState,
      disableDoubleClickZoom: newLockState,
    });

    shapesRef.current.forEach(shape => {
      shape.setEditable(!newLockState);
      shape.setDraggable(!newLockState);
    });
  }, [isLocked]);

  // Export shape data
  const exportShapes = () => {
    const data = shapesRef.current.map((shape, index) => {
      const coords: { lat: number; lng: number }[] = [];
      
      if ('getPath' in shape) {
        const path = shape.getPath();
        for (let i = 0; i < path.getLength(); i++) {
          const point = path.getAt(i);
          coords.push({ lat: point.lat(), lng: point.lng() });
        }
        return {
          type: 'polygon',
          index: index + 1,
          coordinates: coords,
          area: calculateArea(shape).toFixed(2) + ' sq mi'
        };
      } else if ('getBounds' in shape) {
        const bounds = shape.getBounds();
        if (bounds) {
          const ne = bounds.getNorthEast();
          const sw = bounds.getSouthWest();
          return {
            type: 'rectangle',
            index: index + 1,
            bounds: {
              north: ne.lat(),
              south: sw.lat(),
              east: ne.lng(),
              west: sw.lng()
            },
            area: calculateArea(shape).toFixed(2) + ' sq mi'
          };
        }
      }
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'map-drawings.json';
    a.click();
  };

  // Save coverage to database
  const handleSaveCoverage = async () => {
    if (!coverageName.trim()) {
      toast.error('Please enter a coverage name');
      return;
    }

    if (shapesRef.current.length === 0) {
      toast.error('Please draw at least one area');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        toast.error('You must be logged in to save coverage');
        navigate('/auth');
        return;
      }

      const polygonsData = shapesRef.current.map(shape => {
        if ('getPath' in shape) {
          const path = shape.getPath();
          const coords: { lat: number; lng: number }[] = [];
          for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            coords.push({ lat: point.lat(), lng: point.lng() });
          }
          return { paths: coords };
        }
        return null;
      }).filter(Boolean);

      // Get all coordinates from drawn shapes
      const allCoordinates = shapesRef.current.flatMap(shape => {
        if ('getPath' in shape) {
          const path = shape.getPath();
          const coords: { lat: number; lng: number }[] = [];
          for (let i = 0; i < path.getLength(); i++) {
            const point = path.getAt(i);
            coords.push({ lat: point.lat(), lng: point.lng() });
          }
          return coords;
        }
        return [];
      });

      // Geocode the drawn area to get zip codes, cities, states, and counties
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-area', {
        body: {
          method: 'draw',
          coordinates: allCoordinates
        }
      });

      if (geocodeError) {
        console.error('Geocoding error:', geocodeError);
        toast.error(`Failed to geocode coverage area: ${geocodeError.message}`);
        setSaving(false);
        return;
      }

      console.log('Geocode data:', geocodeData);

      const { error } = await supabase.from('market_coverage').insert({
        user_id: user.id,
        name: coverageName,
        coverage_type: 'polygon',
        data: { 
          polygons: polygonsData,
          zipCodes: geocodeData?.zipCodes || [],
          cities: geocodeData?.cities || [],
          states: geocodeData?.states || [],
          counties: geocodeData?.counties || [],
          coordinates: geocodeData?.coordinates || []
        },
      });

      if (error) {
        console.error('Insert error:', error);
        throw error;
      }

      toast.success('Coverage area saved successfully!');
      setShowSaveDialog(false);
      setCoverageName('');
      navigate('/market-coverage');
    } catch (error: any) {
      console.error('Error saving coverage:', error);
      toast.error(error.message || 'Failed to save coverage');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="relative w-full h-screen bg-gray-100">
      {/* Map Container */}
      <div id="draw-map" className="w-full h-full" />

      {/* Top Control Bar */}
      <div className="absolute top-4 left-4 right-4 flex gap-4 items-start">
        {/* Search Box */}
        <div className="bg-white rounded-lg shadow-lg p-3 flex-1 max-w-md">
          <input
            id="draw-search-input"
            type="text"
            placeholder="Search for a location..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
          />
        </div>

        {/* Lock Button */}
        <button
          onClick={toggleLock}
          className={`p-3 rounded-lg shadow-lg transition-colors ${
            isLocked 
              ? 'bg-red-500 hover:bg-red-600 text-white' 
              : 'bg-white hover:bg-gray-50 text-gray-700'
          }`}
          title={isLocked ? 'Unlock Map' : 'Lock Map'}
        >
          {isLocked ? <Lock size={24} /> : <Unlock size={24} />}
        </button>
      </div>

      {/* Drawing Tools - Left Side */}
      <div className="absolute left-4 top-32 bg-white rounded-lg shadow-lg p-2 space-y-2">
        <h3 className="text-xs font-semibold text-gray-600 px-2 py-1">Drawing Tools</h3>
        
        <button
          onClick={() => toggleDrawingMode('polygon')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            drawingMode === 'polygon'
              ? 'bg-red-500 text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Draw Polygon"
        >
          <Pencil size={20} />
          <span className="text-sm font-medium">Polygon</span>
        </button>

        <button
          onClick={() => toggleDrawingMode('rectangle')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            drawingMode === 'rectangle'
              ? 'bg-blue-500 text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Draw Rectangle"
        >
          <Square size={20} />
          <span className="text-sm font-medium">Rectangle</span>
        </button>

        <button
          onClick={() => {
            setDrawingMode(null);
            if (drawingManagerRef.current) {
              drawingManagerRef.current.setDrawingMode(null);
            }
          }}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg transition-colors ${
            drawingMode === null
              ? 'bg-green-500 text-white'
              : 'hover:bg-gray-100 text-gray-700'
          }`}
          title="Pan/Select Mode"
        >
          <Hand size={20} />
          <span className="text-sm font-medium">Select</span>
        </button>

        <hr className="border-gray-200" />

        <button
          onClick={undoLastShape}
          disabled={shapes.length === 0}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Undo Last Shape"
        >
          <Undo size={20} />
          <span className="text-sm font-medium">Undo</span>
        </button>

        <button
          onClick={deleteSelectedShape}
          disabled={!selectedShape}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Delete Selected"
        >
          <Trash2 size={20} />
          <span className="text-sm font-medium">Delete</span>
        </button>

        <button
          onClick={clearAllShapes}
          disabled={shapes.length === 0}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-red-50 text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Clear All"
        >
          <Trash2 size={20} />
          <span className="text-sm font-medium">Clear All</span>
        </button>

        <hr className="border-gray-200" />

        <button
          onClick={exportShapes}
          disabled={shapes.length === 0}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Export Data"
        >
          <Download size={20} />
          <span className="text-sm font-medium">Export</span>
        </button>

        <button
          onClick={() => setShowSaveDialog(true)}
          disabled={shapes.length === 0}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
          title="Save Coverage"
        >
          <span className="text-sm font-medium">Save Coverage</span>
        </button>
      </div>


      {/* Drawing Mode Indicator */}
      {drawingMode && (
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg animate-pulse">
          <p className="text-sm font-semibold">
            {drawingMode === 'polygon' ? '🎨 Click to draw polygon' : '📐 Click and drag to draw rectangle'}
          </p>
        </div>
      )}

      {/* Lock Indicator */}
      {isLocked && (
        <div className="absolute top-20 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-full shadow-lg">
          <p className="text-sm font-semibold flex items-center gap-2">
            <Lock size={16} />
            Map Locked
          </p>
        </div>
      )}

      {/* Save Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Coverage Area</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="coverageName">Coverage Name</Label>
              <Input
                id="coverageName"
                value={coverageName}
                onChange={(e) => setCoverageName(e.target.value)}
                placeholder="Enter a name for this coverage area"
              />
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setShowSaveDialog(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveCoverage} disabled={saving} className="flex-1">
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* API Key Warning */}
      {!mapLoaded && !apiKey && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900 bg-opacity-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md">
            <h2 className="text-lg font-bold text-gray-800 mb-2">Google Maps API Key Required</h2>
            <p className="text-sm text-gray-600 mb-4">
              Configure your Google Maps API key in environment variables.
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Required APIs:
            </p>
            <ul className="text-xs text-gray-500 list-disc list-inside">
              <li>Maps JavaScript API</li>
              <li>Drawing Library</li>
              <li>Geometry Library</li>
              <li>Places API</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketCoverageDraw;
