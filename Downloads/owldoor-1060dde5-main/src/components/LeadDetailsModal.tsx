import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Mail, Phone, MessageSquare, FileText, Send, Edit2, Save, Plus, X, Database } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LeadLocationMap from "./LeadLocationMap";
import { EnrichedDataModal } from "./admin/EnrichedDataModal";

interface LeadDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  readOnly?: boolean;
  lead: {
    id: string;
    full_name: string;
    first_name?: string | null;
    last_name?: string | null;
    email: string | null;
    phone: string | null;
    pro_type?: string | null;
    
    // Contact Links
    linkedin_url?: string | null;
    facebook_url?: string | null;
    instagram_url?: string | null;
    twitter_url?: string | null;
    youtube_url?: string | null;
    website_url?: string | null;
    
    // Professional Info
    brokerage?: string | null;
    company?: string | null;
    address?: string | null;
    
    // Location
    cities?: string[] | null;
    states?: string[] | null;
    counties?: string[] | null;
    zip_codes?: string[] | null;
    
    // Volume Metrics
    total_volume?: number | null;
    total_units?: number | null;
    buyer_volume?: number | null;
    buyer_financed?: number | null;
    buyer_units?: number | null;
    seller_volume?: number | null;
    seller_financed?: number | null;
    seller_units?: number | null;
    dual_volume?: number | null;
    dual_units?: number | null;
    
    // Percentages
    buyer_percentage?: number | null;
    seller_percentage?: number | null;
    percent_financed?: number | null;
    seller_side_percentage?: number | null;
    purchase_percentage?: number | null;
    conventional_percentage?: number | null;
    
    // Relationships
    top_lender?: string | null;
    top_lender_share?: number | null;
    top_lender_volume?: number | null;
    top_originator?: string | null;
    top_originator_share?: number | null;
    top_originator_volume?: number | null;
    
    // Calculated
    transactions_per_year?: number | null;
    
    status: string;
    pipeline_stage?: string | null;
    experience?: number | null;
    transactions?: number | null;
    total_sales?: number | null;
    qualification_score?: number | null;
    motivation?: number | null;
    skills?: string[] | null;
    wants?: string[] | null;
    source?: string | null;
    license_type?: string | null;
    team?: string | null;
    notes?: string | null;
    image_url?: string | null;
    created_at?: string;
    date?: string | null;
  };
  onUpdate?: () => void;
}

const STAFF_STAGES = [
  { value: "new", label: "New" },
  { value: "qualifying", label: "Qualifying" },
  { value: "qualified", label: "Qualified" },
  { value: "match_ready", label: "Ready" },
  { value: "matched", label: "Matched" },
  { value: "purchased", label: "Purchased" },
];

const STATUS_OPTIONS = [
  { value: "new", label: "New" },
  { value: "hot", label: "Hot" },
  { value: "warm", label: "Warm" },
  { value: "cold", label: "Cold" },
];

