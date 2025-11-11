import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Input validation schema
const geocodeSchema = z.object({
  address: z.string().trim().max(500).optional(),
  city: z.string().trim().max(100).optional(),
  state: z.string().trim().max(100).optional(),
  zip: z.string().trim().regex(/^\d{5}(-\d{4})?$/).optional(),
  lat: z.number().min(-90).max(90).optional(),
  lng: z.number().min(-180).max(180).optional(),
}).refine(
  (data) => {
    // Must have either lat/lng OR at least one address field
    const hasLatLng = data.lat !== undefined && data.lng !== undefined;
    const hasAddress = data.address || data.city || data.state || data.zip;
    return hasLatLng || hasAddress;
  },
  { message: "Must provide either coordinates (lat/lng) or address components" }
);

interface GeocodeRequest {
  address?: string;
  city?: string;
  state?: string;
  zip?: string;
  lat?: number;
  lng?: number;
}

interface GeocodeResult {
  formatted_address: string;
  street_number?: string;
  street_name?: string;
  city: string;
  county: string;
  state: string;
  state_code: string;
  zip: string;
  country: string;
  lat: number;
  lng: number;
  place_id: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const GOOGLE_MAPS_API_KEY = Deno.env.get("GOOGLE_MAPS_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error("Google Maps API key not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase configuration missing");
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Rate limiting - 100 requests per hour per IP
    const ipAddress = req.headers.get("x-forwarded-for")?.split(",")[0] || "unknown";
    
    const { data: rateLimitOk } = await supabase.rpc("check_rate_limit", {
      p_identifier: ipAddress,
      p_endpoint: "geocode",
      p_max_requests: 100,
      p_window_minutes: 60,
    });

    if (!rateLimitOk) {
      console.log("Rate limit exceeded for IP:", ipAddress);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Rate limit exceeded. Please try again later." 
        }),
        {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const rawBody = await req.json();
    
    // Validate input
    const validationResult = geocodeSchema.safeParse(rawBody);
    if (!validationResult.success) {
      console.error("Validation error:", validationResult.error);
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: "Invalid input data",
          details: validationResult.error.errors 
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const body = validationResult.data;
    
    let geocodeUrl = "https://maps.googleapis.com/maps/api/geocode/json?";
    
    // Build geocoding query
    if (body.lat && body.lng) {
      // Reverse geocoding (lat/lng to address)
      geocodeUrl += `latlng=${body.lat},${body.lng}`;
    } else {
      // Forward geocoding (address to lat/lng)
      const addressParts = [];
      if (body.address) addressParts.push(body.address);
      if (body.city) addressParts.push(body.city);
      if (body.state) addressParts.push(body.state);
      if (body.zip) addressParts.push(body.zip);
      
      if (addressParts.length === 0) {
        throw new Error("No location data provided");
      }
      
      const address = addressParts.join(", ");
      geocodeUrl += `address=${encodeURIComponent(address)}`;
    }
    
    geocodeUrl += `&key=${GOOGLE_MAPS_API_KEY}`;

    console.log("Geocoding URL:", geocodeUrl.replace(GOOGLE_MAPS_API_KEY, "HIDDEN"));

    // Call Google Geocoding API
    const response = await fetch(geocodeUrl);
    const data = await response.json();

    if (data.status !== "OK" || !data.results || data.results.length === 0) {
      throw new Error(`Geocoding failed: ${data.status}`);
    }

    const result = data.results[0];
    const location = result.geometry.location;
    
    // Extract address components
    const components = result.address_components;
    
    const getComponent = (type: string, longName = true) => {
      const component = components.find((c: any) => c.types.includes(type));
      return component ? (longName ? component.long_name : component.short_name) : "";
    };

    const geocodeResult: GeocodeResult = {
      formatted_address: result.formatted_address,
      street_number: getComponent("street_number"),
      street_name: getComponent("route"),
      city: getComponent("locality") || 
            getComponent("sublocality") || 
            getComponent("administrative_area_level_3") ||
            getComponent("postal_town"),
      county: getComponent("administrative_area_level_2"), // This is the county
      state: getComponent("administrative_area_level_1"),
      state_code: getComponent("administrative_area_level_1", false),
      zip: getComponent("postal_code"),
      country: getComponent("country"),
      lat: location.lat,
      lng: location.lng,
      place_id: result.place_id,
    };

    console.log("Geocoding result:", geocodeResult);

    return new Response(
      JSON.stringify({ success: true, result: geocodeResult }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Geocoding error:", error);
    const errorMessage = error instanceof Error ? error.message : "Geocoding failed";
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
