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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Copy, Link, Package, CreditCard, UserPlus, Save } from "lucide-react";
import { ClientReviewsManager } from "./ClientReviewsManager";

const PROVIDES_OPTIONS = [
  "Leads Provided",
  "Coaching & Mentorship",
  "High Splits",
  "Great Leadership",
  "Great Support",
  "Referral Partnerships",
  "Growth Opportunities",
  "Free CRM & Tech",
  "Great Atmosphere",
];

interface AdminEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: "user" | "client";
  recordId: string;
  onSuccess?: () => void;
}

interface Package {
  id: string;
  name: string;
  credits_included: number;
}

export function AdminEditModal({
  open,
  onOpenChange,
  type,
  recordId,
  onSuccess,
}: AdminEditModalProps) {
  const [loading, setLoading] = useState(false);
  const [packages, setPackages] = useState<Package[]>([]);
  const [magicLink, setMagicLink] = useState("");
  const [formData, setFormData] = useState<any>({});

  useEffect(() => {
    if (open && recordId) {
      fetchRecord();
      fetchPackages();
    }
  }, [open, recordId]);

  const fetchRecord = async () => {
    try {
      if (type === "client") {
        const { data, error } = await supabase
          .from("clients")
          .select("*")
          .eq("id", recordId)
          .single();

        if (error) throw error;
        setFormData(data);
      } else {
        const { data, error } = await supabase
          .from("pros")
          .select("*")
          .eq("id", recordId)
          .single();

        if (error) throw error;
        setFormData(data);
      }
    } catch (error: any) {
      console.error("Error fetching record:", error);
      toast.error("Failed to load record details");
    }
  };

  const fetchPackages = async () => {
    // Packages will be implemented later - for now use empty array
    setPackages([]);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const table = type === "client" ? "clients" : "pros";
      const { error } = await supabase
        .from(table)
        .update(formData)
        .eq("id", recordId);

      if (error) throw error;

      toast.success(`${type === "client" ? "Client" : "User"} updated successfully`);
      onSuccess?.();
      onOpenChange(false);
    } catch (error: any) {
      console.error("Error updating record:", error);
      toast.error("Failed to update record");
    } finally {
      setLoading(false);
    }
  };

  const handleAddCredits = async (amount: number) => {
    if (type !== "client") return;
    
    setLoading(true);
    try {
      const newBalance = (formData.credits_balance || 0) + amount;
      const { error } = await supabase
        .from("clients")
        .update({ 
          credits_balance: newBalance,
          credits_used: formData.credits_used || 0
        })
        .eq("id", recordId);

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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[95vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">
            {type === "client" ? "🏢 Client Admin Panel" : "👤 User Admin Panel"}
          </DialogTitle>
          <DialogDescription className="text-base">
            Complete management for {formData[type === "client" ? "company_name" : "full_name"] || "this account"} - 
            Edit details, manage credits, assign packages, generate magic links & more
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Info */}
          <div className="space-y-4 border-t pt-4">
            <h3 className="text-base font-bold">📝 Basic Information</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="company_name">
                  {type === "client" ? "Company Name" : "First Name"}
                </Label>
                <Input
                  id="company_name"
                  value={formData[type === "client" ? "company_name" : "first_name"] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [type === "client" ? "company_name" : "first_name"]: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="contact_name">
                  {type === "client" ? "Contact Name" : "Last Name"}
                </Label>
                <Input
                  id="contact_name"
                  value={formData[type === "client" ? "contact_name" : "last_name"] || ""}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      [type === "client" ? "contact_name" : "last_name"]: e.target.value,
                    })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
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
            </div>

            {type === "client" && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hide_bids"
                      checked={formData.hide_bids || false}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, hide_bids: checked })
                      }
                    />
                    <label
                      htmlFor="hide_bids"
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      Hide Bids from Public
                    </label>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cities">Cities (comma-separated)</Label>
                    <Input
                      id="cities"
                      value={Array.isArray(formData.cities) ? formData.cities.join(", ") : ""}
                      onChange={(e) => {
                        const citiesArray = e.target.value
                          .split(",")
                          .map(city => city.trim())
                          .filter(city => city.length > 0);
                        setFormData({ ...formData, cities: citiesArray });
                      }}
                      placeholder="San Diego, Los Angeles, Phoenix"
                    />
                  </div>

                  <div>
                    <Label htmlFor="states">States (comma-separated)</Label>
                    <Input
                      id="states"
                      value={Array.isArray(formData.states) ? formData.states.join(", ") : ""}
                      onChange={(e) => {
                        const statesArray = e.target.value
                          .split(",")
                          .map(state => state.trim())
                          .filter(state => state.length > 0);
                        setFormData({ ...formData, states: statesArray });
                      }}
                      placeholder="CA, AZ, NV"
                    />
                  </div>
                </div>
              </>
            )}

            {type === "user" && (
              <div>
                <Label htmlFor="pipeline_stage">Pipeline Stage</Label>
                <Select
                  value={formData.pipeline_stage || "new"}
                  onValueChange={(value) =>
                    setFormData({ ...formData, pipeline_stage: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="interview">Interview</SelectItem>
                    <SelectItem value="offer">Offer</SelectItem>
                    <SelectItem value="onboarding">Onboarding</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Provides (Clients only) */}
            {type === "client" && (
              <div>
                <Label>What We Provide</Label>
                <div className="grid grid-cols-2 gap-3 mt-2">
                  {PROVIDES_OPTIONS.map((option) => (
                    <div key={option} className="flex items-center space-x-2">
                      <Checkbox
                        id={`provides-${option}`}
                        checked={(formData.provides || []).includes(option)}
                        onCheckedChange={(checked) => {
                          const currentProvides = formData.provides || [];
                          const newProvides = checked
                            ? [...currentProvides, option]
                            : currentProvides.filter((p: string) => p !== option);
                          setFormData({ ...formData, provides: newProvides });
                        }}
                      />
                      <label
                        htmlFor={`provides-${option}`}
                        className="text-sm font-medium leading-none cursor-pointer"
                      >
                        {option}
                      </label>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Credits & Package (Clients only) */}
          {type === "client" && (
            <div className="space-y-4 border-t pt-4 bg-green-50 dark:bg-green-950/20 p-4 rounded-lg">
              <h3 className="text-base font-bold flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Credits & Package Management
              </h3>

              <div className="grid grid-cols-2 gap-4">
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
              </div>

              <div>
                <Label>Quick Add Credits</Label>
                <div className="flex gap-2 mt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCredits(10)}
                    disabled={loading}
                  >
                    +10
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCredits(25)}
                    disabled={loading}
                  >
                    +25
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCredits(50)}
                    disabled={loading}
                  >
                    +50
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAddCredits(100)}
                    disabled={loading}
                  >
                    +100
                  </Button>
                </div>
              </div>

              <div>
                <Label htmlFor="package">Assign Package</Label>
                <Select
                  value={formData.current_package_id || ""}
                  onValueChange={(value) =>
                    setFormData({ ...formData, current_package_id: value })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">No Package</SelectItem>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} ({pkg.credits_included} credits)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Magic Link */}
          <div className="space-y-4 border-t pt-4 bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
            <h3 className="text-base font-bold flex items-center gap-2">
              <Link className="w-5 h-5 text-blue-600" />
              🔗 Generate Magic Link (24hr Access)
            </h3>
            <p className="text-sm text-muted-foreground">
              Create a temporary login link to access this account without password. Perfect for support & testing.
            </p>

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
                  <Input
                    value={magicLink}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button
                    variant="outline"
                    size="icon"
                    onClick={copyMagicLink}
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Share this link to grant temporary access to this account
                </p>
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

        {/* Reviews Section (Clients only) */}
        {type === "client" && recordId && formData.company_name && (
          <div className="mt-6 border-t pt-6">
            <ClientReviewsManager 
              clientId={recordId}
              clientName={formData.company_name}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
