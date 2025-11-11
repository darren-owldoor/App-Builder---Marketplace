import { supabase } from '@/integrations/supabase/client';
import { lookupZipCode } from '@/utils/zipCodeLookup';

export interface GeocodeResult {
  city: string;
  county?: string;
  state: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
  source: 'local' | 'google' | 'nominatim' | 'mapbox';
}

export interface GeocodeRequest {
  zip?: string;
  city?: string;
  state?: string;
  address?: string;
  country?: string;
}

/**
 * Multi-tier geocoding service with automatic fallbacks:
 * 1. Local ZIP database (instant, free)
 * 2. Google Maps API (primary, requires API key)
 * 3. Nominatim/OSM (free backup, rate limited)
 * 4. Mapbox (secondary backup, requires API key)
 */
export class GeocodingService {
  private static readonly NOMINATIM_URL = 'https://nominatim.openstreetmap.org/search';
  private static readonly NOMINATIM_REVERSE_URL = 'https://nominatim.openstreetmap.org/reverse';
  private static readonly RATE_LIMIT_DELAY = 1000; // Nominatim requires 1 req/sec
  private static lastNominatimCall = 0;

  /**
   * Main geocoding method with automatic fallbacks
   */
  static async geocode(request: GeocodeRequest): Promise<GeocodeResult | null> {
    console.log('[GeocodingService] Starting geocode request:', request);

    // Tier 1: Local ZIP database (instant, free, offline)
    if (request.zip) {
      const localResult = await this.geocodeFromLocalZip(request.zip);
      if (localResult) {
        console.log('[GeocodingService] ✓ Local ZIP lookup successful');
        return localResult;
      }
    }

    // Tier 2: Google Maps API (primary service)
    const googleResult = await this.geocodeWithGoogle(request);
    if (googleResult) {
      console.log('[GeocodingService] ✓ Google Maps geocoding successful');
      return googleResult;
    }

    // Tier 3: Nominatim/OpenStreetMap (free backup)
    const nominatimResult = await this.geocodeWithNominatim(request);
    if (nominatimResult) {
      console.log('[GeocodingService] ✓ Nominatim geocoding successful');
      return nominatimResult;
    }

    // Tier 4: Mapbox (secondary backup)
    const mapboxResult = await this.geocodeWithMapbox(request);
    if (mapboxResult) {
      console.log('[GeocodingService] ✓ Mapbox geocoding successful');
      return mapboxResult;
    }

    console.error('[GeocodingService] ✗ All geocoding methods failed');
    return null;
  }

  /**
   * Tier 1: Local ZIP database lookup
   */
  private static async geocodeFromLocalZip(zip: string): Promise<GeocodeResult | null> {
    try {
      const zipInfo = await lookupZipCode(zip);
      if (zipInfo) {
        return {
          city: zipInfo.city,
          county: zipInfo.county,
          state: zipInfo.state,
          stateCode: zipInfo.stateCode,
          latitude: zipInfo.latitude,
          longitude: zipInfo.longitude,
          formatted_address: `${zipInfo.city}, ${zipInfo.stateCode} ${zipInfo.zip}`,
          source: 'local'
        };
      }
    } catch (error) {
      console.warn('[GeocodingService] Local ZIP lookup failed:', error);
    }
    return null;
  }

  /**
   * Tier 2: Google Maps Geocoding API
   */
  private static async geocodeWithGoogle(request: GeocodeRequest): Promise<GeocodeResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('geocode', {
        body: request,
      });

      if (error || !data?.success) {
        throw new Error(error?.message || 'Google geocoding failed');
      }

