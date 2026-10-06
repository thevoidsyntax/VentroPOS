import { describe, it, expect } from 'vitest';
import { cn, formatCurrency, formatNumber, formatDate, formatTime, formatDateTime, getInitials } from '@/lib/utils';

describe('cn (className merger)', () => {
  it('merges class names', () => {
    const result = cn('foo', 'bar');
    expect(result).toBe('foo bar');
  });

  it('handles conditional classes', () => {
    const result = cn('foo', false && 'bar', 'baz');
    expect(result).toBe('foo baz');
  });

  it('handles undefined values', () => {
    const result = cn('foo', undefined, 'bar');
    expect(result).toBe('foo bar');
  });
});

describe('formatCurrency', () => {
  it('formats number as Indonesian Rupiah', () => {
    expect(formatCurrency(15000)).toBe('Rp 15.000');
    expect(formatCurrency(100000)).toBe('Rp 100.000');
    expect(formatCurrency(1234567)).toBe('Rp 1.234.567');
  });

  it('handles zero', () => {
    expect(formatCurrency(0)).toBe('Rp 0');
  });

  it('handles decimal values', () => {
    expect(formatCurrency(15000.5)).toBe('Rp 15.001');
  });
});

describe('formatNumber', () => {
  it('formats numbers with thousand separators', () => {
    expect(formatNumber(1000)).toBe('1.000');
    expect(formatNumber(1234567)).toBe('1.234.567');
  });

  it('handles zero', () => {
    expect(formatNumber(0)).toBe('0');
  });
});

describe('formatDate', () => {
  it('formats date in Indonesian format', () => {
    const date = '2024-01-15';
    const result = formatDate(date);
    expect(result).toContain('15');
    expect(result).toContain('Jan');
    expect(result).toContain('2024');
  });
});

describe('formatTime', () => {
  it('formats time in Indonesian format', () => {
    const date = '2024-01-15T14:30:00';
    const result = formatTime(date);
    expect(result).toContain('14');
    expect(result).toContain('30');
  });
});

describe('formatDateTime', () => {
  it('formats date and time', () => {
    const date = '2024-01-15T14:30:00';
    const result = formatDateTime(date);
    expect(result).toContain('15');
    expect(result).toContain('Jan');
    expect(result).toContain('14');
    expect(result).toContain('30');
  });
});

describe('getInitials', () => {
  it('returns initials from name', () => {
    expect(getInitials('John Doe')).toBe('JD');
    expect(getInitials('Alice')).toBe('A');
    expect(getInitials('John Paul Smith')).toBe('JP');
  });

  it('handles lowercase names', () => {
    expect(getInitials('john doe')).toBe('JD');
  });

  it('handles empty string', () => {
    expect(getInitials('')).toBe('');
  });

  it('limits to 2 characters', () => {
    expect(getInitials('John Doe Smith')).toBe('JD');
  });
});
