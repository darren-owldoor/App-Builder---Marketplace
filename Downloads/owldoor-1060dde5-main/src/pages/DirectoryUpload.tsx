import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Upload, FileSpreadsheet, AlertCircle, CheckCircle, ArrowLeft, Download } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";
import { CSVFieldMapper } from "@/components/admin/CSVFieldMapper";
import { useNavigate } from "react-router-dom";

type NotificationOption = "magic-link" | "password-email" | "none";

const AGENT_FIELDS = [
  { value: "first_name", label: "First Name", required: true },
  { value: "last_name", label: "Last Name", required: true },
  { value: "email", label: "Email", required: true },
  { value: "phone", label: "Phone", required: true },
  { value: "company_name", label: "Company Name" },
  { value: "brokerage", label: "Brokerage" },
  { value: "specialization", label: "Specialization" },
  { value: "years_experience", label: "Years Experience" },
  { value: "license_type", label: "License Type" },
  { value: "yearly_sales", label: "Yearly Sales" },
  { value: "avg_sale", label: "Average Sale Price" },
  { value: "zip_codes", label: "Zip Codes (comma-separated)" },
  { value: "cities", label: "Cities (comma-separated)" },
  { value: "states", label: "States (comma-separated)" },
  { value: "counties", label: "Counties (comma-separated)" },
  { value: "provides", label: "Services Provided (comma-separated)" },
  { value: "website_url", label: "Website URL" },
  { value: "linkedin_url", label: "LinkedIn URL" },
  { value: "facebook_url", label: "Facebook URL" },
  { value: "instagram_url", label: "Instagram URL" },
  { value: "twitter_url", label: "Twitter URL" },
  { value: "languages", label: "Languages (comma-separated)" },
  { value: "designations", label: "Designations (comma-separated)" },
  { value: "skills", label: "Skills (comma-separated)" },
  { value: "notes", label: "Notes" },
  { value: "pro_type", label: "Pro Type (real_estate/mortgage)" },
];

