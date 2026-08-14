/**
 * Bill Vyom — Authoritative Multi-Currency Money Value Object
 * Combines precise decimal arithmetic with explicit currency references to prevent monetary mix-ups.
 */

import { Decimal } from '@packages/domain/src/decimal';

export interface CurrencyConfig {
  code: string;
  symbol: string;
  decimalPlaces: number;
}

export const CURRENCY_REGISTRY: Record<string, CurrencyConfig> = {
  INR: { code: 'INR', symbol: '₹', decimalPlaces: 2 },
  USD: { code: 'USD', symbol: '$', decimalPlaces: 2 },
  EUR: { code: 'EUR', symbol: '€', decimalPlaces: 2 },
  GBP: { code: 'GBP', symbol: '£', decimalPlaces: 2 },
  AED: { code: 'AED', symbol: 'AED', decimalPlaces: 2 },
  SGD: { code: 'SGD', symbol: 'S$', decimalPlaces: 2 },
};

export class Money {
  private amountDecimal: Decimal;
  private currencyConfig: CurrencyConfig;

  constructor(amount: string | number | Decimal, currencyCode: string = 'INR') {
    this.currencyConfig = CURRENCY_REGISTRY[currencyCode.toUpperCase()] || { code: currencyCode.toUpperCase(), symbol: currencyCode.toUpperCase(), decimalPlaces: 2 };
    this.amountDecimal = amount instanceof Decimal ? amount : new Decimal(amount, 4);
  }

  public getAmount(): string {
    return this.amountDecimal.toString(this.currencyConfig.decimalPlaces);
  }

  public getRawDecimal(): Decimal {
    return this.amountDecimal;
  }

  public getCurrencyCode(): string {
    return this.currencyConfig.code;
  }

  public getSymbol(): string {
    return this.currencyConfig.symbol;
  }

  public add(other: Money): Money {
    if (this.currencyConfig.code !== other.currencyConfig.code) {
      throw new Error(`CRITICAL MONETARY MIX-UP: Cannot add ${other.currencyConfig.code} to ${this.currencyConfig.code} directly without conversion.`);
    }
    return new Money(this.amountDecimal.add(other.amountDecimal), this.currencyConfig.code);
  }

  public sub(other: Money): Money {
    if (this.currencyConfig.code !== other.currencyConfig.code) {
      throw new Error(`CRITICAL MONETARY MIX-UP: Cannot subtract ${other.currencyConfig.code} from ${this.currencyConfig.code} directly without conversion.`);
    }
    return new Money(this.amountDecimal.sub(other.amountDecimal), this.currencyConfig.code);
  }

  public mul(factor: string | number): Money {
    return new Money(this.amountDecimal.mul(factor), this.currencyConfig.code);
  }

  public convert(exchangeRate: string | number, targetCurrencyCode: string): Money {
    const targetConfig = CURRENCY_REGISTRY[targetCurrencyCode.toUpperCase()] || { code: targetCurrencyCode.toUpperCase(), symbol: targetCurrencyCode.toUpperCase(), decimalPlaces: 2 };
    const convertedAmount = this.amountDecimal.mul(exchangeRate);
    return new Money(convertedAmount, targetConfig.code);
  }

  public format(locale: string = 'en-IN'): string {
    const amountStr = this.getAmount();
    try {
      const parsed = parseFloat(amountStr);
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: this.currencyConfig.code,
      }).format(parsed);
    } catch {
      return `${this.currencyConfig.symbol}${amountStr}`;
    }
  }
}
