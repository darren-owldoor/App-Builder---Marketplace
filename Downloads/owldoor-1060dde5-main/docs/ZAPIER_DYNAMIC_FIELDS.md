# 🔄 Zapier Dynamic Fields Integration

## Overview

OwlDoor supports **dynamic fields** in Zapier, allowing your Zaps to automatically discover and use custom fields configured in each user's account. This means you don't need to hardcode field lists - they update automatically based on what fields exist.

---

## 🎯 Why Dynamic Fields?

- **Automatic Updates**: Custom fields appear in Zapier without updating your integration
- **User-Specific**: Each user sees only their custom fields
- **Type Safety**: Field types and validation rules are automatically applied
- **Better UX**: Dropdown options, help text, and placeholders are preserved

---

## 🛠️ Implementation for Zapier Developers

### 1. Configure Dynamic Dropdown

In your Zapier integration's `triggers/` or `creates/` folder, add a dynamic dropdown configuration:

```javascript
// In your trigger or action file (e.g., creates/create_lead.js)

const perform = async (z, bundle) => {
  const response = await z.request({
    url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/lead-webhook',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': bundle.authData.api_key
    },
    body: bundle.inputData
  });
  return response.data;
};

module.exports = {
  key: 'create_lead',
  noun: 'Lead',
  display: {
    label: 'Create Lead',
    description: 'Creates a new lead in OwlDoor with custom fields.'
  },
  operation: {
    perform,
    // This is where dynamic fields are fetched
    inputFields: async (z, bundle) => {
      const response = await z.request({
        url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields',
        params: {
          type: 'leads'
        },
        headers: {
          'x-api-key': bundle.authData.api_key
        }
      });
      
      return response.data;
    },
    sample: {
      id: '12345',
      full_name: 'John Doe',
      email: 'john@example.com',
      phone: '+15555551234'
    }
  }
};
```

### 2. Authentication Setup

Make sure your authentication configuration passes the API key:

```javascript
// authentication.js
module.exports = {
  type: 'custom',
  fields: [
    {
      key: 'api_key',
      label: 'API Key',
      required: true,
      type: 'string',
      helpText: 'Get your API key from OwlDoor Settings → Integrations → API Keys'
    }
  ],
  test: async (z, bundle) => {
    const response = await z.request({
      url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields',
      params: { type: 'leads' },
      headers: {
        'x-api-key': bundle.authData.api_key
      }
    });
    return response.data;
  },
  connectionLabel: '{{email}}'
};
```

### 3. Field Types Mapping

The API returns fields in Zapier's schema format. Here's what each custom field type maps to:

| OwlDoor Type | Zapier Type | Notes |
|-------------|-------------|-------|
| `text` | `string` | Single-line text input |
| `textarea` | `text` | Multi-line text area |
| `number` | `number` | Numeric input |
| `email` | `string` | Email validation |
| `phone` | `string` | Phone number |
| `url` | `string` | URL validation |
| `date` | `datetime` | Date picker |
| `boolean` | `boolean` | True/false checkbox |
| `dropdown` | `string` with `choices` | Single selection |
| `multi_select` | `string` with `list: true` | Multiple selections |

---

## 📝 Response Format

### Example Request

```bash
GET https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields?type=leads
Headers:
  x-api-key: your_api_key_here
```

### Example Response

```json
[
  {
    "key": "full_name",
    "label": "Full Name",
    "type": "string",
    "required": true,
    "helpText": "Full name of the person"
  },
  {
    "key": "email",
    "label": "Email",
    "type": "string",
    "required": false,
    "helpText": "Email address"
  },
  {
    "key": "lead_source",
    "label": "Lead Source",
    "type": "string",
    "required": false,
    "helpText": "Where did this lead come from?",
    "choices": [
      { "value": "website", "label": "Website", "sample": "website" },
      { "value": "referral", "label": "Referral", "sample": "referral" },
      { "value": "cold_call", "label": "Cold Call", "sample": "cold_call" }
    ],
    "placeholder": "Select a source"
  },
  {
    "key": "custom_rating",
    "label": "Custom Rating",
    "type": "number",
    "required": false,
    "helpText": "Rate the lead from 1-10",
    "default": 5
  },
  {
    "key": "interests",
    "label": "Interests",
    "type": "string",
    "list": true,
    "required": false,
    "helpText": "Multiple interests can be selected",
    "choices": [
      { "value": "residential", "label": "Residential", "sample": "residential" },
      { "value": "commercial", "label": "Commercial", "sample": "commercial" },
      { "value": "investment", "label": "Investment", "sample": "investment" }
    ]
  }
]
```

