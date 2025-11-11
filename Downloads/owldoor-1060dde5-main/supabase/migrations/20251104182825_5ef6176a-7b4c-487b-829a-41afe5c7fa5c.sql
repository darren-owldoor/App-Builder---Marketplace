-- Allow users to update their own pro profile
CREATE POLICY "Users can update their own profile"
  ON pros
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);