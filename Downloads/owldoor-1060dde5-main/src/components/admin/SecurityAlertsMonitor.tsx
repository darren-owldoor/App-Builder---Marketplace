import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle, Shield, Activity, Users, CreditCard, MessageSquare } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface SecurityAlert {
  type: 'rate_limit' | 'failed_auth' | 'suspicious_payment' | 'spam_detected' | 'admin_action';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  timestamp: Date;
  metadata?: Record<string, any>;
}

export function SecurityAlertsMonitor() {
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [stats, setStats] = useState({
    failedLogins: 0,
    rateLimitHits: 0,
    suspiciousPayments: 0,
    activeUsers: 0,
  });
  const { toast } = useToast();

  useEffect(() => {
    loadSecurityEvents();
    const interval = setInterval(loadSecurityEvents, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  const loadSecurityEvents = async () => {
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours

    try {
      // Failed authentication attempts
      const { data: failedAuths } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'failed_login')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Rate limit violations
      const { data: rateLimits } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'rate_limit_exceeded')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Payment anomalies from security events
      const { data: paymentEvents } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'payment_failed')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // SMS spam detection from security events
      const { data: smsEvents } = await supabase
        .from('security_events')
        .select('*')
        .eq('event_type', 'sms_failed')
        .gte('created_at', since.toISOString())
        .order('created_at', { ascending: false })
        .limit(10);

      // Build alerts
      const newAlerts: SecurityAlert[] = [];

      // Critical: Multiple failed logins from same IP
      const failedByIP: Record<string, number> = {};
      failedAuths?.forEach((event) => {
        const metadata = event.metadata as Record<string, any> | null;
        const ip = metadata?.ip_address || 'unknown';
        failedByIP[ip] = (failedByIP[ip] || 0) + 1;
      });

      Object.entries(failedByIP).forEach(([ip, count]) => {
        if (count >= 5) {
          newAlerts.push({
            type: 'failed_auth',
            severity: 'critical',
            message: `${count} failed login attempts from IP ${ip}`,
            timestamp: new Date(),
            metadata: { ip, count },
          });
        }
      });

      // High: Repeated rate limit violations
      const rateLimitByUser: Record<string, number> = {};
      rateLimits?.forEach((event) => {
        const userId = event.user_id || 'anonymous';
        rateLimitByUser[userId] = (rateLimitByUser[userId] || 0) + 1;
      });

      Object.entries(rateLimitByUser).forEach(([userId, count]) => {
        if (count >= 3) {
          newAlerts.push({
            type: 'rate_limit',
            severity: 'high',
            message: `User ${userId} hit rate limits ${count} times`,
            timestamp: new Date(),
            metadata: { userId, count },
          });
        }
      });

      // Medium: Failed payments
      if (paymentEvents && paymentEvents.length >= 3) {
        newAlerts.push({
          type: 'suspicious_payment',
          severity: 'medium',
          message: `${paymentEvents.length} failed payment attempts in last 24h`,
          timestamp: new Date(),
          metadata: { count: paymentEvents.length },
        });
      }

      // Medium: SMS delivery failures
      if (smsEvents && smsEvents.length >= 5) {
        newAlerts.push({
          type: 'spam_detected',
          severity: 'medium',
          message: `${smsEvents.length} SMS delivery failures detected`,
          timestamp: new Date(),
          metadata: { count: smsEvents.length },
        });
      }

      setAlerts(newAlerts);
      setStats({
        failedLogins: failedAuths?.length || 0,
        rateLimitHits: rateLimits?.length || 0,
        suspiciousPayments: paymentEvents?.length || 0,
        activeUsers: 0, // Could be calculated from recent activity
      });

      // Show toast for critical alerts
      if (newAlerts.some((a) => a.severity === 'critical')) {
        toast({
          title: 'Critical Security Alert',
          description: 'Multiple suspicious activities detected. Check security monitor.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error loading security events:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'rate_limit':
        return <Activity className="h-4 w-4" />;
      case 'failed_auth':
        return <Shield className="h-4 w-4" />;
      case 'suspicious_payment':
        return <CreditCard className="h-4 w-4" />;
      case 'spam_detected':
        return <MessageSquare className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed Logins</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.failedLogins}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rate Limit Hits</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.rateLimitHits}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Payment Issues</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.suspiciousPayments}</div>
            <p className="text-xs text-muted-foreground">Last 24 hours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{alerts.length}</div>
            <p className="text-xs text-muted-foreground">Requires attention</p>
          </CardContent>
        </Card>
      </div>

      {/* Active Alerts */}
      <Card>
        <CardHeader>
          <CardTitle>Active Security Alerts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {alerts.length === 0 ? (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertTitle>All Clear</AlertTitle>
              <AlertDescription>No security alerts detected in the last 24 hours.</AlertDescription>
            </Alert>
          ) : (
            alerts.map((alert, index) => (
              <Alert key={index} variant={alert.severity === 'critical' ? 'destructive' : 'default'}>
                {getAlertIcon(alert.type)}
                <AlertTitle className="flex items-center gap-2">
                  {alert.message}
                  <Badge variant={getSeverityColor(alert.severity)}>{alert.severity.toUpperCase()}</Badge>
                </AlertTitle>
                <AlertDescription>
                  {alert.timestamp.toLocaleString()}
                  {alert.metadata && (
                    <div className="mt-2 text-xs">
                      <pre className="bg-muted p-2 rounded">{JSON.stringify(alert.metadata, null, 2)}</pre>
                    </div>
                  )}
                </AlertDescription>
              </Alert>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
}
