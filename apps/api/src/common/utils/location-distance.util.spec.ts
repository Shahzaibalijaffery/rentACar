import {
  formatDistanceLabel,
  kmToMeters,
  resolveSearchRadiusKm,
  validateSearchRadiusKm,
} from './location.util';
import { DomainError } from '../errors/domain.error';

describe('location.util distance helpers', () => {
  it('formats sub-kilometer distances in meters', () => {
    expect(formatDistanceLabel(800)).toBe('800 m away');
  });

  it('formats kilometer distances with one decimal under 10 km', () => {
    expect(formatDistanceLabel(2400)).toBe('2.4 km away');
  });

  it('formats longer distances as whole kilometers', () => {
    expect(formatDistanceLabel(12000)).toBe('12 km away');
  });

  it('converts km to meters', () => {
    expect(kmToMeters(2.5)).toBe(2500);
  });

  it('uses default radius when omitted', () => {
    expect(resolveSearchRadiusKm()).toBe(10);
  });

  it('rejects invalid radius values', () => {
    expect(() => validateSearchRadiusKm(0)).toThrow(DomainError);
    expect(() => validateSearchRadiusKm(200)).toThrow(DomainError);
  });
});
