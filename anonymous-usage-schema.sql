-- Anonymous usage tracking table for free trial system
-- This helps with analytics and prevents abuse

CREATE TABLE IF NOT EXISTS anonymous_usage (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  fingerprint TEXT NOT NULL,
  session_id TEXT NOT NULL,
  generations_used INTEGER DEFAULT 1,
  max_generations INTEGER DEFAULT 3,
  user_agent TEXT,
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_fingerprint ON anonymous_usage(fingerprint);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_session ON anonymous_usage(session_id);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_created_at ON anonymous_usage(created_at);
CREATE INDEX IF NOT EXISTS idx_anonymous_usage_ip ON anonymous_usage(ip_address);

-- Add RLS (Row Level Security) if needed
ALTER TABLE anonymous_usage ENABLE ROW LEVEL SECURITY;

-- Policy to allow insertions (for tracking)
CREATE POLICY "Allow anonymous usage insertions" ON anonymous_usage
  FOR INSERT 
  WITH CHECK (true);

-- Policy to allow reading for analytics (you might want to restrict this)
CREATE POLICY "Allow anonymous usage reading" ON anonymous_usage
  FOR SELECT 
  USING (true);

-- Add comments for documentation
COMMENT ON TABLE anonymous_usage IS 'Tracks anonymous user generations for free trial system and analytics';
COMMENT ON COLUMN anonymous_usage.fingerprint IS 'Browser fingerprint hash for device identification';
COMMENT ON COLUMN anonymous_usage.session_id IS 'Session-based identifier for tracking within browser session';
COMMENT ON COLUMN anonymous_usage.generations_used IS 'Number of generations used in this session';
COMMENT ON COLUMN anonymous_usage.max_generations IS 'Maximum allowed generations for this fingerprint';
COMMENT ON COLUMN anonymous_usage.user_agent IS 'Browser user agent string for analytics';
COMMENT ON COLUMN anonymous_usage.ip_address IS 'IP address for rate limiting and abuse prevention';