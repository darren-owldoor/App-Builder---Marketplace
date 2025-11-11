# Zapier & API Import Guide

## Overview
The Zapier Import API allows you to bypass frontend forms and directly import leads/pros with qualification scores, client assignments, pricing, and field-driven data.

## Base URL
```
https://[your-project].supabase.co/functions/v1/zapier-import
```

## Authentication
Include your Zapier API key in the request header:
```
x-api-key: YOUR_API_KEY
```
or
```
Authorization: Bearer YOUR_API_KEY
```

## Endpoints

### Import Leads/Agents with Intelligent Matching

**POST** `/zapier-import`

Import leads or agents with qualification scores and automatic client matching.

#### Request Body
```json
{
  "entity_type": "leads",
  "data": [
    {
      "full_name": "John Doe",
      "email": "john@example.com",
      "phone": "(555) 123-4567",
      
      // Location - Arrays or comma-separated strings
      "city": "San Diego",              // or ["San Diego", "Los Angeles"]
      "state": "CA",                    // or ["CA", "NV"]
      "zip_code": "92101",              // or ["92101", "92102"]
      "tags": "hot,qualified",          // or ["hot", "qualified"]
      
      // Professional Info
      "pro_type": "real_estate_agent",  // or "mortgage_lender"
      "user_type": "Real Estate",       // Alternative field name
      "experience": 5,
      "transactions_per_year": 20,
      "wants": "team,training",         // or ["team", "training"]
      
      // Status
      "status": "new",
      "pipeline_stage": "new",
      
      // Client Assignment (choose ONE method)
      "client_id": "uuid-of-client",    // Direct UUID
      "client_email": "broker@example.com", // OR email lookup
      "client_phone": "+1234567890",    // OR phone lookup
      
      // Intelligent Matching
      "qualification_score": 85,
      "price_per_lead": 50,
      
      // Field Definition Data (dynamic fields)
      "field_data": {
        "experience_years": "3+",
        "homes_sold_per_year": "16+",
        "total_volume": "$5M",
        "specialties": ["luxury", "commercial"],
        "license_number": "CA-123456"
      },
      
      // Smart Qualification Data
      "qualification_data": {
        "agent_path": "pro",
        "experience_years": "3+",
        "homes_sold_per_year": "16+",
        "biggest_challenge": "leads",
        "most_important_next_year": "income",
        "timeline": "30days",
        "contact_preference": "text",
        "wants_matches": "yes"
      }
    }
  ]
}
```

#### Response
```json
{
  "success": true,
  "imported": 1,
  "entity_type": "leads"
}
```

## Field Types

### Array Fields Support
**All array fields accept BOTH arrays and comma-separated strings:**

```json
// These are equivalent:
"tags": ["hot", "qualified"]
"tags": "hot,qualified"

// Supported array fields:
- tags
- zip_codes / zip_code
- cities / city  
- states / state
- counties
- skills
- languages
- designations
- wants
```

### Client Assignment Methods
**Three ways to assign leads to clients:**

1. **Direct UUID:**
   ```json
   "client_id": "550e8400-e29b-41d4-a716-446655440000"
   ```

2. **Email Lookup:**
   ```json
   "client_email": "broker@example.com"
   ```

3. **Phone Lookup:**
   ```json
   "client_phone": "+1234567890"
   ```

The system automatically looks up the client and creates the match.

### Base Fields (Required/Optional)
- `full_name` (string, optional)
- `email` (string, email format, optional)
- `phone` (string, optional)
- `city` (string, optional)
- `state` (string, 2 chars, optional)
- `zip_code` (string, optional)
- `status` (string, optional, default: "new")
- `pipeline_stage` (string, optional, default: "new")

### Intelligent Matching Fields
- `qualification_score` (number, 0-100) - Pre-calculated qualification score
- `client_id` (uuid) - Auto-creates match with specified client
- `price_per_lead` (number) - Override default pricing for this lead

### Field Definition Data
`field_data` object can contain any fields defined in your `field_definitions` table:

Common examples:
- `experience_years`: "3+", "1-3", "<1"
- `homes_sold_per_year`: "16+", "6-15", "0-5"
- `total_volume`: "$5M", "$1M", etc.
- `specialties`: ["luxury", "commercial", "residential"]
- `license_number`: string
- `languages`: ["English", "Spanish"]
- `certifications`: ["CRS", "GRI"]

