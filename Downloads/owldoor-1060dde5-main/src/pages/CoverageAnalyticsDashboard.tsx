import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { 
  ArrowLeft, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  MapPin, 
  Target,
  Activity,
  Zap,
  AlertCircle
} from 'lucide-react';
import owlDoorLogo from '@/assets/owldoor-logo-light-green.png';
import { CoverageHeatmap } from '@/components/coverage/CoverageHeatmap';
import { MarketSaturationChart } from '@/components/coverage/MarketSaturationChart';
import { CoverageComparisonTable } from '@/components/coverage/CoverageComparisonTable';

interface CoverageArea {
  id: string;
  name: string;
  coverage_type: string;
  data: any;
  quality_score: number;
  completeness_score: number;
  coverage_breadth_score: number;
  demand_overlap_score: number;
  score_details: any;
  created_at: string;
  user_id: string;
}

interface MarketStats {
  totalCoverageAreas: number;
  avgQualityScore: number;
  excellentCount: number;
  goodCount: number;
  fairCount: number;
  needsImprovementCount: number;
  totalZipsCovered: number;
  totalCitiesCovered: number;
  avgTeamsPerArea: number;
  highCompetitionAreas: number;
}

const CoverageAnalyticsDashboard = () => {
  const navigate = useNavigate();
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);
  const [stats, setStats] = useState<MarketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedView, setSelectedView] = useState<'heatmap' | 'saturation' | 'comparison'>('heatmap');

  useEffect(() => {
    fetchCoverageData();
  }, []);

  const fetchCoverageData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      // Fetch all coverage areas for the user
      const { data, error } = await supabase
        .from('market_coverage')
        .select('*')
        .eq('user_id', user.id)
        .order('quality_score', { ascending: false });

      if (error) throw error;

      const areas = (data || []) as CoverageArea[];
      setCoverageAreas(areas);

      // Calculate statistics
      if (areas.length > 0) {
        const totalQuality = areas.reduce((sum, a) => sum + (a.quality_score || 0), 0);
        const avgQuality = Math.round(totalQuality / areas.length);

        const excellent = areas.filter(a => a.quality_score >= 80).length;
        const good = areas.filter(a => a.quality_score >= 60 && a.quality_score < 80).length;
        const fair = areas.filter(a => a.quality_score >= 40 && a.quality_score < 60).length;
        const needsImprovement = areas.filter(a => a.quality_score < 40).length;

        // Count unique zips and cities
        const allZips = new Set<string>();
        const allCities = new Set<string>();
        let totalTeams = 0;
        let areasWithTeams = 0;

        areas.forEach(area => {
          const zipCodes = area.data?.zipCodes || [];
          const cities = area.data?.cities || [];
          const teamsInArea = area.score_details?.teamsInArea || 0;

          zipCodes.forEach((zip: string) => allZips.add(zip));
          cities.forEach((city: string) => allCities.add(city));
          totalTeams += teamsInArea;
          if (teamsInArea > 0) areasWithTeams++;
        });

        const avgTeams = areasWithTeams > 0 ? Math.round(totalTeams / areasWithTeams) : 0;
        const highCompetition = areas.filter(a => 
          (a.score_details?.teamsInArea || 0) >= 25
        ).length;

        setStats({
          totalCoverageAreas: areas.length,
          avgQualityScore: avgQuality,
          excellentCount: excellent,
          goodCount: good,
          fairCount: fair,
          needsImprovementCount: needsImprovement,
          totalZipsCovered: allZips.size,
          totalCitiesCovered: allCities.size,
          avgTeamsPerArea: avgTeams,
          highCompetitionAreas: highCompetition,
        });
      }

    } catch (error) {
      console.error('Error fetching coverage data:', error);
      toast.error('Failed to load coverage analytics');
    } finally {
      setLoading(false);
    }
  };

  const getScoreBadge = (score: number) => {
    if (score >= 80) return <Badge className="bg-green-600">Excellent</Badge>;
    if (score >= 60) return <Badge className="bg-blue-600">Good</Badge>;
    if (score >= 40) return <Badge className="bg-yellow-600">Fair</Badge>;
    return <Badge variant="destructive">Needs Improvement</Badge>;
  };

  const getCompetitionLevel = (teams: number) => {
    if (teams >= 100) return { label: 'Very High', color: 'text-red-600' };
    if (teams >= 50) return { label: 'High', color: 'text-orange-600' };
    if (teams >= 25) return { label: 'Moderate', color: 'text-yellow-600' };
    if (teams >= 10) return { label: 'Low', color: 'text-blue-600' };
    return { label: 'Very Low', color: 'text-green-600' };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Analyzing coverage data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img 
              src={owlDoorLogo} 
              alt="OwlDoor" 
              className="h-12 cursor-pointer hover:opacity-80 transition-opacity"
              onClick={() => navigate('/')}
            />
            <div>
              <h1 className="text-xl font-bold">Coverage Analytics Dashboard</h1>
              <p className="text-sm text-muted-foreground">Competition Analysis & Market Insights</p>
            </div>
          </div>
          <Button variant="outline" onClick={() => navigate('/market-coverage')}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Coverage
          </Button>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {coverageAreas.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <MapPin className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-xl font-semibold mb-2">No Coverage Areas Yet</h3>
              <p className="text-muted-foreground mb-6">
                Create coverage areas to see detailed analytics and competition insights
              </p>
              <Button onClick={() => navigate('/market-coverage')}>
                <Target className="mr-2 h-4 w-4" />
                Create Coverage Area
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Stats Overview */}
            <div className="grid md:grid-cols-4 gap-4 mb-8">
              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Average Competition Score</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-3xl font-bold">{stats?.avgQualityScore}%</div>
                    {getScoreBadge(stats?.avgQualityScore || 0)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Across {stats?.totalCoverageAreas} area{stats?.totalCoverageAreas !== 1 ? 's' : ''}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Market Coverage</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">ZIP Codes</span>
                      <span className="font-bold">{stats?.totalZipsCovered}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Cities</span>
                      <span className="font-bold">{stats?.totalCitiesCovered}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>Competition Levels</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="h-5 w-5 text-primary" />
                    <span className="text-2xl font-bold">{stats?.avgTeamsPerArea}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Avg teams per area
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardDescription>High Competition Areas</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-2 mb-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    <span className="text-2xl font-bold">{stats?.highCompetitionAreas}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    25+ teams competing
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Score Distribution */}
            <Card className="mb-8">
              <CardHeader>
                <CardTitle>Competition Score Distribution</CardTitle>
                <CardDescription>
                  How your coverage areas rank by competition level
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-4 gap-4">
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                    <div className="text-3xl font-bold text-green-700 dark:text-green-400">
                      {stats?.excellentCount}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Excellent (80+)</div>
                  </div>
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                    <div className="text-3xl font-bold text-blue-700 dark:text-blue-400">
                      {stats?.goodCount}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Good (60-79)</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 dark:bg-yellow-950 rounded-lg">
                    <div className="text-3xl font-bold text-yellow-700 dark:text-yellow-400">
                      {stats?.fairCount}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Fair (40-59)</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg">
                    <div className="text-3xl font-bold text-red-700 dark:text-red-400">
                      {stats?.needsImprovementCount}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">Needs Work (&lt;40)</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Main Analytics Tabs */}
            <Tabs value={selectedView} onValueChange={(v) => setSelectedView(v as any)}>
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="heatmap">
                  <MapPin className="mr-2 h-4 w-4" />
                  Competition Heatmap
                </TabsTrigger>
                <TabsTrigger value="saturation">
                  <Activity className="mr-2 h-4 w-4" />
                  Market Saturation
                </TabsTrigger>
                <TabsTrigger value="comparison">
                  <Zap className="mr-2 h-4 w-4" />
                  Area Comparison
                </TabsTrigger>
              </TabsList>

              <TabsContent value="heatmap" className="space-y-6">
                <CoverageHeatmap coverageAreas={coverageAreas} />
              </TabsContent>

              <TabsContent value="saturation" className="space-y-6">
                <MarketSaturationChart coverageAreas={coverageAreas} />
              </TabsContent>

              <TabsContent value="comparison" className="space-y-6">
                <CoverageComparisonTable coverageAreas={coverageAreas} />
              </TabsContent>
            </Tabs>

            {/* Detailed Area Cards */}
            <Card className="mt-8">
              <CardHeader>
                <CardTitle>Coverage Area Details</CardTitle>
                <CardDescription>
                  Detailed breakdown of each coverage area
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {coverageAreas.map((area) => {
                    const teams = area.score_details?.teamsInArea || 0;
                    const competition = getCompetitionLevel(teams);
                    
                    return (
                      <div
                        key={area.id}
                        className="border rounded-lg p-4 hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-lg">{area.name}</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {area.coverage_type.replace('_', ' ')}
                            </p>
                          </div>
                          <div className="text-right">
                            {getScoreBadge(area.quality_score || 0)}
                            <p className="text-2xl font-bold mt-1">{area.quality_score}%</p>
                          </div>
                        </div>

                        <div className="grid md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Completeness</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all"
                                  style={{ width: `${(area.completeness_score / 40) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {area.completeness_score}/40
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Breadth</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-blue-600 h-2 rounded-full transition-all"
                                  style={{ width: `${(area.coverage_breadth_score / 35) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {area.coverage_breadth_score}/35
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Competition</p>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-muted rounded-full h-2">
                                <div 
                                  className="bg-orange-600 h-2 rounded-full transition-all"
                                  style={{ width: `${(area.demand_overlap_score / 25) * 100}%` }}
                                />
                              </div>
                              <span className="text-sm font-medium">
                                {area.demand_overlap_score}/25
                              </span>
                            </div>
                          </div>

                          <div>
                            <p className="text-xs text-muted-foreground mb-1">Teams in Area</p>
                            <div className="flex items-center gap-2">
                              <Users className="h-4 w-4 text-muted-foreground" />
                              <span className={`font-bold ${competition.color}`}>
                                {teams}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({competition.label})
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-3 pt-3 border-t flex items-center justify-between text-sm">
                          <div className="flex items-center gap-4 text-muted-foreground">
                            <span>{area.score_details?.zipCodeCount || 0} ZIPs</span>
                            <span>{area.score_details?.cityCount || 0} Cities</span>
                            <span>{area.score_details?.countyCount || 0} Counties</span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => navigate(`/market-coverage`)}
                          >
                            View Details
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </div>
  );
};

export default CoverageAnalyticsDashboard;
