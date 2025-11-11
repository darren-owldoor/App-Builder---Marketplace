import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Mail, Phone, MapPin, Building2, CreditCard, Award, Edit, Check, X, Users, DollarSign, ShoppingCart, Search, Trash2, ToggleLeft, ToggleRight, MessageSquare, Database, ExternalLink, Circle } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { EnrichedDataModal } from "@/components/admin/EnrichedDataModal";

interface SearchResult {
  phoneNumber: string;
  locality: string;
  region: string;
}

const ClientDetail = () => {
  const { clientId } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [currentPackage, setCurrentPackage] = useState<any>(null);
  const [leadStats, setLeadStats] = useState<any>(null);
  const [phoneNumbers, setPhoneNumbers] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [aiChats, setAiChats] = useState<any[]>([]);
  const [selectedChat, setSelectedChat] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // Editing states
  const [editingField, setEditingField] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<any>({});
  
  // Edit all fields dialog
  const [editAllDialogOpen, setEditAllDialogOpen] = useState(false);
  const [allFieldsEditValues, setAllFieldsEditValues] = useState<any>({});
  
  // Phone number management states
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("twilio");
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState(false);
  const [enriching, setEnriching] = useState(false);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [showEnrichedData, setShowEnrichedData] = useState(false);
  const [isEnriched, setIsEnriched] = useState(false);

  useEffect(() => {
    if (clientId) {
      fetchClientDetails();
      fetchLeadStats();
      fetchPhoneNumbers();
      fetchPackages();
      fetchAiChats();
    }
  }, [clientId]);

  const fetchClientDetails = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select(`
          *,
          pricing_packages (
            id,
            name,
            monthly_cost,
            credits_included
          )
        `)
        .eq("id", clientId)
        .maybeSingle();

      if (clientError) throw clientError;
      if (!clientData) {
        setLoading(false);
        return;
      }
      
      setClient(clientData);
      setEditValues(clientData);

      if (clientData.current_package_id) {
        setCurrentPackage(clientData.pricing_packages);
      }

      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", clientData.user_id)
        .maybeSingle();

      setProfile(profileData);
    } catch (error) {
      console.error("Failed to fetch client details:", error);
      toast.error("Failed to load client details");
    } finally {
      setLoading(false);
    }
  };

  const fetchLeadStats = async () => {
    try {
      const { data, error } = await supabase
        .from("matches")
        .select("status, purchase_amount")
        .eq("client_id", clientId);

      if (error) throw error;

      const purchased = data?.filter(m => m.status === "purchased") || [];
      const totalSpent = purchased.reduce((sum, m) => sum + (m.purchase_amount || 0), 0);

      setLeadStats({
        totalPurchased: purchased.length,
        totalSpent,
        totalMatches: data?.length || 0,
      });
    } catch (error) {
      console.error("Failed to fetch lead stats:", error);
    }
  };

  const fetchPhoneNumbers = async () => {
    try {
      const { data, error } = await supabase
        .from("client_phone_numbers")
        .select("*")
        .eq("client_id", clientId)
        .order("assigned_at", { ascending: false });

      if (error) throw error;
      setPhoneNumbers(data || []);
    } catch (error: any) {
      console.error("Failed to fetch phone numbers:", error);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_packages")
        .select("*")
        .eq("active", true)
        .order("monthly_cost");

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      console.error("Failed to fetch packages:", error);
    }
  };

  const fetchAiChats = async () => {
    try {
      const { data, error } = await supabase
        .from("ai_conversation_logs")
        .select("*")
        .eq("client_id", clientId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      
      // Group by date for summaries
      const grouped = (data || []).reduce((acc: any, log: any) => {
        const date = new Date(log.created_at).toLocaleDateString();
        if (!acc[date]) {
          acc[date] = {
            date,
            logs: [],
            summary: ""
          };
        }
        acc[date].logs.push(log);
        return acc;
      }, {});

      // Create summaries
      const chatsArray = Object.values(grouped).map((group: any) => {
        const messageCount = group.logs.length;
        const intents = [...new Set(group.logs.map((l: any) => l.intent_detected).filter(Boolean))];
        group.summary = `${messageCount} messages${intents.length > 0 ? ` - ${intents.join(", ")}` : ""}`;
        return group;
      });

      setAiChats(chatsArray);
    } catch (error: any) {
      console.error("Failed to fetch AI chats:", error);
    }
  };

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const params: any = {};
      if (client.company_name) {
        params.name = client.company_name;
      } else if (client.email) {
        params.email = client.email;
      } else {
        toast.error("Need company name or email to enrich");
        setEnriching(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('pdl-enrich', {
        body: {
          action: 'enrich',
          type: 'company',
          params,
          recordId: clientId
        }
      });

      if (error) {
        toast.error(`Enrichment failed: ${error.message}`);
      } else if (data?.status === 200 && data?.data) {
        setEnrichedData(data.data);
        setIsEnriched(true);
        toast.success('Successfully enriched client!');
        setShowEnrichedData(true);
        fetchClientDetails(); // Refresh to show updated data
      } else {
        toast.warning('No additional data found');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to enrich client');
    } finally {
      setEnriching(false);
    }
  };

  const checkIfEnriched = () => {
    // Check if client has PDL enrichment data in preferences
    if (client?.preferences?.pdl_enrichment) {
      setIsEnriched(true);
      setEnrichedData(client.preferences.pdl_enrichment);
    }
  };

  useEffect(() => {
    if (client) {
      checkIfEnriched();
    }
  }, [client]);

  const handleEdit = (field: string) => {
    setEditingField(field);
  };

  const handleSave = async (field: string) => {
    try {
      let updateData: any = { [field]: editValues[field] };
      
      // If updating package, fetch the new package details
      if (field === "current_package_id") {
        const pkg = packages.find(p => p.id === editValues[field]);
        if (pkg) setCurrentPackage(pkg);
      }

      const { error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", clientId);

      if (error) throw error;

      setClient({ ...client, [field]: editValues[field] });
      setEditingField(null);
      toast.success("Updated successfully");
    } catch (error: any) {
      toast.error("Failed to update: " + error.message);
    }
  };

  const handleCancel = () => {
    setEditValues({ ...client });
    setEditingField(null);
  };

  const handleOpenEditAllDialog = () => {
    setAllFieldsEditValues({
      // Basic Info
      email: client.email || "",
      contact_name: client.contact_name || "",
      company_name: client.company_name || "",
      first_name: profile?.first_name || "",
      last_name: profile?.last_name || "",
      phone: client.phone || "",
      
      // Business Info
      brokerage: client.brokerage || "",
      client_type: client.client_type || "",
      license_type: client.license_type || "",
      years_experience: client.years_experience || null,
      yearly_sales: client.yearly_sales || null,
      avg_sale: client.avg_sale || null,
      
      // Package & Credits
      current_package_id: client.current_package_id || "",
      credits_balance: client.credits_balance || 0,
      credits_used: client.credits_used || 0,
      
      // Location Arrays
      cities: Array.isArray(client.cities) ? client.cities.join(", ") : "",
      states: Array.isArray(client.states) ? client.states.join(", ") : "",
      zip_codes: Array.isArray(client.zip_codes) ? client.zip_codes.join(", ") : "",
      county: client.county || "",
      
      // Skills & Qualifications
      designations: Array.isArray(client.designations) ? client.designations.join(", ") : "",
      languages: Array.isArray(client.languages) ? client.languages.join(", ") : "",
      skills: Array.isArray(client.skills) ? client.skills.join(", ") : "",
      
      // What office provides to agents
      provides: client.provides || "",
      tags: Array.isArray(client.tags) ? client.tags.join(", ") : "",
      
      // Status
      active: client.active ?? true,
      profile_completed: client.profile_completed ?? false,
    });
    setEditAllDialogOpen(true);
  };

  const handleSaveAllFields = async () => {
    try {
      // Parse array fields from comma-separated strings
      const cities = allFieldsEditValues.cities ? allFieldsEditValues.cities.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const states = allFieldsEditValues.states ? allFieldsEditValues.states.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const zip_codes = allFieldsEditValues.zip_codes ? allFieldsEditValues.zip_codes.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const designations = allFieldsEditValues.designations ? allFieldsEditValues.designations.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const languages = allFieldsEditValues.languages ? allFieldsEditValues.languages.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const skills = allFieldsEditValues.skills ? allFieldsEditValues.skills.split(",").map((s: string) => s.trim()).filter(Boolean) : [];
      const tags = allFieldsEditValues.tags ? allFieldsEditValues.tags.split(",").map((s: string) => s.trim()).filter(Boolean) : [];

      // Update clients table
      const { error: clientError } = await supabase
        .from("clients")
        .update({
          email: allFieldsEditValues.email,
          contact_name: allFieldsEditValues.contact_name,
          company_name: allFieldsEditValues.company_name,
          phone: allFieldsEditValues.phone,
          brokerage: allFieldsEditValues.brokerage,
          client_type: allFieldsEditValues.client_type,
          license_type: allFieldsEditValues.license_type,
          years_experience: allFieldsEditValues.years_experience,
          yearly_sales: allFieldsEditValues.yearly_sales,
          avg_sale: allFieldsEditValues.avg_sale,
          current_package_id: allFieldsEditValues.current_package_id || null,
          credits_balance: allFieldsEditValues.credits_balance,
          credits_used: allFieldsEditValues.credits_used,
          cities,
          states,
          zip_codes,
          county: allFieldsEditValues.county,
          designations,
          languages,
          skills,
          wants: allFieldsEditValues.wants,
          needs: allFieldsEditValues.needs,
          tags,
          active: allFieldsEditValues.active,
          profile_completed: allFieldsEditValues.profile_completed,
        })
        .eq("id", clientId);

      if (clientError) throw clientError;

      // Update profiles table
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          email: allFieldsEditValues.email,
          first_name: allFieldsEditValues.first_name,
          last_name: allFieldsEditValues.last_name,
          full_name: `${allFieldsEditValues.first_name} ${allFieldsEditValues.last_name}`.trim(),
        })
        .eq("id", client.user_id);

      if (profileError) throw profileError;

      toast.success("All fields updated successfully");
      setEditAllDialogOpen(false);
      fetchClientDetails();
    } catch (error: any) {
      toast.error("Failed to update fields: " + error.message);
    }
  };

  const handleSearchNumbers = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter an area code");
      return;
    }

    const cleanedQuery = searchQuery.replace(/\D/g, "");
    if (cleanedQuery.length < 3) {
      toast.error("Please enter at least a 3-digit area code");
      return;
    }

    setSearching(true);
    try {
      const { data, error } = await supabase.functions.invoke("twilio-search-numbers", {
        body: { areaCode: cleanedQuery.substring(0, 3) },
      });

      if (error) throw error;

      setSearchResults(data.availableNumbers || []);
      
      if (data.availableNumbers?.length === 0) {
        toast.info("No numbers found for this area code");
      }
    } catch (error: any) {
      toast.error("Search failed: " + error.message);
    } finally {
      setSearching(false);
    }
  };

  const handleAssignNumber = async (phoneNumber: string) => {
    setAdding(true);
    try {
      // First, purchase the phone number from Twilio (this also configures webhooks)
      const { data: purchaseData, error: purchaseError } = await supabase.functions.invoke(
        "twilio-purchase-number",
        {
          body: { phoneNumber, clientId },
        }
      );

      if (purchaseError) throw purchaseError;
      if (!purchaseData?.success) throw new Error(purchaseData?.error || "Failed to purchase number");

      // Then, insert the phone number assignment in our database
      const { error: insertError } = await supabase
        .from("client_phone_numbers")
        .insert({
          client_id: clientId,
          phone_number: phoneNumber,
          provider: selectedProvider,
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
      setAdding(false);
    }
  };

  const handleDeleteNumber = async (id: string) => {
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

  const toggleNumberActive = async (id: string, currentStatus: boolean) => {
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

  const getProviderDisplay = (provider: string) => {
    switch (provider) {
      case "twilio": return "Twilio";
      case "twilio_primary": return "Main Twilio";
      case "twilio_backup": return "Twilio Backup";
      case "messagebird": return "MessageBird";
      default: return provider;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">Loading client details...</div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-8">Client not found</div>
          <Button onClick={() => navigate("/admin")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <Button onClick={() => navigate("/admin")} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Button>
          <div className="flex gap-2">
            {isEnriched ? (
              <Button onClick={() => setShowEnrichedData(true)} variant="outline">
                <Database className="mr-2 h-4 w-4" />
                View Enriched Data
              </Button>
            ) : (
              <Button onClick={handleEnrich} disabled={enriching} variant="outline">
                <Database className="mr-2 h-4 w-4" />
                {enriching ? "Enriching..." : "Enrich"}
              </Button>
            )}
            <Button onClick={handleOpenEditAllDialog} variant="default">
              <Edit className="mr-2 h-4 w-4" />
              Edit All Fields
            </Button>
          </div>
        </div>

        {/* Header Card */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-full bg-gradient-primary flex items-center justify-center text-white text-2xl font-bold">
                  {client.company_name?.[0]?.toUpperCase() || client.contact_name?.[0]?.toUpperCase() || "C"}
                </div>
                <div>
                  <CardTitle className="text-2xl">{client.company_name}</CardTitle>
                  <p className="text-muted-foreground">{client.contact_name}</p>
                </div>
              </div>
              <Badge variant={client.active ? "default" : "secondary"}>
                {client.active ? "Active" : "Inactive"}
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Auto-Buy Eligibility Status */}
        <Card className={`border-2 ${client.active && client.credits_balance > 0 ? 'border-green-500 bg-green-500/5' : 'border-red-500 bg-red-500/5'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-2 px-4 py-3 rounded-lg bg-background">
                <Circle 
                  className={`h-12 w-12 ${client.active && client.credits_balance > 0 ? 'text-green-500' : 'text-red-500'} fill-current`}
                />
                <span className={`text-sm font-bold ${client.active && client.credits_balance > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {client.active && client.credits_balance > 0 ? "AUTO-BUY READY" : "NOT READY"}
                </span>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-lg mb-2">Zapier Auto-Purchase Eligibility</h3>
                <div className="space-y-1 text-sm">
                  <div className="flex items-center gap-2">
                    {client.active ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span>{client.active ? "Account is active" : "Account is inactive"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.credits_balance > 0 ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-red-500" />
                    )}
                    <span>
                      {client.credits_balance > 0 
                        ? `Has ${client.credits_balance} credits available` 
                        : "No credits available"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {client.has_payment_method ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <X className="h-4 w-4 text-yellow-500" />
                    )}
                    <span>
                      {client.has_payment_method 
                        ? "Payment method on file" 
                        : "No payment method (optional if has credits)"}
                    </span>
                  </div>
                </div>
                {client.active && client.credits_balance > 0 ? (
                  <div className="mt-3 text-sm font-medium text-green-600">
                    ✓ This client will automatically purchase all Zapier imports
                  </div>
                ) : (
                  <div className="mt-3 text-sm font-medium text-red-600">
                    ⚠️ Zapier imports will create matches but will NOT auto-purchase
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Contact Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Email</Label>
                {editingField === "email" ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="email"
                      autoComplete="email"
                      value={editValues.email || ""}
                      onChange={(e) => setEditValues({ ...editValues, email: e.target.value })}
                    />
                    <Button size="sm" onClick={() => handleSave("email")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span>{client.email}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit("email")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Name</Label>
                {editingField === "contact_name" ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={editValues.contact_name}
                      onChange={(e) => setEditValues({ ...editValues, contact_name: e.target.value })}
                    />
                    <Button size="sm" onClick={() => handleSave("contact_name")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span>{client.contact_name || "Not set"}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit("contact_name")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Public Profile URL</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    value={`${window.location.origin}/company/${client.id}`}
                    readOnly
                    className="text-sm"
                  />
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(`${window.location.origin}/company/${client.id}`);
                      toast.success("Link copied!");
                    }}
                  >
                    Copy
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => window.open(`/company/${client.id}`, '_blank')}
                  >
                    View
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package & Credits */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5" />
                Package & Credits
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-sm text-muted-foreground">Package</Label>
                {editingField === "current_package_id" ? (
                  <div className="flex gap-2 mt-1">
                    <Select
                      value={editValues.current_package_id || ""}
                      onValueChange={(value) => setEditValues({ ...editValues, current_package_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select package" />
                      </SelectTrigger>
                      <SelectContent>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - ${pkg.monthly_cost}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button size="sm" onClick={() => handleSave("current_package_id")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <Badge variant="outline" className="text-sm">
                      {currentPackage?.name || "No package"}
                    </Badge>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit("current_package_id")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {currentPackage && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Monthly Cost:</span>
                  <span className="font-medium">${currentPackage.monthly_cost}</span>
                </div>
              )}
              
              <Separator />
              
              <div>
                <Label className="text-sm text-muted-foreground">Credits Balance</Label>
                {editingField === "credits_balance" ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={editValues.credits_balance}
                      onChange={(e) => setEditValues({ ...editValues, credits_balance: parseInt(e.target.value) || 0 })}
                    />
                    <Button size="sm" onClick={() => handleSave("credits_balance")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-lg font-bold text-green-600">{client.credits_balance || 0}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit("credits_balance")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Credits Used:</span>
                <span className="font-medium">{client.credits_used || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Lead Purchase Statistics */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Lead Purchases
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Leads Purchased:</span>
                <span className="text-2xl font-bold text-primary">{leadStats?.totalPurchased || 0}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Spent:</span>
                <span className="text-lg font-bold text-green-600">
                  ${(leadStats?.totalSpent || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Matches:</span>
                <span className="font-medium">{leadStats?.totalMatches || 0}</span>
              </div>
            </CardContent>
          </Card>

          {/* Business Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <span className="text-sm text-muted-foreground">Client Type: </span>
                <Badge variant="outline">{client.client_type}</Badge>
              </div>
              
              <div>
                <Label className="text-sm text-muted-foreground">Brokerage</Label>
                {editingField === "brokerage" ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      value={editValues.brokerage || ""}
                      onChange={(e) => setEditValues({ ...editValues, brokerage: e.target.value })}
                    />
                    <Button size="sm" onClick={() => handleSave("brokerage")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span>{client.brokerage || "Not set"}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit("brokerage")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <div>
                <Label className="text-sm text-muted-foreground">Years Experience</Label>
                {editingField === "years_experience" ? (
                  <div className="flex gap-2 mt-1">
                    <Input
                      type="number"
                      value={editValues.years_experience || ""}
                      onChange={(e) => setEditValues({ ...editValues, years_experience: parseInt(e.target.value) || null })}
                    />
                    <Button size="sm" onClick={() => handleSave("years_experience")}>
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" onClick={handleCancel}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center justify-between mt-1">
                    <span>{client.years_experience ? `${client.years_experience} years` : "Not set"}</span>
                    <Button size="sm" variant="ghost" onClick={() => handleEdit("years_experience")}>
                      <Edit className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>

              <Separator />

              <div>
                <Label className="text-sm text-muted-foreground flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  Locations
                </Label>
                <div className="mt-2 space-y-2">
                  {client.states && client.states.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">States: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {client.states.map((state: string) => (
                          <Badge key={state} variant="secondary" className="text-xs">
                            {state}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {client.cities && client.cities.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Cities: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {client.cities.map((city: string) => (
                          <Badge key={city} variant="secondary" className="text-xs">
                            {city}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {client.zip_codes && client.zip_codes.length > 0 && (
                    <div>
                      <span className="text-xs text-muted-foreground">Zip Codes: </span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {client.zip_codes.map((zip: string) => (
                          <Badge key={zip} variant="secondary" className="text-xs">
                            {zip}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {(!client.states || client.states.length === 0) && 
                   (!client.cities || client.cities.length === 0) && 
                   (!client.zip_codes || client.zip_codes.length === 0) && (
                    <p className="text-sm text-muted-foreground">No locations set</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Phone Number Assignment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Phone Number Management
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Search and Assign */}
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="md:col-span-2">
                  <Label>Area Code</Label>
                  <Input
                    placeholder="e.g., 415"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    maxLength={3}
                  />
                </div>
                <div>
                  <Label>Provider</Label>
                  <Select value={selectedProvider} onValueChange={setSelectedProvider}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="twilio">Twilio</SelectItem>
                      <SelectItem value="twilio_primary">Main Twilio</SelectItem>
                      <SelectItem value="twilio_backup">Twilio Backup</SelectItem>
                      <SelectItem value="messagebird">MessageBird</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-end">
                  <Button onClick={handleSearchNumbers} disabled={searching} className="w-full">
                    <Search className="w-4 h-4 mr-2" />
                    Search
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
                          disabled={adding}
                        >
                          Assign
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <Separator />

            {/* Assigned Numbers */}
            <div>
              <h3 className="font-semibold mb-3">Assigned Phone Numbers</h3>
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
                            {getProviderDisplay(number.provider || "twilio")}
                            {" • "}
                            Assigned {new Date(number.assigned_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleNumberActive(number.id, number.active)}
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
                          onClick={() => handleDeleteNumber(number.id)}
                        >
                          <Trash2 className="w-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* AI Chat Archives */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              AI Chat Archives
            </CardTitle>
          </CardHeader>
          <CardContent>
            {aiChats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No chat history yet</p>
            ) : (
              <div className="space-y-2">
                {aiChats.map((chat, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent cursor-pointer transition-colors"
                    onClick={() => setSelectedChat(chat)}
                  >
                    <div>
                      <p className="font-medium">{chat.date}</p>
                      <p className="text-sm text-muted-foreground">{chat.summary}</p>
                    </div>
                    <Button variant="ghost" size="sm">
                      View
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chat Details Modal */}
        <Dialog open={!!selectedChat} onOpenChange={() => setSelectedChat(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Chat History - {selectedChat?.date}</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-4">
                {selectedChat?.logs.map((log: any) => (
                  <div key={log.id} className="border rounded-lg p-4">
                    <div className="flex items-start justify-between mb-2">
                      <Badge variant={log.message_type === "user" ? "default" : "secondary"}>
                        {log.message_type}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.created_at).toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{log.message_content}</p>
                    {log.intent_detected && (
                      <div className="mt-2">
                        <Badge variant="outline" className="text-xs">
                          Intent: {log.intent_detected}
                        </Badge>
                      </div>
                    )}
                    {log.sentiment_score && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sentiment: {log.sentiment_score}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </DialogContent>
        </Dialog>

        {/* Edit All Fields Dialog */}
        <Dialog open={editAllDialogOpen} onOpenChange={setEditAllDialogOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh]">
            <DialogHeader>
              <DialogTitle>Edit All Fields</DialogTitle>
            </DialogHeader>
            <ScrollArea className="h-[60vh] pr-4">
              <div className="space-y-6">
                {/* Profile Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Profile Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>First Name</Label>
                      <Input
                        value={allFieldsEditValues.first_name || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Last Name</Label>
                      <Input
                        value={allFieldsEditValues.last_name || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, last_name: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Email</Label>
                      <Input
                        type="email"
                        autoComplete="email"
                        value={allFieldsEditValues.email || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Phone</Label>
                      <Input
                        type="tel"
                        value={allFieldsEditValues.phone || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, phone: e.target.value })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Company Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Company Information</h3>
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      value={allFieldsEditValues.company_name || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, company_name: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Contact Name</Label>
                    <Input
                      value={allFieldsEditValues.contact_name || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, contact_name: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Brokerage</Label>
                      <Input
                        value={allFieldsEditValues.brokerage || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, brokerage: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label>Client Type</Label>
                      <Select
                        value={allFieldsEditValues.client_type || ""}
                        onValueChange={(value) => setAllFieldsEditValues({ ...allFieldsEditValues, client_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="real_estate">Real Estate</SelectItem>
                          <SelectItem value="brokerage">Brokerage</SelectItem>
                          <SelectItem value="team">Team</SelectItem>
                          <SelectItem value="mortgage">Mortgage</SelectItem>
                          <SelectItem value="lender">Lender</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label>License Type</Label>
                    <Input
                      value={allFieldsEditValues.license_type || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, license_type: e.target.value })}
                      placeholder="e.g., Broker, Agent"
                    />
                  </div>
                </div>

                <Separator />

                {/* Business Metrics */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Business Metrics</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <Label>Years Experience</Label>
                      <Input
                        type="number"
                        value={allFieldsEditValues.years_experience || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, years_experience: parseInt(e.target.value) || null })}
                      />
                    </div>
                    <div>
                      <Label>Yearly Sales ($)</Label>
                      <Input
                        type="number"
                        value={allFieldsEditValues.yearly_sales || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, yearly_sales: parseFloat(e.target.value) || null })}
                      />
                    </div>
                    <div>
                      <Label>Average Sale ($)</Label>
                      <Input
                        type="number"
                        value={allFieldsEditValues.avg_sale || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, avg_sale: parseFloat(e.target.value) || null })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Location Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Location Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Cities (comma-separated)</Label>
                      <Input
                        value={allFieldsEditValues.cities || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, cities: e.target.value })}
                        placeholder="Miami, Orlando, Tampa"
                      />
                    </div>
                    <div>
                      <Label>States (comma-separated)</Label>
                      <Input
                        value={allFieldsEditValues.states || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, states: e.target.value })}
                        placeholder="FL, CA, NY"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Zip Codes (comma-separated)</Label>
                      <Input
                        value={allFieldsEditValues.zip_codes || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, zip_codes: e.target.value })}
                        placeholder="33101, 33102"
                      />
                    </div>
                    <div>
                      <Label>County</Label>
                      <Input
                        value={allFieldsEditValues.county || ""}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, county: e.target.value })}
                        placeholder="Miami-Dade"
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Skills & Qualifications */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Skills & Qualifications</h3>
                  <div>
                    <Label>Designations (comma-separated)</Label>
                    <Input
                      value={allFieldsEditValues.designations || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, designations: e.target.value })}
                      placeholder="CRS, GRI, ABR"
                    />
                  </div>
                  <div>
                    <Label>Languages (comma-separated)</Label>
                    <Input
                      value={allFieldsEditValues.languages || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, languages: e.target.value })}
                      placeholder="English, Spanish, French"
                    />
                  </div>
                  <div>
                    <Label>Skills (comma-separated)</Label>
                    <Input
                      value={allFieldsEditValues.skills || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, skills: e.target.value })}
                      placeholder="Negotiation, Marketing, Social Media"
                    />
                  </div>
                </div>

                <Separator />

                {/* Preferences */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Preferences</h3>
                  <div>
                    <Label>Wants</Label>
                    <Input
                      value={allFieldsEditValues.wants || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, wants: e.target.value })}
                      placeholder="What they're looking for"
                    />
                  </div>
                  <div>
                    <Label>Needs</Label>
                    <Input
                      value={allFieldsEditValues.needs || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, needs: e.target.value })}
                      placeholder="What they need"
                    />
                  </div>
                  <div>
                    <Label>Tags (comma-separated)</Label>
                    <Input
                      value={allFieldsEditValues.tags || ""}
                      onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, tags: e.target.value })}
                      placeholder="VIP, Hot Lead, Follow Up"
                    />
                  </div>
                </div>

                <Separator />

                {/* Package & Credits */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Package & Credits</h3>
                  <div>
                    <Label>Package</Label>
                    <Select
                      value={allFieldsEditValues.current_package_id || ""}
                      onValueChange={(value) => setAllFieldsEditValues({ ...allFieldsEditValues, current_package_id: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select package" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No Package</SelectItem>
                        {packages.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name} - ${pkg.monthly_cost}/mo
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Credits Balance</Label>
                      <Input
                        type="number"
                        value={allFieldsEditValues.credits_balance || 0}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, credits_balance: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                    <div>
                      <Label>Credits Used</Label>
                      <Input
                        type="number"
                        value={allFieldsEditValues.credits_used || 0}
                        onChange={(e) => setAllFieldsEditValues({ ...allFieldsEditValues, credits_used: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Status */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-lg">Status</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="active"
                        checked={allFieldsEditValues.active ?? true}
                        onCheckedChange={(checked) => setAllFieldsEditValues({ ...allFieldsEditValues, active: checked === true })}
                      />
                      <Label htmlFor="active" className="cursor-pointer">Active Account</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="profile_completed"
                        checked={allFieldsEditValues.profile_completed ?? false}
                        onCheckedChange={(checked) => setAllFieldsEditValues({ ...allFieldsEditValues, profile_completed: checked === true })}
                      />
                      <Label htmlFor="profile_completed" className="cursor-pointer">Profile Completed</Label>
                    </div>
                  </div>
                </div>
              </div>
            </ScrollArea>
            <div className="flex justify-end gap-2 mt-4">
              <Button variant="outline" onClick={() => setEditAllDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveAllFields}>
                Save All Changes
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <EnrichedDataModal
        open={showEnrichedData}
        onOpenChange={setShowEnrichedData}
        data={enrichedData}
        type="company"
      />
    </div>
  );
};

export default ClientDetail;
