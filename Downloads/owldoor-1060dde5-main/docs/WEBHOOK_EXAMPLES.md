# Webhook Examples

## Agent Lead Webhook - Complete Example

### Endpoint
```
POST https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/agent-lead-webhook
```

### Headers
```json
{
  "Content-Type": "application/json",
  "Authorization": "Bearer YOUR_ANTHROPIC_API_KEY"
}
```

Or use webhook secret:
```json
{
  "Content-Type": "application/json",
  "x-webhook-secret": "YOUR_WEBHOOK_SECRET"
}
```

### Complete Payload Example (Match-Ready Agent)

This example includes all fields populated to create a highly qualified agent ready for matching:

```json
{
  "first_name": "Sarah",
  "last_name": "Johnson",
  "phone": "+12135551234",
  "email": "sarah.johnson@realestate.com",
  
  "pro_type": "real_estate_agent",
  "brokerage": "Keller Williams Realty",
  "license_type": "Real Estate Broker",
  
  "years_experience": 8,
  "transactions": 45,
  "total_sales": 18500000,
  "motivation": 9,
  
  "cities": ["Los Angeles", "Santa Monica", "Beverly Hills"],
  "states": ["CA"],
  "counties": ["Los Angeles County"],
  "zip_codes": ["90210", "90401", "90291"],
  
  "full_address": "123 Sunset Blvd, Los Angeles, CA 90210",
  "address": "123 Sunset Blvd",
  
  "wants": [
    "team_culture",
    "training_support",
    "higher_splits",
    "marketing_resources",
    "technology_tools"
  ],
  
  "skills": [
    "luxury_homes",
    "first_time_buyers",
    "investment_properties",
    "negotiation",
    "staging",
    "social_media_marketing"
  ],
  
  "languages": ["English", "Spanish"],
  "designations": ["CRS", "GRI", "ABR"],
  
  "tags": ["top_producer", "luxury_specialist", "multilingual"],
  
  "image_url": "https://example.com/photos/sarah-johnson.jpg",
  "profile_url": "https://sarahjohnsonrealtor.com",
  "linkedin_url": "https://linkedin.com/in/sarahjohnsonrealtor",
  "facebook_url": "https://facebook.com/sarahjohnsonrealestate",
  "instagram_url": "https://instagram.com/sarahjohnsonhomes",
  "twitter_url": "https://twitter.com/sarahjrealtor",
  "website_url": "https://sarahjohnsonrealtor.com",
  
  "notes": "Top producing agent with expertise in luxury coastal properties. Strong social media presence. Looking for a brokerage that values work-life balance and provides cutting-edge technology.",
  
  "source": "website_form",
  "lead_source_detail": "Home page contact form - Brokerage inquiry",
  
  "client_email": "recruiter@kwla.com",
  "client_phone": "+13105559999",
  "lead_price": 150
}
```

### Field Explanations

#### Required Fields (Minimum)
- `first_name`: Agent's first name
- `last_name`: Agent's last name  
- `phone`: Phone number in E.164 format (+1XXXXXXXXXX)

#### Highly Recommended for Matching
- `email`: Contact email
- `pro_type`: "real_estate_agent" or "mortgage_officer"
- `years_experience`: Number of years in the industry
- `transactions`: Number of closed transactions
- `total_sales`: Total dollar volume of sales
- `motivation`: Interest level (1-10 scale)
- `cities`, `states`, `zip_codes`: Geographic coverage areas

#### Profile Enhancement
- `brokerage`: Current brokerage name
- `license_type`: License level/type
- `wants`: Array of what they're looking for
- `skills`: Array of specializations
- `languages`: Languages spoken
- `designations`: Professional designations (CRS, GRI, etc.)

#### Social & Web Presence
- `image_url`: Profile photo URL
- `profile_url`: Personal website/profile
- `linkedin_url`, `facebook_url`, `instagram_url`, `twitter_url`: Social profiles
- `website_url`: Professional website

#### Auto-Assignment to Client
- `client_email` OR `client_phone`: Automatically creates a match with the specified client
- `lead_price`: Price for the lead (default: 0)

### Qualification Scoring

The webhook automatically calculates a qualification score (0-100) based on:
- **Transactions** (0-40 points): 40 pts for 25+, 30 pts for 15+, 20 pts for 10+, 10 pts for 5+
- **Years Experience** (0-30 points): 30 pts for 5+, 20 pts for 3+, 10 pts for 1+
- **Motivation** (0-30 points): Based on 1-10 scale

### Pipeline Stage Assignment

