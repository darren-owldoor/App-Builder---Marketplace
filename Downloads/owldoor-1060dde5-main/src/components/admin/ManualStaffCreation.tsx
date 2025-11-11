import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ManualStaffCreationProps {
  onSuccess?: () => void;
}

export const ManualStaffCreation = ({ onSuccess }: ManualStaffCreationProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    password: "",
    company: "",
    role: "staff",
    user_type: "staff" as "staff" | "client",
  });
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.first_name || !formData.last_name || !formData.email) {
      toast({
        title: "Missing information",
        description: "First name, last name, and email are required",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const functionName = formData.user_type === "client" ? "create-client-admin" : "create-staff-admin";
      const body = formData.user_type === "client" 
        ? {
            company_name: formData.company || `${formData.first_name} ${formData.last_name}`,
            contact_name: `${formData.first_name} ${formData.last_name}`,
            email: formData.email,
            password: formData.password || undefined,
            first_name: formData.first_name,
            last_name: formData.last_name,
          }
        : {
            first_name: formData.first_name,
            last_name: formData.last_name,
            email: formData.email,
            password: formData.password || undefined,
            company: formData.company || undefined,
            role: formData.role,
          };

      const { data, error } = await supabase.functions.invoke(functionName, { body });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || `Failed to create ${formData.user_type} user`);

      const userTypeLabel = formData.user_type === "client" ? "Client" : (formData.role === 'admin' ? 'Admin' : 'Staff');
      toast({
        title: "User created successfully",
        description: `${formData.first_name} ${formData.last_name} has been added as ${userTypeLabel}`,
      });

      // Reset form
      setFormData({
        first_name: "",
        last_name: "",
        email: "",
        password: "",
        company: "",
        role: "staff",
        user_type: "staff",
      });

      // Call success callback to close modal
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Error creating staff user",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserPlus className="h-5 w-5" />
          Create User
        </CardTitle>
        <CardDescription>
          Add a new staff, admin, or client user to the system
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="user_type">User Type</Label>
            <Select
              value={formData.user_type}
              onValueChange={(value: "staff" | "client") => setFormData({ ...formData, user_type: value })}
            >
              <SelectTrigger id="user_type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="staff">Staff/Admin</SelectItem>
                <SelectItem value="client">Client/Brokerage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="first_name">First Name *</Label>
              <Input
                id="first_name"
                value={formData.first_name}
                onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                placeholder="Jim"
                required
              />
            </div>
            <div>
              <Label htmlFor="last_name">Last Name *</Label>
              <Input
                id="last_name"
                value={formData.last_name}
                onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                placeholder="Black"
                required
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="jim@revestloans.com"
                required
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
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                placeholder="Revest Loans"
              />
            </div>
            {formData.user_type === "staff" && (
              <div>
                <Label htmlFor="role">Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                >
                  <SelectTrigger id="role">
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="staff">Staff</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Creating User..." : `Create ${formData.user_type === "client" ? "Client" : (formData.role === "admin" ? "Admin" : "Staff")}`}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};
