# Zapier Input Field Examples

Complete reference of all available fields with example values for the Zapier integration.

## Example Request Body

```json
{
  "inputData": {
    "license_type": "Licensed Real Estate Salesperson",
    "first_name": "Sarah",
    "last_name": "Johnson",
    "phone": "+1-555-123-4567",
    "full_name": "Sarah Johnson",
    "email": "sarah.johnson@example.com",
    "source": "referral",
    "tags": "luxury,waterfront,commercial",
    "experience": "8",
    "total_sales": "15000000.00",
    "motivation": "7",
    "skills": "negotiation,marketing,staging",
    "profile_url": "https://www.example.com/agents/sarah-johnson",
    "image_url": "https://www.example.com/images/sarah-johnson.jpg",
    "states": "CA,NV",
    "county": "Los Angeles County",
    "zip_codes": "90210,90211,90212",
    "radius": "15",
    "company": "Premier Realty Group",
    "team": "Luxury Division",
    "brokerage": "Keller Williams Beverly Hills",
    "transactions_per_year": "45",
    "notes": "Specializes in luxury properties over $2M. Excellent track record with international clients.",
    "cities": "Beverly Hills,West Hollywood,Malibu",
    "user_type": "real_estate_agent",
    "wants": "leads,training,mentorship",
    "pipeline_stage": "qualified",
    "qualification_score": "85",
    "status": "active",
    "client_email": "broker@premierrealty.com",
    "client_id": "123e4567-e89b-12d3-a456-426614174000",
    "client_phone": "+1-555-987-6543",
    "price_per_lead": "150.00",
    "interested_in_opportunities": "true",
    "avg_sale": "850000.00",
    "company_name": "Premier Realty Group",
    "transactions": "45",
    "yearly_sales": "45",
    "needs": "more leads in luxury market"
  }
}
```

## Field-by-Field Examples

### Personal Information (TEXT)

| Field | Example | Description |
|-------|---------|-------------|
| `first_name` | `"Sarah"` | First name of the agent |
| `last_name` | `"Johnson"` | Last name of the agent |
| `full_name` | `"Sarah Johnson"` | Full name (auto-generated from first + last if not provided) |
| `email` | `"sarah.johnson@example.com"` | Primary email address |
| `phone` | `"+1-555-123-4567"` | Primary phone number |

### Professional Information (TEXT)

| Field | Example | Description |
|-------|---------|-------------|
| `license_type` | `"Licensed Real Estate Salesperson"` | Type of real estate license |
| `company` | `"Premier Realty Group"` | Company name |
| `company_name` | `"Premier Realty Group"` | Company name (alias for company) |
| `brokerage` | `"Keller Williams Beverly Hills"` | Brokerage firm name |
| `team` | `"Luxury Division"` | Team name within brokerage |
| `user_type` | `"real_estate_agent"` | Agent type: `real_estate_agent` or `mortgage_officer` |
| `source` | `"referral"` | Lead source (referral, website, social_media, etc.) |
| `needs` | `"more leads in luxury market"` | What the agent needs/is looking for |

### Profile & Social Media (TEXT)

| Field | Example | Description |
|-------|---------|-------------|
| `profile_url` | `"https://www.example.com/agents/sarah-johnson"` | Agent's profile page URL |
| `image_url` | `"https://www.example.com/images/sarah-johnson.jpg"` | Profile picture URL |
| `notes` | `"Specializes in luxury properties over $2M"` | Additional notes about the agent |

### Location Information (TEXT & TEXT ARRAY)

| Field | Example | Description |
|-------|---------|-------------|
| `cities` | `"Beverly Hills,West Hollywood,Malibu"` | Comma-separated cities (converted to array) |
| `states` | `"CA,NV"` | Comma-separated states (converted to array) |
| `zip_codes` | `"90210,90211,90212"` | Comma-separated ZIP codes (converted to array) |
| `county` | `"Los Angeles County"` | County name |
| `radius` | `"15"` | Coverage radius in miles |

