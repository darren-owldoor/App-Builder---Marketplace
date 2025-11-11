# Zapier API Request Configuration

## Complete Request Example

Use this in your Zapier Action "API Request" code:

```javascript
const options = {
  url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api',
  method: 'POST',
  headers: {
    'X-API-KEY': bundle.authData.api_key, // Use auth data, not hardcoded
    'Content-Type': 'application/json'
  },
  body: {
    'action': 'create_lead',
    'data': {
      // === CORE IDENTITY FIELDS ===
      'full_name': bundle.inputData.full_name,
      'first_name': bundle.inputData.first_name,
      'last_name': bundle.inputData.last_name,
      'email': bundle.inputData.email,
      'phone': bundle.inputData.phone,
      
      // === LEAD CLASSIFICATION ===
      'lead_type': bundle.inputData.lead_type, // REQUIRED: "real_estate_agent" or "mortgage_officer"
      'pro_type': bundle.inputData.pro_type, // Same as lead_type (alternative field name)
      'source': bundle.inputData.source, // Where the lead came from
      'status': bundle.inputData.status, // e.g., "new", "contacted", "qualified"
      'pipeline_stage': bundle.inputData.pipeline_stage, // e.g., "new", "contacted", "qualified"
      'pipeline_type': bundle.inputData.pipeline_type, // e.g., "staff", "recruit"
      
      // === PROFESSIONAL INFO ===
      'company': bundle.inputData.company,
      'brokerage': bundle.inputData.brokerage,
      'team': bundle.inputData.team,
      'license_type': bundle.inputData.license_type, // e.g., "Broker", "Agent"
      'state_license': bundle.inputData.state_license, // License state
      'license': bundle.inputData.license, // License number
      'license_number': bundle.inputData.license_number, // Alternative field name
      'nmls_id': bundle.inputData.nmls_id, // For mortgage officers
      
      // === EXPERIENCE & PERFORMANCE ===
      'experience': bundle.inputData.experience, // Years of experience
      'years_experience': bundle.inputData.years_experience, // Alternative field name
      'transactions': bundle.inputData.transactions, // Annual transactions
      'transactions_per_year': bundle.inputData.transactions_per_year, // Alternative field name
      'total_sales': bundle.inputData.total_sales, // Total sales volume
      'yearly_sales': bundle.inputData.yearly_sales, // Alternative field name
      'avg_sale': bundle.inputData.avg_sale, // Average sale price
      'buyer_units': bundle.inputData.buyer_units, // Number of buyer transactions
      'buyer_volume': bundle.inputData.buyer_volume, // Buyer transaction volume
      
      // === QUALIFICATION METRICS ===
      'qualification_score': bundle.inputData.qualification_score, // 0-100
      'motivation': bundle.inputData.motivation, // 1-10
      
      // === LOCATION & COVERAGE ===
      'cities': bundle.inputData.cities, // Comma-separated or array
      'states': bundle.inputData.states, // Comma-separated or array
      'counties': bundle.inputData.counties, // Comma-separated or array
      'zip_codes': bundle.inputData.zip_codes, // Comma-separated or array
      'radius': bundle.inputData.radius, // Service radius in miles
      'address': bundle.inputData.address, // Full address
      'primary_neighborhoods': bundle.inputData.primary_neighborhoods, // Primary areas
      
      // === PREFERENCES & SKILLS ===
      'wants': bundle.inputData.wants, // Comma-separated: "leads, training, technology"
      'needs': bundle.inputData.needs, // What they need
      'skills': bundle.inputData.skills, // Comma-separated: "buyer rep, luxury, negotiation"
      'tags': bundle.inputData.tags, // Comma-separated: "hot lead, high producer"
      
      // === ONLINE PRESENCE ===
      'profile_url': bundle.inputData.profile_url,
      'image_url': bundle.inputData.image_url,
      'website_url': bundle.inputData.website_url, // NOT SUPPORTED - use profile_url
      'linkedin_url': bundle.inputData.linkedin_url, // NOT SUPPORTED
      'facebook_url': bundle.inputData.facebook_url, // NOT SUPPORTED
      
      // === ADDITIONAL INFO ===
      'notes': bundle.inputData.notes,
      'interested_in_opportunities': bundle.inputData.interested_in_opportunities, // "true" or "false"
      'price_per_lead': bundle.inputData.price_per_lead, // Lead pricing
    }
  }
};

return z.request(options)
  .then((response) => {
    response.throwForStatus();
    const results = response.json;
    return results;
  });
```

