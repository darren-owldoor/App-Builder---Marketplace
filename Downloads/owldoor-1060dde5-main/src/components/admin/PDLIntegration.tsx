import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle, Search, Database } from "lucide-react";

export const PDLIntegration = () => {
  const [loading, setLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Lead/Person enrichment test
  const [leadEmail, setLeadEmail] = useState("");
  const [leadPhone, setLeadPhone] = useState("");
  const [leadName, setLeadName] = useState("");

  // Client/Company enrichment test
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");

  const handleTestPersonEnrichment = async () => {
    if (!leadEmail && !leadPhone && !leadName) {
      toast.error("Please provide at least one field (email, phone, or name)");
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const params: any = {};
      if (leadEmail) params.email = leadEmail;
      if (leadPhone) params.phone = leadPhone;
      if (leadName) params.name = leadName;

      const { data, error } = await supabase.functions.invoke('pdl-enrich', {
        body: { action: 'enrich', type: 'person', params }
      });

      if (error) throw error;

      setTestResult(data);
      
      if (data?.status === 200 && data?.data) {
        toast.success("Person enrichment successful!");
      } else if (data?.status === 404) {
        toast.info("No data found for this person in PDL database");
      } else {
        toast.error("Enrichment failed");
      }
    } catch (error: any) {
      console.error('Person enrichment error:', error);
      toast.error(error.message || "Failed to enrich person data");
    } finally {
      setLoading(false);
    }
  };

  const handleTestCompanyEnrichment = async () => {
    if (!companyName && !companyWebsite) {
      toast.error("Please provide company name or website");
      return;
    }

    setLoading(true);
    setTestResult(null);

    try {
      const params: any = {};
      if (companyName) params.name = companyName;
      if (companyWebsite) params.website = companyWebsite;

      const { data, error } = await supabase.functions.invoke('pdl-enrich', {
        body: { action: 'enrich', type: 'company', params }
      });

      if (error) throw error;

      setTestResult(data);
      
      if (data?.status === 200 && data?.data) {
        toast.success("Company enrichment successful!");
      } else if (data?.status === 404) {
        toast.info("No data found for this company in PDL database");
      } else {
        toast.error("Enrichment failed");
      }
    } catch (error: any) {
      console.error('Company enrichment error:', error);
      toast.error(error.message || "Failed to enrich company data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <h2 className="text-2xl font-bold mb-4">PeopleDataLabs (PDL) Integration</h2>
        <p className="text-muted-foreground mb-6">
          Configure and test enrichment for leads and clients using PeopleDataLabs API
        </p>

        <div className="space-y-4 mb-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Lead (Person) Field Mapping
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Our Field</span>
                  <span className="text-muted-foreground">PDL Field</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <code>email</code>
                  <code>→ email</code>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <code>phone</code>
                  <code>→ phone</code>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <code>first_name + last_name</code>
                  <code>→ name</code>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <code>company</code>
                  <code>→ company</code>
                </div>
                <div className="flex justify-between py-1">
                  <code>profile_url</code>
                  <code>→ profile</code>
                </div>
              </div>
            </div>

            <div className="border rounded-lg p-4">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Database className="w-4 h-4" />
                Client (Company) Field Mapping
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Our Field</span>
                  <span className="text-muted-foreground">PDL Field</span>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <code>company_name</code>
                  <code>→ name</code>
                </div>
                <div className="flex justify-between py-1 border-b">
                  <code>email</code>
                  <code>→ email</code>
                </div>
                <div className="flex justify-between py-1">
                  <code>profile_url</code>
                  <code>→ profile</code>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="person" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="person">Test Person Enrichment</TabsTrigger>
            <TabsTrigger value="company">Test Company Enrichment</TabsTrigger>
          </TabsList>

          <TabsContent value="person" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="leadName">Full Name</Label>
                <Input
                  id="leadName"
                  placeholder="John Doe"
                  value={leadName}
                  onChange={(e) => setLeadName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="leadEmail">Email</Label>
                <Input
                  id="leadEmail"
                  type="email"
                  placeholder="[email protected]"
                  value={leadEmail}
                  onChange={(e) => setLeadEmail(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="leadPhone">Phone</Label>
                <Input
                  id="leadPhone"
                  placeholder="+1-555-123-4567"
                  value={leadPhone}
                  onChange={(e) => setLeadPhone(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleTestPersonEnrichment} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Test Person Enrichment
                </>
              )}
            </Button>
          </TabsContent>

          <TabsContent value="company" className="space-y-4">
            <div className="grid gap-4">
              <div>
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  placeholder="Acme Inc"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="companyWebsite">Website</Label>
                <Input
                  id="companyWebsite"
                  placeholder="acme.com"
                  value={companyWebsite}
                  onChange={(e) => setCompanyWebsite(e.target.value)}
                />
              </div>
            </div>
            <Button onClick={handleTestCompanyEnrichment} disabled={loading} className="w-full">
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Test Company Enrichment
                </>
              )}
            </Button>
          </TabsContent>
        </Tabs>

        {testResult && (
          <Card className="mt-6 p-4 bg-muted">
            <div className="flex items-center gap-2 mb-3">
              {testResult.status === 200 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <XCircle className="w-5 h-5 text-amber-500" />
              )}
              <h3 className="font-semibold">Test Result</h3>
              <Badge variant={testResult.status === 200 ? "default" : "secondary"}>
                Status: {testResult.status}
              </Badge>
            </div>
            <pre className="text-xs overflow-auto max-h-96 bg-background p-4 rounded">
              {JSON.stringify(testResult, null, 2)}
            </pre>
          </Card>
        )}
      </Card>

      <Card className="p-6 bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Database className="w-5 h-5" />
          Automatic Enrichment
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Enrichment automatically triggers when:
        </p>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          <li>A client makes a payment (enriches client/company data)</li>
          <li>A lead reaches "qualifying" stage (enriches lead/person data)</li>
        </ul>
        <p className="text-sm text-muted-foreground mt-4">
          The enriched data is stored in the database and 404 responses (no data found) are handled gracefully.
        </p>
      </Card>
    </div>
  );
};
