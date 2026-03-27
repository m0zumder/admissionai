
CREATE TABLE public.parent_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid,
  child_id uuid NOT NULL,
  linking_code text NOT NULL UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  status text NOT NULL DEFAULT 'pending'
);

ALTER TABLE public.parent_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read links by code" ON public.parent_links FOR SELECT TO authenticated USING (true);
CREATE POLICY "Anyone authenticated can insert links" ON public.parent_links FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "Anyone authenticated can update links" ON public.parent_links FOR UPDATE TO authenticated USING (true);

CREATE TABLE public.parent_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id uuid NOT NULL,
  child_id uuid NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.parent_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own messages" ON public.parent_messages FOR SELECT TO authenticated USING (auth.uid() = parent_id OR auth.uid() = child_id);
CREATE POLICY "Parents can insert messages" ON public.parent_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = parent_id);
CREATE POLICY "Children can update messages" ON public.parent_messages FOR UPDATE TO authenticated USING (auth.uid() = child_id);

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_parent boolean NOT NULL DEFAULT false;
