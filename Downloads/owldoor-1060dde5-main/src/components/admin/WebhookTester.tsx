import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle2, XCircle, Send, UserPlus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface WebhookResponse {
  status: number;
  data: any;
  error?: string;
}

export function WebhookTester() {
  const { toast } = useToast();
  const [testing, setTesting] = useState<{ [key: string]: boolean }>({});
  const [results, setResults] = useState<{ [key: string]: WebhookResponse | null }>({
    agent: null,
    client: null,
    external: null,
    testAgent: null,
  });

  const WEBHOOK_BASE_URL = import.meta.env.VITE_SUPABASE_URL;

  const createTestAgent = async () => {
    setTesting((prev) => ({ ...prev, testAgent: true }));
    try {
      const randomId = Math.floor(Math.random() * 10000);
      const testAgent = {
        first_name: 'Sarah',
        last_name: `Thompson${randomId}`,
        email: `sarah.thompson${randomId}@remax.com`,
        phone: `+1555${String(randomId).padStart(7, '0')}`,
        
        // Professional Info
        company: 'RE/MAX Premier',
        brokerage: 'RE/MAX Premier Properties',
        address: '456 Real Estate Blvd, Los Angeles, CA 90210',
        
        // Location Coverage
        cities: ['Los Angeles', 'Beverly Hills', 'Santa Monica'],
        states: ['CA'],
        
        // Performance Metrics (High-performing agent)
        transactions: 45,
        years_experience: 8,
        total_volume: 18500000,
        total_units: 45,
        buyer_volume: 9250000,
        buyer_units: 22,
        seller_volume: 9250000,
        seller_units: 23,
        
        // Percentages
        buyer_percentage: 49,
        seller_percentage: 51,
        percent_financed: 85,
        
        // Relationship Data
        top_lender: 'Wells Fargo Home Mortgage',
        top_lender_share: 35,
        top_lender_volume: 3237500,
        top_originator: 'Michael Chen',
        top_originator_share: 25,
        
        // Social Links
        linkedin_url: `https://linkedin.com/in/sarah-thompson-${randomId}`,
        facebook_url: `https://facebook.com/sarah.thompson.realtor${randomId}`,
        instagram_url: `@sarahsellsla${randomId}`,
        website_url: `https://sarahsellsla${randomId}.com`,
        
        // Additional Info
        interest_level: 9, // High interest = qualification score boost
        source: 'admin_test',
        notes: 'Test agent created for matching - fully qualified with high performance metrics',
      };

      // Use Supabase client which handles authentication
      const { data, error } = await supabase.functions.invoke('agent-lead-webhook', {
        body: testAgent,
      });

      setResults((prev) => ({
        ...prev,
        testAgent: { 
          status: error ? 500 : 200, 
          data: error ? { error: error.message } : data 
        },
      }));

      if (!error && data.success) {
        toast({
          title: 'Match-Ready Agent Created!',
          description: `${testAgent.first_name} ${testAgent.last_name} - Qualification Score: ${data.lead?.qualification_score || 'N/A'}`,
        });
      } else {
        toast({
          title: 'Failed to Create Test Agent',
          description: error?.message || data?.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults((prev) => ({
        ...prev,
        testAgent: { status: 0, data: null, error: errorMessage },
      }));
      toast({
        title: 'Error Creating Test Agent',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTesting((prev) => ({ ...prev, testAgent: false }));
    }
  };

  const testAgentWebhook = async () => {
    setTesting((prev) => ({ ...prev, agent: true }));
    try {
      const testData = {
        first_name: 'Test',
        last_name: 'Agent',
        phone: '+15555551234',
        email: `test.agent.${Date.now()}@example.com`,
        brokerage: 'Test Brokerage',
        years_experience: 5,
        transactions: 25,
        motivation: 8,
        pro_type: 'real_estate_agent',
      };

      // Use Supabase client for proper auth
      const { data, error } = await supabase.functions.invoke('agent-lead-webhook', {
        body: testData,
      });
      
      setResults((prev) => ({
        ...prev,
        agent: { 
          status: error ? 500 : 200, 
          data: error ? { error: error.message } : data 
        },
      }));

      if (!error) {
        toast({
          title: 'Agent Webhook Test Successful',
          description: `Status: 200`,
        });
      } else {
        toast({
          title: 'Agent Webhook Test Failed',
          description: error.message || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults((prev) => ({
        ...prev,
        agent: { status: 0, data: null, error: errorMessage },
      }));
      toast({
        title: 'Agent Webhook Test Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTesting((prev) => ({ ...prev, agent: false }));
    }
  };

  const testClientWebhook = async () => {
    setTesting((prev) => ({ ...prev, client: true }));
    try {
      const testData = {
        company_name: 'Test Company',
        contact_name: 'Test Client',
        email: `test.client.${Date.now()}@example.com`,
        client_type: 'real_estate',
        phone: '+15555555678',
        first_name: 'Test',
        last_name: 'Client',
      };

      // Use Supabase client for proper auth
      const { data, error } = await supabase.functions.invoke('client-webhook', {
        body: testData,
      });
      
      setResults((prev) => ({
        ...prev,
        client: { 
          status: error ? 500 : 200, 
          data: error ? { error: error.message } : data 
        },
      }));

      if (!error) {
        toast({
          title: 'Client Webhook Test Successful',
          description: `Status: 200`,
        });
      } else {
        toast({
          title: 'Client Webhook Test Failed',
          description: error.message || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults((prev) => ({
        ...prev,
        client: { status: 0, data: null, error: errorMessage },
      }));
      toast({
        title: 'Client Webhook Test Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTesting((prev) => ({ ...prev, client: false }));
    }
  };

  const testExternalWebhook = async (action: string = 'summary') => {
    setTesting((prev) => ({ ...prev, external: true }));
    try {
      // Get the current session token for authentication
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Use fetch with proper auth token and query params
      const response = await fetch(
        `${WEBHOOK_BASE_URL}/functions/v1/external-webhook?action=${action}`,
        {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const data = await response.json();
      
      setResults((prev) => ({
        ...prev,
        external: { status: response.status, data },
      }));

      if (response.ok) {
        toast({
          title: 'External Webhook Test Successful',
          description: `Action: ${action}, Status: ${response.status}`,
        });
      } else {
        toast({
          title: 'External Webhook Test Failed',
          description: data.error || 'Unknown error',
          variant: 'destructive',
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setResults((prev) => ({
        ...prev,
        external: { status: 0, data: null, error: errorMessage },
      }));
      toast({
        title: 'External Webhook Test Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setTesting((prev) => ({ ...prev, external: false }));
    }
  };

  const renderResult = (result: WebhookResponse | null) => {
    if (!result) return null;

    const isSuccess = result.status >= 200 && result.status < 300;

    return (
      <div className="mt-4 space-y-2">
        <div className="flex items-center gap-2">
          {isSuccess ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <XCircle className="h-5 w-5 text-red-500" />
          )}
          <Badge variant={isSuccess ? 'default' : 'destructive'}>
            Status: {result.status}
          </Badge>
        </div>
        <div className="bg-muted p-4 rounded-md">
          <pre className="text-xs overflow-auto max-h-96">
            {JSON.stringify(result.data || result.error, null, 2)}
          </pre>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-green-200 bg-green-50/50 dark:bg-green-950/20 dark:border-green-900">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-green-600" />
            Create Match-Ready Agent
          </CardTitle>
          <CardDescription>
            Generate a fully populated, high-performing agent ready for matching with complete profile data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-white dark:bg-gray-900 p-4 rounded-lg border">
            <h4 className="font-semibold text-sm mb-2">Generated Agent Details:</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 45 transactions, $18.5M total volume</li>
              <li>• 8 years experience</li>
              <li>• Full location coverage (LA, Beverly Hills, Santa Monica)</li>
              <li>• Complete social profiles & lender relationships</li>
              <li>• Qualification Score: 94/100 (Ready to Match)</li>
            </ul>
          </div>
          <Button
            onClick={createTestAgent}
            disabled={testing.testAgent}
            className="w-full"
            size="lg"
          >
            {testing.testAgent ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Agent...
              </>
            ) : (
              <>
                <UserPlus className="mr-2 h-4 w-4" />
                Create Test Agent
              </>
            )}
          </Button>
          {renderResult(results.testAgent)}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Webhook Testing Tool</CardTitle>
          <CardDescription>
            Test webhook endpoints to verify they're receiving and processing data correctly
          </CardDescription>
        </CardHeader>
        <CardContent>
        <Tabs defaultValue="agent" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="agent">Agent Lead</TabsTrigger>
            <TabsTrigger value="client">Client</TabsTrigger>
            <TabsTrigger value="external">External</TabsTrigger>
          </TabsList>

          <TabsContent value="agent" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Agent Lead Webhook</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Endpoint: <code className="text-xs bg-muted p-1 rounded">/agent-lead-webhook</code>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                This webhook creates or updates agent records with qualification scoring.
              </p>
              <Button
                onClick={testAgentWebhook}
                disabled={testing.agent}
                className="w-full"
              >
                {testing.agent ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Agent Data
                  </>
                )}
              </Button>
              {renderResult(results.agent)}
            </div>
          </TabsContent>

          <TabsContent value="client" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">Client Webhook</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Endpoint: <code className="text-xs bg-muted p-1 rounded">/client-webhook</code>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                This webhook creates new client accounts with authentication.
              </p>
              <Button
                onClick={testClientWebhook}
                disabled={testing.client}
                className="w-full"
              >
                {testing.client ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Send Test Client Data
                  </>
                )}
              </Button>
              {renderResult(results.client)}
            </div>
          </TabsContent>

          <TabsContent value="external" className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-2">External Webhook</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Endpoint: <code className="text-xs bg-muted p-1 rounded">/external-webhook</code>
              </p>
              <p className="text-sm text-muted-foreground mb-4">
                This webhook provides data exports for external systems.
              </p>
              <div className="space-y-2">
                <Button
                  onClick={() => testExternalWebhook('summary')}
                  disabled={testing.external}
                  className="w-full"
                  variant="outline"
                >
                  {testing.external ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Test Summary Action
                    </>
                  )}
                </Button>
                <Button
                  onClick={() => testExternalWebhook('pros')}
                  disabled={testing.external}
                  className="w-full"
                  variant="outline"
                >
                  Test Pros Action
                </Button>
                <Button
                  onClick={() => testExternalWebhook('clients')}
                  disabled={testing.external}
                  className="w-full"
                  variant="outline"
                >
                  Test Clients Action
                </Button>
              </div>
              {renderResult(results.external)}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
    </div>
  );
}
