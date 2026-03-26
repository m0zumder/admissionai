-- Storage policies for notebooks bucket
-- The bucket will be created via the app's first upload attempt
CREATE POLICY "Users can upload own notebook docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'notebooks' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can read own notebook docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'notebooks' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own notebook docs"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'notebooks' AND (storage.foldername(name))[1] = auth.uid()::text);