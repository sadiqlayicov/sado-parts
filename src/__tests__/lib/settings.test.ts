import { getDefaultSettings, clearSettingsCache } from '../../lib/settings';

describe('getDefaultSettings', () => {
  it('returns an object with expected keys', () => {
    const defaults = getDefaultSettings();
    expect(defaults).toHaveProperty('siteName', 'Sado-Parts');
    expect(defaults).toHaveProperty('companyName');
    expect(defaults).toHaveProperty('inn');
    expect(defaults).toHaveProperty('kpp');
    expect(defaults).toHaveProperty('bik');
    expect(defaults).toHaveProperty('accountNumber');
    expect(defaults).toHaveProperty('bankName');
    expect(defaults).toHaveProperty('bankBik');
    expect(defaults).toHaveProperty('bankAccountNumber');
    expect(defaults).toHaveProperty('directorName');
    expect(defaults).toHaveProperty('accountantName');
  });

  it('returns consistent values across calls', () => {
    const a = getDefaultSettings();
    const b = getDefaultSettings();
    expect(a).toEqual(b);
  });

  it('all values are non-empty strings', () => {
    const defaults = getDefaultSettings();
    for (const [key, value] of Object.entries(defaults)) {
      expect(typeof value).toBe('string');
      expect((value as string).length).toBeGreaterThan(0);
    }
  });
});

describe('clearSettingsCache', () => {
  it('runs without throwing', () => {
    expect(() => clearSettingsCache()).not.toThrow();
  });
});
