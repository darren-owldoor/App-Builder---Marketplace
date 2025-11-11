import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, Download, Loader2 } from "lucide-react";

export const ZipRadiusGeocoder = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [zipCodes, setZipCodes] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const handleAutocomplete = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zip-radius-geocode', {
        body: { action: 'autocomplete', query: searchQuery }
      });

      if (error) throw error;
      setSuggestions(data.suggestions || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to get suggestions");
    } finally {
      setLoading(false);
    }
  };

  const handleGeocodeLocation = async (location: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('zip-radius-geocode', {
        body: { action: 'geocode', query: location }
      });

      if (error) throw error;
      
      toast.success(`Geocoded: ${data.formatted_address}`);
      console.log('Location data:', data);
    } catch (error: any) {
      toast.error(error.message || "Failed to geocode location");
    } finally {
      setLoading(false);
    }
  };

  const handleBatchGeocode = async () => {
    const zipArray = zipCodes.split('\n').map(z => z.trim()).filter(z => z);
    
    if (zipArray.length === 0) {
      toast.error("Please enter ZIP codes (one per line)");
      return;
    }

    setLoading(true);
    setResults([]);
    
    try {
      const { data, error } = await supabase.functions.invoke('zip-radius-geocode', {
        body: { action: 'geocodeBatch', zipCodes: zipArray }
      });

      if (error) throw error;
      
      setResults(data.results || []);
      
      const successful = data.results.filter((r: any) => r.success).length;
      toast.success(`Geocoded ${successful} of ${zipArray.length} ZIP codes`);
    } catch (error: any) {
      toast.error(error.message || "Failed to batch geocode");
    } finally {
      setLoading(false);
    }
  };

  const handleExportResults = () => {
    if (results.length === 0) return;

    const csvContent = [
      ['ZIP', 'Latitude', 'Longitude', 'City', 'County', 'State', 'Status'].join(','),
      ...results.map(r => [
        r.zip,
        r.success ? r.latitude : '',
        r.success ? r.longitude : '',
        r.success ? r.city : '',
        r.success ? r.county : '',
        r.success ? r.state : '',
        r.success ? 'Success' : `Failed: ${r.error}`
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `geocoded-zips-${Date.now()}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success("Results exported to CSV");
  };

  return (
    <div className="space-y-6">
      {/* Location Search */}
      <Card>
        <CardHeader>
          <CardTitle>Location Search & Geocoding</CardTitle>
          <CardDescription>
            Search for locations and get coordinates using Google Maps API
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="search">Search Location</Label>
            <div className="flex gap-2">
              <Input
                id="search"
                placeholder="Enter city, state, or address..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAutocomplete()}
              />
              <Button onClick={handleAutocomplete} disabled={loading}>
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MapPin className="h-4 w-4" />}
                Search
              </Button>
            </div>
          </div>

          {suggestions.length > 0 && (
            <div className="space-y-2">
              <Label>Suggestions</Label>
              <div className="border rounded-lg divide-y">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleGeocodeLocation(suggestion.description)}
                    className="w-full text-left px-4 py-3 hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                      <span className="text-sm">{suggestion.description}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Batch Geocoding */}
      <Card>
        <CardHeader>
          <CardTitle>Batch ZIP Code Geocoding</CardTitle>
          <CardDescription>
            Enter ZIP codes (one per line) to geocode multiple locations
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="zipcodes">ZIP Codes</Label>
            <Textarea
              id="zipcodes"
              placeholder="78201&#10;78202&#10;78203"
              value={zipCodes}
              onChange={(e) => setZipCodes(e.target.value)}
              rows={8}
              className="font-mono"
            />
          </div>

          <div className="flex gap-2">
            <Button onClick={handleBatchGeocode} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Geocode All
            </Button>
            {results.length > 0 && (
              <Button variant="outline" onClick={handleExportResults}>
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
            )}
          </div>

          {/* Results */}
          {results.length > 0 && (
            <div className="space-y-2">
              <Label>Results ({results.filter(r => r.success).length} successful)</Label>
              <div className="border rounded-lg max-h-96 overflow-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted sticky top-0">
                    <tr>
                      <th className="text-left p-2">ZIP</th>
                      <th className="text-left p-2">City</th>
                      <th className="text-left p-2">State</th>
                      <th className="text-left p-2">Lat</th>
                      <th className="text-left p-2">Lng</th>
                      <th className="text-left p-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {results.map((result, index) => (
                      <tr key={index} className={result.success ? '' : 'bg-destructive/10'}>
                        <td className="p-2 font-mono">{result.zip}</td>
                        <td className="p-2">{result.success ? result.city : '-'}</td>
                        <td className="p-2">{result.success ? result.state : '-'}</td>
                        <td className="p-2 font-mono text-xs">{result.success ? result.latitude.toFixed(4) : '-'}</td>
                        <td className="p-2 font-mono text-xs">{result.success ? result.longitude.toFixed(4) : '-'}</td>
                        <td className="p-2">
                          {result.success ? (
                            <span className="text-xs text-green-600">✓ Success</span>
                          ) : (
                            <span className="text-xs text-destructive">{result.error}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
