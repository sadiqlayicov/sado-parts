import { countries } from '../../data/countries';
import type { Country } from '../../data/countries';

describe('countries data', () => {
  it('is a non-empty array', () => {
    expect(Array.isArray(countries)).toBe(true);
    expect(countries.length).toBeGreaterThan(0);
  });

  it('every entry has code, name, and cities', () => {
    countries.forEach((country: Country) => {
      expect(typeof country.code).toBe('string');
      expect(country.code.length).toBeGreaterThan(0);

      expect(typeof country.name).toBe('string');
      expect(country.name.length).toBeGreaterThan(0);

      expect(Array.isArray(country.cities)).toBe(true);
      expect(country.cities.length).toBeGreaterThan(0);
    });
  });

  it('country codes are unique', () => {
    const codes = countries.map((c) => c.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('all city entries are non-empty strings', () => {
    countries.forEach((country) => {
      country.cities.forEach((city) => {
        expect(typeof city).toBe('string');
        expect(city.length).toBeGreaterThan(0);
      });
    });
  });

  it('includes expected countries', () => {
    const codes = countries.map((c) => c.code);
    expect(codes).toContain('RU');
    expect(codes).toContain('AZ');
    expect(codes).toContain('TR');
    expect(codes).toContain('US');
    expect(codes).toContain('DE');
  });
});
