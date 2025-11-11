import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MapPin, CheckCircle, XCircle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function AdminBackfillZips() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const runBackfill = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("backfill-zip-coverage");

      if (error) throw error;

      setResult(data);
      
      toast({
        title: "Backfill Complete",
        description: `Updated ${data.summary.clients.updated} clients and ${data.summary.pros.updated} pros`,
      });
    } catch (err: any) {
      toast({
        title: "Backfill Failed",
        description: err.message || "Failed to run backfill",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Backfill ZIP Codes & Coverage</h1>
        <p className="text-muted-foreground">
          Automatically add ZIP codes and 25-mile radius coverage for clients and agents missing location data
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Run Backfill Process</CardTitle>
          <CardDescription>
            This will:
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Find all clients without ZIP codes</li>
              <li>Find all agents without ZIP codes</li>
              <li>Use Google Maps to geocode their cities/states into ZIP codes</li>
              <li>Add default 25-mile radius coverage areas</li>
              <li>Create active bids for clients (so they can receive matches)</li>
            </ul>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={runBackfill}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Running Backfill...
              </>
            ) : (
              <>
                <MapPin className="mr-2 h-5 w-5" />
                Start Backfill Process
              </>
            )}
          </Button>

          {result && (
            <Alert className="mt-6">
              <CheckCircle className="h-4 w-4" />
              <AlertTitle>Backfill Complete!</AlertTitle>
              <AlertDescription>
                <div className="mt-4 space-y-4">
                  <div>
                    <h4 className="font-semibold mb-2">Clients:</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>{" "}
                        <span className="font-bold">{result.summary.clients.total}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Updated:</span>{" "}
                        <span className="font-bold">{result.summary.clients.updated}</span>
                      </div>
                      <div>
                        <span className="text-orange-600">Skipped:</span>{" "}
                        <span className="font-bold">{result.summary.clients.skipped}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold mb-2">Agents:</h4>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Total:</span>{" "}
                        <span className="font-bold">{result.summary.pros.total}</span>
                      </div>
                      <div>
                        <span className="text-green-600">Updated:</span>{" "}
                        <span className="font-bold">{result.summary.pros.updated}</span>
                      </div>
                      <div>
                        <span className="text-orange-600">Skipped:</span>{" "}
                        <span className="font-bold">{result.summary.pros.skipped}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
