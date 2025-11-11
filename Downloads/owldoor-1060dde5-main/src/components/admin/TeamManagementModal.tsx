import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { 
  Copy, 
  Link, 
  CreditCard, 
  Save, 
  Building2, 
  MapPin,
  DollarSign,
  Award,
  Globe,
  Target,
  TrendingUp
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface TeamManagementModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId: string;
  onSuccess?: () => void;
}

export function TeamManagementModal({
  open,
  onOpenChange,
  teamId,
  onSuccess,
}: TeamManagementModalProps) {
  const [loading, setLoading] = useState(false);
  const [magicLink, setMagicLink] = useState("");
  const [formData, setFormData] = useState<any>({});
  const [completeness, setCompleteness] = useState(0);

  useEffect(() => {
    if (open && teamId) {
      fetchTeam();
    }
  }, [open, teamId]);

  const calculateCompleteness = (data: any) => {
    const fields = [
      'company_name', 'contact_name', 'email', 'phone', 'brokerage',
      'client_type', 'license_type', 'years_experience', 'avg_sale',
      'yearly_sales', 'image_url', 'website_url', 'linkedin_url',
      'cities', 'states', 'coverage_areas', 'skills', 'languages'
    ];
    
    let filled = 0;
    fields.forEach(field => {
      const value = data[field];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          filled++;
        } else if (!Array.isArray(value)) {
          filled++;
        }
      }
    });
    
    return Math.round((filled / fields.length) * 100);
  };

  const getFilledFields = (data: any) => {
    const fieldLabels: Record<string, string> = {
      company_name: 'Company',
      contact_name: 'Contact',
      email: 'Email',
      phone: 'Phone',
      brokerage: 'Brokerage',
      client_type: 'Type',
      license_type: 'License',
      years_experience: 'Experience',
      avg_sale: 'Avg Sale',
      yearly_sales: 'Yearly Sales',
      image_url: 'Photo',
      website_url: 'Website',
      linkedin_url: 'LinkedIn',
      cities: 'Cities',
      states: 'States',
      coverage_areas: 'Coverage',
      skills: 'Skills',
      languages: 'Languages',
    };

    const filled: string[] = [];
    Object.entries(fieldLabels).forEach(([field, label]) => {
      const value = data[field];
      if (value !== null && value !== undefined && value !== '') {
        if (Array.isArray(value) && value.length > 0) {
          filled.push(label);
        } else if (!Array.isArray(value)) {
          filled.push(label);
        }
      }
    });

    return filled;
  };

  const fetchTeam = async () => {
    try {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("id", teamId)
        .single();

      if (error) throw error;
      setFormData(data);
      setCompleteness(calculateCompleteness(data));
    } catch (error: any) {
      console.error("Error fetching team:", error);
      toast.error("Failed to load team details");
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("clients")
        .update(formData)
        .eq("id", teamId);

      if (error) throw error;

      toast.success("Team updated successfully");
      setCompleteness(calculateCompleteness(formData));
      onSuccess?.();
    } catch (error: any) {
      console.error("Error updating team:", error);
      toast.error("Failed to update team");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (amount: number) => {
    setLoading(true);
    try {
      const newBalance = (formData.credits_balance || 0) + amount;
      const { error } = await supabase
        .from("clients")
        .update({ 
          credits_balance: newBalance,
          credits_used: formData.credits_used || 0
        })
        .eq("id", teamId);

      if (error) throw error;

      setFormData({ ...formData, credits_balance: newBalance });
      toast.success(`Added ${amount} credits`);
    } catch (error: any) {
      console.error("Error adding credits:", error);
      toast.error("Failed to add credits");
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateMagicLink = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-magic-link', {
        body: { targetUserId: formData.user_id }
      });

      if (error) throw error;

      setMagicLink(data.magicLink);
      toast.success("Magic link generated!");
    } catch (error: any) {
      console.error("Error generating magic link:", error);
      toast.error(error.message || "Failed to generate magic link");
    } finally {
      setLoading(false);
    }
  };

  const copyMagicLink = () => {
    navigator.clipboard.writeText(magicLink);
    toast.success("Magic link copied to clipboard!");
  };

  const filledFields = getFilledFields(formData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Building2 className="h-6 w-6 text-primary" />
            Team/Company Management
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete profile and management for {formData.company_name || "this team"}
          </DialogDescription>
        </DialogHeader>

        {/* Profile Completeness */}
        <div className="space-y-2 bg-muted/50 p-4 rounded-lg">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold">Profile Completeness</Label>
            <Badge variant={completeness >= 80 ? "default" : completeness >= 50 ? "secondary" : "destructive"}>
              {completeness}%
            </Badge>
          </div>
          <Progress value={completeness} className="h-2" />
          <div className="flex flex-wrap gap-1 mt-2">
            {filledFields.map((field) => (
              <Badge key={field} variant="outline" className="text-xs">
                {field}
              </Badge>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={formData.company_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, company_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="contact_name">Contact Name</Label>
                <Input
                  id="contact_name"
                  value={formData.contact_name || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, contact_name: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="brokerage">Brokerage/Parent Company</Label>
                <Input
                  id="brokerage"
                  value={formData.brokerage || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, brokerage: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="client_type">Client Type</Label>
                <Select
                  value={formData.client_type || "real_estate"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, client_type: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="real_estate">Real Estate</SelectItem>
                    <SelectItem value="mortgage">Mortgage</SelectItem>
                    <SelectItem value="brokerage">Brokerage</SelectItem>
                    <SelectItem value="team">Team</SelectItem>
                    <SelectItem value="independent">Independent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.active || false}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, active: checked })
                }
              />
              <Label>Active Account</Label>
            </div>
          </div>

          {/* Location & Coverage */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Location & Coverage
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="cities">Cities (comma separated)</Label>
                <Input
                  id="cities"
                  value={formData.cities?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      cities: e.target.value.split(",").map(c => c.trim()).filter(c => c) 
                    })
                  }
                  placeholder="Phoenix, Scottsdale, Tempe"
                />
              </div>

              <div>
                <Label htmlFor="states">States (comma separated)</Label>
                <Input
                  id="states"
                  value={formData.states?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      states: e.target.value.split(",").map(s => s.trim()).filter(s => s) 
                    })
                  }
                  placeholder="AZ, CA, NV"
                />
              </div>

              <div>
                <Label htmlFor="zip_codes">ZIP Codes (comma separated)</Label>
                <Input
                  id="zip_codes"
                  value={formData.zip_codes?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      zip_codes: e.target.value.split(",").map(z => z.trim()).filter(z => z) 
                    })
                  }
                  placeholder="85001, 85002, 85003"
                />
              </div>

              <div>
                <Label htmlFor="county">County</Label>
                <Input
                  id="county"
                  value={formData.county || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, county: e.target.value })
                  }
                />
              </div>
            </div>
          </div>

          {/* Business Details */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Business Details
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="license_type">License Type</Label>
                <Input
                  id="license_type"
                  value={formData.license_type || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, license_type: e.target.value })
                  }
                  placeholder="Broker, Agent, LO, etc."
                />
              </div>

              <div>
                <Label htmlFor="years_experience">Years Experience</Label>
                <Input
                  id="years_experience"
                  type="number"
                  value={formData.years_experience || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, years_experience: parseInt(e.target.value) || null })
                  }
                />
              </div>

              <div>
                <Label htmlFor="avg_sale">Average Sale ($)</Label>
                <Input
                  id="avg_sale"
                  type="number"
                  value={formData.avg_sale || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, avg_sale: parseFloat(e.target.value) || null })
                  }
                />
              </div>

              <div>
                <Label htmlFor="yearly_sales">Yearly Sales ($)</Label>
                <Input
                  id="yearly_sales"
                  type="number"
                  value={formData.yearly_sales || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, yearly_sales: parseFloat(e.target.value) || null })
                  }
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="skills">Skills (comma separated)</Label>
                <Input
                  id="skills"
                  value={formData.skills?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      skills: e.target.value.split(",").map(s => s.trim()).filter(s => s) 
                    })
                  }
                  placeholder="First-time buyers, Luxury, Commercial"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="languages">Languages (comma separated)</Label>
                <Input
                  id="languages"
                  value={formData.languages?.join(", ") || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      languages: e.target.value.split(",").map(l => l.trim()).filter(l => l) 
                    })
                  }
                  placeholder="English, Spanish, Mandarin"
                />
              </div>
            </div>
          </div>

          {/* Online Presence */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Globe className="h-4 w-4" />
              Online Presence
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="website_url">Website URL</Label>
                <Input
                  id="website_url"
                  value={formData.website_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, website_url: e.target.value })
                  }
                  placeholder="https://"
                />
              </div>

              <div>
                <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                <Input
                  id="linkedin_url"
                  value={formData.linkedin_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, linkedin_url: e.target.value })
                  }
                  placeholder="https://linkedin.com/in/"
                />
              </div>

              <div>
                <Label htmlFor="facebook_url">Facebook URL</Label>
                <Input
                  id="facebook_url"
                  value={formData.facebook_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, facebook_url: e.target.value })
                  }
                  placeholder="https://facebook.com/"
                />
              </div>

              <div>
                <Label htmlFor="instagram_url">Instagram URL</Label>
                <Input
                  id="instagram_url"
                  value={formData.instagram_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, instagram_url: e.target.value })
                  }
                  placeholder="https://instagram.com/"
                />
              </div>

              <div>
                <Label htmlFor="image_url">Profile Image URL</Label>
                <Input
                  id="image_url"
                  value={formData.image_url || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, image_url: e.target.value })
                  }
                  placeholder="https://"
                />
              </div>
            </div>
          </div>

          {/* Credits & Package */}
          <div className="space-y-4 border-t pt-4 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
            <h3 className="text-base font-bold flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-green-600" />
              Credits & Billing
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Current Balance</Label>
                <div className="text-2xl font-bold text-green-600">
                  {formData.credits_balance || 0}
                </div>
              </div>
              <div>
                <Label>Credits Used</Label>
                <div className="text-2xl font-bold text-gray-600">
                  {formData.credits_used || 0}
                </div>
              </div>
              <div>
                <Label>Monthly Spend Max</Label>
                <Input
                  type="number"
                  value={formData.monthly_spend_maximum || ""}
                  onChange={(e) =>
                    setFormData({ 
                      ...formData, 
                      monthly_spend_maximum: parseFloat(e.target.value) || null 
                    })
                  }
                  placeholder="Unlimited"
                />
              </div>
            </div>

            <div>
              <Label>Quick Add Credits</Label>
              <div className="flex gap-2 mt-2">
                <Button variant="outline" size="sm" onClick={() => handleAddCredits(10)} disabled={loading}>
                  +10
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddCredits(25)} disabled={loading}>
                  +25
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddCredits(50)} disabled={loading}>
                  +50
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddCredits(100)} disabled={loading}>
                  +100
                </Button>
              </div>
            </div>
          </div>

          {/* Magic Link */}
          <div className="space-y-4 border-t pt-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-600" />
              Generate Magic Link (24hr Access)
            </h3>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleGenerateMagicLink}
                disabled={loading || !formData.user_id}
                className="flex-1"
              >
                <Link className="w-4 h-4 mr-2" />
                Generate Magic Link
              </Button>
            </div>

            {magicLink && (
              <div className="p-4 bg-muted rounded-lg space-y-2">
                <Label>Magic Link (expires in 24 hours)</Label>
                <div className="flex gap-2">
                  <Input value={magicLink} readOnly className="font-mono text-xs" />
                  <Button variant="outline" size="icon" onClick={copyMagicLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
