import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CRMLayout } from "@/components/layout/CRMLayout";
import { AIRecruiterCRM } from "@/components/ai-recruiter/AIRecruiterCRM";

const AIRecruiterDashboard = () => {
  const [loading, setLoading] = useState(true);
  const [clientId, setClientId] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [companyName, setCompanyName] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    verifyClientRole();
  }, []);

  const verifyClientRole = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    setUserId(user.id);
    setUserEmail(user.email || null);

    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .in("role", ["client", "admin"]);

    if (!roleData || roleData.length === 0) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    const { data: clientData } = await supabase
      .from("clients")
      .select("id, company_name")
      .eq("user_id", user.id)
      .single();

    if (clientData) {
      setClientId(clientData.id);
      setCompanyName(clientData.company_name || null);
    }

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!clientId || !userId) {
    return null;
  }

  return (
    <CRMLayout
      userEmail={userEmail || undefined}
      userId={userId?.substring(0, 8) || undefined}
      companyName={companyName || undefined}
    >
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">AI Recruiter</h1>
          <p className="text-muted-foreground mt-2">
            Manage AI-powered conversations with your recruits
          </p>
        </div>
        
        <AIRecruiterCRM clientId={clientId} userId={userId} />
      </div>
    </CRMLayout>
  );
};

export default AIRecruiterDashboard;
