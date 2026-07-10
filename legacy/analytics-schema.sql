-- Analytics Events Table
-- Stores custom analytics events for detailed user behavior tracking

CREATE TABLE IF NOT EXISTS analytics_events (
    id BIGSERIAL PRIMARY KEY,
    
    -- Event Data
    event VARCHAR(100) NOT NULL,
    category VARCHAR(100) NOT NULL,
    action VARCHAR(100) NOT NULL,
    label VARCHAR(255),
    value INTEGER,
    
    -- User & Session Data
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    session_id VARCHAR(255) NOT NULL,
    
    -- Timestamps
    timestamp BIGINT NOT NULL,
    server_timestamp TIMESTAMPTZ DEFAULT NOW(),
    
    -- Request Data
    ip_address INET,
    user_agent TEXT,
    referer TEXT,
    
    -- Custom Data (JSONB for flexible storage)
    custom_data JSONB,
    
    -- Indexes for common queries
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_category ON analytics_events(category);
CREATE INDEX IF NOT EXISTS idx_analytics_events_action ON analytics_events(action);
CREATE INDEX IF NOT EXISTS idx_analytics_events_session_id ON analytics_events(session_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_timestamp ON analytics_events(timestamp);
CREATE INDEX IF NOT EXISTS idx_analytics_events_server_timestamp ON analytics_events(server_timestamp);

-- JSONB index for custom data queries
CREATE INDEX IF NOT EXISTS idx_analytics_events_custom_data ON analytics_events USING GIN (custom_data);

-- Row Level Security (RLS)
ALTER TABLE analytics_events ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to insert analytics events
CREATE POLICY "Service role can insert analytics events" ON analytics_events
    FOR INSERT
    TO service_role
    WITH CHECK (true);

-- Policy: Users can view their own analytics events
CREATE POLICY "Users can view own analytics events" ON analytics_events
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Admin users can view all analytics events (if you have admin roles)
-- CREATE POLICY "Admin can view all analytics events" ON analytics_events
--     FOR SELECT
--     USING (
--         EXISTS (
--             SELECT 1 FROM user_profiles 
--             WHERE user_profiles.user_id = auth.uid() 
--             AND user_profiles.role = 'admin'
--         )
--     );

-- Functions for analytics aggregation
CREATE OR REPLACE FUNCTION get_analytics_summary(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    total_events BIGINT,
    unique_sessions BIGINT,
    unique_users BIGINT,
    top_events JSON,
    top_categories JSON,
    conversion_metrics JSON
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_events,
        COUNT(DISTINCT session_id) as unique_sessions,
        COUNT(DISTINCT user_id) as unique_users,
        (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT event, COUNT(*) as count
                FROM analytics_events 
                WHERE server_timestamp BETWEEN start_date AND end_date
                GROUP BY event 
                ORDER BY count DESC 
                LIMIT 10
            ) t
        ) as top_events,
        (
            SELECT json_agg(row_to_json(t))
            FROM (
                SELECT category, COUNT(*) as count
                FROM analytics_events 
                WHERE server_timestamp BETWEEN start_date AND end_date
                GROUP BY category 
                ORDER BY count DESC 
                LIMIT 10
            ) t
        ) as top_categories,
        (
            SELECT json_build_object(
                'total_signups', COUNT(*) FILTER (WHERE action = 'signup_success'),
                'total_logins', COUNT(*) FILTER (WHERE action = 'login_success'),
                'total_generations', COUNT(*) FILTER (WHERE category = 'creation'),
                'community_shares', COUNT(*) FILTER (WHERE action = 'share_creature')
            )
        ) as conversion_metrics
    FROM analytics_events 
    WHERE server_timestamp BETWEEN start_date AND end_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user journey funnel
CREATE OR REPLACE FUNCTION get_user_funnel(
    start_date TIMESTAMPTZ DEFAULT NOW() - INTERVAL '30 days',
    end_date TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TABLE (
    step VARCHAR,
    unique_users BIGINT,
    conversion_rate NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH funnel_steps AS (
        SELECT 
            'visitors' as step,
            COUNT(DISTINCT session_id) as users,
            1 as step_order
        FROM analytics_events 
        WHERE server_timestamp BETWEEN start_date AND end_date
        
        UNION ALL
        
        SELECT 
            'trial_users' as step,
            COUNT(DISTINCT session_id) as users,
            2 as step_order
        FROM analytics_events 
        WHERE server_timestamp BETWEEN start_date AND end_date
        AND category = 'creation'
        
        UNION ALL
        
        SELECT 
            'signups' as step,
            COUNT(DISTINCT session_id) as users,
            3 as step_order
        FROM analytics_events 
        WHERE server_timestamp BETWEEN start_date AND end_date
        AND action = 'signup_success'
        
        UNION ALL
        
        SELECT 
            'community_sharers' as step,
            COUNT(DISTINCT session_id) as users,
            4 as step_order
        FROM analytics_events 
        WHERE server_timestamp BETWEEN start_date AND end_date
        AND action = 'share_creature'
    )
    SELECT 
        f1.step,
        f1.users,
        CASE 
            WHEN LAG(f1.users) OVER (ORDER BY f1.step_order) IS NULL THEN 100.0
            ELSE ROUND((f1.users::NUMERIC / LAG(f1.users) OVER (ORDER BY f1.step_order)) * 100, 2)
        END as conversion_rate
    FROM funnel_steps f1
    ORDER BY f1.step_order;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;