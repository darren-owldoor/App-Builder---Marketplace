import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Save, Camera, User } from "lucide-react";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";
import { useFieldDefinitions } from "@/hooks/useFieldDefinitions";
import { DynamicFieldInput } from "@/components/forms/DynamicFieldInput";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function EditAgentProfileNew() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [proId, setProId] = useState<string | null>(null);
  const [profileData, setProfileData] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch field definitions for real estate agents visible in profile
  const { fields, loading: fieldsLoading } = useFieldDefinitions({
    entityType: "real_estate_agent",
    visibleIn: "profile",
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data: pro, error } = await supabase
        .from("pros")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      if (pro) {
        setProId(pro.id);
        setProfileData(pro);
      }
    } catch (error) {
      console.error("Error loading profile:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!proId) return;

    try {
      setSaving(true);

      // Build update object with only fields that exist in field_definitions
      const updateData: Record<string, any> = {};
      fields.forEach((field) => {
        if (field.field_name in profileData) {
          updateData[field.field_name] = profileData[field.field_name];
        }
      });

      const { error } = await supabase
        .from("pros")
        .update(updateData)
        .eq("id", proId);

      if (error) throw error;

      toast.success("Profile updated successfully!");
      navigate("/pro");
    } catch (error) {
      console.error("Error saving profile:", error);
      toast.error("Failed to save profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: any) => {
    setProfileData((prev) => ({ ...prev, [fieldName]: value }));
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
      const fileName = `${proId}-${Date.now()}.${fileExt}`;
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

      // Update profile data
      setProfileData({ ...profileData, image_url: publicUrl });
      
      // Save to database
      const { error: updateError } = await supabase
        .from("pros")
        .update({ image_url: publicUrl })
        .eq("id", proId);

      if (updateError) throw updateError;

      toast.success("Profile image updated!");
    } catch (error) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  // Group fields by field_group
  const groupedFields = fields.reduce((acc, field) => {
    const group = field.field_group || "other";
    if (!acc[group]) acc[group] = [];
    acc[group].push(field);
    return acc;
  }, {} as Record<string, typeof fields>);

  if (loading || fieldsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/pro")}>
            <img src={owlDoorLogo} alt="OwlDoor" className="h-12" />
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" onClick={() => navigate("/pro")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="w-4 h-4 mr-2" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-6">
          <div className="flex items-center gap-6 mb-4">
            <div className="relative group">
              {profileData?.image_url ? (
                <img 
                  src={profileData.image_url} 
                  alt="Profile"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center">
                  <User className="h-12 w-12 text-primary-foreground" />
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              >
                {uploading ? (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                ) : (
                  <Camera className="h-8 w-8 text-white" />
                )}
              </button>
            </div>
            <div>
              <h1 className="text-3xl font-bold">Edit Your Profile</h1>
              <p className="text-muted-foreground">
                Update your information to improve your matches with brokerages
              </p>
            </div>
          </div>
        </div>

        <Tabs defaultValue={Object.keys(groupedFields)[0]} className="space-y-6">
          <TabsList className="grid w-full grid-cols-6">
            {Object.keys(groupedFields).map((group) => (
              <TabsTrigger key={group} value={group} className="capitalize">
                {group === "personal" && "👤"}
                {group === "business" && "💼"}
                {group === "location" && "📍"}
                {group === "performance" && "📈"}
                {group === "preferences" && "⚙️"}
                {group === "skills" && "🎓"}
                {" "}
                {group}
              </TabsTrigger>
            ))}
          </TabsList>

          {Object.entries(groupedFields).map(([group, groupFields]) => (
            <TabsContent key={group} value={group}>
              <Card>
                <CardHeader>
                  <CardTitle className="capitalize">{group} Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {groupFields.map((field) => (
                    <DynamicFieldInput
                      key={field.id}
                      field={field}
                      value={profileData[field.field_name]}
                      onChange={(value) => handleFieldChange(field.field_name, value)}
                    />
                  ))}
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </main>
    </div>
  );
}
