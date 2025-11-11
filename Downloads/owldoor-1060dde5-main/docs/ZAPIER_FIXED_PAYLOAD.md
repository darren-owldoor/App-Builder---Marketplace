# Fixed Zapier Test Payload

## Your Original Payload (FIXED)

Here's your payload with corrections and improvements:

```json
{
  "action": "create_lead",
  "data": {
    "first_name": "Test",
    "phone": "8588886399",
    "lead_type": "real_estate_agent"
  }
}
```

## Full Example with Your Fields (Properly Formatted)

```json
{
  "action": "create_lead",
  "data": {
    "first_name": "Test",
    "last_name": "Agent",
    "phone": "8588886399",
    "email": "test@example.com",
    "lead_type": "real_estate_agent",
    "source": "zapier_test",
    "status": "new",
    "pipeline_stage": "new",
    "license_type": "Agent",
    "experience": 5,
    "transactions": 25,
    "total_sales": 8500000,
    "motivation": 8,
    "qualification_score": 75,
    "skills": "buyer representation, luxury homes",
    "wants": "leads, training",
    "tags": "hot lead",
    "profile_url": "https://example.com/profile",
    "image_url": "https://example.com/photo.jpg",
    "states": "CA",
    "counties": "San Diego County",
    "zip_codes": "92109, 92037",
    "cities": "San Diego, La Jolla",
    "radius": 15,
    "company": "Premier Realty",
    "brokerage": "Premier Realty",
    "team": "Elite Team",
    "notes": "Strong candidate for recruitment",
    "interested_in_opportunities": true,
    "price_per_lead": 50,
    "avg_sale": 425000
  }
}
```

## What Was Wrong with Your Payload

1. **Missing REQUIRED field**: `lead_type` (must be "real_estate_agent" or "mortgage_officer")
2. **Wrong field names**:
   - `user_type` → should be `lead_type` or `pro_type`
   - `county` → should be `counties` (plural)
   - `transactions_per_year` → use `transactions` instead
   - `yearly_sales` → use `total_sales` instead
   - `company_name` → use `company` instead

3. **Unsupported fields** (will be ignored):
   - `real_estate_agent` (not a field, use `lead_type` instead)
   - `price_range_max` (not in database)
   - `client_email`, `client_id`, `client_phone` (only for admin use)

4. **Empty strings**: Many fields had `""` which is fine, but better to omit them entirely

## How to Use This in Zapier

### Method 1: Minimal Test
Send just the essentials:
```json
{
  "action": "create_lead",
  "data": {
    "first_name": "Test",
    "phone": "8588886399",
    "lead_type": "real_estate_agent"
  }
}
```

### Method 2: Use the Full Example Above
Copy the "Full Example" and adjust values as needed.

### Method 3: Map from Zapier Fields
In your Zapier action code:
```javascript
const options = {
  url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api',
  method: 'POST',
  headers: {
    'X-API-KEY': bundle.authData.api_key,
    'Content-Type': 'application/json'
  },
  body: {
    action: 'create_lead',
    data: {
      // Only include fields that have values
      ...(bundle.inputData.first_name && { first_name: bundle.inputData.first_name }),
      ...(bundle.inputData.last_name && { last_name: bundle.inputData.last_name }),
      ...(bundle.inputData.phone && { phone: bundle.inputData.phone }),
      ...(bundle.inputData.email && { email: bundle.inputData.email }),
      
      // REQUIRED: Always include lead_type
      lead_type: bundle.inputData.lead_type || 'real_estate_agent',
      
      // Optional fields
      ...(bundle.inputData.source && { source: bundle.inputData.source }),
      ...(bundle.inputData.company && { company: bundle.inputData.company }),
      ...(bundle.inputData.cities && { cities: bundle.inputData.cities }),
      ...(bundle.inputData.states && { states: bundle.inputData.states }),
      ...(bundle.inputData.zip_codes && { zip_codes: bundle.inputData.zip_codes }),
    }
  }
};

return z.request(options)
  .then((response) => {
    response.throwForStatus();
    return response.json;
  });
```

## Expected Success Response

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "user_id": "uuid-here",
    "full_name": "Test Agent",
    "first_name": "Test",
    "last_name": "Agent",
    "email": "test@example.com",
    "phone": "8588886399",
    "lead_type": "real_estate_agent",
    "status": "new",
    "pipeline_stage": "new",
    "source": "zapier_test",
    "created_at": "2024-01-15T10:30:00Z",
    "updated_at": "2024-01-15T10:30:00Z",
    "cities": ["San Diego", "La Jolla"],
    "states": ["CA"],
    "zip_codes": ["92109", "92037"],
    "counties": ["San Diego County"],
    "skills": ["buyer representation", "luxury homes"],
    "wants": ["leads", "training"],
    "tags": ["hot lead"]
  }
}
```

## Quick Reference: Field Mappings

| Your Field | Maps To | Note |
|-----------|---------|------|
| user_type | lead_type | REQUIRED |
| county | counties | Use plural |
| transactions_per_year | transactions | Either works |
| yearly_sales | total_sales | Use total_sales |
| company_name | company | Use company |
| license_number | license | Either works |
| real_estate_agent | lead_type: "real_estate_agent" | Not a separate field |

## Testing Tips

1. **Start minimal**: Test with just `first_name`, `phone`, and `lead_type`
2. **Add gradually**: Once basic test works, add more fields
3. **Check response**: Look for `"success": true` in the response
4. **Empty fields**: Omit them entirely rather than sending empty strings
5. **Arrays**: Send as comma-separated strings: `"San Diego, La Jolla"`
