/**
 * Deterministic, seedable PRNG so the dashboard renders the same
 * "realistic" numbers on the server and on every reload.
 *
 * Mulberry32 - tiny and good enough for fixture data.
 */
export function rng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type RNG = () => number;

export function pick<T>(r: RNG, items: readonly T[]): T {
  return items[Math.floor(r() * items.length)];
}

export function range(r: RNG, min: number, max: number): number {
  return min + r() * (max - min);
}

export function intRange(r: RNG, min: number, max: number): number {
  return Math.floor(range(r, min, max + 1));
}
