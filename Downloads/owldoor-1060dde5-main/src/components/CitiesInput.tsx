import { useState, useRef } from "react";
import { Autocomplete } from "@react-google-maps/api";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CitiesInputProps {
  onCitiesChange: (cities: string[]) => void;
  initialValue?: string[];
}

export const CitiesInput = ({ onCitiesChange, initialValue = [] }: CitiesInputProps) => {
  const [cities, setCities] = useState<string[]>(initialValue);
  const [autocomplete, setAutocomplete] = useState<google.maps.places.Autocomplete | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const onLoad = (autocompleteInstance: google.maps.places.Autocomplete) => {
    setAutocomplete(autocompleteInstance);
  };

  const onPlaceChanged = () => {
    if (autocomplete) {
      const place = autocomplete.getPlace();
      if (place.formatted_address || place.name) {
        const cityName = place.formatted_address || place.name || "";
        if (cityName && !cities.includes(cityName)) {
          const updated = [...cities, cityName];
          setCities(updated);
          onCitiesChange(updated);
          
          // Clear the input
          if (inputRef.current) {
            inputRef.current.value = "";
          }
        }
      }
    }
  };

  const removeCity = (cityToRemove: string) => {
    const updated = cities.filter(city => city !== cityToRemove);
    setCities(updated);
    onCitiesChange(updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="city-autocomplete" className="text-lg">City or County Name *</Label>
        <div className="flex gap-2">
          <Autocomplete
            onLoad={onLoad}
            onPlaceChanged={onPlaceChanged}
            options={{
              types: ['(cities)'],
              componentRestrictions: { country: 'us' }
            }}
          >
            <input
              ref={inputRef}
              id="city-autocomplete"
              type="text"
              placeholder="Search for a city or county..."
              className="flex h-12 flex-1 rounded-md border border-input bg-background px-3 py-2 text-lg ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            />
          </Autocomplete>
        </div>
      </div>

      {cities.length > 0 && (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">Service Areas:</Label>
          <div className="flex flex-wrap gap-2">
            {cities.map((city, index) => (
              <Badge key={index} variant="secondary" className="text-base px-3 py-1">
                {city}
                <button
                  type="button"
                  onClick={() => removeCity(city)}
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
        Add the cities or counties where you provide real estate services. You can add multiple locations.
      </p>
    </div>
  );
};
