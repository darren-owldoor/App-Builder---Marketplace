import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface Coordinate {
  lat: number;
  lng: number;
}

interface ZipRadius {
  zip: string;
  radius: number;
}

Deno.serve(async (req: Request) => {
  console.log('geocode-area function called');
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    
    // Create Supabase client for authentication and rate limiting
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // SECURITY: Require authentication
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Rate limit: 100 requests per hour per user
    const { data: canProceed, error: rateLimitError } = await supabase.rpc('check_rate_limit', {
      p_identifier: user.id,
      p_endpoint: 'geocode-area',
      p_max_requests: 100,
      p_window_minutes: 60
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
    }

    if (canProceed === false) {
      return new Response(
        JSON.stringify({ 
          error: 'Rate limit exceeded. Maximum 100 geocoding requests per hour.',
          retryAfter: 3600 
        }),
        { 
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const { coordinates, zipRadiuses, method } = await req.json();
    
    // Validate request size to prevent abuse
    if (coordinates && coordinates.length > 100) {
      return new Response(
        JSON.stringify({ error: 'Too many coordinates. Maximum 100 coordinates per request.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (zipRadiuses && zipRadiuses.length > 50) {
      return new Response(
        JSON.stringify({ error: 'Too many zip codes. Maximum 50 zip codes per request.' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const googleMapsKey = Deno.env.get('GOOGLE_MAPS_API_KEY');
    
    console.log('Geocode-area called with method:', method);
    console.log('Coordinates count:', coordinates?.length);
    console.log('ZipRadiuses count:', zipRadiuses?.length);
    
    if (!googleMapsKey) {
      console.error('Google Maps API key not configured');
      return new Response(
        JSON.stringify({ error: 'Google Maps API key not configured' }),
        { 
          status: 500, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    let zipCodes: string[] = [];
    let cities: string[] = [];
    let states: string[] = [];
    let counties: string[] = [];
    let allCoordinates: Coordinate[] = [];

    if (method === 'draw' && coordinates?.length > 0) {
      // For drawn areas, reverse geocode key points and find zip codes
      allCoordinates = coordinates;
      
      console.log('Processing drawn area with', coordinates.length, 'coordinates');
      
      // Sample points from the polygon (every 10th point to reduce API calls)
      const samplePoints = coordinates.filter((_: Coordinate, i: number) => i % 10 === 0);
      
      console.log('Sampling', samplePoints.length, 'points for geocoding');
      
      for (const coord of samplePoints) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coord.lat},${coord.lng}&key=${googleMapsKey}`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const result = data.results[0];
          
          // Extract zip code
          const zipComponent = result.address_components?.find((c: any) => 
            c.types.includes('postal_code')
          );
          if (zipComponent && !zipCodes.includes(zipComponent.long_name)) {
            zipCodes.push(zipComponent.long_name);
          }
          
          // Extract city
          const cityComponent = result.address_components?.find((c: any) => 
            c.types.includes('locality')
          );
          if (cityComponent && !cities.includes(cityComponent.long_name)) {
            cities.push(cityComponent.long_name);
          }
          
          // Extract state
          const stateComponent = result.address_components?.find((c: any) => 
            c.types.includes('administrative_area_level_1')
          );
          if (stateComponent && !states.includes(stateComponent.short_name)) {
            states.push(stateComponent.short_name);
          }
          
          // Extract county
          const countyComponent = result.address_components?.find((c: any) => 
            c.types.includes('administrative_area_level_2')
          );
          if (countyComponent && !counties.includes(countyComponent.long_name)) {
            counties.push(countyComponent.long_name);
          }
        }
        
        // Rate limiting: wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else if (method === 'zip' && zipRadiuses?.length > 0) {
      // For zip+radius, geocode each zip and calculate coverage area
      for (const zr of zipRadiuses as ZipRadius[]) {
        // Add the zip to our list
        if (!zipCodes.includes(zr.zip)) {
          zipCodes.push(zr.zip);
        }
        
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${zr.zip}&key=${googleMapsKey}`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          
          // Add center coordinate
          allCoordinates.push({ lat: location.lat, lng: location.lng });
          
          // Calculate approximate bounding box for the radius
          // 1 degree latitude ≈ 69 miles, 1 degree longitude ≈ 54.6 miles at 45° latitude
          const radiusMiles = zr.radius;
          const latDelta = radiusMiles / 69;
          const lngDelta = radiusMiles / 54.6;
          
          // Add corner points
          allCoordinates.push(
            { lat: location.lat + latDelta, lng: location.lng },
            { lat: location.lat - latDelta, lng: location.lng },
            { lat: location.lat, lng: location.lng + lngDelta },
            { lat: location.lat, lng: location.lng - lngDelta }
          );
          
          // Find nearby cities within radius (sample a few points)
          const nearbyPoints = [
            { lat: location.lat + latDelta/2, lng: location.lng },
            { lat: location.lat - latDelta/2, lng: location.lng },
            { lat: location.lat, lng: location.lng + lngDelta/2 },
            { lat: location.lat, lng: location.lng - lngDelta/2 },
          ];
          
          for (const point of nearbyPoints) {
            const cityResponse = await fetch(
              `https://maps.googleapis.com/maps/api/geocode/json?latlng=${point.lat},${point.lng}&key=${googleMapsKey}`
            );
            const cityData = await cityResponse.json();
            
            if (cityData.results && cityData.results.length > 0) {
              const cityComponent = cityData.results[0].address_components?.find((c: any) => 
                c.types.includes('locality')
              );
              if (cityComponent && !cities.includes(cityComponent.long_name)) {
                cities.push(cityComponent.long_name);
              }
              
              // Extract state
              const stateComponent = cityData.results[0].address_components?.find((c: any) => 
                c.types.includes('administrative_area_level_1')
              );
              if (stateComponent && !states.includes(stateComponent.short_name)) {
                states.push(stateComponent.short_name);
              }
              
              // Extract county
              const countyComponent = cityData.results[0].address_components?.find((c: any) => 
                c.types.includes('administrative_area_level_2')
              );
              if (countyComponent && !counties.includes(countyComponent.long_name)) {
                counties.push(countyComponent.long_name);
              }
            }
            
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    } else if (method === 'cities' && Array.isArray(coordinates)) {
      // For cities input, geocode each city
      for (const city of coordinates as string[]) {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(city)}&key=${googleMapsKey}`
        );
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
          const location = data.results[0].geometry.location;
          cities.push(city);
          allCoordinates.push({ lat: location.lat, lng: location.lng });
          
          // Get the zip code for this city
          const zipComponent = data.results[0].address_components?.find((c: any) => 
            c.types.includes('postal_code')
          );
          if (zipComponent && !zipCodes.includes(zipComponent.long_name)) {
            zipCodes.push(zipComponent.long_name);
          }
          
          // Extract state
          const stateComponent = data.results[0].address_components?.find((c: any) => 
            c.types.includes('administrative_area_level_1')
          );
          if (stateComponent && !states.includes(stateComponent.short_name)) {
            states.push(stateComponent.short_name);
          }
          
          // Extract county
          const countyComponent = data.results[0].address_components?.find((c: any) => 
            c.types.includes('administrative_area_level_2')
          );
          if (countyComponent && !counties.includes(countyComponent.long_name)) {
            counties.push(countyComponent.long_name);
          }
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    return new Response(
      JSON.stringify({ 
        zipCodes: [...new Set(zipCodes)],
        cities: [...new Set(cities)],
        states: [...new Set(states)],
        counties: [...new Set(counties)],
        coordinates: allCoordinates,
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in geocode-area:', errorMessage);
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace');
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});
