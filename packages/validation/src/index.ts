/**
 * Bill Vyom — Authoritative Validation Primitives
 * Enforces rigid payload structure validation and domain syntax constraints.
 */

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  field?: string;
}

export function validateEmail(email: string): ValidationResult {
  if (!email || email.trim() === '') {
    return { isValid: false, message: 'Email address cannot be empty', field: 'email' };
  }
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { isValid: false, message: 'Invalid email address format', field: 'email' };
  }
  return { isValid: true };
}

export function validatePassword(password: string): ValidationResult {
  if (!password || password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long', field: 'password' };
  }
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasDigit = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);

  if (!hasUppercase || !hasLowercase || !hasDigit || !hasSpecial) {
    return {
      isValid: false,
      message: 'Password must contain uppercase, lowercase, numeric, and special characters',
      field: 'password',
    };
  }
  return { isValid: true };
}

export function validateBusinessName(name: string): ValidationResult {
  if (!name || name.trim().length < 3) {
    return { isValid: false, message: 'Business name must be at least 3 characters long', field: 'legal_name' };
  }
  return { isValid: true };
}

export function validateCountryCode(code: string): ValidationResult {
  if (!code || code.trim().length !== 2) {
    return { isValid: false, message: 'Country code must be exactly 2-letter ISO code (e.g. IN, US)', field: 'country_code' };
  }
  return { isValid: true };
}
