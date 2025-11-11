import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Copy, Package } from "lucide-react";

interface CustomPackageModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientId: string;
  clientName: string;
  onSuccess?: () => void;
}

export default function CustomPackageModal({ isOpen, onClose, clientId, clientName, onSuccess }: CustomPackageModalProps) {
  const [loading, setLoading] = useState(false);
  const [packageUrl, setPackageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: `Custom Package - ${clientName}`,
    description: "",
    price_per_lead: 50,
    monthly_cost: 0,
    setup_fee: 0,
    transaction_minimum: 0,
    leads_per_month: 0,
    package_type: "non_exclusive",
  });
  
  // Location filter state
  const [zipRadiusEntries, setZipRadiusEntries] = useState<Array<{zip: string, radius: string}>>([{zip: "", radius: ""}]);
  const [cityStateEntries, setCityStateEntries] = useState<Array<{city: string, state: string}>>([{city: "", state: ""}]);
  const [countyStateEntries, setCountyStateEntries] = useState<Array<{county: string, state: string}>>([{county: "", state: ""}]);
  
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen) {
      fetchExistingPackage();
    }
  }, [isOpen, clientId]);

  const fetchExistingPackage = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_packages")
        .select("*")
        .eq("client_id", clientId)
        .eq("is_custom", true)
        .single();

      if (data) {
        setFormData({
          name: data.name,
          description: data.description || "",
          price_per_lead: data.price_per_lead,
          monthly_cost: data.monthly_cost,
          setup_fee: data.setup_fee || 0,
          transaction_minimum: data.transaction_minimum || 0,
          leads_per_month: data.leads_per_month,
          package_type: data.package_type || "non_exclusive",
        });
        
        // Parse existing location filter
        if (data.location_filter) {
          const filter = data.location_filter as any;
          
          if (filter.zip_radius) {
            setZipRadiusEntries(filter.zip_radius.map((zr: any) => ({
              zip: zr.zip || "",
              radius: zr.radius?.toString() || ""
            })));
          }
          
          if (filter.city_state) {
            setCityStateEntries(filter.city_state.map((cs: any) => ({
              city: cs.city || "",
              state: cs.state || ""
            })));
          }
          
          if (filter.county_state) {
            setCountyStateEntries(filter.county_state.map((cs: any) => ({
              county: cs.county || "",
              state: cs.state || ""
            })));
          }
        }

        // Get access token
        const { data: clientData } = await supabase
          .from("clients")
          .select("package_access_token")
          .eq("id", clientId)
          .single();

        if (clientData?.package_access_token) {
          const url = `${window.location.origin}/package/${clientData.package_access_token}`;
          setPackageUrl(url);
        }
      }
    } catch (error) {
      console.error("Error fetching package:", error);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Build location filter from structured inputs
      let locationFilterJson = null;
      
      const zipRadius = zipRadiusEntries.filter(e => e.zip && e.radius).map(e => ({
        zip: e.zip,
        radius: parseFloat(e.radius)
      }));
      
      const cityState = cityStateEntries.filter(e => e.city && e.state).map(e => ({
        city: e.city,
        state: e.state
      }));
      
      const countyState = countyStateEntries.filter(e => e.county && e.state).map(e => ({
        county: e.county,
        state: e.state
      }));
      
      if (zipRadius.length > 0 || cityState.length > 0 || countyState.length > 0) {
        locationFilterJson = {};
        if (zipRadius.length > 0) locationFilterJson.zip_radius = zipRadius;
        if (cityState.length > 0) locationFilterJson.city_state = cityState;
        if (countyState.length > 0) locationFilterJson.county_state = countyState;
      }

      // Check if package exists
      const { data: existingPackage } = await supabase
        .from("pricing_packages")
        .select("id")
        .eq("client_id", clientId)
        .eq("is_custom", true)
        .single();

      const packageData = {
        name: formData.name,
        description: formData.description,
        price_per_lead: formData.price_per_lead,
        monthly_cost: formData.monthly_cost,
        setup_fee: formData.setup_fee,
        transaction_minimum: formData.transaction_minimum,
        location_filter: locationFilterJson,
        leads_per_month: formData.leads_per_month,
        package_type: formData.package_type,
        client_id: clientId,
        is_custom: true,
        active: true,
        credits_included: 0,
        ai_usage_price: 0,
        sms_price_per_additional: 0,
        sms_included: 0,
        includes_twilio_number: false,
      };

      let packageId: string;

      if (existingPackage) {
        // Update existing
        const { error } = await supabase
          .from("pricing_packages")
          .update(packageData)
          .eq("id", existingPackage.id);

        if (error) throw error;
        packageId = existingPackage.id;
        toast({ title: "Custom package updated" });
      } else {
        // Create new
        const { data: newPackage, error } = await supabase
          .from("pricing_packages")
          .insert(packageData)
          .select()
          .single();

        if (error) throw error;
        packageId = newPackage.id;
        toast({ title: "Custom package created" });
      }

      // Generate access token if doesn't exist
      const { data: clientData } = await supabase
        .from("clients")
        .select("package_access_token")
        .eq("id", clientId)
        .single();

      let accessToken = clientData?.package_access_token;
      
      if (!accessToken) {
        const { data: tokenData, error: tokenError } = await supabase
          .rpc('generate_package_access_token');

        if (tokenError) throw tokenError;
        accessToken = tokenData;

        const { error: updateError } = await supabase
          .from("clients")
          .update({ 
            package_access_token: accessToken,
            custom_package_id: packageId,
            setup_fee: formData.setup_fee
          })
          .eq("id", clientId);

        if (updateError) throw updateError;
      } else {
        // Just update the package reference
        const { error: updateError } = await supabase
          .from("clients")
          .update({ 
            custom_package_id: packageId,
            setup_fee: formData.setup_fee
          })
          .eq("id", clientId);

        if (updateError) throw updateError;
      }

      const url = `${window.location.origin}/package/${accessToken}`;
      setPackageUrl(url);
      
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error saving package",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    if (packageUrl) {
      navigator.clipboard.writeText(packageUrl);
      toast({ title: "Link copied to clipboard" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            Custom Package for {clientName}
          </DialogTitle>
          <DialogDescription>
            Create a custom pricing package with unique terms for this client
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="name">Package Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Package details and terms..."
              />
            </div>

            <div>
              <Label htmlFor="price_per_lead">Price Per Lead ($)</Label>
              <Input
                id="price_per_lead"
                type="number"
                step="0.01"
                value={formData.price_per_lead}
                onChange={(e) => setFormData({ ...formData, price_per_lead: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="monthly_cost">Monthly Fee ($)</Label>
              <Input
                id="monthly_cost"
                type="number"
                step="0.01"
                value={formData.monthly_cost}
                onChange={(e) => setFormData({ ...formData, monthly_cost: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="setup_fee">Setup Fee ($)</Label>
              <Input
                id="setup_fee"
                type="number"
                step="0.01"
                value={formData.setup_fee}
                onChange={(e) => setFormData({ ...formData, setup_fee: parseFloat(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="transaction_minimum">Minimum Transactions</Label>
              <Input
                id="transaction_minimum"
                type="number"
                value={formData.transaction_minimum}
                onChange={(e) => setFormData({ ...formData, transaction_minimum: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="leads_per_month">Leads Per Month</Label>
              <Input
                id="leads_per_month"
                type="number"
                value={formData.leads_per_month}
                onChange={(e) => setFormData({ ...formData, leads_per_month: parseInt(e.target.value) })}
              />
            </div>

            <div>
              <Label htmlFor="package_type">Package Type</Label>
              <select
                id="package_type"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={formData.package_type}
                onChange={(e) => setFormData({ ...formData, package_type: e.target.value })}
              >
                <option value="exclusive">Exclusive</option>
                <option value="non_exclusive">Non-Exclusive</option>
              </select>
            </div>

            <div className="col-span-2 space-y-4">
              <Label>Location Restrictions</Label>
              
              {/* Zip + Radius */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Zip Code + Radius (miles)</Label>
                {zipRadiusEntries.map((entry, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Zip Code"
                      value={entry.zip}
                      onChange={(e) => {
                        const updated = [...zipRadiusEntries];
                        updated[index].zip = e.target.value;
                        setZipRadiusEntries(updated);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="Radius"
                      type="number"
                      value={entry.radius}
                      onChange={(e) => {
                        const updated = [...zipRadiusEntries];
                        updated[index].radius = e.target.value;
                        setZipRadiusEntries(updated);
                      }}
                      className="w-24"
                    />
                    {index > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setZipRadiusEntries(zipRadiusEntries.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setZipRadiusEntries([...zipRadiusEntries, {zip: "", radius: ""}])}
                >
                  + Add Zip+Radius
                </Button>
              </div>

              {/* Cities + State */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Cities + State</Label>
                {cityStateEntries.map((entry, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="City"
                      value={entry.city}
                      onChange={(e) => {
                        const updated = [...cityStateEntries];
                        updated[index].city = e.target.value;
                        setCityStateEntries(updated);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="State (e.g., CA)"
                      value={entry.state}
                      onChange={(e) => {
                        const updated = [...cityStateEntries];
                        updated[index].state = e.target.value;
                        setCityStateEntries(updated);
                      }}
                      className="w-32"
                    />
                    {index > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCityStateEntries(cityStateEntries.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCityStateEntries([...cityStateEntries, {city: "", state: ""}])}
                >
                  + Add City+State
                </Button>
              </div>

              {/* Counties + State */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Counties + State</Label>
                {countyStateEntries.map((entry, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="County"
                      value={entry.county}
                      onChange={(e) => {
                        const updated = [...countyStateEntries];
                        updated[index].county = e.target.value;
                        setCountyStateEntries(updated);
                      }}
                      className="flex-1"
                    />
                    <Input
                      placeholder="State (e.g., CA)"
                      value={entry.state}
                      onChange={(e) => {
                        const updated = [...countyStateEntries];
                        updated[index].state = e.target.value;
                        setCountyStateEntries(updated);
                      }}
                      className="w-32"
                    />
                    {index > 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCountyStateEntries(countyStateEntries.filter((_, i) => i !== index))}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCountyStateEntries([...countyStateEntries, {county: "", state: ""}])}
                >
                  + Add County+State
                </Button>
              </div>
            </div>
          </div>

          {packageUrl && (
            <div className="p-4 bg-muted rounded-lg space-y-2">
              <Label>Custom Package Link</Label>
              <div className="flex gap-2">
                <Input value={packageUrl} readOnly className="font-mono text-sm" />
                <Button size="sm" variant="outline" onClick={copyToClipboard}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Share this link with the client to view their custom package
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button onClick={handleSubmit} className="flex-1" disabled={loading}>
              {loading ? "Saving..." : packageUrl ? "Update Package" : "Create Package & Generate Link"}
            </Button>
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
