import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { importClients } from "@/utils/importClients";
import { Loader2, Upload, CheckCircle, XCircle } from "lucide-react";
import { CSVFieldMapper } from "@/components/admin/CSVFieldMapper";

const CLIENT_FIELDS = [
  { value: "first_name", label: "First Name", required: true },
  { value: "last_name", label: "Last Name", required: true },
  { value: "company_name", label: "Company Name", required: false },
  { value: "brokerage", label: "Brokerage", required: true },
  { value: "email", label: "Email", required: false },
  { value: "phone", label: "Phone", required: false },
  { value: "city", label: "City", required: false },
  { value: "state", label: "State", required: false },
  { value: "county", label: "County", required: false },
  { value: "zip", label: "Zip Code", required: false },
  { value: "years_experience", label: "Years Experience", required: false },
  { value: "yearly_sales", label: "Yearly Sales", required: false },
  { value: "avg_sale", label: "Average Sale", required: false },
  { value: "license_type", label: "License Type", required: false },
  { value: "languages", label: "Languages (comma-separated)", required: false },
  { value: "designations", label: "Designations (comma-separated)", required: false },
  { value: "skills", label: "Skills (comma-separated)", required: false },
  { value: "wants", label: "Wants", required: false },
  { value: "needs", label: "Needs", required: false },
  { value: "tags", label: "Tags (comma-separated)", required: false },
];

const ImportClients = () => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showMapper, setShowMapper] = useState(false);
  const { toast } = useToast();

  const parseCSVHeaders = (csvText: string): string[] => {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    return lines[0].split(',').map(h => h.trim());
  };

  const parseCSVWithMapping = (csvText: string, mapping: Record<string, string>): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const headers = lines[0].split(',').map(h => h.trim());
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row: any = {};
      
      // Map CSV columns to target fields
      Object.entries(mapping).forEach(([targetField, csvColumn]) => {
        if (csvColumn && csvColumn !== "__skip__") {
          const csvIndex = headers.indexOf(csvColumn);
          if (csvIndex !== -1) {
            row[targetField] = values[csvIndex] || '';
          }
        }
      });
      
      if (Object.keys(row).length > 0) {
        data.push(row);
      }
    }
    
    return data;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (50MB limit)
    const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB in bytes
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: "File too large",
        description: "File size must be less than 50MB",
        variant: "destructive",
      });
      return;
    }

    setResult(null);

    try {
      const text = await file.text();
      const headers = parseCSVHeaders(text);
      
      if (headers.length === 0) {
        toast({
          title: "Invalid CSV",
          description: "No headers found in CSV file",
          variant: "destructive",
        });
        return;
      }

      // Store CSV data and headers
      setCsvData([text]);
      setCsvHeaders(headers);
      
      // Auto-map fields with exact matches (case-insensitive)
      const autoMapping: Record<string, string> = {};
      CLIENT_FIELDS.forEach(field => {
        const matchingHeader = headers.find(h => 
          h.toLowerCase().replace(/[^a-z0-9]/g, '') === 
          field.label.toLowerCase().replace(/[^a-z0-9]/g, '')
        );
        if (matchingHeader) {
          autoMapping[field.value] = matchingHeader;
        }
      });
      
      setMapping(autoMapping);
      setShowMapper(true);
      
      toast({
        title: "CSV loaded",
        description: `Found ${headers.length} columns. Please map fields to continue.`,
      });
    } catch (error) {
      toast({
        title: "File read failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    }
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    setShowMapper(false);

    try {
      const mappedData = parseCSVWithMapping(csvData[0], mapping);
      
      toast({
        title: "Importing clients",
        description: `Found ${mappedData.length} clients to import...`,
      });

      const importResult = await importClients(mappedData, mapping);
      setResult(importResult);

      if (importResult.success > 0) {
        toast({
          title: "Import complete",
          description: `Successfully imported ${importResult.success} clients. ${importResult.failed} failed.`,
        });
      }
    } catch (error) {
      toast({
        title: "Import failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      });
    } finally {
      setImporting(false);
    }
  };

  const handleCancelMapping = () => {
    setShowMapper(false);
    setCsvData([]);
    setCsvHeaders([]);
    setMapping({});
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/30 to-background p-8">
      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle>Import Clients from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file with client data to import into the system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!showMapper && (
              <div className="flex items-center gap-4">
                <Button
                  disabled={importing}
                  onClick={() => document.getElementById('file-upload')?.click()}
                >
                  {importing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <Upload className="mr-2 h-4 w-4" />
                      Choose CSV File
                    </>
                  )}
                </Button>
                <input
                  id="file-upload"
                  type="file"
                  accept=".csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </div>
            )}

            {showMapper && (
              <CSVFieldMapper
                csvHeaders={csvHeaders}
                targetFields={CLIENT_FIELDS}
                mapping={mapping}
                onMappingChange={(field, column) => setMapping({ ...mapping, [field]: column })}
                onConfirm={handleConfirmImport}
                onCancel={handleCancelMapping}
              />
            )}

            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900">Successful</p>
                          <p className="text-2xl font-bold text-green-600">{result.success}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 border-red-200">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-900">Failed</p>
                          <p className="text-2xl font-bold text-red-600">{result.failed}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {result.errors.length > 0 && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">Import Errors</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {result.errors.map((error, index) => (
                          <p key={index} className="text-sm text-red-600">
                            {error}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportClients;
