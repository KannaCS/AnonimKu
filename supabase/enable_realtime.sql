-- Enable Realtime for all tables

-- Enable Realtime replication for the tables
ALTER TABLE public.messages REPLICA IDENTITY DEFAULT;
ALTER TABLE public.reveal_requests REPLICA IDENTITY DEFAULT;
ALTER TABLE public.matches REPLICA IDENTITY DEFAULT;
ALTER TABLE public.users REPLICA IDENTITY DEFAULT;

-- Enable Realtime on the tables
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE reveal_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE matches;
ALTER PUBLICATION supabase_realtime ADD TABLE users;

-- Make sure the tables have proper permissions for realtime
GRANT SELECT ON messages TO anon, authenticated;
GRANT SELECT ON reveal_requests TO anon, authenticated;
GRANT SELECT ON matches TO anon, authenticated;
GRANT SELECT ON users TO anon, authenticated;

-- Enable RLS but allow realtime events
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE reveal_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create more permissive policies for realtime to work
DROP POLICY IF EXISTS "Allow all for messages" ON messages;
DROP POLICY IF EXISTS "Allow all for reveal_requests" ON reveal_requests;
DROP POLICY IF EXISTS "Allow all for matches" ON matches;
DROP POLICY IF EXISTS "Allow all for users" ON users;

-- Messages policies
CREATE POLICY "Users can view messages in their matches" ON messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM matches 
      WHERE matches.id = messages.match_id 
      AND (matches.user1_id = auth.uid() OR matches.user2_id = auth.uid() OR auth.uid() IS NULL)
    )
  );

CREATE POLICY "Users can send messages" ON messages
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id OR auth.uid() IS NULL
  );

-- Reveal requests policies
CREATE POLICY "Users can view reveal requests" ON reveal_requests
  FOR ALL USING (true);

-- Matches policies  
CREATE POLICY "Users can view matches" ON matches
  FOR ALL USING (true);

-- Users policies
CREATE POLICY "Users can view users" ON users
  FOR ALL USING (true);

-- Also grant realtime access
GRANT USAGE ON SCHEMA realtime TO anon, authenticated;