Based on qualification score:
- **0-39**: `new` - New lead, needs nurturing
- **40-69**: `qualifying` - Moderate interest, follow up needed
- **70-100**: `qualified` - High quality, ready for matching

### Response Examples

#### Success - New Agent Created
```json
{
  "success": true,
  "action": "created",
  "lead": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "full_name": "Sarah Johnson",
    "email": "sarah.johnson@realestate.com",
    "phone": "+12135551234",
    "qualification_score": 85,
    "status": "qualified"
  },
  "match_created": true,
  "match_id": "m1n2o3p4-q5r6-7890-stuv-wx1234567890"
}
```

#### Success - Existing Agent Updated
```json
{
  "success": true,
  "action": "updated",
  "lead": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "full_name": "Sarah Johnson",
    "email": "sarah.johnson@realestate.com",
    "phone": "+12135551234",
    "qualification_score": 85,
    "status": "qualified"
  }
}
```

#### Error - Missing Required Fields
```json
{
  "error": "Missing required fields: first_name, last_name, phone"
}
```

#### Error - Unauthorized
```json
{
  "error": "Unauthorized - Provide x-webhook-secret or Authorization header"
}
```

## Client Webhook - Complete Example

### Endpoint
```
POST https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/client-webhook
```

### Complete Payload Example

```json
{
  "company_name": "Elite Realty Group",
  "contact_name": "Michael Chen",
  "email": "michael.chen@eliterealty.com",
  "client_type": "real_estate",
  
  "first_name": "Michael",
  "last_name": "Chen",
  "phone": "+14155551234",
  "phone2": "+14155559999",
  "email2": "michael@eliterealty.com",
  
  "brokerage": "Elite Realty Group",
  "license_type": "Broker",
  
  "cities": ["San Francisco", "Oakland", "Berkeley"],
  "states": ["CA"],
  "zip_codes": ["94102", "94601", "94704"],
  "county": "San Francisco County",
  
  "years_experience": 15,
  "yearly_sales": 50000000,
  "avg_sale": 1250000,
  
  "skills": ["luxury_properties", "team_building", "coaching"],
  "wants": ["experienced_agents", "team_players", "self_motivated"],
  "needs": "Looking for senior agents to join our growing luxury division",
  
  "languages": ["English", "Mandarin"],
  "designations": ["Broker", "CRS"],
  
  "image_url": "https://eliterealty.com/photos/michael.jpg",
  "website_url": "https://eliterealty.com",
  "linkedin_url": "https://linkedin.com/in/michaelchen",
  "facebook_url": "https://facebook.com/eliterealtygroup",
  
  "coverage_areas": [
    {
      "type": "city",
      "name": "San Francisco",
      "state": "CA"
    },
    {
      "type": "zip",
      "name": "94102"
    }
  ],
  
  "preferences": {
    "lead_price_max": 200,
    "auto_match": true,
    "notification_email": true
  },
  
  "credits_balance": 1000,
  "monthly_spend_maximum": 5000,
  
  "tags": ["high_volume", "luxury_specialist"]
}
```

### Client Type Options
- `real_estate`: Real estate brokerages/teams
- `mortgage`: Mortgage lenders/companies

## Testing with cURL

### Test Agent Webhook
```bash
curl -X POST \
  https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/agent-lead-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANTHROPIC_API_KEY" \
  -d '{
    "first_name": "Test",
    "last_name": "Agent",
    "phone": "+15555551234",
    "email": "test@example.com",
    "pro_type": "real_estate_agent",
    "years_experience": 5,
    "transactions": 25,
    "motivation": 8
  }'
```

### Test Client Webhook
```bash
curl -X POST \
  https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/client-webhook \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANTHROPIC_API_KEY" \
  -d '{
    "company_name": "Test Brokerage",
    "contact_name": "Test Manager",
    "email": "test@brokerage.com",
    "client_type": "real_estate"
  }'
```

## External Webhook - Query Examples

### Get Summary Data
```bash
curl -X GET \
  "https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/external-webhook?action=summary" \
  -H "Authorization: Bearer YOUR_ANTHROPIC_API_KEY"
```

### Get Recent Pros
```bash
curl -X GET \
  "https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/external-webhook?action=pros" \
  -H "Authorization: Bearer YOUR_ANTHROPIC_API_KEY"
```

### Get Recent Clients
```bash
curl -X GET \
  "https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/external-webhook?action=clients" \
  -H "Authorization: Bearer YOUR_ANTHROPIC_API_KEY"
```

### Get Recent Matches
```bash
curl -X GET \
  "https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/external-webhook?action=matches" \
  -H "Authorization: Bearer YOUR_ANTHROPIC_API_KEY"
```
