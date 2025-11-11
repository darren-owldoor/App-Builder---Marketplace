import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, normalizeState, calculateQualificationPercentage } from "@/lib/utils";
import { z } from "zod";

// Define required fields for lead qualification
const REQUIRED_LEAD_FIELDS = ['full_name', 'phone', 'city', 'state', 'zip_codes'];

// Validation schema for lead import data
const leadImportSchema = z.object({
  full_name: z.string().trim().min(1, "Full name required").max(200, "Full name too long"),
  first_name: z.string().max(100).optional().nullable(),
  last_name: z.string().max(100).optional().nullable(),
  email: z.string().email("Invalid email format").max(255).optional().or(z.literal("")),
  phone: z.string().min(10, "Phone number too short").max(20, "Phone number too long"),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  zip_code: z.string().max(500).optional().or(z.literal("")),
  brokerage: z.string().max(200).optional().or(z.literal("")),
  company: z.string().max(200).optional().or(z.literal("")),
  license_type: z.string().max(100).optional().or(z.literal("")),
  notes: z.string().max(5000, "Notes too long").optional().or(z.literal("")),
  transactions: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  experience: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  total_sales: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  motivation: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  wants: z.string().max(1000).optional().or(z.literal("")),
  skills: z.string().max(1000).optional().or(z.literal("")),
  tags: z.string().max(1000).optional().or(z.literal("")),
  county: z.string().max(500).optional().or(z.literal("")),
  source: z.string().max(100).optional().or(z.literal("")),
  profile_url: z.string().url("Invalid profile URL").max(500).optional().or(z.literal("")),
  profile: z.string().url("Invalid profile URL").max(500).optional().or(z.literal("")),
  image_url: z.string().url("Invalid image URL").max(500).optional().or(z.literal("")),
  image: z.string().url("Invalid image URL").max(500).optional().or(z.literal("")),
  phone2: z.string().max(20).optional().or(z.literal("")),
  email2: z.string().email("Invalid email format").max(255).optional().or(z.literal("")),
  average_deal: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  low_price_point: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  high_price_point: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  price_range: z.string().max(100).optional().or(z.literal("")),
  linkedin_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  facebook_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  instagram_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  twitter_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  youtube_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  tiktok_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  website_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  homes_com_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
  realtor_com_url: z.string().url("Invalid URL").max(500).optional().or(z.literal("")),
}).partial();

const parseArray = (str: string): string[] => {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item);
};

