// Constants - Centralized magic numbers and configuration values

// HTTP Server
export const HTTP_PORT = 3000;
export const HTTP_HOST = '0.0.0.0';

// Rate Limiting
export const RATE_LIMIT_MAX_REQUESTS = 100;
export const RATE_LIMIT_WINDOW_SECONDS = 60;
export const AUTH_RATE_LIMIT_MAX_REQUESTS = 5;

// Cache TTL (seconds)
export const CACHE_TTL_15_MIN = 900;
export const CACHE_TTL_1_HOUR = 3600;

// Tax Rate (Indonesia PPN)
export const TAX_RATE_DEFAULT = 0.11;

// Redis Retry Delays (ms)
export const RETRY_BASE_DELAY = 200;
export const RETRY_MAX_DELAY = 2000;
export const RETRY_MAX_ATTEMPTS = 3;

// Hardware Defaults
export const DEFAULT_PRINTER_IP = '192.168.1.100';
export const DEFAULT_PRINTER_PORT = 9100;
export const DEFAULT_EDC_IP = '192.168.1.101';
export const DEFAULT_EDC_PORT = 9101;
export const DEFAULT_HARDWARE_TIMEOUT_MS = 5000;
export const DEFAULT_EDC_TIMEOUT_MS = 30000;

// Hardware Display
export const THERMAL_PRINTER_WIDTH = 48;

// Pagination
export const QUERY_LIMIT_DEFAULT = 100;
export const AUDIT_LOG_QUERY_LIMIT = 100;

// Security
export const BCRYPT_ROUNDS_DEFAULT = 12;
export const JWT_ACCESS_EXPIRES_IN = '15m';
export const JWT_REFRESH_EXPIRES_IN = '7d';

// Vite Dev Server
export const VITE_DEFAULT_PORT = 5173;
