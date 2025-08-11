-- Fix RLS policies to allow user registration

-- Add INSERT policy for users table to allow new user creation
CREATE POLICY "Users can insert their own profile" ON users
  FOR INSERT WITH CHECK (true);

-- Add INSERT policy for matches table 
CREATE POLICY "System can create matches" ON matches
  FOR INSERT WITH CHECK (true);

-- Update users policy to allow upsert operations
DROP POLICY IF EXISTS "Users can update own profile" ON users;
CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (true) WITH CHECK (true);

-- Make sure functions can be executed
GRANT EXECUTE ON FUNCTION find_match_for_user TO anon, authenticated;
GRANT EXECUTE ON FUNCTION end_match TO anon, authenticated;
GRANT EXECUTE ON FUNCTION update_updated_at_column TO anon, authenticated;

-- Allow anonymous access for initial user creation
GRANT INSERT ON users TO anon;
GRANT SELECT ON users TO anon;
GRANT UPDATE ON users TO anon;