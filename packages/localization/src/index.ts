/**
 * Bill Vyom — Authoritative Localization & Internationalization Foundation
 * Decouples system metrics, currency formatting, and timezone parsing from regional assumptions.
 */

export interface LocaleConfig {
  locale: string;
  languageCode: string;
  countryCode: string;
  defaultCurrency: string;
  timezone: string;
}

export const SUPPORTED_LOCALES: Record<string, LocaleConfig> = {
  'en-US': { locale: 'en-US', languageCode: 'en', countryCode: 'US', defaultCurrency: 'USD', timezone: 'America/New_York' },
  'en-IN': { locale: 'en-IN', languageCode: 'en', countryCode: 'IN', defaultCurrency: 'INR', timezone: 'Asia/Kolkata' },
  'en-GB': { locale: 'en-GB', languageCode: 'en', countryCode: 'GB', defaultCurrency: 'GBP', timezone: 'Europe/London' },
  'ar-AE': { locale: 'ar-AE', languageCode: 'ar', countryCode: 'AE', defaultCurrency: 'AED', timezone: 'Asia/Dubai' },
  'en-SG': { locale: 'en-SG', languageCode: 'en', countryCode: 'SG', defaultCurrency: 'SGD', timezone: 'Asia/Singapore' },
};

export class LocalizationManager {
  private activeConfig: LocaleConfig;

  constructor(localeCode: string = 'en-IN') {
    this.activeConfig = SUPPORTED_LOCALES[localeCode] || SUPPORTED_LOCALES['en-US'];
  }

  public getLocale(): string {
    return this.activeConfig.locale;
  }

  public getTimezone(): string {
    return this.activeConfig.timezone;
  }

  /**
   * Safe localized date formatting
   */
  public formatDate(date: Date | string | number, options?: Intl.DateTimeFormatOptions): string {
    const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
    return new Intl.DateTimeFormat(this.activeConfig.locale, {
      timeZone: this.activeConfig.timezone,
      dateStyle: 'medium',
      ...options,
    }).format(d);
  }

  /**
   * Safe localized number formatting
   */
  public formatNumber(num: number, options?: Intl.NumberFormatOptions): string {
    return new Intl.NumberFormat(this.activeConfig.locale, options).format(num);
  }

  /**
   * Safe localized currency formatting
   */
  public formatCurrency(amount: number, currencyCode: string): string {
    return new Intl.NumberFormat(this.activeConfig.locale, {
      style: 'currency',
      currency: currencyCode.toUpperCase(),
    }).format(amount);
  }
}

export const localization = new LocalizationManager();
