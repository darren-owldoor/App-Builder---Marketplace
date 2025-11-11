import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Package {
  id: string;
  name: string;
  monthly_cost: number;
}

interface ManualClientCreationProps {
  onSuccess?: () => void;
}

export const ManualClientCreation = ({ onSuccess }: ManualClientCreationProps) => {
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    company_name: "",
    contact_name: "",
    email: "",
    phone: "",
    package_id: "",
    password: "",
    first_name: "",
    last_name: "",
    city: "",
    state: "",
    zip_code: "",
    county: "",
    years_experience: "",
    yearly_sales: "",
  });
  const { toast } = useToast();

  useEffect(() => {
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_packages")
        .select("id, name, monthly_cost")
        .eq("active", true)
        .order("monthly_cost");

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      console.error("Error fetching packages:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.company_name || !formData.email) {
      toast({
        title: "Missing information",
        description: "Company name and email are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Call admin edge function to create client
      const { data, error } = await supabase.functions.invoke("create-client-admin", {
        body: {
          company_name: formData.company_name,
          contact_name: formData.contact_name,
          email: formData.email,
          phone: formData.phone,
          package_id: formData.package_id || null,
          password: formData.password || undefined,
          first_name: formData.first_name || undefined,
          last_name: formData.last_name || undefined,
          cities: formData.city ? [formData.city] : undefined,
          states: formData.state ? [formData.state] : undefined,
          zip_codes: formData.zip_code ? [formData.zip_code] : undefined,
          county: formData.county || undefined,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : undefined,
          yearly_sales: formData.yearly_sales ? parseFloat(formData.yearly_sales) : undefined,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Failed to create client");

      toast({
        title: "Client created successfully",
        description: formData.package_id
          ? "Payment link has been sent to the client"
          : "Client account has been created",
      });

      // Reset form
      setFormData({
        company_name: "",
        contact_name: "",
        email: "",
        phone: "",
        package_id: "",
        password: "",
        first_name: "",
        last_name: "",
        city: "",
        state: "",
        zip_code: "",
        county: "",
        years_experience: "",
        yearly_sales: "",
      });

      // Call success callback to close modal
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error creating client",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="company_name">Company Name *</Label>
          <Input
            id="company_name"
            value={formData.company_name}
            onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
            placeholder="Acme Realty"
            required
          />
        </div>
        <div>
          <Label htmlFor="contact_name">Contact Name</Label>
          <Input
            id="contact_name"
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
            placeholder="John Doe"
          />
        </div>
        <div>
          <Label htmlFor="first_name">First Name</Label>
          <Input
            id="first_name"
            value={formData.first_name}
            onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
            placeholder="John"
          />
        </div>
        <div>
          <Label htmlFor="last_name">Last Name</Label>
          <Input
            id="last_name"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            placeholder="Doe"
          />
        </div>
        <div>
          <Label htmlFor="email">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="john@acmerealty.com"
            required
          />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+1 (555) 000-0000"
          />
        </div>
        <div>
          <Label htmlFor="password">Password (Optional)</Label>
          <Input
            id="password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Leave empty for email invite"
          />
        </div>
        <div>
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            value={formData.city}
            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
            placeholder="San Diego"
          />
        </div>
        <div>
          <Label htmlFor="state">State</Label>
          <Input
            id="state"
            value={formData.state}
            onChange={(e) => setFormData({ ...formData, state: e.target.value })}
            placeholder="CA"
          />
        </div>
        <div>
          <Label htmlFor="zip_code">Zip Code</Label>
          <Input
            id="zip_code"
            value={formData.zip_code}
            onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
            placeholder="92101"
          />
        </div>
        <div>
          <Label htmlFor="county">County</Label>
          <Input
            id="county"
            value={formData.county}
            onChange={(e) => setFormData({ ...formData, county: e.target.value })}
            placeholder="San Diego"
          />
        </div>
        <div>
          <Label htmlFor="years_experience">Years Experience</Label>
          <Input
            id="years_experience"
            type="number"
            value={formData.years_experience}
            onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
            placeholder="15"
          />
        </div>
        <div>
          <Label htmlFor="yearly_sales">Yearly Sales ($)</Label>
          <Input
            id="yearly_sales"
            type="number"
            value={formData.yearly_sales}
            onChange={(e) => setFormData({ ...formData, yearly_sales: e.target.value })}
            placeholder="5000000"
          />
        </div>
        <div className="col-span-2">
          <Label htmlFor="package">Package (Optional)</Label>
          <Select
            value={formData.package_id}
            onValueChange={(value) => setFormData({ ...formData, package_id: value })}
          >
            <SelectTrigger id="package">
              <SelectValue placeholder="Select a package (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">No Package</SelectItem>
              {packages.map((pkg) => (
                <SelectItem key={pkg.id} value={pkg.id}>
                  {pkg.name} - ${pkg.monthly_cost}/month
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formData.package_id && (
            <p className="text-xs text-muted-foreground mt-1">
              A payment link will be automatically created and sent to the client
            </p>
          )}
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Creating Client..." : "Create Client"}
      </Button>
    </form>
  );
};