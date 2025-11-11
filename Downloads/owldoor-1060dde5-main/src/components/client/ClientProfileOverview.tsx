import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Building2, Mail, Phone, MapPin, Camera, Eye, MessageSquare, Settings, DollarSign, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ClientProfileOverviewProps {
  clientData: any;
  coverages: any[];
  onProfileUpdate: () => void;
}

export const ClientProfileOverview = ({ clientData, coverages, onProfileUpdate }: ClientProfileOverviewProps) => {
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file");
      return;
    }

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

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("clients")
        .update({ image_url: publicUrl })
        .eq("id", clientData.id);

      if (updateError) throw updateError;

      toast.success("Profile picture updated");
      onProfileUpdate();
    } catch (error: any) {
      console.error("Error uploading image:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const initials = `${clientData?.first_name?.[0] || ''}${clientData?.last_name?.[0] || ''}`.toUpperCase() || 
                   clientData?.company_name?.substring(0, 2).toUpperCase() || 'CL';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Profile Card */}
      <Card className="lg:col-span-1 border-primary/20">
        <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-primary/10">
          <CardTitle>Your Profile</CardTitle>
          <p className="text-sm text-muted-foreground">Account Information</p>
        </CardHeader>
        <CardContent className="pt-6 space-y-6">
          {/* Profile Picture */}
          <div className="flex flex-col items-center">
            <div className="relative group">
              <Avatar className="h-32 w-32 border-4 border-primary/20">
                <AvatarImage src={clientData?.image_url} alt={clientData?.contact_name} />
                <AvatarFallback className="text-3xl font-bold bg-primary/10 text-primary">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <label 
                htmlFor="avatar-upload" 
                className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
              >
                <Camera className="h-8 w-8 text-white" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageUpload}
                  disabled={uploading}
                />
              </label>
            </div>
            {uploading && (
              <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-3"
              onClick={() => document.getElementById('avatar-upload')?.click()}
            >
              <Camera className="h-4 w-4 mr-2" />
              Upload Image
            </Button>
          </div>

          {/* Profile Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Building2 className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">Company</div>
                <div className="font-medium truncate">
                  {clientData?.company || clientData?.brokerage || 'Not Set'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Mail className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">Email</div>
                <div className="font-medium truncate">{clientData?.email}</div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Phone className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">Phone</div>
                <div className="font-medium">
                  {clientData?.phone || 'Not Set'}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
              <Users className="h-5 w-5 text-primary flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="text-xs text-muted-foreground">Account Type</div>
                <Badge variant="secondary" className="mt-1">
                  {clientData?.client_type === 'real_estate' ? 'Real Estate' : 
                   clientData?.client_type === 'mortgage' ? 'Mortgage' : 'Client'}
                </Badge>
              </div>
            </div>
          </div>

          <Button 
            variant="outline" 
            className="w-full"
            onClick={() => navigate("/client-profile")}
          >
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Right Column - Locations and Quick Actions */}
      <div className="lg:col-span-2 space-y-6">
        {/* Your Locations */}
        <Card className="border-primary/20">
          <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-primary/10">
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              Your Locations
            </CardTitle>
            <p className="text-sm text-muted-foreground">Account information</p>
          </CardHeader>
          <CardContent className="pt-6">
            {coverages && coverages.length > 0 ? (
              <div className="space-y-3">
                {coverages.slice(0, 4).map((coverage) => (
                  <div 
                    key={coverage.id} 
                    className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-medium">{coverage.name}</span>
                  </div>
                ))}
                {coverages.length > 4 && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="w-full"
                    onClick={() => navigate("/client?tab=locations")}
                  >
                    View All {coverages.length} Locations
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No locations added yet</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-4"
                  onClick={() => navigate("/client?tab=locations")}
                >
                  Manage Locations
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border-primary/20">
          <CardHeader className="border-b bg-gradient-to-br from-primary/5 to-primary/10">
            <CardTitle>Quick Actions</CardTitle>
            <p className="text-sm text-muted-foreground">Common tasks</p>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-2 gap-4">
              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary"
                onClick={() => navigate("/client?tab=recruits")}
              >
                <Users className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">View Available Recruits</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary"
                onClick={() => navigate("/client?tab=recruits")}
              >
                <Eye className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">View Purchased Recruits</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary"
                onClick={() => navigate("/client?tab=messages")}
              >
                <MessageSquare className="h-6 w-6 text-primary" />
                <span className="text-sm font-medium">View Messages</span>
              </Button>

              <Button
                variant="outline"
                className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-primary/10 hover:border-primary"
                onClick={() => navigate("/client?tab=settings")}
              >
                <Settings className="h-6 w-6 text-primary" />
                <div className="text-center">
                  <div className="text-sm font-medium">Manage</div>
                  <div className="text-xs text-muted-foreground">Billing</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
