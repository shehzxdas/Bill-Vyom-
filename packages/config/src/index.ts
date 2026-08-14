/**
 * Bill Vyom — Authoritative Central Configuration Engine
 * Validates environment variables, enforces production safeguards, and provides type-safe configuration.
 */

export interface AppConfig {
  env: 'development' | 'production' | 'test';
  port: number;
  jwtSecret: string;
  adminEmail: string;
  adminPasswordHash: string; // pre-hashed or plain default
  tokenExpiryHours: number;
}

function getEnvVar(key: string, defaultValue?: string, required = false): string {
  const value = process.env[key];
  if (!value) {
    if (required && process.env.NODE_ENV === 'production') {
      throw new Error(`CRITICAL CONFIG ERROR: Missing required environment variable [${key}] in production mode.`);
    }
    return defaultValue || '';
  }
  return value;
}

export const config: AppConfig = {
  env: (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  jwtSecret: getEnvVar('JWT_SECRET', 'vyom-global-auth-secure-signing-key-standard-2026', true),
  adminEmail: getEnvVar('PLATFORM_ADMIN_EMAIL', 'admin@vyom.global'),
  adminPasswordHash: getEnvVar('PLATFORM_ADMIN_PASSWORD', 'AdminVyom2026!'), // Default platform password
  tokenExpiryHours: parseInt(process.env.TOKEN_EXPIRY_HOURS || '24', 10),
};

/**
 * Validate configuration status
 */
export function validateConfig(): void {
  const warnings: string[] = [];

  if (config.env === 'production') {
    if (config.jwtSecret === 'vyom-global-auth-secure-signing-key-standard-2026') {
      warnings.push('JWT_SECRET is using the insecure default key in production!');
    }
    if (config.adminPasswordHash === 'AdminVyom2026!') {
      warnings.push('PLATFORM_ADMIN_PASSWORD is using the insecure default value in production!');
    }
  }

  if (warnings.length > 0) {
    console.warn('\n=========================================');
    console.warn('⚠️  BILL VYOM CONFIGURATION SAFEGUARD WARNINGS:');
    warnings.forEach((w) => console.warn(`   - ${w}`));
    console.warn('=========================================\n');
  }
}
