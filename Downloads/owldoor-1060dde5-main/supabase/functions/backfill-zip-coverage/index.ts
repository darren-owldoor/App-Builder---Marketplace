import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface GeocodeResult {
  zip: string;
  city: string;
  state: string;
  lat: number;
  lng: number;
}

async function geocodeLocation(city: string, state: string): Promise<GeocodeResult | null> {
  const apiKey = Deno.env.get("GOOGLE_MAPS_API_KEY");
  if (!apiKey) {
    console.error("Google Maps API key not found");
    return null;
  }

  const address = `${city}, ${state}, USA`;
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "OK" && data.results && data.results.length > 0) {
      const result = data.results[0];
      const addressComponents = result.address_components;
      
      // Extract ZIP code
      const zipComponent = addressComponents.find((c: any) => 
        c.types.includes("postal_code")
      );

      if (!zipComponent) {
        console.log(`No ZIP found for ${city}, ${state}`);
        return null;
      }

      const location = result.geometry.location;
      
      return {
        zip: zipComponent.short_name,
        city: city,
        state: state,
        lat: location.lat,
        lng: location.lng
      };
    }
    
    console.log(`Geocoding failed for ${city}, ${state}: ${data.status}`);
    return null;
  } catch (error) {
    console.error(`Error geocoding ${city}, ${state}:`, error);
    return null;
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    console.log("🚀 Starting backfill for clients and pros without zip codes...");

    let clientsUpdated = 0;
    let prosUpdated = 0;
    let clientsSkipped = 0;
    let prosSkipped = 0;

    // ============================================
    // BACKFILL CLIENTS
    // ============================================
    console.log("\n📍 Processing CLIENTS...");
    
    const { data: clients, error: clientsError } = await supabase
      .from("clients")
      .select("id, company_name, cities, states, zip_codes")
      .or("zip_codes.is.null,zip_codes.eq.{}");

    if (clientsError) {
      console.error("Error fetching clients:", clientsError);
    } else if (clients) {
      console.log(`Found ${clients.length} clients without zip codes`);

      for (const client of clients) {
        // Skip if no cities or states
        if (!client.cities || client.cities.length === 0 || !client.states || client.states.length === 0) {
          console.log(`⏭️  Skipping ${client.company_name}: No cities or states`);
          clientsSkipped++;
          continue;
        }

        const city = client.cities[0];
        const state = client.states[0];

        console.log(`  Processing ${client.company_name} (${city}, ${state})...`);

        const geocodeResult = await geocodeLocation(city, state);
        
        if (!geocodeResult) {
          console.log(`  ❌ Failed to geocode ${client.company_name}`);
          clientsSkipped++;
          continue;
        }

        // Update client with zip code
        const { error: updateError } = await supabase
          .from("clients")
          .update({
            zip_codes: [geocodeResult.zip]
          })
          .eq("id", client.id);

        if (updateError) {
          console.error(`  ❌ Failed to update ${client.company_name}:`, updateError);
          clientsSkipped++;
          continue;
        }

        // Create a 25-mile radius bid if they don't have any active bids
        const { data: existingBids } = await supabase
          .from("bids")
          .select("id")
          .eq("client_id", client.id)
          .eq("active", true)
          .limit(1);

        if (!existingBids || existingBids.length === 0) {
          console.log(`  📍 Creating 25-mile radius bid for ${client.company_name}`);
          
          const { error: bidError } = await supabase
            .from("bids")
            .insert({
              client_id: client.id,
              pro_type: "real_estate",
              cities: [city],
              states: [state],
              zip_codes: [geocodeResult.zip],
              active: true,
              bid_amount: 50,
              min_experience: 0,
              min_transactions: 0,
              radius_data: {
                centerZip: geocodeResult.zip,
                centerCity: city,
                centerState: state,
                radiusMiles: 25,
                centerCoordinates: {
                  lat: geocodeResult.lat,
                  lng: geocodeResult.lng
                }
              }
            });

          if (bidError) {
            console.error(`  ⚠️  Failed to create bid for ${client.company_name}:`, bidError);
          } else {
            console.log(`  ✅ Created 25-mile radius bid`);
          }
        }

        console.log(`  ✅ Updated ${client.company_name} with ZIP ${geocodeResult.zip}`);
        clientsUpdated++;

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // ============================================
    // BACKFILL PROS/AGENTS
    // ============================================
    console.log("\n👥 Processing PROS/AGENTS...");
    
    const { data: pros, error: prosError } = await supabase
      .from("pros")
      .select("id, full_name, cities, states, zip_codes")
      .or("zip_codes.is.null,zip_codes.eq.{}");

    if (prosError) {
      console.error("Error fetching pros:", prosError);
    } else if (pros) {
      console.log(`Found ${pros.length} pros without zip codes`);

      for (const pro of pros) {
        // Skip if no cities or states
        if (!pro.cities || pro.cities.length === 0 || !pro.states || pro.states.length === 0) {
          console.log(`⏭️  Skipping ${pro.full_name}: No cities or states`);
          prosSkipped++;
          continue;
        }

        const city = pro.cities[0];
        const state = pro.states[0];

        console.log(`  Processing ${pro.full_name} (${city}, ${state})...`);

        const geocodeResult = await geocodeLocation(city, state);
        
        if (!geocodeResult) {
          console.log(`  ❌ Failed to geocode ${pro.full_name}`);
          prosSkipped++;
          continue;
        }

        // Update pro with zip code
        const { error: updateError } = await supabase
          .from("pros")
          .update({
            zip_codes: [geocodeResult.zip]
          })
          .eq("id", pro.id);

        if (updateError) {
          console.error(`  ❌ Failed to update ${pro.full_name}:`, updateError);
          prosSkipped++;
          continue;
        }

        // Create market_coverage with 25-mile radius
        const { data: existingCoverage } = await supabase
          .from("market_coverage")
          .select("id")
          .eq("pro_id", pro.id)
          .limit(1);

        if (!existingCoverage || existingCoverage.length === 0) {
          console.log(`  📍 Creating 25-mile market coverage for ${pro.full_name}`);
          
          const { error: coverageError } = await supabase
            .from("market_coverage")
            .insert({
              pro_id: pro.id,
              name: `${city}, ${state} (25mi)`,
              coverage_type: "radius",
              data: {
                centerZip: geocodeResult.zip,
                centerCity: city,
                centerState: state,
                centerCoordinates: {
                  lat: geocodeResult.lat,
                  lng: geocodeResult.lng
                },
                radiusMiles: 25,
                zipCodes: [geocodeResult.zip],
                cities: [city],
                states: [state]
              }
            });

          if (coverageError) {
            console.error(`  ⚠️  Failed to create coverage for ${pro.full_name}:`, coverageError);
          } else {
            console.log(`  ✅ Created 25-mile market coverage`);
          }
        }

        console.log(`  ✅ Updated ${pro.full_name} with ZIP ${geocodeResult.zip}`);
        prosUpdated++;

        // Rate limiting - wait 100ms between requests
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // ============================================
    // SUMMARY
    // ============================================
    console.log("\n📊 BACKFILL SUMMARY:");
    console.log(`   Clients updated: ${clientsUpdated}`);
    console.log(`   Clients skipped: ${clientsSkipped}`);
    console.log(`   Pros updated: ${prosUpdated}`);
    console.log(`   Pros skipped: ${prosSkipped}`);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          clients: {
            updated: clientsUpdated,
            skipped: clientsSkipped,
            total: clients?.length || 0
          },
          pros: {
            updated: prosUpdated,
            skipped: prosSkipped,
            total: pros?.length || 0
          }
        }
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("❌ Fatal error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