      return {
        city: data.result.city,
        county: data.result.county,
        state: data.result.state,
        stateCode: data.result.state_code,
        latitude: data.result.lat,
        longitude: data.result.lng,
        formatted_address: data.result.formatted_address,
        source: 'google'
      };
    } catch (error) {
      console.warn('[GeocodingService] Google geocoding failed:', error);
      return null;
    }
  }

  /**
   * Tier 3: Nominatim (OpenStreetMap) - Free backup
   */
  private static async geocodeWithNominatim(request: GeocodeRequest): Promise<GeocodeResult | null> {
    try {
      // Rate limiting: Wait if needed
      const now = Date.now();
      const timeSinceLastCall = now - this.lastNominatimCall;
      if (timeSinceLastCall < this.RATE_LIMIT_DELAY) {
        await new Promise(resolve => setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastCall));
      }
      this.lastNominatimCall = Date.now();

      // Build search query
      const queryParts: string[] = [];
      if (request.address) queryParts.push(request.address);
      if (request.city) queryParts.push(request.city);
      if (request.state) queryParts.push(request.state);
      if (request.zip) queryParts.push(request.zip);
      
      const query = queryParts.join(', ');
      if (!query) return null;

      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '1',
        countrycodes: request.country || 'us'
      });

      const response = await fetch(`${this.NOMINATIM_URL}?${params}`, {
        headers: {
          'User-Agent': 'OwlDoor/1.0' // Nominatim requires User-Agent
        }
      });

      if (!response.ok) throw new Error(`Nominatim HTTP ${response.status}`);

      const results = await response.json();
      if (!results || results.length === 0) return null;

      const result = results[0];
      const address = result.address || {};

      return {
        city: address.city || address.town || address.village || '',
        county: address.county || '',
        state: address.state || '',
        stateCode: this.getStateCode(address.state || ''),
        latitude: parseFloat(result.lat),
        longitude: parseFloat(result.lon),
        formatted_address: result.display_name,
        source: 'nominatim'
      };
    } catch (error) {
      console.warn('[GeocodingService] Nominatim geocoding failed:', error);
      return null;
    }
  }

  /**
   * Tier 4: Mapbox Geocoding API
   */
  private static async geocodeWithMapbox(request: GeocodeRequest): Promise<GeocodeResult | null> {
    try {
      const { data, error } = await supabase.functions.invoke('get-maps-config');
      if (error || !data?.mapboxToken) {
        console.warn('[GeocodingService] Mapbox token not available');
        return null;
      }

      // Build search query
      const queryParts: string[] = [];
      if (request.address) queryParts.push(request.address);
      if (request.city) queryParts.push(request.city);
      if (request.state) queryParts.push(request.state);
      if (request.zip) queryParts.push(request.zip);
      
      const query = encodeURIComponent(queryParts.join(', '));
      if (!query) return null;

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${query}.json?access_token=${data.mapboxToken}&country=us&limit=1`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Mapbox HTTP ${response.status}`);

      const result = await response.json();
      if (!result.features || result.features.length === 0) return null;

      const feature = result.features[0];
      const [lng, lat] = feature.center;
      
      // Extract address components
      let city = '', state = '', stateCode = '', county = '';
      feature.context?.forEach((ctx: any) => {
        if (ctx.id.startsWith('place.')) city = ctx.text;
        if (ctx.id.startsWith('region.')) {
          state = ctx.text;
          stateCode = ctx.short_code?.replace('US-', '') || '';
        }
        if (ctx.id.startsWith('district.')) county = ctx.text;
      });

      return {
        city,
        county,
        state,
        stateCode,
        latitude: lat,
        longitude: lng,
        formatted_address: feature.place_name,
        source: 'mapbox'
      };
    } catch (error) {
      console.warn('[GeocodingService] Mapbox geocoding failed:', error);
      return null;
    }
  }

  /**
   * Batch geocode multiple locations with automatic fallbacks
   */
  static async batchGeocode(requests: GeocodeRequest[]): Promise<(GeocodeResult | null)[]> {
    const results: (GeocodeResult | null)[] = [];
    
    for (const request of requests) {
      const result = await this.geocode(request);
      results.push(result);
      
      // Small delay between batch requests to respect rate limits
      await new Promise(resolve => setTimeout(resolve, 200));
    }
    
    return results;
  }

  /**
   * Helper: Convert state name to state code
   */
  private static getStateCode(stateName: string): string {
    const stateMap: Record<string, string> = {
      'Alabama': 'AL', 'Alaska': 'AK', 'Arizona': 'AZ', 'Arkansas': 'AR',
      'California': 'CA', 'Colorado': 'CO', 'Connecticut': 'CT', 'Delaware': 'DE',
      'Florida': 'FL', 'Georgia': 'GA', 'Hawaii': 'HI', 'Idaho': 'ID',
      'Illinois': 'IL', 'Indiana': 'IN', 'Iowa': 'IA', 'Kansas': 'KS',
      'Kentucky': 'KY', 'Louisiana': 'LA', 'Maine': 'ME', 'Maryland': 'MD',
      'Massachusetts': 'MA', 'Michigan': 'MI', 'Minnesota': 'MN', 'Mississippi': 'MS',
      'Missouri': 'MO', 'Montana': 'MT', 'Nebraska': 'NE', 'Nevada': 'NV',
      'New Hampshire': 'NH', 'New Jersey': 'NJ', 'New Mexico': 'NM', 'New York': 'NY',
      'North Carolina': 'NC', 'North Dakota': 'ND', 'Ohio': 'OH', 'Oklahoma': 'OK',
      'Oregon': 'OR', 'Pennsylvania': 'PA', 'Rhode Island': 'RI', 'South Carolina': 'SC',
      'South Dakota': 'SD', 'Tennessee': 'TN', 'Texas': 'TX', 'Utah': 'UT',
      'Vermont': 'VT', 'Virginia': 'VA', 'Washington': 'WA', 'West Virginia': 'WV',
      'Wisconsin': 'WI', 'Wyoming': 'WY'
    };
    return stateMap[stateName] || stateName;
  }
}
