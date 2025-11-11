import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import { Logger } from '../_shared/logger.ts';
import { verifyWebhookRequest } from '../_shared/hmac.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-webhook-secret, x-signature',
};

Deno.serve(async (req) => {
  const startTime = Date.now();
  const logger = new Logger({ endpoint: 'external-webhook' });
  
  logger.request(req.method, new URL(req.url).pathname);

  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // First, try HMAC signature verification if present
    const signature = req.headers.get('x-signature');
    const authHeader = req.headers.get('authorization');
    let isAuthenticated = false;
    
    if (signature) {
      const webhookSecret = Deno.env.get('EXTERNAL_WEBHOOK_SECRET');
      if (!webhookSecret) {
        logger.error('EXTERNAL_WEBHOOK_SECRET not configured for HMAC verification');
        throw new Error('Webhook secret not configured');
      }

      const verification = await verifyWebhookRequest(req.clone(), webhookSecret, logger);
      
      if (!verification.valid) {
        logger.warn('Invalid HMAC signature');
        const response = new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        logger.response(401, Date.now() - startTime);
        return response;
      }

      logger.info('HMAC signature verified successfully');
      isAuthenticated = true;
    } else {
      // Fallback to simple secret header validation
      const webhookSecret = Deno.env.get('EXTERNAL_WEBHOOK_SECRET');
      const providedSecret = req.headers.get('x-webhook-secret');

      if (webhookSecret && providedSecret === webhookSecret) {
        logger.info('Webhook secret header validated');
        isAuthenticated = true;
      }
      
      // Check Supabase JWT token (for admin/internal calls)
      if (!isAuthenticated && authHeader) {
        try {
          const supabaseAuth = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_ANON_KEY') ?? '',
            { global: { headers: { Authorization: authHeader } } }
          );
          
          const { data: { user }, error } = await supabaseAuth.auth.getUser();
          
          if (user && !error) {
            isAuthenticated = true;
            logger.info('Authenticated via Supabase JWT token');
          }
        } catch (error) {
          logger.debug('JWT validation failed', { error });
        }
      }
      
      if (!isAuthenticated) {
        logger.warn('Invalid or missing authentication');
        const response = new Response(
          JSON.stringify({ error: 'Unauthorized - Provide x-signature, x-webhook-secret, or valid JWT token' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
        logger.response(401, Date.now() - startTime);
        return response;
      }
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'summary';
    
    logger.info('Processing webhook action', { action });

    let data: any = {};

    switch (action) {
      case 'summary':
        // Get counts of key entities
        const [prosResult, clientsResult, matchesResult] = await Promise.all([
          supabase.from('pros').select('*', { count: 'exact', head: true }),
          supabase.from('clients').select('*', { count: 'exact', head: true }),
          supabase.from('matches').select('*', { count: 'exact', head: true }),
        ]);

        data = {
          pros_count: prosResult.count || 0,
          clients_count: clientsResult.count || 0,
          matches_count: matchesResult.count || 0,
          timestamp: new Date().toISOString(),
        };
        
        logger.info('Summary data retrieved', data);
        break;

      case 'pros':
        // Get recent pros with details
        const { data: pros, error: prosError } = await supabase
          .from('pros')
          .select('id, full_name, email, phone, pro_type, pipeline_stage, qualification_score, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        if (prosError) {
          logger.error('Error fetching pros', prosError);
          throw prosError;
        }
        
        data = { pros, count: pros?.length || 0 };
        logger.info('Pros data retrieved', { count: data.count });
        break;

      case 'clients':
        // Get recent clients
        const { data: clients, error: clientsError } = await supabase
          .from('clients')
          .select('id, company_name, contact_name, email, client_type, active, created_at')
          .order('created_at', { ascending: false })
          .limit(50);

        if (clientsError) {
          logger.error('Error fetching clients', clientsError);
          throw clientsError;
        }
        
        data = { clients, count: clients?.length || 0 };
        logger.info('Clients data retrieved', { count: data.count });
        break;

      case 'matches':
        // Get recent matches with details
        const { data: matches, error: matchesError } = await supabase
          .from('matches')
          .select(`
            id,
            match_score,
            status,
            created_at,
            pros:pro_id (full_name, email, pro_type),
            clients:client_id (company_name, client_type)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (matchesError) {
          logger.error('Error fetching matches', matchesError);
          throw matchesError;
        }
        
        data = { matches, count: matches?.length || 0 };
        logger.info('Matches data retrieved', { count: data.count });
        break;

      case 'campaigns':
        // Get campaign assignments and responses
        const { data: assignments, error: assignError } = await supabase
          .from('campaign_assignments')
          .select(`
            id,
            status,
            current_step,
            created_at,
            pros:pro_id (full_name, phone),
            campaign_templates:campaign_template_id (name)
          `)
          .order('created_at', { ascending: false })
          .limit(50);

        if (assignError) {
          logger.error('Error fetching campaigns', assignError);
          throw assignError;
        }
        
        data = { assignments, count: assignments?.length || 0 };
        logger.info('Campaign data retrieved', { count: data.count });
        break;

      default:
        logger.warn('Unknown action requested', { action });
        data = { error: 'Unknown action. Use: summary, pros, clients, matches, campaigns' };
    }

    const response = new Response(
      JSON.stringify(data),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    
    logger.response(200, Date.now() - startTime, { dataSize: JSON.stringify(data).length });
    return response;

  } catch (error) {
    logger.error('Webhook processing error', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const response = new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
    logger.response(500, Date.now() - startTime);
    return response;
  }
});
