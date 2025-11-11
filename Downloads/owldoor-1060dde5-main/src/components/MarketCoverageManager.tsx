import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { MapPin, Circle, Pencil, Trash2, Plus, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { CoverageDetailModal } from "./CoverageDetailModal";

interface MarketCoverage {
  id: string;
  coverage_type: "cities" | "radius" | "polygon";
  name: string;
  data: any;
  created_at: string;
}

const MarketCoverageManager = () => {
  const navigate = useNavigate();
  const [coverages, setCoverages] = useState<MarketCoverage[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoverage, setSelectedCoverage] = useState<MarketCoverage | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);

  useEffect(() => {
    fetchCoverages();
  }, []);

  const fetchCoverages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

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
      fetchCoverages();
    } catch (error) {
      toast.error("Failed to delete coverage");
    }
  };

  const handleView = (coverage: MarketCoverage) => {
    setSelectedCoverage(coverage);
    setDetailModalOpen(true);
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "cities":
        return <MapPin className="h-5 w-5" />;
      case "radius":
        return <Circle className="h-5 w-5" />;
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
        return "Radius Circles";
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
      case "polygon":
        return `${coverage.data.polygons?.length || 0} areas`;
      default:
        return "";
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>My Market Coverage</CardTitle>
        <Button onClick={() => navigate("/market-coverage")}>
          <Plus className="h-4 w-4 mr-2" />
          Add New
        </Button>
      </CardHeader>
      <CardContent>
        {coverages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No market coverage areas defined yet</p>
            <Button onClick={() => navigate("/market-coverage")}>
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Coverage Area
            </Button>
          </div>
        ) : (
          <div className="space-y-3">
            {coverages.map((coverage) => (
              <div
                key={coverage.id}
                className="flex items-center justify-between p-4 border rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="text-primary">{getIcon(coverage.coverage_type)}</div>
                  <div>
                    <h4 className="font-semibold">{coverage.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {getTypeLabel(coverage.coverage_type)} • {getSummary(coverage)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleView(coverage)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(coverage.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CoverageDetailModal
        open={detailModalOpen}
        onOpenChange={setDetailModalOpen}
        coverage={selectedCoverage}
      />
    </Card>
  );
};

export default MarketCoverageManager;
