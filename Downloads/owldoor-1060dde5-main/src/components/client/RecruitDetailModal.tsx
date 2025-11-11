import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Mail, Phone, MapPin, Building2, Briefcase, TrendingUp, Calendar, Save, Edit2, Sparkles, Search, RefreshCw, Loader2, FileText, Globe, ExternalLink, Lightbulb, Award } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatNumber } from "@/lib/utils";

interface RecruitDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: string;
  recruit: {
    id: string;
    status: string;
    match_score: number;
    created_at: string;
    purchased?: boolean;
    pros: {
      id?: string;
      full_name: string;
      email: string;
      phone: string;
      cities: string[] | null;
      states: string[] | null;
      zip_codes?: string[] | null;
      qualification_score: number;
      pro_type: string;
      total_volume_12mo?: number;
      transactions_12mo?: number;
      transactions?: number;
      experience?: number;
      brokerage?: string;
      company?: string;
      wants?: string[];
    };
  };
}

export const RecruitDetailModal = ({ open, onOpenChange, recruit, clientId }: RecruitDetailModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notes, setNotes] = useState("");
  const [notesId, setNotesId] = useState<string | null>(null);
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [isResearching, setIsResearching] = useState(false);
  const [researchData, setResearchData] = useState<any>(null);

  useEffect(() => {
    if (open && clientId && recruit.pros.id) {
      loadClientNotes();
      loadResearchData();
    }
  }, [open, clientId, recruit]);

  const loadClientNotes = async () => {
    if (!clientId || !recruit.pros.id) return;

    const { data, error } = await supabase
      .from("client_pro_notes")
      .select("*")
      .eq("client_id", clientId)
      .eq("pro_id", recruit.pros.id)
      .maybeSingle();

    if (!error && data) {
      setNotesId(data.id);
      setNotes(data.notes || "");
      const overrides = typeof data.field_overrides === 'object' && data.field_overrides !== null 
        ? data.field_overrides as Record<string, any>
        : {};
      setEditedFields(overrides);
    }
  };

  const loadResearchData = async () => {
    if (!clientId || !recruit.pros.id) return;

    const { data, error } = await supabase
      .from('lead_research')
      .select('*')
      .eq('client_id', clientId)
      .eq('pro_id', recruit.pros.id)
      .maybeSingle();

    if (!error && data) {
      setResearchData(data);
    }
  };

  const handleResearchLead = async () => {
    if (!clientId || !recruit.pros.id || !recruit.purchased) {
      toast.error("You must purchase this recruit first to research them.");
      return;
    }

    setIsResearching(true);
    try {
      const { data, error } = await supabase.functions.invoke('research-lead', {
        body: {
          pro_id: recruit.pros.id,
          client_id: clientId,
        },
      });

      if (error) throw error;

      if (data?.success) {
        setResearchData(data.research);
        toast.success("AI has completed researching this lead!");
      }
    } catch (error) {
      console.error('Research error:', error);
      toast.error(error instanceof Error ? error.message : "Failed to research lead");
    } finally {
      setIsResearching(false);
    }
  };

  const handleSave = async () => {
    if (!clientId || !recruit.pros.id) return;
    setIsSaving(true);

    try {
      const payload = {
        client_id: clientId,
        pro_id: recruit.pros.id,
        notes: notes,
        field_overrides: editedFields,
        updated_at: new Date().toISOString(),
      };

      if (notesId) {
        const { error } = await supabase
          .from("client_pro_notes")
          .update(payload)
          .eq("id", notesId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("client_pro_notes")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setNotesId(data.id);
      }

      toast.success("Changes saved successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast.error("Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  const handleFieldEdit = (field: string, value: any) => {
    setEditedFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getDisplayValue = (field: keyof typeof recruit.pros) => {
    if (editedFields[field] !== undefined) {
      return editedFields[field];
    }
    return recruit.pros[field];
  };
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="text-2xl">{recruit.pros.full_name}</DialogTitle>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className={isEditing ? "bg-[#35a87e] hover:bg-[#2d8f6a]" : ""}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditing ? "Editing" : "Edit Mode"}
            </Button>
          </div>
        </DialogHeader>

        {/* AI Research Section - Only for purchased leads */}
        {recruit.purchased && (
          <Card className="border-primary/30 bg-primary/5">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-base">
                  <Sparkles className="h-5 w-5 text-primary" />
                  AI Research & Insights
                </span>
                <Button
                  onClick={handleResearchLead}
                  disabled={isResearching}
                  size="sm"
                  variant="outline"
                >
                  {isResearching ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Researching...
                    </>
                  ) : researchData ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Re-research
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Research Lead
                    </>
                  )}
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!researchData && !isResearching && (
                <div className="text-center py-6 text-muted-foreground">
                  <p className="mb-2 text-sm">Click "Research Lead" to have AI search for:</p>
                  <ul className="text-xs space-y-1">
                    <li>• Zillow & Realtor.com profiles</li>
                    <li>• Social media presence</li>
                    <li>• Awards & certifications</li>
                    <li>• Reviews & testimonials</li>
                    <li>• Market insights & recruiting strategy</li>
                  </ul>
                </div>
              )}

              {researchData && (
                <div className="space-y-4">
                  {/* AI Notes */}
                  {researchData.ai_notes && (
                    <div className="bg-background/50 p-3 rounded-lg border">
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <FileText className="h-4 w-4" />
                        Recruiting Strategy
                      </h4>
                      <p className="text-xs text-foreground whitespace-pre-wrap">{researchData.ai_notes}</p>
                    </div>
                  )}

                  {/* Online Profiles */}
                  {researchData.research_data?.online_profiles && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Globe className="h-4 w-4" />
                        Online Profiles
                      </h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {Object.entries(researchData.research_data.online_profiles).map(([platform, url]: [string, any]) => (
                          url && url !== "Not found" && (
                            <a
                              key={platform}
                              href={typeof url === 'string' ? url : url[0]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-2 text-primary hover:underline"
                            >
                              <ExternalLink className="h-3 w-3" />
                              {platform}
                            </a>
                          )
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Credentials */}
                  {researchData.research_data?.credentials && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Award className="h-4 w-4" />
                        Credentials & Recognition
                      </h4>
                      <div className="flex flex-wrap gap-1 text-xs">
                        {researchData.research_data.credentials.certifications?.map((cert: string, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{cert}</Badge>
                        ))}
                        {researchData.research_data.credentials.awards?.map((award: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">🏆 {award}</Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Unique Insights */}
                  {researchData.research_data?.unique_insights && researchData.research_data.unique_insights.length > 0 && (
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm">
                        <Lightbulb className="h-4 w-4" />
                        Key Insights
                      </h4>
                      <ul className="text-xs space-y-1 list-disc list-inside">
                        {researchData.research_data.unique_insights.map((insight: string, i: number) => (
                          <li key={i}>{insight}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Raw research fallback */}
                  {researchData.research_data?.raw_research && !researchData.research_data?.online_profiles && (
                    <div className="bg-background/50 p-3 rounded-lg border">
                      <p className="text-xs text-foreground whitespace-pre-wrap">{researchData.research_data.raw_research}</p>
                    </div>
                  )}

                  <p className="text-xs text-muted-foreground">
                    Last researched: {new Date(researchData.last_researched_at).toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="space-y-6">
          {/* Header Info */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{recruit.pros.pro_type}</p>
              <Badge variant="secondary" className="mt-1">
                Match Score: {recruit.match_score}%
              </Badge>
            </div>
            <Badge variant={
              recruit.status === "active" ? "default" :
              recruit.status === "pending" ? "secondary" : "outline"
            }>
              {recruit.status}
            </Badge>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            {recruit.purchased ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="flex items-start gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Email</p>
                    {isEditing ? (
                      <Input
                        value={getDisplayValue("email")}
                        onChange={(e) => handleFieldEdit("email", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <a href={`mailto:${getDisplayValue("email")}`} className="text-sm font-medium hover:underline">
                        {getDisplayValue("email")}
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Phone className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Phone</p>
                    {isEditing ? (
                      <Input
                        value={getDisplayValue("phone")}
                        onChange={(e) => handleFieldEdit("phone", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <a href={`tel:${getDisplayValue("phone")}`} className="text-sm font-medium hover:underline">
                        {getDisplayValue("phone")}
                      </a>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-6 bg-muted/50 rounded-lg border-2 border-dashed text-center">
                <p className="text-sm text-muted-foreground mb-2">Contact information is locked</p>
                <p className="text-xs text-muted-foreground mb-4">Purchase this recruit to unlock full contact details</p>
                <Button size="sm" className="bg-primary hover:bg-primary/90" onClick={() => window.location.href = '/client-billing'}>
                  <Mail className="h-4 w-4 mr-2" />
                  Unlock Contact Info
                </Button>
              </div>
            )}
          </div>

          <Separator />

          {/* Location Information */}
          {(recruit.pros.cities || recruit.pros.states) && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Location</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-muted-foreground">Cities</Label>
                    {isEditing ? (
                      <Input
                        value={editedFields.cities?.join(", ") || recruit.pros.cities?.join(", ") || ""}
                        onChange={(e) => handleFieldEdit("cities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        placeholder="City 1, City 2"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{getDisplayValue("cities")?.join(", ") || recruit.pros.cities?.join(", ") || "N/A"}</p>
                    )}
                  </div>
                  <div>
                    <Label className="text-sm text-muted-foreground">States</Label>
                    {isEditing ? (
                      <Input
                        value={editedFields.states?.join(", ") || recruit.pros.states?.join(", ") || ""}
                        onChange={(e) => handleFieldEdit("states", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                        placeholder="TX, CA"
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{getDisplayValue("states")?.join(", ") || recruit.pros.states?.join(", ") || "N/A"}</p>
                    )}
                  </div>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Professional Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {recruit.pros.brokerage && (
                <div className="flex items-start gap-3">
                  <Building2 className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Current Brokerage</p>
                    {isEditing ? (
                      <Input
                        value={editedFields.brokerage || recruit.pros.brokerage || ""}
                        onChange={(e) => handleFieldEdit("brokerage", e.target.value)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{getDisplayValue("brokerage") || recruit.pros.brokerage}</p>
                    )}
                  </div>
                </div>
              )}
              {recruit.pros.experience && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Experience</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedFields.experience !== undefined ? editedFields.experience : (recruit.pros.experience || 0)}
                        onChange={(e) => handleFieldEdit("experience", parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{getDisplayValue("experience") || recruit.pros.experience} years</p>
                    )}
                  </div>
                </div>
              )}
              {(recruit.pros.transactions_12mo || recruit.pros.transactions) && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">Annual Transactions</p>
                    {isEditing ? (
                      <Input
                        type="number"
                        value={editedFields.transactions_12mo !== undefined ? editedFields.transactions_12mo : (recruit.pros.transactions_12mo || recruit.pros.transactions || 0)}
                        onChange={(e) => handleFieldEdit("transactions_12mo", parseInt(e.target.value) || 0)}
                        className="mt-1"
                      />
                    ) : (
                      <p className="text-sm font-medium mt-1">{formatNumber(getDisplayValue("transactions_12mo") || recruit.pros.transactions_12mo || recruit.pros.transactions || 0)}</p>
                    )}
                  </div>
                </div>
              )}
              {recruit.pros.total_volume_12mo && (
                <div className="flex items-start gap-3">
                  <TrendingUp className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground">Annual Volume</p>
                    <p className="text-sm font-medium">${formatNumber(recruit.pros.total_volume_12mo)}</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* Notes */}
          {clientId && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Your Notes (Private)</h3>
                <Textarea
                  placeholder="Add your private notes about this recruit..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={4}
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground">
                  These notes are only visible to you
                </p>
              </div>
              <Separator />
            </>
          )}

          {/* Match Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Match Information</h3>
            <div className="flex items-start gap-3">
              <Calendar className="h-5 w-5 text-muted-foreground mt-0.5" />
              <div>
                <p className="text-sm text-muted-foreground">Matched On</p>
                <p className="text-sm font-medium">{formatDate(recruit.created_at)}</p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-4">
            {clientId && isEditing ? (
              <Button 
                className="flex-1 bg-[#35a87e] hover:bg-[#2d8f6a]" 
                onClick={handleSave}
                disabled={isSaving}
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Saving..." : "Save Changes"}
              </Button>
            ) : recruit.purchased ? (
              <>
                <Button className="flex-1" onClick={() => window.open(`mailto:${getDisplayValue("email")}`, '_blank')}>
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
                <Button variant="outline" className="flex-1" onClick={() => window.open(`tel:${getDisplayValue("phone")}`, '_blank')}>
                  <Phone className="h-4 w-4 mr-2" />
                  Call
                </Button>
              </>
            ) : (
              <Button className="flex-1 bg-primary hover:bg-primary/90" onClick={() => window.location.href = '/client-billing'}>
                <Mail className="h-4 w-4 mr-2" />
                Unlock to Contact
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
