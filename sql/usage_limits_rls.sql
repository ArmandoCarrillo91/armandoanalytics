-- Enable RLS on usage_limits (idempotent)
ALTER TABLE usage_limits ENABLE ROW LEVEL SECURITY;

-- SELECT: user can read their own rows
CREATE POLICY "usage_limits_select_own"
  ON usage_limits
  FOR SELECT
  USING (user_id = auth.uid());

-- INSERT: user can insert their own rows
CREATE POLICY "usage_limits_insert_own"
  ON usage_limits
  FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- UPDATE: user can update their own rows
CREATE POLICY "usage_limits_update_own"
  ON usage_limits
  FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
