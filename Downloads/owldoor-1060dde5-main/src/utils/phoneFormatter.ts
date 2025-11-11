/**
 * Formats a phone number to E.164 format for Twilio
 * E.164 format: +[country code][subscriber number including area code]
 * Example: +18888888253
 */
export function formatPhoneForTwilio(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-digit characters
  const digits = phone.replace(/\D/g, '');
  
  // If already starts with country code (11 digits), add +
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+${digits}`;
  }
  
  // If 10 digits (US number without country code), add +1
  if (digits.length === 10) {
    return `+1${digits}`;
  }
  
  // If already formatted correctly
  if (phone.startsWith('+1') && digits.length === 11) {
    return phone;
  }
  
  // Return original if we can't determine format
  console.warn(`Unable to format phone number: ${phone}`);
  return phone;
}

/**
 * Formats a phone number for display (US format)
 * Example: (888) 888-8253
 */
export function formatPhoneForDisplay(phone: string): string {
  if (!phone) return '';
  
  const digits = phone.replace(/\D/g, '');
  
  // Format 10-digit US numbers
  if (digits.length === 10) {
    return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  
  // Format 11-digit numbers (with country code)
  if (digits.length === 11 && digits.startsWith('1')) {
    return `+1 (${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
  }
  
  return phone;
}

/**
 * Validates if a phone number is in correct E.164 format
 */
export function isValidE164Phone(phone: string): boolean {
  // E.164 format: +[1-15 digits]
  const e164Regex = /^\+[1-9]\d{1,14}$/;
  return e164Regex.test(phone);
}

/**
 * Validates if a phone number is a valid US phone number
 */
export function isValidUSPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length === 10 || (digits.length === 11 && digits.startsWith('1'));
}
