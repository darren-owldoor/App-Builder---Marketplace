import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { RefreshCw, TrendingUp, MapPin, Eye } from "lucide-react";
import { CoverageQualityBadge } from "@/components/CoverageQualityBadge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";

interface CoverageArea {
  id: string;
  name: string;
  coverage_type: string;
  quality_score: number;
  completeness_score: number;
  coverage_breadth_score: number;
  demand_overlap_score: number;
  score_details: any;
  last_scored_at: string;
  created_at: string;
  data: any;
}

export default function CoverageQualityDashboard() {
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoverage, setSelectedCoverage] = useState<CoverageArea | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [rescoring, setRescoring] = useState(false);

  useEffect(() => {
    fetchCoverageAreas();
  }, []);

  const fetchCoverageAreas = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("market_coverage")
        .select("*")
        .eq("user_id", user.id)
        .order("quality_score", { ascending: false });

      if (error) throw error;
      setCoverageAreas(data || []);
    } catch (error: any) {
      console.error("Error fetching coverage areas:", error);
      toast.error("Failed to load coverage areas");
    } finally {
      setLoading(false);
    }
  };

  const rescoreAllCoverage = async () => {
    try {
      setRescoring(true);
      
      // Trigger a simple update on all coverage areas to recalculate scores
      for (const area of coverageAreas) {
        const { error } = await supabase
          .from("market_coverage")
          .update({ updated_at: new Date().toISOString() })
          .eq("id", area.id);
        
        if (error) throw error;
      }
      
      toast.success("Coverage scores recalculated!");
      await fetchCoverageAreas();
    } catch (error: any) {
      console.error("Error rescoring coverage:", error);
      toast.error("Failed to rescore coverage areas");
    } finally {
      setRescoring(false);
    }
  };

  const averageScore = coverageAreas.length > 0
    ? Math.round(coverageAreas.reduce((sum, area) => sum + area.quality_score, 0) / coverageAreas.length)
    : 0;

  const excellentCount = coverageAreas.filter(a => a.quality_score >= 80).length;
  const goodCount = coverageAreas.filter(a => a.quality_score >= 60 && a.quality_score < 80).length;
  const needsImprovementCount = coverageAreas.filter(a => a.quality_score < 60).length;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Competition Level Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Monitor and analyze market competition in your coverage areas
          </p>
        </div>
        <Button onClick={rescoreAllCoverage} disabled={rescoring || coverageAreas.length === 0}>
          <RefreshCw className={`h-4 w-4 mr-2 ${rescoring ? 'animate-spin' : ''}`} />
          Recalculate Scores
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Average Competition Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{averageScore}/100</div>
            <Progress value={averageScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Excellent Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{excellentCount}</div>
            <p className="text-xs text-muted-foreground mt-1">80+ score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Good Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">{goodCount}</div>
            <p className="text-xs text-muted-foreground mt-1">60-79 score</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Needs Improvement
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{needsImprovementCount}</div>
            <p className="text-xs text-muted-foreground mt-1">&lt;60 score</p>
          </CardContent>
        </Card>
      </div>

      {/* Coverage Areas List */}
      <Card>
        <CardHeader>
          <CardTitle>Your Coverage Areas</CardTitle>
          <CardDescription>
            Sorted by competition score (highest to lowest)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading coverage areas...</div>
          ) : coverageAreas.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No coverage areas found. Create one to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {coverageAreas.map((area) => (
                <div
                  key={area.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:border-primary/50 transition-all"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <h3 className="font-semibold text-lg truncate">{area.name}</h3>
                      <Badge variant="outline" className="text-xs">
                        {area.coverage_type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{area.score_details?.zipCodeCount || 0} ZIP codes</span>
                      <span>{area.score_details?.cityCount || 0} cities</span>
                      <span>{area.score_details?.countyCount || 0} counties</span>
                      <span>{area.score_details?.teamsInArea || area.score_details?.prosInArea || 0} Teams in area</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="text-2xl font-bold">{area.quality_score}/100</div>
                      <Progress value={area.quality_score} className="w-24 mt-1" />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedCoverage(area);
                        setDetailsOpen(true);
                      }}
                    >
                      <Eye className="h-4 w-4 mr-1" />
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Modal */}
      {selectedCoverage && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{selectedCoverage.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <CoverageQualityBadge
                qualityScore={selectedCoverage.quality_score}
                completenessScore={selectedCoverage.completeness_score}
                breadthScore={selectedCoverage.coverage_breadth_score}
                demandScore={selectedCoverage.demand_overlap_score}
                scoreDetails={selectedCoverage.score_details}
                showBreakdown={true}
              />
              
              <div className="p-4 bg-muted rounded-lg">
                <h4 className="font-semibold mb-2">Coverage Details</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-muted-foreground">Type:</span>{" "}
                    <span className="font-medium">{selectedCoverage.coverage_type}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Created:</span>{" "}
                    <span className="font-medium">
                      {new Date(selectedCoverage.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Last Scored:</span>{" "}
                    <span className="font-medium">
                      {selectedCoverage.last_scored_at 
                        ? new Date(selectedCoverage.last_scored_at).toLocaleDateString()
                        : 'Never'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
