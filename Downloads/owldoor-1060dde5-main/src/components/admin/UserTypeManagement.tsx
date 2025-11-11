import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Shield, Plus, Edit2, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface UserRole {
  id: string;
  role: string;
  user_count: number;
}

export const UserTypeManagement = () => {
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [newRole, setNewRole] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchRoles();
  }, []);

  const fetchRoles = async () => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role, user_id")
        .order("role");

      if (error) throw error;

      // Count users per role
      const roleCounts = data?.reduce((acc: any, curr) => {
        const role = curr.role;
        acc[role] = (acc[role] || 0) + 1;
        return acc;
      }, {});

      const uniqueRoles = Object.keys(roleCounts || {}).map((role, index) => ({
        id: `${role}-${index}`,
        role,
        user_count: roleCounts[role],
      }));

      setRoles(uniqueRoles);
    } catch (error: any) {
      toast({
        title: "Error fetching roles",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddRole = async () => {
    if (!newRole.trim()) {
      toast({
        title: "Invalid role",
        description: "Please enter a role name",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Not implemented",
      description: "Adding new role types requires database migration. Contact system administrator.",
    });
    
    setIsDialogOpen(false);
    setNewRole("");
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              User Type Management
            </CardTitle>
            <CardDescription>
              Manage user roles and permissions
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add Role Type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Role Type</DialogTitle>
                <DialogDescription>
                  Create a new user role. This requires database changes.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="role-name">Role Name</Label>
                  <Input
                    id="role-name"
                    placeholder="e.g., manager, viewer"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  />
                </div>
                <Button onClick={handleAddRole} className="w-full">
                  Create Role
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {roles.map((role) => (
            <div
              key={role.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <Shield className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="font-medium capitalize">{role.role}</p>
                  <p className="text-sm text-muted-foreground">
                    {role.user_count} user{role.user_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" disabled>
                  <Edit2 className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" disabled>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};