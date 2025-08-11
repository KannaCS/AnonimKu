-- Fix reveal request logic to allow new requests after rejection

-- First, let's see the current constraint
-- We need to modify the unique constraint to only apply to pending requests
-- Or clean up rejected/accepted requests

-- Option 1: Clean up processed requests when they're responded to
-- This is done in the application logic

-- Option 2: Allow multiple requests but only show latest pending ones
-- Remove the unique constraint that blocks multiple requests
ALTER TABLE reveal_requests DROP CONSTRAINT IF EXISTS reveal_requests_match_id_requester_id_key;

-- Create a new constraint that only prevents multiple PENDING requests
CREATE UNIQUE INDEX reveal_requests_unique_pending 
ON reveal_requests (match_id, requester_id) 
WHERE status = 'pending';

-- Also clean up old rejected/accepted requests (optional)
-- DELETE FROM reveal_requests WHERE status IN ('rejected', 'accepted') AND responded_at < NOW() - INTERVAL '1 hour';