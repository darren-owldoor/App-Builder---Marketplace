import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { importLeads } from "@/utils/importLeads";
import { Loader2, Upload, CheckCircle, XCircle, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CSVFieldMapper } from "@/components/admin/CSVFieldMapper";

const LEAD_FIELDS = [
  { value: "first_name", label: "First Name", required: false },
  { value: "last_name", label: "Last Name", required: false },
  { value: "full_name", label: "Full Name", required: false },
  { value: "phone", label: "Phone", required: true },
  { value: "email", label: "Email", required: false },
  { value: "full_address", label: "Full Address", required: false },
  { value: "address", label: "Street Address", required: false },
  { value: "city", label: "City", required: false },
  { value: "state", label: "State", required: false },
  { value: "county", label: "County", required: false },
  { value: "zip_code", label: "Zip Code", required: false },
  { value: "brokerage", label: "Brokerage", required: false },
  { value: "company", label: "Company", required: false },
  { value: "license_type", label: "License Type", required: false },
  { value: "transactions", label: "Transactions", required: false },
  { value: "experience", label: "Years Experience", required: false },
  { value: "motivation", label: "Motivation (1-10)", required: false },
  { value: "total_sales", label: "Total Sales", required: false },
  { value: "source", label: "Source", required: false },
  { value: "wants", label: "Wants (comma-separated)", required: false },
  { value: "skills", label: "Skills (comma-separated)", required: false },
  { value: "tags", label: "Tags (comma-separated)", required: false },
  { value: "profile_url", label: "Profile URL", required: false },
  { value: "image_url", label: "Image URL", required: false },
];

const ImportLeads = () => {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; failed: number; errors: string[] } | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [showMapper, setShowMapper] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const parseCSVHeaders = (csvText: string): string[] => {
    const lines = csvText.split('\n');
    if (lines.length === 0) return [];
    
    // Handle quoted fields
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    return parseLine(lines[0]);
  };

  const parseCSVWithMapping = (csvText: string, mapping: Record<string, string>): any[] => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) return [];
    
    const parseLine = (line: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    };
    
    const headers = parseLine(lines[0]);
    const data: any[] = [];
    
    for (let i = 1; i < lines.length; i++) {
      const values = parseLine(lines[i]);
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
      LEAD_FIELDS.forEach(field => {
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
        title: "Importing agent leads",
        description: `Found ${mappedData.length} leads to import...`,
      });

      const importResult = await importLeads(mappedData, mapping);
      setResult(importResult);

      if (importResult.success > 0) {
        toast({
          title: "Import complete",
          description: `Successfully imported ${importResult.success} leads. ${importResult.failed} failed.`,
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
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/admin")} className="mb-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Import Agent Leads from CSV</CardTitle>
            <CardDescription>
              Upload a CSV file with agent lead data to import into the system
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
                targetFields={LEAD_FIELDS}
                mapping={mapping}
                onMappingChange={(field, column) => setMapping({ ...mapping, [field]: column })}
                onConfirm={handleConfirmImport}
                onCancel={handleCancelMapping}
              />
            )}

            {result && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="text-sm font-medium text-green-900 dark:text-green-100">Successful</p>
                          <p className="text-2xl font-bold text-green-600">{result.success}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800">
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-2">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="text-sm font-medium text-red-900 dark:text-red-100">Failed</p>
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
                      <div className="max-h-60 overflow-y-auto space-y-1">
                        {result.errors.map((error, index) => (
                          <p key={index} className="text-xs text-muted-foreground">
                            {error}
                          </p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-sm">CSV Format Requirements</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-xs text-muted-foreground space-y-2">
                  <p>Your CSV file should include these columns:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li><strong>Full Name</strong> (required)</li>
                    <li><strong>Phone</strong> (required)</li>
                    <li>Email (optional - will be auto-generated if missing)</li>
                    <li>Transactions</li>
                    <li>Years Exp</li>
                    <li>City</li>
                    <li>State</li>
                    <li>1-10 Interest</li>
                    <li>Yearly Sales</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default ImportLeads;
