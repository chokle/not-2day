-- Profiles (email + reminder preferences)
CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  email_reminders boolean NOT NULL DEFAULT true,
  push_reminders boolean NOT NULL DEFAULT false,
  lead_days integer[] NOT NULL DEFAULT ARRAY[7,3,1,0],
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own profile select" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);
CREATE POLICY "own profile insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "own profile update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Subscriptions
CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  domain text,
  category text,
  price numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'USD',
  cycle text NOT NULL DEFAULT 'monthly',
  start_date date,
  next_charge_date date,
  trial_end_date date,
  cancel_url text,
  cancel_steps text[],
  support_email text,
  notes text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.subscriptions TO authenticated;
GRANT ALL ON public.subscriptions TO service_role;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own subs select" ON public.subscriptions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own subs insert" ON public.subscriptions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own subs update" ON public.subscriptions FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own subs delete" ON public.subscriptions FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE INDEX subscriptions_user_idx ON public.subscriptions(user_id);

-- Push device tokens
CREATE TABLE public.push_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.push_tokens TO authenticated;
GRANT ALL ON public.push_tokens TO service_role;
ALTER TABLE public.push_tokens ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own tokens select" ON public.push_tokens FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "own tokens insert" ON public.push_tokens FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tokens delete" ON public.push_tokens FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Sent reminder log (dedupe)
CREATE TABLE public.reminder_sends (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subscription_id uuid NOT NULL REFERENCES public.subscriptions(id) ON DELETE CASCADE,
  kind text NOT NULL,
  target_date date NOT NULL,
  lead_days integer NOT NULL,
  channel text NOT NULL,
  sent_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (subscription_id, kind, target_date, lead_days, channel)
);
GRANT SELECT ON public.reminder_sends TO authenticated;
GRANT ALL ON public.reminder_sends TO service_role;
ALTER TABLE public.reminder_sends ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own sends select" ON public.reminder_sends FOR SELECT TO authenticated USING (auth.uid() = user_id);