### Smart Qualification Data
`qualification_data` object stores the complete questionnaire responses:
- `agent_path`: "short" | "mid" | "pro"
- `experience_years`: string
- `homes_sold_per_year`: string
- `biggest_challenge`: string
- `most_important_next_year`: string
- `timeline`: string
- `contact_preference`: "text" | "call" | "email"
- `wants_matches`: "yes" | "check" | "not-yet"

## Array Fields

The API supports **both arrays and comma-separated strings** for array fields:

```typescript
// These are equivalent:
{
  "tags": ["hot", "qualified", "follow-up"]
}

{
  "tags": "hot,qualified,follow-up"
}

// All array fields support both formats:
- tags
- zip_codes / zip_code
- cities / city
- states / state
- counties
- skills
- languages
- designations
- wants
```

## Client Assignment Methods

You can assign leads to clients using **three different methods**:

### 1. Direct UUID
```json
{
  "client_id": "550e8400-e29b-41d4-a716-446655440000"
}
```

### 2. Client Email Lookup
```json
{
  "client_email": "broker@example.com"
}
```

### 3. Client Phone Lookup
```json
{
  "client_phone": "+1234567890"
}
```

The system will automatically look up the client and create the match if found.

### 1. Landing Page Direct Import
Capture leads from external landing pages and import with qualification scores:

```javascript
// From your landing page
const leadData = {
  entity_type: "leads",
  data: [{
    full_name: formData.name,
    email: formData.email,
    phone: formData.phone,
    city: formData.city,
    state: formData.state,
    qualification_score: 75, // Pre-calculated
    field_data: {
      experience_years: formData.experience,
      specialties: formData.specialties
    }
  }]
};

await fetch('https://[project].supabase.co/functions/v1/zapier-import', {
  method: 'POST',
  headers: {
    'x-api-key': 'YOUR_API_KEY',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(leadData)
});
```

### 2. Zapier Zap with Auto-Matching
Set up a Zap that:
1. Triggers on form submission (Typeform, Google Forms, etc.)
2. Runs a Code step to format data
3. Sends to zapier-import with client_id for auto-matching

```javascript
// Zapier Code Step
const output = {
  entity_type: "leads",
  data: [{
    full_name: inputData.name,
    email: inputData.email,
    phone: inputData.phone,
    qualification_score: calculateScore(inputData), // Your scoring logic
    client_id: inputData.assigned_client_id,
    price_per_lead: inputData.custom_price || 50,
    field_data: {
      experience_years: inputData.experience,
      homes_sold_per_year: inputData.sales
    }
  }]
};
```

### 3. Testing Intelligent Matcher
Import test data with various qualification scores to test matching:

```bash
curl -X POST https://[project].supabase.co/functions/v1/zapier-import \
  -H "x-api-key: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "entity_type": "leads",
    "data": [
      {
        "full_name": "Test Agent High Score",
        "email": "test1@example.com",
        "qualification_score": 95,
        "field_data": {
          "experience_years": "3+",
          "homes_sold_per_year": "16+"
        }
      },
      {
        "full_name": "Test Agent Low Score",
        "email": "test2@example.com",
        "qualification_score": 30,
        "field_data": {
          "experience_years": "<1",
          "homes_sold_per_year": "0-5"
        }
      }
    ]
  }'
```

## Rate Limits
- 100 imports per minute per IP
- Max 1000 records per request

## Error Handling
```json
{
  "error": "Invalid request data",
  "details": [
    "data.0.email: Invalid email address"
  ]
}
```

Common errors:
- `401`: Invalid API key
- `400`: Validation error (check details field)
- `429`: Rate limit exceeded
- `500`: Server error

## Getting Your API Key
1. Navigate to Admin → Integrations → Zapier
2. Click "Generate API Key"
3. Copy and store securely
4. Use in x-api-key header

## Auto-Matching Behavior
When you include `client_id` in the lead data:
- A match record is automatically created
- Match score is set to `qualification_score` (or 0 if not provided)
- Match status is set to "pending"
- If `price_per_lead` is provided, it overrides default pricing

## Best Practices
1. **Always validate data** before sending to API
2. **Include qualification_score** for better matching
3. **Use field_data** to leverage field-driven matching
4. **Test with small batches** before bulk imports
5. **Monitor rate limits** in production
6. **Store API keys securely** (never in frontend code)
