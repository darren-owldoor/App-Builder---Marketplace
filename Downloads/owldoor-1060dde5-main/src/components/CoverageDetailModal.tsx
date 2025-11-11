import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { MapContainer, TileLayer, Circle, Marker, Popup } from "react-leaflet";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapPin, Circle as CircleIcon } from "lucide-react";

// Fix for default marker icon
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

interface MarketCoverage {
  id: string;
  coverage_type: "cities" | "radius" | "polygon" | "zip";
  name: string;
  data: any;
  created_at: string;
}

interface CoverageDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coverage: MarketCoverage | null;
}

export const CoverageDetailModal = ({ open, onOpenChange, coverage }: CoverageDetailModalProps) => {
  if (!coverage) return null;

  const renderContent = () => {
    switch (coverage.coverage_type) {
      case "cities":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <MapPin className="h-4 w-4 text-primary" />
                Cities ({coverage.data?.cities?.length || 0})
              </h4>
              <div className="flex flex-wrap gap-2">
                {coverage.data?.cities?.map((city: any, idx: number) => (
                  <Badge key={idx} variant="secondary">
                    {city.name}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        );

      case "zip":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">ZIP Code</h4>
              <Badge variant="secondary" className="text-base">
                {coverage.name}
              </Badge>
            </div>
          </div>
        );

      case "radius":
        const circles = coverage.data?.circles || [];
        const center = circles.length > 0 ? [circles[0].center.lat, circles[0].center.lng] : [37.7749, -122.4194];
        
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2 flex items-center gap-2">
                <CircleIcon className="h-4 w-4 text-primary" />
                Radius Circles ({circles.length})
              </h4>
              <div className="space-y-2 mb-4">
                {circles.map((circle: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-muted/30 rounded">
                    <span className="text-sm">
                      Center: {circle.center.lat.toFixed(4)}, {circle.center.lng.toFixed(4)}
                    </span>
                    <Badge variant="outline">{circle.radius} miles</Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* OpenStreetMap */}
            <div className="h-[400px] rounded-lg overflow-hidden border">
              <MapContainer
                center={center as [number, number]}
                zoom={10}
                style={{ height: "100%", width: "100%" }}
              >
                <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                />
                {circles.map((circle: any, idx: number) => (
                  <div key={idx}>
                    <Circle
                      center={[circle.center.lat, circle.center.lng]}
                      radius={circle.radius * 1609.34} // Convert miles to meters
                      pathOptions={{
                        color: "#3b82f6",
                        fillColor: "#3b82f6",
                        fillOpacity: 0.1,
                      }}
                    />
                    <Marker position={[circle.center.lat, circle.center.lng]}>
                      <Popup>
                        Radius: {circle.radius} miles
                      </Popup>
                    </Marker>
                  </div>
                ))}
              </MapContainer>
            </div>
          </div>
        );

      case "polygon":
        return (
          <div className="space-y-4">
            <div>
              <h4 className="font-semibold mb-2">Custom Drawn Area</h4>
              <p className="text-sm text-muted-foreground">
                Polygons: {coverage.data?.polygons?.length || 0}
              </p>
            </div>
          </div>
        );

      default:
        return (
          <div className="text-sm text-muted-foreground">
            No details available for this coverage type.
          </div>
        );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{coverage.name}</DialogTitle>
        </DialogHeader>

        <Card className="p-4">
          {renderContent()}
        </Card>
      </DialogContent>
    </Dialog>
  );
};
