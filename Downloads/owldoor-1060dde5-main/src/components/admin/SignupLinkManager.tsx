import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Copy, Plus, Pencil, Trash2, ExternalLink } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";

const SignupLinkManager = () => {
  const [links, setLinks] = useState<any[]>([]);
  const [packages, setPackages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<any>(null);
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    package_id: "",
    link_slug: "",
    max_uses: "",
    expires_at: "",
    custom_verbiage: {
      title: "",
      subtitle: "",
      step1_title: "",
      step2_title: "",
      step3_title: "",
      step4_title: "",
      step5_title: "",
      step6_title: "",
      step7_title: "",
    },
  });

  useEffect(() => {
    fetchLinks();
    fetchPackages();
  }, []);

  const fetchLinks = async () => {
    try {
      const { data, error } = await supabase
        .from("signup_links")
        .select(`
          *,
          pricing_packages (name, monthly_cost)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setLinks(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
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
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const linkData = {
        name: formData.name,
        description: formData.description,
        package_id: formData.package_id || null,
        link_slug: formData.link_slug.toLowerCase().replace(/[^a-z0-9-]/g, '-'),
        max_uses: formData.max_uses ? parseInt(formData.max_uses) : null,
        expires_at: formData.expires_at || null,
        custom_verbiage: formData.custom_verbiage,
      };

      if (editingLink) {
        const { error } = await supabase
          .from("signup_links")
          .update(linkData)
          .eq("id", editingLink.id);

        if (error) throw error;
        toast({ title: "Link updated successfully" });
      } else {
        const { error } = await supabase
          .from("signup_links")
          .insert(linkData);

        if (error) throw error;
        toast({ title: "Link created successfully" });
      }

      setDialogOpen(false);
      resetForm();
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (link: any) => {
    setEditingLink(link);
    setFormData({
      name: link.name,
      description: link.description || "",
      package_id: link.package_id || "",
      link_slug: link.link_slug,
      max_uses: link.max_uses?.toString() || "",
      expires_at: link.expires_at ? new Date(link.expires_at).toISOString().split('T')[0] : "",
      custom_verbiage: link.custom_verbiage || {
        title: "",
        subtitle: "",
        step1_title: "",
        step2_title: "",
        step3_title: "",
        step4_title: "",
        step5_title: "",
        step6_title: "",
        step7_title: "",
      },
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this signup link?")) return;

    try {
      const { error } = await supabase
        .from("signup_links")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast({ title: "Link deleted successfully" });
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const toggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("signup_links")
        .update({ active: !currentActive })
        .eq("id", id);

      if (error) throw error;
      toast({ title: `Link ${!currentActive ? 'activated' : 'deactivated'} successfully` });
      fetchLinks();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const copyToClipboard = (slug: string) => {
    const url = `${window.location.origin}/team-signup?link=${slug}`;
    navigator.clipboard.writeText(url);
    toast({ title: "Link copied to clipboard!" });
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      package_id: "",
      link_slug: "",
      max_uses: "",
      expires_at: "",
      custom_verbiage: {
        title: "",
        subtitle: "",
        step1_title: "",
        step2_title: "",
        step3_title: "",
        step4_title: "",
        step5_title: "",
        step6_title: "",
        step7_title: "",
      },
    });
    setEditingLink(null);
  };

  const handleDialogClose = () => {
    setDialogOpen(false);
    resetForm();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Sign Up Links</h2>
          <p className="text-muted-foreground">Create and manage custom sign-up links for different packages</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => {
          if (open) {
            resetForm();
            setDialogOpen(true);
          } else {
            handleDialogClose();
          }
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingLink ? "Edit Sign Up Link" : "Create Sign Up Link"}</DialogTitle>
              <DialogDescription>
                Create a custom sign-up link with personalized messaging for a specific package
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Link Name *</Label>
                <Input
                  id="name"
                  placeholder="e.g., Summer Promo 2025"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="link_slug">URL Slug *</Label>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">/team-signup?link=</span>
                  <Input
                    id="link_slug"
                    placeholder="summer-promo-2025"
                    value={formData.link_slug}
                    onChange={(e) => setFormData({ ...formData, link_slug: e.target.value })}
                    required
                  />
                </div>
                <p className="text-xs text-muted-foreground">Only letters, numbers, and hyphens</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="package_id">Package</Label>
                <Select
                  value={formData.package_id}
                  onValueChange={(value) => setFormData({ ...formData, package_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a package" />
                  </SelectTrigger>
                  <SelectContent>
                    {packages.map((pkg) => (
                      <SelectItem key={pkg.id} value={pkg.id}>
                        {pkg.name} - ${pkg.monthly_cost}/mo
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Internal notes about this link"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="max_uses">Max Uses</Label>
                  <Input
                    id="max_uses"
                    type="number"
                    placeholder="Unlimited"
                    value={formData.max_uses}
                    onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="expires_at">Expiration Date</Label>
                  <Input
                    id="expires_at"
                    type="date"
                    value={formData.expires_at}
                    onChange={(e) => setFormData({ ...formData, expires_at: e.target.value })}
                  />
                </div>
              </div>

              <div className="border-t pt-4 space-y-4">
                <h3 className="font-semibold">Custom Verbiage (Optional)</h3>
                <p className="text-sm text-muted-foreground">Customize the text shown in the sign-up form</p>

                <div className="space-y-2">
                  <Label>Main Title</Label>
                  <Input
                    placeholder="e.g., Join Our Elite Real Estate Network"
                    value={formData.custom_verbiage.title}
                    onChange={(e) => setFormData({
                      ...formData,
                      custom_verbiage: { ...formData.custom_verbiage, title: e.target.value }
                    })}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Subtitle</Label>
                  <Input
                    placeholder="e.g., Special offer - Limited time only"
                    value={formData.custom_verbiage.subtitle}
                    onChange={(e) => setFormData({
                      ...formData,
                      custom_verbiage: { ...formData.custom_verbiage, subtitle: e.target.value }
                    })}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {[1, 2, 3, 4, 5, 6, 7].map((step) => (
                    <div key={step} className="space-y-2">
                      <Label>Step {step} Title</Label>
                      <Input
                        placeholder={`Custom title for step ${step}`}
                        value={formData.custom_verbiage[`step${step}_title` as keyof typeof formData.custom_verbiage]}
                        onChange={(e) => setFormData({
                          ...formData,
                          custom_verbiage: { 
                            ...formData.custom_verbiage, 
                            [`step${step}_title`]: e.target.value 
                          }
                        })}
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleDialogClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {editingLink ? "Update Link" : "Create Link"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4">
        {links.map((link) => (
          <Card key={link.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle>{link.name}</CardTitle>
                    <Badge variant={link.active ? "default" : "secondary"}>
                      {link.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  {link.description && (
                    <CardDescription>{link.description}</CardDescription>
                  )}
                  {link.pricing_packages && (
                    <p className="text-sm text-muted-foreground">
                      Package: {link.pricing_packages.name} (${link.pricing_packages.monthly_cost}/mo)
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={link.active}
                    onCheckedChange={() => toggleActive(link.id, link.active)}
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center gap-2 p-3 bg-muted rounded-md">
                  <code className="flex-1 text-sm">
                    {window.location.origin}/team-signup?link={link.link_slug}
                  </code>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => copyToClipboard(link.link_slug)}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => window.open(`/team-signup?link=${link.link_slug}`, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Uses: {link.current_uses} {link.max_uses ? `/ ${link.max_uses}` : ""}</span>
                  {link.expires_at && (
                    <span>Expires: {new Date(link.expires_at).toLocaleDateString()}</span>
                  )}
                  <span className="ml-auto">
                    Created: {new Date(link.created_at).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(link)}
                  >
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleDelete(link.id)}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {links.length === 0 && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <p className="text-muted-foreground mb-4">No signup links created yet</p>
              <Button onClick={() => setDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Create Your First Link
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SignupLinkManager;