export const importLeads = async (csvData: any[], mapping: Record<string, string>) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  console.log(`Starting import of ${csvData.length} leads`);

  for (const row of csvData) {
    try {
      // Validate input data with zod schema
      const validationResult = leadImportSchema.safeParse(row);
      if (!validationResult.success) {
        results.failed++;
        const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        results.errors.push(`Validation failed: ${errors}`);
        continue;
      }

      // Handle name fields - support both split and full name
      let firstName = row.first_name || "";
      let lastName = row.last_name || "";
      const fullName = row.full_name || (firstName && lastName ? `${firstName} ${lastName}` : "");
      
      // If only full name provided, try to split it
      if (!firstName && !lastName && fullName) {
        const nameParts = fullName.split(' ');
        firstName = nameParts[0] || "";
        lastName = nameParts.slice(1).join(' ') || "";
      }
      
      let phone = row.phone || "";
      
      // Validate required fields
      if (!fullName || !phone) {
        results.failed++;
        results.errors.push(`Skipped row: Missing name or phone`);
        continue;
      }

      // Normalize phone number
      phone = normalizePhone(phone);

      // Generate email if not provided
      const email = row.email && row.email.trim() 
        ? row.email.trim() 
        : `${fullName.toLowerCase().replace(/\s+/g, '.')}@placeholder.com`;

      // Normalize state if provided
      const state = row.state ? normalizeState(row.state) : null;

      // Parse arrays (comma-separated values) with length limits
      const zipCodes = parseArray(row.zip_code || "").slice(0, 100);
      const wants = parseArray(row.wants || "").slice(0, 50);
      const skills = parseArray(row.skills || "").slice(0, 50);
      const tags = parseArray(row.tags || "").slice(0, 50);
      const counties = parseArray(row.county || "").slice(0, 20);
      const cities = row.city ? [row.city.trim().slice(0, 100)] : [];
      const states = state ? [state] : [];

      // Prepare lead data for qualification calculation
      const leadData = {
        full_name: fullName,
        first_name: firstName || null,
        last_name: lastName || null,
        email: email,
        phone: phone,
        cities: cities,
        states: states,
        counties: counties,
        zip_codes: zipCodes,
        brokerage: row.brokerage || null,
        company: row.company || null,
        license_type: row.license_type || null,
        notes: row.notes ? String(row.notes).slice(0, 5000) : null,
        transactions: row.transactions ? Math.max(0, Math.min(10000, parseInt(row.transactions) || 0)) : null,
        experience: row.experience ? Math.max(0, Math.min(80, parseInt(row.experience) || 0)) : null,
        total_sales: row.total_sales ? Math.max(0, Math.min(1000000000, parseFloat(row.total_sales) || 0)) : null,
        motivation: row.motivation ? Math.max(0, Math.min(10, parseInt(row.motivation) || 0)) : null,
        wants: wants,
        skills: skills,
        tags: tags,
        source: row.source || "CSV Import",
        profile_url: row.profile_url || row.profile || null,
        image_url: row.image_url || row.image || null,
        phone2: row.phone2 || null,
        email2: row.email2 || null,
        average_deal: row.average_deal ? Math.max(0, parseFloat(row.average_deal) || 0) : null,
        low_price_point: row.low_price_point ? Math.max(0, parseFloat(row.low_price_point) || 0) : null,
        high_price_point: row.high_price_point ? Math.max(0, parseFloat(row.high_price_point) || 0) : null,
        price_range: row.price_range || null,
        linkedin_url: row.linkedin_url || null,
        facebook_url: row.facebook_url || null,
        instagram_url: row.instagram_url || null,
        twitter_url: row.twitter_url || null,
        youtube_url: row.youtube_url || null,
        tiktok_url: row.tiktok_url || null,
        website_url: row.website_url || null,
        homes_com_url: row.homes_com_url || null,
        realtor_com_url: row.realtor_com_url || null,
      };

      // Calculate qualification percentage based on filled required fields
      const qualificationScore = calculateQualificationPercentage(leadData, REQUIRED_LEAD_FIELDS);

      // Use provided status or calculate based on qualification score
      let status = "new";
      if (qualificationScore === 100) status = "qualified";
      else if (qualificationScore >= 50) status = "qualifying";

      console.log(`Processing lead: ${fullName} - ${phone} - Qualification: ${qualificationScore}%`);

      // Check if pro already exists by phone number
      const { data: existingLead } = await supabase
        .from("pros")
        .select("id, user_id")
        .eq("phone", phone)
        .maybeSingle();

      if (existingLead) {
        // Update existing pro
        const { error: updateError } = await supabase
          .from("pros")
          .update({
            full_name: fullName,
            first_name: leadData.first_name,
            last_name: leadData.last_name,
            email: email,
            cities: leadData.cities,
            states: leadData.states,
            counties: leadData.counties,
            zip_codes: leadData.zip_codes,
            brokerage: leadData.brokerage,
            company: leadData.company,
            license_type: leadData.license_type,
            qualification_score: qualificationScore,
            status: status,
            notes: leadData.notes,
            transactions: leadData.transactions,
            experience: leadData.experience,
            total_sales: leadData.total_sales,
            motivation: leadData.motivation,
            wants: leadData.wants,
            skills: leadData.skills,
            tags: leadData.tags,
            source: leadData.source,
            profile_url: leadData.profile_url,
            image_url: leadData.image_url,
            phone2: leadData.phone2,
            email2: leadData.email2,
            average_deal: leadData.average_deal,
            low_price_point: leadData.low_price_point,
            high_price_point: leadData.high_price_point,
            price_range: leadData.price_range,
            linkedin_url: leadData.linkedin_url,
            facebook_url: leadData.facebook_url,
            instagram_url: leadData.instagram_url,
            twitter_url: leadData.twitter_url,
            youtube_url: leadData.youtube_url,
            tiktok_url: leadData.tiktok_url,
            website_url: leadData.website_url,
            homes_com_url: leadData.homes_com_url,
            realtor_com_url: leadData.realtor_com_url,
          })
          .eq("id", existingLead.id);

        if (updateError) {
          results.failed++;
          results.errors.push(`Failed to update ${fullName}: ${updateError.message}`);
        } else {
          results.success++;
          console.log(`Updated existing lead: ${fullName}`);
        }
        continue;
      }

      // Create new pro without auth user first (simpler approach)
      const { error: insertError } = await supabase.from("pros").insert({
        full_name: fullName,
        first_name: leadData.first_name,
        last_name: leadData.last_name,
        email: email,
        phone: phone,
        cities: leadData.cities,
        states: leadData.states,
        counties: leadData.counties,
        zip_codes: leadData.zip_codes,
        brokerage: leadData.brokerage,
        company: leadData.company,
        license_type: leadData.license_type,
        qualification_score: qualificationScore,
        status: status,
        source: leadData.source,
        user_id: null,  // Will be linked later if user signs up
        notes: leadData.notes,
        transactions: leadData.transactions,
        experience: leadData.experience,
        total_sales: leadData.total_sales,
        motivation: leadData.motivation,
        wants: leadData.wants,
        skills: leadData.skills,
        tags: leadData.tags,
        profile_url: leadData.profile_url,
        image_url: leadData.image_url,
        phone2: leadData.phone2,
        email2: leadData.email2,
        average_deal: leadData.average_deal,
        low_price_point: leadData.low_price_point,
        high_price_point: leadData.high_price_point,
        price_range: leadData.price_range,
        linkedin_url: leadData.linkedin_url,
        facebook_url: leadData.facebook_url,
        instagram_url: leadData.instagram_url,
        twitter_url: leadData.twitter_url,
        youtube_url: leadData.youtube_url,
        tiktok_url: leadData.tiktok_url,
        website_url: leadData.website_url,
        homes_com_url: leadData.homes_com_url,
        realtor_com_url: leadData.realtor_com_url,
      });

      if (insertError) {
        results.failed++;
        results.errors.push(`Failed to import ${fullName}: ${insertError.message}`);
        console.error(`Error importing ${fullName}:`, insertError);
      } else {
        results.success++;
        console.log(`Successfully imported: ${fullName}`);
      }
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Error processing row: ${err.message}`);
      console.error(`Exception:`, err);
    }
  }

  console.log(`Import complete: ${results.success} success, ${results.failed} failed`);
  return results;
};
