import type { AstroCookies } from 'astro';
import { createSupabaseServerClient } from '../../db/supabase.client';

interface RateLimitConfig {
  windowMs: number;
  maxAttempts: number;
  keyGenerator: (request: Request) => string;
  skipSuccessfulRequests?: boolean;
}

interface RateLimitRecord {
  ip: string;
  endpoint: string;
  attempts: number;
  window_start: string;
  created_at: string;
}

export class RateLimiter {
  private supabase: any;

  constructor(context: { headers: Headers; cookies: AstroCookies }) {
    this.supabase = createSupabaseServerClient(context);
  }

  async checkLimit(request: Request, config: RateLimitConfig): Promise<{ allowed: boolean; remaining: number; resetTime: number }> {
    const key = config.keyGenerator(request);
    const now = new Date();
    const windowStart = new Date(now.getTime() - config.windowMs);

    try {
      // Clean up old records first
      await this.cleanupOldRecords(windowStart);

      // Get current attempts for this key
      const { data: records, error } = await this.supabase
        .from('rate_limit_records')
        .select('*')
        .eq('ip', key)
        .gte('window_start', windowStart.toISOString())
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Rate limit check error:', error);
        // On error, allow the request (fail open)
        return { allowed: true, remaining: config.maxAttempts, resetTime: now.getTime() + config.windowMs };
      }

      const currentAttempts = records?.length || 0;
      const remaining = Math.max(0, config.maxAttempts - currentAttempts);
      const resetTime = now.getTime() + config.windowMs;

      if (currentAttempts >= config.maxAttempts) {
        return { allowed: false, remaining: 0, resetTime };
      }

      // Record this attempt
      await this.recordAttempt(key, now);

      return { allowed: true, remaining: remaining - 1, resetTime };

    } catch (error) {
      console.error('Rate limiter error:', error);
      // On error, allow the request (fail open)
      return { allowed: true, remaining: config.maxAttempts, resetTime: now.getTime() + config.windowMs };
    }
  }

  /**
   * Clear rate limit records for successful authentication
   * This prevents successful logins from counting against the limit
   */
  async clearSuccessfulAttempt(request: Request, config: RateLimitConfig): Promise<void> {
    const key = config.keyGenerator(request);
    
    try {
      await this.supabase
        .from('rate_limit_records')
        .delete()
        .eq('ip', key);
    } catch (error) {
      console.error('Failed to clear successful rate limit attempt:', error);
    }
  }

  private async recordAttempt(key: string, timestamp: Date): Promise<void> {
    try {
      await this.supabase
        .from('rate_limit_records')
        .insert({
          ip: key,
          endpoint: 'auth', // Could be made configurable
          attempts: 1,
          window_start: timestamp.toISOString(),
          created_at: timestamp.toISOString()
        });
    } catch (error) {
      console.error('Failed to record rate limit attempt:', error);
    }
  }

  private async cleanupOldRecords(cutoffTime: Date): Promise<void> {
    try {
      await this.supabase
        .from('rate_limit_records')
        .delete()
        .lt('window_start', cutoffTime.toISOString());
    } catch (error) {
      console.error('Failed to cleanup old rate limit records:', error);
    }
  }
}

// Predefined rate limit configurations
export const rateLimitConfigs = {
  auth: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxAttempts: 6,
    keyGenerator: (request: Request) => {
      // Use IP address or fallback to user-agent
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      return ip;
    }
  },
  forgotPassword: {
    windowMs: 60 * 60 * 1000, // 1 hour
    maxAttempts: 3,
    keyGenerator: (request: Request) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      return ip;
    }
  },
  api: {
    windowMs: 60 * 1000, // 1 minute
    maxAttempts: 60,
    keyGenerator: (request: Request) => {
      const forwarded = request.headers.get('x-forwarded-for');
      const ip = forwarded ? forwarded.split(',')[0] : 
                 request.headers.get('x-real-ip') || 
                 'unknown';
      return ip;
    }
  }
} as const;

export function createRateLimitError(resetTime: number) {
  const resetDate = new Date(resetTime);
  return {
    error: 'RATE_LIMIT_EXCEEDED',
    message: `Zbyt wiele prób. Spróbuj ponownie po ${resetDate.toLocaleTimeString()}`,
    statusCode: 429,
    headers: {
      'Retry-After': Math.ceil((resetTime - Date.now()) / 1000).toString(),
      'X-RateLimit-Reset': resetTime.toString()
    }
  };
} 