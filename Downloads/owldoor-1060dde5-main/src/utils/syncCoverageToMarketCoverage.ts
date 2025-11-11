import { supabase } from '@/integrations/supabase/client';

/**
 * Syncs agent coverage_areas from pros table to market_coverage table
 * This allows agents to have the same coverage management UI as clients
 */
export async function syncAgentCoverageToMarketCoverage(userId: string) {
  try {
    console.log('[SyncCoverage] Starting sync for user:', userId);

    // Get agent profile with coverage_areas
    const { data: proData, error: proError } = await supabase
      .from('pros')
      .select('id, coverage_areas, zip_codes, cities, states')
      .eq('user_id', userId)
      .maybeSingle();

    if (proError) throw proError;
    if (!proData) {
      console.log('[SyncCoverage] No agent profile found');
      return { success: false, message: 'No agent profile found' };
    }

    // Check if already synced
    const { data: existingCoverage } = await supabase
      .from('market_coverage')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    if (existingCoverage && existingCoverage.length > 0) {
      console.log('[SyncCoverage] Already synced, skipping');
      return { success: true, message: 'Already synced', alreadySynced: true };
    }

    // Parse coverage_areas if it exists and is valid
    const coverageAreas = Array.isArray(proData.coverage_areas) 
      ? proData.coverage_areas 
      : [];

    if (coverageAreas.length === 0 && (!proData.zip_codes || proData.zip_codes.length === 0)) {
      console.log('[SyncCoverage] No coverage data to sync');
      return { success: false, message: 'No coverage data to sync' };
    }

    // Create market_coverage entries from coverage_areas
    const coverageEntries = [];

    if (coverageAreas.length > 0) {
      // Group by type
      const zipRadiusAreas = coverageAreas.filter((a: any) => a.type === 'zip_radius');
      
      if (zipRadiusAreas.length > 0) {
        // Create one entry for all zip+radius areas
        coverageEntries.push({
          user_id: userId,
          coverage_type: 'zip_radius',
          name: 'Agent Signup Coverage',
          data: {
            zipCodes: zipRadiusAreas.map((a: any) => a.zip),
            cities: [...new Set(zipRadiusAreas.map((a: any) => a.city))],
            states: [...new Set(zipRadiusAreas.map((a: any) => a.state))],
            counties: [...new Set(zipRadiusAreas.filter((a: any) => a.county).map((a: any) => a.county))],
            fullResults: zipRadiusAreas.map((a: any) => ({
              zipCode: a.zip,
              radius: a.radius,
              city: a.city,
              state: a.state,
              county: a.county,
              latitude: a.latitude,
              longitude: a.longitude,
            }))
          }
        });
      }
    } else if (proData.zip_codes && proData.zip_codes.length > 0) {
      // Fallback: create from flat arrays
      coverageEntries.push({
        user_id: userId,
        coverage_type: 'zip_radius',
        name: 'Legacy Coverage',
        data: {
          zipCodes: proData.zip_codes || [],
          cities: proData.cities || [],
          states: proData.states || [],
        }
      });
    }

    if (coverageEntries.length > 0) {
      const { error: insertError } = await supabase
        .from('market_coverage')
        .insert(coverageEntries);

      if (insertError) throw insertError;

      console.log('[SyncCoverage] Successfully synced', coverageEntries.length, 'coverage areas');
      return { 
        success: true, 
        message: `Synced ${coverageEntries.length} coverage area(s)`,
        count: coverageEntries.length 
      };
    }

    return { success: false, message: 'No valid coverage data to sync' };

  } catch (error) {
    console.error('[SyncCoverage] Error:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to sync coverage' 
    };
  }
}

/**
 * Check if agent coverage needs syncing
 */
export async function needsCoverageSync(userId: string): Promise<boolean> {
  try {
    // Check if user is an agent
    const { data: proData } = await supabase
      .from('pros')
      .select('id, coverage_areas, zip_codes')
      .eq('user_id', userId)
      .maybeSingle();

    if (!proData) return false;

    // Check if they have coverage data
    const hasCoverageData = 
      (Array.isArray(proData.coverage_areas) && proData.coverage_areas.length > 0) ||
      (Array.isArray(proData.zip_codes) && proData.zip_codes.length > 0);

    if (!hasCoverageData) return false;

    // Check if already synced to market_coverage
    const { data: existingCoverage } = await supabase
      .from('market_coverage')
      .select('id')
      .eq('user_id', userId)
      .limit(1);

    return !existingCoverage || existingCoverage.length === 0;
  } catch (error) {
    console.error('[needsCoverageSync] Error:', error);
    return false;
  }
}
