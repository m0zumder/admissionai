
-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  class_level TEXT CHECK (class_level IN ('SSC', 'HSC', 'Admission')),
  target_exam TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  subscription_plan TEXT NOT NULL DEFAULT 'free' CHECK (subscription_plan IN ('free', 'student', 'premium')),
  daily_mcq_count INT NOT NULL DEFAULT 0,
  daily_explain_count INT NOT NULL DEFAULT 0,
  daily_srijonshil_count INT NOT NULL DEFAULT 0,
  last_reset_date DATE NOT NULL DEFAULT CURRENT_DATE
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Subjects table
CREATE TABLE public.subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  class_level TEXT NOT NULL,
  icon TEXT NOT NULL DEFAULT '📚'
);

ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read subjects" ON public.subjects FOR SELECT USING (true);

-- Topics table
CREATE TABLE public.topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_id UUID NOT NULL REFERENCES public.subjects(id) ON DELETE CASCADE,
  name_bn TEXT NOT NULL,
  name_en TEXT NOT NULL,
  chapter_number INT NOT NULL DEFAULT 1
);

ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read topics" ON public.topics FOR SELECT USING (true);

-- MCQ Sessions table
CREATE TABLE public.mcq_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject_id UUID REFERENCES public.subjects(id),
  topic_id UUID REFERENCES public.topics(id),
  questions_attempted INT NOT NULL DEFAULT 0,
  correct_answers INT NOT NULL DEFAULT 0,
  score_percentage FLOAT NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.mcq_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON public.mcq_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON public.mcq_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Weak topics table
CREATE TABLE public.weak_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  wrong_count INT NOT NULL DEFAULT 0,
  last_attempted TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, topic_id)
);

ALTER TABLE public.weak_topics ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own weak topics" ON public.weak_topics FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own weak topics" ON public.weak_topics FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own weak topics" ON public.weak_topics FOR UPDATE USING (auth.uid() = user_id);

-- Creative answers table
CREATE TABLE public.creative_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  uddipok TEXT NOT NULL,
  subject TEXT NOT NULL,
  generated_answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.creative_answers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own answers" ON public.creative_answers FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own answers" ON public.creative_answers FOR INSERT WITH CHECK (auth.uid() = user_id);
