-- Add field_type and allowed_values columns to field_definitions
ALTER TABLE field_definitions 
ADD COLUMN IF NOT EXISTS field_type TEXT DEFAULT 'text',
ADD COLUMN IF NOT EXISTS allowed_values JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS use_ai_matching BOOLEAN DEFAULT false;

-- Update existing fields with proper types and predefined options
UPDATE field_definitions SET 
  field_type = 'multi_select',
  allowed_values = jsonb_build_array(
    'Lead Generation', 'Cold Calling', 'Social Media Marketing', 
    'Video Marketing', 'Open House Hosting', 'Networking',
    'Buyer Representation', 'Seller Representation', 'Investment Properties',
    'Luxury Homes', 'First-Time Buyers', 'Relocation Services',
    'Commercial Real Estate', 'Property Management', 'Short Sales',
    'Foreclosures', 'New Construction', 'Land Sales'
  )
WHERE field_name = 'skills';

UPDATE field_definitions SET 
  field_type = 'multi_select',
  allowed_values = jsonb_build_array(
    'High Commission Split', 'Free Leads', 'Office Space', 
    '1-on-1 Coaching', 'Team Support', 'No Desk Fees',
    'Health Insurance', 'Profit Sharing', 'Retirement Plan',
    'Continuing Education', 'CRM & Tech Stack', 'Marketing Budget',
    'Transaction Coordinator', 'Admin Support', 'Brand Recognition',
    'Training Programs', 'Mentorship', 'Flexible Schedule'
  )
WHERE field_name = 'wants';

UPDATE field_definitions SET field_type = 'number' WHERE field_name IN ('experience', 'years_experience', 'transactions', 'total_sales', 'yearly_sales', 'avg_sale');

UPDATE field_definitions SET field_type = 'select', 
  allowed_values = jsonb_build_array('Salesperson', 'Broker', 'Team Leader', 'Associate Broker')
WHERE field_name = 'license_type';

UPDATE field_definitions SET field_type = 'multi_select',
  allowed_values = jsonb_build_array('Buyer Agent', 'Listing Agent', 'Dual Agency', 'Transaction Coordinator', 'Property Manager')
WHERE field_name = 'specializations';

-- Text fields that will use AI matching for descriptions
UPDATE field_definitions SET 
  field_type = 'text',
  use_ai_matching = true
WHERE field_name IN ('bio', 'company_description', 'notes');

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_field_definitions_field_type ON field_definitions(field_type);
CREATE INDEX IF NOT EXISTS idx_field_definitions_use_ai ON field_definitions(use_ai_matching) WHERE use_ai_matching = true;