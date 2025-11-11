import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Database, Zap, CreditCard, MessageSquare, RefreshCw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ErrorLog {
  id: string;
  created_at: string;
  event_type: string;
  error_message: string;
  severity: string;
  metadata?: any;
  endpoint?: string;
}

export function ErrorMonitoringDashboard() {
  const [edgeFunctionErrors, setEdgeFunctionErrors] = useState<ErrorLog[]>([]);
  const [dbErrors, setDbErrors] = useState<ErrorLog[]>([]);
  const [paymentErrors, setPaymentErrors] = useState<ErrorLog[]>([]);
  const [smsErrors, setSmsErrors] = useState<ErrorLog[]>([]);
  const [loading, setLoading] = useState(true);

  const loadErrors = async () => {
    setLoading(true);
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

    // Load all security events (includes various error types)
    const { data: securityEvents } = await supabase
      .from("security_events")
      .select("*")
      .gte("created_at", twentyFourHoursAgo)
      .order("created_at", { ascending: false })
      .limit(100);

    const allEvents = securityEvents || [];
    
    // Categorize events
    const edgeErrs = allEvents.filter(e => 
      e.event_type?.includes("function_") || 
      e.event_type === "api_error" ||
      e.severity === "error"
    );
    
    const paymentErrs = allEvents.filter(e => 
      e.event_type === "payment_failed" || 
      e.event_type?.includes("stripe_")
    );
    
    const smsErrs = allEvents.filter(e => 
      e.event_type === "sms_failed" || 
      e.event_type?.includes("twilio_")
    );
    
    const dbErrs = allEvents.filter(e => 
      e.event_type?.includes("database_") || 
      e.event_type?.includes("query_")
    );
    
    setEdgeFunctionErrors(edgeErrs);
    setPaymentErrors(paymentErrs);
    setSmsErrors(smsErrs);
    setDbErrors(dbErrs);
    setLoading(false);
  };

  useEffect(() => {
    loadErrors();
  }, []);

  const ErrorCard = ({ icon: Icon, title, errors, color }: any) => (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className={`h-5 w-5 ${color}`} />
        <h3 className="font-semibold">{title}</h3>
        <Badge variant={errors.length > 0 ? "destructive" : "secondary"}>
          {errors.length}
        </Badge>
      </div>
      <ScrollArea className="h-64">
        {errors.length === 0 ? (
          <p className="text-sm text-muted-foreground">No errors in the last 24 hours</p>
        ) : (
          <div className="space-y-2">
            {errors.map((error: ErrorLog, idx: number) => (
              <Alert key={idx} variant="destructive">
                <AlertDescription className="text-xs">
                  <div className="font-mono mb-1">
                    {new Date(error.created_at).toLocaleString()}
                  </div>
                  <div className="font-semibold">
                    {error.event_type || "Unknown"}
                  </div>
                  {error.endpoint && (
                    <div className="text-muted-foreground">
                      {error.endpoint}
                    </div>
                  )}
                  <div className="mt-1 break-words">
                    {error.error_message || JSON.stringify(error.metadata || {}).slice(0, 200)}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}
      </ScrollArea>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Error Monitoring Dashboard</h2>
          <p className="text-muted-foreground">Last 24 hours of system errors</p>
        </div>
        <Button onClick={loadErrors} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </Button>
      </div>

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="edge">Edge Functions</TabsTrigger>
          <TabsTrigger value="database">Database</TabsTrigger>
          <TabsTrigger value="payment">Payments</TabsTrigger>
          <TabsTrigger value="sms">SMS/Twilio</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="h-5 w-5 text-purple-500" />
                <h3 className="font-semibold">Edge Functions</h3>
              </div>
              <div className="text-3xl font-bold">{edgeFunctionErrors.length}</div>
              <p className="text-sm text-muted-foreground">errors in last 24h</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <Database className="h-5 w-5 text-blue-500" />
                <h3 className="font-semibold">Database</h3>
              </div>
              <div className="text-3xl font-bold">{dbErrors.length}</div>
              <p className="text-sm text-muted-foreground">errors in last 24h</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="h-5 w-5 text-green-500" />
                <h3 className="font-semibold">Payment</h3>
              </div>
              <div className="text-3xl font-bold">{paymentErrors.length}</div>
              <p className="text-sm text-muted-foreground">errors in last 24h</p>
            </Card>

            <Card className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="h-5 w-5 text-orange-500" />
                <h3 className="font-semibold">SMS/Twilio</h3>
              </div>
              <div className="text-3xl font-bold">{smsErrors.length}</div>
              <p className="text-sm text-muted-foreground">errors in last 24h</p>
            </Card>
          </div>

          {(edgeFunctionErrors.length + dbErrors.length + paymentErrors.length + smsErrors.length === 0) && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                All systems operational - no errors detected in the last 24 hours! 🎉
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>

        <TabsContent value="edge">
          <ErrorCard 
            icon={Zap}
            title="Edge Function Errors"
            errors={edgeFunctionErrors}
            color="text-purple-500"
          />
        </TabsContent>

        <TabsContent value="database">
          <ErrorCard 
            icon={Database}
            title="Database Errors"
            errors={dbErrors}
            color="text-blue-500"
          />
        </TabsContent>

        <TabsContent value="payment">
          <ErrorCard 
            icon={CreditCard}
            title="Payment Errors"
            errors={paymentErrors}
            color="text-green-500"
          />
        </TabsContent>

        <TabsContent value="sms">
          <ErrorCard 
            icon={MessageSquare}
            title="SMS/Twilio Errors"
            errors={smsErrors}
            color="text-orange-500"
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
