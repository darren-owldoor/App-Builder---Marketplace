import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/use-toast";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { AdminCreditsManager } from "@/components/admin/AdminCreditsManager";

const AdminCredits = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roleData || roleData.length === 0) {
      toast({
        title: "Access Denied",
        description: "You do not have permission to access this page.",
        variant: "destructive",
      });
      navigate("/");
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary to-background p-6">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate("/admin")}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Admin Dashboard
          </Button>
          <h1 className="text-4xl font-bold text-foreground mb-2">Dollar Credits Management</h1>
          <p className="text-muted-foreground">Add or remove dollar credits ($) for client accounts</p>
        </div>

        <AdminCreditsManager />
      </div>
    </div>
  );
};

export default AdminCredits;
