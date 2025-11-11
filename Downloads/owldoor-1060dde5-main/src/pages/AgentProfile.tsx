import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useNavigate, Link } from "react-router-dom";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { 
  faEdit, 
  faMoneyBillWave, 
  faChartLine, 
  faCalendarAlt, 
  faBriefcase, 
  faMapMarkerAlt, 
  faPhone, 
  faEnvelope, 
  faIdCard, 
  faTasks,
  faHome,
  faEye,
  faSave,
  faTimes
} from "@fortawesome/free-solid-svg-icons";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import owlDoorLogo from "@/assets/owldoor-logo-new.png";
import { ProCoverageManager } from "@/components/pro/ProCoverageManager";

const AgentProfile = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [proData, setProData] = useState<any>(null);
  const [showCoverageModal, setShowCoverageModal] = useState(false);

  useEffect(() => {
    fetchProData();
  }, []);

  const fetchProData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("pros")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      setProData(data);
    } catch (error) {
      console.error("Error fetching pro data:", error);
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      const { error } = await supabase
        .from("pros")
        .update(proData)
        .eq("id", proData.id);

      if (error) throw error;
      toast.success("Profile updated successfully");
      setEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="bg-card/95 backdrop-blur-lg border-b sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/pro" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <img src={owlDoorLogo} alt="OwlDoor" className="h-10" />
            <div>
              <h1 className="text-xl font-bold">My Profile</h1>
              <p className="text-xs text-muted-foreground">Manage your information</p>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            {!editing ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={() => window.open(`/profile/${proData?.id}`, '_blank')}
                  className="gap-2"
                >
                  <FontAwesomeIcon icon={faEye} className="w-4 h-4" />
                  View Public
                </Button>
                <Button onClick={() => setEditing(true)} className="gap-2">
                  <FontAwesomeIcon icon={faEdit} className="w-4 h-4" />
                  Edit Profile
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => {
                  setEditing(false);
                  fetchProData();
                }} className="gap-2">
                  <FontAwesomeIcon icon={faTimes} className="w-4 h-4" />
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gap-2">
                  <FontAwesomeIcon icon={faSave} className="w-4 h-4" />
                  Save Changes
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary/10 via-secondary/5 to-accent/5 py-12 px-6 border-b">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row gap-6 items-center md:items-start">
            <div className="relative">
              <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-4xl font-bold text-primary-foreground shadow-xl border-4 border-primary/20">
                {proData?.first_name?.[0]}{proData?.last_name?.[0]}
              </div>
              <div className="absolute -bottom-2 -right-2 bg-green-500 w-7 h-7 rounded-full border-4 border-background"></div>
            </div>
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-4xl font-extrabold mb-3 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                {proData?.first_name} {proData?.last_name}
              </h1>
              <div className="flex flex-wrap items-center gap-4 justify-center md:justify-start mb-4">
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FontAwesomeIcon icon={faBriefcase} className="w-4 h-4 text-primary" />
                  <span className="font-medium">{proData?.company || 'Real Estate Professional'}</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-4 h-4 text-primary" />
                  <span className="font-medium">{proData?.cities?.[0] || proData?.states?.[0] || 'Multiple Markets'}</span>
                </span>
                <span className="flex items-center gap-2 text-muted-foreground">
                  <FontAwesomeIcon icon={faCalendarAlt} className="w-4 h-4 text-primary" />
                  <span className="font-medium">{proData?.experience || 0} Years</span>
                </span>
              </div>
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {proData?.skills?.slice(0, 5).map((skill: string, idx: number) => (
                  <Badge key={idx} variant="secondary" className="text-sm font-semibold px-3 py-1">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Cards */}
      <section className="container mx-auto max-w-6xl px-6 -mt-8 mb-8 relative z-10">
        <Card className="shadow-xl border-2">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20">
                <FontAwesomeIcon icon={faChartLine} className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-3xl font-bold text-primary">{proData?.transactions || 0}</div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Transactions</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/5 to-green-500/10 border border-green-500/20">
                <FontAwesomeIcon icon={faMoneyBillWave} className="w-6 h-6 text-green-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-green-600">
                  ${((proData?.total_sales || 0) / 1000000).toFixed(1)}M
                </div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Volume</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/5 to-blue-500/10 border border-blue-500/20">
                <FontAwesomeIcon icon={faCalendarAlt} className="w-6 h-6 text-blue-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-blue-600">{proData?.experience || 0}</div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Years Exp</div>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-purple-500/5 to-purple-500/10 border border-purple-500/20">
                <FontAwesomeIcon icon={faTasks} className="w-6 h-6 text-purple-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-purple-600">{proData?.profile_completeness || 0}%</div>
                <div className="text-xs text-muted-foreground font-semibold uppercase">Complete</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-6 pb-12 max-w-6xl">
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <FontAwesomeIcon icon={faIdCard} className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">Basic Information</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">First Name</Label>
                  <Input
                    value={proData?.first_name || ''}
                    onChange={(e) => setProData({ ...proData, first_name: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Last Name</Label>
                  <Input
                    value={proData?.last_name || ''}
                    onChange={(e) => setProData({ ...proData, last_name: e.target.value })}
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Brokerage/Company</Label>
                  <Input
                    value={proData?.company || ''}
                    onChange={(e) => setProData({ ...proData, company: e.target.value })}
                    disabled={!editing}
                    placeholder="Your brokerage"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Email</Label>
                  <Input
                    type="email"
                    value={proData?.email || ''}
                    disabled
                    className="bg-muted/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Phone</Label>
                  <Input
                    value={proData?.phone || ''}
                    onChange={(e) => setProData({ ...proData, phone: e.target.value })}
                    disabled={!editing}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">License Type</Label>
                  <Input
                    value={proData?.license_type || ''}
                    onChange={(e) => setProData({ ...proData, license_type: e.target.value })}
                    disabled={!editing}
                    placeholder="e.g., Agent, Broker"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <FontAwesomeIcon icon={faChartLine} className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">Performance Metrics</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Years of Experience</Label>
                  <Input
                    type="number"
                    value={proData?.experience || 0}
                    onChange={(e) => setProData({ ...proData, experience: parseInt(e.target.value) || 0 })}
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Transactions Per Year</Label>
                  <Input
                    type="number"
                    value={proData?.transactions || 0}
                    onChange={(e) => setProData({ ...proData, transactions: parseInt(e.target.value) || 0 })}
                    disabled={!editing}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Total Sales Volume ($)</Label>
                  <Input
                    type="number"
                    value={proData?.total_sales || 0}
                    onChange={(e) => setProData({ ...proData, total_sales: parseInt(e.target.value) || 0 })}
                    disabled={!editing}
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Coverage Areas */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon icon={faMapMarkerAlt} className="w-5 h-5 text-primary" />
                  <h2 className="text-2xl font-bold">Coverage Areas</h2>
                </div>
                <Button onClick={() => setShowCoverageModal(true)} variant="outline" size="sm">
                  Manage Coverage
                </Button>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {proData?.zip_codes && proData.zip_codes.length > 0 ? (
                  proData.zip_codes.slice(0, 12).map((zip: string, idx: number) => (
                    <Badge key={idx} variant="secondary" className="justify-center py-2">
                      {zip}
                    </Badge>
                  ))
                ) : (
                  <p className="col-span-full text-sm text-muted-foreground text-center py-4">
                    No coverage areas set. Click "Manage Coverage" to add areas.
                  </p>
                )}
              </div>
              {proData?.zip_codes && proData.zip_codes.length > 12 && (
                <p className="text-sm text-muted-foreground text-center mt-4">
                  +{proData.zip_codes.length - 12} more areas
                </p>
              )}
            </CardContent>
          </Card>

          {/* About Me */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <FontAwesomeIcon icon={faIdCard} className="w-5 h-5 text-primary" />
                <h2 className="text-2xl font-bold">About Me</h2>
              </div>
              <div className="space-y-2">
                <Label className="text-sm font-semibold">Professional Bio</Label>
                <Textarea
                  value={proData?.bio || ''}
                  onChange={(e) => setProData({ ...proData, bio: e.target.value })}
                  disabled={!editing}
                  placeholder="Tell potential clients and brokerages about yourself..."
                  rows={6}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Coverage Modal */}
      <ProCoverageManager
        open={showCoverageModal}
        onOpenChange={setShowCoverageModal}
        proId={proData?.id}
        onSave={fetchProData}
      />
    </div>
  );
};

export default AgentProfile;
