import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ZipResult {
  zipCode: string;
  city: string;
  state: string;
  latitude: number;
  longitude: number;
  distance: number;
}

interface ZipData {
  zipCode: string;
  city: string;
  state: string;
  stateCode: string;
  latitude: number;
  longitude: number;
}

// Cache for US zip code database
let zipDatabase: Map<string, ZipData> | null = null;

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { centerZip, radiusMiles, zipList } = await req.json();

    if (!centerZip || !radiusMiles) {
      return new Response(
        JSON.stringify({ error: 'centerZip and radiusMiles are required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Finding zips within ${radiusMiles} miles of ${centerZip}`);

    // Load zip database if not cached
    if (!zipDatabase) {
      console.log('Loading US zip code database...');
      zipDatabase = await loadZipDatabase();
      console.log(`Loaded ${zipDatabase.size} zip codes`);
    }

    // Get center zip data from database
    const normalizedCenter = centerZip.trim().padStart(5, '0');
    const centerData = zipDatabase.get(normalizedCenter);

    if (!centerData) {
      return new Response(
        JSON.stringify({ error: `Zip code ${centerZip} not found in database` }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      );
    }

    console.log(`Center: ${centerData.city}, ${centerData.state} (${centerData.latitude}, ${centerData.longitude})`);

    // Find all zips within radius
    const results: ZipResult[] = [];
    
    for (const [zip, data] of zipDatabase.entries()) {
      const distance = calculateDistance(
        centerData.latitude,
        centerData.longitude,
        data.latitude,
        data.longitude
      );
      
      if (distance <= radiusMiles) {
        results.push({
          zipCode: zip,
          city: data.city,
          state: data.state,
          latitude: data.latitude,
          longitude: data.longitude,
          distance: Math.round(distance * 100) / 100
        });
      }
    }

    // Sort by distance
    results.sort((a, b) => a.distance - b.distance);

    console.log(`Found ${results.length} zip codes within ${radiusMiles} miles`);

    return new Response(
      JSON.stringify({
        success: true,
        centerZip: normalizedCenter,
        centerCity: centerData.city,
        centerState: centerData.state,
        centerCoordinates: {
          latitude: centerData.latitude,
          longitude: centerData.longitude
        },
        radiusMiles: radiusMiles,
        totalZipsChecked: zipDatabase.size,
        zipsFound: results.length,
        results: results
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error: any) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'An error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
});

/**
 * Load US zip code database from CSV
 */
async function loadZipDatabase(): Promise<Map<string, ZipData>> {
  const database = new Map<string, ZipData>();
  
  try {
    // Try multiple sources for the CSV file
    const sources = [
      // Try Supabase Storage first (most reliable)
      `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/data/us-zips.csv`,
      // Fallback to production domain
      'https://owldoor.com/data/us-zips.csv',
      // Fallback to raw GitHub if available
      'https://raw.githubusercontent.com/erichurst/US-Zip-Codes-JSON/master/USCities.csv'
    ];
    
    let lastError: Error | null = null;
    
    for (const csvUrl of sources) {
      try {
        console.log(`Attempting to fetch zip database from: ${csvUrl}`);
        const response = await fetch(csvUrl);
        
        if (response.ok) {
          console.log(`Successfully fetched from: ${csvUrl}`);
          return await parseZipCSV(await response.text());
        }
        
        lastError = new Error(`HTTP ${response.status} from ${csvUrl}`);
      } catch (err) {
        lastError = err as Error;
        console.log(`Failed to fetch from ${csvUrl}: ${err}`);
      }
    }
    
    throw lastError || new Error('All zip database sources failed');
  } catch (error) {
    console.error('Error loading zip database:', error);
    throw error;
  }
}

async function parseZipCSV(csvText: string): Promise<Map<string, ZipData>> {
  const database = new Map<string, ZipData>();
  const lines = csvText.split('\n');
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const parts = line.split(',');
    if (parts.length < 9) continue;
    
    const countryCode = parts[0];
    if (countryCode !== 'US') continue;
    
    const zipCode = parts[1];
    const city = parts[2];
    const state = parts[3];
    const stateCode = parts[4];
    const latitude = parseFloat(parts[7]);
    const longitude = parseFloat(parts[8]);
    
    if (zipCode && !isNaN(latitude) && !isNaN(longitude)) {
      database.set(zipCode, {
        zipCode,
        city,
        state,
        stateCode,
        latitude,
        longitude
      });
    }
  }
  
  console.log(`Parsed ${database.size} zip codes`);
  return database;
}

/**
 * Calculate distance between two coordinates (Haversine formula)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3959; // Earth's radius in miles
  
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

function toRad(degrees: number): number {
  return degrees * (Math.PI / 180);
}
