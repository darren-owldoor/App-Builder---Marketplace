import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import {
  MapPin,
  Star,
  Award,
  Briefcase,
  Home,
  TrendingUp,
  DollarSign,
  Calendar,
  Lock,
  Eye,
  Heart,
  Share2,
  MessageSquare,
  CheckCircle,
  Building,
  Phone,
  Mail,
  Globe,
  Linkedin,
  Facebook,
  Instagram,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Pro {
  id: string;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string;
  profile_photo?: string;
  bio?: string;
  cities?: string[];
  states?: string[];
  zip_codes?: string[];
  pro_type: string;
  experience?: number;
  transactions?: number;
  company?: string;
  specializations?: string[];
  wants?: string[];
  certifications?: string[];
  social_links?: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
    website?: string;
  };
  stats?: {
    avg_sale_price?: number;
    close_rate?: number;
    sales_per_year?: number;
    response_time_hours?: number;
  };
  reviews?: any[];
  created_at: string;
}

export default function PublicAgentProfile() {
  const { profileId } = useParams<{ profileId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pro, setPro] = useState<Pro | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPurchased, setIsPurchased] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const [clientId, setClientId] = useState<string | null>(null);
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const [purchasing, setPurchasing] = useState(false);
  const [viewCount, setViewCount] = useState(0);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    if (profileId) {
      fetchProfile();
      trackView();
    }
  }, [profileId]);

  useEffect(() => {
    if (user) {
      checkClientAccess();
    }
  }, [user, pro]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("pros")
        .select("*")
        .eq("id", profileId)
        .single();

      if (error) throw error;
      
      // Map database fields to component interface
      const profileData = {
        ...data,
        city: data.cities?.[0] || '',
        state: data.states?.[0] || '',
      };
      
      setPro(profileData as any);
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const checkClientAccess = async () => {
    if (!user || !pro) return;

    try {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (client) {
        setIsClient(true);
        setClientId(client.id);

        const { data: purchase } = await supabase
          .from("matches")
          .select("*")
          .eq("client_id", client.id)
          .eq("pro_id", pro.id)
          .eq("status", "purchased")
          .maybeSingle();

        setIsPurchased(!!purchase);

        const { data: saved } = await supabase
          .from("saved_pros")
          .select("*")
          .eq("client_id", client.id)
          .eq("pro_id", pro.id)
          .maybeSingle();

        setIsSaved(!!saved);
      }
    } catch (error) {
      console.error("Error checking access:", error);
    }
  };

  const trackView = async () => {
    try {
      const { data, error } = await supabase.rpc("increment_profile_views", {
        profile_id: profileId,
      });

      if (error) {
        console.error("Error tracking view:", error);
        return;
      }

      if (data && Array.isArray(data) && data.length > 0) {
        setViewCount(data[0].view_count || 0);
      }
    } catch (error) {
      console.error("Error tracking view:", error);
    }
  };

  const handlePurchase = async () => {
    if (!isClient || !clientId || !pro) {
      toast({
        title: "Access Required",
        description: "Please sign in as a company to purchase",
        variant: "destructive",
      });
      return;
    }

    setPurchasing(true);
    try {
      const { data: client } = await supabase
        .from("clients")
        .select("credits_balance")
        .eq("id", clientId)
        .single();

      if (!client || client.credits_balance < 1) {
        toast({
          title: "Insufficient Credits",
          description: "Please purchase more credits to continue",
          variant: "destructive",
        });
        navigate("/billing");
        return;
      }

      const { error: matchError } = await supabase.from("matches").insert({
        client_id: clientId,
        pro_id: pro.id,
        match_score: 100,
        match_type: "direct_purchase",
        status: "purchased",
        created_at: new Date().toISOString(),
      });

      if (matchError) throw matchError;

      const { error: creditError } = await supabase
        .from("clients")
        .update({
          credits_balance: client.credits_balance - 1,
        })
        .eq("id", clientId);

      if (creditError) throw creditError;

      // Record transaction if table exists
      await supabase.from("transactions" as any).insert({
        client_id: clientId,
        pro_id: pro.id,
        amount: -1,
        type: "lead_purchase",
        description: `Purchased lead: ${pro.full_name}`,
        created_at: new Date().toISOString(),
      });

      setIsPurchased(true);
      setShowPurchaseDialog(false);

      toast({
        title: "Purchase Complete! 🎉",
        description: "You now have full access to this agent's profile",
      });

      fetchProfile();
    } catch (error) {
      console.error("Error purchasing:", error);
      toast({
        title: "Error",
        description: "Failed to complete purchase",
        variant: "destructive",
      });
    } finally {
      setPurchasing(false);
    }
  };

  const handleSave = async () => {
    if (!isClient || !clientId || !pro) return;

    try {
      if (isSaved) {
        await supabase
          .from("saved_pros")
          .delete()
          .eq("client_id", clientId)
          .eq("pro_id", pro.id);

        setIsSaved(false);
        toast({ title: "Removed from saved" });
      } else {
        await supabase.from("saved_pros").insert({
          client_id: clientId,
          pro_id: pro.id,
          created_at: new Date().toISOString(),
        });

        setIsSaved(true);
        toast({ title: "Saved to your list" });
      }
    } catch (error) {
      console.error("Error toggling save:", error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      await navigator.share({
        title: `${pro?.full_name} - OwlDoor`,
        text: `Check out this ${pro?.pro_type === 'real_estate_agent' ? 'agent' : 'loan officer'} on OwlDoor`,
        url,
      });
    } else {
      await navigator.clipboard.writeText(url);
      toast({ title: "Link copied to clipboard" });
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!pro) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Profile Not Found</h2>
          <p className="text-muted-foreground mb-4">This agent profile doesn't exist</p>
          <Button onClick={() => navigate("/directory")}>Browse Directory</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-background">
      {/* Header */}
      <header className="bg-card border-b sticky top-0 z-50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/")}>
              <div className="text-3xl">🦉</div>
              <div>
                <h1 className="text-xl font-bold">OwlDoor</h1>
                <p className="text-sm text-muted-foreground">Agent Directory</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {isClient && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleSave}
                    className="gap-2"
                  >
                    <Heart className={`w-4 h-4 ${isSaved ? 'fill-primary text-primary' : ''}`} />
                    {isSaved ? 'Saved' : 'Save'}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleShare}
                    className="gap-2"
                  >
                    <Share2 className="w-4 h-4" />
                    Share
                  </Button>
                </>
              )}
              {!user && (
                <Button onClick={() => navigate("/login")} variant="outline">
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden">
          <div className="bg-gradient-primary h-32"></div>
          <CardContent className="relative -mt-16 pb-8">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Profile Photo */}
              <div className="relative flex-shrink-0">
                {isPurchased ? (
                  pro.profile_photo ? (
                    <img
                      src={pro.profile_photo}
                      alt={pro.full_name}
                      className="w-32 h-32 rounded-2xl border-4 border-card shadow-xl object-cover"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-2xl border-4 border-card shadow-xl bg-gradient-primary flex items-center justify-center">
                      <span className="text-4xl font-bold text-primary-foreground">
                        {getInitials(pro.full_name)}
                      </span>
                    </div>
                  )
                ) : (
                  <div className="relative w-32 h-32 rounded-2xl border-4 border-card shadow-xl bg-muted flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20 blur-xl"></div>
                    <Lock className="w-12 h-12 text-muted-foreground relative z-10" />
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="flex-1 pt-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    {isPurchased ? (
                      <>
                        <h1 className="text-3xl font-bold mb-1">
                          {pro.full_name}
                        </h1>
                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                          <Briefcase className="w-5 h-5" />
                          <span className="font-medium">
                            {pro.pro_type === "real_estate_agent"
                              ? "Real Estate Agent"
                              : "Loan Officer"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-3 mb-1">
                          <div className="h-8 w-48 bg-muted rounded-lg animate-pulse"></div>
                          <Badge variant="secondary">
                            <Lock className="w-3 h-3 mr-1" />
                            Locked
                          </Badge>
                        </div>
                        <div className="h-6 w-32 bg-muted rounded-lg animate-pulse mb-2"></div>
                      </>
                    )}

                    <div className="flex items-center gap-4 text-sm">
                      <div className="flex items-center gap-1">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{pro.cities?.[0] || 'N/A'}, {pro.states?.[0] || 'N/A'}</span>
                      </div>
                      {pro.experience && (
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>{pro.experience} years</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Eye className="w-4 h-4 text-muted-foreground" />
                        <span>{viewCount} views</span>
                      </div>
                    </div>
                  </div>

                  {isClient && !isPurchased && (
                    <Button
                      onClick={() => setShowPurchaseDialog(true)}
                      className="gap-2"
                      size="lg"
                    >
                      <Lock className="w-4 h-4" />
                      Unlock Profile (1 Credit)
                    </Button>
                  )}
                </div>

                {/* Bio */}
                {pro.bio && (
                  <div className="mb-4">
                    {isPurchased ? (
                      <p className="text-muted-foreground leading-relaxed">{pro.bio}</p>
                    ) : (
                      <div className="relative">
                        <p className="text-muted-foreground leading-relaxed blur-sm select-none">
                          This is a sample bio that demonstrates what the agent's
                          profile description would look like. The actual content is
                          hidden until you purchase access to this profile.
                        </p>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="bg-card/90 px-6 py-3 rounded-lg shadow-lg border">
                            <Lock className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                            <p className="text-sm font-medium">
                              Unlock to read full bio
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Stats */}
                {(pro.stats || pro.transactions) && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    {pro.transactions && (
                      <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg p-4 border border-primary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Home className="w-5 h-5 text-primary" />
                          <span className="text-sm font-medium">
                            Transactions
                          </span>
                        </div>
                        <p className="text-2xl font-bold">
                          {pro.transactions}
                        </p>
                      </div>
                    )}
                    {pro.stats?.sales_per_year && (
                      <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 border border-accent/20">
                        <div className="flex items-center gap-2 mb-1">
                          <TrendingUp className="w-5 h-5 text-accent" />
                          <span className="text-sm font-medium">
                            Sales/Year
                          </span>
                        </div>
                        <p className="text-2xl font-bold">
                          {pro.stats.sales_per_year}
                        </p>
                      </div>
                    )}
                    {pro.stats?.avg_sale_price && (
                      <div className="bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-lg p-4 border border-secondary/20">
                        <div className="flex items-center gap-2 mb-1">
                          <DollarSign className="w-5 h-5 text-secondary-foreground" />
                          <span className="text-sm font-medium">
                            Avg Sale
                          </span>
                        </div>
                        <p className="text-2xl font-bold">
                          ${(pro.stats.avg_sale_price / 1000).toFixed(0)}K
                        </p>
                      </div>
                    )}
                    {pro.stats?.close_rate && (
                      <div className="bg-gradient-to-br from-accent/10 to-accent/5 rounded-lg p-4 border border-accent/20">
                        <div className="flex items-center gap-2 mb-1">
                          <Award className="w-5 h-5 text-accent" />
                          <span className="text-sm font-medium">
                            Close Rate
                          </span>
                        </div>
                        <p className="text-2xl font-bold">
                          {pro.stats.close_rate}%
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Content */}
              <div className="lg:col-span-2 space-y-6">
                <Tabs defaultValue="overview" className="w-full">
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="experience">Experience</TabsTrigger>
                    <TabsTrigger value="reviews">Reviews</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview" className="space-y-6">
                    {pro.specializations && pro.specializations.length > 0 && (
                      <Card>
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-primary" />
                            Specializations
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {pro.specializations.map((spec, idx) => (
                              <Badge key={idx} variant="secondary">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {pro.wants && pro.wants.length > 0 && (
                      <Card>
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-primary" />
                            What I'm Looking For
                          </h3>
                          <div className="space-y-2">
                            {pro.wants.map((want, idx) => (
                              <div key={idx} className="flex items-center gap-2">
                                <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                                <span>{want}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    <Card>
                      <CardContent className="pt-6">
                        <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-primary" />
                          Service Area
                        </h3>
                        <div className="bg-muted rounded-lg h-64 flex items-center justify-center">
                          <p className="text-muted-foreground">Map integration here</p>
                        </div>
                        {pro.zip_codes && pro.zip_codes.length > 0 && (
                          <div className="mt-4">
                            <p className="text-sm font-medium mb-2">Serving:</p>
                            <div className="flex flex-wrap gap-2">
                              {pro.zip_codes.map((zip, idx) => (
                                <Badge key={idx} variant="outline">
                                  {zip}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="experience" className="space-y-6">
                    {pro.company && (
                      <Card>
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Building className="w-5 h-5 text-primary" />
                            Current Brokerage
                          </h3>
                          {isPurchased ? (
                            <p className="text-xl font-semibold">
                              {pro.company}
                            </p>
                          ) : (
                            <div className="relative">
                              <p className="text-xl font-semibold blur-md select-none">
                                Brokerage Name Hidden
                              </p>
                              <div className="absolute inset-0 flex items-center justify-center">
                                <Badge variant="secondary" className="gap-2">
                                  <Lock className="w-3 h-3" />
                                  Unlock to view
                                </Badge>
                              </div>
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {pro.certifications && pro.certifications.length > 0 && (
                      <Card>
                        <CardContent className="pt-6">
                          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                            <Award className="w-5 h-5 text-primary" />
                            Certifications & Credentials
                          </h3>
                          <div className="space-y-3">
                            {pro.certifications.map((cert, idx) => (
                              <div
                                key={idx}
                                className="flex items-center gap-3 p-3 bg-muted rounded-lg"
                              >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                  <Award className="w-5 h-5 text-primary" />
                                </div>
                                <span className="font-medium">{cert}</span>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </TabsContent>

                  <TabsContent value="reviews">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-center py-12">
                          <Star className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">
                            No reviews yet
                          </h3>
                          <p className="text-muted-foreground">
                            This agent hasn't received any reviews on OwlDoor
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </Tabs>
              </div>

              {/* Sidebar */}
              <div className="space-y-6">
                {/* Contact Card */}
                <Card className={isPurchased ? "" : "relative overflow-hidden"}>
                  {!isPurchased && (
                    <div className="absolute inset-0 bg-gradient-to-b from-background/80 to-background/95 backdrop-blur-sm z-10 flex flex-col items-center justify-center p-6">
                      <Lock className="w-12 h-12 text-muted-foreground mb-4" />
                      <h4 className="text-lg font-semibold mb-2 text-center">
                        Unlock Contact Info
                      </h4>
                      <p className="text-sm text-muted-foreground text-center mb-4">
                        Purchase this profile to view full contact details
                      </p>
                      {isClient && (
                        <Button
                          onClick={() => setShowPurchaseDialog(true)}
                        >
                          Unlock for 1 Credit
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Contact Information
                    </h3>
                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Mail className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Email</p>
                          <p className="font-medium">
                            {isPurchased ? pro.email : "••••••@••••••.com"}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Phone className="w-5 h-5 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-sm text-muted-foreground">Phone</p>
                          <p className="font-medium">
                            {isPurchased ? pro.phone : "(•••) •••-••••"}
                          </p>
                        </div>
                      </div>
                    </div>

                    {isPurchased && (
                      <div className="mt-6 space-y-2">
                        <Button className="w-full gap-2">
                          <MessageSquare className="w-4 h-4" />
                          Send Message
                        </Button>
                        <Button variant="outline" className="w-full gap-2">
                          <Calendar className="w-4 h-4" />
                          Schedule Interview
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Social Links */}
                {pro.social_links && Object.keys(pro.social_links).length > 0 && (
                  <Card>
                    <CardContent className="pt-6">
                      <h3 className="text-lg font-semibold mb-4">
                        Social Media
                      </h3>
                      <div className="space-y-2">
                        {pro.social_links.website && (
                          <a
                            href={pro.social_links.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Globe className="w-5 h-5 text-muted-foreground" />
                            <span>Website</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                          </a>
                        )}
                        {pro.social_links.linkedin && (
                          <a
                            href={pro.social_links.linkedin}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Linkedin className="w-5 h-5 text-primary" />
                            <span>LinkedIn</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                          </a>
                        )}
                        {pro.social_links.facebook && (
                          <a
                            href={pro.social_links.facebook}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Facebook className="w-5 h-5 text-primary" />
                            <span>Facebook</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                          </a>
                        )}
                        {pro.social_links.instagram && (
                          <a
                            href={pro.social_links.instagram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted transition-colors"
                          >
                            <Instagram className="w-5 h-5 text-primary" />
                            <span>Instagram</span>
                            <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                          </a>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Profile Stats */}
                <Card className="bg-gradient-to-br from-primary/5 to-accent/5">
                  <CardContent className="pt-6">
                    <h3 className="text-lg font-semibold mb-4">
                      Profile Activity
                    </h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Profile Views</span>
                        <span className="font-semibold">{viewCount}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Times Contacted</span>
                        <span className="font-semibold">
                          {isPurchased ? "12" : "•••"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Avg Response Time</span>
                        <span className="font-semibold">
                          {isPurchased ? "2 hours" : "•••"}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Purchase Dialog */}
            <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-2xl">Unlock Full Profile</DialogTitle>
              <DialogDescription>
                Get complete access to {pro.first_name}'s contact information and full profile
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <h4 className="font-semibold mb-2">What you'll unlock:</h4>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Full name and photo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Direct email and phone
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Current brokerage
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Complete bio and details
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Message and schedule interviews
                  </li>
                </ul>
              </div>

              <div className="border-t pt-4">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-muted-foreground">Cost:</span>
                  <span className="text-2xl font-bold">1 Credit</span>
                </div>
                <Button
                  onClick={handlePurchase}
                  disabled={purchasing}
                  className="w-full h-12"
                >
                  {purchasing ? "Processing..." : "Purchase Profile"}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                One-time purchase. No subscription required.
              </p>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
