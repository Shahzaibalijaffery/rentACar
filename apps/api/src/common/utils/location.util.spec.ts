import { DomainError } from '../errors/domain.error';
import {
  encodeGeohash,
  roundCoordinate,
  validateCoordinates,
  validateVehicleYear,
} from './location.util';

describe('location.util', () => {
  describe('validateCoordinates', () => {
    it('rounds coordinates to 3 decimal places', () => {
      const result = validateCoordinates(24.123456, 67.987654);
      expect(result.latitude).toBe(24.123);
      expect(result.longitude).toBe(67.988);
    });

    it('rejects invalid latitude', () => {
      expect(() => validateCoordinates(91, 0)).toThrow(DomainError);
    });

    it('rejects invalid longitude', () => {
      expect(() => validateCoordinates(0, 181)).toThrow(DomainError);
    });
  });

  describe('validateVehicleYear', () => {
    it('accepts valid years', () => {
      expect(validateVehicleYear(2020)).toBe(2020);
    });

    it('rejects non-integer years', () => {
      expect(() => validateVehicleYear(2020.5)).toThrow(DomainError);
    });

    it('rejects years outside allowed range', () => {
      expect(() => validateVehicleYear(1979)).toThrow(DomainError);
    });
  });

  describe('encodeGeohash', () => {
    it('returns a geohash string of requested precision', () => {
      const hash = encodeGeohash(24.86, 67.0, 7);
      expect(hash).toHaveLength(7);
      expect(hash).toMatch(/^[0-9bcdefghjkmnpqrstuvwxyz]+$/);
    });
  });

  describe('roundCoordinate', () => {
    it('rounds to specified precision', () => {
      expect(roundCoordinate(1.23456, 2)).toBe(1.23);
    });
  });
});
