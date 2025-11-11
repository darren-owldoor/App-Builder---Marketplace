import { supabase } from "@/integrations/supabase/client";
import { formatPhoneForTwilio } from "@/utils/phoneFormatter";

export interface ConsentLogData {
  phone_number: string;
  consent_given: boolean;
  consent_method: 'website' | 'sms' | 'phone' | 'verbal';
  consent_text: string;
  ip_address?: string;
  double_opt_in_confirmed?: boolean;
}

/**
 * Log SMS consent for TCPA compliance
 */
export async function logSMSConsent(data: ConsentLogData): Promise<{ success: boolean; error?: string }> {
  try {
    // Format phone to E.164 before logging
    const formattedData = {
      ...data,
      phone_number: formatPhoneForTwilio(data.phone_number)
    };
    
    const { data: result, error } = await supabase.functions.invoke('log-sms-consent', {
      body: formattedData
    });

    if (error) {
      console.error('Error logging SMS consent:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error logging SMS consent:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if SMS can be sent to a phone number (consent verification)
 */
export async function canSendSMS(phoneNumber: string): Promise<{
  can_send: boolean;
  reason?: string;
  message?: string;
}> {
  try {
    // Format phone to E.164 before checking
    const formattedPhone = formatPhoneForTwilio(phoneNumber);
    
    const { data, error } = await supabase.functions.invoke('check-sms-consent', {
      body: { phone_number: formattedPhone }
    });

    if (error) {
      console.error('Error checking SMS consent:', error);
      return { can_send: false, reason: 'error', message: error.message };
    }

    return data;
  } catch (error) {
    console.error('Error checking SMS consent:', error);
    return { 
      can_send: false, 
      reason: 'error',
      message: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Log SMS opt-out for TCPA compliance
 */
export async function logSMSOptOut(
  phoneNumber: string, 
  method: 'sms' | 'phone' | 'website' | 'email' = 'sms'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Format phone to E.164 before logging
    const formattedPhone = formatPhoneForTwilio(phoneNumber);
    
    const { data, error } = await supabase.functions.invoke('log-sms-opt-out', {
      body: { 
        phone_number: formattedPhone,
        opt_out_method: method
      }
    });

    if (error) {
      console.error('Error logging SMS opt-out:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error logging SMS opt-out:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get user's IP address for consent logging
 */
export async function getUserIP(): Promise<string | undefined> {
  try {
    const response = await fetch('https://api.ipify.org?format=json');
    const data = await response.json();
    return data.ip;
  } catch (error) {
    console.error('Error getting user IP:', error);
    return undefined;
  }
}
