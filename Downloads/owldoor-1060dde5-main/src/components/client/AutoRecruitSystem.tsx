import { useState, useEffect, useRef, useCallback } from "react";
import { GoogleMap, LoadScript, Circle, DrawingManager, Marker, Polygon } from "@react-google-maps/api";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  MapPin,
  Trash2,
  Plus,
  Navigation,
  Circle as CircleIcon,
  Edit3,
  Save,
  X,
  DollarSign,
  Users,
  Target,
  TrendingUp,
} from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface CoverageArea {
  id: string;
  type: 'zip' | 'radius' | 'polygon' | 'city';
  name: string;
  data: any;
  color: string;
}

interface Bid {
  id: string;
  bid_amount: number;
  max_leads_per_month: number | null;
  coverage_data: any;
  min_experience: number | null;
  min_transactions: number | null;
  min_motivation: number | null;
  pro_type: 'real_estate' | 'mortgage' | null;
  active: boolean;
  created_at: string;
  preferences?: any;
}

interface MatchingPro {
  id: string;
  full_name: string;
  email: string;
  pro_type: string;
  experience: number;
  transactions: number;
  qualification_score: number;
  match_score: number;
  coverage_overlap: number;
}

interface AutoRecruitSystemProps {
  clientId: string;
  userId: string;
}

const libraries: ("drawing" | "places" | "geometry")[] = ["drawing", "places", "geometry"];

const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
];

const colors = [
  "#22c55e", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6",
  "#ec4899", "#14b8a6", "#f97316", "#06b6d4", "#84cc16"
];

