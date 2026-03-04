-- Allow 'free' as a valid plan
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_plan_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_plan_check
  CHECK (plan IN ('free', 'explore', 'pro'));

-- Make Stripe fields nullable for free plan users
ALTER TABLE subscriptions ALTER COLUMN stripe_customer_id DROP NOT NULL;
ALTER TABLE subscriptions ALTER COLUMN stripe_subscription_id DROP NOT NULL;

-- Rate limiting table for free generations
CREATE TABLE IF NOT EXISTS free_generation_limits (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  ip_address TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_free_limits_ip_date
  ON free_generation_limits(ip_address, created_at);
