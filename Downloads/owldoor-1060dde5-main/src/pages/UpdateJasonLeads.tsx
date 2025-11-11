import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { ArrowLeft, Upload, CheckCircle, AlertCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { updateJasonLeadsToDirectory } from "@/utils/updateJasonLeadsToDirectory";

const UpdateJasonLeads = () => {
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<{
    success: number;
    errors: number;
    details: string[];
  } | null>(null);

  const handleUpdate = async () => {
    setProcessing(true);
    setResults(null);

    try {
      // Fetch the CSV file
      const response = await fetch("/data/hot-leads-complete.csv");
      const csvContent = await response.text();

      if (!csvContent) {
        throw new Error("Failed to load CSV file");
      }

      toast.info("Processing leads...");
      
      const updateResults = await updateJasonLeadsToDirectory(csvContent);
      
      setResults(updateResults);
      
      if (updateResults.success > 0) {
        toast.success(`Successfully updated ${updateResults.success} leads!`);
      }
      
      if (updateResults.errors > 0) {
        toast.error(`${updateResults.errors} errors occurred`);
      }
    } catch (error: any) {
      console.error("Update error:", error);
      toast.error(`Failed to update leads: ${error.message}`);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background p-6">
      <div className="container mx-auto max-w-4xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <h1 className="text-4xl font-bold mb-2">Update Jason's Leads</h1>
          <p className="text-muted-foreground">
            Convert hot leads to Directory agents with user accounts
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Upgrade Leads to Directory</CardTitle>
            <CardDescription>
              This will update Jason's 10 purchased leads with complete data from the CSV,
              create user accounts for each agent, and set them as Directory type.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">What this will do:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Match leads by phone number with CSV data</li>
                <li>Create user accounts (email + password based on phone)</li>
                <li>Update all lead details (name, brokerage, location, etc.)</li>
                <li>Set pro_type to "realtor"</li>
                <li>Set pipeline_type to "directory" and pipeline_stage to "directory"</li>
                <li>Add profile URLs, social media links, and qualification data</li>
              </ul>
            </div>

            <Button
              onClick={handleUpdate}
              disabled={processing}
              size="lg"
              className="w-full"
            >
              {processing ? (
                <>Processing...</>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Update Jason's Leads
                </>
              )}
            </Button>

            {results && (
              <div className="space-y-3">
                {results.success > 0 && (
                  <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                    <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                    <div>
                      <p className="font-semibold text-green-900 dark:text-green-100">
                        {results.success} leads successfully updated
                      </p>
                    </div>
                  </div>
                )}

                {results.errors > 0 && (
                  <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">
                        {results.errors} errors occurred
                      </p>
                    </div>
                  </div>
                )}

                <div className="bg-muted/50 p-4 rounded-lg max-h-96 overflow-y-auto">
                  <h4 className="font-semibold text-sm mb-2">Details:</h4>
                  <div className="space-y-1 text-sm font-mono">
                    {results.details.map((detail, i) => (
                      <div
                        key={i}
                        className={
                          detail.startsWith("✓")
                            ? "text-green-600 dark:text-green-400"
                            : "text-orange-600 dark:text-orange-400"
                        }
                      >
                        {detail}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UpdateJasonLeads;
