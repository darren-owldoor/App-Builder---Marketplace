import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowLeft, MapPin, Target, Loader2, Download, Check } from "lucide-react";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";
import { Badge } from "@/components/ui/badge";

interface ZipResult {
  zipCode: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance: number;
}

interface GeocodingResult {
  success: boolean;
  centerZip: string;
  centerCity: string;
  centerState: string;
  centerCoordinates: {
    latitude: number;
    longitude: number;
  };
  radiusMiles: number;
  totalZipsChecked: number;
  zipsFound: number;
  results: ZipResult[];
}

const MarketCoverageZipRadius = () => {
  const navigate = useNavigate();
  const [centerZip, setCenterZip] = useState("");
  const [radiusMiles, setRadiusMiles] = useState("25");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<GeocodingResult | null>(null);
  const [coverageName, setCoverageName] = useState("");
  const [showNameDialog, setShowNameDialog] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleFindZips = async () => {
    if (!centerZip || !radiusMiles) {
      toast.error("Please enter both zip code and radius");
      return;
    }

    setLoading(true);
    setResults(null);

    try {
      // Call our improved edge function with US zip database
      const { data, error } = await supabase.functions.invoke('geocode-zip-radius', {
        body: {
          centerZip: centerZip.trim(),
          radiusMiles: parseFloat(radiusMiles)
        }
      });

      if (error) throw error;

      if (data.error) {
        toast.error(data.error);
        return;
      }

      setResults(data);
      toast.success(`Found ${data.zipsFound} zip codes within ${data.radiusMiles} miles!`);

    } catch (error: any) {
      console.error("Error finding zips:", error);
      toast.error(error.message || "Failed to find zip codes");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveClick = () => {
    if (!results || results.results.length === 0) {
      toast.error("No results to save");
      return;
    }
    setShowNameDialog(true);
  };

  const handleSave = async () => {
    if (!coverageName.trim()) {
      toast.error("Please enter a coverage name");
      return;
    }

    if (!results || !results.results || results.results.length === 0) {
      toast.error("No coverage data to save");
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error("Please log in to save");
        setSaving(false);
        return;
      }

      // Get unique cities, states, and zips
      const uniqueZips = [...new Set(results.results.map(r => r.zipCode))];
      const uniqueCities = [...new Set(results.results.map(r => r.city))];
      const uniqueStates = [...new Set(results.results.map(r => r.state))];

      // Save to market_coverage table
      const { data: coverageData, error: coverageError } = await supabase
        .from("market_coverage")
        .insert([{
          user_id: user.id,
          coverage_type: "zip_radius",
          name: coverageName.trim(),
          data: {
            centerZip: results.centerZip,
            radiusMiles: results.radiusMiles,
            centerCoordinates: results.centerCoordinates,
            zipCodes: uniqueZips,
            cities: uniqueCities,
            states: uniqueStates,
            fullResults: results.results.map(r => ({
              zipCode: r.zipCode,
              city: r.city,
              state: r.state,
              latitude: r.latitude,
              longitude: r.longitude,
              distance: r.distance
            }))
          }
        }])
        .select();

      if (coverageError) throw coverageError;

      // Also update the client's zip_codes, cities, and states for matching
      const { data: clientData } = await supabase
        .from("clients")
        .select("zip_codes, cities, states")
        .eq("user_id", user.id)
        .maybeSingle();

      if (clientData) {
        // Merge new data with existing
        const updatedZips = [...new Set([...(clientData.zip_codes || []), ...uniqueZips])];
        const updatedCities = [...new Set([...(clientData.cities || []), ...uniqueCities])];
        const updatedStates = [...new Set([...(clientData.states || []), ...uniqueStates])];

        await supabase
          .from("clients")
          .update({
            zip_codes: updatedZips,
            cities: updatedCities,
            states: updatedStates
          })
          .eq("user_id", user.id);
      }

      toast.success("Coverage saved successfully!");
      setShowNameDialog(false);
      navigate("/market-coverage");

    } catch (error: any) {
      console.error("Error saving coverage:", error);
      toast.error(error.message || "Failed to save coverage");
    } finally {
      setSaving(false);
    }
  };

  const exportToCSV = () => {
    if (!results) return;

    const header = "Zip Code,City,State,Latitude,Longitude,Distance (mi)\n";
    const rows = results.results.map(r => 
      `${r.zipCode},${r.city},${r.state},${r.latitude},${r.longitude},${r.distance}`
    ).join("\n");

    const csv = header + rows;
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `zip-radius-${results.centerZip}-${results.radiusMiles}mi.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <img 
            src={owlDoorLogo} 
            alt="OwlDoor" 
            className="h-12 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => navigate("/market-coverage")}
          />
          <Button variant="outline" onClick={() => navigate("/market-coverage")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Coverage
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-5xl py-8 px-4">
        {/* Header Info */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-3">Zip Code + Radius Coverage</h1>
          <p className="text-muted-foreground text-lg">
            Enter a zip code and radius to find all zips within that area
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5 text-primary" />
                Define Your Territory
              </CardTitle>
              <CardDescription>
                Search all US zip codes by center point and radius
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="centerZip">Center Zip Code *</Label>
                <Input
                  id="centerZip"
                  type="text"
                  placeholder="78205"
                  value={centerZip}
                  onChange={(e) => setCenterZip(e.target.value)}
                  maxLength={5}
                  disabled={loading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="radius">Radius (miles) *</Label>
                <Input
                  id="radius"
                  type="number"
                  placeholder="25"
                  value={radiusMiles}
                  onChange={(e) => setRadiusMiles(e.target.value)}
                  min="1"
                  max="100"
                  disabled={loading}
                />
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-2">
                <div className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-primary" />
                  <p className="text-sm font-medium">Automatic Search</p>
                </div>
                <p className="text-xs text-muted-foreground">
                  Searches all 40,000+ US zip codes instantly using local database
                </p>
              </div>

              <Button
                onClick={handleFindZips} 
                disabled={loading || !centerZip || !radiusMiles}
                className="w-full"
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Finding Zips...
                  </>
                ) : (
                  <>
                    <MapPin className="mr-2 h-4 w-4" />
                    Find Zip Codes
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Results Card */}
          <Card className={results ? "border-primary" : ""}>
            <CardHeader>
              <CardTitle>Results</CardTitle>
              <CardDescription>
                {results 
                  ? `${results.zipsFound} zip codes found within ${results.radiusMiles} miles`
                  : "Results will appear here"
                }
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!results && !loading && (
                <div className="text-center py-12 text-muted-foreground">
                  <Target className="h-16 w-16 mx-auto mb-4 opacity-20" />
                  <p>Enter a zip code and radius to get started</p>
                </div>
              )}

              {loading && (
                <div className="text-center py-12">
                  <Loader2 className="h-16 w-16 mx-auto mb-4 animate-spin text-primary" />
                  <p className="text-muted-foreground">Searching 40,000+ zip codes...</p>
                  <p className="text-xs text-muted-foreground mt-2">Using local database - fast & accurate</p>
                </div>
              )}

              {results && (
                <div className="space-y-4">
                  {/* Summary */}
                  <div className="bg-muted/30 p-4 rounded-lg">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-muted-foreground">Center</p>
                        <p className="font-semibold">{results.centerCity}, {results.centerState}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Radius</p>
                        <p className="font-semibold">{results.radiusMiles} miles</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Zips Found</p>
                        <p className="font-semibold text-primary">{results.zipsFound}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Checked</p>
                        <p className="font-semibold">{results.totalZipsChecked}</p>
                      </div>
                    </div>
                  </div>

                  {/* Zip List */}
                  <div className="max-h-64 overflow-y-auto border rounded-lg">
                    {results.results.map((zip, index) => (
                      <div 
                        key={index}
                        className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-accent/50 transition-colors"
                      >
                        <div>
                          <p className="font-medium">{zip.zipCode}</p>
                          <p className="text-xs text-muted-foreground">{zip.city}, {zip.state}</p>
                        </div>
                        <Badge variant="outline">
                          {zip.distance} mi
                        </Badge>
                      </div>
                    ))}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      onClick={exportToCSV}
                      className="flex-1"
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Export CSV
                    </Button>
                    <Button 
                      onClick={handleSaveClick}
                      className="flex-1"
                    >
                      Save Coverage
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Save Dialog */}
      <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save Coverage Area</DialogTitle>
            <DialogDescription>
              Give this coverage area a name so you can identify it later
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="coverageName">Coverage Name</Label>
              <Input
                id="coverageName"
                placeholder={`${results?.centerCity} - ${results?.radiusMiles}mi`}
                value={coverageName}
                onChange={(e) => setCoverageName(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button 
              variant="outline" 
              onClick={() => setShowNameDialog(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saving || !coverageName.trim()}
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Coverage"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketCoverageZipRadius;
