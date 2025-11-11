import Papa from 'papaparse';

interface ZipData {
  zip: string;
  city: string;
  state: string;
  stateCode: string;
  county: string;
  latitude: number;
  longitude: number;
}

let zipDataCache: Map<string, ZipData> | null = null;

export async function loadZipData(): Promise<Map<string, ZipData>> {
  if (zipDataCache) {
    return zipDataCache;
  }

  const response = await fetch('/data/us-zips.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      complete: (results) => {
        const zipMap = new Map<string, ZipData>();
        
        results.data.forEach((row: any) => {
          if (row['postal code']) {
            zipMap.set(row['postal code'], {
              zip: row['postal code'],
              city: row['place name'],
              state: row['admin name1'],
              stateCode: row['admin code1'],
              county: row['admin name2'],
              latitude: parseFloat(row['latitude']),
              longitude: parseFloat(row['longitude']),
            });
          }
        });

        zipDataCache = zipMap;
        resolve(zipMap);
      },
      error: (error) => {
        reject(error);
      }
    });
  });
}

export async function lookupZipCode(zip: string): Promise<ZipData | null> {
  const zipData = await loadZipData();
  return zipData.get(zip) || null;
}

/**
 * @deprecated Use GeocodingService.geocode() instead for better fallback support
 */
export async function geocodeWithFallback(data: {
  zip?: string;
  city?: string;
  state?: string;
  address?: string;
}): Promise<{
  city: string;
  county: string;
  state: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  formatted_address: string;
} | null> {
  // Import the new service
  const { GeocodingService } = await import('@/lib/geocoding/geocodingService');
  
  const result = await GeocodingService.geocode(data);
  if (!result) return null;
  
  return {
    city: result.city,
    county: result.county || '',
    state: result.state,
    stateCode: result.stateCode,
    latitude: result.latitude,
    longitude: result.longitude,
    formatted_address: result.formatted_address,
  };
}