## Supported vs Unsupported Fields

### ✅ SUPPORTED FIELDS (in pros table)
These fields are supported by the API:

**Core Fields:**
- full_name, first_name, last_name, email, phone

**Lead Classification:**
- lead_type, pro_type, source, status, pipeline_stage, pipeline_type

**Professional:**
- company, brokerage, team, license_type, state_license, license, license_number, nmls_id

**Experience:**
- experience, years_experience, transactions, transactions_per_year, total_sales, yearly_sales, avg_sale, buyer_units, buyer_volume

**Qualification:**
- qualification_score, motivation

**Location:**
- cities, states, counties, zip_codes, radius, address, primary_neighborhoods

**Preferences:**
- wants, needs, skills, tags

**Online:**
- profile_url, image_url

**Other:**
- notes, interested_in_opportunities, price_per_lead

### ❌ NOT SUPPORTED FIELDS (not in pros table)
These fields are NOT in the database and will be filtered out:

- bio
- website_url (use `profile_url` instead)
- linkedin_url
- facebook_url
- twitter_url
- instagram_url
- languages
- designations
- client_email
- real_estate_agent
- price_range_max

## Field Name Aliases

The API automatically maps these aliases:

| You Send | Stored As |
|----------|-----------|
| company_name | company |
| transactions | transactions_per_year |
| yearly_sales | transactions |
| user_type | pro_type |
| profile | profile_url |
| image | image_url |
| Phone | phone |
| Motivation | motivation |
| city | cities (as array) |
| state | states (as array) |
| county | counties (as array) |
| zip_code | zip_codes (as array) |
| tag | tags (as array) |
| want | wants (as array) |
| skill | skills (as array) |
| license_number | license |

## Minimal Required Fields

The absolute minimum to create a lead:

```javascript
body: {
  'action': 'create_lead',
  'data': {
    'full_name': 'John Doe',
    'email': 'john@example.com',
    'phone': '5551234567',
    'lead_type': 'real_estate_agent' // REQUIRED
  }
}
```

## Recommended Fields for Quality Leads

```javascript
body: {
  'action': 'create_lead',
  'data': {
    // Identity
    'full_name': bundle.inputData.full_name,
    'email': bundle.inputData.email,
    'phone': bundle.inputData.phone,
    
    // Classification
    'lead_type': bundle.inputData.lead_type,
    'source': bundle.inputData.source,
    'status': 'new',
    'pipeline_stage': 'new',
    
    // Professional
    'company': bundle.inputData.company,
    'brokerage': bundle.inputData.brokerage,
    'experience': bundle.inputData.experience,
    'transactions': bundle.inputData.transactions,
    
    // Location
    'cities': bundle.inputData.cities,
    'states': bundle.inputData.states,
    'zip_codes': bundle.inputData.zip_codes,
    
    // Preferences
    'wants': bundle.inputData.wants,
    'skills': bundle.inputData.skills,
    
    // Qualification
    'qualification_score': bundle.inputData.qualification_score,
    'motivation': bundle.inputData.motivation
  }
}
```

## Input Field Configuration in Zapier

When setting up your Zapier action, add these input fields:

