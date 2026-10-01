// Configuration - Environment-based settings
// Using Zod for runtime validation

import { z } from 'zod';
import { config as dotenv } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory of this config file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment-specific .env file
const envName = process.env.NODE_ENV || 'development';
const envFile = envName === 'test' ? '.env.test' : envName === 'production' ? '.env' : '.env';
dotenv({ path: join(__dirname, '..', '..', '..', '..', envFile) });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(3000),
  HOST: z.string().default('0.0.0.0'),

  // Database
  DATABASE_URL: z.string().url().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.coerce.number().optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),

  // JWT
  JWT_SECRET: z.string().min(32).optional(),
  JWT_ACCESS_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),

  // Redis
  REDIS_URL: z.string().url().optional(),

  // Security
  BCRYPT_ROUNDS: z.coerce.number().default(12),

  // Business
  TAX_RATE: z.coerce.number().min(0).max(1).default(0.11),

  // Logging
  LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),

  // CORS
  CORS_ORIGIN: z.string().default('*'),
});

// Simple startup logger (runs before app logger is available)
const isTest = process.env.NODE_ENV === 'test';
const startupLogger = {
  error: (msg: string, ...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] ERROR: ${msg}`, ...args);
    if (!isTest) process.exit(1);
  },
  fatal: (msg: string, ...args: unknown[]) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] FATAL: ${msg}`, ...args);
    if (!isTest) process.exit(1);
  },
};

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  startupLogger.error('❌ Invalid environment variables:');
  startupLogger.error(JSON.stringify(parsed.error.format(), null, 2));
}

// Type guard: if we get here, parsed must be successful
const env = parsed.success ? parsed.data : null;

// Validate CORS origin after parsing (only in production)
if (env && env.NODE_ENV === 'production') {
  const corsOrigin = env.CORS_ORIGIN || process.env.CORS_ORIGIN;
  if (corsOrigin === '*') {
    startupLogger.error('❌ CORS origin cannot be "*" in production. Set CORS_ORIGIN to specific domain(s).');
  }
}

const defaultCors = process.env.NODE_ENV === 'test' ? 'http://localhost:3000' : '*';

export const config = {
  env: env!.NODE_ENV,
  isProduction: env!.NODE_ENV === 'production',
  isDevelopment: env!.NODE_ENV === 'development',
  isTest: env!.NODE_ENV === 'test',

  server: {
    port: env!.PORT,
    host: env!.HOST,
  },

  database: {
    url: env!.DATABASE_URL,
    host: env!.DB_HOST,
    port: env!.DB_PORT,
    database: env!.DB_NAME,
    user: env!.DB_USER,
    password: env!.DB_PASSWORD,
  },

  jwt: {
    secret: env!.JWT_SECRET || 'test-secret-key-for-unit-testing-only-minimum-32-chars',
    accessExpiresIn: env!.JWT_ACCESS_EXPIRES_IN,
    refreshExpiresIn: env!.JWT_REFRESH_EXPIRES_IN,
  },

  redis: {
    url: env!.REDIS_URL,
  },

  security: {
    bcryptRounds: env!.BCRYPT_ROUNDS,
  },

  tax: {
    rate: env!.TAX_RATE,
  },

  logging: {
    level: env!.LOG_LEVEL,
  },

  cors: {
    origin: env!.CORS_ORIGIN || defaultCors,
  },
} as const;

export type Config = typeof config;
