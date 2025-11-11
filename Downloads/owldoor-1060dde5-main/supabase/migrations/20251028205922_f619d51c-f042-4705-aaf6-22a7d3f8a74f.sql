-- Add team column to leads table
ALTER TABLE public.leads 
ADD COLUMN team TEXT;