export function AutoRecruitSystem({ clientId, userId }: AutoRecruitSystemProps) {
  const { toast } = useToast();
  const [bids, setBids] = useState<Bid[]>([]);
  const [selectedBid, setSelectedBid] = useState<Bid | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [loading, setLoading] = useState(true);
  const [clientCoverage, setClientCoverage] = useState<CoverageArea[]>([]);
  
  // Campaign form state
  const [campaignName, setCampaignName] = useState("");
  const [bidAmount, setBidAmount] = useState("50");
  const [marketRate, setMarketRate] = useState<number | null>(null);
  const [maxLeadsPerMonth, setMaxLeadsPerMonth] = useState("10");
  const [minExperience, setMinExperience] = useState("2");
  const [minTransactions, setMinTransactions] = useState("5");
  const [minVolume, setMinVolume] = useState("");
  const [proType, setProType] = useState<'real_estate' | 'mortgage'>('real_estate');
  
  // Coverage state
  const [coverageAreas, setCoverageAreas] = useState<CoverageArea[]>([]);
  const [activeTab, setActiveTab] = useState("zip");
  const [mapCenter, setMapCenter] = useState({ lat: 37.7749, lng: -122.4194 });
  const [mapZoom, setMapZoom] = useState(10);
  
  // Zip/City entry
  const [zipInput, setZipInput] = useState("");
  const [cityInput, setCityInput] = useState("");
  const [stateInput, setStateInput] = useState("");
  
  // Radius entry
  const [radiusCenter, setRadiusCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [radiusDistance, setRadiusDistance] = useState("25");
  const [radiusAddress, setRadiusAddress] = useState("");
  
  // Drawing mode
  const [drawingMode, setDrawingMode] = useState<google.maps.drawing.OverlayType | null>(null);
  
  // Matching pros
  const [matchingPros, setMatchingPros] = useState<MatchingPro[]>([]);
  const [showMatches, setShowMatches] = useState(false);
  
  const mapRef = useRef<google.maps.Map | null>(null);
  const geocoderRef = useRef<google.maps.Geocoder | null>(null);

  useEffect(() => {
    loadBids();
    loadClientCoverage();
    getUserLocation();
  }, [clientId]);

  const loadClientCoverage = async () => {
    try {
      const { data, error } = await supabase
        .from('clients')
        .select('coverage_areas')
        .eq('id', clientId)
        .single();

      if (error) throw error;

      if (data?.coverage_areas && Array.isArray(data.coverage_areas)) {
        // Convert client coverage to CoverageArea format
        const areas: CoverageArea[] = data.coverage_areas.map((area: any, index: number) => ({
          id: area.id || `client-${index}`,
          type: area.type || 'city',
          name: area.name || '',
          data: area.data || {},
          color: colors[index % colors.length],
        }));
        setClientCoverage(areas);
      }
    } catch (error) {
      console.error('Error loading client coverage:', error);
    }
  };

  const loadBids = async () => {
    try {
      const { data, error } = await supabase
        .from('bids')
        .select('*')
        .eq('client_id', clientId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        setBids(data as any);
      }
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast({
        title: "Error",
        description: "Failed to load auto-recruit campaigns",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMarketRate = async () => {
    if (coverageAreas.length === 0) return;

    try {
      // Get all active bids from other clients with overlapping coverage
      const { data, error } = await supabase
        .from('bids')
        .select('bid_amount, coverage_data')
        .neq('client_id', clientId)
        .eq('active', true);

      if (error) throw error;

      if (data && data.length > 0) {
        // Find highest bid with any coverage overlap
        let highestBid = 0;
        data.forEach((otherBid: any) => {
          const otherAreas = otherBid.coverage_data?.areas || [];
          const hasOverlap = coverageAreas.some(myArea => 
            otherAreas.some((otherArea: CoverageArea) => 
              myArea.name === otherArea.name || myArea.type === otherArea.type
            )
          );
          
          if (hasOverlap && otherBid.bid_amount > highestBid) {
            highestBid = otherBid.bid_amount;
          }
        });

        setMarketRate(highestBid > 0 ? highestBid : null);
      }
    } catch (error) {
      console.error('Error fetching market rate:', error);
    }
  };

  const getUserLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setMapCenter({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setMapZoom(11);
        }
      );
    }
  };

  const onMapLoad = useCallback((map: google.maps.Map) => {
    mapRef.current = map;
    geocoderRef.current = new google.maps.Geocoder();
  }, []);

  // ZIP CODE FUNCTIONS
  const handleAddZipCode = async () => {
    if (!zipInput.trim()) {
      toast({
        title: "Enter a ZIP code",
        variant: "destructive",
      });
      return;
    }

    if (!geocoderRef.current) return;

    geocoderRef.current.geocode({ address: zipInput }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const bounds = results[0].geometry.bounds || results[0].geometry.viewport;

        const newArea: CoverageArea = {
          id: `zip-${Date.now()}`,
          type: 'zip',
          name: zipInput,
          data: {
            zip: zipInput,
            center: { lat: location.lat(), lng: location.lng() },
            bounds: bounds ? {
              ne: { lat: bounds.getNorthEast().lat(), lng: bounds.getNorthEast().lng() },
              sw: { lat: bounds.getSouthWest().lat(), lng: bounds.getSouthWest().lng() },
            } : null,
          },
          color: colors[coverageAreas.length % colors.length],
        };

        setCoverageAreas([...coverageAreas, newArea]);
        setZipInput("");
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setMapZoom(12);

        toast({
          title: "ZIP code added",
          description: `${zipInput} added to coverage area`,
        });
      } else {
        toast({
          title: "Invalid ZIP code",
          description: "Please enter a valid US ZIP code",
          variant: "destructive",
        });
      }
    });
  };

  // CITY FUNCTIONS
  const handleAddCity = async () => {
    if (!cityInput.trim() || !stateInput) {
      toast({
        title: "Enter city and state",
        variant: "destructive",
      });
      return;
    }

    if (!geocoderRef.current) return;

    const address = `${cityInput}, ${stateInput}, USA`;
    
    geocoderRef.current.geocode({ address }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        const bounds = results[0].geometry.bounds || results[0].geometry.viewport;

        const newArea: CoverageArea = {
          id: `city-${Date.now()}`,
          type: 'city',
          name: `${cityInput}, ${stateInput}`,
          data: {
            city: cityInput,
            state: stateInput,
            center: { lat: location.lat(), lng: location.lng() },
            bounds: bounds ? {
              ne: { lat: bounds.getNorthEast().lat(), lng: bounds.getNorthEast().lng() },
              sw: { lat: bounds.getSouthWest().lat(), lng: bounds.getSouthWest().lng() },
            } : null,
          },
          color: colors[coverageAreas.length % colors.length],
        };

        setCoverageAreas([...coverageAreas, newArea]);
        setCityInput("");
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setMapZoom(11);

        toast({
          title: "City added",
          description: `${cityInput}, ${stateInput} added`,
        });
      } else {
        toast({
          title: "Invalid city",
          description: "Please enter a valid city and state",
          variant: "destructive",
        });
      }
    });
  };

  // RADIUS FUNCTIONS
  const handleAddressSearch = async () => {
    if (!radiusAddress.trim() || !geocoderRef.current) return;

    geocoderRef.current.geocode({ address: radiusAddress }, (results, status) => {
      if (status === 'OK' && results && results[0]) {
        const location = results[0].geometry.location;
        setRadiusCenter({ lat: location.lat(), lng: location.lng() });
        setMapCenter({ lat: location.lat(), lng: location.lng() });
        setMapZoom(10);
      } else {
        toast({
          title: "Address not found",
          description: "Please enter a valid address",
          variant: "destructive",
        });
      }
    });
  };

  const handleAddRadius = () => {
    if (!radiusCenter) {
      toast({
        title: "Select a location",
        description: "Search for an address or click on the map",
        variant: "destructive",
      });
      return;
    }

    const radiusMiles = parseFloat(radiusDistance);
    if (isNaN(radiusMiles) || radiusMiles <= 0) {
      toast({
        title: "Invalid radius",
        description: "Please enter a valid radius in miles",
        variant: "destructive",
      });
      return;
    }

    const newArea: CoverageArea = {
      id: `radius-${Date.now()}`,
      type: 'radius',
      name: `${radiusMiles} mile radius`,
      data: {
        center: radiusCenter,
        radius: radiusMiles,
        radiusMeters: radiusMiles * 1609.34,
      },
      color: colors[coverageAreas.length % colors.length],
    };

    setCoverageAreas([...coverageAreas, newArea]);
    setRadiusCenter(null);
    setRadiusAddress("");
    
    toast({
      title: "Radius added",
      description: `${radiusMiles} mile coverage area added`,
    });
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (activeTab === 'radius' && e.latLng) {
      setRadiusCenter({
        lat: e.latLng.lat(),
        lng: e.latLng.lng(),
      });
    }
  };

  // DRAWING FUNCTIONS
  const onPolygonComplete = (polygon: google.maps.Polygon) => {
    const path = polygon.getPath();
    const coordinates: { lat: number; lng: number }[] = [];
    
    for (let i = 0; i < path.getLength(); i++) {
      const point = path.getAt(i);
      coordinates.push({ lat: point.lat(), lng: point.lng() });
    }

    const newArea: CoverageArea = {
      id: `polygon-${Date.now()}`,
      type: 'polygon',
      name: `Custom area ${coverageAreas.filter(a => a.type === 'polygon').length + 1}`,
      data: { coordinates },
      color: colors[coverageAreas.length % colors.length],
    };

    setCoverageAreas([...coverageAreas, newArea]);
    setDrawingMode(null);
    polygon.setMap(null);

    toast({
      title: "Custom area added",
      description: "Your drawn area has been saved",
    });
  };

  const handleRemoveArea = (id: string) => {
    setCoverageAreas(coverageAreas.filter(area => area.id !== id));
    toast({
      title: "Area removed",
      description: "Coverage area has been deleted",
    });
  };

  // Pre-populate coverage when opening dialog
  useEffect(() => {
    if (isCreating && coverageAreas.length === 0 && clientCoverage.length > 0) {
      setCoverageAreas([...clientCoverage]);
      toast({
        title: "Coverage pre-loaded ✅",
        description: `Loaded ${clientCoverage.length} areas from your profile. Feel free to adjust.`,
      });
    }
  }, [isCreating, clientCoverage]);

  // Check market rate when coverage changes
  useEffect(() => {
    if (isCreating && coverageAreas.length > 0) {
      fetchMarketRate();
    }
  }, [coverageAreas, isCreating]);

  // Validate coverage against client coverage
  const validateCoverageAgainstClient = (): boolean => {
    if (clientCoverage.length === 0) return true; // No client coverage to validate against

    // Check if at least some campaign coverage overlaps with client coverage
    const hasOverlap = coverageAreas.some(campaignArea => 
      clientCoverage.some(clientArea => 
        campaignArea.name.toLowerCase().includes(clientArea.name.toLowerCase()) ||
        clientArea.name.toLowerCase().includes(campaignArea.name.toLowerCase()) ||
        (campaignArea.type === clientArea.type && campaignArea.name === clientArea.name)
      )
    );

    return hasOverlap;
  };

  // SAVE CAMPAIGN
  const handleSaveCampaign = async () => {
    if (!campaignName.trim()) {
      toast({
        title: "Enter a campaign name",
        variant: "destructive",
      });
      return;
    }

    if (coverageAreas.length === 0) {
      toast({
        title: "Add coverage areas",
        description: "Please add at least one coverage area",
        variant: "destructive",
      });
      return;
    }

    // Validate coverage
    if (clientCoverage.length > 0 && !validateCoverageAgainstClient()) {
      toast({
        title: "Coverage validation warning",
        description: "This campaign targets areas outside your profile coverage. Consider updating your profile or adjusting the campaign.",
        variant: "destructive",
      });
      // Allow them to proceed anyway for flexibility
    }

    setLoading(true);
    try {
      const campaignData = {
        client_id: clientId,
        bid_amount: parseFloat(bidAmount),
        max_leads_per_month: maxLeadsPerMonth ? parseInt(maxLeadsPerMonth) : null,
        coverage_data: { areas: coverageAreas },
        min_experience: minExperience ? parseInt(minExperience) : null,
        min_transactions: minTransactions ? parseInt(minTransactions) : null,
        min_motivation: null, // Set by user or via import
        pro_type: proType,
        active: true,
        preferences: {
          name: campaignName,
        }
      };

      const { error } = await supabase
        .from('bids')
        .insert([campaignData] as any);

      if (error) throw error;

      toast({
        title: "Auto-Recruit Campaign Live! 🚀",
        description: "Your campaign is now active and will automatically match incoming leads",
      });

      // Reset form
      setIsCreating(false);
      setCampaignName("");
      setCoverageAreas([]); // Will be repopulated from client coverage next time
      setMarketRate(null);
      loadBids();
    } catch (error) {
      console.error('Error saving campaign:', error);
      toast({
        title: "Error",
        description: "Failed to create campaign",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // FIND MATCHING PROS
  const handleFindMatches = async (bid: Bid) => {
    setLoading(true);
    try {
      const { data, error } = await (supabase as any)
        .from('pros')
        .select('*')
        .eq('active', true)
        .not('coverage_areas', 'is', null);

      if (error) throw error;

      // Calculate match scores
      const bidCoverageData: any = bid.coverage_data;
      const bidCoverage: any[] = bidCoverageData?.areas || [];
      
      const matches: MatchingPro[] = (data || [])
        .map((pro: any) => {
          // Calculate geographic overlap
          const proCoverage: any[] = pro.coverage_areas || [];
          const geoScore = calculateGeographicOverlap(bidCoverage, proCoverage);

          // Calculate criteria match
          const criteriaScore = calculateCriteriaMatch(bid, pro);

          const matchScore = (geoScore * 0.4) + (criteriaScore * 0.6);

          return {
            id: pro.id,
            full_name: pro.full_name,
            email: pro.email,
            pro_type: pro.pro_type,
            experience: pro.experience || 0,
            transactions: pro.transactions || 0,
            qualification_score: pro.qualification_score || 0,
            match_score: Math.round(matchScore),
            coverage_overlap: Math.round(geoScore),
          };
        })
        .filter(pro => pro.match_score >= 30) // Only show matches >= 30%
        .sort((a, b) => b.match_score - a.match_score);

      setMatchingPros(matches);
      setShowMatches(true);
      setSelectedBid(bid);

      toast({
        title: "Matches found! 🎯",
        description: `Found ${matches.length} matching professionals`,
      });
    } catch (error) {
      console.error('Error finding matches:', error);
      toast({
        title: "Error",
        description: "Failed to find matches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateGeographicOverlap = (bidAreas: CoverageArea[], proAreas: any[]): number => {
    let score = 0;
    let maxScore = 100;

    bidAreas.forEach(bidArea => {
      proAreas.forEach(proArea => {
        if (bidArea.type === 'zip' && proArea.type === 'zip') {
          if (bidArea.name === proArea.name) score += 20;
        } else if (bidArea.type === 'city' && proArea.type === 'city') {
          if (bidArea.name === proArea.name) score += 15;
        }
      });
    });

    return Math.min(score, maxScore);
  };

  const calculateCriteriaMatch = (bid: Bid, pro: any): number => {
    let score = 100;

    if (bid.min_experience && pro.experience < bid.min_experience) {
      score -= 30;
    }

    if (bid.min_transactions && pro.transactions < bid.min_transactions) {
      score -= 30;
    }

    if (bid.pro_type && pro.pro_type !== bid.pro_type) {
      score -= 40;
    }

    return Math.max(score, 0);
  };

  const mapContainerStyle = {
    width: '100%',
    height: '500px',
    borderRadius: '12px',
  };

  if (loading && bids.length === 0) {
    return (
      <div className="flex items-center justify-center p-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-2xl">Auto-Recruit Campaigns</CardTitle>
              <CardDescription>
                Create campaigns with geographic targeting to automatically match with qualified professionals from Zapier/webhooks
              </CardDescription>
            </div>
            <Dialog open={isCreating} onOpenChange={setIsCreating}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Create Campaign
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create Auto-Recruit Campaign</DialogTitle>
                  <DialogDescription>
                    Define coverage areas and criteria - incoming leads will automatically match to qualified pros
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-2 gap-6">
                  {/* Left column - Campaign Details */}
                  <div className="space-y-4">
                    <div>
                      <Label>Campaign Name</Label>
                      <Input
                        placeholder="e.g., LA Metro Area Agents"
                        value={campaignName}
                        onChange={(e) => setCampaignName(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label>Professional Type</Label>
                      <Select value={proType} onValueChange={(v: any) => setProType(v)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="real_estate">Real Estate Agent</SelectItem>
                          <SelectItem value="mortgage">Loan Officer</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      {marketRate !== null && (
                        <div className="p-3 bg-muted rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Current Market Rate (Highest Bid)</p>
                          <p className="text-2xl font-bold text-green-600">${marketRate}</p>
                          <p className="text-xs text-muted-foreground mt-1">Outbid to maximize matches</p>
                        </div>
                      )}
                      
                      <div>
                        <Label>Your Bid Amount ($)</Label>
                        <Input
                          type="number"
                          value={bidAmount}
                          onChange={(e) => setBidAmount(e.target.value)}
                          min="1"
                        />
                        <p className="text-xs text-muted-foreground mt-1">
                          {marketRate && parseFloat(bidAmount) > marketRate 
                            ? "✅ You're outbidding competitors" 
                            : "Set higher to win more matches"}
                        </p>
                      </div>
                      
                      <div>
                        <Label>Max Leads/Month</Label>
                        <Input
                          type="number"
                          value={maxLeadsPerMonth}
                          onChange={(e) => setMaxLeadsPerMonth(e.target.value)}
                          min="1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>Minimum Experience (years)</Label>
                      <Input
                        type="number"
                        value={minExperience}
                        onChange={(e) => setMinExperience(e.target.value)}
                        min="0"
                      />
                    </div>

                    <div>
                      <Label>Minimum Transactions/Year</Label>
                      <Input
                        type="number"
                        value={minTransactions}
                        onChange={(e) => setMinTransactions(e.target.value)}
                        min="0"
                      />
                    </div>

                    {proType === 'real_estate' && (
                      <div>
                        <Label>Minimum Volume ($)</Label>
                        <Input
                          type="number"
                          value={minVolume}
                          onChange={(e) => setMinVolume(e.target.value)}
                          min="0"
                          placeholder="Optional"
                        />
                      </div>
                    )}

                    {coverageAreas.length > 0 && (
                      <Card>
                        <CardHeader>
                          <div className="flex items-center justify-between">
                            <CardTitle className="text-sm">Campaign Coverage ({coverageAreas.length})</CardTitle>
                            {clientCoverage.length > 0 && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setCoverageAreas([...clientCoverage])}
                                className="text-xs"
                              >
                                Reset to Profile
                              </Button>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          {coverageAreas.map((area) => {
                            const isFromProfile = clientCoverage.some(ca => ca.name === area.name);
                            return (
                              <div
                                key={area.id}
                                className="flex items-center justify-between p-2 border rounded"
                              >
                                <div className="flex items-center gap-2">
                                  <div
                                    className="w-3 h-3 rounded-full"
                                    style={{ backgroundColor: area.color }}
                                  />
                                  <span className="text-sm">{area.name}</span>
                                  {isFromProfile && (
                                    <span className="text-xs text-muted-foreground">(Profile)</span>
                                  )}
                                </div>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveArea(area.id)}
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            );
                          })}
                        </CardContent>
                      </Card>
                    )}

                    <Button
                      onClick={handleSaveCampaign}
                      disabled={loading || !campaignName || coverageAreas.length === 0}
                      className="w-full gap-2"
                    >
                      <Save className="w-4 h-4" />
                      {loading ? 'Activating...' : 'Activate Campaign'}
                    </Button>
                  </div>

                  {/* Right column - Map and Coverage */}
                  <div className="space-y-4">
                    <Tabs value={activeTab} onValueChange={setActiveTab}>
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="zip">ZIP</TabsTrigger>
                        <TabsTrigger value="city">City</TabsTrigger>
                        <TabsTrigger value="radius">Radius</TabsTrigger>
                        <TabsTrigger value="draw">Draw</TabsTrigger>
                      </TabsList>

                      <TabsContent value="zip" className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter ZIP code"
                            value={zipInput}
                            onChange={(e) => setZipInput(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddZipCode()}
                            maxLength={5}
                          />
                          <Button onClick={handleAddZipCode} size="sm">
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </TabsContent>

                      <TabsContent value="city" className="space-y-3">
                        <div className="grid grid-cols-3 gap-2">
                          <Input
                            placeholder="City"
                            value={cityInput}
                            onChange={(e) => setCityInput(e.target.value)}
                            className="col-span-2"
                          />
                          <Select value={stateInput} onValueChange={setStateInput}>
                            <SelectTrigger>
                              <SelectValue placeholder="State" />
                            </SelectTrigger>
                            <SelectContent>
                              {US_STATES.map((state) => (
                                <SelectItem key={state} value={state}>
                                  {state}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <Button onClick={handleAddCity} size="sm" className="w-full">
                          <Plus className="w-4 h-4 mr-2" />
                          Add City
                        </Button>
                      </TabsContent>

                      <TabsContent value="radius" className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="Enter address"
                            value={radiusAddress}
                            onChange={(e) => setRadiusAddress(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleAddressSearch()}
                          />
                          <Button onClick={handleAddressSearch} size="sm" variant="outline">
                            <Navigation className="w-4 h-4" />
                          </Button>
                        </div>
                        <Select value={radiusDistance} onValueChange={setRadiusDistance}>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5 miles</SelectItem>
                            <SelectItem value="10">10 miles</SelectItem>
                            <SelectItem value="25">25 miles</SelectItem>
                            <SelectItem value="50">50 miles</SelectItem>
                            <SelectItem value="100">100 miles</SelectItem>
                          </SelectContent>
                        </Select>
                        <Button
                          onClick={handleAddRadius}
                          disabled={!radiusCenter}
                          size="sm"
                          className="w-full"
                        >
                          <CircleIcon className="w-4 h-4 mr-2" />
                          Add Radius
                        </Button>
                      </TabsContent>

                      <TabsContent value="draw" className="space-y-3">
                        <Button
                          onClick={() => setDrawingMode(google.maps.drawing.OverlayType.POLYGON)}
                          variant={drawingMode ? "default" : "outline"}
                          size="sm"
                          className="w-full"
                        >
                          <Edit3 className="w-4 h-4 mr-2" />
                          {drawingMode ? "Drawing..." : "Start Drawing"}
                        </Button>
                        {drawingMode && (
                          <Button
                            onClick={() => setDrawingMode(null)}
                            variant="outline"
                            size="sm"
                            className="w-full"
                          >
                            <X className="w-4 h-4 mr-2" />
                            Cancel
                          </Button>
                        )}
                      </TabsContent>
                    </Tabs>

                    <LoadScript
                      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY || ""}
                      libraries={libraries}
                    >
                      <GoogleMap
                        mapContainerStyle={{ ...mapContainerStyle, height: '400px' }}
                        center={mapCenter}
                        zoom={mapZoom}
                        onLoad={onMapLoad}
                        onClick={handleMapClick}
                        options={{
                          streetViewControl: false,
                          mapTypeControl: false,
                          fullscreenControl: false,
                        }}
                      >
                        {/* Render coverage areas */}
                        {coverageAreas
                          .filter(area => area.type === 'zip' || area.type === 'city')
                          .map((area) => (
                            <Marker
                              key={area.id}
                              position={area.data.center}
                              icon={{
                                path: google.maps.SymbolPath.CIRCLE,
                                fillColor: area.color,
                                fillOpacity: 0.6,
                                strokeColor: area.color,
                                strokeWeight: 2,
                                scale: 8,
                              }}
                            />
                          ))}

                        {coverageAreas
                          .filter(area => area.type === 'radius')
                          .map((area) => (
                            <Circle
                              key={area.id}
                              center={area.data.center}
                              radius={area.data.radiusMeters}
                              options={{
                                fillColor: area.color,
                                fillOpacity: 0.2,
                                strokeColor: area.color,
                                strokeWeight: 2,
                              }}
                            />
                          ))}

                        {radiusCenter && activeTab === 'radius' && (
                          <Circle
                            center={radiusCenter}
                            radius={parseFloat(radiusDistance) * 1609.34}
                            options={{
                              fillColor: "#3b82f6",
                              fillOpacity: 0.2,
                              strokeColor: "#3b82f6",
                              strokeWeight: 2,
                            }}
                          />
                        )}

                        {activeTab === 'draw' && drawingMode && (
                          <DrawingManager
                            drawingMode={drawingMode}
                            onPolygonComplete={onPolygonComplete}
                            options={{
                              drawingControl: false,
                              polygonOptions: {
                                fillColor: colors[coverageAreas.length % colors.length],
                                fillOpacity: 0.2,
                                strokeColor: colors[coverageAreas.length % colors.length],
                                strokeWeight: 2,
                              },
                            }}
                          />
                        )}
                      </GoogleMap>
                    </LoadScript>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
      </Card>

      {/* Existing Bids */}
      {/* Active Campaigns */}
      {bids.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Target className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first auto-recruit campaign to match incoming leads with qualified professionals
            </p>
            <Button onClick={() => setIsCreating(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {bids.map((bid) => (
            <Card key={bid.id}>
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <h3 className="text-xl font-semibold">
                        {bid.preferences?.name || 'Untitled Campaign'}
                      </h3>
                      <Badge variant={bid.active ? "default" : "secondary"}>
                        {bid.active ? '🔴 Live' : 'Inactive'}
                      </Badge>
                      <Badge variant="outline">
                        {bid.pro_type === 'real_estate' ? 'Real Estate' : 'Mortgage'}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-4 gap-4 mb-4">
                      <div>
                        <p className="text-sm text-muted-foreground">Your Bid</p>
                        <p className="text-lg font-semibold text-green-600">
                          ${bid.bid_amount}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Max Leads/Month</p>
                        <p className="text-lg font-semibold">
                          {bid.max_leads_per_month || 'Unlimited'}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Coverage Areas</p>
                        <p className="text-lg font-semibold">
                          {bid.coverage_data?.length || 0}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Min Experience</p>
                        <p className="text-lg font-semibold">
                          {bid.min_experience ? `${bid.min_experience} years` : 'Any'}
                        </p>
                      </div>
                    </div>

                    {bid.coverage_data && bid.coverage_data.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {bid.coverage_data.slice(0, 5).map((area: CoverageArea) => (
                          <Badge key={area.id} variant="outline">
                            <MapPin className="w-3 h-3 mr-1" />
                            {area.name}
                          </Badge>
                        ))}
                        {bid.coverage_data.length > 5 && (
                          <Badge variant="outline">
                            +{bid.coverage_data.length - 5} more
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  <Button
                    onClick={() => handleFindMatches(bid)}
                    className="gap-2"
                    disabled={loading}
                  >
                    <Users className="w-4 h-4" />
                    Find Matches
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Matching Pros Dialog */}
      <Dialog open={showMatches} onOpenChange={setShowMatches}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Matching Professionals</DialogTitle>
            <DialogDescription>
              Found {matchingPros.length} professionals matching your bid criteria
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3">
            {matchingPros.map((pro) => (
              <Card key={pro.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold">{pro.full_name}</h4>
                        <Badge variant="outline">{pro.pro_type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{pro.email}</p>
                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Experience</p>
                          <p className="font-semibold">{pro.experience} years</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Transactions</p>
                          <p className="font-semibold">{pro.transactions}/year</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Qualification</p>
                          <p className="font-semibold">{pro.qualification_score}%</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="mb-2">
                        <p className="text-xs text-muted-foreground mb-1">Match Score</p>
                        <div className="text-3xl font-bold text-green-600">
                          {pro.match_score}%
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {pro.coverage_overlap}% Geo Overlap
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
