/**
 * Bill Vyom — Exact Fixed-Point Decimal Arithmetic Utility
 * Strictly enforces non-floating-point monetary calculations.
 * All monetary amounts are stored as exact string representations.
 */

export class Decimal {
  private valueBigInt: bigint;
  private decimals: number;

  constructor(value: string | number | bigint | Decimal, decimals: number = 4) {
    this.decimals = decimals;
    if (value instanceof Decimal) {
      if (value.decimals === decimals) {
        this.valueBigInt = value.valueBigInt;
      } else {
        this.valueBigInt = Decimal.parseToBigInt(value.toString(decimals), decimals);
      }
    } else if (typeof value === 'bigint') {
      this.valueBigInt = value;
    } else {
      const strVal = typeof value === 'number' ? value.toFixed(decimals) : String(value).trim();
      this.valueBigInt = Decimal.parseToBigInt(strVal, this.decimals);
    }
  }

  private toSameDecimals(other: Decimal | string | number): Decimal {
    if (other instanceof Decimal) {
      if (other.decimals === this.decimals) return other;
      return new Decimal(other.toString(this.decimals), this.decimals);
    }
    return new Decimal(other, this.decimals);
  }

  private static parseToBigInt(valStr: string, decimals: number): bigint {
    if (!valStr || valStr === '' || valStr === 'NaN') return 0n;
    const isNegative = valStr.startsWith('-');
    const cleanStr = isNegative ? valStr.slice(1) : valStr;

    const parts = cleanStr.split('.');
    let integerPart = parts[0] || '0';
    let fractionPart = parts[1] || '';

    if (fractionPart.length < decimals) {
      fractionPart = fractionPart.padEnd(decimals, '0');
    } else if (fractionPart.length > decimals) {
      fractionPart = fractionPart.slice(0, decimals);
    }

    const combinedStr = integerPart + fractionPart;
    const bigintVal = BigInt(combinedStr || '0');
    return isNegative ? -bigintVal : bigintVal;
  }

  public add(other: Decimal | string | number): Decimal {
    const o = this.toSameDecimals(other);
    return new Decimal(this.valueBigInt + o.valueBigInt, this.decimals);
  }

  public sub(other: Decimal | string | number): Decimal {
    const o = this.toSameDecimals(other);
    return new Decimal(this.valueBigInt - o.valueBigInt, this.decimals);
  }

  public mul(factorStr: string | number | Decimal): Decimal {
    // Exact multiplication by exchange rate or quantity string
    const factor = this.toSameDecimals(factorStr);
    const rawProd = this.valueBigInt * factor.valueBigInt;
    const scale = BigInt(10 ** this.decimals);
    // Round half up
    const half = scale / 2n;
    const adjusted = rawProd >= 0n ? (rawProd + half) / scale : (rawProd - half) / scale;
    return new Decimal(adjusted, this.decimals);
  }

  public div(divisorStr: string | number | Decimal): Decimal {
    const divisor = this.toSameDecimals(divisorStr);
    if (divisor.valueBigInt === 0n) {
      throw new Error('Division by zero in Decimal calculation.');
    }
    const scale = BigInt(10 ** this.decimals);
    const scaledNumerator = this.valueBigInt * scale;
    const half = divisor.valueBigInt > 0n ? divisor.valueBigInt / 2n : -divisor.valueBigInt / 2n;
    const quotient = (scaledNumerator + half) / divisor.valueBigInt;
    return new Decimal(quotient, this.decimals);
  }

  public toNumber(): number {
    return parseFloat(this.toString(this.decimals));
  }

  public isZero(): boolean {
    return this.valueBigInt === 0n;
  }

  public isPositive(): boolean {
    return this.valueBigInt > 0n;
  }

  public isNegative(): boolean {
    return this.valueBigInt < 0n;
  }

  public equals(other: Decimal | string | number): boolean {
    const o = this.toSameDecimals(other);
    return this.valueBigInt === o.valueBigInt;
  }

  public greaterThan(other: Decimal | string | number): boolean {
    const o = this.toSameDecimals(other);
    return this.valueBigInt > o.valueBigInt;
  }

