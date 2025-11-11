// Complete "Create Lead" Action Configuration for Zapier Integration
// This should be used in your Zapier integration's creates/create_lead.js file

const perform = async (z, bundle) => {
  const response = await z.request({
    url: `https://oouyhixnjwjnombgcyjl.supabase.co/functions/v1/zapier-import`,
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': bundle.authData.api_key,
    },
    body: {
      entity_type: 'leads',
      data: bundle.inputData,
    },
  });

  return response.data;
};

module.exports = {
  key: 'create_lead',
  noun: 'Lead',
  display: {
    label: 'Create Lead',
    description: 'Creates a new lead in OwlDoor.',
  },
  operation: {
    inputFields: [
      {
        key: 'full_name',
        label: 'Full Name',
        type: 'string',
        required: false,
        helpText: 'The full name of the lead',
      },
      {
        key: 'email',
        label: 'Email',
        type: 'string',
        required: false,
        helpText: 'Email address of the lead',
      },
      {
        key: 'phone',
        label: 'Phone',
        type: 'string',
        required: false,
        helpText: 'Phone number of the lead',
      },
      {
        key: 'company',
        label: 'Company',
        type: 'string',
        required: false,
        helpText: 'Company name',
      },
      {
        key: 'brokerage',
        label: 'Brokerage',
        type: 'string',
        required: false,
        helpText: 'Brokerage name',
      },
      {
        key: 'cities',
        label: 'Cities',
        type: 'string',
        required: false,
        helpText: 'Comma-separated list of cities',
      },
      {
        key: 'states',
        label: 'States',
        type: 'string',
        required: false,
        helpText: 'Comma-separated list of states',
      },
      {
        key: 'zip_codes',
        label: 'Zip Codes',
        type: 'string',
        required: false,
        helpText: 'Comma-separated list of zip codes',
      },
      {
        key: 'pro_type',
        label: 'Pro Type',
        type: 'string',
        required: false,
        choices: ['real_estate_agent', 'mortgage_officer'],
        helpText: 'Type of professional',
      },
      {
        key: 'experience',
        label: 'Years of Experience',
        type: 'integer',
        required: false,
        helpText: 'Years of experience',
      },
      {
        key: 'transactions',
        label: 'Number of Transactions',
        type: 'integer',
        required: false,
        helpText: 'Total number of transactions completed',
      },
      {
        key: 'license_type',
        label: 'License Type',
        type: 'string',
        required: false,
        helpText: 'Type of license held',
      },
      {
        key: 'license_number',
        label: 'License Number',
        type: 'string',
        required: false,
        helpText: 'License number',
      },
      {
        key: 'skills',
        label: 'Skills',
        type: 'string',
        required: false,
        helpText: 'Comma-separated list of skills',
      },
      {
        key: 'tags',
        label: 'Tags',
        type: 'string',
        required: false,
        helpText: 'Comma-separated list of tags',
      },
      {
        key: 'motivation',
        label: 'Motivation Score',
        type: 'integer',
        required: false,
        helpText: 'Motivation score (0-100)',
      },
      {
        key: 'profile_url',
        label: 'Profile URL',
        type: 'string',
        required: false,
        helpText: 'URL to profile page',
      },
      {
        key: 'image_url',
        label: 'Image URL',
        type: 'string',
        required: false,
        helpText: 'URL to profile image',
      },
      {
        key: 'source',
        label: 'Source',
        type: 'string',
        required: false,
        helpText: 'Lead source',
      },
      {
        key: 'status',
        label: 'Status',
        type: 'string',
        required: false,
        helpText: 'Current status',
      },
      {
        key: 'pipeline_stage',
        label: 'Pipeline Stage',
        type: 'string',
        required: false,
        choices: ['new', 'contacted', 'qualified', 'match_ready', 'matched', 'closed', 'lost'],
        helpText: 'Current pipeline stage',
      },
    ],
    perform: perform,
    sample: {
      id: '123e4567-e89b-12d3-a456-426614174000',
      full_name: 'John Doe',
      email: 'john.doe@example.com',
      phone: '+1234567890',
      created_at: '2025-01-10T00:00:00.000Z',
    },
    outputFields: [
      { key: 'id', label: 'ID', type: 'string' },
      { key: 'full_name', label: 'Full Name', type: 'string' },
      { key: 'email', label: 'Email', type: 'string' },
      { key: 'phone', label: 'Phone', type: 'string' },
      { key: 'created_at', label: 'Created At', type: 'string' },
    ],
  },
};
