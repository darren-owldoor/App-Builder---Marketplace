// Model Match Data Parser
// Works with Model Match data stored in database columns

export interface Lead {
  id?: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  
  // Contact Links
  linkedin_url?: string | null;
  facebook_url?: string | null;
  instagram_url?: string | null;
  twitter_url?: string | null;
  youtube_url?: string | null;
  website_url?: string | null;
  tiktok_url?: string | null;
  homes_com_url?: string | null;
  realtor_com_url?: string | null;
  
  // Additional Contact
  phone2?: string | null;
  email2?: string | null;
  
  // Professional Information
  company?: string;
  brokerage?: string;
  address?: string | null;
  
  // Volume Metrics
  total_volume?: number | null;
  total_units?: number | null;
  transactions?: number;
  buyer_volume?: number | null;
  buyer_financed?: number | null;
  buyer_units?: number | null;
  seller_volume?: number | null;
  seller_financed?: number | null;
  seller_units?: number | null;
  dual_volume?: number | null;
  dual_units?: number | null;
  
  // Percentage Metrics
  buyer_percentage?: number | null;
  seller_percentage?: number | null;
  percent_financed?: number | null;
  seller_side_percentage?: number | null;
  purchase_percentage?: number | null;
  conventional_percentage?: number | null;
  
  // Relationship Data
  top_lender?: string | null;
  top_lender_share?: number | null;
  top_lender_volume?: number | null;
  top_originator?: string | null;
  top_originator_share?: number | null;
  top_originator_volume?: number | null;
  
  // Calculated Metrics
  transactions_per_year?: number | null;
  
  // Price Range Data
  average_deal?: number | null;
  low_price_point?: number | null;
  high_price_point?: number | null;
  price_range?: string | null;
  
  // Location Data
  cities?: string[] | null;
  states?: string[] | null;
  
  // Metadata
  source?: string;
  date?: string | null;
  notes?: string | null;
  created_at?: string;
}

export interface BasicData {
  address: string;
  city: string;
  state: string;
}

export interface VolumeData {
  total: number;
  buyer: number;
  listing: number;
  dual: number;
}

export interface PercentageData {
  buyer: number;
  listing: number;
}

export interface ParsedModelMatchData {
  basic: BasicData;
  volumes: VolumeData;
  percentages: PercentageData;
  units: {
    buyer: number;
    listing: number;
    dual: number;
  };
}

// Parse volume string like "$49,612,137.00" to number 49612137
export function parseVolume(volume?: string): number {
  if (!volume) return 0;
  return parseFloat(volume.replace(/[$,]/g, '')) || 0;
}

// Parse percentage string like "81%" to number 81
export function parsePercentage(percent?: string): number {
  if (!percent) return 0;
  return parseFloat(percent.replace('%', '')) || 0;
}

// Format number as currency (e.g., 49612137 -> "$49.6M")
export function formatCurrency(amount: number): string {
  if (amount >= 1000000000) {
    return `$${(amount / 1000000000).toFixed(1).replace(/\.0$/, '')}B`;
  } else if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1).replace(/\.0$/, '')}M`;
  } else if (amount >= 10000) {
    return `$${(amount / 1000).toFixed(1).replace(/\.0$/, '')}k`;
  }
  return `$${amount.toLocaleString()}`;
}

// Format phone number (handles "0000000000" as unavailable)
export function formatPhone(phone: string): string {
  if (phone === '0000000000') {
    return 'Phone not available';
  }
  // Format as (XXX) XXX-XXXX
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}

// Main parser function - now reads from database columns
export function parseModelMatchData(lead: Lead): ParsedModelMatchData {
  return {
    basic: {
      address: lead.address || '',
      city: lead.cities?.[0] || '',
      state: lead.states?.[0] || ''
    },
    volumes: {
      total: lead.total_volume || 0,
      buyer: lead.buyer_volume || 0,
      listing: lead.seller_volume || 0,
      dual: lead.dual_volume || 0
    },
    percentages: {
      buyer: lead.buyer_percentage || 0,
      listing: lead.seller_percentage || 0
    },
    units: {
      buyer: lead.buyer_units || 0,
      listing: lead.seller_units || 0,
      dual: lead.dual_units || 0
    }
  };
}

// Calculate average deal size
export function calculateAverageDealSize(totalVolume: number, transactions: number): number {
  if (transactions === 0) return 0;
  return totalVolume / transactions;
}

// Get agent type badge based on percentages
export function getAgentTypeBadge(buyerPercent: number, listingPercent: number): string {
  if (buyerPercent > 60) return 'Buyer Focused';
  if (listingPercent > 60) return 'Listing Focused';
  return 'Balanced';
}

// Get volume tier badge
export function getVolumeTier(totalVolume: number): string {
  if (totalVolume >= 100000000) return 'Elite';
  if (totalVolume >= 50000000) return 'High Volume';
  if (totalVolume >= 25000000) return 'Mid Volume';
  if (totalVolume >= 10000000) return 'Emerging';
  return 'Entry Level';
}
