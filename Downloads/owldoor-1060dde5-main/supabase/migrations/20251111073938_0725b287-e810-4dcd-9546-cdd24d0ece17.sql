-- Update field_definitions for clients.provides terminology
UPDATE field_definitions 
SET 
  display_name = 'What We Provide',
  description = 'What this office/brokerage provides to agents (e.g., leads, training, support, technology, splits)'
WHERE entity_types && ARRAY['client_real_estate', 'client_mortgage']::text[] 
  AND field_name = 'provides';

-- Update field_definitions for clients.wants - should be hidden/deprecated in favor of provides
UPDATE field_definitions 
SET 
  active = false,
  display_name = 'Wants (Deprecated - Use Provides)',
  description = 'DEPRECATED: Use "provides" field instead. What this office wants is what they provide to agents.'
WHERE entity_types && ARRAY['client_real_estate', 'client_mortgage']::text[] 
  AND field_name = 'wants';

-- Update field_definitions for pros.wants to clarify it's what they want FROM offices
UPDATE field_definitions 
SET 
  display_name = 'What They Want From Office',
  description = 'What this agent/pro is looking for from a brokerage (e.g., leads, mentorship, technology, competitive splits)'
WHERE entity_types && ARRAY['real_estate_agent', 'mortgage_officer']::text[] 
  AND field_name = 'wants';

-- Deactivate needs field for clients as it's confusing
UPDATE field_definitions 
SET 
  active = false,
  display_name = 'Needs (Deprecated)',
  description = 'DEPRECATED: This field is not applicable for offices/clients.'
WHERE entity_types && ARRAY['client_real_estate', 'client_mortgage']::text[] 
  AND field_name = 'needs';