import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Users, Plus, Trash2, MapPin, Edit2, Upload, Camera } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";
import { CitiesInput } from "@/components/CitiesInput";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFieldDefinitions } from "@/hooks/useFieldDefinitions";
import { DynamicFieldInput } from "@/components/forms/DynamicFieldInput";

interface TeamMember {
  id?: string;
  name: string;
  role: string;
  avatar?: string;
}

const EditTeamProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [clientData, setClientData] = useState<any>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch field definitions for real estate clients
  const { fields: skillsFields } = useFieldDefinitions({
    entityType: "client_real_estate",
    visibleIn: "profile",
  });

  // Get skills field definition
  const skillsField = skillsFields.find(f => f.field_name === 'skills');

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
        .maybeSingle();

      if (error) throw error;
      
      if (!data) {
        toast.error("No client profile found");
        navigate("/office");
        return;
      }
      
      setClientData(data);
      
      // Initialize with placeholder team members
      setTeamMembers([
        { name: "", role: "Team Lead" },
      ]);
    } catch (error) {
      console.error("Error fetching client data:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be less than 5MB");
        return;
      }

      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast.error("Please upload an image file");
        return;
      }

      setUploading(true);

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${clientData.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Update client data
      setClientData({ ...clientData, image_url: publicUrl });
      
      // Save to database
      const { error: updateError } = await supabase
        .from("clients")
        .update({ image_url: publicUrl })
        .eq("id", clientData.id);

      if (updateError) throw updateError;

      toast.success("Profile image updated!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      if (!clientData) {
        toast.error("No profile data to save");
        return;
      }

      // Only update editable fields, not readonly ones like id, created_at, user_id
      const updateData = {
        company_name: clientData.company_name,
        contact_name: clientData.contact_name,
        email: clientData.email,
        phone: clientData.phone,
        phone2: clientData.phone2,
        email2: clientData.email2,
        cities: clientData.cities,
        states: clientData.states,
        zip_codes: clientData.zip_codes,
        brokerage: clientData.brokerage,
        years_experience: clientData.years_experience,
        yearly_sales: clientData.yearly_sales,
        avg_sale: clientData.avg_sale,
        designations: clientData.designations,
        languages: clientData.languages,
        skills: clientData.skills,
        provides: clientData.provides,
        license_type: clientData.license_type,
        linkedin_url: clientData.linkedin_url,
        facebook_url: clientData.facebook_url,
        instagram_url: clientData.instagram_url,
        twitter_url: clientData.twitter_url,
        youtube_url: clientData.youtube_url,
        tiktok_url: clientData.tiktok_url,
        website_url: clientData.website_url,
        homes_com_url: clientData.homes_com_url,
        realtor_com_url: clientData.realtor_com_url,
      };

      const { error } = await supabase
        .from("clients")
        .update(updateData)
        .eq("id", clientData.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  const addTeamMember = () => {
    setTeamMembers([...teamMembers, { name: "", role: "" }]);
  };

  const updateTeamMember = (index: number, field: string, value: string) => {
    const updated = [...teamMembers];
    updated[index] = { ...updated[index], [field]: value };
    setTeamMembers(updated);
  };

  const removeTeamMember = (index: number) => {
    setTeamMembers(teamMembers.filter((_, i) => i !== index));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/office")}>
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
                <Button variant="outline" onClick={() => setEditing(false)}>
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
              <div className="w-36 h-36 rounded-2xl bg-card flex items-center justify-center border-4 border-primary-foreground shadow-2xl overflow-hidden">
                {clientData?.image_url ? (
                  <img 
                    src={clientData.image_url} 
                    alt={clientData.company_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Users className="h-16 w-16 text-primary" />
                )}
              </div>
            </div>
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">
                {clientData?.company_name || 'Your Team'}
              </h1>
              <div className="flex items-center gap-4 flex-wrap mb-4 opacity-95">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  {clientData?.cities?.[0] || clientData?.states?.[0] || 'Multiple Markets'}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  {teamMembers.length} Team Members
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
                  {teamMembers.length}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Team Members
                </div>
              </div>
              <div className="text-center p-4 border-r last:border-r-0">
                <div className="text-4xl font-bold text-primary mb-2">
                  {clientData?.yearly_sales || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Total Sales/Year
                </div>
              </div>
              <div className="text-center p-4">
                <div className="text-4xl font-bold text-primary mb-2">
                  {clientData?.years_experience || 0}
                </div>
                <div className="text-sm text-muted-foreground font-medium">
                  Years Experience
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
                    Team Members
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors font-medium text-sm">
                    Coverage Areas
                  </button>
                  <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-accent transition-colors font-medium text-sm">
                    Skills & Benefits
                  </button>
                </div>
                <Separator className="my-4" />
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Quick Actions</Label>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => window.open(`/company/${clientData?.id}`, '_blank')}
                    >
                      View Public Profile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full justify-start gap-2"
                      onClick={() => {
                        navigator.clipboard.writeText(`${window.location.origin}/company/${clientData?.id}`);
                        toast.success("Link copied!");
                      }}
                    >
                      Copy Profile Link
                    </Button>
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
                <p className="text-sm text-muted-foreground">Update your company details</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="first_name">First Name</Label>
                    <Input
                      id="first_name"
                      value={clientData?.first_name || ''}
                      onChange={(e) => setClientData({ ...clientData, first_name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="last_name">Last Name</Label>
                    <Input
                      id="last_name"
                      value={clientData?.last_name || ''}
                      onChange={(e) => setClientData({ ...clientData, last_name: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="company_name">Company/Brokerage</Label>
                    <Input
                      id="company_name"
                      value={clientData?.company_name || ''}
                      onChange={(e) => setClientData({ ...clientData, company_name: e.target.value })}
                      disabled={!editing}
                      placeholder="Your brokerage or team name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="brokerage">Parent Brokerage</Label>
                    <Input
                      id="brokerage"
                      value={clientData?.brokerage || ''}
                      onChange={(e) => setClientData({ ...clientData, brokerage: e.target.value })}
                      disabled={!editing}
                      placeholder="e.g., Y Realty"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={clientData?.email || ''}
                      onChange={(e) => setClientData({ ...clientData, email: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={clientData?.phone || ''}
                      onChange={(e) => setClientData({ ...clientData, phone: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone2">Phone 2 (Optional)</Label>
                    <Input
                      id="phone2"
                      type="tel"
                      value={clientData?.phone2 || ''}
                      onChange={(e) => setClientData({ ...clientData, phone2: e.target.value })}
                      disabled={!editing}
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-xl">Performance Metrics</CardTitle>
                <p className="text-sm text-muted-foreground">Track your team's achievements</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="years_experience">Experience (Years)</Label>
                    <Input
                      id="years_experience"
                      type="number"
                      value={clientData?.years_experience || 0}
                      onChange={(e) => setClientData({ ...clientData, years_experience: parseInt(e.target.value) || 0 })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="avg_sale">Avg. Sale</Label>
                    <Input
                      id="avg_sale"
                      type="number"
                      value={clientData?.avg_sale || 0}
                      onChange={(e) => setClientData({ ...clientData, avg_sale: parseInt(e.target.value) || 0 })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="yearly_sales">Total Sales</Label>
                    <Input
                      id="yearly_sales"
                      type="number"
                      value={clientData?.yearly_sales || 0}
                      onChange={(e) => setClientData({ ...clientData, yearly_sales: parseInt(e.target.value) || 0 })}
                      disabled={!editing}
                    />
                  </div>
                  <div>
                    <Label htmlFor="license_type">License Type</Label>
                    <Select
                      value={clientData?.license_type || ''}
                      onValueChange={(value) => setClientData({ ...clientData, license_type: value })}
                      disabled={!editing}
                    >
                      <SelectTrigger id="license_type">
                        <SelectValue placeholder="Select license type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="agent">Agent</SelectItem>
                        <SelectItem value="broker">Broker</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Integrations */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-xl">Integrations</CardTitle>
                <p className="text-sm text-muted-foreground">Connect external services</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div>
                  <Label htmlFor="zapier_webhook">Zapier Webhook URL</Label>
                  <Input
                    id="zapier_webhook"
                    type="url"
                    value={clientData?.zapier_webhook || ''}
                    onChange={(e) => setClientData({ ...clientData, zapier_webhook: e.target.value })}
                    disabled={!editing}
                    placeholder="https://hooks.zapier.com/hooks/catch/..."
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Trigger Zapier automations when new recruits are matched
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Areas */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-muted/30">
                <CardTitle className="text-xl">Coverage Areas</CardTitle>
                <p className="text-sm text-muted-foreground">Define the markets you serve</p>
              </CardHeader>
              <CardContent className="pt-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="cities">Cities (comma separated)</Label>
                    <Input
                      id="cities"
                      value={clientData?.cities?.join(', ') || ''}
                      onChange={(e) => setClientData({ ...clientData, cities: e.target.value.split(',').map((c: string) => c.trim()).filter(Boolean) })}
                      disabled={!editing}
                      placeholder="San Diego, La Mesa"
                    />
                  </div>
                  <div>
                    <Label htmlFor="states">States (comma separated)</Label>
                    <Input
                      id="states"
                      value={clientData?.states?.join(', ') || ''}
                      onChange={(e) => setClientData({ ...clientData, states: e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean) })}
                      disabled={!editing}
                      placeholder="CA"
                    />
                  </div>
                </div>
                {editing ? (
                  <CitiesInput
                    initialValue={clientData?.county ? [clientData.county] : []}
                    onCitiesChange={(cities) => setClientData({ ...clientData, county: cities[0] || '' })}
                  />
                ) : (
                  <div>
                    <Label htmlFor="county">Counties / Cities</Label>
                    <Input
                      id="county"
                      value={clientData?.county || ''}
                      disabled={true}
                      placeholder="No coverage areas added"
                    />
                  </div>
                )}
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => navigate("/market-coverage")}>
                    <MapPin className="h-4 w-4 mr-2" />
                    View All
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => navigate("/market-coverage")}>
                    <MapPin className="h-4 w-4 mr-2" />
                    Add On Map
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Skills & Services */}
            <Card>
              <CardHeader>
                <CardTitle>Skills & Services We Provide</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {editing && skillsField ? (
                  <DynamicFieldInput
                    field={skillsField}
                    value={clientData?.skills || []}
                    onChange={(value) => setClientData({ ...clientData, skills: value })}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {clientData?.skills?.map((skill: string, idx: number) => (
                      <Badge key={idx} variant="secondary">
                        {skill}
                      </Badge>
                    ))}
                    {(!clientData?.skills || clientData.skills.length === 0) && (
                      <p className="text-sm text-muted-foreground">No skills added yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* What We Offer */}
            <Card>
              <CardHeader>
                <CardTitle>What We Provide to Agents</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={clientData?.provides || ''}
                  onChange={(e) => setClientData({ ...clientData, provides: e.target.value })}
                  disabled={!editing}
                  rows={4}
                  placeholder="Describe what you provide to agents: training, leads, commission splits, technology, support, mentorship, etc."
                />
              </CardContent>
            </Card>

            {/* Online Presence */}
            <Card>
              <CardHeader>
                <CardTitle>Online Presence</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="website_url">Website URL</Label>
                  <Input
                    id="website_url"
                    type="url"
                    value={clientData?.website_url || ''}
                    onChange={(e) => setClientData({ ...clientData, website_url: e.target.value })}
                    disabled={!editing}
                    placeholder="https://www.yourteam.com"
                  />
                </div>
                <div>
                  <Label htmlFor="linkedin_url">LinkedIn URL</Label>
                  <Input
                    id="linkedin_url"
                    type="url"
                    value={clientData?.linkedin_url || ''}
                    onChange={(e) => setClientData({ ...clientData, linkedin_url: e.target.value })}
                    disabled={!editing}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                </div>
                <div>
                  <Label htmlFor="facebook_url">Facebook URL</Label>
                  <Input
                    id="facebook_url"
                    type="url"
                    value={clientData?.facebook_url || ''}
                    onChange={(e) => setClientData({ ...clientData, facebook_url: e.target.value })}
                    disabled={!editing}
                    placeholder="https://facebook.com/yourpage"
                  />
                </div>
                <div>
                  <Label htmlFor="instagram_url">Instagram URL</Label>
                  <Input
                    id="instagram_url"
                    type="url"
                    value={clientData?.instagram_url || ''}
                    onChange={(e) => setClientData({ ...clientData, instagram_url: e.target.value })}
                    disabled={!editing}
                    placeholder="https://instagram.com/yourprofile"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Team Members</CardTitle>
                  {editing && (
                    <Button onClick={addTeamMember} size="sm">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Member
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {teamMembers.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No team members added yet. Click "Add Member" to get started.
                  </p>
                ) : (
                  teamMembers.map((member, idx) => (
                    <div key={idx} className="flex items-center gap-4 p-4 border rounded-lg">
                      <Avatar className="h-12 w-12">
                        <AvatarImage src={member.avatar} />
                        <AvatarFallback>
                          {member.name 
                            ? member.name.split(' ').map(n => n[0]).filter(Boolean).join('').toUpperCase() 
                            : '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                        <Input
                          value={member.name}
                          onChange={(e) => updateTeamMember(idx, 'name', e.target.value)}
                          disabled={!editing}
                          placeholder="Member name"
                        />
                        <Input
                          value={member.role}
                          onChange={(e) => updateTeamMember(idx, 'role', e.target.value)}
                          disabled={!editing}
                          placeholder="Role"
                        />
                      </div>
                      {editing && (
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTeamMember(idx)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Company Description */}
            <Card>
              <CardHeader>
                <CardTitle>About Our Team</CardTitle>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={clientData?.needs || ''}
                  onChange={(e) => setClientData({ ...clientData, needs: e.target.value })}
                  disabled={!editing}
                  rows={6}
                  placeholder="Describe your brokerage, team culture, what you offer to agents, and what makes your team special..."
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditTeamProfile;
