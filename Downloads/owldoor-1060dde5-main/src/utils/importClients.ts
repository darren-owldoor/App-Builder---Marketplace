import { supabase } from "@/integrations/supabase/client";
import { normalizePhone, normalizeState } from "@/lib/utils";
import { z } from "zod";

const parseArray = (str: string): string[] => {
  if (!str) return [];
  return str.split(',').map(item => item.trim()).filter(item => item);
};

// Validation schema for client import data
const clientImportSchema = z.object({
  first_name: z.string().trim().min(1, "First name required").max(100, "First name too long"),
  last_name: z.string().max(100).optional().or(z.literal("")),
  email: z.string().email("Invalid email format").max(255).optional().or(z.literal("")),
  phone: z.string().max(20).optional().or(z.literal("")),
  brokerage: z.string().trim().min(1, "Brokerage required").max(200, "Brokerage too long"),
  company_name: z.string().max(200).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  state: z.string().max(50).optional().or(z.literal("")),
  county: z.string().max(100).optional().or(z.literal("")),
  zip: z.string().max(20).optional().or(z.literal("")),
  yearly_sales: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  avg_sale: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  years_experience: z.union([z.string(), z.number()]).optional().or(z.literal("")),
  languages: z.string().max(500).optional().or(z.literal("")),
  designations: z.string().max(500).optional().or(z.literal("")),
  skills: z.string().max(1000).optional().or(z.literal("")),
  wants: z.string().max(2000).optional().or(z.literal("")),
  needs: z.string().max(2000).optional().or(z.literal("")),
  license_type: z.string().max(100).optional().or(z.literal("")),
  tags: z.string().max(500).optional().or(z.literal("")),
  phone2: z.string().max(20).optional().or(z.literal("")),
  email2: z.string().email("Invalid email format").max(255).optional().or(z.literal("")),
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

// Generate cryptographically secure random password
const generateSecurePassword = (): string => {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('').slice(0, 24);
};

export const importClients = async (csvData: any[], mapping: Record<string, string>) => {
  const results = {
    success: 0,
    failed: 0,
    errors: [] as string[]
  };

  for (const row of csvData) {
    try {
      // Validate input data with zod schema
      const validationResult = clientImportSchema.safeParse(row);
      if (!validationResult.success) {
        results.failed++;
        const errors = validationResult.error.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
        results.errors.push(`Validation failed: ${errors}`);
        continue;
      }

      const firstName = row.first_name || "";
      const lastName = row.last_name || "";
      const brokerage = row.brokerage || "";
      
      if (!firstName || !brokerage) {
        results.failed++;
        results.errors.push(`Skipped row: Missing name or brokerage`);
        continue;
      }

      // Generate secure email if not provided
      const sanitizedFirstName = firstName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sanitizedLastName = lastName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const sanitizedBrokerage = brokerage.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      if (!sanitizedBrokerage) {
        results.failed++;
        results.errors.push(`Skipped row for ${firstName}: Invalid brokerage name`);
        continue;
      }

      const email = row.email || `${sanitizedFirstName}.${sanitizedLastName}@${sanitizedBrokerage}.com`;
      
      // Use 7-digit phone as password
      const phone = row.phone || '';
      const cleanPhone = phone.replace(/\D/g, '');
      const tempPassword = cleanPhone.slice(-7) || 'temp1234';

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: tempPassword,
        options: {
          data: {
            full_name: `${firstName} ${lastName}`,
          },
        },
      });

      if (authError) {
        results.failed++;
        results.errors.push(`Failed to create user for ${firstName}: ${authError.message}`);
        continue;
      }

      if (!authData.user) {
        results.failed++;
        results.errors.push(`No user created for ${firstName}`);
        continue;
      }

      // Delete the default 'lead' role that was automatically assigned
      await supabase.from("user_roles")
        .delete()
        .eq("user_id", authData.user.id)
        .eq("role", "lead");

      // Assign client role
      const { error: roleError } = await supabase.from("user_roles").insert({
        user_id: authData.user.id,
        role: "client",
      });

      if (roleError) {
        results.failed++;
        results.errors.push(`Failed to assign role for ${firstName}: ${roleError.message}`);
        continue;
      }

      // Send password reset email for secure onboarding
      try {
        await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/auth`,
        });
      } catch (resetError) {
        console.warn(`Could not send password reset for ${email}:`, resetError);
      }

      // Parse numeric and array fields with validation
      const yearlySales = Math.max(0, Math.min(1000000000, parseFloat(row.yearly_sales) || 0));
      const avgSale = Math.max(0, Math.min(100000000, parseFloat(row.avg_sale) || 0));
      const yearsExperience = Math.max(0, Math.min(80, parseInt(row.years_experience) || 0));
      const languages = parseArray(row.languages || "").slice(0, 20);
      const designations = parseArray(row.designations || "").slice(0, 20);
      const skills = parseArray(row.skills || "").slice(0, 50);
      const tags = parseArray(row.tags || "").slice(0, 50);

      // Normalize phone and state
      const normalizedPhone = row.phone ? normalizePhone(row.phone) : null;
      const normalizedState = row.state ? normalizeState(row.state) : null;

      // Insert client record with all fields
      const { error: clientError } = await supabase.from("clients").insert({
        user_id: authData.user.id,
        company_name: row.company_name || brokerage,
        contact_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        email: email,
        phone: normalizedPhone,
        brokerage: brokerage,
        client_type: 'real_estate' as const,
        yearly_sales: yearlySales,
        avg_sale: avgSale,
        years_experience: yearsExperience,
        cities: row.city ? [row.city] : [],
        states: normalizedState ? [normalizedState] : [],
        county: row.county || null,
        zip_codes: row.zip ? [row.zip] : [],
        languages: languages,
        designations: designations,
        skills: skills,
        wants: row.wants || "",
        needs: row.needs || "",
        license_type: row.license_type || null,
        tags: tags,
        profile_completed: true,
        active: true,
        phone2: row.phone2 || null,
        email2: row.email2 || null,
        linkedin_url: row.linkedin_url || null,
        facebook_url: row.facebook_url || null,
        instagram_url: row.instagram_url || null,
        twitter_url: row.twitter_url || null,
        youtube_url: row.youtube_url || null,
        tiktok_url: row.tiktok_url || null,
        website_url: row.website_url || null,
        homes_com_url: row.homes_com_url || null,
        realtor_com_url: row.realtor_com_url || null,
      });

      if (clientError) {
        results.failed++;
        results.errors.push(`Failed to create client record for ${firstName}: ${clientError.message}`);
      } else {
        results.success++;
      }
    } catch (err: any) {
      results.failed++;
      results.errors.push(`Error processing row: ${err.message}`);
    }
  }

  return results;
};
