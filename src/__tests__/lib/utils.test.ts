import {
  formatId,
  resetIdCounter,
  formatOrderNumber,
  formatProductId,
  formatCategoryId,
} from '../../lib/utils';

beforeEach(() => {
  resetIdCounter();
});

describe('formatId', () => {
  it('assigns sequential numbers starting at 1', () => {
    expect(formatId('aaa')).toBe(1);
    expect(formatId('bbb')).toBe(2);
    expect(formatId('ccc')).toBe(3);
  });

  it('returns the same number for the same id', () => {
    const first = formatId('xyz');
    const second = formatId('xyz');
    expect(first).toBe(second);
  });

  it('handles empty string as a valid id', () => {
    expect(formatId('')).toBe(1);
  });
});

describe('resetIdCounter', () => {
  it('resets the counter so next id starts at 1 again', () => {
    formatId('a');
    formatId('b');
    expect(formatId('c')).toBe(3);

    resetIdCounter();

    expect(formatId('d')).toBe(1);
  });

  it('forgets previously mapped ids after reset', () => {
    formatId('a');
    expect(formatId('a')).toBe(1);

    resetIdCounter();

    // 'a' should get a fresh number
    expect(formatId('a')).toBe(1);
    expect(formatId('b')).toBe(2);
  });
});

describe('formatOrderNumber', () => {
  it('returns formatted order string', () => {
    expect(formatOrderNumber('order-abc')).toBe('Sifariş #1');
    expect(formatOrderNumber('order-def')).toBe('Sifariş #2');
  });

  it('returns same formatted string for same order id', () => {
    const first = formatOrderNumber('order-abc');
    const second = formatOrderNumber('order-abc');
    expect(first).toBe(second);
  });
});

describe('formatProductId', () => {
  it('returns formatted product string', () => {
    expect(formatProductId('prod-1')).toBe('Məhsul #1');
    expect(formatProductId('prod-2')).toBe('Məhsul #2');
  });
});

describe('formatCategoryId', () => {
  it('returns formatted category string', () => {
    expect(formatCategoryId('cat-1')).toBe('Kateqoriya #1');
    expect(formatCategoryId('cat-2')).toBe('Kateqoriya #2');
  });
});

describe('shared counter across formatters', () => {
  it('shares the same counter across formatOrderNumber, formatProductId, formatCategoryId', () => {
    expect(formatOrderNumber('a')).toBe('Sifariş #1');
    expect(formatProductId('b')).toBe('Məhsul #2');
    expect(formatCategoryId('c')).toBe('Kateqoriya #3');
  });
});
