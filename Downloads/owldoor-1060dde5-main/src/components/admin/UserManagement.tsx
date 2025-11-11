import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { UserPlus, Users, Building2, Target, UserCog, CreditCard, Edit, Search, Trash2, DollarSign, Eye } from "lucide-react";
import { useNavigate } from "react-router-dom";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UserWithRole {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  created_at: string;
  active: boolean;
}

const UserManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [packages, setPackages] = useState<any[]>([]);
  const [clients, setClients] = useState<Map<string, any>>(new Map());
  const [editingCredits, setEditingCredits] = useState<string | null>(null);
  const [creditAmount, setCreditAmount] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<UserWithRole | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [editFormData, setEditFormData] = useState<any>({});
  const [accountTypeDialogOpen, setAccountTypeDialogOpen] = useState(false);
  const [changingAccountType, setChangingAccountType] = useState<UserWithRole | null>(null);
  const [newAccountRole, setNewAccountRole] = useState<"lead" | "client">("lead");
  const [newProType, setNewProType] = useState<"real_estate_agent" | "mortgage_officer">("real_estate_agent");
  const [newClientType, setNewClientType] = useState<"real_estate" | "mortgage">("real_estate");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    fetchUsers();
    fetchPackages();
  }, []);

  const fetchPackages = async () => {
    try {
      const { data, error } = await supabase
        .from("pricing_packages")
        .select("*")
        .eq("active", true)
        .order("monthly_cost");

      if (error) throw error;
      setPackages(data || []);
    } catch (error: any) {
      console.error("Failed to fetch packages:", error);
    }
  };

  const fetchUsers = async () => {
    try {
      console.log("Fetching users...");
      
      // First get all profiles
      const { data: profilesData, error: profilesError } = await supabase
        .from("profiles")
        .select("id, email, full_name, created_at, active")
        .order("created_at", { ascending: false });

      console.log("Profiles query result:", { profilesData, profilesError });
      
      if (profilesError) {
        console.error("Profiles error:", profilesError);
        throw profilesError;
      }

      // Then get all user roles
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("user_id, role");

      console.log("Roles query result:", { rolesData, rolesError });
      
      if (rolesError) {
        console.error("Roles error:", rolesError);
        throw rolesError;
      }

      // Get all clients data for users with client role
      const { data: clientsData } = await supabase
        .from("clients")
        .select(`
          user_id,
          id,
          credits_balance,
          credits_used,
          current_package_id,
          pricing_packages (
            name
          )
        `);

      const clientsMap = new Map();
      clientsData?.forEach((client: any) => {
        clientsMap.set(client.user_id, client);
      });
      setClients(clientsMap);

      // Combine the data
      const formattedUsers = profilesData?.map((profile: any) => {
        const userRole = rolesData?.find((r: any) => r.user_id === profile.id);
        return {
          id: profile.id,
          email: profile.email,
          full_name: profile.full_name,
          role: userRole?.role || "lead",
          created_at: profile.created_at,
          active: profile.active ?? true,
        };
      });

      console.log("Formatted users:", formattedUsers);
      console.log("Total users:", formattedUsers?.length);
      
      setUsers(formattedUsers || []);
    } catch (error: any) {
      console.error("Fetch users error:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const changeUserRole = async (userId: string, newRole: string) => {
    try {
      // Delete existing role
      const { error: deleteError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      if (deleteError) throw deleteError;

      // Insert new role
      const { error: insertError } = await supabase
        .from("user_roles")
        .insert([{ 
          user_id: userId, 
          role: newRole as "admin" | "staff" | "client" | "lead"
        }]);

      if (insertError) throw insertError;

      toast({
        title: "Role updated",
        description: `User role changed to ${newRole}`,
      });

      // Refresh the users list
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const assignPackage = async (userId: string, packageId: string) => {
    try {
      const clientData = clients.get(userId);
      if (!clientData) {
        toast({
          title: "Error",
          description: "Client record not found",
          variant: "destructive",
        });
        return;
      }

      const { error } = await supabase
        .from("clients")
        .update({ current_package_id: packageId })
        .eq("id", clientData.id);

      if (error) throw error;

      toast({
        title: "Package assigned",
        description: "Package successfully assigned to client",
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleAddCredits = async () => {
    if (!editingCredits || !creditAmount) return;

    try {
      const clientData = clients.get(editingCredits);
      if (!clientData) return;

      const amount = parseInt(creditAmount);
      const newBalance = (clientData.credits_balance || 0) + amount;

      const { error } = await supabase
        .from("clients")
        .update({ credits_balance: newBalance })
        .eq("id", clientData.id);

      if (error) throw error;

      toast({
        title: "Credits added",
        description: `Added ${amount} credits to client account`,
      });

      setEditingCredits(null);
      setCreditAmount("");
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleViewClientDetails = (userId: string) => {
    const clientData = clients.get(userId);
    if (clientData) {
      navigate(`/admin/client/${clientData.id}`);
    }
  };

  const toggleUserActive = async (userId: string, currentActive: boolean) => {
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ active: !currentActive })
        .eq("id", userId);

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `User account ${!currentActive ? "activated" : "deactivated"}`,
      });

      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleOpenEditDialog = async (user: UserWithRole) => {
    try {
      // Fetch profile data
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profileError) throw profileError;

      let additionalData: any = {};

      // Fetch role-specific data
      if (user.role === "client") {
        const { data: clientData } = await supabase
          .from("clients")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        additionalData = clientData || {};
      } else if (user.role === "lead") {
        const { data: leadData } = await supabase
          .from("pros")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();
        
        additionalData = leadData || {};
      }

      setEditingUser({ ...user, ...profileData });
      setEditFormData({ ...profileData, ...additionalData });
      setEditDialogOpen(true);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleSaveEditedUser = async () => {
    if (!editingUser) return;

    try {
      // Generate full_name from first_name and last_name
      const fullName = `${(editFormData.first_name || '').trim()} ${(editFormData.last_name || '').trim()}`.trim();
      
      // Update profile
      const { error: profileError } = await supabase
        .from("profiles")
        .update({
          first_name: editFormData.first_name,
          last_name: editFormData.last_name,
          full_name: fullName,
          email: editFormData.email,
          phone: editFormData.phone,
          company_name: editFormData.company_name,
        })
        .eq("id", editingUser.id);

      if (profileError) throw profileError;

      // Update role-specific data
      if (editingUser.role === "client") {
        const clientData = clients.get(editingUser.id);
        if (clientData) {
          const { error: clientError } = await supabase
            .from("clients")
            .update({
              contact_name: editFormData.contact_name || fullName,
              company_name: editFormData.company_name,
              email: editFormData.email,
              phone: editFormData.phone,
              first_name: editFormData.first_name,
              last_name: editFormData.last_name,
            })
            .eq("id", clientData.id);

          if (clientError) throw clientError;
        }
      } else if (editingUser.role === "lead" && editFormData.id) {
        const { error: leadError } = await supabase
          .from("pros")
          .update({
            full_name: fullName,
            first_name: editFormData.first_name,
            last_name: editFormData.last_name,
            email: editFormData.email,
            phone: editFormData.phone,
          })
          .eq("user_id", editingUser.id);

        if (leadError) throw leadError;
      }

      toast({
        title: "Success",
        description: "User information updated successfully",
      });

      setEditDialogOpen(false);
      setEditingUser(null);
      setEditFormData({});
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };


  const handleOpenAccountTypeDialog = async (user: UserWithRole) => {
    setChangingAccountType(user);
    setNewAccountRole(user.role === "client" ? "client" : "lead");
    
    // Fetch current pro_type if it's a pro/lead
    if (user.role === "lead") {
      try {
        const { data } = await supabase
          .from("pros")
          .select("pro_type")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data?.pro_type) {
          setNewProType(data.pro_type as "real_estate_agent" | "mortgage_officer");
        }
      } catch (error) {
        console.error("Error fetching pro type:", error);
      }
    }
    
    // Fetch current client_type if it's a client
    if (user.role === "client") {
      try {
        const { data } = await supabase
          .from("clients")
          .select("client_type")
          .eq("user_id", user.id)
          .maybeSingle();
        
        if (data?.client_type) {
          setNewClientType(data.client_type as "real_estate" | "mortgage");
        }
      } catch (error) {
        console.error("Error fetching client type:", error);
      }
    }
    
    setAccountTypeDialogOpen(true);
  };

  const handleChangeAccountType = async () => {
    if (!changingAccountType) return;

    try {
      const userId = changingAccountType.id;

      // First, delete the old role
      const { error: deleteRoleError } = await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId)
        .in("role", ["lead", "client"]);

      if (deleteRoleError) throw deleteRoleError;

      // Add the new role
      const { error: addRoleError } = await supabase
        .from("user_roles")
        .insert({
          user_id: userId,
          role: newAccountRole,
        });

      if (addRoleError) throw addRoleError;

      // Update pro_type if changing to/from lead
      if (newAccountRole === "lead") {
        // Ensure pros record exists and update pro_type
        const { data: existingPro } = await supabase
          .from("pros")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingPro) {
          // Update existing pro record
          const { error: updateProError } = await supabase
            .from("pros")
            .update({ pro_type: newProType })
            .eq("user_id", userId);

          if (updateProError) throw updateProError;
        } else {
          // Create new pro record if it doesn't exist
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (profileData) {
            const { error: createProError } = await supabase
              .from("pros")
              .insert({
                user_id: userId,
                email: profileData.email || "",
                phone: profileData.phone || "",
                full_name: `${(profileData.first_name || '').trim()} ${(profileData.last_name || '').trim()}`.trim() || profileData.full_name || "",
                first_name: profileData.first_name || "",
                last_name: profileData.last_name || "",
                pro_type: newProType,
                status: "new",
                pipeline_stage: "new",
                pipeline_type: "agent",
              });

            if (createProError) throw createProError;
          }
        }
      } else if (newAccountRole === "client") {
        // Ensure clients record exists and update client_type
        const { data: existingClient } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", userId)
          .maybeSingle();

        if (existingClient) {
          // Update existing client record
          const { error: updateClientError } = await supabase
            .from("clients")
            .update({ client_type: newClientType })
            .eq("user_id", userId);

          if (updateClientError) throw updateClientError;
        } else {
          // Create new client record if it doesn't exist
          const { data: profileData } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", userId)
            .single();

          if (profileData) {
            const { error: createClientError } = await supabase
              .from("clients")
              .insert({
                user_id: userId,
                email: profileData.email || "",
                phone: profileData.phone,
                company_name: profileData.company_name || "Unknown Company",
                contact_name: `${(profileData.first_name || '').trim()} ${(profileData.last_name || '').trim()}`.trim() || profileData.full_name || "",
                first_name: profileData.first_name,
                last_name: profileData.last_name,
                client_type: newClientType,
              });

            if (createClientError) throw createClientError;
          }
        }
      }

      toast({
        title: "Account type updated",
        description: `User account has been changed to ${newAccountRole}${
          newAccountRole === "lead" ? ` (${newProType.replace("_", " ")})` : 
          ` (${newClientType.replace("_", " ")})`
        }`,
      });

      setAccountTypeDialogOpen(false);
      setChangingAccountType(null);
      fetchUsers();
    } catch (error: any) {
      console.error("Error changing account type:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;

    try {
      const { error } = await supabase.functions.invoke('admin-user-operations', {
        body: { 
          action: 'deleteUser',
          userId: userToDelete.id
        }
      });

      if (error) throw error;

      toast({
        title: "User deleted",
        description: `User ${userToDelete.email} has been deleted`,
      });

      setDeleteDialogOpen(false);
      setUserToDelete(null);
      fetchUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLoginAs = async (userId: string, userEmail: string) => {
    try {
      // Get user roles first to determine redirect
      const { data: rolesData, error: rolesError } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);

      if (rolesError) throw rolesError;

      const roles = rolesData?.map(r => r.role) || [];
      
      // Generate magic link via edge function
      const { data, error } = await supabase.functions.invoke('admin-user-operations', {
        body: { 
          action: 'generateMagicLink',
          email: userEmail
        }
      });

      if (error) throw error;
      
      if (data?.data?.properties?.hashed_token) {
        // Sign out current admin session
        await supabase.auth.signOut();
        
        // Sign in with the generated token
        const { error: signInError } = await supabase.auth.verifyOtp({
          token_hash: data.data.properties.hashed_token,
          type: 'magiclink',
        });

        if (signInError) throw signInError;

        toast({
          title: "Success",
          description: `Logged in as ${userEmail}`,
        });

        // Determine redirect based on role priority: admin > staff > client > agent/lead
        let redirectPath = "/";
        if (roles.includes("admin" as any)) {
          redirectPath = "/admin";
        } else if (roles.includes("staff" as any)) {
          redirectPath = "/staff";
        } else if (roles.includes("client" as any)) {
          redirectPath = "/client";
        } else if (roles.includes("agent" as any) || roles.includes("lead" as any)) {
          redirectPath = "/lead";
        }

        // Wait a moment for auth to process, then navigate
        setTimeout(() => {
          window.location.href = redirectPath;
        }, 1000);
      }
    } catch (error: any) {
      console.error("Login as error:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to login as user",
        variant: "destructive",
      });
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "admin":
        return <UserPlus className="h-4 w-4" />;
      case "staff":
        return <Users className="h-4 w-4" />;
      case "client":
        return <Building2 className="h-4 w-4" />;
      case "lead":
        return <Target className="h-4 w-4" />;
      default:
        return <Users className="h-4 w-4" />;
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "admin":
        return "bg-destructive text-destructive-foreground";
      case "staff":
        return "bg-primary text-primary-foreground";
      case "client":
        return "bg-secondary text-secondary-foreground";
      case "lead":
        return "bg-accent text-accent-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredUsers = users
    .filter((u) => filterRole === "all" || u.role === filterRole)
    .filter((u) => 
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, searchTerm]);

  const userStats = {
    total: users.length,
    admin: users.filter((u) => u.role === "admin").length,
    staff: users.filter((u) => u.role === "staff").length,
    clients: users.filter((u) => u.role === "client").length,
    leads: users.filter((u) => u.role === "lead").length,
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Admins</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.admin}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Staff</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.staff}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Clients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.clients}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Agents</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userStats.leads}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage all system users</CardDescription>
            </div>
            <div className="flex gap-2 items-center">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterRole} onValueChange={setFilterRole}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter by role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="staff">Staff</SelectItem>
                  <SelectItem value="client">Client</SelectItem>
                  <SelectItem value="lead">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading users...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No users found for this filter
            </div>
          ) : (
            <>
              <div className="space-y-4">
                {paginatedUsers.map((user) => {
                  const clientData = clients.get(user.id);
                  const isClient = user.role === "client";
                  
                  return (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 border border-border rounded-lg hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center gap-2">
                          {getRoleIcon(user.role)}
                          <div className="min-w-0">
                            <p className="font-medium truncate">{user.full_name || 'No name set'}</p>
                            <p className="text-sm text-muted-foreground truncate">{user.email}</p>
                            {user.role === "client" && clientData && (
                              <p className="text-xs text-muted-foreground">
                                ${(clientData.credits_balance || 0).toFixed(2)} credits | Package: {clientData.pricing_packages?.name || 'None'}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <Badge className={getRoleBadgeColor(user.role)}>
                          {user.role}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-2 mr-4">
                          <Switch
                            checked={user.active}
                            onCheckedChange={() => toggleUserActive(user.id, user.active)}
                          />
                          <span className="text-xs text-muted-foreground">
                            {user.active ? 'Active' : 'Inactive'}
                          </span>
                        </div>

                        {isClient && clientData && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewClientDetails(user.id)}
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              View
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setEditingCredits(user.id)}
                            >
                              <DollarSign className="h-4 w-4 mr-1" />
                              Credits
                            </Button>
                            <Select
                              value={clientData.current_package_id || ""}
                              onValueChange={(value) => assignPackage(user.id, value)}
                            >
                              <SelectTrigger className="w-[120px] h-8">
                                <SelectValue placeholder="Package" />
                              </SelectTrigger>
                              <SelectContent>
                                {packages.map((pkg) => (
                                  <SelectItem key={pkg.id} value={pkg.id}>
                                    {pkg.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </>
                        )}

                        <Select
                          value={user.role}
                          onValueChange={(value) => changeUserRole(user.id, value)}
                        >
                          <SelectTrigger className="w-[100px] h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="admin">Admin</SelectItem>
                            <SelectItem value="staff">Staff</SelectItem>
                            <SelectItem value="client">Client</SelectItem>
                            <SelectItem value="lead">Agent</SelectItem>
                          </SelectContent>
                        </Select>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenEditDialog(user)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleOpenAccountTypeDialog(user)}
                        >
                          <UserCog className="h-4 w-4" />
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleLoginAs(user.id, user.email)}
                        >
                          Login As
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pagination Controls */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between border-t pt-4">
                  <div className="text-sm text-muted-foreground">
                    Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      Previous
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                          pageNum = i + 1;
                        } else if (currentPage <= 3) {
                          pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNum = totalPages - 4 + i;
                        } else {
                          pageNum = currentPage - 2 + i;
                        }
                        return (
                          <Button
                            key={pageNum}
                            variant={currentPage === pageNum ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentPage(pageNum)}
                            className="w-10"
                          >
                            {pageNum}
                          </Button>
                        );
                      })}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Add Credits Dialog */}
      <Dialog open={!!editingCredits} onOpenChange={() => setEditingCredits(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Credits</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="credits">Credit Amount</Label>
              <Input
                id="credits"
                type="number"
                min="0"
                value={creditAmount}
                onChange={(e) => setCreditAmount(e.target.value)}
                placeholder="Enter amount to add"
                className="mt-1.5"
              />
            </div>
            {editingCredits && clients.get(editingCredits) && (
              <div className="text-sm text-muted-foreground">
                Current balance: {clients.get(editingCredits).credits_balance || 0} credits
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingCredits(null)}>
              Cancel
            </Button>
            <Button onClick={handleAddCredits}>
              Add Credits
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {userToDelete?.email}? This action cannot be undone and will permanently remove the user and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setUserToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete User
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Edit All Fields Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit User - {editingUser?.email}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-first-name">First Name</Label>
                <Input
                  id="edit-first-name"
                  value={editFormData.first_name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="edit-last-name">Last Name</Label>
                <Input
                  id="edit-last-name"
                  value={editFormData.last_name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                />
              </div>
            </div>
            
            <div>
              <Label htmlFor="edit-full-name">Full Name</Label>
              <Input
                id="edit-full-name"
                value={editFormData.full_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, full_name: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                autoComplete="email"
                value={editFormData.email || ""}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                type="tel"
                value={editFormData.phone || ""}
                onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="edit-company-name">Company Name</Label>
              <Input
                id="edit-company-name"
                value={editFormData.company_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, company_name: e.target.value })}
              />
            </div>

            {editingUser?.role === "client" && (
              <div>
                <Label htmlFor="edit-contact-name">Contact Name</Label>
                <Input
                  id="edit-contact-name"
                  value={editFormData.contact_name || ""}
                  onChange={(e) => setEditFormData({ ...editFormData, contact_name: e.target.value })}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEditDialogOpen(false);
              setEditingUser(null);
              setEditFormData({});
            }}>
              Cancel
            </Button>
            <Button onClick={handleSaveEditedUser}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Account Type Change Dialog */}
      <Dialog open={accountTypeDialogOpen} onOpenChange={setAccountTypeDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Change Account Type</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div>
              <Label className="text-base font-semibold mb-3 block">Account Role</Label>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant={newAccountRole === "lead" ? "default" : "outline"}
                  className="h-20 flex-col gap-2"
                  onClick={() => setNewAccountRole("lead")}
                >
                  <Target className="h-6 w-6" />
                  <span>Professional (Pro)</span>
                </Button>
                <Button
                  type="button"
                  variant={newAccountRole === "client" ? "default" : "outline"}
                  className="h-20 flex-col gap-2"
                  onClick={() => setNewAccountRole("client")}
                >
                  <Building2 className="h-6 w-6" />
                  <span>Brokerage (Client)</span>
                </Button>
              </div>
            </div>

            {newAccountRole === "lead" && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Professional Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={newProType === "real_estate_agent" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setNewProType("real_estate_agent")}
                  >
                    <Building2 className="h-6 w-6" />
                    <span>Real Estate Agent</span>
                  </Button>
                  <Button
                    type="button"
                    variant={newProType === "mortgage_officer" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setNewProType("mortgage_officer")}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span>Loan Officer</span>
                  </Button>
                </div>
              </div>
            )}

            {newAccountRole === "client" && (
              <div>
                <Label className="text-base font-semibold mb-3 block">Business Type</Label>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant={newClientType === "real_estate" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setNewClientType("real_estate")}
                  >
                    <Building2 className="h-6 w-6" />
                    <span>Real Estate Brokerage</span>
                  </Button>
                  <Button
                    type="button"
                    variant={newClientType === "mortgage" ? "default" : "outline"}
                    className="h-20 flex-col gap-2"
                    onClick={() => setNewClientType("mortgage")}
                  >
                    <DollarSign className="h-6 w-6" />
                    <span>Mortgage Lender</span>
                  </Button>
                </div>
              </div>
            )}

            <div className="bg-muted/50 p-4 rounded-lg">
              <p className="text-sm text-muted-foreground">
                <strong>Note:</strong> This will change the user's account type and create/update the necessary records. 
                {newAccountRole === "lead" && " The professional type determines what kind of opportunities they'll see."}
                {newAccountRole === "client" && " The business type determines what kind of professionals they'll be matched with."}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setAccountTypeDialogOpen(false);
                setChangingAccountType(null);
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleChangeAccountType}>
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="border-warning/50 bg-warning/5">
        <CardHeader>
          <CardTitle className="text-warning flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Test User Credentials
          </CardTitle>
          <CardDescription>
            Use these credentials to test different user roles
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Admin Access:</h4>
              <div className="bg-card p-3 rounded border">
                <p className="text-sm">
                  <span className="font-mono">darren@owldoor.com</span>
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Full system access
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Staff Access:</h4>
              <div className="bg-card p-3 rounded border">
                <p className="text-sm">
                  Create via signup with role "Staff Member"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Manage leads and clients
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Client/Brokerage Access:</h4>
              <div className="bg-card p-3 rounded border">
                <p className="text-sm">
                  Create via signup with role "Brokerage/Team"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  View matched agents
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Agent Access:</h4>
              <div className="bg-card p-3 rounded border">
                <p className="text-sm">
                  Create via signup with role "Real Estate Agent"
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  View brokerage matches
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default UserManagement;