---

## 🔒 Authentication

The endpoint requires authentication via API key:

```
Headers:
  x-api-key: YOUR_API_KEY
```

Users can generate their API key in:
**OwlDoor → Settings → Integrations → API Keys**

---

## 🎨 Record Types

Dynamic fields are available for three record types:

1. **`leads`** - Lead/Agent records
2. **`pros`** - Professional profiles
3. **`clients`** - Client companies

Specify the type using the `type` query parameter:

```
?type=leads
?type=pros
?type=clients
```

---

## 🧪 Testing Dynamic Fields

### Test in Zapier Platform CLI

```bash
# Test dynamic field fetching
zapier test --debug

# Or test directly with curl
curl -X GET \
  'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields?type=leads' \
  -H 'x-api-key: your_test_api_key'
```

### Expected Behavior

1. User adds a custom field in OwlDoor (e.g., "Lead Temperature")
2. User opens their Zap configuration
3. The new field automatically appears in the dropdown
4. User can map data to the new field
5. Field validation and type checking work automatically

---

## 💡 Best Practices

### 1. Cache Dynamic Fields
Cache field responses for 5-10 minutes to reduce API calls:

```javascript
const getInputFields = async (z, bundle) => {
  const cacheKey = `dynamic_fields_${bundle.authData.user_id}_leads`;
  
  // Try cache first
  let fields = await z.cache.get(cacheKey);
  
  if (!fields) {
    const response = await z.request({
      url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields',
      params: { type: 'leads' },
      headers: { 'x-api-key': bundle.authData.api_key }
    });
    
    fields = response.data;
    
    // Cache for 5 minutes
    await z.cache.set(cacheKey, fields, 300);
  }
  
  return fields;
};
```

### 2. Handle Field Updates Gracefully
If a custom field is deleted in OwlDoor but still mapped in Zapier:
- The API will ignore unknown fields
- No error is thrown
- Existing mappings continue to work for standard fields

### 3. Provide Clear Help Text
The API automatically includes:
- Field labels
- Help text (if configured)
- Placeholder text
- Default values
- Required/optional status

### 4. Support List Fields
For `multi_select` fields, send data as:
```json
{
  "interests": ["residential", "commercial"]
}
```

Or comma-separated:
```json
{
  "interests": "residential,commercial"
}
```

---

## 🐛 Troubleshooting

### "Invalid or inactive API key"
- Check the API key is active in OwlDoor settings
- Verify the header is `x-api-key` (not `X-API-Key`)
- Ensure no extra spaces in the key value

### "No fields returned"
- Check the `type` parameter is correct (`leads`, `pros`, or `clients`)
- Verify the user has custom fields configured
- Standard fields are always returned even if no custom fields exist

### "Field type mismatch"
- The API auto-converts types - check your field configuration in OwlDoor
- Dates must be ISO 8601 format: `2025-11-10T12:00:00Z`
- Numbers must be numeric (not strings)

---

## 📚 Additional Resources

- [Zapier Platform Schema Documentation](https://github.com/zapier/zapier-platform/blob/main/packages/schema/docs/build/schema.md#fieldschema)
- [OwlDoor API Documentation](./ZAPIER_SETUP_GUIDE.md)
- [Custom Fields Management](../README.md#custom-fields)

---

## 🎯 Quick Reference

```javascript
// Minimal example for Zapier integration
const inputFields = async (z, bundle) => {
  const { data } = await z.request({
    url: 'https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-dynamic-fields',
    params: { type: 'leads' },
    headers: { 'x-api-key': bundle.authData.api_key }
  });
  return data;
};
```

That's it! Your Zap now automatically uses all custom fields. 🚀
