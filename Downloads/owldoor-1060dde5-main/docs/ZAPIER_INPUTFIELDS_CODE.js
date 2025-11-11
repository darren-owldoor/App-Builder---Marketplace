// ============================================
// COPY THIS CODE INTO YOUR ZAPIER INTEGRATION
// ============================================

// Replace your hardcoded inputFields array with this:

const inputFields = [
  // First field: Record Type selector that triggers field refresh
  {
    key: 'record_type',
    label: 'Record Type',
    type: 'string',
    default: 'leads',
    choices: [
      { value: 'leads', label: 'Leads', sample: 'leads' },
      { value: 'pros', label: 'Pros', sample: 'pros' },
      { value: 'clients', label: 'Clients', sample: 'clients' }
    ],
    required: false,
    altersDynamicFields: true, // CRITICAL: This tells Zapier to refresh fields when changed
    helpText: 'Select the type of record. Fields will update based on your selection.'
  },
  
  // Second field: Dynamic function that fetches fields from your API
  async function(z, bundle) {
    try {
      // Make request to your dynamic fields endpoint
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
      
      // Return the fields array from your API
      // Your endpoint returns an array of field objects that match Zapier's schema
      return response.json;
      
    } catch (error) {
      // Handle errors gracefully
      z.console.error('Error fetching dynamic fields:', error);
      
      // Return minimal fallback fields if API fails
      return [
        {
          key: 'full_name',
          label: 'Full Name',
          type: 'string',
          required: true,
          helpText: 'Full name of the person'
        },
        {
          key: 'phone',
          label: 'Phone',
          type: 'string',
          required: true,
          helpText: 'Phone number'
        },
        {
          key: 'email',
          label: 'Email',
          type: 'string',
          required: false,
          helpText: 'Email address'
        }
      ];
    }
  }
];

// ============================================
// EXAMPLE: Full create_lead.js file structure
// ============================================

module.exports = {
  key: 'create_lead',
  noun: 'Lead',
  
  display: {
    label: 'Create Lead',
    description: 'Creates a new lead in OwlDoor with dynamic custom fields',
    hidden: false
  },
  
  operation: {
    // Use the inputFields from above
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
    
    // Perform function sends all input data to your API
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
          data: bundle.inputData // All fields including ai_zap_help
        }
      });
      
      return response.json;
    },
    
    // Sample for testing
    sample: {
      success: true,
      data: {
        id: 'abc123',
        full_name: 'John Doe',
        email: 'john@example.com',
        phone: '+15555551234',
        ai_zap_help: 'Find missing data fields',
        created_at: '2025-01-10T12:00:00Z'
      }
    },
    
    // Output fields (Zapier will auto-detect from sample if not specified)
    outputFields: [
      { key: 'success', label: 'Success' },
      { key: 'data__id', label: 'ID' },
      { key: 'data__full_name', label: 'Full Name' },
      { key: 'data__email', label: 'Email' },
      { key: 'data__phone', label: 'Phone' },
      { key: 'data__ai_zap_help', label: 'AI Help Request' }
    ]
  }
};

// ============================================
// TESTING THE IMPLEMENTATION
// ============================================

// 1. In Zapier Platform CLI:
//    zapier push
//    zapier test

// 2. In Zapier Web Builder:
//    - Edit your integration
//    - Go to Create Lead action
//    - Click "Refresh fields" in the input section
//    - Test with a real Zap

// 3. Test dynamic field refresh:
//    - Create a Zap
//    - Select "Create Lead" action
//    - Change "Record Type" from "leads" to "pros"
//    - Fields should update automatically
//    - Verify ai_zap_help field appears

// ============================================
// EXPECTED FIELDS FOR EACH TYPE
// ============================================

/*
LEADS:
- ai_zap_help (NEW!)
- full_name
- first_name
- last_name
- email
- phone
- cities
- states
- zip_codes
- tags
- notes
- brokerage
- license_type
- years_experience
- transactions
- + any custom fields you created

PROS:
- (same as leads)

CLIENTS:
- ai_zap_help (NEW!)
- full_name
- first_name
- last_name
- email
- phone
- cities
- states
- zip_codes
- tags
- notes
- company_name
- + any custom fields you created
*/
