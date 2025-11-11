import { supabase } from "@/integrations/supabase/client";
import Papa from "papaparse";

interface CSVRow {
  First_Name: string;
  Last_Name: string;
  Phone: string;
  Phone_Clean: string;
  Current_Brokerage: string;
  Profile_URL: string;
  Wants: string;
  Meeting_Preference: string;
  Motivation_Score: string;
  Full_Name_DB: string;
  Email: string;
  License: string;
  City: string;
  State: string;
  Zip: string;
  Address: string;
  Yearly_Sales: string;
  Experience: string;
  Years_Experience: string;
  Price_Range: string;
  Price_Median: string;
  Price_Low: string;
  Price_High: string;
  Languages: string;
  Additional_Profile_URL: string;
  Listings_URL: string;
  Photo_URL: string;
  Facebook: string;
  LinkedIn: string;
  Instagram: string;
  Youtube: string;
  Website: string;
  Team: string;
  Data_Source: string;
  Match_Confidence: string;
  Enrichment_Date: string;
  Priority_Score: string;
  Priority_Level: string;
  Latitude: string;
  Longitude: string;
  County: string;
  Metro_Area: string;
  Region: string;
  Time_Zone: string;
  Market_Area: string;
}

export const updateJasonLeadsToDirectory = async (csvContent: string) => {
  const results: {
    success: number;
    errors: number;
    details: string[];
  } = {
    success: 0,
    errors: 0,
    details: [],
  };

  try {
    // Parse CSV
    const parsed = Papa.parse<CSVRow>(csvContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data;
    console.log(`Processing ${rows.length} leads from CSV`);

    // Get Jason's client ID
    const { data: clientData } = await supabase
      .from("clients")
      .select("id")
      .eq("email", "Jason@realestatebadass.com")
      .single();

    if (!clientData) {
      throw new Error("Jason's client account not found");
    }

    // Get his purchased leads
    const { data: matches } = await supabase
      .from("matches")
      .select("pro_id, pros(id, phone)")
      .eq("client_id", clientData.id)
      .eq("status", "purchased")
      .limit(10);

    if (!matches) {
      throw new Error("No purchased leads found");
    }

    const jasonLeadPhones = matches.map((m: any) => m.pros.phone);
    console.log("Jason's lead phones:", jasonLeadPhones);

    // Process each CSV row that matches Jason's leads
    for (const row of rows) {
      const cleanPhone = row.Phone_Clean || row.Phone.replace(/\D/g, "");
      
      // Check if this phone matches one of Jason's leads
      if (!jasonLeadPhones.includes(cleanPhone)) {
        continue;
      }

      try {
        // Find the pro record by phone
        const { data: existingPro } = await supabase
          .from("pros")
          .select("id, user_id")
          .eq("phone", cleanPhone)
          .single();

        if (!existingPro) {
          results.errors++;
          results.details.push(`Pro not found for phone: ${cleanPhone}`);
          continue;
        }

        // Generate email if missing
        const email = row.Email || 
          `${row.First_Name?.toLowerCase() || 'agent'}.${row.Last_Name?.toLowerCase() || cleanPhone}@owldoor.temp`;

        // Create user account if doesn't exist
        let userId = existingPro.user_id;
        
        if (!userId) {
          // Use last 7 digits of phone as password
          const password = cleanPhone.slice(-7);
          
          const { data: authData, error: authError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: {
                first_name: row.First_Name,
                last_name: row.Last_Name,
                full_name: row.Full_Name_DB,
              },
            },
          });

          if (authError && !authError.message.includes("already registered")) {
            throw authError;
          }

          userId = authData?.user?.id || null;
        }

        // Parse wants into array
        const wants = row.Wants ? row.Wants.split(",").map((w) => w.trim()) : [];

        // Parse yearly sales
        const yearlySales = row.Yearly_Sales ? parseFloat(row.Yearly_Sales) : null;

        // Parse experience
        const experience = row.Years_Experience || row.Experience;
        const yearsExperience = experience ? parseInt(experience) : null;

        // Update pro record with complete data
        const { error: updateError } = await supabase
          .from("pros")
          .update({
            user_id: userId,
            first_name: row.First_Name,
            last_name: row.Last_Name || "",
            full_name: row.Full_Name_DB,
            email: email,
            brokerage: row.Current_Brokerage,
            cities: row.City ? [row.City] : [],
            states: row.State ? [row.State] : [],
            zip_codes: row.Zip ? [row.Zip] : [],
            address: row.Address || null,
            wants: wants,
            years_experience: yearsExperience,
            yearly_sales: yearlySales,
            qualification_score: parseInt(row.Motivation_Score) * 10 || 90,
            pro_type: "real_estate_agent",
            pipeline_type: "directory",
            pipeline_stage: "directory",
            source: "Directory Upload - Hot Leads",
            profile_url: row.Profile_URL,
            linkedin_url: row.LinkedIn || null,
            facebook_url: row.Facebook || null,
            instagram_url: row.Instagram || null,
            twitter_url: row.Youtube || null,
            website_url: row.Website || null,
            license_number: row.License || null,
            languages: row.Languages ? [row.Languages] : null,
            county: row.County || null,
            updated_at: new Date().toISOString(),
          })
          .eq("id", existingPro.id);

        if (updateError) {
          throw updateError;
        }

        results.success++;
        results.details.push(`✓ Updated ${row.Full_Name_DB} (${cleanPhone})`);
        console.log(`✓ Updated ${row.Full_Name_DB}`);
      } catch (error: any) {
        results.errors++;
        results.details.push(`✗ Error for ${row.Full_Name_DB}: ${error.message}`);
        console.error(`Error processing ${row.Full_Name_DB}:`, error);
      }
    }

    return results;
  } catch (error: any) {
    console.error("Fatal error:", error);
    throw error;
  }
};
