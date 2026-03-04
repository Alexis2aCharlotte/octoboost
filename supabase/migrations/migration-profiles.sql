-- ============================================================
-- Migration: subscriptions -> profiles (unified user table)
-- ============================================================

-- 1. Drop pre-existing profiles table (Supabase default template, unused)
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. Create the profiles table
CREATE TABLE public.profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users NOT NULL UNIQUE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  company_name TEXT,
  website_url TEXT,
  has_password BOOLEAN NOT NULL DEFAULT false,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'explore', 'pro')),
  interval TEXT DEFAULT 'monthly' CHECK (interval IN ('monthly', 'yearly')),
  status TEXT NOT NULL DEFAULT 'active',
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Migrate existing data from subscriptions (if any)
INSERT INTO public.profiles (user_id, email, plan, interval, status, stripe_customer_id, stripe_subscription_id, current_period_start, current_period_end, created_at, updated_at)
SELECT
  s.user_id,
  u.email,
  s.plan,
  s.interval,
  s.status,
  s.stripe_customer_id,
  s.stripe_subscription_id,
  s.current_period_start,
  s.current_period_end,
  s.created_at,
  s.updated_at
FROM public.subscriptions s
JOIN auth.users u ON u.id = s.user_id
ON CONFLICT (user_id) DO NOTHING;

-- 3. Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role can manage profiles"
  ON public.profiles FOR ALL
  USING (true)
  WITH CHECK (true);

-- 4. Auto-create profile on new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name')
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. Drop the old subscriptions table
DROP TABLE IF EXISTS public.subscriptions CASCADE;
