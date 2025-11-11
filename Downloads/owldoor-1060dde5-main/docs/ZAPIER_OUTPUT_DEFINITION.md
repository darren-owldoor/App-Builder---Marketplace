# Zapier Output Definition

## Sample Data (JSON Format)

Copy this into the "Static Sample" field in Zapier:

```json
{
  "success": true,
  "data": {
    "id": "4c753c55-d261-4d5e-bdeb-48f11b0d13db",
    "user_id": "349ac2d0-e318-4d8d-a957-7bb5fd241e6f",
    "full_name": "Darren Johnson",
    "first_name": "Darren",
    "last_name": "Johnson",
    "email": "darren.johnson@example.com",
    "phone": "+18588886399",
    "lead_type": "real_estate_agent",
    "status": "new",
    "pipeline_stage": "new",
    "pipeline_type": "staff",
    "qualification_score": 70,
    "source": "owldoor",
    "motivation": 10,
    "experience": 11,
    "transactions": 77,
    "total_sales": 15500000,
    "company": "exp",
    "brokerage": "exp",
    "team": "KW",
    "license_type": "Broker",
    "state_license": "CA",
    "license": "01234567",
    "cities": ["Los Angeles", "San Diego"],
    "states": ["CA"],
    "counties": ["Los Angeles", "San Diego"],
    "zip_codes": ["92109", "92101", "90210"],
    "wants": ["leads", "training", "technology"],
    "skills": ["lead generation", "social media", "luxury homes"],
    "tags": ["hot lead", "high producer"],
    "profile_url": "https://example.com/profile",
    "image_url": "https://example.com/avatar.jpg",
    "radius": 25,
    "notes": "Highly motivated agent looking for more leads",
    "created_at": "2025-01-28T23:16:20.729719+00:00",
    "updated_at": "2025-01-28T23:16:20.729719+00:00"
  }
}
```

## Output Field Definitions

Copy these labels into Zapier's Output Fields section:

| Field Key | Label | Type |
|-----------|-------|------|
| `success` | Success Status | boolean |
| `data__id` | Lead ID | string |
| `data__user_id` | Owner User ID | string |
| `data__full_name` | Full Name | string |
| `data__first_name` | First Name | string |
| `data__last_name` | Last Name | string |
| `data__email` | Email Address | string |
| `data__phone` | Phone Number | string |
| `data__lead_type` | Lead Type (Agent/Lender) | string |
| `data__status` | Current Status | string |
| `data__pipeline_stage` | Pipeline Stage | string |
| `data__pipeline_type` | Pipeline Type | string |
| `data__qualification_score` | Qualification Score (0-100) | number |
| `data__source` | Lead Source | string |
| `data__motivation` | Motivation Score (1-10) | number |
| `data__experience` | Years of Experience | number |
| `data__transactions` | Annual Transactions | number |
| `data__total_sales` | Total Sales Volume | number |
| `data__company` | Company Name | string |
| `data__brokerage` | Brokerage Name | string |
| `data__team` | Team Name | string |
| `data__license_type` | License Type | string |
| `data__state_license` | License State | string |
| `data__license` | License Number | string |
| `data__cities` | Cities (Array) | string |
| `data__cities[]0` | City 1 | string |
| `data__cities[]1` | City 2 | string |
| `data__cities[]2` | City 3 | string |
| `data__states` | States (Array) | string |
| `data__states[]0` | State 1 | string |
| `data__states[]1` | State 2 | string |
| `data__counties` | Counties (Array) | string |
| `data__counties[]0` | County 1 | string |
| `data__counties[]1` | County 2 | string |
| `data__zip_codes` | Zip Codes (Array) | string |
| `data__zip_codes[]0` | Zip Code 1 | string |
| `data__zip_codes[]1` | Zip Code 2 | string |
| `data__zip_codes[]2` | Zip Code 3 | string |
| `data__zip_codes[]3` | Zip Code 4 | string |
| `data__zip_codes[]4` | Zip Code 5 | string |
| `data__wants` | Wants/Needs (Array) | string |
| `data__wants[]0` | Want 1 | string |
| `data__wants[]1` | Want 2 | string |
| `data__wants[]2` | Want 3 | string |
| `data__skills` | Skills/Specialties (Array) | string |
| `data__skills[]0` | Skill 1 | string |
| `data__skills[]1` | Skill 2 | string |
| `data__skills[]2` | Skill 3 | string |
| `data__tags` | Tags (Array) | string |
| `data__tags[]0` | Tag 1 | string |
| `data__tags[]1` | Tag 2 | string |
| `data__profile_url` | Profile URL | string |
| `data__image_url` | Image/Avatar URL | string |
| `data__radius` | Service Radius (Miles) | number |
| `data__notes` | Notes | string |
| `data__created_at` | Created Date | string |
| `data__updated_at` | Updated Date | string |

## Field Descriptions for Zapier Users

### Core Fields
- **Lead ID**: Unique identifier for the lead record
- **Full Name**: Complete name of the lead
- **Email/Phone**: Contact information
- **Lead Type**: Either "real_estate_agent" or "mortgage_officer"

### Qualification Fields
- **Qualification Score**: 0-100 rating of lead quality
- **Motivation**: 1-10 scale of how motivated the lead is
- **Status**: Current lead status (new, contacted, qualified, etc.)
- **Pipeline Stage**: Where the lead is in your pipeline

### Professional Details
- **Experience**: Years in the business
- **Transactions**: Number of annual transactions
- **Total Sales**: Total sales volume in dollars
- **Brokerage/Company**: Where they work
- **License Info**: License type, state, and number

### Location & Coverage
- **Cities/States/Counties**: Geographic areas they serve
- **Zip Codes**: Specific ZIP codes they cover
- **Radius**: Service area radius in miles

### Preferences & Skills
- **Wants**: What they're looking for (leads, training, etc.)
- **Skills**: Their specialties and expertise
- **Tags**: Custom categorization tags

## Quick Setup Instructions

1. **Paste Sample Data**: Copy the JSON sample above into "Static Sample"
2. **Add Field Labels**: Use the labels from the table above for each field
3. **Test**: Run a test to verify all fields populate correctly
4. **Save**: Click "Save Output & Finish"

## Common Use Cases

### Send to CRM
Map these fields to your CRM:
- Full Name → Contact Name
- Email → Email
- Phone → Phone
- Company → Company
- Qualification Score → Lead Score

### Send Email Notification
Use these in email templates:
- {{Full Name}}
- {{Email Address}}
- {{Qualification Score (0-100)}}
- {{Lead Source}}
- {{Motivation Score (1-10)}}

### Update Spreadsheet
Track leads with:
- Lead ID (unique identifier)
- Full Name
- Email
- Phone
- Qualification Score
- Status
- Created Date