### Performance Metrics (INTEGER)

| Field | Example | Description |
|-------|---------|-------------|
| `experience` | `"8"` | Years of experience |
| `transactions` | `"45"` | Annual transactions (same as transactions_per_year) |
| `transactions_per_year` | `"45"` | Annual transactions (same as transactions) |
| `yearly_sales` | `"45"` | Annual transactions (same as transactions) |
| `motivation` | `"7"` | Motivation score (1-10) |
| `qualification_score` | `"85"` | Qualification score (0-100) |

### Financial Metrics (NUMERIC)

| Field | Example | Description |
|-------|---------|-------------|
| `total_sales` | `"15000000.00"` | Total sales volume in dollars |
| `avg_sale` | `"850000.00"` | Average sale price |
| `price_per_lead` | `"150.00"` | Price per lead in dollars |

### Skills & Preferences (TEXT ARRAY)

| Field | Example | Description |
|-------|---------|-------------|
| `skills` | `"negotiation,marketing,staging"` | Comma-separated skills (converted to array) |
| `wants` | `"leads,training,mentorship"` | Comma-separated wants (converted to array) |
| `tags` | `"luxury,waterfront,commercial"` | Comma-separated tags (converted to array) |

### Status & Pipeline (TEXT)

| Field | Example | Description |
|-------|---------|-------------|
| `status` | `"active"` | Agent status (active, inactive, pending, etc.) |
| `pipeline_stage` | `"qualified"` | Pipeline stage (new, contacted, qualified, match_ready, etc.) |

### Client Assignment (TEXT & UUID)

| Field | Example | Description |
|-------|---------|-------------|
| `client_id` | `"123e4567-e89b-12d3-a456-426614174000"` | UUID of the client to assign to |
| `client_email` | `"broker@premierrealty.com"` | Client email (alternative to client_id) |
| `client_phone` | `"+1-555-987-6543"` | Client phone (alternative to client_id) |

### Boolean Fields (BOOLEAN)

| Field | Example | Description |
|-------|---------|-------------|
| `interested_in_opportunities` | `"true"` | Whether agent is interested in opportunities |
| `active` | `"true"` | Whether the agent/pro is active |

## Data Type Notes

### TEXT Arrays
Fields that accept comma-separated values and are converted to arrays:
- `cities`, `states`, `zip_codes`, `skills`, `wants`, `tags`, `languages`, `designations`, `certifications`, `property_types`, `specializations`

Example: `"Beverly Hills,Malibu,Santa Monica"` → `["Beverly Hills", "Malibu", "Santa Monica"]`

### BOOLEAN Fields
Accept string values that will be converted to boolean:
- `"true"`, `"1"`, `"yes"` → `true`
- `"false"`, `"0"`, `"no"` → `false`

### NUMERIC Fields
Accept string representations of numbers:
- Integers: `"45"` → `45`
- Decimals: `"150.00"` → `150.00`
- Large numbers: `"15000000.00"` → `15000000.00`

### Client Assignment
You can assign an agent to a client using one of three methods:
1. **client_id** (preferred): Direct UUID reference
2. **client_email**: System will lookup client by email
3. **client_phone**: System will lookup client by phone number

Only provide ONE of these fields. If multiple are provided, client_id takes precedence.

## Common Pipeline Stages

- `new` - New lead
- `contacted` - Initial contact made
- `qualified` - Lead has been qualified
- `match_ready` - Ready for matching with clients
- `matched` - Has been matched with a client
- `onboarding` - Currently onboarding
- `active` - Active and working
- `inactive` - Inactive
- `directory` - In directory only

## Common Status Values

- `active` - Active agent
- `inactive` - Inactive agent
- `pending` - Pending approval
- `archived` - Archived/removed

## Common Source Values

- `referral` - Referred by someone
- `website` - Website form submission
- `social_media` - Social media lead
- `email_campaign` - Email marketing
- `cold_call` - Cold calling
- `event` - Event/conference
- `partner` - Partner referral
- `zapier` - Imported via Zapier
