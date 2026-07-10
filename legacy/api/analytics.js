/**
 * Custom Analytics API Endpoint
 * Captures and stores custom event data from the frontend
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client with service role key for server-side operations
const supabase = supabaseUrl && supabaseServiceKey 
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

export default async function handler(req, res) {
  // Enable CORS for cross-origin requests
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const event = req.body;

    // Validate required fields
    if (!event.event || !event.category || !event.action || !event.sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: event, category, action, sessionId' 
      });
    }

    // Add server-side metadata
    const enrichedEvent = {
      ...event,
      server_timestamp: new Date().toISOString(),
      ip_address: req.headers['x-forwarded-for'] || req.connection.remoteAddress,
      user_agent: req.headers['user-agent'],
      referer: req.headers.referer
    };

    // Store in Supabase if available
    if (supabase) {
      const { error } = await supabase
        .from('analytics_events')
        .insert([enrichedEvent]);

      if (error) {
        console.error('Failed to store analytics event in Supabase:', error);
        // Don't return error to client, continue with fallback storage
      }
    }

    // Always log to console for development/debugging
    console.log('Analytics Event:', {
      timestamp: new Date().toISOString(),
      event: event.event,
      category: event.category,
      action: event.action,
      sessionId: event.sessionId,
      customData: event.customData
    });

    // Return success
    res.status(200).json({ success: true, eventId: `${event.sessionId}_${Date.now()}` });

  } catch (error) {
    console.error('Analytics API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}