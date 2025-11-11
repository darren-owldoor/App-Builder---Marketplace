import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { X } from "lucide-react";
import { z } from "zod";
import { findCity, getUSStates, type CityData } from "@/utils/cityGeocoding";

const citySchema = z.object({
  city: z.string().trim().min(1, "City name is required").max(200),
  state: z.string().trim().min(1),
  stateCode: z.string().trim().min(1),
  latitude: z.number(),
  longitude: z.number(),
});

const coverageSchema = z.object({
  name: z.string().trim().min(1, "Coverage name is required").max(100),
  cities: z.array(citySchema).min(1, "Add at least one city"),
});

type City = z.infer<typeof citySchema>;

const MarketCoverageCities = () => {
  const navigate = useNavigate();
  const [coverageName, setCoverageName] = useState("");
  const [cities, setCities] = useState<City[]>([]);
  const [cityInput, setCityInput] = useState("");
  const [selectedState, setSelectedState] = useState("");
  const [saving, setSaving] = useState(false);
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [searching, setSearching] = useState(false);

  const states = getUSStates();

  const handleAddCity = async () => {
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

      const exists = cities.some(
        c => c.city.toLowerCase() === result.city.toLowerCase() && 
             c.stateCode === result.stateCode
      );

      if (exists) {
        toast.error("City already added");
        return;
      }

      const newCity: City = {
        city: result.city,
        state: result.state,
        stateCode: result.stateCode,
        latitude: result.latitude,
        longitude: result.longitude,
      };

      setCities([...cities, newCity]);
      setCityInput("");
      setSelectedState("");
      toast.success(`${result.city}, ${result.stateCode} added`);
    } catch (error) {
      console.error("Error finding city:", error);
      toast.error("Failed to find city");
    } finally {
      setSearching(false);
    }
  };

  const handleSaveClick = () => {
    if (cities.length === 0) {
      toast.error("Add at least one city");
      return;
    }
    setShowNameDialog(true);
  };

  const removeCity = (index: number) => {
    setCities(cities.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    try {
      const validated = coverageSchema.parse({
        name: coverageName,
        cities,
      });

      setSaving(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save");
        return;
      }

      const { error } = await supabase
        .from("market_coverage")
        .insert({
          user_id: user.id,
          coverage_type: "cities",
          name: validated.name,
          data: { cities: validated.cities },
        });

      if (error) throw error;

      toast.success("Market coverage saved!");
      navigate(-1);
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

  return (
    <div className="min-h-screen bg-background py-12 px-4">
      <div className="container mx-auto max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Type in Cities You Work</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="city-input">City Name</Label>
                <Input 
                  id="city-input"
                  placeholder="Enter city name..." 
                  value={cityInput}
                  onChange={(e) => setCityInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !searching) {
                      handleAddCity();
                    }
                  }}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="state-select">State</Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger id="state-select">
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

              <Button 
                onClick={handleAddCity} 
                disabled={searching || !cityInput.trim() || !selectedState}
                className="w-full"
              >
                {searching ? "Searching..." : "Add City"}
              </Button>
            </div>

            {cities.length > 0 && (
              <div className="space-y-2">
                <Label>Selected Cities ({cities.length})</Label>
                <div className="space-y-2">
                  {cities.map((city, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <span className="text-sm">{city.city}, {city.stateCode}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeCity(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => navigate(-1)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSaveClick} disabled={cities.length === 0} className="flex-1">
                Save Coverage
              </Button>
            </div>
          </CardContent>
        </Card>

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
    </div>
  );
};

export default MarketCoverageCities;
