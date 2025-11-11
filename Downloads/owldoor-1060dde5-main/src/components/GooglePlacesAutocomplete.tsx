import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { findCity, getUSStates } from "@/utils/cityGeocoding";
import { toast } from "sonner";

interface GooglePlacesAutocompleteProps {
  onPlaceSelected: (city: string, state: string) => void;
  placeholder?: string;
  className?: string;
  value?: string;
}

export function GooglePlacesAutocomplete({ 
  onPlaceSelected, 
  placeholder = "Enter city and state",
  className = "",
  value = ""
}: GooglePlacesAutocompleteProps) {
  const [cityInput, setCityInput] = useState(value.split(',')[0]?.trim() || "");
  const [selectedState, setSelectedState] = useState("");
  const [searching, setSearching] = useState(false);

  const states = getUSStates();

  const handleSearch = async () => {
    if (!cityInput.trim() || !selectedState) {
      toast.error("Please enter a city and select a state");
      return;
    }

    setSearching(true);
    try {
      const result = await findCity(cityInput.trim(), selectedState);
      
      if (!result) {
        toast.error("City not found. Please check the spelling and try again.");
        return;
      }

      onPlaceSelected(result.city, result.stateCode);
      toast.success(`${result.city}, ${result.stateCode} selected`);
    } catch (error) {
      console.error("Error finding city:", error);
      toast.error("Failed to find city");
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className="space-y-2">
      <Input
        placeholder={placeholder}
        className={className || "h-12 text-base"}
        value={cityInput}
        onChange={(e) => setCityInput(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !searching) {
            handleSearch();
          }
        }}
      />
      <Select value={selectedState} onValueChange={setSelectedState}>
        <SelectTrigger className="h-12 text-base">
          <SelectValue placeholder="Select a state" />
        </SelectTrigger>
        <SelectContent>
          {states.map((state) => (
            <SelectItem key={state.code} value={state.code}>
              {state.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