const LeadDetailsModal = ({ open, onOpenChange, lead, onUpdate, readOnly = false }: LeadDetailsModalProps) => {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [customFields, setCustomFields] = useState<any[]>([]);
  const [customFieldValues, setCustomFieldValues] = useState<Record<string, string>>({});
  const [showAddCustomField, setShowAddCustomField] = useState(false);
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [enriching, setEnriching] = useState(false);
  const [enrichedData, setEnrichedData] = useState<any>(null);
  const [showEnrichedData, setShowEnrichedData] = useState(false);
  const [isEnriched, setIsEnriched] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: lead.first_name || "",
    last_name: lead.last_name || "",
    email: lead.email || "",
    phone: lead.phone || "",
    brokerage: lead.brokerage || "",
    company: lead.company || "",
    status: lead.status || "new",
    pipeline_stage: lead.pipeline_stage || "new",
    experience: lead.experience || 0,
    transactions: lead.transactions || 0,
    total_sales: lead.total_sales || 0,
    qualification_score: lead.qualification_score || 0,
    motivation: lead.motivation || 0,
    license_type: lead.license_type || "",
    source: lead.source || "",
    team: lead.team || "",
    notes: lead.notes || "",
    pro_type: lead.pro_type || "",
    cities: lead.cities?.join(", ") || "",
    states: lead.states?.join(", ") || "",
    counties: lead.counties?.join(", ") || "",
    zip_codes: lead.zip_codes?.join(", ") || "",
    skills: lead.skills?.join(", ") || "",
    wants: lead.wants?.join(", ") || "",
  });

  const formatSource = (source?: string | null) => {
    if (source === 'model-match') return 'OwlDoor Match';
    return source || 'N/A';
  };

  useEffect(() => {
    if (open) {
      fetchCustomFields();
      fetchCustomFieldValues();
      setHasChanges(false);
      // Reset form data when lead changes
      setFormData({
        first_name: lead.first_name || "",
        last_name: lead.last_name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        brokerage: lead.brokerage || "",
        company: lead.company || "",
        status: lead.status || "new",
        pipeline_stage: lead.pipeline_stage || "new",
        experience: lead.experience || 0,
        transactions: lead.transactions || 0,
        total_sales: lead.total_sales || 0,
        qualification_score: lead.qualification_score || 0,
        motivation: lead.motivation || 0,
        license_type: lead.license_type || "",
        source: lead.source || "",
        team: lead.team || "",
        notes: lead.notes || "",
        pro_type: lead.pro_type || "",
        cities: lead.cities?.join(", ") || "",
        states: lead.states?.join(", ") || "",
        counties: lead.counties?.join(", ") || "",
        zip_codes: lead.zip_codes?.join(", ") || "",
        skills: lead.skills?.join(", ") || "",
        wants: lead.wants?.join(", ") || "",
      });
    }
  }, [open, lead]);

  const handleEnrich = async () => {
    setEnriching(true);
    try {
      const params: any = {};
      if (lead.email) params.email = lead.email;
      else if (lead.phone) params.phone = lead.phone;
      else {
        toast.error("Need email or phone to enrich");
        setEnriching(false);
        return;
      }

      const { data, error } = await supabase.functions.invoke('pdl-enrich', {
        body: {
          action: 'enrich',
          type: 'person',
          params,
          recordId: lead.id
        }
      });

      if (error) {
        toast.error(`Enrichment failed: ${error.message}`);
      } else if (data?.status === 200 && data?.data) {
        setEnrichedData(data.data);
        setIsEnriched(true);
        toast.success('Successfully enriched lead!');
        setShowEnrichedData(true);
        onUpdate?.();
      } else {
        toast.warning('No additional data found');
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Failed to enrich lead');
    } finally {
      setEnriching(false);
    }
  };

  const fetchCustomFields = async () => {
    const { data, error } = await supabase
      .from("custom_fields")
      .select("*")
      .eq("target_table", "leads")
      .eq("active", true)
      .order("field_name");
    
    if (!error && data) {
      setCustomFields(data);
    }
  };

  const fetchCustomFieldValues = async () => {
    const { data, error } = await supabase
      .from("custom_field_values")
      .select("custom_field_id, value, custom_fields(field_name)")
      .eq("record_id", lead.id);
    
    if (!error && data) {
      const values: Record<string, string> = {};
      data.forEach((item: any) => {
        if (item.custom_fields) {
          values[item.custom_field_id] = item.value || "";
        }
      });
      setCustomFieldValues(values);
    }
  };

  const handleAddCustomField = async () => {
    if (!newFieldName.trim()) {
      toast.error("Please enter a field name");
      return;
    }

    try {
      const { data, error } = await supabase
        .from("custom_fields")
        .insert({
          field_name: newFieldName,
          field_type: newFieldType,
          target_table: "leads",
          active: true,
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Custom field added successfully");
      setNewFieldName("");
      setNewFieldType("text");
      setShowAddCustomField(false);
      fetchCustomFields();
    } catch (error: any) {
      toast.error("Failed to add custom field");
      console.error(error);
    }
  };

  const handleSaveCustomFieldValue = async (fieldId: string, value: string) => {
    try {
      const { error } = await supabase
        .from("custom_field_values")
        .upsert({
          custom_field_id: fieldId,
          record_id: lead.id,
          value: value,
        }, {
          onConflict: "custom_field_id,record_id"
        });

      if (error) throw error;
      toast.success("Custom field saved");
    } catch (error: any) {
      toast.error("Failed to save custom field");
      console.error(error);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const formatCurrency = (amount: number | null | undefined) => {
    if (!amount) return "$0";
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(0)}K`;
    return `$${amount}`;
  };

  const handleFieldChange = (field: string, value: any) => {
    setFormData({...formData, [field]: value});
    setHasChanges(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const oldStage = lead.pipeline_stage;
      const newStage = formData.pipeline_stage;
      
      const updateData: any = {
        first_name: formData.first_name || null,
        last_name: formData.last_name || null,
        full_name: `${formData.first_name} ${formData.last_name}`.trim(),
        email: formData.email || null,
        phone: formData.phone,
        brokerage: formData.brokerage || null,
        company: formData.company || null,
        status: formData.status,
        pipeline_stage: formData.pipeline_stage,
        experience: parseInt(formData.experience.toString()) || null,
        transactions: parseInt(formData.transactions.toString()) || null,
        total_sales: parseFloat(formData.total_sales.toString()) || null,
        qualification_score: parseInt(formData.qualification_score.toString()) || null,
        motivation: parseInt(formData.motivation.toString()) || null,
        pro_type: formData.pro_type || null,
        license_type: formData.license_type || null,
        source: formData.source || null,
        team: formData.team || null,
        notes: formData.notes || null,
        cities: formData.cities ? formData.cities.split(",").map(s => s.trim()).filter(Boolean) : null,
        states: formData.states ? formData.states.split(",").map(s => s.trim()).filter(Boolean) : null,
        counties: formData.counties ? formData.counties.split(",").map(s => s.trim()).filter(Boolean) : null,
        zip_codes: formData.zip_codes ? formData.zip_codes.split(",").map(s => s.trim()).filter(Boolean) : null,
        skills: formData.skills ? formData.skills.split(",").map(s => s.trim()).filter(Boolean) : null,
        wants: formData.wants ? formData.wants.split(",").map(s => s.trim()).filter(Boolean) : null,
      };

      const { error } = await supabase
        .from("pros")
        .update(updateData)
        .eq("id", lead.id);

      if (error) throw error;
      
      // Auto-enrich when moved to qualifying stage
      if (oldStage !== 'qualifying' && newStage === 'qualifying') {
        supabase.functions.invoke('auto-enrich-trigger', {
          body: { type: 'lead_qualifying', record_id: lead.id }
        });
      }
      
      toast.success("Lead updated successfully");
      setEditing(false);
      setHasChanges(false);
      onUpdate?.();
    } catch (error: any) {
      toast.error("Failed to update lead");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const score = Math.round((formData.qualification_score || 0) / 10);
  const motivation = formData.motivation || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <div className="flex items-center justify-between">
            <DialogTitle>{readOnly ? "Agent Details" : "Lead Details"}</DialogTitle>
            <div className="flex gap-2">
              {!readOnly && (
                <>
                  {isEnriched ? (
                    <Button onClick={() => setShowEnrichedData(true)} variant="outline" size="sm">
                      <Database className="mr-2 h-4 w-4" />
                      View Enriched Data
                    </Button>
                  ) : (
                    <Button onClick={handleEnrich} disabled={enriching} variant="outline" size="sm">
                      <Database className="mr-2 h-4 w-4" />
                      {enriching ? "Enriching..." : "Enrich"}
                    </Button>
                  )}
                  {editing ? (
                    <>
                      <Button onClick={() => {setEditing(false); setHasChanges(false);}} variant="outline" size="sm" disabled={saving}>
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button onClick={() => setEditing(true)} size="sm">
                      <Edit2 className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </DialogHeader>

        {/* Floating Save Button */}
        {editing && hasChanges && !readOnly && (
          <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4">
            <Card className="shadow-2xl border-2 border-primary">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="text-sm font-medium">You have unsaved changes</div>
                <div className="flex gap-2">
                  <Button onClick={() => {setEditing(false); setHasChanges(false);}} variant="outline" size="sm" disabled={saving}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving} size="sm" className="min-w-[100px]">
                    {saving ? (
                      <>Saving...</>
                    ) : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Save Changes
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="space-y-4">
          {/* Header Section */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20 border-2 border-border flex-shrink-0">
              <AvatarImage src={lead.image_url || undefined} alt={lead.full_name} />
              <AvatarFallback className="bg-primary/10 text-primary font-semibold text-xl">
                {getInitials(lead.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              {editing && !readOnly ? (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label className="text-xs">First Name</Label>
                    <Input
                      value={formData.first_name}
                      onChange={(e) => handleFieldChange('first_name', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">Last Name</Label>
                    <Input
                      value={formData.last_name}
                      onChange={(e) => handleFieldChange('last_name', e.target.value)}
                      className="h-8"
                    />
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-2xl font-bold text-foreground">{lead.full_name}</h2>
                  <p className="text-sm text-muted-foreground">
                    {lead.brokerage || lead.company || "Independent Agent"}
                  </p>
                </>
              )}
              <div className="flex gap-2 mt-2">
                {editing && !readOnly ? (
                  <>
                    <Select value={formData.status} onValueChange={(v) => handleFieldChange('status', v)}>
                      <SelectTrigger className="w-32 h-7 text-xs">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {STATUS_OPTIONS.map((opt) => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </>
                ) : (
                  <>
                    <Badge variant="outline">{lead.status}</Badge>
                    {lead.source && <Badge variant="outline">Source: {formatSource(lead.source)}</Badge>}
                  </>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Metrics */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Key Metrics</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-4 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Experience (Years)</Label>
                {editing && !readOnly ? (
                  <Input
                    type="number"
                    value={formData.experience}
                    onChange={(e) => handleFieldChange('experience', parseInt(e.target.value) || 0)}
                    className="mt-1 h-8"
                  />
                ) : (
                  <div className="text-lg font-bold mt-1">{lead.experience || 0}</div>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Transactions/Year</Label>
                {editing && !readOnly ? (
                  <Input
                    type="number"
                    value={formData.transactions}
                    onChange={(e) => handleFieldChange('transactions', parseInt(e.target.value) || 0)}
                    className="mt-1 h-8"
                  />
                ) : (
                  <div className="text-lg font-bold mt-1">{lead.transactions || 0}</div>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Total Sales</Label>
                {editing && !readOnly ? (
                  <Input
                    type="number"
                    value={formData.total_sales}
                    onChange={(e) => handleFieldChange('total_sales', parseFloat(e.target.value) || 0)}
                    className="mt-1 h-8"
                  />
                ) : (
                  <div className="text-lg font-bold mt-1">{formatCurrency(lead.total_sales)}</div>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">License Type</Label>
                {editing && !readOnly ? (
                  <Input
                    value={formData.license_type}
                    onChange={(e) => handleFieldChange('license_type', e.target.value)}
                    className="mt-1 h-8"
                  />
                ) : (
                  <div className="text-sm mt-1">{lead.license_type || "N/A"}</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Model Match Performance Data */}
          {(lead.total_volume || lead.buyer_volume || lead.seller_volume || lead.dual_volume) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Model Match Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Total Performance */}
                {lead.address && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Business Address</Label>
                    <div className="text-sm mt-1">{lead.address}</div>
                  </div>
                )}
                
                <div className="grid grid-cols-3 gap-4">
                  {lead.total_volume && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Total Volume</Label>
                      <div className="text-lg font-bold mt-1">{formatCurrency(lead.total_volume)}</div>
                      {lead.total_units && <div className="text-xs text-muted-foreground">{lead.total_units} units</div>}
                    </div>
                  )}
                  {lead.transactions_per_year && (
                    <div>
                      <Label className="text-xs text-muted-foreground">Transactions/Year</Label>
                      <div className="text-lg font-bold mt-1">{lead.transactions_per_year}</div>
                    </div>
                  )}
                </div>

                {/* Buyer Side */}
                {lead.buyer_volume && (
                  <div>
                    <div className="font-semibold text-sm mb-2 flex items-center justify-between">
                      <span>Buyer Side</span>
                      {lead.buyer_percentage && <Badge variant="secondary">{lead.buyer_percentage.toFixed(0)}%</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Volume</Label>
                        <div className="font-bold">{formatCurrency(lead.buyer_volume)}</div>
                      </div>
                      {lead.buyer_units && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Units</Label>
                          <div className="font-bold">{lead.buyer_units}</div>
                        </div>
                      )}
                      {lead.buyer_financed && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Financed</Label>
                          <div className="font-bold">{formatCurrency(lead.buyer_financed)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Seller Side */}
                {lead.seller_volume && (
                  <div>
                    <div className="font-semibold text-sm mb-2 flex items-center justify-between">
                      <span>Seller Side</span>
                      {lead.seller_percentage && <Badge variant="secondary">{lead.seller_percentage.toFixed(0)}%</Badge>}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Volume</Label>
                        <div className="font-bold">{formatCurrency(lead.seller_volume)}</div>
                      </div>
                      {lead.seller_units && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Units</Label>
                          <div className="font-bold">{lead.seller_units}</div>
                        </div>
                      )}
                      {lead.seller_financed && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Financed</Label>
                          <div className="font-bold">{formatCurrency(lead.seller_financed)}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Dual Agency */}
                {lead.dual_volume && (
                  <div>
                    <div className="font-semibold text-sm mb-2">Dual Agency</div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <Label className="text-xs text-muted-foreground">Volume</Label>
                        <div className="font-bold">{formatCurrency(lead.dual_volume)}</div>
                      </div>
                      {lead.dual_units && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Units</Label>
                          <div className="font-bold">{lead.dual_units}</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Additional Percentages */}
                {(lead.percent_financed || lead.purchase_percentage || lead.conventional_percentage || lead.seller_side_percentage) && (
                  <div className="border-t pt-3">
                    <div className="font-semibold text-sm mb-2">Transaction Breakdown</div>
                    <div className="grid grid-cols-4 gap-3 text-sm">
                      {lead.percent_financed && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Financed</Label>
                          <div className="font-bold">{lead.percent_financed.toFixed(0)}%</div>
                        </div>
                      )}
                      {lead.purchase_percentage && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Purchase</Label>
                          <div className="font-bold">{lead.purchase_percentage.toFixed(0)}%</div>
                        </div>
                      )}
                      {lead.conventional_percentage && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Conventional</Label>
                          <div className="font-bold">{lead.conventional_percentage.toFixed(0)}%</div>
                        </div>
                      )}
                      {lead.seller_side_percentage && (
                        <div>
                          <Label className="text-xs text-muted-foreground">Seller Side</Label>
                          <div className="font-bold">{lead.seller_side_percentage.toFixed(0)}%</div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Top Relationships */}
          {(lead.top_lender || lead.top_originator) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Top Relationships</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                {lead.top_lender && (
                  <div>
                    <div className="font-semibold text-sm mb-2">Top Lender</div>
                    <div className="space-y-1">
                      <div className="text-base font-bold">{lead.top_lender}</div>
                      {lead.top_lender_share && (
                        <div className="text-xs text-muted-foreground">Share: {lead.top_lender_share.toFixed(0)}%</div>
                      )}
                      {lead.top_lender_volume && (
                        <div className="text-xs text-muted-foreground">Volume: {formatCurrency(lead.top_lender_volume)}</div>
                      )}
                    </div>
                  </div>
                )}
                {lead.top_originator && (
                  <div>
                    <div className="font-semibold text-sm mb-2">Top Originator</div>
                    <div className="space-y-1">
                      <div className="text-base font-bold">{lead.top_originator}</div>
                      {lead.top_originator_share && (
                        <div className="text-xs text-muted-foreground">Share: {lead.top_originator_share.toFixed(0)}%</div>
                      )}
                      {lead.top_originator_volume && (
                        <div className="text-xs text-muted-foreground">Volume: {formatCurrency(lead.top_originator_volume)}</div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Social & Contact Links */}
          {(lead.linkedin_url || lead.facebook_url || lead.instagram_url || lead.twitter_url || lead.youtube_url || lead.website_url) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Online Presence</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-3 gap-3">
                {lead.linkedin_url && (
                  <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    LinkedIn →
                  </a>
                )}
                {lead.facebook_url && (
                  <a href={lead.facebook_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    Facebook →
                  </a>
                )}
                {lead.instagram_url && (
                  <a href={lead.instagram_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    Instagram →
                  </a>
                )}
                {lead.twitter_url && (
                  <a href={lead.twitter_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    Twitter →
                  </a>
                )}
                {lead.youtube_url && (
                  <a href={lead.youtube_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    YouTube →
                  </a>
                )}
                {lead.website_url && (
                  <a href={lead.website_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary hover:underline flex items-center gap-1">
                    Website →
                  </a>
                )}
              </CardContent>
            </Card>
          )}

          {/* Location Details */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coverage Areas</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Cities (comma separated)</Label>
                {editing && !readOnly ? (
                  <Input
                    value={formData.cities}
                    onChange={(e) => handleFieldChange('cities', e.target.value)}
                    placeholder="e.g. San Diego, Los Angeles"
                    className="mt-1 h-8"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lead.cities?.map((city, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{city}</Badge>
                    )) || <span className="text-sm text-muted-foreground">None</span>}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">States (comma separated)</Label>
                {editing && !readOnly ? (
                  <Input
                    value={formData.states}
                    onChange={(e) => handleFieldChange('states', e.target.value)}
                    placeholder="e.g. CA, NY"
                    className="mt-1 h-8"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lead.states?.map((state, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{state}</Badge>
                    )) || <span className="text-sm text-muted-foreground">None</span>}
                  </div>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Counties (comma separated)</Label>
                {editing && !readOnly ? (
                  <Input
                    value={formData.counties}
                    onChange={(e) => handleFieldChange('counties', e.target.value)}
                    className="mt-1 h-8"
                  />
                ) : (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {lead.counties?.map((county, idx) => (
                      <Badge key={idx} variant="secondary" className="text-xs">{county}</Badge>
                    )) || <span className="text-sm text-muted-foreground">None</span>}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Scoring */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Scoring</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Qualification Score</Label>
                  {editing && !readOnly ? (
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      value={formData.qualification_score}
                      onChange={(e) => handleFieldChange('qualification_score', parseInt(e.target.value) || 0)}
                      className="w-20 h-7 text-xs"
                    />
                  ) : (
                    <span className="text-sm font-semibold">{score}/10</span>
                  )}
                </div>
                <Progress value={score * 10} className="h-2" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-xs text-muted-foreground">Motivation</Label>
                  {editing && !readOnly ? (
                    <Input
                      type="number"
                      min="0"
                      max="10"
                      value={formData.motivation}
                      onChange={(e) => handleFieldChange('motivation', parseInt(e.target.value) || 0)}
                      className="w-20 h-7 text-xs"
                    />
                  ) : (
                    <span className="text-sm font-semibold">{motivation}/10</span>
                  )}
                </div>
                <Progress value={motivation * 10} className="h-2" />
              </div>
            </CardContent>
          </Card>

          {/* Location */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-[1fr_400px] gap-6">
              {/* Location Fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Email</Label>
                  {editing && !readOnly ? (
                    <Input
                      value={formData.email}
                      onChange={(e) => handleFieldChange('email', e.target.value)}
                      className="mt-1 h-8"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Mail className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{lead.email || "Not provided"}</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Phone</Label>
                  {editing && !readOnly ? (
                    <Input
                      value={formData.phone}
                      onChange={(e) => handleFieldChange('phone', e.target.value)}
                      className="mt-1 h-8"
                    />
                  ) : (
                    <div className="flex items-center gap-2 mt-1">
                      <Phone className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm">{lead.phone || "Not provided"}</span>
                    </div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Company</Label>
                  {editing && !readOnly ? (
                    <Input
                      value={formData.company}
                      onChange={(e) => handleFieldChange('company', e.target.value)}
                      className="mt-1 h-8"
                    />
                  ) : (
                    <div className="text-sm mt-1">{lead.company || "N/A"}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Brokerage</Label>
                  {editing && !readOnly ? (
                    <Input
                      value={formData.brokerage}
                      onChange={(e) => handleFieldChange('brokerage', e.target.value)}
                      className="mt-1 h-8"
                    />
                  ) : (
                    <div className="text-sm mt-1">{lead.brokerage || "N/A"}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Source</Label>
                  {editing && !readOnly ? (
                    <Input
                      value={formData.source}
                      onChange={(e) => handleFieldChange('source', e.target.value)}
                      className="mt-1 h-8"
                    />
                  ) : (
                    <div className="text-sm mt-1">{formatSource(lead.source)}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Team</Label>
                  {editing && !readOnly ? (
                    <Input
                      value={formData.team}
                      onChange={(e) => handleFieldChange('team', e.target.value)}
                      className="mt-1 h-8"
                    />
                  ) : (
                    <div className="text-sm mt-1">{lead.team || "N/A"}</div>
                  )}
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Professional Type</Label>
                  {editing && !readOnly ? (
                    <Select
                      value={formData.pro_type}
                      onValueChange={(value) => handleFieldChange('pro_type', value)}
                    >
                      <SelectTrigger className="mt-1 h-8">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="real_estate_agent">Real Estate Agent</SelectItem>
                        <SelectItem value="mortgage_officer">Mortgage Officer</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <div className="text-sm mt-1">
                      {lead.pro_type === 'real_estate_agent' ? 'Real Estate Agent' : 
                       lead.pro_type === 'mortgage_officer' ? 'Mortgage Officer' : 'N/A'}
                    </div>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Wants:</Label>
                  {editing && !readOnly ? (
                    <Textarea
                      value={formData.wants}
                      onChange={(e) => handleFieldChange('wants', e.target.value)}
                      className="mt-1 min-h-[60px]"
                    />
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {lead.wants?.map((want, idx) => (
                        <li key={idx} className="text-sm">- {want}</li>
                      )) || <span className="text-sm text-muted-foreground">None</span>}
                    </ul>
                  )}
                </div>
                <div className="col-span-2">
                  <Label className="text-xs text-muted-foreground">Zip Codes:</Label>
                  {editing && !readOnly ? (
                    <Input
                      value={formData.zip_codes}
                      onChange={(e) => handleFieldChange('zip_codes', e.target.value)}
                      className="mt-1 h-8"
                    />
                  ) : (
                    <ul className="mt-2 space-y-1">
                      {lead.zip_codes?.map((zip, idx) => (
                        <li key={idx} className="text-sm">- {zip}</li>
                      )) || <span className="text-sm text-muted-foreground">None</span>}
                    </ul>
                  )}
                </div>
              </div>

              {/* Map */}
              <div className="flex items-start">
                <LeadLocationMap
                  zipCodes={lead.zip_codes}
                  cities={lead.cities}
                  counties={lead.counties}
                  states={lead.states}
                />
              </div>
            </CardContent>
          </Card>

          {/* Skills & Wants */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Skills & Preferences</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Skills (comma separated)</Label>
                {editing && !readOnly ? (
                  <Textarea
                    value={formData.skills}
                    onChange={(e) => handleFieldChange('skills', e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                ) : (
                  <ul className="mt-2 space-y-1">
                    {lead.skills?.map((skill, idx) => (
                      <li key={idx} className="text-sm">• {skill}</li>
                    )) || <span className="text-sm text-muted-foreground">None</span>}
                  </ul>
                )}
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Wants (comma separated)</Label>
                {editing && !readOnly ? (
                  <Textarea
                    value={formData.wants}
                    onChange={(e) => handleFieldChange('wants', e.target.value)}
                    className="mt-1 min-h-[80px]"
                  />
                ) : (
                  <ul className="mt-2 space-y-1">
                    {lead.wants?.map((want, idx) => (
                      <li key={idx} className="text-sm">• {want}</li>
                    )) || <span className="text-sm text-muted-foreground">None</span>}
                  </ul>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pipeline & Notes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Pipeline & Notes</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs text-muted-foreground">Pipeline Stage</Label>
                <Select 
                  value={formData.pipeline_stage} 
                  onValueChange={(v) => handleFieldChange('pipeline_stage', v)}
                  disabled={!editing || readOnly}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STAFF_STAGES.map((stage) => (
                      <SelectItem key={stage.value} value={stage.value}>
                        {stage.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Notes</Label>
                <Textarea
                  value={formData.notes}
                  onChange={(e) => handleFieldChange('notes', e.target.value)}
                  placeholder="Add notes about this lead..."
                  className="mt-1 min-h-[120px]"
                  disabled={!editing || readOnly}
                />
              </div>
            </CardContent>
          </Card>

          {/* Custom Fields */}
          {!readOnly && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">Custom Fields</CardTitle>
                  <Button
                    onClick={() => setShowAddCustomField(!showAddCustomField)}
                    size="sm"
                    variant="outline"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Custom Field
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {showAddCustomField && (
                  <div className="p-4 border rounded-lg bg-muted/50">
                    <div className="grid grid-cols-2 gap-2 mb-2">
                      <div>
                        <Label className="text-xs">Field Name</Label>
                        <Input
                          value={newFieldName}
                          onChange={(e) => setNewFieldName(e.target.value)}
                          placeholder="e.g. LinkedIn URL"
                          className="mt-1 h-8"
                        />
                      </div>
                      <div>
                        <Label className="text-xs">Field Type</Label>
                        <Select value={newFieldType} onValueChange={setNewFieldType}>
                          <SelectTrigger className="mt-1 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Yes/No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddCustomField} size="sm">
                        <Plus className="mr-2 h-4 w-4" />
                        Create Field
                      </Button>
                      <Button onClick={() => setShowAddCustomField(false)} variant="outline" size="sm">
                        Cancel
                      </Button>
                    </div>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4">
                  {customFields.map((field) => (
                    <div key={field.id}>
                      <Label className="text-xs text-muted-foreground">{field.field_name}</Label>
                      <div className="flex gap-2 mt-1">
                        <Input
                          type={field.field_type === "number" ? "number" : field.field_type === "date" ? "date" : "text"}
                          value={customFieldValues[field.id] || ""}
                          onChange={(e) => {
                            setCustomFieldValues({...customFieldValues, [field.id]: e.target.value});
                            setHasChanges(true);
                            handleSaveCustomFieldValue(field.id, e.target.value);
                          }}
                          className="h-8 flex-1"
                        />
                      </div>
                    </div>
                  ))}
                  {customFields.length === 0 && !showAddCustomField && (
                    <div className="col-span-2 text-center text-sm text-muted-foreground py-4">
                      No custom fields yet. Click "Add Custom Field" to create one.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          {!editing && (
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm">
                <MessageSquare className="mr-2 h-4 w-4" />
                Send SMS
              </Button>
              <Button variant="outline" size="sm">
                <Mail className="mr-2 h-4 w-4" />
                Send Email
              </Button>
              <Button variant="outline" size="sm">
                <Phone className="mr-2 h-4 w-4" />
                Call
              </Button>
              <Button variant="outline" size="sm">
                <Send className="mr-2 h-4 w-4" />
                Add to Campaign
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
      
      <EnrichedDataModal
        open={showEnrichedData}
        onOpenChange={setShowEnrichedData}
        data={enrichedData}
        type="person"
      />
    </Dialog>
  );
};

export default LeadDetailsModal;
