-- Allow all authenticated users to read mcq_sessions for leaderboard
CREATE POLICY "Anyone can read mcq_sessions for leaderboard"
ON public.mcq_sessions
FOR SELECT
TO authenticated
USING (true);

-- Allow all authenticated users to read profile names for leaderboard
CREATE POLICY "Anyone can read profiles for leaderboard"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);