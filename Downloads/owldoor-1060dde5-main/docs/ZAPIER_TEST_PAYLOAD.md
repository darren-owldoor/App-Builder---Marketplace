# Zapier API Test Payload

Use this properly formatted JSON payload to test your Zapier integration:

```json
{
  "action": "create_lead",
  "data": {
    "full_name": "Darren Johnson",
    "first_name": "Darren",
    "last_name": "Johnson",
    "email": "darren.johnson@example.com",
    "phone": "8588886399",
    "lead_type": "real_estate_agent",
    "source": "owldoor",
    "qualification_score": "70",
    "motivation": "10",
    "experience": "11",
    "transactions": "77",
    "total_sales": "15500000",
    "company": "exp",
    "brokerage": "exp",
    "team": "KW",
    "cities": "Los Angeles, San Diego",
    "states": "CA",
    "counties": "Los Angeles, San Diego",
    "zip_codes": "92109, 92101, 90210",
    "wants": "leads, training, technology",
    "skills": "lead generation, social media, luxury homes",
    "tags": "hot lead, high producer",
    "status": "new",
    "pipeline_stage": "new",
    "interested_in_opportunities": "true",
    "notes": "Highly motivated agent looking for more leads"
  }
}
```

## Key Fixes from Your Payload:

1. ✅ All string values have quotes
2. ✅ Arrays are comma-separated strings (will be parsed to arrays)
3. ✅ Numbers are strings (will be parsed to correct types)
4. ✅ Booleans are strings "true"/"false"
5. ✅ All fields properly closed with quotes
6. ✅ Valid JSON structure

## Testing in Zapier:

### Method 1: Using Webhooks by Zapier (POST)

1. **Action**: Webhooks by Zapier → POST
2. **URL**: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api`
3. **Payload Type**: JSON
4. **Data**: Paste the JSON above
5. **Headers**:
   - `Content-Type`: `application/json`
   - `x-api-key`: `your_api_key_here`

### Method 2: Minimal Test (Just Required Fields)

```json
{
  "action": "create_lead",
  "data": {
    "full_name": "Test Agent",
    "email": "test@example.com",
    "phone": "5551234567",
    "lead_type": "real_estate_agent"
  }
}
```

### Expected Success Response:

```json
{
  "success": true,
  "data": {
    "id": "uuid-here",
    "user_id": "your-user-id",
    "full_name": "Darren Johnson",
    "email": "darren.johnson@example.com",
    "phone": "+18588886399",
    "cities": ["Los Angeles", "San Diego"],
    "states": ["CA"],
    "zip_codes": ["92109", "92101", "90210"],
    "wants": ["leads", "training", "technology"],
    "skills": ["lead generation", "social media", "luxury homes"],
    "tags": ["hot lead", "high producer"],
    "created_at": "2025-01-01T00:00:00.000Z",
    "updated_at": "2025-01-01T00:00:00.000Z"
  }
}
```

## Common Test Scenarios:

### Test 1: Real Estate Agent with Full Profile
```json
{
  "action": "create_lead",
  "data": {
    "full_name": "Sarah Martinez",
    "email": "sarah@realestate.com",
    "phone": "6195551234",
    "lead_type": "real_estate_agent",
    "experience": "5",
    "transactions": "45",
    "cities": "San Diego",
    "states": "CA",
    "wants": "leads, training",
    "skills": "buyer representation, negotiations"
  }
}
```

### Test 2: Mortgage Officer
```json
{
  "action": "create_lead",
  "data": {
    "full_name": "Mike Thompson",
    "email": "mike@mortgage.com",
    "phone": "7145559999",
    "lead_type": "mortgage_officer",
    "company": "First Home Loans",
    "nmls_id": "123456",
    "cities": "Orange County",
    "states": "CA",
    "wants": "purchase leads, refinance leads"
  }
}
```

### Test 3: List All Leads
```json
{
  "action": "list_leads",
  "page": 1,
  "limit": 10
}
```

### Test 4: Find Specific Lead
```json
{
  "action": "find_lead",
  "filters": {
    "email": "darren.johnson@example.com"
  }
}
```
