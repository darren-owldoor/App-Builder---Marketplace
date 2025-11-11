import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface GooglePlaceResult {
  formatted_address: string;
  place_id: string;
  geometry: {
    location: { lat: number; lng: number };
  };
  address_components: Array<{
    long_name: string;
    short_name: string;
    types: string[];
  }>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const GOOGLE_API_KEY = Deno.env.get('GOOGLE_MAPS_API_KEY');
    if (!GOOGLE_API_KEY) {
      console.error('Google Maps API key not configured');
      throw new Error('Google Maps API key not configured');
    }

    const { action, query, lat, lng, radius, zipCodes } = await req.json();
    console.log('Zip-radius-geocode called with action:', action);

    // Action: autocomplete - Get location suggestions
    if (action === 'autocomplete') {
      const autocompleteUrl = `https://maps.googleapis.com/maps/api/place/autocomplete/json?input=${encodeURIComponent(query)}&types=(regions)&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(autocompleteUrl);
      const data = await response.json();
      
      if (data.status !== 'OK' && data.status !== 'ZERO_RESULTS') {
        throw new Error(`Google API error: ${data.status}`);
      }

      return new Response(
        JSON.stringify({ 
          suggestions: data.predictions || [],
          status: data.status 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: geocode - Get coordinates for a location
    if (action === 'geocode') {
      const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(query)}&key=${GOOGLE_API_KEY}`;
      
      const response = await fetch(geocodeUrl);
      const data = await response.json();
      
      if (data.status !== 'OK') {
        throw new Error(`Geocoding failed: ${data.status}`);
      }

      const result: GooglePlaceResult = data.results[0];
      const addressData = {
        latitude: result.geometry.location.lat,
        longitude: result.geometry.location.lng,
        formatted_address: result.formatted_address,
        place_id: result.place_id,
        city: result.address_components.find(c => c.types.includes('locality'))?.long_name || '',
        county: result.address_components.find(c => c.types.includes('administrative_area_level_2'))?.long_name || '',
        state: result.address_components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '',
        state_long: result.address_components.find(c => c.types.includes('administrative_area_level_1'))?.long_name || '',
        country: result.address_components.find(c => c.types.includes('country'))?.long_name || '',
        zip: result.address_components.find(c => c.types.includes('postal_code'))?.short_name || '',
      };

      return new Response(
        JSON.stringify(addressData),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: findZipsInRadius - Find ZIP codes within radius of a point
    if (action === 'findZipsInRadius') {
      if (!lat || !lng || !radius) {
        throw new Error('Missing lat, lng, or radius parameters');
      }

      // This is a simplified version - in production, you'd want to use a more
      // comprehensive ZIP code database or Google's Places API
      // For now, we'll return a structure that the client can use
      
      return new Response(
        JSON.stringify({ 
          center: { lat, lng },
          radius,
          message: 'ZIP code radius search requires a ZIP database. Use the scraper script provided or integrate with a ZIP code service.'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Action: geocodeBatch - Geocode multiple ZIP codes
    if (action === 'geocodeBatch') {
      if (!zipCodes || !Array.isArray(zipCodes)) {
        throw new Error('zipCodes array is required');
      }

      const results = [];
      
      // Process in batches to respect rate limits
      for (const zip of zipCodes) {
        try {
          const geocodeUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(zip)}&components=country:US&key=${GOOGLE_API_KEY}`;
          
          const response = await fetch(geocodeUrl);
          const data = await response.json();
          
          if (data.status === 'OK' && data.results[0]) {
            const result: GooglePlaceResult = data.results[0];
            results.push({
              zip,
              success: true,
              latitude: result.geometry.location.lat,
              longitude: result.geometry.location.lng,
              formatted_address: result.formatted_address,
              city: result.address_components.find(c => c.types.includes('locality'))?.long_name || '',
              county: result.address_components.find(c => c.types.includes('administrative_area_level_2'))?.long_name || '',
              state: result.address_components.find(c => c.types.includes('administrative_area_level_1'))?.short_name || '',
            });
          } else {
            results.push({
              zip,
              success: false,
              error: data.status,
            });
          }
          
          // Small delay to respect rate limits
          await new Promise(resolve => setTimeout(resolve, 100));
        } catch (error) {
          results.push({
            zip,
            success: false,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }

      return new Response(
        JSON.stringify({ results }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    throw new Error('Invalid action. Supported actions: autocomplete, geocode, findZipsInRadius, geocodeBatch');

  } catch (error) {
    console.error('Error in zip-radius-geocode function:', error);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
