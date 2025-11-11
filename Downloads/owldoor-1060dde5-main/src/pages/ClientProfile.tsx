import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { Edit2, MapPin, Phone, Mail, Building2, Calendar, TrendingUp, Users } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";

const ClientProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchClientData();
  }, []);

  const fetchClientData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setClientData(data);
    } catch (error) {
      console.error("Error fetching client data:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: any) => {
    setClientData({ ...clientData, [field]: value });
    setHasChanges(true);
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be less than 5MB");
      return;
    }

    setUploading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar-${Date.now()}.${fileExt}`;

      // Upload to Supabase Storage (we'll need to create this bucket)
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update client profile
      const { error: updateError } = await supabase
        .from("clients")
        .update({ image_url: publicUrl })
        .eq("id", clientData.id);

      if (updateError) throw updateError;

      setClientData({ ...clientData, image_url: publicUrl });
      toast.success("Photo uploaded successfully");
    } catch (error: any) {
      console.error("Error uploading photo:", error);
      toast.error(error.message || "Failed to upload photo");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("clients")
        .update({
          first_name: clientData.first_name,
          last_name: clientData.last_name,
          contact_name: clientData.contact_name,
          company: clientData.company,
          brokerage: clientData.brokerage,
          phone: clientData.phone,
          years_experience: clientData.years_experience,
          yearly_sales: clientData.yearly_sales,
          avg_sale: clientData.avg_sale,
          bio: clientData.bio,
          provides: clientData.provides,
          blocklist_csv: clientData.blocklist_csv,
        })
        .eq("id", clientData.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      setEditing(false);
      setHasChanges(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const initials = `${clientData?.first_name?.[0] || ''}${clientData?.last_name?.[0] || ''}`.toUpperCase();

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/client-dashboard")}>
            <img src={owlDoorLogo} alt="OwlDoor" className="h-10" />
          </div>
          <div className="flex items-center gap-3">
            {!editing ? (
              <Button onClick={() => setEditing(true)} className="gap-2">
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => {
                  setEditing(false);
                  setHasChanges(false);
                  fetchClientData();
                }}>
                  Cancel
                </Button>
                <Button onClick={handleSave}>
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary via-primary/95 to-primary/90 text-primary-foreground py-12 px-6">
        <div className="container mx-auto max-w-7xl">
          <div className="flex gap-8 items-start">
            <div className="relative">
              <div className="w-36 h-36 rounded-full bg-card flex items-center justify-center text-5xl font-bold text-primary border-4 border-primary-foreground shadow-2xl">
                {initials || '?'}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                {clientData?.contact_name || clientData?.first_name + ' ' + clientData?.last_name || 'Your Profile'}
              </h1>
              <div className="flex items-center gap-4 flex-wrap mb-4 opacity-95">
                <span className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  {clientData?.company || clientData?.brokerage || 'Real Estate Professional'}
                </span>
                <span className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  {clientData?.years_experience || 0} Years Experience
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards - Overlapping Hero */}
      <section className="container mx-auto max-w-7xl px-6 -mt-8 mb-8 relative z-10">
        <Card className="shadow-xl border-2">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center p-4 border-r last:border-r-0">
                <div className="text-4xl font-bold text-primary mb-2">
                  {clientData?.years_experience || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Years Experience
                </div>
              </div>
              <div className="text-center p-4 border-r last:border-r-0">
                <div className="text-4xl font-bold text-primary mb-2">
                  ${((clientData?.yearly_sales || 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Yearly Sales
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl font-bold text-primary mb-2">
                  ${((clientData?.avg_sale || 0) / 1000).toFixed(0)}K
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Avg Sale Price
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <main className="container mx-auto px-6 pb-12 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar Navigation */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-4">
                <div className="space-y-1">
                  <div className="px-3 py-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Profile Sections
                  </div>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors font-medium text-sm">
                    Basic Information
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors font-medium text-sm">
                    Experience
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors font-medium text-sm">
                    About Me
                  </button>
                </div>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Contact</Label>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Mail className="h-4 w-4" />
                        <span className="truncate">{clientData?.email}</span>
                      </div>
                      {clientData?.phone && (
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="h-4 w-4" />
                          <span>{clientData.phone}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content - Editable Forms */}
          <div className="lg:col-span-3 space-y-6">
           {/* Basic Information */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-xl">Basic Information</CardTitle>
                <p className="text-sm text-muted-foreground">Update your personal details</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={clientData?.first_name || ''}
                      onChange={(e) => handleFieldChange('first_name', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={clientData?.last_name || ''}
                      onChange={(e) => handleFieldChange('last_name', e.target.value)}
                      disabled={!editing}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={clientData?.phone || ''}
                    onChange={(e) => handleFieldChange('phone', e.target.value)}
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company">Company Name</Label>
                  <Input
                    id="company"
                    value={clientData?.company || ''}
                    onChange={(e) => handleFieldChange('company', e.target.value)}
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="brokerage">Brokerage</Label>
                  <Input
                    id="brokerage"
                    value={clientData?.brokerage || ''}
                    onChange={(e) => handleFieldChange('brokerage', e.target.value)}
                    disabled={!editing}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Experience & Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>Experience & Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="years_experience">Years Experience</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      value={clientData?.years_experience || ''}
                      onChange={(e) => handleFieldChange('years_experience', parseInt(e.target.value))}
                      disabled={!editing}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="yearly_sales">Yearly Sales ($)</Label>
                    <Input
                      id="yearly_sales"
                      type="number"
                      value={clientData?.yearly_sales || ''}
                      onChange={(e) => handleFieldChange('yearly_sales', parseFloat(e.target.value))}
                      disabled={!editing}
                      min="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="avg_sale">Average Sale ($)</Label>
                    <Input
                      id="avg_sale"
                      type="number"
                      value={clientData?.avg_sale || ''}
                      onChange={(e) => handleFieldChange('avg_sale', parseFloat(e.target.value))}
                      disabled={!editing}
                      min="0"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* About Me */}
            <Card>
              <CardHeader>
                <CardTitle>About Me</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={clientData?.bio || ''}
                    onChange={(e) => handleFieldChange('bio', e.target.value)}
                    disabled={!editing}
                    rows={4}
                    placeholder="Tell us about yourself and your business..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Wants & Needs */}
            <Card>
              <CardHeader>
                <CardTitle>Wants & Needs</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="provides">What We Provide to Agents</Label>
                  <Textarea
                    id="provides"
                    value={clientData?.provides || ''}
                    onChange={(e) => handleFieldChange('provides', e.target.value)}
                    disabled={!editing}
                    rows={3}
                    placeholder="Describe what you provide to agents: leads, training, technology, competitive splits, support, etc."
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="needs">Team Needs</Label>
                  <Textarea
                    id="needs"
                    value={clientData?.needs || ''}
                    onChange={(e) => handleFieldChange('needs', e.target.value)}
                    disabled={!editing}
                    rows={3}
                    placeholder="Describe your specific team needs..."
                  />
                </div>
              </CardContent>
            </Card>

            {/* Agent Blocklist */}
            <Card>
              <CardHeader>
                <CardTitle>Agent Blocklist</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Upload or paste a list of your current agents to prevent recruiting them (Max 5MB)
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="csv-upload">Upload CSV File</Label>
                  <Input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    disabled={!editing}
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          toast.error("File must be less than 5MB");
                          return;
                        }
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const text = event.target?.result as string;
                          handleFieldChange('blocklist_csv', text);
                        };
                        reader.readAsText(file);
                      }
                    }}
                  />
                  <p className="text-xs text-muted-foreground">
                    CSV format: Name, Email, Phone (one agent per line)
                  </p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="csv-paste">Or Paste CSV Data</Label>
                  <Textarea
                    id="csv-paste"
                    value={clientData?.blocklist_csv || ''}
                    onChange={(e) => handleFieldChange('blocklist_csv', e.target.value)}
                    disabled={!editing}
                    rows={6}
                    placeholder="Name, Email, Phone&#10;John Doe, john@example.com, 555-1234&#10;Jane Smith, jane@example.com, 555-5678"
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    {clientData?.blocklist_csv ? 
                      `${clientData.blocklist_csv.split('\n').filter((l: string) => l.trim()).length} agents in blocklist` : 
                      'No agents in blocklist'}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      {/* Floating Save Card */}
      {hasChanges && editing && (
        <div className="fixed bottom-8 right-8 z-50 animate-in slide-in-from-bottom-4">
          <Card className="shadow-lg border-2 border-primary">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="flex-1">
                <p className="font-semibold">Unsaved Changes</p>
                <p className="text-xs text-muted-foreground">Don't forget to save your changes</p>
              </div>
              <Button onClick={handleSave} size="sm">
                Save Now
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default ClientProfile;
