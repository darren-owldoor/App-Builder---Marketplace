import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Phone, Search, Trash2, ToggleLeft, ToggleRight } from "lucide-react";

interface PhoneNumber {
  id: string;
  phone_number: string;
  client_id: string;
  active: boolean;
  assigned_at: string;
  clients?: {
    contact_name: string;
    company_name: string;
  };
}

interface Client {
  id: string;
  contact_name: string;
  company_name: string;
}

interface SearchResult {
  phoneNumber: string;
  friendlyName: string;
  locality: string;
  region: string;
}

export const AdminPhoneNumberManager = () => {
  const [phoneNumbers, setPhoneNumbers] = useState<PhoneNumber[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchPhoneNumbers();
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("id, contact_name, company_name")
        .order("company_name");

      if (error) throw error;
      setClients(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch clients: " + error.message);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from("client_phone_numbers")
        .select(`
          *,
          clients (
            contact_name,
            company_name
          )
        `)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error: any) {
      toast.error("Failed to fetch phone numbers: " + error.message);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter an area code");
      return;
    }

    const cleanedQuery = searchQuery.replace(/\D/g, "");

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-search-numbers", {
        body: { areaCode: cleanedQuery },
      });

      if (error) throw error;

      setSearchResults(data.availableNumbers || []);
      
      if (data.availableNumbers?.length === 0) {
        toast.info("No numbers found for this area code");
      }
    } catch (error: any) {
      toast.error("Search failed: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignNumber = async (phoneNumber: string) => {
    if (!selectedClientId) {
      toast.error("Please select a client first");
      return;
    }

    setLoading(true);
    try {
      // First, purchase the phone number from Twilio (this also configures webhooks)
      const { data: purchaseData, error: purchaseError } = await supabase.functions.invoke(
        "twilio-purchase-number",
        {
          body: { phoneNumber, clientId: selectedClientId },
        }
      );

      if (purchaseError) throw purchaseError;
      if (!purchaseData?.success) throw new Error(purchaseData?.error || "Failed to purchase number");

      // Then, insert the phone number assignment in our database
      const { error: insertError } = await supabase
        .from("client_phone_numbers")
        .insert({
          client_id: selectedClientId,
          phone_number: phoneNumber,
          active: true,
        });

      if (insertError) throw insertError;

      toast.success("Phone number purchased and assigned successfully!");

      fetchPhoneNumbers();
      setSearchResults([]);
      setSearchQuery("");
    } catch (error: any) {
      toast.error("Failed to assign number: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to remove this phone number?")) return;

    try {
      const { error } = await supabase
        .from("client_phone_numbers")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Phone number removed");
      fetchPhoneNumbers();
    } catch (error: any) {
      toast.error("Failed to remove number: " + error.message);
    }
  };

  const toggleActive = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from("client_phone_numbers")
        .update({ active: !currentStatus })
        .eq("id", id);

      if (error) throw error;

      toast.success(`Phone number ${!currentStatus ? "activated" : "deactivated"}`);
      fetchPhoneNumbers();
    } catch (error: any) {
      toast.error("Failed to update status: " + error.message);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Assign Phone Numbers to Clients</CardTitle>
          <CardDescription>Search for available Twilio numbers and assign them to clients</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Select Client</Label>
              <Select value={selectedClientId} onValueChange={setSelectedClientId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a client" />
                </SelectTrigger>
                <SelectContent>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.company_name || client.contact_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Area Code</Label>
              <Input
                placeholder="e.g., 415"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                maxLength={3}
              />
            </div>

            <div className="space-y-2">
              <Label>&nbsp;</Label>
              <Button onClick={handleSearch} disabled={loading} className="w-full">
                <Search className="w-4 h-4 mr-2" />
                Search Numbers
              </Button>
            </div>
          </div>

          {searchResults.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Available Numbers:</h3>
              <div className="grid gap-2">
                {searchResults.map((result) => (
                  <div
                    key={result.phoneNumber}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <p className="font-medium">{result.phoneNumber}</p>
                      <p className="text-sm text-muted-foreground">
                        {result.locality}, {result.region}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAssignNumber(result.phoneNumber)}
                      disabled={!selectedClientId || loading}
                    >
                      Assign
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Assigned Phone Numbers</CardTitle>
          <CardDescription>Manage all phone numbers assigned to clients</CardDescription>
        </CardHeader>
        <CardContent>
          {phoneNumbers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No phone numbers assigned yet</p>
          ) : (
            <div className="space-y-2">
              {phoneNumbers.map((number) => (
                <div
                  key={number.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <Phone className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{number.phone_number}</p>
                      <p className="text-sm text-muted-foreground">
                        {number.clients?.company_name || number.clients?.contact_name}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleActive(number.id, number.active)}
                    >
                      {number.active ? (
                        <ToggleRight className="w-4 h-4 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-4 h-4 text-muted-foreground" />
                      )}
                      <span className="ml-1">{number.active ? "Active" : "Inactive"}</span>
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(number.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
