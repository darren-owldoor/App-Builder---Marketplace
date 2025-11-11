# Lead Import API Documentation

This document provides complete field lists and structures for importing leads via Zapier, Webhook, and CSV Upload.

## Table of Contents
- [Import Methods Overview](#import-methods-overview)
- [Common Field Structure](#common-field-structure)
- [Zapier Import](#zapier-import)
- [Webhook Import](#webhook-import)
- [CSV Upload](#csv-upload)
- [Client Assignment](#client-assignment)

---

## Import Methods Overview

| Method | Endpoint | Authentication | Use Case |
|--------|----------|----------------|----------|
| **Zapier Import** | `/zapier-import` | API Key (x-api-key header) | Bulk imports from Zapier workflows |
| **Lead Webhook** | `/import-lead-zapier` | Public (no auth) | Simple lead capture from forms/Zapier |
| **Agent Webhook** | `/agent-lead-webhook` | Webhook Secret | Rich agent data from Model Match or external CRMs |
| **CSV Upload** | Frontend utility | User session | Manual CSV file uploads |

---

## Common Field Structure

### Core Required Fields
```json
{
  "full_name": "John Doe",           // REQUIRED
  "phone": "+15551234567"             // REQUIRED (auto-normalized)
}
```

### All Available Fields

#### **Basic Information**
```json
{
  "full_name": "John Doe",
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "+15551234567",
  "phone2": "+15559876543"
}
```

#### **Location Data**
```json
{
  "cities": ["Los Angeles", "San Diego"],  // Array or comma-separated string
  "states": ["CA", "NV"],                   // Array or comma-separated string
  "counties": ["Orange County"],            // Array or comma-separated string
  "zip_codes": ["90210", "92024"],         // Array or comma-separated string
  "address": "123 Main St",
  "radius": 25                              // Numeric value for radius coverage
}
```

#### **Professional Information**
```json
{
  "company": "ABC Realty",
  "brokerage": "Keller Williams",
  "license_type": "Broker",
  "state_license": "CA-12345",
  "license": "DRE#12345"
}
```

#### **Performance Metrics**
```json
{
  "transactions": 45,
  "experience": 8,                    // Years of experience
  "years_experience": 8,              // Alternative field name
  "total_sales": 15000000,           // Total sales volume
  "motivation": 8,                    // 1-10 scale
  "interest_level": 9,                // 1-10 scale
  "qualification_score": 85           // Auto-calculated if not provided
}
```

#### **Volume Metrics (Real Estate)**
```json
{
  "total_volume": 5000000,
  "total_units": 25,
  "buyer_volume": 3000000,
  "buyer_financed": 2500000,
  "buyer_units": 15,
  "seller_volume": 2000000,
  "seller_financed": 1500000,
  "seller_units": 10,
  "dual_volume": 500000,
  "dual_units": 3,
  "transactions_per_year": 30
}
```

#### **Percentage Metrics**
```json
{
  "buyer_percentage": 60,
  "seller_percentage": 40,
  "percent_financed": 85,
  "seller_side_percentage": 45,
  "purchase_percentage": 70,
  "conventional_percentage": 80
}
```

#### **Relationship Data**
```json
{
  "top_lender": "Wells Fargo",
  "top_lender_share": 35,
  "top_lender_volume": 1200000,
  "top_originator": "Jane Smith",
  "top_originator_share": 25,
  "top_originator_volume": 800000
}
```

#### **Price Points**
```json
{
  "average_deal": 450000,
  "low_price_point": 200000,
  "high_price_point": 1200000,
  "price_range": "$200K-$1.2M"
}
```

#### **Social Media & URLs**
```json
{
  "profile_url": "https://agent-profile.com",
  "image_url": "https://cdn.example.com/photo.jpg",
  "linkedin_url": "https://linkedin.com/in/...",
  "facebook_url": "https://facebook.com/...",
  "instagram_url": "https://instagram.com/...",
  "twitter_url": "https://twitter.com/...",
  "youtube_url": "https://youtube.com/@...",
  "tiktok_url": "https://tiktok.com/@...",
  "website_url": "https://mywebsite.com",
  "homes_com_url": "https://homes.com/...",
  "realtor_com_url": "https://realtor.com/..."
}
```

#### **Additional Data**
```json
{
  "wants": "Higher splits, Better support",  // Comma-separated or array
  "skills": "Luxury homes, First-time buyers", // Comma-separated or array
  "tags": "hot-lead, experienced",           // Comma-separated or array
  "notes": "Met at conference, very interested",
  "source": "Trade Show 2024",
  "status": "qualified",                      // new, qualifying, qualified
  "pipeline_stage": "new",
  "date": "2024-01-15"
}
```

#### **Client Assignment (NEW)**
```json
{
  "client_email": "broker@company.com",    // Assign to client by email
  "client_phone": "+15551234567",          // Or assign by phone
  "client_id": "uuid",                     // Or assign by client ID
  "lead_price": 250                        // Optional: price paid for this lead
}
```

---

## Zapier Import

**Endpoint:** `https://[project].supabase.co/functions/v1/zapier-import`

**Authentication:** API Key in header
```
x-api-key: your-api-key-here
```

### Request Structure
```json
{
  "entity_type": "leads",
  "data": [
    {
      "full_name": "John Doe",
      "phone": "555-123-4567",
      "email": "john@example.com",
      "city": "Los Angeles",
      "state": "CA",
      "zip_code": "90210",
      "brokerage": "ABC Realty",
      "transactions": 25,
      "experience": 5,
      "motivation": 8,
      "notes": "Met at conference",
      "source": "Zapier Import",
      "client_email": "broker@company.com"
    }
  ]
}
```

### Supported Entity Types
- `leads` - Import real estate agents/leads
- `clients` - Import brokerages/companies (creates auth users)
- `staff` - Import staff members (creates auth users)
- `users` - Import general users (creates auth users)

### Response
```json
{
  "success": true,
  "imported": 1,
  "entity_type": "leads"
}
```

### Error Response
```json
{
  "error": "Invalid request data",
  "details": [
    "phone: Phone number too short",
    "email: Invalid email format"
  ]
}
```

### Rate Limits
- 100 requests per minute per IP
- Maximum 1000 records per request

---

## Webhook Import

### Simple Lead Webhook

**Endpoint:** `https://[project].supabase.co/functions/v1/import-lead-zapier`

**Authentication:** None (public endpoint)

**Content-Type:** `application/json`

### Request Body
```json
{
  "full_name": "John Doe",
  "phone": "555-123-4567",
  "email": "john@example.com",
  "cities": "Los Angeles, San Diego",
  "states": "CA",
  "zip_codes": "90210, 92024",
  "brokerage": "ABC Realty",
  "transactions": 25,
  "experience": 5,
  "motivation": 8,
  "wants": "Better splits, More leads",
  "skills": "Luxury homes, Investors",
  "notes": "Very interested in switching",
  "source": "Website Form",
  "client_email": "broker@company.com",
  "lead_price": 250
}
```

### Field Name Variations
The webhook supports multiple field name formats:
- `full_name` or `Full Name` or `name`
- `phone` or `Phone`
- `email` or `Email`
- `city` or `City` or `cities` or `Cities`
- `state` or `State` or `states` or `States`
- `zip_code` or `Zip Code` or `zip_codes` or `Zip Codes`

### Response - Success (Create)
```json
{
  "success": true,
  "action": "created",
  "lead_id": "uuid-here",
  "message": "Lead created successfully"
}
```

### Response - Success (Update)
```json
{
  "success": true,
  "action": "updated",
  "lead_id": "uuid-here",
  "message": "Lead updated successfully"
}
```

### Agent Lead Webhook (Rich Data)

**Endpoint:** `https://[project].supabase.co/functions/v1/agent-lead-webhook`

**Authentication:** Webhook Secret in header
```
x-webhook-secret: your-webhook-secret
```

### Request Body (Full Schema)
```json
{
  "first_name": "John",
  "last_name": "Doe",
  "email": "john@example.com",
  "phone": "555-123-4567",
  
  "company": "ABC Realty",
  "brokerage": "Keller Williams",
  "address": "123 Main St, Los Angeles, CA",
  
  "cities": ["Los Angeles", "San Diego"],
  "states": ["CA"],
  
  "total_volume": 5000000,
  "total_units": 25,
  "transactions": 25,
  "transactions_per_year": 30,
  
  "buyer_volume": 3000000,
  "buyer_financed": 2500000,
  "buyer_units": 15,
  "seller_volume": 2000000,
  "seller_financed": 1500000,
  "seller_units": 10,
  "dual_volume": 500000,
  "dual_units": 3,
  
  "Buyer_Percentage": 60,
  "Seller_Percentage": 40,
  "percent_financed": 85,
  "seller_side_percentage": 45,
  "purchase_percentage": 70,
  "conventional_percentage": 80,
  
  "top_lender": "Wells Fargo",
  "top_lender_share": 35,
  "top_lender_volume": 1200000,
  "top_originator": "Jane Smith",
  "top_originator_share": 25,
  "top_originator_volume": 800000,
  
  "linkedin_url": "https://linkedin.com/in/johndoe",
  "facebook_url": "https://facebook.com/johndoe",
  "instagram_url": "https://instagram.com/johndoe",
  "twitter_url": "https://twitter.com/johndoe",
  "youtube_url": "https://youtube.com/@johndoe",
  "website_url": "https://johndoe.com",
  
  "years_experience": 8,
  "interest_level": 9,
  "notes": "Top performer in market",
  "source": "Model Match",
  "date": "2024-01-15",
  
  "client_email": "broker@company.com",
  "lead_price": 350
}
```

### Response
```json
{
  "success": true,
  "action": "created",
  "lead": {
    "id": "uuid",
    "full_name": "John Doe",
    "phone": "+15551234567"
  }
}
```

---

## CSV Upload

### Frontend Usage
```typescript
import { importLeads } from "@/utils/importLeads";

// After parsing CSV file
const results = await importLeads(csvData, fieldMapping);

console.log(`Success: ${results.success}, Failed: ${results.failed}`);
```

### CSV Column Headers (Flexible)
The system supports various column header formats:
- `Full Name`, `full_name`, `Name`
- `Phone`, `phone`
- `Email`, `email`
- `City`, `city`
- `State`, `state`
- `Zip Code`, `zip_code`, `Zip`
- `Brokerage`, `brokerage`, `Company`
- `Transactions`, `transactions`
- `Experience`, `experience`, `Years Experience`
- `Motivation`, `motivation`, `Interest Level`
- `Notes`, `notes`

### Example CSV
```csv
Full Name,Phone,Email,City,State,Zip Code,Brokerage,Transactions,Experience,Motivation,Client Email
John Doe,555-123-4567,john@example.com,Los Angeles,CA,90210,ABC Realty,25,5,8,broker@company.com
Jane Smith,555-987-6543,jane@example.com,San Diego,CA,92024,XYZ Real Estate,40,10,9,broker@company.com
```

### Import Results
```typescript
{
  success: 2,      // Number of successfully imported leads
  failed: 0,       // Number of failed imports
  errors: []       // Array of error messages for failed imports
}
```

---

## Client Assignment

### How Client Assignment Works

When importing leads, you can automatically assign them to a specific client (brokerage/company) using any of these identifiers:

1. **Client Email** (Recommended)
   ```json
   { "client_email": "broker@company.com" }
   ```

2. **Client Phone**
   ```json
   { "client_phone": "+15551234567" }
   ```

3. **Client ID** (if known)
   ```json
   { "client_id": "550e8400-e29b-41d4-a716-446655440000" }
   ```

### What Happens When Assigned

1. **Match Created**: A match record is automatically created between the lead and client
2. **Status Set**: Match status is set to "pending" (client needs to review)
3. **Price Tracked**: If `lead_price` is provided, it's recorded in the match
4. **Notifications**: Client is notified of new lead (if notifications enabled)

### Assignment Validation

The system will:
- ✅ Verify the client exists and is active
- ✅ Check if match already exists (prevents duplicates)
- ✅ Validate client has sufficient credits (if applicable)
- ❌ Fail silently if client not found (lead still imported)
- ❌ Log error if match creation fails

### Example with Assignment
```json
{
  "full_name": "John Doe",
  "phone": "555-123-4567",
  "email": "john@example.com",
  "cities": ["Los Angeles"],
  "states": ["CA"],
  "transactions": 25,
  "experience": 5,
  "source": "Trade Show 2024",
  "client_email": "broker@company.com",
  "lead_price": 250
}
```

### Multiple Client Assignment

To assign the same lead to multiple clients, make separate API calls:
```json
// Call 1
{
  "full_name": "John Doe",
  "phone": "555-123-4567",
  "client_email": "broker1@company.com",
  "lead_price": 250
}

// Call 2 (same lead, different client)
{
  "full_name": "John Doe",
  "phone": "555-123-4567",
  "client_email": "broker2@company.com",
  "lead_price": 200
}
```

---

## Data Validation & Normalization

### Phone Number Normalization
All phone numbers are automatically normalized to E.164 format:
- Input: `555-123-4567` → Output: `+15551234567`
- Input: `(555) 123-4567` → Output: `+15551234567`
- Input: `15551234567` → Output: `+15551234567`

### Email Validation
- Must be valid email format
- If not provided, generates placeholder: `john.doe@placeholder.com`

### State Normalization
- Converts full state names to 2-letter codes
- `California` → `CA`
- `Texas` → `TX`

### Array Fields
Comma-separated strings are automatically converted to arrays:
- `"Los Angeles, San Diego"` → `["Los Angeles", "San Diego"]`

### Numeric Fields
- Maximum limits enforced for safety
- Transactions: 0-10,000
- Experience: 0-80 years
- Total Sales: 0-1,000,000,000
- Motivation: 0-10

### Qualification Score
Auto-calculated based on:
- **Transactions** (40% weight)
  - 20+ transactions = 40 points
  - 10-19 transactions = 30 points
  - 5-9 transactions = 20 points
  - <5 transactions = 10 points
- **Experience** (30% weight)
  - 10+ years = 30 points
  - 5-9 years = 20 points
  - 2-4 years = 10 points
- **Motivation** (30% weight)
  - Based on 1-10 scale × 3

---

## Error Handling

### Common Errors

**Missing Required Fields**
```json
{
  "error": "Missing required fields: full_name and phone are required"
}
```

**Invalid Phone Format**
```json
{
  "error": "Validation failed",
  "details": ["phone: Phone number too short"]
}
```

**Invalid Email**
```json
{
  "error": "Validation failed",
  "details": ["email: Invalid email format"]
}
```

**Rate Limit Exceeded**
```json
{
  "error": "Too many import requests. Please try again later."
}
```

**Invalid API Key**
```json
{
  "error": "Invalid API key"
}
```

**Duplicate Lead**
- No error thrown
- Existing lead is updated instead
- Response includes `"action": "updated"`

---

## Testing & Examples

### cURL Example - Simple Webhook
```bash
curl -X POST https://[project].supabase.co/functions/v1/import-lead-zapier \
  -H "Content-Type: application/json" \
  -d '{
    "full_name": "John Doe",
    "phone": "555-123-4567",
    "email": "john@example.com",
    "city": "Los Angeles",
    "state": "CA",
    "transactions": 25,
    "client_email": "broker@company.com"
  }'
```

### cURL Example - Agent Webhook with Secret
```bash
curl -X POST https://[project].supabase.co/functions/v1/agent-lead-webhook \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: your-secret-here" \
  -d '{
    "first_name": "John",
    "last_name": "Doe",
    "phone": "555-123-4567",
    "email": "john@example.com",
    "cities": ["Los Angeles"],
    "states": ["CA"],
    "transactions": 25,
    "client_email": "broker@company.com"
  }'
```

### Zapier Setup
1. Create a new Zap
2. Add trigger (Form, Spreadsheet, etc.)
3. Add "Webhooks by Zapier" action
4. Choose "POST"
5. URL: `https://[project].supabase.co/functions/v1/import-lead-zapier`
6. Payload Type: JSON
7. Map your fields to the JSON structure above

### Google Sheets Integration
Use Zapier or Make.com:
1. Trigger: New row in Google Sheets
2. Action: Webhook POST to import endpoint
3. Map columns to JSON fields

---

## Best Practices

1. **Always Include Phone Number**: It's the primary deduplication key
2. **Provide Email When Possible**: Improves lead quality and communication
3. **Use Consistent Field Names**: Stick to snake_case or camelCase
4. **Include Source**: Track where leads come from
5. **Set Qualification Data**: Provide transactions/experience for better scoring
6. **Test with Sample Data First**: Verify your integration before bulk imports
7. **Monitor Import Results**: Check success/failure counts and error messages
8. **Use Client Assignment**: Automatically route leads to the right broker
9. **Handle Rate Limits**: Implement retry logic with exponential backoff
10. **Validate Data Client-Side**: Check required fields before sending

---

## Support & Troubleshooting

### Common Issues

**Q: Lead not showing up after import**
- Check qualification score - may need to meet minimum threshold
- Verify phone number format is valid
- Check if lead already exists (imports update existing records)

**Q: Client assignment not working**
- Verify client email/phone/ID is correct
- Ensure client account is active
- Check client has sufficient credits (if applicable)

**Q: Getting rate limit errors**
- Reduce request frequency
- Batch multiple leads in single request (Zapier Import)
- Implement exponential backoff retry logic

**Q: Phone numbers not matching**
- All phone numbers normalized to +1XXXXXXXXXX format
- Ensure original import used same phone number
- Check for typos in phone number

### Debug Mode
Add `?debug=true` to webhook URLs for verbose logging:
```
https://[project].supabase.co/functions/v1/import-lead-zapier?debug=true
```

### Getting Help
- Check edge function logs in Supabase dashboard
- Review error messages in API responses
- Contact support with request ID from error response
