import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// HTML escape function to prevent XSS
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

const MAX_MESSAGE_LENGTH = 5000;
const MAX_NAME_LENGTH = 200;
const MAX_EMAIL_LENGTH = 255;
const MAX_PHONE_LENGTH = 50;
const MAX_COMPANY_LENGTH = 200;

interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  message: string;
  captchaToken?: string;
}

const sanitizeInput = (input: string, maxLength: number): string => {
  return input
    .trim()
    .slice(0, maxLength)
    .replace(/[<>]/g, ''); // Remove potential HTML tags
};

serve(async (req) => {
  const startTime = Date.now();
  const requestId = crypto.randomUUID();
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  try {
    const formData: ContactFormData = await req.json();
    
    // Rate limiting by IP - max 5 requests per hour per IP
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';
    
    const { data: canProceed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_identifier: clientIp,
      p_endpoint: 'send-contact-email',
      p_max_requests: 5,
      p_window_minutes: 60
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (canProceed === false) {
      await supabase.rpc('log_request', {
        p_level: 'warn',
        p_message: 'Rate limit exceeded',
        p_endpoint: 'send-contact-email',
        p_request_id: requestId,
        p_status_code: 429,
        p_metadata: { ip: clientIp }
      });
      
      return new Response(
        JSON.stringify({ 
          error: 'Too many requests. Please try again later.',
          retryAfter: 3600 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }
    
    // Validate captcha
    if (!formData.captchaToken) {
      throw new Error('CAPTCHA verification required');
    }
    
    // Verify captcha with hCaptcha
    const captchaResponse = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `response=${formData.captchaToken}&secret=${Deno.env.get('HCAPTCHA_SECRET_KEY')}`,
    });
    
    const captchaData = await captchaResponse.json();
    if (!captchaData.success) {
      await supabase.rpc('log_request', {
        p_level: 'warn',
        p_message: 'Failed CAPTCHA verification attempt',
        p_endpoint: 'send-contact-email',
        p_request_id: requestId,
        p_status_code: 400,
        p_metadata: { email: formData.email }
      });
      throw new Error('CAPTCHA verification failed');
    }

    // Validate required fields
    if (!formData.name || !formData.email || !formData.message) {
      throw new Error("Missing required fields");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      throw new Error("Invalid email format");
    }
    
    // Sanitize inputs
    const sanitizedName = sanitizeInput(formData.name, MAX_NAME_LENGTH);
    const sanitizedEmail = sanitizeInput(formData.email, MAX_EMAIL_LENGTH);
    const sanitizedPhone = formData.phone ? sanitizeInput(formData.phone, MAX_PHONE_LENGTH) : '';
    const sanitizedCompany = formData.company ? sanitizeInput(formData.company, MAX_COMPANY_LENGTH) : '';
    const sanitizedMessage = sanitizeInput(formData.message, MAX_MESSAGE_LENGTH);

    const emailSubject = `Contact Form: ${sanitizedName}${sanitizedCompany ? ` - ${sanitizedCompany}` : ''}`;
    
    const emailBody = `
      <h2>New Contact Form Submission</h2>
      <p><strong>Name:</strong> ${escapeHtml(sanitizedName)}</p>
      <p><strong>Email:</strong> ${escapeHtml(sanitizedEmail)}</p>
      ${sanitizedPhone ? `<p><strong>Phone:</strong> ${escapeHtml(sanitizedPhone)}</p>` : ''}
      ${sanitizedCompany ? `<p><strong>Company:</strong> ${escapeHtml(sanitizedCompany)}</p>` : ''}
      <p><strong>Message:</strong></p>
      <p style="white-space: pre-wrap;">${escapeHtml(sanitizedMessage)}</p>
      <hr>
      <p style="font-size: 12px; color: #666;">Submitted from OwlDoor Contact Form</p>
    `;

    const textBody = `
New Contact Form Submission

Name: ${sanitizedName}
Email: ${sanitizedEmail}
${sanitizedPhone ? `Phone: ${sanitizedPhone}` : ''}
${sanitizedCompany ? `Company: ${sanitizedCompany}` : ''}

Message:
${sanitizedMessage}

---
Submitted from OwlDoor Contact Form
    `.trim();

    // Send to both email addresses
    const recipients = ["Darren@OwlDoor.com", "Hello@OwlDoor.com"];
    
    for (const recipient of recipients) {
      const { error } = await supabase.functions.invoke("send-email-sendgrid", {
        body: {
          to: recipient,
          subject: emailSubject,
          text: textBody,
          html: emailBody,
        },
      });

      if (error) {
        console.error(`Error sending to ${recipient}:`, error);
        throw error;
      }
    }

    // Send confirmation email to submitter
    const confirmationHtml = `
      <h2>Thank you for contacting OwlDoor!</h2>
      <p>Hi ${escapeHtml(sanitizedName)},</p>
      <p>We've received your message and will get back to you as soon as possible.</p>
      <p><strong>Your message:</strong></p>
      <p style="white-space: pre-wrap; background: #f5f5f5; padding: 15px; border-radius: 5px;">${escapeHtml(sanitizedMessage)}</p>
      <p>Best regards,<br>The OwlDoor Team</p>
      <hr>
      <p style="font-size: 12px; color: #666;">
        OwlDoor<br>
        8 THE GREEN, STE A<br>
        Dover, DE 19901<br>
        <a href="mailto:Hello@OwlDoor.com">Hello@OwlDoor.com</a>
      </p>
    `;

    const confirmationText = `
Thank you for contacting OwlDoor!

Hi ${sanitizedName},

We've received your message and will get back to you as soon as possible.

Your message:
${sanitizedMessage}

Best regards,
The OwlDoor Team

---
OwlDoor
8 THE GREEN, STE A
Dover, DE 19901
Hello@OwlDoor.com
    `.trim();

    await supabase.functions.invoke("send-email-sendgrid", {
      body: {
        to: sanitizedEmail,
        subject: "We received your message - OwlDoor",
        text: confirmationText,
        html: confirmationHtml,
      },
    });

    console.log("Contact form emails sent successfully");
    
    // Log successful request
    const duration = Date.now() - startTime;
    await supabase.rpc('log_request', {
      p_level: 'info',
      p_message: 'Contact form submitted successfully',
      p_endpoint: 'send-contact-email',
      p_request_id: requestId,
      p_status_code: 200,
      p_duration_ms: duration,
      p_metadata: { email: sanitizedEmail }
    });

    return new Response(
      JSON.stringify({ success: true, message: "Emails sent successfully" }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error("Error in send-contact-email:", error);
    
    // Log error
    const duration = Date.now() - startTime;
    await supabase.rpc('log_request', {
      p_level: 'error',
      p_message: 'Contact form submission failed',
      p_endpoint: 'send-contact-email',
      p_request_id: requestId,
      p_status_code: 500,
      p_duration_ms: duration,
      p_error_message: error instanceof Error ? error.message : 'Unknown error'
    });
    
    return new Response(
      JSON.stringify({ error: 'Failed to send message. Please try again.' }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
