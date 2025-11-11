import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log('Processing campaigns...');

    // Get all active assignments that are ready to send
    const { data: assignments, error: assignmentsError } = await supabase
      .from('campaign_assignments')
      .select(`
        id,
        pro_id,
        campaign_template_id,
        current_step,
        next_send_at,
        status,
        pros (
          id,
          full_name,
          phone
        )
      `)
      .eq('status', 'active')
      .lte('next_send_at', new Date().toISOString());

    if (assignmentsError) {
      console.error('Error fetching assignments:', assignmentsError);
      throw assignmentsError;
    }

    console.log(`Found ${assignments?.length || 0} assignments to process`);

    const results = [];

    for (const assignment of assignments || []) {
      try {
        // Get the campaign steps for this template
        const { data: steps, error: stepsError } = await supabase
          .from('campaign_steps')
          .select('*')
          .eq('campaign_template_id', assignment.campaign_template_id)
          .order('step_order', { ascending: true });

        if (stepsError) {
          console.error('Error fetching steps:', stepsError);
          throw stepsError;
        }

        if (!steps || steps.length === 0) {
          console.log('No steps found for template:', assignment.campaign_template_id);
          continue;
        }

        const currentStepIndex = assignment.current_step || 0;
        
        // Check if campaign is complete
        if (currentStepIndex >= steps.length) {
          console.log('Campaign complete for assignment:', assignment.id);
          await supabase
            .from('campaign_assignments')
            .update({ status: 'completed' })
            .eq('id', assignment.id);
          continue;
        }

        const currentStep = steps[currentStepIndex];
        const lead = assignment.pros as any;

        // Process SMS steps
        if (currentStep.step_type === 'sms' && currentStep.sms_template && lead.phone) {
          console.log('Sending SMS for assignment:', assignment.id);
          
          // Replace template variables
          let message = currentStep.sms_template;
          message = message.replace(/\{lead_name\}/g, lead.full_name || 'there');
          
          // Prepare SMS parameters
          const smsPayload: any = {
            to: lead.phone,
            message,
            assignmentId: assignment.id,
            stepId: currentStep.id,
          };

          // Add Twilio account and phone number if specified
          if (currentStep.twilio_account_id) {
            smsPayload.twilioAccountId = currentStep.twilio_account_id;
          }
          if (currentStep.phone_number) {
            smsPayload.phoneNumber = currentStep.phone_number;
          }

          // Call the send-campaign-sms function
          const { error: smsError } = await supabase.functions.invoke('send-campaign-sms', {
            body: smsPayload,
          });

          if (smsError) {
            console.error('Error sending SMS:', smsError);
            results.push({ assignment: assignment.id, status: 'error', error: smsError.message });
            continue;
          }
        }

        // Process email steps (placeholder for future implementation)
        if (currentStep.step_type === 'email') {
          console.log('Email sending not yet implemented');
          // TODO: Implement email sending
        }

        // Calculate next send time
        const nextStepIndex = currentStepIndex + 1;
        let nextSendAt = null;

        if (nextStepIndex < steps.length) {
          const nextStep = steps[nextStepIndex];
          const delayMs = 
            (nextStep.delay_days * 24 * 60 * 60 * 1000) +
            (nextStep.delay_hours * 60 * 60 * 1000) +
            (nextStep.delay_minutes * 60 * 1000);
          
          nextSendAt = new Date(Date.now() + delayMs).toISOString();
        }

        // Update the assignment
        const updateData: any = {
          current_step: nextStepIndex,
          updated_at: new Date().toISOString(),
        };

        if (nextSendAt) {
          updateData.next_send_at = nextSendAt;
        } else {
          updateData.status = 'completed';
        }

        const { error: updateError } = await supabase
          .from('campaign_assignments')
          .update(updateData)
          .eq('id', assignment.id);

        if (updateError) {
          console.error('Error updating assignment:', updateError);
          throw updateError;
        }

        results.push({ assignment: assignment.id, status: 'success' });

      } catch (error: any) {
        console.error('Error processing assignment:', assignment.id, error);
        results.push({ assignment: assignment.id, status: 'error', error: error.message });
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        processed: results.length,
        results,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error: any) {
    console.error('Error in process-campaigns:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
