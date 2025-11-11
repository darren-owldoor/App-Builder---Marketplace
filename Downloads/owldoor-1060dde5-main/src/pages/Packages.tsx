import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Package, Plus, Edit, Trash2, DollarSign, MessageSquare, Users, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PricingPackage {
  id: string;
  name: string;
  description: string | null;
  monthly_cost: number;
  credits_included: number;
  ai_usage_price: number;
  sms_price_per_additional: number;
  sms_included: number;
  includes_twilio_number: boolean;
  leads_per_month: number;
  price_per_lead: number;
  lead_pricing_rules: any;
  package_type: string;
  active: boolean;
}

interface LeadPricingRule {
  field: string;
  operator: string;
  value: number;
  price_modifier: number;
}

export default function Packages() {
  const [packages, setPackages] = useState<PricingPackage[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingPackage, setEditingPackage] = useState<PricingPackage | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    monthly_cost: 0,
    credits_included: 0,
    ai_usage_price: 0,
    sms_price_per_additional: 0,
    sms_included: 0,
    includes_twilio_number: false,
    leads_per_month: 0,
    price_per_lead: 0,
    package_type: "non_exclusive",
    active: true,
  });
  const [pricingRules, setPricingRules] = useState<LeadPricingRule[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
    checkAdminRole();
  }, []);

  const checkAdminRole = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .eq('role', 'admin')
        .single();
      
      setIsAdmin(!!data);
    } catch (error) {
      setIsAdmin(false);
    }
  };

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_packages")
        .select("*")
        .order("monthly_cost", { ascending: true });

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      toast({
        title: "Error fetching packages",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      toast({
        title: "Invalid package",
        description: "Please enter a package name",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const packageData = {
        ...formData,
        lead_pricing_rules: pricingRules as any,
      };

      if (editingPackage) {
        const { error } = await supabase
          .from("pricing_packages")
          .update(packageData)
          .eq("id", editingPackage.id);

        if (error) throw error;
        toast({ title: "Package updated successfully" });
      } else {
        const { error } = await supabase
          .from("pricing_packages")
          .insert(packageData);

        if (error) throw error;
        toast({ title: "Package created successfully" });
      }

      setIsDialogOpen(false);
      resetForm();
      fetchPackages();
    } catch (error: any) {
      toast({
        title: "Error saving package",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (pkg: PricingPackage) => {
    setEditingPackage(pkg);
    setFormData({
      name: pkg.name,
      description: pkg.description || "",
      monthly_cost: pkg.monthly_cost,
      credits_included: pkg.credits_included,
      ai_usage_price: pkg.ai_usage_price,
      sms_price_per_additional: pkg.sms_price_per_additional,
      sms_included: pkg.sms_included,
      includes_twilio_number: pkg.includes_twilio_number,
      leads_per_month: pkg.leads_per_month,
      price_per_lead: pkg.price_per_lead,
      package_type: pkg.package_type || "non_exclusive",
      active: pkg.active,
    });
    setPricingRules(pkg.lead_pricing_rules || []);
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return;

    try {
      const { error } = await supabase
        .from("pricing_packages")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Package deleted successfully" });
      fetchPackages();
    } catch (error: any) {
      toast({
        title: "Error deleting package",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const resetForm = () => {
    setEditingPackage(null);
    setFormData({
      name: "",
      description: "",
      monthly_cost: 0,
      credits_included: 0,
      ai_usage_price: 0,
      sms_price_per_additional: 0,
      sms_included: 0,
      includes_twilio_number: false,
      leads_per_month: 0,
      package_type: "non_exclusive",
      price_per_lead: 0,
      active: true,
    });
    setPricingRules([]);
  };

  const addPricingRule = () => {
    setPricingRules([
      ...pricingRules,
      { field: "transactions", operator: ">=", value: 0, price_modifier: 0 },
    ]);
  };

  const updatePricingRule = (index: number, updates: Partial<LeadPricingRule>) => {
    const newRules = [...pricingRules];
    newRules[index] = { ...newRules[index], ...updates };
    setPricingRules(newRules);
  };

  const removePricingRule = (index: number) => {
    setPricingRules(pricingRules.filter((_, i) => i !== index));
  };

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <Link to="/admin">
            <img src="/owldoor-logo-new.png" alt="OwlDoor" className="h-10 w-10 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Pricing Packages</h1>
            <p className="text-muted-foreground">Manage subscription packages and pricing</p>
          </div>
        </div>
        {isAdmin && (
          <Dialog open={isDialogOpen} onOpenChange={(open) => {
            setIsDialogOpen(open);
            if (!open) resetForm();
          }}>
            <DialogTrigger asChild>
              <Button size="lg">
                <Plus className="mr-2 h-5 w-5" />
                Create Package
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingPackage ? "Edit Package" : "Create New Package"}</DialogTitle>
              <DialogDescription>
                Configure pricing, features, and lead pricing rules
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <Label htmlFor="name">Package Name</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Professional Plan"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Package description..."
                  />
                </div>
                <div>
                  <Label htmlFor="package_type">Package Type</Label>
                  <Select
                    value={formData.package_type}
                    onValueChange={(value) => setFormData({ ...formData, package_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="exclusive">Exclusive (1-to-1 matching)</SelectItem>
                      <SelectItem value="non_exclusive">Non-Exclusive (1-to-many)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="monthly_cost">Monthly Cost ($)</Label>
                  <Input
                    id="monthly_cost"
                    type="number"
                    step="0.01"
                    value={formData.monthly_cost}
                    onChange={(e) => setFormData({ ...formData, monthly_cost: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="credits_included">Credits Included</Label>
                  <Input
                    id="credits_included"
                    type="number"
                    value={formData.credits_included}
                    onChange={(e) => setFormData({ ...formData, credits_included: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="ai_usage_price">AI Usage Price ($)</Label>
                  <Input
                    id="ai_usage_price"
                    type="number"
                    step="0.01"
                    value={formData.ai_usage_price}
                    onChange={(e) => setFormData({ ...formData, ai_usage_price: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="sms_included">SMS Included</Label>
                  <Input
                    id="sms_included"
                    type="number"
                    value={formData.sms_included}
                    onChange={(e) => setFormData({ ...formData, sms_included: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="sms_price">SMS Price (per additional)</Label>
                  <Input
                    id="sms_price"
                    type="number"
                    step="0.01"
                    value={formData.sms_price_per_additional}
                    onChange={(e) => setFormData({ ...formData, sms_price_per_additional: parseFloat(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="leads_per_month">Leads Per Month</Label>
                  <Input
                    id="leads_per_month"
                    type="number"
                    value={formData.leads_per_month}
                    onChange={(e) => setFormData({ ...formData, leads_per_month: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="price_per_lead">Base Price Per Lead ($)</Label>
                  <Input
                    id="price_per_lead"
                    type="number"
                    step="0.01"
                    value={formData.price_per_lead}
                    onChange={(e) => setFormData({ ...formData, price_per_lead: parseFloat(e.target.value) })}
                  />
                </div>
                <div className="flex items-center space-x-2 col-span-2">
                  <Checkbox
                    id="twilio_number"
                    checked={formData.includes_twilio_number}
                    onCheckedChange={(checked) => setFormData({ ...formData, includes_twilio_number: checked === true })}
                  />
                  <Label htmlFor="twilio_number">Includes Twilio Number</Label>
                </div>
                <div className="flex items-center space-x-2 col-span-2">
                  <Checkbox
                    id="active"
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked === true })}
                  />
                  <Label htmlFor="active">Active Package</Label>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Lead Pricing Rules</Label>
                  <Button type="button" size="sm" variant="outline" onClick={addPricingRule}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Rule
                  </Button>
                </div>
                {pricingRules.map((rule, index) => (
                  <div key={index} className="grid grid-cols-5 gap-2 items-end">
                    <Select
                      value={rule.field}
                      onValueChange={(value) => updatePricingRule(index, { field: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="transactions">Transactions</SelectItem>
                        <SelectItem value="experience">Experience</SelectItem>
                        <SelectItem value="motivation">Motivation</SelectItem>
                        <SelectItem value="total_sales">Total Sales</SelectItem>
                      </SelectContent>
                    </Select>
                    <Select
                      value={rule.operator}
                      onValueChange={(value) => updatePricingRule(index, { operator: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value=">=">≥</SelectItem>
                        <SelectItem value="<=">≤</SelectItem>
                        <SelectItem value="=">=</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Value"
                      value={rule.value}
                      onChange={(e) => updatePricingRule(index, { value: parseFloat(e.target.value) })}
                    />
                    <Input
                      type="number"
                      step="0.01"
                      placeholder="$ Modifier"
                      value={rule.price_modifier}
                      onChange={(e) => updatePricingRule(index, { price_modifier: parseFloat(e.target.value) })}
                    />
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => removePricingRule(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>

              <Button onClick={handleSubmit} className="w-full" disabled={loading}>
                {loading ? "Saving..." : editingPackage ? "Update Package" : "Create Package"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={!pkg.active ? "opacity-60" : ""}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-5 w-5" />
                    {pkg.name}
                  </CardTitle>
                  <CardDescription className="mt-2">{pkg.description}</CardDescription>
                </div>
                {isAdmin && (
                  <div className="flex gap-1">
                    <Button size="sm" variant="ghost" onClick={() => handleEdit(pkg)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(pkg.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="text-3xl font-bold">
                ${pkg.monthly_cost}
                <span className="text-sm font-normal text-muted-foreground">/month</span>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                  <span>{pkg.credits_included} credits included</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="h-4 w-4 text-muted-foreground" />
                  <span>AI Usage: ${pkg.ai_usage_price}/use</span>
                </div>
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-muted-foreground" />
                  <span>{pkg.sms_included} SMS included (${pkg.sms_price_per_additional} each after)</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span>{pkg.leads_per_month > 0 ? `${pkg.leads_per_month} leads/month` : `$${pkg.price_per_lead}/lead`}</span>
                </div>
                {pkg.includes_twilio_number && (
                  <div className="flex items-center gap-2 text-primary">
                    <Package className="h-4 w-4" />
                    <span className="font-medium">Includes Twilio Number</span>
                  </div>
                )}
              </div>

              {pkg.lead_pricing_rules && pkg.lead_pricing_rules.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs font-medium mb-2">Lead Pricing Rules:</p>
                  <div className="space-y-1">
                    {pkg.lead_pricing_rules.map((rule: LeadPricingRule, idx: number) => (
                      <p key={idx} className="text-xs text-muted-foreground">
                        {rule.field} {rule.operator} {rule.value}: +${rule.price_modifier}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}