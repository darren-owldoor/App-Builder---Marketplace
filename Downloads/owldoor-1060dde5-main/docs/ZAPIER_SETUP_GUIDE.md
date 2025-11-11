# Zapier Integration Setup Guide

## Authentication Configuration

### Step 1: Get Your API Key
1. Log into your admin dashboard
2. Navigate to Integrations → Zapier
3. Generate a new API key and copy it

### Step 2: Configure Zapier Authentication

In your Zapier app's **Authentication** settings, use these configurations:

#### Authentication Type
Choose: **API Key**

#### Authentication Fields
Add a single field:
- **Key**: `api_key`
- **Label**: API Key
- **Required**: Yes
- **Type**: Password
- **Help Text**: Enter your OwlDoor API key from the admin dashboard

#### Test Request
Configure the test authentication request:
- **URL**: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-auth`
- **HTTP Method**: GET
- **Headers**:
  - **x-api-key**: `{{bundle.authData.api_key}}`

#### Connection Label
Use: `{{bundle.authData.api_key}}` (this will show a masked version to users)

### Step 3: Configure Request Template

In your Zapier app's **Request Template** (under Advanced settings):

#### HTTP Headers
Add the following header to automatically include the API key in all requests:
- **Key**: `x-api-key`
- **Value**: `{{bundle.authData.api_key}}`

This ensures all your trigger and action requests include the authenticated API key automatically.

### Step 4: Available Endpoints

Once authenticated, these endpoints are available:

#### Import Data (POST)
**URL**: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-import`
- Imports leads, clients, or users
- See `ZAPIER_API_GUIDE.md` for detailed parameters

#### List/Create/Find Leads (POST)
**URL**: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api`
- Actions: `list_leads`, `create_lead`, `find_lead`

#### List/Create/Find Clients (POST)
**URL**: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api`
- Actions: `list_clients`, `create_client`, `find_client`

#### Webhook Subscribe (POST)
**URL**: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-webhook-subscribe`
- For setting up webhook-based triggers

#### Dynamic Fields (GET) - For Zapier Developers
**URL**: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields`
- Returns custom field metadata in Zapier Field schema format
- Query Parameters:
  - `type`: Record type (`leads`, `pros`, or `clients`)
- Use for `inputFields` function to automatically populate custom fields
- See `ZAPIER_DYNAMIC_FIELDS.md` for complete implementation guide

## Example Zapier Action Configuration

### Create Lead Action
```json
{
  "url": "https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api",
  "method": "POST",
  "headers": {
    "Content-Type": "application/json",
    "x-api-key": "{{bundle.authData.api_key}}"
  },
  "body": {
    "action": "create_lead",
    "data": {
      "full_name": "{{input.full_name}}",
      "email": "{{input.email}}",
      "phone": "{{input.phone}}",
      "city": "{{input.city}}",
      "state": "{{input.state}}"
    }
  }
}
```

## Testing Your Integration

1. In Zapier, create a new Zap using your integration
2. When prompted, enter your API key
3. Zapier will test the connection using the `/zapier-auth` endpoint
4. If successful, you can proceed to configure triggers and actions

## Troubleshooting

### "Invalid API key" error
- Verify the API key is copied correctly without extra spaces
- Check that the key hasn't been deleted in the admin dashboard
- Ensure the key is marked as "active"

### "Missing API key" error
- Verify the Request Template includes the `x-api-key` header
- Check that `{{bundle.authData.api_key}}` is properly referenced

### Rate Limiting
- Default limit: 100 requests per minute per IP
- Max 1000 records per request for bulk operations
