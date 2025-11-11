import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { MapPin, DollarSign, Target, AlertCircle, TrendingUp } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Coverage {
  id: string;
  name: string;
  coverage_type: string;
  user_id: string;
  data: any;
}

interface BidCreationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  onSuccess: () => void;
}

export const BidCreationModal = ({ open, onOpenChange, clientId, onSuccess }: BidCreationModalProps) => {
  const [loading, setLoading] = useState(false);
  const [coverages, setCoverages] = useState<Coverage[]>([]);
  const [selectedCoverages, setSelectedCoverages] = useState<string[]>([]);
  const [highestBids, setHighestBids] = useState<{ [key: string]: { amount: number; bidderName: string; isCurrentUser: boolean } }>({});
  const [packageBasePrice, setPackageBasePrice] = useState<number>(50);
  const [formData, setFormData] = useState({
    bid_amount: "50",
    max_leads_per_month: "",
    min_transactions: "",
    active: true,
  });

  useEffect(() => {
    if (open) {
      fetchPackageBasePrice();
      fetchCoverages();
      fetchHighestBids();
    }
  }, [open, clientId]);

  useEffect(() => {
    if (selectedCoverages.length > 0) {
      fetchHighestBids();
    }
  }, [selectedCoverages]);

  const fetchPackageBasePrice = async () => {
    try {
      const { data: clientData, error: clientError } = await supabase
        .from("clients")
        .select("current_package_id, pricing_packages!current_package_id(price_per_lead)")
        .eq("id", clientId)
        .single();

      if (clientError) throw clientError;

      const basePrice = clientData?.pricing_packages?.price_per_lead || 50;
      setPackageBasePrice(basePrice);
      setFormData(prev => ({ ...prev, bid_amount: basePrice.toString() }));
    } catch (error) {
      console.error("Error fetching package base price:", error);
      // Default to 50 if error
      setPackageBasePrice(50);
    }
  };

  const fetchCoverages = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Fetch ALL coverage types, not just radius and zip
      const { data, error } = await supabase
        .from("market_coverage")
        .select("*")
        .eq("user_id", user.id);

      if (error) throw error;
      setCoverages(data || []);
    } catch (error) {
      console.error("Error fetching coverages:", error);
    }
  };

  const fetchHighestBids = async () => {
    try {
      const selectedCoverageData = coverages.filter(c => selectedCoverages.includes(c.id));
      const newHighestBids: { [key: string]: { amount: number; bidderName: string; isCurrentUser: boolean } } = {};

      for (const coverage of selectedCoverageData) {
        // Get ALL bids including current user's
        let query = supabase
          .from("bids")
          .select("bid_amount, client_id, clients(contact_name, company_name)")
          .eq("active", true);

        if (coverage.coverage_type === "radius" && coverage.data?.center) {
          const { data: existingBids } = await query;
          
          if (existingBids && existingBids.length > 0) {
            const highestBid = existingBids.reduce((max, bid) => 
              bid.bid_amount > max.bid_amount ? bid : max
            );
            newHighestBids[coverage.id] = {
              amount: highestBid.bid_amount,
              bidderName: highestBid.client_id === clientId ? "You" : (highestBid.clients?.company_name || highestBid.clients?.contact_name || "Unknown"),
              isCurrentUser: highestBid.client_id === clientId
            };
          }
        } else if (coverage.coverage_type === "zip") {
          const { data: existingBids } = await query.contains("zip_codes", [coverage.name]);
          
          if (existingBids && existingBids.length > 0) {
            const highestBid = existingBids.reduce((max, bid) => 
              bid.bid_amount > max.bid_amount ? bid : max
            );
            newHighestBids[coverage.id] = {
              amount: highestBid.bid_amount,
              bidderName: highestBid.client_id === clientId ? "You" : (highestBid.clients?.company_name || highestBid.clients?.contact_name || "Unknown"),
              isCurrentUser: highestBid.client_id === clientId
            };
          }
        }
      }

      setHighestBids(newHighestBids);
    } catch (error) {
      console.error("Error fetching highest bids:", error);
    }
  };

  const toggleCoverage = (coverageId: string) => {
    setSelectedCoverages(prev =>
      prev.includes(coverageId)
        ? prev.filter(id => id !== coverageId)
        : [...prev, coverageId]
    );
  };

  const getCompetingBidInfo = () => {
    const allHighestBids = Object.values(highestBids);
    if (allHighestBids.length === 0) return null;
    
    const maxCompetingBid = Math.max(...allHighestBids.map(b => b.amount));
    const currentBid = parseFloat(formData.bid_amount) || packageBasePrice;
    const highestBidder = allHighestBids.find(b => b.amount === maxCompetingBid);
    
    return {
      highest: maxCompetingBid,
      highestBidder: highestBidder?.bidderName || "Unknown",
      isCurrentUserHighest: highestBidder?.isCurrentUser || false,
      isWinning: currentBid > maxCompetingBid,
      suggestedMinimum: maxCompetingBid + 5
    };
  };

  const competingInfo = getCompetingBidInfo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.bid_amount || !formData.max_leads_per_month) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (selectedCoverages.length === 0) {
      toast.error("Please select at least one coverage area");
      return;
    }

    // Check if bid is competitive
    if (competingInfo && !competingInfo.isWinning && !competingInfo.isCurrentUserHighest) {
      const proceed = window.confirm(
        `Current highest bidder is ${competingInfo.highestBidder} at $${competingInfo.highest}. Your bid of $${formData.bid_amount} may not win exclusive rights. Continue anyway?`
      );
      if (!proceed) return;
    }

    setLoading(true);
    try {
      const selectedCoverageData = coverages.filter(c => selectedCoverages.includes(c.id));
      const zipCodes: string[] = [];
      let radiusData: any[] = [];

      selectedCoverageData.forEach(coverage => {
        if (coverage.coverage_type === 'zip') {
          zipCodes.push(coverage.name);
        } else if (coverage.coverage_type === 'radius' && coverage.data) {
          radiusData.push(coverage.data);
        }
      });

      const { error } = await supabase
        .from("bids")
        .insert({
          client_id: clientId,
          bid_amount: parseFloat(formData.bid_amount),
          max_leads_per_month: parseInt(formData.max_leads_per_month),
          min_transactions: formData.min_transactions ? parseInt(formData.min_transactions) : 0,
          zip_codes: zipCodes.length > 0 ? zipCodes : null,
          radius_data: radiusData.length > 0 ? radiusData : null,
          active: formData.active,
          is_exclusive: true, // All bids are for exclusive areas
        });

      if (error) throw error;

      toast.success("Bid created successfully!");
      onSuccess();
      onOpenChange(false);
      
      // Reset form
      setFormData({
        bid_amount: packageBasePrice.toString(),
        max_leads_per_month: "",
        min_transactions: "",
        active: true,
      });
      setSelectedCoverages([]);
    } catch (error: any) {
      console.error("Error creating bid:", error);
      toast.error(error.message || "Failed to create bid");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create Auto-Purchase Bid</DialogTitle>
          <DialogDescription>
            Compete for exclusive territory rights with competitive bidding
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Competition Alert */}
          {competingInfo && (
            <Alert className={
              competingInfo.isCurrentUserHighest 
                ? "border-blue-500 bg-blue-50" 
                : competingInfo.isWinning 
                  ? "border-green-500 bg-green-50" 
                  : "border-amber-500 bg-amber-50"
            }>
              <TrendingUp className="h-4 w-4" />
              <AlertDescription>
                {competingInfo.isCurrentUserHighest ? (
                  <span className="font-medium text-blue-700">
                    👑 You are the highest bidder at ${competingInfo.highest}!
                  </span>
                ) : competingInfo.isWinning ? (
                  <span className="font-medium text-green-700">
                    🎯 Your bid of ${formData.bid_amount} is winning! (Current highest: ${competingInfo.highestBidder} at ${competingInfo.highest})
                  </span>
                ) : (
                  <span className="font-medium text-amber-700">
                    ⚠️ Highest bidder: {competingInfo.highestBidder} at ${competingInfo.highest}. Bid at least ${competingInfo.suggestedMinimum} to compete.
                  </span>
                )}
              </AlertDescription>
            </Alert>
          )}

          {/* Bid Amount & Monthly Limit */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="bid_amount">
                Bid Amount *
                <span className="text-xs text-muted-foreground ml-2">(Starts at ${packageBasePrice})</span>
              </Label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="bid_amount"
                  type="number"
                  placeholder={packageBasePrice.toString()}
                  value={formData.bid_amount}
                  onChange={(e) => setFormData({ ...formData, bid_amount: e.target.value })}
                  className="pl-9"
                  min={packageBasePrice}
                  step="5"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_leads">
                Max Leads per Month *
              </Label>
              <div className="relative">
                <Target className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  id="max_leads"
                  type="number"
                  placeholder="10"
                  value={formData.max_leads_per_month}
                  onChange={(e) => setFormData({ ...formData, max_leads_per_month: e.target.value })}
                  className="pl-9"
                  min="1"
                  required
                />
              </div>
            </div>
          </div>

          {/* Transaction Requirements */}
          <div className="space-y-2">
            <Label htmlFor="min_transactions">
              Minimum Transactions
            </Label>
            <Input
              id="min_transactions"
              type="number"
              placeholder="0"
              value={formData.min_transactions}
              onChange={(e) => setFormData({ ...formData, min_transactions: e.target.value })}
              min="0"
            />
          </div>

          {/* Coverage Areas */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Select Coverage Areas *</Label>
              {coverages.length === 0 && (
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto p-0"
                  onClick={() => window.location.href = '/market-coverage'}
                >
                  Create Coverage Areas
                </Button>
              )}
            </div>
            
            {coverages.length === 0 ? (
              <div className="text-center py-6 border-2 border-dashed rounded-lg">
                <p className="text-sm text-muted-foreground">
                  No saved coverage areas. Create coverage areas to continue.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto border rounded-lg p-3">
                {coverages.map((coverage) => (
                  <div
                    key={coverage.id}
                    onClick={() => toggleCoverage(coverage.id)}
                    className={`
                      flex items-center justify-between p-3 rounded-md border-2 cursor-pointer transition-all
                      ${selectedCoverages.includes(coverage.id)
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <MapPin className={`h-4 w-4 ${selectedCoverages.includes(coverage.id) ? 'text-primary' : 'text-muted-foreground'}`} />
                        <div>
                          <div className="font-medium text-sm">{coverage.name}</div>
                          <div className="text-xs text-muted-foreground capitalize">
                            {coverage.coverage_type}
                          </div>
                        </div>
                      </div>
                      {highestBids[coverage.id] && (
                        <div className={`text-xs font-medium mt-1 ${
                          highestBids[coverage.id].isCurrentUser ? 'text-blue-600' : 'text-amber-600'
                        }`}>
                          Highest: {highestBids[coverage.id].bidderName} (${highestBids[coverage.id].amount})
                        </div>
                      )}
                    </div>
                    {selectedCoverages.includes(coverage.id) && (
                      <div className="h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <svg className="h-3 w-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Status */}
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="space-y-0.5">
              <Label htmlFor="active">Activate Bid Immediately</Label>
              <p className="text-xs text-muted-foreground">
                Start auto-purchasing recruits as soon as they match your criteria
              </p>
            </div>
            <Switch
              id="active"
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>

          {/* Summary */}
          {(selectedCoverages.length > 0 && formData.bid_amount && formData.max_leads_per_month) && (
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
              <h4 className="font-semibold text-sm mb-2">Bid Summary</h4>
              <div className="space-y-1 text-sm">
                <p>
                  <span className="text-muted-foreground">Price per Recruit:</span>
                  <span className="font-semibold ml-1">${parseFloat(formData.bid_amount).toFixed(2)}</span>
                </p>
                <p>
                  <span className="text-muted-foreground">Monthly Budget:</span> ${parseFloat(formData.bid_amount).toFixed(2)} × {formData.max_leads_per_month} leads = 
                  <span className="font-semibold ml-1">
                    ${(parseFloat(formData.bid_amount) * parseInt(formData.max_leads_per_month)).toFixed(2)}/month max
                  </span>
                </p>
                <p>
                  <span className="text-muted-foreground">Target Areas:</span> {selectedCoverages.length} location{selectedCoverages.length !== 1 ? 's' : ''}
                </p>
                <p className="text-amber-600 font-medium mt-2">
                  🏆 Exclusive Territory Bid - Highest bidder gets exclusive rights
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 justify-end pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || coverages.length === 0}>
              {loading ? "Creating..." : "Create Bid"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
