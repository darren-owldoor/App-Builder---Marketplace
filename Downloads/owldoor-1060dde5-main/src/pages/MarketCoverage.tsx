import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, Circle, Pencil, ArrowLeft, Trash2, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { CoverageQualityBadge } from "@/components/CoverageQualityBadge";
import owlDoorLogo from "@/assets/owldoor-logo-light-green.png";

interface MarketCoverage {
  id: string;
  coverage_type: "cities" | "radius" | "polygon" | "zip_radius";
  name: string;
  data: any;
  quality_score?: number;
  completeness_score?: number;
  coverage_breadth_score?: number;
  demand_overlap_score?: number;
  score_details?: any;
  created_at: string;
}

const MarketCoverage = () => {
  const navigate = useNavigate();
  const [coverages, setCoverages] = useState<MarketCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [userType, setUserType] = useState<'pro' | 'client' | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    fetchUserTypeAndCoverages();
  }, []);

  const fetchUserTypeAndCoverages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Check if user is admin
      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);
      
      setIsAdmin(roles?.some(r => r.role === 'admin') ?? false);

      // Check user type
      const { data: proData } = await supabase
        .from("pros")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      const { data: clientData } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      setUserType(proData ? 'pro' : clientData ? 'client' : null);

      // Fetch coverages
      const { data, error } = await supabase
        .from("market_coverage")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCoverages((data || []) as MarketCoverage[]);
    } catch (error) {
      toast.error("Failed to load market coverage");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this coverage area?")) return;

    try {
      const { error } = await supabase
        .from("market_coverage")
        .delete()
        .eq("id", id);

      if (error) throw error;
      toast.success("Coverage deleted");
      fetchUserTypeAndCoverages();
    } catch (error) {
      toast.error("Failed to delete coverage");
    }
  };

  const getDashboardPath = () => {
    return userType === 'pro' ? '/pro' : '/client';
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "cities":
        return <MapPin className="h-5 w-5" />;
      case "radius":
        return <Circle className="h-5 w-5" />;
      case "zip_radius":
        return <Target className="h-5 w-5" />;
      case "polygon":
        return <Pencil className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "cities":
        return "Cities";
      case "radius":
        return "Map Circles";
      case "zip_radius":
        return "Zip + Radius";
      case "polygon":
        return "Custom Drawn Area";
      default:
        return type;
    }
  };

  const getSummary = (coverage: MarketCoverage) => {
    switch (coverage.coverage_type) {
      case "cities":
        return `${coverage.data.cities?.length || 0} cities`;
      case "radius":
        return `${coverage.data.circles?.length || 0} circles`;
      case "zip_radius":
        return `${coverage.data.zipCodes?.length || 0} zip codes`;
      case "polygon":
        return `${coverage.data.polygons?.length || 0} areas`;
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to={getDashboardPath()}>
            <img src={owlDoorLogo} alt="OwlDoor" className="h-12 cursor-pointer hover:opacity-80 transition-opacity" />
          </Link>
          <Button variant="outline" onClick={() => navigate(getDashboardPath())}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <div className="container mx-auto max-w-6xl py-12 px-4">
        {/* Analytics Dashboard Link - Available to all users */}
        {coverages.length > 0 && (
          <div className="mb-6">
            <Button onClick={() => navigate('/coverage-analytics')} variant="outline" size="lg">
              <TrendingUp className="mr-2 h-5 w-5" />
              View Analytics Dashboard
            </Button>
          </div>
        )}

        {/* Saved Coverages List */}
        {coverages.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>My Market Coverage Areas</CardTitle>
              <CardDescription>
                Competition scores automatically calculated based on completeness, breadth, and market competition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {coverages.map((coverage) => (
                  <div
                    key={coverage.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4 flex-1">
                      <div className="text-primary">{getIcon(coverage.coverage_type)}</div>
                      <div className="flex-1">
                        <h4 className="font-semibold">{coverage.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {getTypeLabel(coverage.coverage_type)} • {getSummary(coverage)}
                        </p>
                      </div>
                      {coverage.quality_score !== undefined && (
                        <CoverageQualityBadge
                          qualityScore={coverage.quality_score}
                          completenessScore={coverage.completeness_score}
                          breadthScore={coverage.coverage_breadth_score}
                          demandScore={coverage.demand_overlap_score}
                          scoreDetails={coverage.score_details}
                        />
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(coverage.id)}
                      className="text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">
            {coverages.length > 0 ? 'Add More Market Coverage' : 'Set Up Your Market Coverage'}
          </h1>
          <p className="text-muted-foreground text-lg">
            Enter the cities where you provide services
          </p>
        </div>

        <div className="grid md:grid-cols-1 gap-6 max-w-2xl mx-auto">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate("/market-coverage/cities")}>
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                <MapPin className="h-8 w-8 text-primary" />
              </div>
              <CardTitle>Type in Cities</CardTitle>
              <CardDescription>
                Search and select multiple cities you work in
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button className="w-full" variant="outline">
                Set Up Coverage
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default MarketCoverage;