  public gt(other: Decimal | string | number): boolean {
    return this.greaterThan(other);
  }

  public greaterThanOrEqual(other: Decimal | string | number): boolean {
    const o = this.toSameDecimals(other);
    return this.valueBigInt >= o.valueBigInt;
  }

  public gte(other: Decimal | string | number): boolean {
    return this.greaterThanOrEqual(other);
  }

  public lessThan(other: Decimal | string | number): boolean {
    const o = this.toSameDecimals(other);
    return this.valueBigInt < o.valueBigInt;
  }

  public lt(other: Decimal | string | number): boolean {
    return this.lessThan(other);
  }

  public lessThanOrEqual(other: Decimal | string | number): boolean {
    const o = this.toSameDecimals(other);
    return this.valueBigInt <= o.valueBigInt;
  }

  public lte(other: Decimal | string | number): boolean {
    return this.lessThanOrEqual(other);
  }

  public abs(): Decimal {
    return new Decimal(this.valueBigInt < 0n ? -this.valueBigInt : this.valueBigInt, this.decimals);
  }

  public negate(): Decimal {
    return new Decimal(-this.valueBigInt, this.decimals);
  }

  public toString(displayDecimals: number = 2): string {
    const isNegative = this.valueBigInt < 0n;
    const absVal = isNegative ? -this.valueBigInt : this.valueBigInt;
    const scale = BigInt(10 ** this.decimals);

    let intPart = (absVal / scale).toString();
    let fracPart = (absVal % scale).toString().padStart(this.decimals, '0');

    if (displayDecimals < this.decimals) {
      // Round to displayDecimals
      const diff = this.decimals - displayDecimals;
      const roundScale = BigInt(10 ** diff);
      const half = roundScale / 2n;
      const roundedAbs = (absVal + half) / roundScale;
      const displayScale = BigInt(10 ** displayDecimals);
      
      intPart = (roundedAbs / displayScale).toString();
      fracPart = (roundedAbs % displayScale).toString().padStart(displayDecimals, '0');
    } else if (displayDecimals > this.decimals) {
      fracPart = fracPart.padEnd(displayDecimals, '0');
    }

    const formatted = displayDecimals > 0 ? `${intPart}.${fracPart}` : intPart;
    return isNegative ? `-${formatted}` : formatted;
  }

  public round(displayDecimals: number = 2): Decimal {
    return new Decimal(this.toString(displayDecimals), displayDecimals);
  }

  public toFixed(decimals: number = 2): string {
    return this.toString(decimals);
  }

  public static zero(decimals: number = 4): Decimal {
    return new Decimal(0n, decimals);
  }

  public static fromString(val: string, decimals: number = 4): Decimal {
    return new Decimal(val, decimals);
  }

  public static from(val: string | number | bigint | Decimal, decimals: number = 4): Decimal {
    return new Decimal(val, decimals);
  }
}

/**
 * Validates that debit and credit amounts in a transaction balance exactly.
 */
export function validateBalancedJournal(
  lines: Array<{ debit: string; credit: string; exchange_rate?: string }>,
  baseCurrencyDecimals: number = 2
): { isBalanced: boolean; totalDebit: string; totalCredit: string; difference: string } {
  let totalDebit = Decimal.zero(4);
  let totalCredit = Decimal.zero(4);

  for (const line of lines) {
    const rate = line.exchange_rate ? line.exchange_rate : '1.0000';
    const rawDebit = new Decimal(line.debit || '0', 4);
    const rawCredit = new Decimal(line.credit || '0', 4);

    const baseDebit = rawDebit.mul(rate);
    const baseCredit = rawCredit.mul(rate);

    totalDebit = totalDebit.add(baseDebit);
    totalCredit = totalCredit.add(baseCredit);
  }

  const difference = totalDebit.sub(totalCredit);
  const isBalanced = difference.isZero();

  return {
    isBalanced,
    totalDebit: totalDebit.toString(baseCurrencyDecimals),
    totalCredit: totalCredit.toString(baseCurrencyDecimals),
    difference: difference.toString(baseCurrencyDecimals),
  };
}
