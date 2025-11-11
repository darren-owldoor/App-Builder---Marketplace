import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Database, Users, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const PDLEnrichment = () => {
  const [isEnriching, setIsEnriching] = useState(false);
  const [recordId, setRecordId] = useState("");
  const [recordType, setRecordType] = useState<"person" | "company">("person");
  const [searchParams, setSearchParams] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    company: "",
  });

  const handleEnrichById = async () => {
    if (!recordId) {
      toast.error("Please enter a record ID");
      return;
    }

    setIsEnriching(true);
    try {
      // First, get the record data
      const table = recordType === "person" ? "pros" : "clients";
      const { data: record, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .eq("id", recordId)
        .single();

      if (fetchError || !record) {
        toast.error("Record not found");
        setIsEnriching(false);
        return;
      }

      // Build enrichment params based on available data
      const params: any = {};
      if (recordType === "person") {
        if (record.email) params.email = record.email;
        if (record.phone) params.phone = record.phone;
        if ('first_name' in record && record.first_name) params.first_name = record.first_name;
        if ('last_name' in record && record.last_name) params.last_name = record.last_name;
        if ('company' in record && record.company) params.company = record.company;
      } else {
        if ('company_name' in record && record.company_name) params.name = record.company_name;
        if (record.email) params.website = record.email.split('@')[1];
      }

      const { data, error } = await supabase.functions.invoke('pdl-enrich', {
        body: {
          action: 'enrich',
          type: recordType,
          params,
          recordId
        }
      });

      if (error) {
        console.error('Enrichment error:', error);
        toast.error(`Enrichment failed: ${error.message}`);
      } else if (data?.status === 200) {
        toast.success(`Successfully enriched ${recordType}!`);
        setRecordId("");
      } else {
        toast.warning(`No additional data found for this ${recordType}`);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to enrich record');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleSearch = async () => {
    setIsEnriching(true);
    try {
      const { data, error } = await supabase.functions.invoke('pdl-enrich', {
        body: {
          action: 'search',
          type: recordType,
          params: searchParams
        }
      });

      if (error) {
        toast.error(`Search failed: ${error.message}`);
      } else if (data?.status === 200 && data?.data?.length > 0) {
        toast.success(`Found ${data.data.length} results`);
        console.log('Search results:', data.data);
        // You can display results in a modal or table here
      } else {
        toast.info('No results found');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Search failed');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleTestEnrich = async () => {
    setIsEnriching(true);
    try {
      toast.info("Starting test enrichment of top 10 leads and 10 clients...");
      
      // Get top 10 pros with most data (those with email or phone)
      const { data: leads, error: leadsError } = await supabase
        .from("pros")
        .select("*")
        .not("email", "is", null)
        .limit(10);

      if (leadsError) throw leadsError;

      // Get top 10 clients with most data
      const { data: clients, error: clientsError } = await supabase
        .from("clients")
        .select("*")
        .not("email", "is", null)
        .limit(10);

      if (clientsError) throw clientsError;

      let successCount = 0;
      let failCount = 0;

      // Enrich leads
      if (leads && leads.length > 0) {
        for (const lead of leads) {
          try {
            const params: any = {};
            if (lead.email) params.email = lead.email;
            else if (lead.phone) params.phone = lead.phone;
            else continue;

            const { data } = await supabase.functions.invoke('pdl-enrich', {
              body: {
                action: 'enrich',
                type: 'person',
                params,
                recordId: lead.id
              }
            });

            if (data?.status === 200) {
              successCount++;
              console.log(`Enriched lead: ${lead.full_name}`);
            } else {
              failCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            failCount++;
            console.error(`Error enriching lead ${lead.id}:`, error);
          }
        }
      }

      // Enrich clients
      if (clients && clients.length > 0) {
        for (const client of clients) {
          try {
            const params: any = {};
            if ('company_name' in client && client.company_name) {
              params.name = client.company_name;
            } else if (client.email) {
              params.email = client.email;
            } else continue;

            const { data } = await supabase.functions.invoke('pdl-enrich', {
              body: {
                action: 'enrich',
                type: 'company',
                params,
                recordId: client.id
              }
            });

            if (data?.status === 200) {
              successCount++;
              console.log(`Enriched client: ${client.company_name}`);
            } else {
              failCount++;
            }

            await new Promise(resolve => setTimeout(resolve, 200));
          } catch (error) {
            failCount++;
            console.error(`Error enriching client ${client.id}:`, error);
          }
        }
      }

      toast.success(`Test enrichment complete: ${successCount} success, ${failCount} failed or no data`);
    } catch (error) {
      console.error('Test enrichment error:', error);
      toast.error('Test enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleBatchEnrich = async () => {
    setIsEnriching(true);
    try {
      const table = recordType === "person" ? "pros" : "clients";
      
      // Get records that haven't been enriched recently (e.g., no PDL data in notes/preferences)
      const { data: records, error: fetchError } = await supabase
        .from(table)
        .select("*")
        .limit(50); // Limit batch size

      if (fetchError || !records || records.length === 0) {
        toast.info("No records to enrich");
        setIsEnriching(false);
        return;
      }

      toast.info(`Starting batch enrichment of ${records.length} ${recordType}s...`);
      
      let successCount = 0;
      let failCount = 0;

      for (const record of records) {
        try {
          const params: any = {};
          if (recordType === "person") {
            if (record.email) params.email = record.email;
            else if (record.phone) params.phone = record.phone;
            else continue; // Skip if no email or phone
          } else {
            if ('company_name' in record && record.company_name) params.name = record.company_name;
            else continue;
          }

          const { data } = await supabase.functions.invoke('pdl-enrich', {
            body: {
              action: 'enrich',
              type: recordType,
              params,
              recordId: record.id
            }
          });

          if (data?.status === 200) {
            successCount++;
          } else {
            failCount++;
          }

          // Rate limiting: wait 100ms between requests
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          failCount++;
          console.error(`Error enriching record ${record.id}:`, error);
        }
      }

      toast.success(`Batch enrichment complete: ${successCount} success, ${failCount} failed`);
    } catch (error) {
      console.error('Batch enrichment error:', error);
      toast.error('Batch enrichment failed');
    } finally {
      setIsEnriching(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Database className="h-5 w-5" />
          PeopleDataLabs Enrichment
        </CardTitle>
        <CardDescription>
          Enrich lead and client data with comprehensive business intelligence
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="enrich" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="enrich">Enrich by ID</TabsTrigger>
            <TabsTrigger value="search">Search</TabsTrigger>
            <TabsTrigger value="batch">Batch Enrich</TabsTrigger>
            <TabsTrigger value="test">Test</TabsTrigger>
          </TabsList>

          <TabsContent value="enrich" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Record Type</Label>
                <Select value={recordType} onValueChange={(value: "person" | "company") => setRecordType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Person (Lead)
                      </div>
                    </SelectItem>
                    <SelectItem value="company">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Company (Client)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Record ID</Label>
                <Input
                  placeholder="Enter UUID of lead or client"
                  value={recordId}
                  onChange={(e) => setRecordId(e.target.value)}
                />
              </div>

              <Button onClick={handleEnrichById} disabled={isEnriching} className="w-full">
                {isEnriching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Enrich Record
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="search" className="space-y-4">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>First Name</Label>
                  <Input
                    value={searchParams.first_name}
                    onChange={(e) => setSearchParams({ ...searchParams, first_name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Last Name</Label>
                  <Input
                    value={searchParams.last_name}
                    onChange={(e) => setSearchParams({ ...searchParams, last_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={searchParams.email}
                  onChange={(e) => setSearchParams({ ...searchParams, email: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Phone</Label>
                <Input
                  value={searchParams.phone}
                  onChange={(e) => setSearchParams({ ...searchParams, phone: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <Label>Company</Label>
                <Input
                  value={searchParams.company}
                  onChange={(e) => setSearchParams({ ...searchParams, company: e.target.value })}
                />
              </div>

              <Button onClick={handleSearch} disabled={isEnriching} className="w-full">
                {isEnriching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Search People
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="batch" className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Record Type</Label>
                <Select value={recordType} onValueChange={(value: "person" | "company") => setRecordType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="person">
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Leads (People)
                      </div>
                    </SelectItem>
                    <SelectItem value="company">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4" />
                        Clients (Companies)
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium mb-2">Batch Enrichment</p>
                <p className="text-muted-foreground">
                  This will enrich up to 50 {recordType === "person" ? "leads" : "clients"} with additional data from PeopleDataLabs.
                  The process may take several minutes.
                </p>
              </div>

              <Button onClick={handleBatchEnrich} disabled={isEnriching} className="w-full" variant="default">
                {isEnriching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Start Batch Enrichment
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="test" className="space-y-4">
            <div className="space-y-4">
              <div className="rounded-lg bg-muted p-4 text-sm">
                <p className="font-medium mb-2">Test Enrichment</p>
                <p className="text-muted-foreground">
                  This will enrich the top 10 leads and 10 clients with the most data (those with email/phone).
                  Use this to test the PeopleDataLabs integration.
                </p>
              </div>

              <Button onClick={handleTestEnrich} disabled={isEnriching} className="w-full" variant="default">
                {isEnriching && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Run Test Enrichment (10 + 10)
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};
