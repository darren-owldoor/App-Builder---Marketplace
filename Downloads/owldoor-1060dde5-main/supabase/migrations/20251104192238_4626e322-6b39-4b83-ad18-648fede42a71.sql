-- Set default pro_type to 'real_estate_agent' for pros table (it's a varchar column, not an enum)
ALTER TABLE public.pros 
  ALTER COLUMN pro_type SET DEFAULT 'real_estate_agent';

-- Set default client_type to 'real_estate' for clients table (it's a client_type enum)
ALTER TABLE public.clients
  ALTER COLUMN client_type SET DEFAULT 'real_estate'::client_type;