const DirectoryUpload = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<{ success: number; errors: number } | null>(null);
  const [notificationOption, setNotificationOption] = useState<NotificationOption>("none");
  const [csvData, setCsvData] = useState<any[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [fieldMapping, setFieldMapping] = useState<Record<string, string>>({});
  const [showMapper, setShowMapper] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // Check file size (50MB limit)
      if (selectedFile.size > 50 * 1024 * 1024) {
        toast.error("File size exceeds 50MB limit");
        return;
      }
      // Check file type
      if (!selectedFile.name.endsWith('.csv')) {
        toast.error("Please upload a CSV file");
        return;
      }
      setFile(selectedFile);
      setResults(null);
      
      // Parse CSV to get headers and trigger mapping
      Papa.parse(selectedFile, {
        header: true,
        preview: 1,
        complete: (results) => {
          const headers = results.meta.fields || [];
          setCsvHeaders(headers);
          setShowMapper(true);
          
          // Auto-map matching fields
          const autoMapping: Record<string, string> = {};
          AGENT_FIELDS.forEach((field) => {
            const match = headers.find(h => 
              h.toLowerCase() === field.value.toLowerCase() ||
              h.toLowerCase().replace(/[_\s]/g, '') === field.value.toLowerCase().replace(/[_\s]/g, '')
            );
            if (match) {
              autoMapping[field.value] = match;
            }
          });
          setFieldMapping(autoMapping);
        },
      });
    }
  };

  const handleMappingChange = (field: string, csvColumn: string) => {
    setFieldMapping(prev => ({ ...prev, [field]: csvColumn }));
  };

  const handleCancelMapping = () => {
    setFile(null);
    setCsvData([]);
    setCsvHeaders([]);
    setFieldMapping({});
    setShowMapper(false);
    setResults(null);
  };

  const handleConfirmMapping = () => {
    if (!file) {
      toast.error("Please select a file first");
      return;
    }

    // Parse the full CSV with the confirmed mapping
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as any[];
        setCsvData(data);
        setShowMapper(false);
        handleUpload(data);
      },
    });
  };

  const handleExportTemplate = () => {
    const templateHeaders = AGENT_FIELDS.map(f => f.value).join(',');
    const sampleRow = [
      'John', 'Doe', 'john@example.com', '555-123-4567', 
      'Doe Realty Group', 'Keller Williams', 'real_estate', 
      '10', 'Broker', '5000000', '350000', '90210,90211', 
      'Beverly Hills,Los Angeles', 'CA', 'Los Angeles', 
      'Buyer Rep,Seller Rep,Luxury Homes', 'https://example.com', 
      'https://linkedin.com/in/johndoe', 'https://facebook.com/johndoe',
      'https://instagram.com/johndoe', 'https://twitter.com/johndoe',
      'English,Spanish', 'CRS,GRI', 'Negotiation,Marketing',
      'Top producer in luxury market', 'real_estate'
    ].join(',');
    
    const csvContent = `${templateHeaders}\n${sampleRow}`;
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'agent-directory-template.csv';
    a.click();
    window.URL.revokeObjectURL(url);
    toast.success("Template downloaded successfully");
  };

  const handleUpload = async (data: any[]) => {
    setUploading(true);
    setProgress(0);
    let successCount = 0;
    let errorCount = 0;

    try {
      const totalRows = data.length;

      for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        try {
          // Use field mapping to get values
          const getFieldValue = (field: string) => {
            const csvColumn = fieldMapping[field];
            return csvColumn && csvColumn !== "__skip__" ? row[csvColumn] : null;
          };

          const phone = getFieldValue("phone");
          const email = getFieldValue("email");
          const firstName = getFieldValue("first_name");
          const lastName = getFieldValue("last_name");
              
              // Use 7-digit phone as password
              const cleanPhone = phone?.replace(/\D/g, '') || '';
              const password = cleanPhone.slice(-7) || 'temp1234';

              // Generate random password if needed for email option
              const randomPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10);

              // Create user account first
              const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                  data: {
                    first_name: firstName,
                    last_name: lastName,
                    full_name: `${firstName} ${lastName}`,
                  }
                }
              });

              if (authError) throw authError;

              // Handle notifications based on option
              if (notificationOption === "magic-link" && authData.user) {
                // Send magic link via email
                try {
                  await supabase.auth.signInWithOtp({
                    email,
                    options: {
                      emailRedirectTo: `${window.location.origin}/agent-profile`,
                    }
                  });
                } catch (error) {
                  console.warn(`Could not send magic link to ${email}:`, error);
                }

                // TODO: Send SMS with magic link (requires SMS integration)
              } else if (notificationOption === "password-email" && authData.user) {
                // Update password to random one
                const { error: updateError } = await supabase.auth.admin.updateUserById(
                  authData.user.id,
                  { password: randomPassword }
                );

                if (!updateError) {
                  // TODO: Send email with plain text password via edge function
                  console.log(`Would send email to ${email} with password: ${randomPassword}`);
                }
              }
              // If "none", no notifications are sent

          // Map all CSV columns to agent fields using the field mapping
          const companyName = getFieldValue("company_name");
          const brokerage = getFieldValue("brokerage");
          const specialization = getFieldValue("specialization");
          const yearsExp = getFieldValue("years_experience");
          const licenseType = getFieldValue("license_type");
          const yearlySales = getFieldValue("yearly_sales");
          const avgSale = getFieldValue("avg_sale");
          const zipCodesStr = getFieldValue("zip_codes");
          const citiesStr = getFieldValue("cities");
          const statesStr = getFieldValue("states");
          const countiesStr = getFieldValue("counties");
          const providesStr = getFieldValue("provides");
          const websiteUrl = getFieldValue("website_url");
          const linkedinUrl = getFieldValue("linkedin_url");
          const facebookUrl = getFieldValue("facebook_url");
          const instagramUrl = getFieldValue("instagram_url");
          const twitterUrl = getFieldValue("twitter_url");
          const languagesStr = getFieldValue("languages");
          const designationsStr = getFieldValue("designations");
          const skillsStr = getFieldValue("skills");
          const notes = getFieldValue("notes");
          const proType = getFieldValue("pro_type");

          const agentData = {
            user_id: authData.user?.id,
            first_name: firstName,
            last_name: lastName,
            full_name: `${firstName} ${lastName}`,
            email,
            phone,
            company: companyName || null,
            brokerage: brokerage || null,
            specialization: specialization || null,
            years_experience: yearsExp ? parseInt(yearsExp) : null,
            license_type: licenseType || null,
            total_sales: yearlySales ? parseFloat(yearlySales) : null,
            average_sale_price: avgSale ? parseFloat(avgSale) : null,
            zip_codes: zipCodesStr ? zipCodesStr.split(',').map((z: string) => z.trim()) : [],
            cities: citiesStr ? citiesStr.split(',').map((c: string) => c.trim()) : [],
            states: statesStr ? statesStr.split(',').map((s: string) => s.trim()) : [],
            counties: countiesStr ? countiesStr.split(',').map((c: string) => c.trim()) : [],
            wants: providesStr ? providesStr.split(',').map((p: string) => p.trim()) : [],
            website_url: websiteUrl || null,
            linkedin_url: linkedinUrl || null,
            facebook_url: facebookUrl || null,
            instagram_url: instagramUrl || null,
            twitter_url: twitterUrl || null,
            languages: languagesStr ? languagesStr.split(',').map((l: string) => l.trim()) : [],
            certifications: designationsStr ? designationsStr.split(',').map((d: string) => d.trim()) : [],
            skills: skillsStr ? skillsStr.split(',').map((s: string) => s.trim()) : [],
            notes: notes || null,
            pro_type: proType || 'real_estate',
            pipeline_type: 'directory',
            pipeline_stage: 'active',
            source: 'directory_upload',
          };

          // Insert into pros table
          const { error } = await supabase
            .from('pros')
            .insert([agentData]);

          if (error) throw error;
          successCount++;
        } catch (error) {
          console.error('Error inserting row:', error);
          errorCount++;
        }

        // Update progress
        setProgress(Math.round(((i + 1) / totalRows) * 100));
      }

      setResults({ success: successCount, errors: errorCount });
      toast.success(`Upload complete! ${successCount} agents added, ${errorCount} errors`);
      setUploading(false);
      setFile(null);
      setCsvData([]);
      setCsvHeaders([]);
      setFieldMapping({});
    } catch (error: any) {
      console.error('Upload error:', error);
      toast.error(error.message || "Failed to upload file");
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <h1 className="text-4xl font-bold mb-2">Directory Upload</h1>
          <p className="text-muted-foreground">Upload CSV file to bulk import agent profiles (Max 50MB)</p>
        </div>

        {showMapper && csvHeaders.length > 0 && (
          <CSVFieldMapper
            csvHeaders={csvHeaders}
            targetFields={AGENT_FIELDS}
            mapping={fieldMapping}
            onMappingChange={handleMappingChange}
            onConfirm={handleConfirmMapping}
            onCancel={handleCancelMapping}
          />
        )}

        {!showMapper && (

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="h-5 w-5" />
              CSV File Upload
            </CardTitle>
            <CardDescription>
              Upload a CSV file with agent information. Required columns: first_name, last_name, email, phone
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <Label className="text-base font-semibold mb-3 block">Notification Options</Label>
                <RadioGroup value={notificationOption} onValueChange={(value) => setNotificationOption(value as NotificationOption)}>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="none" id="none" />
                    <Label htmlFor="none" className="flex-1 cursor-pointer font-normal">
                      <div className="font-medium">No Email or SMS</div>
                      <div className="text-sm text-muted-foreground">Default to phone number login (7-digit password)</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="magic-link" id="magic-link" />
                    <Label htmlFor="magic-link" className="flex-1 cursor-pointer font-normal">
                      <div className="font-medium">Send Magic Link</div>
                      <div className="text-sm text-muted-foreground">Email and SMS with magic link for instant access</div>
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
                    <RadioGroupItem value="password-email" id="password-email" />
                    <Label htmlFor="password-email" className="flex-1 cursor-pointer font-normal">
                      <div className="font-medium">Send Email with Password</div>
                      <div className="text-sm text-muted-foreground">Plain text email with randomly generated password</div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="csv-file">Select CSV File</Label>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportTemplate}
                  disabled={uploading}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Template
                </Button>
              </div>
              <Input
                id="csv-file"
                type="file"
                accept=".csv"
                onChange={handleFileSelect}
                disabled={uploading}
                className="cursor-pointer"
              />
              {file && !uploading && !showMapper && (
                <p className="text-sm text-muted-foreground mt-2">
                  Selected: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                </p>
              )}
            </div>

            {uploading && (
              <div className="space-y-2">
                <div className="w-full bg-secondary rounded-full h-2.5">
                  <div
                    className="bg-primary h-2.5 rounded-full transition-all duration-300"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-sm text-center text-muted-foreground">
                  Processing... {progress}%
                </p>
              </div>
            )}

            {results && (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                  <div>
                    <p className="font-semibold text-green-900 dark:text-green-100">
                      {results.success} agents successfully imported
                    </p>
                  </div>
                </div>
                {results.errors > 0 && (
                  <div className="flex items-center gap-2 p-4 bg-orange-50 dark:bg-orange-900/20 rounded-lg border border-orange-200 dark:border-orange-800">
                    <AlertCircle className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    <div>
                      <p className="font-semibold text-orange-900 dark:text-orange-100">
                        {results.errors} rows had errors
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg space-y-2">
              <h4 className="font-semibold text-sm">CSV Format Requirements:</h4>
              <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                <li>Required: first_name, last_name, email, phone</li>
                <li>Optional: company_name, brokerage, specialization, license_type</li>
                <li>Optional: years_experience, yearly_sales, avg_sale</li>
                <li>Optional: zip_codes, cities, states, counties (all comma-separated)</li>
                <li>Optional: provides, languages, designations, skills (comma-separated)</li>
                <li>Optional: website_url, linkedin_url, facebook_url, instagram_url, twitter_url</li>
                <li>Optional: notes, pro_type (real_estate or mortgage)</li>
                <li>Maximum file size: 50MB</li>
                <li>Download the template above for the correct format</li>
              </ul>
            </div>
          </CardContent>
        </Card>
        )}
      </div>
    </div>
  );
};

export default DirectoryUpload;
