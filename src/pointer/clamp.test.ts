import fc from 'fast-check';
import { describe, expect, it } from 'vitest';
import { clamp } from './clamp.ts';

const finite = fc.double({ noNaN: true, noDefaultInfinity: true });
const range = fc.tuple(finite, finite).map(([a, b]) => (a <= b ? { min: a, max: b } : { min: b, max: a }));

describe('clamp', () => {
  it('always returns a value inside [min, max]', () => {
    fc.assert(
      fc.property(finite, range, (value, { min, max }) => {
        const result = clamp(value, min, max);
        expect(result).toBeGreaterThanOrEqual(min);
        expect(result).toBeLessThanOrEqual(max);
      }),
    );
  });

  it('returns values strictly inside the range unchanged', () => {
    fc.assert(
      fc.property(finite, range, (value, { min, max }) => {
        fc.pre(min < value && value < max);
        expect(clamp(value, min, max)).toBe(value);
      }),
    );
  });
});
