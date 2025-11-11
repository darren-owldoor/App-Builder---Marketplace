import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// State name to abbreviation mapping
const STATE_MAP: Record<string, string> = {
  'alabama': 'AL', 'al': 'AL',
  'alaska': 'AK', 'ak': 'AK',
  'arizona': 'AZ', 'az': 'AZ',
  'arkansas': 'AR', 'ar': 'AR',
  'california': 'CA', 'ca': 'CA',
  'colorado': 'CO', 'co': 'CO',
  'connecticut': 'CT', 'ct': 'CT',
  'delaware': 'DE', 'de': 'DE',
  'florida': 'FL', 'fl': 'FL',
  'georgia': 'GA', 'ga': 'GA',
  'hawaii': 'HI', 'hi': 'HI',
  'idaho': 'ID', 'id': 'ID',
  'illinois': 'IL', 'il': 'IL',
  'indiana': 'IN', 'in': 'IN',
  'iowa': 'IA', 'ia': 'IA',
  'kansas': 'KS', 'ks': 'KS',
  'kentucky': 'KY', 'ky': 'KY',
  'louisiana': 'LA', 'la': 'LA',
  'maine': 'ME', 'me': 'ME',
  'maryland': 'MD', 'md': 'MD',
  'massachusetts': 'MA', 'ma': 'MA',
  'michigan': 'MI', 'mi': 'MI',
  'minnesota': 'MN', 'mn': 'MN',
  'mississippi': 'MS', 'ms': 'MS',
  'missouri': 'MO', 'mo': 'MO',
  'montana': 'MT', 'mt': 'MT',
  'nebraska': 'NE', 'ne': 'NE',
  'nevada': 'NV', 'nv': 'NV',
  'new hampshire': 'NH', 'nh': 'NH',
  'new jersey': 'NJ', 'nj': 'NJ',
  'new mexico': 'NM', 'nm': 'NM',
  'new york': 'NY', 'ny': 'NY',
  'north carolina': 'NC', 'nc': 'NC',
  'north dakota': 'ND', 'nd': 'ND',
  'ohio': 'OH', 'oh': 'OH',
  'oklahoma': 'OK', 'ok': 'OK',
  'oregon': 'OR', 'or': 'OR',
  'pennsylvania': 'PA', 'pa': 'PA',
  'rhode island': 'RI', 'ri': 'RI',
  'south carolina': 'SC', 'sc': 'SC',
  'south dakota': 'SD', 'sd': 'SD',
  'tennessee': 'TN', 'tn': 'TN',
  'texas': 'TX', 'tx': 'TX',
  'utah': 'UT', 'ut': 'UT',
  'vermont': 'VT', 'vt': 'VT',
  'virginia': 'VA', 'va': 'VA',
  'washington': 'WA', 'wa': 'WA',
  'west virginia': 'WV', 'wv': 'WV',
  'wisconsin': 'WI', 'wi': 'WI',
  'wyoming': 'WY', 'wy': 'WY',
  'washington dc': 'DC', 'dc': 'DC'
};

export function normalizeState(state: string): string {
  const normalized = state.trim().toLowerCase();
  return STATE_MAP[normalized] || state.toUpperCase();
}

export function normalizePhone(phone: string): string {
  // Remove all non-numeric characters
  const digits = phone.replace(/\D/g, '');
  
  // If it starts with 1 and has 11 digits, remove the leading 1
  if (digits.length === 11 && digits.startsWith('1')) {
    return digits.substring(1);
  }
  
  // Return the 10-digit number
  return digits.length === 10 ? digits : phone;
}

export function calculateQualificationPercentage(record: any, requiredFields: string[]): number {
  let filledCount = 0;
  
  for (const field of requiredFields) {
    const value = record[field];
    if (value !== null && value !== undefined && value !== '') {
      filledCount++;
    }
  }
  
  return Math.round((filledCount / requiredFields.length) * 100);
}

export function formatNumber(num: number | string | null | undefined): string {
  if (num === null || num === undefined) return '0';
  
  const value = typeof num === 'string' ? parseFloat(num) : num;
  
  if (isNaN(value)) return '0';
  
  const absValue = Math.abs(value);
  const sign = value < 0 ? '-' : '';
  
  if (absValue >= 1_000_000_000) {
    return sign + (absValue / 1_000_000_000).toFixed(1).replace(/\.0$/, '') + 'B';
  }
  if (absValue >= 1_000_000) {
    return sign + (absValue / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  }
  if (absValue >= 10_000) {
    return sign + (absValue / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  }
  
  return sign + absValue.toLocaleString();
}