### Critical Fields (always show):
```javascript
{
  key: 'lead_type',
  label: 'Lead Type',
  type: 'string',
  required: true,
  choices: {
    'real_estate_agent': 'Real Estate Agent',
    'mortgage_officer': 'Mortgage Officer'
  },
  helpText: 'Type of professional'
},
{
  key: 'full_name',
  label: 'Full Name',
  type: 'string',
  required: true
},
{
  key: 'email',
  label: 'Email',
  type: 'string',
  required: false
},
{
  key: 'phone',
  label: 'Phone Number',
  type: 'string',
  required: false,
  helpText: 'Format: 5551234567 or +15551234567'
}
```

### Optional Fields (for better data):
```javascript
{
  key: 'source',
  label: 'Lead Source',
  type: 'string',
  helpText: 'Where did this lead come from?'
},
{
  key: 'cities',
  label: 'Cities',
  type: 'string',
  helpText: 'Comma-separated: Los Angeles, San Diego'
},
{
  key: 'states',
  label: 'States',
  type: 'string',
  helpText: 'Comma-separated state codes: CA, TX'
},
{
  key: 'zip_codes',
  label: 'Zip Codes',
  type: 'string',
  helpText: 'Comma-separated: 92109, 92101'
},
{
  key: 'experience',
  label: 'Years of Experience',
  type: 'integer'
},
{
  key: 'transactions',
  label: 'Annual Transactions',
  type: 'integer'
},
{
  key: 'qualification_score',
  label: 'Qualification Score',
  type: 'integer',
  helpText: '0-100'
},
{
  key: 'motivation',
  label: 'Motivation Level',
  type: 'integer',
  helpText: '1-10 scale'
}
```

## Authentication Setup

In your Zapier app, set up API Key authentication:

```javascript
const authentication = {
  type: 'custom',
  fields: [
    {
      key: 'api_key',
      label: 'API Key',
      required: true,
      type: 'string',
      helpText: 'Get your API key from OwlDoor settings'
    }
  ],
  test: {
    url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api',
    method: 'POST',
    headers: {
      'X-API-KEY': '{{bundle.authData.api_key}}',
      'Content-Type': 'application/json'
    },
    body: {
      action: 'list_leads',
      page: 1,
      limit: 1
    }
  }
};
```

## Testing Your Integration

### Test 1: Create Lead (Minimal)
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

### Test 2: Create Lead (Full)
```json
{
  "action": "create_lead",
  "data": {
    "full_name": "Sarah Martinez",
    "first_name": "Sarah",
    "last_name": "Martinez",
    "email": "sarah@realestate.com",
    "phone": "6195551234",
    "lead_type": "real_estate_agent",
    "source": "website_form",
    "status": "new",
    "pipeline_stage": "new",
    "company": "Premier Realty",
    "brokerage": "Premier Realty",
    "experience": 5,
    "transactions": 45,
    "total_sales": 12500000,
    "qualification_score": 85,
    "motivation": 9,
    "cities": "San Diego, La Jolla",
    "states": "CA",
    "zip_codes": "92109, 92037",
    "wants": "leads, training, technology",
    "skills": "buyer representation, luxury homes",
    "tags": "high producer, tech savvy"
  }
}
```

### Test 3: List Leads
```json
{
  "action": "list_leads",
  "page": 1,
  "limit": 10
}
```

### Test 4: Find Lead
```json
{
  "action": "find_lead",
  "filters": {
    "email": "sarah@realestate.com"
  }
}
```

## Common Errors & Solutions

### Error: "Unexpected end of JSON input"
**Cause**: Empty request body
**Solution**: Ensure body is properly formatted JSON

### Error: "API key is required"
**Cause**: Missing X-API-KEY header
**Solution**: Add header with your API key

### Error: "Unknown action"
**Cause**: Invalid action value
**Solution**: Use one of: create_lead, list_leads, find_lead, create_client, list_clients, find_client

### Error: Field not saving
**Cause**: Field not in validLeadColumns list
**Solution**: Use only supported fields from the table above
