import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, ArrowRight, CheckCircle2 } from "lucide-react";
import { findCity, getUSStates } from "@/utils/cityGeocoding";
import { toast } from "sonner";

interface MarketSearchInputProps {
  onPlaceSelected: (city: string, state: string) => void;
  selectedCity?: string;
  selectedState?: string;
  autoAdvance?: boolean;
}

export function MarketSearchInput({ 
  onPlaceSelected, 
  selectedCity = "",
  selectedState = "",
  autoAdvance = false
}: MarketSearchInputProps) {
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  const [searching, setSearching] = useState(false);

  const states = getUSStates();

  const handleSearch = async () => {
    if (!cityInput.trim() || !stateInput) {
      toast.error("Please enter a city and select a state");
      return;
    }

    setSearching(true);
    try {
      const result = await findCity(cityInput.trim(), stateInput);
      
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
    <div className="w-full max-w-4xl mx-auto">
      <div className="bg-[#5fb596] rounded-3xl p-8 md:p-16 text-center space-y-8">
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white">
          Check Your Market Availability
        </h1>
        
        <div className="relative max-w-3xl mx-auto space-y-4">
          <div className="relative flex items-center bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="pl-6 pr-4">
              <Search className="w-6 h-6 text-gray-400" />
            </div>
            <Input
              placeholder="Type in a City"
              className="flex-1 border-0 h-16 text-lg md:text-xl focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent"
              value={cityInput}
              onChange={(e) => setCityInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !searching) {
                  handleSearch();
                }
              }}
              autoFocus
            />
            <button 
              type="button"
              className="bg-[#5fb596] hover:bg-[#4ea585] text-white p-4 m-2 rounded-xl transition-colors"
              onClick={handleSearch}
              disabled={searching}
            >
              <ArrowRight className="w-6 h-6" />
            </button>
          </div>

          <Select value={stateInput} onValueChange={setStateInput}>
            <SelectTrigger className="h-16 text-lg md:text-xl bg-white">
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

        {selectedCity && selectedState && (
          <div className="flex items-center justify-center gap-2 text-white pt-2">
            <CheckCircle2 className="w-5 h-5" />
            <p className="text-lg font-medium">{selectedCity}, {selectedState}</p>
          </div>
        )}
      </div>
    </div>
  );
}
