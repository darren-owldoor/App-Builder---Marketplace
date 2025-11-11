import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertCircle, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const SyncSchemaFix = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const { toast } = useToast();

  const handleAutoFix = async () => {
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke('sync-schema-auto-fix');

      if (error) throw error;

      setResult(data);

      if (data.status === 'success') {
        toast({
          title: "Success!",
          description: "Schema is up to date and sync completed successfully",
        });
      } else if (data.status === 'columns_missing') {
        toast({
          title: "Missing Columns Detected",
          description: "Please run the provided SQL script on your external Supabase",
          variant: "destructive",
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
      setResult({ status: 'error', message: error.message });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "SQL script copied to clipboard",
    });
  };

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle>Sync Schema Auto-Fix</CardTitle>
          <CardDescription>
            Automatically detect and fix schema differences between Lovable Cloud and your external Supabase
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleAutoFix}
            disabled={loading}
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Checking Schema...
              </>
            ) : (
              "Check & Fix Schema"
            )}
          </Button>

          {result && (
            <div className="space-y-4 mt-4">
              {result.status === 'success' && (
                <Alert className="bg-green-50 border-green-200">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    {result.message}
                  </AlertDescription>
                </Alert>
              )}

              {result.status === 'columns_missing' && (
                <div className="space-y-4">
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>
                      {result.message}
                    </AlertDescription>
                  </Alert>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Missing Columns:</h3>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {result.missing_columns.map((col: string) => (
                        <li key={col}>{col}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="space-y-2">
                    <h3 className="font-semibold">Instructions:</h3>
                    <ol className="list-decimal list-inside space-y-1 text-sm">
                      {result.instructions.map((instruction: string, idx: number) => (
                        <li key={idx}>{instruction}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">SQL Script:</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(result.sql_script)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>
                    </div>
                    <pre className="bg-muted p-4 rounded-lg overflow-x-auto text-xs">
                      <code>{result.sql_script}</code>
                    </pre>
                  </div>

                  <Alert className="bg-blue-50 border-blue-200">
                    <AlertDescription className="text-blue-800">
                      After running the SQL script, don't forget to refresh the schema cache:
                      <pre className="mt-2 bg-blue-100 p-2 rounded text-xs">
                        NOTIFY pgrst, 'reload schema';
                      </pre>
                    </AlertDescription>
                  </Alert>
                </div>
              )}

              {result.status === 'error' && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    {result.message}
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default SyncSchemaFix;
