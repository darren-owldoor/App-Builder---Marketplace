import Papa from 'papaparse';

export interface CityData {
  city: string;
  state: string;
  stateCode: string;
  latitude: number;
  longitude: number;
  postalCode: string;
}

let cityDataCache: Map<string, CityData[]> | null = null;

const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
  { code: 'DC', name: 'District of Columbia' },
];

export const getUSStates = () => US_STATES;

async function loadCityData(): Promise<Map<string, CityData[]>> {
  if (cityDataCache) return cityDataCache;

  const response = await fetch('/data/us-cities-geocode.csv');
  const csvText = await response.text();

  return new Promise((resolve, reject) => {
    Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const dataMap = new Map<string, CityData[]>();

        results.data.forEach((row: any) => {
          const city = row['place name']?.trim();
          const state = row['admin name1']?.trim();
          const stateCode = row['admin code1']?.trim();
          const lat = parseFloat(row['latitude']);
          const lng = parseFloat(row['longitude']);
          const postalCode = row['postal code']?.trim();

          if (city && stateCode && !isNaN(lat) && !isNaN(lng)) {
            const key = `${city.toLowerCase()}_${stateCode.toLowerCase()}`;
            
            const cityData: CityData = {
              city,
              state,
              stateCode,
              latitude: lat,
              longitude: lng,
              postalCode,
            };

            if (!dataMap.has(key)) {
              dataMap.set(key, []);
            }
            dataMap.get(key)!.push(cityData);
          }
        });

        cityDataCache = dataMap;
        resolve(dataMap);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
}

export async function findCity(city: string, stateCode: string): Promise<CityData | null> {
  const dataMap = await loadCityData();
  const key = `${city.toLowerCase()}_${stateCode.toLowerCase()}`;
  const matches = dataMap.get(key);
  
  if (matches && matches.length > 0) {
    return matches[0];
  }
  
  return null;
}
