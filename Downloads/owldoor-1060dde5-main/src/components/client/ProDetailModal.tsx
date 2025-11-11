import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { formatNumber } from "@/lib/utils";
import {
  MapPin,
  Phone,
  Mail,
  Briefcase,
  TrendingUp,
  CheckCircle,
  Save,
  Edit2,
} from "lucide-react";

interface Pro {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  city?: string;
  state?: string;
  cities?: string[];
  states?: string[];
  zip_codes?: string[];
  experience?: number;
  transactions?: number;
  total_volume_12mo?: number;
  wants?: string[];
  motivation?: number;
  pipeline_stage?: string;
  user_id?: string;
  brokerage?: string;
  company?: string;
}

interface ProDetailModalProps {
  pro: Pro | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
}

export const ProDetailModal = ({ pro, open, onOpenChange, clientId }: ProDetailModalProps) => {
  const { toast } = useToast();
  const [notes, setNotes] = useState("");
  const [editedFields, setEditedFields] = useState<Record<string, any>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [notesId, setNotesId] = useState<string | null>(null);

  useEffect(() => {
    if (pro && open) {
      loadClientNotes();
    }
  }, [pro, open]);

  const loadClientNotes = async () => {
    if (!pro) return;

    const { data, error } = await supabase
      .from("client_pro_notes")
      .select("*")
      .eq("client_id", clientId)
      .eq("pro_id", pro.id)
      .maybeSingle();

    if (error) {
      console.error("Error loading notes:", error);
      return;
    }

    if (data) {
      setNotesId(data.id);
      setNotes(data.notes || "");
      const overrides = typeof data.field_overrides === 'object' && data.field_overrides !== null 
        ? data.field_overrides as Record<string, any>
        : {};
      setEditedFields(overrides);
    } else {
      setNotesId(null);
      setNotes("");
      setEditedFields({});
    }
  };

  const handleSave = async () => {
    if (!pro) return;
    setIsSaving(true);

    try {
      const payload = {
        client_id: clientId,
        pro_id: pro.id,
        notes: notes,
        field_overrides: editedFields,
        updated_at: new Date().toISOString(),
      };

      if (notesId) {
        // Update existing
        const { error } = await supabase
          .from("client_pro_notes")
          .update(payload)
          .eq("id", notesId);

        if (error) throw error;
      } else {
        // Insert new
        const { data, error } = await supabase
          .from("client_pro_notes")
          .insert(payload)
          .select()
          .single();

        if (error) throw error;
        setNotesId(data.id);
      }

      toast({
        title: "Saved",
        description: "Your notes and edits have been saved",
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving:", error);
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const getDisplayValue = (field: keyof Pro) => {
    if (editedFields[field] !== undefined) {
      return editedFields[field];
    }
    return pro?.[field];
  };

  const handleFieldEdit = (field: string, value: any) => {
    setEditedFields((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const getMotivationColor = (motivation?: number) => {
    if (!motivation) return "bg-gray-400";
    if (motivation >= 8) return "bg-green-500";
    if (motivation >= 5) return "bg-yellow-500";
    return "bg-red-500";
  };

  const formatVolume = (volume?: number) => {
    if (!volume) return "N/A";
    return `$${formatNumber(volume)}`;
  };

  if (!pro) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Professional Details</span>
            <Button
              variant={isEditing ? "default" : "outline"}
              size="sm"
              onClick={() => setIsEditing(!isEditing)}
              className={isEditing ? "bg-[#35a87e] hover:bg-[#2d8f6a]" : ""}
            >
              <Edit2 className="h-4 w-4 mr-2" />
              {isEditing ? "Editing" : "Edit Mode"}
            </Button>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-start gap-4">
            <Avatar className="h-20 w-20">
              <AvatarFallback className="bg-[#35a87e] text-white text-xl">
                {getInitials(pro.full_name)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{pro.full_name}</h2>
              <div className="flex items-center gap-2 mt-2">
                {pro.pipeline_stage === "accepted" && (
                  <Badge className="bg-[#35a87e] hover:bg-[#2d8f6a]">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Accepted
                  </Badge>
                )}
                <Badge variant="outline">Real Estate Agent</Badge>
              </div>
            </div>
          </div>

          <Separator />

          {/* Contact Information */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Contact Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Phone</Label>
                {isEditing ? (
                  <Input
                    value={getDisplayValue("phone") || ""}
                    onChange={(e) => handleFieldEdit("phone", e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    {getDisplayValue("phone") || "N/A"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                {isEditing ? (
                  <Input
                    value={getDisplayValue("email") || ""}
                    onChange={(e) => handleFieldEdit("email", e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                    {getDisplayValue("email") || "N/A"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Location */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Location</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Cities</Label>
                {isEditing ? (
                  <Input
                    value={editedFields.cities?.join(", ") || pro.cities?.join(", ") || ""}
                    onChange={(e) => handleFieldEdit("cities", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    placeholder="City 1, City 2"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {getDisplayValue("cities")?.join(", ") || pro.cities?.join(", ") || "N/A"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>States</Label>
                {isEditing ? (
                  <Input
                    value={editedFields.states?.join(", ") || pro.states?.join(", ") || ""}
                    onChange={(e) => handleFieldEdit("states", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    placeholder="TX, CA"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {getDisplayValue("states")?.join(", ") || pro.states?.join(", ") || "N/A"}
                  </div>
                )}
              </div>
            </div>
          </div>

          <Separator />

          {/* Professional Details */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Professional Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Brokerage/Company</Label>
                {isEditing ? (
                  <Input
                    value={editedFields.brokerage || pro.brokerage || editedFields.company || pro.company || ""}
                    onChange={(e) => handleFieldEdit(pro.brokerage ? "brokerage" : "company", e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    {pro.brokerage || pro.company || "N/A"}
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label>ZIP Codes</Label>
                {isEditing ? (
                  <Input
                    value={editedFields.zip_codes?.join(", ") || pro.zip_codes?.join(", ") || ""}
                    onChange={(e) => handleFieldEdit("zip_codes", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    placeholder="78701, 78702"
                  />
                ) : (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    {pro.zip_codes?.join(", ") || "N/A"}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Experience (years)</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedFields.experience !== undefined ? editedFields.experience : (pro.experience || 0)}
                    onChange={(e) => handleFieldEdit("experience", parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {pro.experience || 0} years
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Transactions</Label>
                {isEditing ? (
                  <Input
                    type="number"
                    value={editedFields.transactions !== undefined ? editedFields.transactions : (pro.transactions || 0)}
                    onChange={(e) => handleFieldEdit("transactions", parseInt(e.target.value) || 0)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatNumber(pro.transactions || 0)}
                    </span>
                  </div>
                )}
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Volume (12mo)</Label>
                <div className="flex items-center gap-2">
                  <span className="text-[#35a87e] font-bold">
                    {formatVolume(pro.total_volume_12mo)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Separator />

          {/* Looking For / Wants */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Looking For</h3>
            {isEditing ? (
              <Input
                value={editedFields.wants?.join(", ") || pro.wants?.join(", ") || ""}
                onChange={(e) => handleFieldEdit("wants", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                placeholder="Leads, Training, Support"
              />
            ) : pro.wants && pro.wants.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {pro.wants.map((want, idx) => (
                  <Badge key={idx} variant="secondary">
                    {want}
                  </Badge>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">None specified</p>
            )}
          </div>

          {/* Motivation */}
          {pro.motivation && (
            <>
              <div className="space-y-3">
                <h3 className="font-semibold text-lg">Motivation</h3>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${getMotivationColor(
                      pro.motivation
                    )}`}
                  />
                  <span className="font-medium">{pro.motivation}/10</span>
                </div>
              </div>
              <Separator />
            </>
          )}

          {/* Notes */}
          <div className="space-y-3">
            <h3 className="font-semibold text-lg">Your Notes (Private)</h3>
            <Textarea
              placeholder="Add your private notes about this professional..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={6}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              These notes are only visible to you and won't affect the public profile
            </p>
          </div>

          {/* Save Button */}
          <Button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#35a87e] hover:bg-[#2d8f6a]"
          >
            <Save className="h-4 w-4 mr-2" />
            {isSaving ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
