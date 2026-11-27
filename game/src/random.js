// A tiny seeded random generator (mulberry32) so a run, a replay and a
// screenshot staged from the same seed always play out the same way.

export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Pick one entry from a weighted table: [[weight, value], ...]. */
export function pickWeighted(rng, table) {
  let total = 0;
  for (const [weight] of table) total += weight;
  let roll = rng() * total;
  for (const [weight, value] of table) {
    roll -= weight;
    if (roll <= 0) return value;
  }
  return table[table.length - 1][1];
}
