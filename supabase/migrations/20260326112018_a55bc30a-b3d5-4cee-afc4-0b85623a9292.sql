CREATE TABLE public.notebook_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_path text NOT NULL,
  file_type text NOT NULL,
  file_size bigint NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notebook_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert own documents" ON public.notebook_documents
FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own documents" ON public.notebook_documents
FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own documents" ON public.notebook_documents
FOR DELETE TO authenticated USING (auth.uid() = user_id);