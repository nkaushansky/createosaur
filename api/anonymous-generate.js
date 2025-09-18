// Anonymous generation API for Vercel
const rateLimitMap = new Map();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const {
      prompt,
      negativePrompt,
      width = 768,
      height = 768,
      steps = 15,
      guidance = 7.5,
      fingerprint,
      sessionId
    } = req.body;

    // Validate required fields
    if (!prompt || !fingerprint || !sessionId) {
      return res.status(400).json({ 
        error: 'Missing required fields: prompt, fingerprint, sessionId' 
      });
    }

    // Check environment variables
    const adminStabilityKey = process.env.ADMIN_STABILITY_API_KEY;
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!adminStabilityKey) {
      console.error('ADMIN_STABILITY_API_KEY not configured');
      return res.status(500).json({ error: 'Server configuration error' });
    }

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return res.status(500).json({ error: 'Database configuration error' });
    }

    // Get client IP for rate limiting
    const clientIP = getClientIP(req);
    const rateLimitKey = `${clientIP}:${fingerprint}`;

    // Check rate limits (5 requests per hour per IP+fingerprint)
    if (!checkRateLimit(rateLimitKey, 5, 3600000)) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded. Please try again later.' 
      });
    }

    // Import Supabase client dynamically
    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check trial usage in database
    const { data: usageData, error: usageError } = await supabase
      .from('anonymous_usage')
      .select('*')
      .eq('fingerprint', fingerprint)
      .order('created_at', { ascending: false })
      .limit(1);

    if (usageError) {
      console.error('Database error:', usageError);
    }

    // Calculate trial status
    const existingUsage = usageData?.[0];
    let totalUsed = 0;
    let maxAllowed = 3; // First-time user

    if (existingUsage) {
      totalUsed = existingUsage.generations_used || 0;
      maxAllowed = existingUsage.max_generations || 3;
    }

    // Check if user has exceeded trial
    if (totalUsed >= maxAllowed) {
      return res.status(403).json({
        error: 'Trial limit exceeded',
        remainingGenerations: 0,
        totalUsed,
        maxAllowed
      });
    }

    // Generate image using admin Stability AI key
    const stabilityResult = await generateWithStabilityAI({
      prompt,
      negativePrompt: negativePrompt || 'blurry, low quality, distorted, deformed',
      width,
      height,
      steps,
      guidance,
      apiKey: adminStabilityKey
    });

    if (!stabilityResult.success) {
      return res.status(500).json({
        error: stabilityResult.error || 'Image generation failed'
      });
    }

    // Record usage in database
    const newUsage = totalUsed + 1;
    const { error: insertError } = await supabase
      .from('anonymous_usage')
      .insert({
        fingerprint,
        session_id: sessionId,
        generations_used: newUsage,
        max_generations: maxAllowed,
        user_agent: req.headers['user-agent'] || '',
        ip_address: clientIP,
        created_at: new Date().toISOString()
      });

    if (insertError) {
      console.error('Failed to record usage:', insertError);
      // Don't fail the request for this
    }

    // Return successful response
    return res.status(200).json({
      success: true,
      imageUrl: stabilityResult.imageUrl,
      remainingGenerations: maxAllowed - newUsage,
      totalUsed: newUsage,
      maxAllowed
    });

  } catch (error) {
    console.error('Anonymous generation error:', error);
    return res.status(500).json({
      error: 'Internal server error'
    });
  }
}

async function generateWithStabilityAI({
  prompt,
  negativePrompt,
  width,
  height,
  steps,
  guidance,
  apiKey
}) {
  try {
    const requestBody = {
      text_prompts: [
        { text: prompt, weight: 1 },
        { text: negativePrompt, weight: -1 }
      ],
      cfg_scale: guidance,
      steps,
      width,
      height,
      samples: 1
    };

    const response = await fetch(
      'https://api.stability.ai/v1/generation/stable-diffusion-v1-6/text-to-image',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'Accept': 'application/json'
        },
        body: JSON.stringify(requestBody)
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Stability AI error:', response.status, errorText);
      return {
        success: false,
        error: `Stability AI error: ${response.status}`
      };
    }

    const data = await response.json();
    
    if (data.artifacts && data.artifacts.length > 0) {
      const base64Image = data.artifacts[0].base64;
      const imageUrl = `data:image/png;base64,${base64Image}`;
      
      return {
        success: true,
        imageUrl
      };
    } else {
      return {
        success: false,
        error: 'No image generated'
      };
    }
  } catch (error) {
    console.error('Stability AI generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

function getClientIP(req) {
  const forwarded = req.headers['x-forwarded-for'];
  const real = req.headers['x-real-ip'];
  const cfConnecting = req.headers['cf-connecting-ip'];
  
  if (typeof forwarded === 'string') {
    return forwarded.split(',')[0].trim();
  }
  if (typeof real === 'string') {
    return real;
  }
  if (typeof cfConnecting === 'string') {
    return cfConnecting;
  }
  
  return req.socket?.remoteAddress || 'unknown';
}

function checkRateLimit(key, maxRequests, windowMs) {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    return false;
  }
  
  record.count++;
  return true;
}