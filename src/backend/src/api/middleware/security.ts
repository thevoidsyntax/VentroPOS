// Security Headers Middleware
// Implements defense-in-depth security headers

import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { config } from '../../shared/config/index.js';

interface SecurityHeadersOptions {
  enableCSP?: boolean;
  enableHSTS?: boolean;
}

// Swagger UI has its own CSP requirements - use relaxed settings
const SWAGGER_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "block-all-mixed-content",
  "font-src 'self' https: data:",
  "frame-ancestors 'none'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "script-src-attr 'unsafe-inline'",
  "style-src 'self' https: 'unsafe-inline'",
  "worker-src 'self' blob:",
].join('; ');

const DEFAULT_CSP = [
  "default-src 'self'",
  "base-uri 'self'",
  "block-all-mixed-content",
  "font-src 'self' https: data:",
  "frame-ancestors 'self'",
  "img-src 'self' data: https:",
  "object-src 'none'",
  "script-src 'self'",
  "script-src-attr 'none'",
  "style-src 'self' https: 'unsafe-inline'",
  "upgrade-insecure-requests",
].join('; ');

const HSTS_VALUE = 'max-age=31536000; includeSubDomains';

// Routes that need relaxed security headers
const RELAXED_HEADER_ROUTES = ['/docs', '/health', '/ready'];

function shouldUseRelaxedHeaders(path: string): boolean {
  return RELAXED_HEADER_ROUTES.some(route => path.startsWith(route));
}

export async function registerSecurityHeaders(
  app: FastifyInstance,
  options: SecurityHeadersOptions = {}
): Promise<void> {
  const { enableCSP = true, enableHSTS = config.isProduction } = options;

  // Apply on every request
  app.addHook('onSend', async (request: FastifyRequest, reply: FastifyReply) => {
    const path = request.url;
    const useRelaxed = shouldUseRelaxedHeaders(path);
    const headers = reply.getHeaders();

    // Prevent MIME type sniffing
    headers['X-Content-Type-Options'] = 'nosniff';

    // Prevent clickjacking (allow swagger UI to work in frames)
    headers['X-Frame-Options'] = useRelaxed ? 'SAMEORIGIN' : 'DENY';

    // XSS Protection (legacy but still useful for older browsers)
    headers['X-XSS-Protection'] = '1; mode=block';

    // Referrer Policy
    headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

    // Permissions Policy (restrict sensitive features)
    headers['Permissions-Policy'] = [
      'accelerometer=()',
      'camera=()',
      'geolocation=()',
      'gyroscope=()',
      'magnetometer=()',
      'microphone=()',
      'payment=()',
    ].join(', ');

    // Content Security Policy - use appropriate CSP for route
    if (enableCSP) {
      headers['Content-Security-Policy'] = useRelaxed ? SWAGGER_CSP : DEFAULT_CSP;
    }

    // Strict Transport Security (HTTPS only)
    if (enableHSTS) {
      headers['Strict-Transport-Security'] = HSTS_VALUE;
    }

    // Remove server header (hide server identity)
    delete headers['server'];

    // Remove x-powered-by header if present
    delete headers['x-powered-by'];

    reply.headers(headers);
  });

  // Add CORS preflight optimization
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Handle OPTIONS requests efficiently
    if (request.method === 'OPTIONS') {
      const path = request.url;
      const useRelaxed = shouldUseRelaxedHeaders(path);

      const headers: Record<string, string> = {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Idempotency-Key',
        'Access-Control-Max-Age': '86400', // 24 hours
        'Access-Control-Allow-Credentials': 'true',
        'Vary': 'Origin',
      };

      // Use appropriate CSP for route type
      if (enableCSP) {
        headers['Content-Security-Policy'] = useRelaxed ? SWAGGER_CSP : DEFAULT_CSP;
      }

      reply.headers(headers);
    }
  });
}

// Rate limiting key generator with tenant isolation
export function rateLimitKeyGenerator(request: FastifyRequest): string {
  // Use tenant ID from JWT if available, fallback to IP
  const tenantId = (request.user as { tenantId?: string } | undefined)?.tenantId || 'public';
  const identifier = request.ip || request.headers['x-forwarded-for'] || 'unknown';
  return `${tenantId}:${identifier}`;
}

// Custom error response for rate limiting
export function rateLimitErrorResponse() {
  return {
    success: false,
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests. Please try again later.',
    },
  };
}

// Custom headers for rate limit response
export function rateLimitHeaders(reply: FastifyReply, max: number, remaining: number, reset: number) {
  reply.header('X-RateLimit-Limit', max.toString());
  reply.header('X-RateLimit-Remaining', remaining.toString());
  reply.header('X-RateLimit-Reset', reset.toString());
  reply.header('Retry-After', Math.ceil((reset * 1000 - Date.now()) / 1000).toString());
}
