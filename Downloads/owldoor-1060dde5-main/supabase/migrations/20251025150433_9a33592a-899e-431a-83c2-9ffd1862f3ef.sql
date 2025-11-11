-- Create user role enum
CREATE TYPE public.app_role AS ENUM ('staff', 'client', 'lead');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- RLS policies for user_roles
CREATE POLICY "Users can view their own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Staff can manage all roles"
  ON public.user_roles FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  company_name TEXT,
  phone TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Staff can view all profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

-- Create leads table (Real Estate Agents)
CREATE TABLE public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  qualification_score INTEGER DEFAULT 0,
  source TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage all leads"
  ON public.leads FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Leads can view their own record"
  ON public.leads FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Create clients table (Brokerages/Teams)
CREATE TABLE public.clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  cities TEXT[],
  states TEXT[],
  zip_codes TEXT[],
  preferences JSONB,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage all clients"
  ON public.clients FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their own record"
  ON public.clients FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Clients can update their own record"
  ON public.clients FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create qualification questions table
CREATE TABLE public.qualification_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL,
  options JSONB,
  required BOOLEAN DEFAULT true,
  order_index INTEGER NOT NULL,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qualification_questions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage questions"
  ON public.qualification_questions FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Everyone can view active questions"
  ON public.qualification_questions FOR SELECT
  TO authenticated
  USING (active = true);

-- Create lead answers table
CREATE TABLE public.lead_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.qualification_questions(id) ON DELETE CASCADE,
  answer_text TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lead_id, question_id)
);

ALTER TABLE public.lead_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage all answers"
  ON public.lead_answers FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Leads can view their own answers"
  ON public.lead_answers FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = lead_answers.lead_id
    AND leads.user_id = auth.uid()
  ));

-- Create matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID NOT NULL REFERENCES public.leads(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage all matches"
  ON public.matches FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can view their matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = matches.client_id
    AND clients.user_id = auth.uid()
  ));

CREATE POLICY "Leads can view their matches"
  ON public.matches FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.leads
    WHERE leads.id = matches.lead_id
    AND leads.user_id = auth.uid()
  ));

-- Create bids table
CREATE TABLE public.bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cities TEXT[],
  states TEXT[],
  zip_codes TEXT[],
  preferences JSONB,
  bid_amount DECIMAL(10,2) NOT NULL,
  max_leads_per_month INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.bids ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can view all bids"
  ON public.bids FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'staff'));

CREATE POLICY "Clients can manage their own bids"
  ON public.bids FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.clients
    WHERE clients.id = bids.client_id
    AND clients.user_id = auth.uid()
  ));

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON public.leads
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bids_updated_at
  BEFORE UPDATE ON public.bids
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Insert default qualification questions
INSERT INTO public.qualification_questions (question_text, question_type, options, order_index) VALUES
  ('What are you primarily looking for?', 'multiple_choice', '["Better Tech/Tools", "More Leads", "Higher Commission Split", "Top 1% Team", "Remote Work Options", "Office Support"]'::jsonb, 1),
  ('What is your current annual production (GCI)?', 'text', null, 2),
  ('How many years of real estate experience do you have?', 'text', null, 3),
  ('What type of properties do you primarily work with?', 'multiple_choice', '["Residential", "Commercial", "Luxury", "New Construction", "Investment Properties"]'::jsonb, 4);