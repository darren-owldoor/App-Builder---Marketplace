-- Add transactions_per_year column to leads table
ALTER TABLE public.leads 
ADD COLUMN transactions_per_year integer;

-- Add helpful comment
COMMENT ON COLUMN public.leads.transactions_per_year IS 'Number of transactions the lead completes per year';