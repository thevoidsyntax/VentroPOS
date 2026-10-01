// Configuration - Environment-based settings
// Using Zod for runtime validation

import { z } from 'zod';
import { config as dotenv } from 'dotenv';

// Load .env file in development
if (process.env.NODE_ENV !== 'production') {
  dotenv();
}

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32).refine(val => {
    // Reject common weak secrets
    const weakPatterns = ['secret', 'password', 'jwt', 'token', 'changeme'];
    return !weakPatterns.some(p => val.toLowerCase().includes(p));
  }, { message: 'JWT secret contains a weak pattern' }),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:');
  console.error(JSON.stringify(parsed.error.format(), null, 2));
  process.exit(1);
}

// Validate CORS origin after parsing
const env = parsed.data;
if (env.NODE_ENV === 'production' && env.CORS_ORIGIN === '*') {
  console.error('❌ CORS origin cannot be "*" in production. Set CORS_ORIGIN to specific domain(s).');
  process.exit(1);
}

export const config = {
  env: parsed.data.NODE_ENV,
  isProduction: parsed.data.NODE_ENV === 'production',
  isDevelopment: parsed.data.NODE_ENV === 'development',
  isTest: parsed.data.NODE_ENV === 'test',

  server: {
    port: parsed.data.PORT,
    host: parsed.data.HOST,
  },

  database: {
    url: parsed.data.DATABASE_URL,
    host: parsed.data.DB_HOST,
    port: parsed.data.DB_PORT,
    database: parsed.data.DB_NAME,
    user: parsed.data.DB_USER,
    password: parsed.data.DB_PASSWORD,
  },

  jwt: {
    secret: parsed.data.JWT_SECRET,
    accessExpiresIn: parsed.data.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: parsed.data.JWT_REFRESH_EXPIRES_IN,
  },

  redis: {
    url: parsed.data.REDIS_URL,
  },

  security: {
    bcryptRounds: parsed.data.BCRYPT_ROUNDS,
  },

  logging: {
    level: parsed.data.LOG_LEVEL,
  },

  cors: {
    origin: parsed.data.CORS_ORIGIN,
  },
} as const;

export type Config = typeof config;
