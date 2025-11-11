import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { SecurityAlertsMonitor } from "@/components/admin/SecurityAlertsMonitor";
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  Mail, 
  CreditCard, 
  Shield, 
  TrendingUp,
  TrendingDown,
  Clock,
  Phone,
  DollarSign,
  AlertCircle,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { useToast } from "@/hooks/use-toast";

interface SystemHealth {
  service_name: string;
  status: string;
  last_check_at: string;
  response_time_ms: number;
  error_message?: string;
}

interface SecurityEvent {
  id: string;
  event_type: string;
  severity: string;
  created_at: string;
  success: boolean;
  endpoint: string;
}

interface ActivityLog {
  id: string;
  created_at: string;
  status: string;
  direction?: string;
  [key: string]: any;
}

const SystemMonitoringDashboard = () => {
  const navigate = useNavigate();
  const { toast: toastHook } = useToast();
  const [loading, setLoading] = useState(true);
  const [systemHealth, setSystemHealth] = useState<SystemHealth[]>([]);
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [smsActivity, setSmsActivity] = useState<ActivityLog[]>([]);
  const [emailActivity, setEmailActivity] = useState<ActivityLog[]>([]);
  const [paymentActivity, setPaymentActivity] = useState<ActivityLog[]>([]);
  const [captchaActivity, setCaptchaActivity] = useState<ActivityLog[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      toastHook({
        title: "Access Denied",
        description: "Admin access required",
        variant: "destructive",
      });
      navigate("/");
      return;
    }

    loadDashboardData();
  };

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load system health
      const { data: healthData } = await supabase
        .from("system_health")
        .select("*")
        .order("last_check_at", { ascending: false })
        .limit(10);

      if (healthData) setSystemHealth(healthData);

      // Load security events (last 24 hours)
      const { data: securityData } = await supabase
        .from("security_events")
        .select("*")
        .gte("created_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .order("created_at", { ascending: false })
        .limit(50);

      if (securityData) setSecurityEvents(securityData);

      // Load SMS activity
      const { data: smsData } = await supabase
        .from("sms_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (smsData) setSmsActivity(smsData);

      // Load email activity
      const { data: emailData } = await supabase
        .from("email_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (emailData) setEmailActivity(emailData);

      // Load payment activity
      const { data: paymentData } = await supabase
        .from("payment_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (paymentData) setPaymentActivity(paymentData);

      // Load CAPTCHA activity
      const { data: captchaData } = await supabase
        .from("captcha_activity_log")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (captchaData) {
        // Map success field to status for consistency
        const mappedCaptchaData = captchaData.map(item => ({
          ...item,
          status: item.success ? 'success' : 'failed'
        }));
        setCaptchaActivity(mappedCaptchaData);
      }

    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toastHook({
        title: "Error",
        description: "Failed to load monitoring data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await loadDashboardData();
    setRefreshing(false);
    toast.success("Dashboard refreshed");
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      operational: { label: "Operational", color: "bg-green-500", icon: CheckCircle2 },
      degraded: { label: "Degraded", color: "bg-yellow-500", icon: AlertTriangle },
      down: { label: "Down", color: "bg-red-500", icon: XCircle },
      success: { label: "Success", color: "bg-green-500", icon: CheckCircle2 },
      failed: { label: "Failed", color: "bg-red-500", icon: XCircle },
      pending: { label: "Pending", color: "bg-blue-500", icon: Clock },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || {
      label: status,
      color: "bg-gray-500",
      icon: Activity
    };

    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const getSeverityBadge = (severity: string) => {
    const severityConfig = {
      low: { color: "bg-blue-500", icon: Activity },
      medium: { color: "bg-yellow-500", icon: AlertTriangle },
      high: { color: "bg-orange-500", icon: AlertCircle },
      critical: { color: "bg-red-500", icon: XCircle },
    };

    const config = severityConfig[severity as keyof typeof severityConfig] || {
      color: "bg-gray-500",
      icon: Activity
    };

    const Icon = config.icon;

    return (
      <Badge className={`${config.color} text-white`}>
        <Icon className="h-3 w-3 mr-1" />
        {severity.toUpperCase()}
      </Badge>
    );
  };

  const calculateStats = (data: ActivityLog[], type: string) => {
    const total = data.length;
    const success = data.filter(d => d.status === 'success' || d.status === 'delivered' || d.status === 'sent').length;
    const failed = data.filter(d => d.status === 'failed' || d.status === 'error').length;
    const successRate = total > 0 ? Math.round((success / total) * 100) : 0;

    return { total, success, failed, successRate };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading monitoring dashboard...</p>
        </div>
      </div>
    );
  }

  const smsStats = calculateStats(smsActivity, 'sms');
  const emailStats = calculateStats(emailActivity, 'email');
  const paymentStats = calculateStats(paymentActivity, 'payment');
  const captchaSuccess = captchaActivity.filter(c => c.status === 'success').length;
  const captchaFailed = captchaActivity.filter(c => c.status === 'failed').length;

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold mb-2">System Monitoring Dashboard</h1>
            <p className="text-muted-foreground">
              Real-time monitoring and security analytics
            </p>
          </div>
          <Button onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* System Health Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Phone className="h-4 w-4 text-blue-500" />
                SMS Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{smsStats.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {smsStats.success} sent
                </div>
                <div className="text-xs text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {smsStats.failed} failed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4 text-purple-500" />
                Email Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{emailStats.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-green-600 flex items-center">
                  <TrendingUp className="h-3 w-3 mr-1" />
                  {emailStats.success} sent
                </div>
                <div className="text-xs text-red-600 flex items-center">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {emailStats.failed} failed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-green-500" />
                Payment Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{paymentStats.total}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-green-600 flex items-center">
                  <CheckCircle2 className="h-3 w-3 mr-1" />
                  {paymentStats.success} success
                </div>
                <div className="text-xs text-red-600 flex items-center">
                  <XCircle className="h-3 w-3 mr-1" />
                  {paymentStats.failed} failed
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Shield className="h-4 w-4 text-red-500" />
                Security Events
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{securityEvents.length}</div>
              <div className="flex items-center gap-2 mt-2">
                <div className="text-xs text-orange-600 flex items-center">
                  <AlertTriangle className="h-3 w-3 mr-1" />
                  {securityEvents.filter(e => e.severity === 'high' || e.severity === 'critical').length} critical
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="system-health" className="space-y-4">
          <TabsList>
            <TabsTrigger value="system-health">System Health</TabsTrigger>
            <TabsTrigger value="security">Security Events</TabsTrigger>
            <TabsTrigger value="sms">SMS Activity</TabsTrigger>
            <TabsTrigger value="email">Email Activity</TabsTrigger>
            <TabsTrigger value="payments">Payments</TabsTrigger>
            <TabsTrigger value="captcha">CAPTCHA</TabsTrigger>
          </TabsList>

          <TabsContent value="system-health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Services Status</CardTitle>
                <CardDescription>Real-time health monitoring of all services</CardDescription>
              </CardHeader>
              <CardContent>
                {systemHealth.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No system health data available
                  </div>
                ) : (
                  <div className="space-y-4">
                    {systemHealth.map((service) => (
                      <div key={service.service_name} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-4">
                          <div>
                            <div className="font-medium">{service.service_name}</div>
                            <div className="text-sm text-muted-foreground">
                              Last checked: {new Date(service.last_check_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {service.response_time_ms && (
                            <div className="text-sm text-muted-foreground">
                              {service.response_time_ms}ms
                            </div>
                          )}
                          {getStatusBadge(service.status)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-4">
            <SecurityAlertsMonitor />
          </TabsContent>

          <TabsContent value="sms" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>SMS Activity Log</CardTitle>
                <CardDescription>Track all SMS messages sent and received</CardDescription>
              </CardHeader>
              <CardContent>
                {smsActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No SMS activity recorded
                  </div>
                ) : (
                  <div className="space-y-3">
                    {smsActivity.map((sms: any) => (
                      <div key={sms.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">
                            {sms.direction === 'sent' ? 'Sent to' : 'Received from'} {sms.to_number}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {new Date(sms.created_at).toLocaleString()}
                          </div>
                        </div>
                        {getStatusBadge(sms.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="email" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Email Activity Log</CardTitle>
                <CardDescription>Track all emails sent and received</CardDescription>
              </CardHeader>
              <CardContent>
                {emailActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No email activity recorded
                  </div>
                ) : (
                  <div className="space-y-3">
                    {emailActivity.map((email: any) => (
                      <div key={email.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{email.subject || 'No subject'}</div>
                          <div className="text-sm text-muted-foreground">
                            To: {email.to_email} • {new Date(email.created_at).toLocaleString()}
                          </div>
                        </div>
                        {getStatusBadge(email.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="payments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Payment Activity Log</CardTitle>
                <CardDescription>Monitor payment transactions and status</CardDescription>
              </CardHeader>
              <CardContent>
                {paymentActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No payment activity recorded
                  </div>
                ) : (
                  <div className="space-y-3">
                    {paymentActivity.map((payment: any) => (
                      <div key={payment.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium flex items-center gap-2">
                            <DollarSign className="h-4 w-4" />
                            ${(payment.amount_cents / 100).toFixed(2)} {payment.currency.toUpperCase()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {payment.event_type} • {new Date(payment.created_at).toLocaleString()}
                          </div>
                        </div>
                        {getStatusBadge(payment.status)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="captcha" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>CAPTCHA Verification Log</CardTitle>
                <CardDescription>Track CAPTCHA attempts and failures</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{captchaSuccess}</div>
                    <div className="text-sm text-muted-foreground">Successful Verifications</div>
                  </div>
                  <div className="p-4 border rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{captchaFailed}</div>
                    <div className="text-sm text-muted-foreground">Failed Attempts</div>
                  </div>
                </div>
                {captchaActivity.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No CAPTCHA activity recorded
                  </div>
                ) : (
                  <div className="space-y-3">
                    {captchaActivity.map((captcha: any) => (
                      <div key={captcha.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <div className="font-medium">{captcha.form_type || 'Unknown form'}</div>
                          <div className="text-sm text-muted-foreground">
                            IP: {captcha.ip_address} • {new Date(captcha.created_at).toLocaleString()}
                          </div>
                        </div>
                        {getStatusBadge(captcha.success ? 'success' : 'failed')}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SystemMonitoringDashboard;
