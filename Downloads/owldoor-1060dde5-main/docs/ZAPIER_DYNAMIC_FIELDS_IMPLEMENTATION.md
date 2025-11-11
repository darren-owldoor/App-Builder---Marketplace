# Zapier Dynamic Fields Implementation Guide

## Overview
This guide shows how to replace your hardcoded input fields with dynamic fields that automatically fetch from the `/zapier-dynamic-fields` endpoint.

## Step 1: Update Your create_lead Action

In your Zapier integration, find the `creates.create_lead.operation.inputFields` section and replace it with this:

```javascript
"inputFields": [
  {
    "key": "record_type",
    "label": "Record Type",
    "type": "string",
    "default": "leads",
    "choices": [
      { "value": "leads", "label": "Leads", "sample": "leads" },
      { "value": "pros", "label": "Pros", "sample": "pros" },
      { "value": "clients", "label": "Clients", "sample": "clients" }
    ],
    "required": false,
    "altersDynamicFields": true,
    "helpText": "Select the type of record to create. This will load the appropriate fields."
  },
  async function(z, bundle) {
    // Fetch dynamic fields from your API
    const response = await z.request({
      url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields',
      method: 'GET',
      params: {
        type: bundle.inputData.record_type || 'leads'
      },
      headers: {
        'x-api-key': bundle.authData.api_key,
        'Content-Type': 'application/json'
      }
    });
    
    // Return the dynamic fields
    return response.json;
  }
]
```

## Step 2: Update the Perform Function

Update your `perform` function to use the dynamic data properly:

```javascript
"perform": {
  "source": "const options = {\n  url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api',\n  method: 'POST',\n  headers: {\n    'X-API-KEY': bundle.authData.api_key,\n    'Content-Type': 'application/json'\n  },\n  body: {\n    'action': 'create_lead',\n    'data': bundle.inputData\n  }\n};\n\nreturn z.request(options)\n  .then((response) => {\n    response.throwForStatus();\n    return response.json;\n  });\n"
}
```

## Step 3: Test the Integration

After implementing:

1. **Test Authentication**: 
   - Go to Zapier and test your API key authentication
   - Should successfully connect

2. **Test Dynamic Fields**:
   - Create a new Zap with your "Create Lead" action
   - Select "leads" as Record Type
   - Verify you see these fields:
     - ✅ ai_zap_help (NEW!)
     - ✅ full_name
     - ✅ first_name
     - ✅ last_name
     - ✅ email
     - ✅ phone
     - ✅ All your custom fields
     - ✅ Type-specific fields (brokerage, transactions, etc.)

3. **Change Record Type**:
   - Switch to "pros" or "clients"
   - Fields should update automatically
   - You'll see different type-specific fields

## Step 4: Using AI Zap Help

The new `ai_zap_help` field allows you to send AI instructions:

**Example Values:**
```
"Find missing data for this lead"
"Qualify this lead and update their score"
"Send personalized introduction email"
"Match with available clients"
"Enrich profile with social media data"
```

## Complete Example Configuration

Here's a minimal working example for your Zapier platform:

```javascript
module.exports = {
  key: 'create_lead',
  noun: 'Lead',
  
  display: {
    label: 'Create Lead',
    description: 'Creates a new lead in OwlDoor with dynamic custom fields',
    hidden: false
  },
  
  operation: {
    // Dynamic input fields
    inputFields: [
      {
        key: 'record_type',
        label: 'Record Type',
        type: 'string',
        default: 'leads',
        choices: ['leads', 'pros', 'clients'],
        required: false,
        altersDynamicFields: true
      },
      async (z, bundle) => {
        const response = await z.request({
          url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields',
          params: { type: bundle.inputData.record_type || 'leads' },
          headers: { 'x-api-key': bundle.authData.api_key }
        });
        return response.json;
      }
    ],
    
    // Perform the creation
    perform: async (z, bundle) => {
      const response = await z.request({
        url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-api',
        method: 'POST',
        headers: {
          'X-API-KEY': bundle.authData.api_key,
          'Content-Type': 'application/json'
        },
        body: {
          action: 'create_lead',
          data: bundle.inputData
        }
      });
      
      return response.json;
    },
    
    // Sample output
    sample: {
      success: true,
      data: {
        id: '123',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+15555551234',
        ai_zap_help: 'Please find missing data fields'
      }
    }
  }
};
```

## Benefits of Dynamic Fields

✅ **Automatic Updates**: Add custom fields in OwlDoor, they appear in Zapier instantly  
✅ **Type Safety**: Each record type gets appropriate fields  
✅ **AI Integration**: New `ai_zap_help` field for AI-powered actions  
✅ **User-Specific**: Each API key holder sees their own custom fields  
✅ **Validation**: Required fields, dropdowns, and help text all work  

## Troubleshooting

**Fields not loading?**
- Verify your API key is valid
- Check that `zapier-dynamic-fields` edge function is deployed
- Ensure `x-api-key` header is being sent

**Old fields still showing?**
- Clear Zapier's field cache
- Delete and recreate the step
- Verify `altersDynamicFields: true` is set

**Custom fields missing?**
- Check that custom fields exist in database
- Verify `is_active = true`
- Ensure `record_type` matches (leads/pros/clients)

## Migration from Hardcoded Fields

If you're migrating from hardcoded fields:

1. ✅ Backup your current Zapier integration
2. ✅ Test dynamic fields in a separate Zap first
3. ✅ Verify all existing Zaps still work
4. ✅ Update one action at a time
5. ✅ Monitor for any errors

## Next Steps

Once dynamic fields are working:

1. **Add More Custom Fields**: They'll automatically appear in Zapier
2. **Implement AI Processing**: Use the `ai_zap_help` field to trigger AI actions
3. **Create Field Groups**: Organize fields by category for better UX
4. **Add Conditional Fields**: Show/hide fields based on selections
