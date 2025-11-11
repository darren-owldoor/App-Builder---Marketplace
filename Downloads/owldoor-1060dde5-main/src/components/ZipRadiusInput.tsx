import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ZipRadiusInputProps {
  onZipRadiusChange: (zipRadiuses: { zip: string; radius: number }[]) => void;
  initialValue?: { zip: string; radius: number }[];
}

export const ZipRadiusInput = ({ onZipRadiusChange, initialValue = [] }: ZipRadiusInputProps) => {
  const [zipRadiuses, setZipRadiuses] = useState<{ zip: string; radius: number }[]>(initialValue);
  const [currentZip, setCurrentZip] = useState("");
  const [currentRadius, setCurrentRadius] = useState("25");

  const addZipRadius = () => {
    if (currentZip.trim() && currentRadius) {
      const newZipRadius = {
        zip: currentZip.trim(),
        radius: parseInt(currentRadius)
      };
      const updated = [...zipRadiuses, newZipRadius];
      setZipRadiuses(updated);
      onZipRadiusChange(updated);
      setCurrentZip("");
      setCurrentRadius("25");
    }
  };

  const removeZipRadius = (index: number) => {
    const updated = zipRadiuses.filter((_, i) => i !== index);
    setZipRadiuses(updated);
    onZipRadiusChange(updated);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addZipRadius();
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="zip" className="text-lg">Zip Code *</Label>
          <Input
            id="zip"
            value={currentZip}
            onChange={(e) => setCurrentZip(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="90210"
            maxLength={5}
            className="text-lg h-12"
          />
        </div>
        <div>
          <Label htmlFor="radius" className="text-lg">Radius (miles) *</Label>
          <Input
            id="radius"
            type="number"
            min="1"
            max="50"
            value={currentRadius}
            onChange={(e) => setCurrentRadius(e.target.value)}
            onKeyPress={handleKeyPress}
            className="text-lg h-12"
          />
        </div>
      </div>
      <Button
        type="button"
        onClick={addZipRadius}
        variant="outline"
        className="w-full"
        disabled={!currentZip.trim()}
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Zip Code + Radius
      </Button>

      {zipRadiuses.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Service Areas:</Label>
          <div className="flex flex-wrap gap-2">
            {zipRadiuses.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-base px-3 py-1">
                {item.zip} ({item.radius}mi)
                <button
                  type="button"
                  onClick={() => removeZipRadius(index)}
                  className="ml-2 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <p className="text-sm text-muted-foreground">
        Add one or more zip codes with their service radius. This helps us match you with brokerages in your area.
      </p>
    </div>
  );
};
