// Numogram — Zone mapping, syzygies, currents, and the Decagram mapping algorithm
// Source: CCRU Decimal Labyrinth (ccru.net/declab.htm)

// The 5 syzygies (9-sum twinning)
export const SYZYGIES = [
  { pair: [9, 0], name: "Uttunul", current: "Plex", tractor: 9, diff: 9, region: "Plex" },
  { pair: [8, 1], name: "Mur Mur", current: "Surge", tractor: 7, diff: 7, region: "Time-Circuit" },
  { pair: [7, 2], name: "Oddubb", current: "Hold", tractor: 5, diff: 5, region: "Time-Circuit" },
  { pair: [6, 3], name: "Djynxx", current: "Warp", tractor: 3, diff: 3, region: "Warp" },
  { pair: [5, 4], name: "Katak", current: "Sink", tractor: 1, diff: 1, region: "Time-Circuit" },
];

// Zone properties
export const ZONES = {
  0: { region: "Plex", desc: "The Abyss. Zero-zone. Absolute void and return." },
  1: { region: "Time-Circuit", desc: "Initiation. The first door. Mercury. Openings." },
  2: { region: "Time-Circuit", desc: "Splitting. Duplication. Venus. The Crypt." },
  3: { region: "Warp", desc: "The Swirl. Alien pattern. Earth. Outer-time." },
  4: { region: "Time-Circuit", desc: "The Sink. Submergence. Sunken Track." },
  5: { region: "Time-Circuit", desc: "Crossing. Balance point. The Falling Drift." },
  6: { region: "Warp", desc: "Twin Heavens. Vortical zone. Outer-time." },
  7: { region: "Time-Circuit", desc: "The Rising Drift. Bubbling. Emergence." },
  8: { region: "Time-Circuit", desc: "The Lesser Depths. Submergence. Dreams." },
  9: { region: "Plex", desc: "Terminal. The Greater Depths. Ultimate descent." },
};

// Time-Circuit zones (what the I Ching hexagram maps to)
export const TIME_CIRCUIT = new Set([1, 2, 4, 5, 7, 8]);
// Warp/Plex zones (what the THC tetragram maps to)
export const OUTER_ZONES = new Set([0, 3, 6, 9]);

// The binodigital 6-cycle: digital reduction of binary powers
// 2^0=1, 2^1=2, 2^2=4, 2^3=8, 2^4=16→7, 2^5=32→5, then cycles
// These map to hexagram lines (bottom-up) and time-circuit zones
export const BINODIGITAL_CYCLE = [1, 2, 4, 8, 7, 5];

// Hexagram line-pairs map to syzygies via 9-twinning:
// Lines 1&6 (values 1,5) → zones 1,5 → no direct syzygy but Sink current (5::4→1)
// Lines 2&5 (values 2,7) → syzygy 7:2 (Oddubb)
// Lines 3&4 (values 4,8) → syzygy 8:1... wait.
// Actually per CCRU: "9-twinning of reduced values: 8:1, 7:2, 5:4, mapping the hexagram line pairs"
// Line pairs by position: (1,6), (2,5), (3,4) 
// Binodigital values: (1,5), (2,7), (4,8)
// 9-twins: 1↔8, 2↔7, 4↔5
// So line-pair (1,6) with values (1,5) activates syzygy 4:5 (Katak) via value 5↔4
// Line-pair (2,5) with values (2,7) activates syzygy 7:2 (Oddubb) directly
// Line-pair (3,4) with values (4,8) activates syzygy 8:1 (Mur Mur) via value 4↔... 
// Hmm. Let me re-read: the values ARE the zones. Line 1 = zone 1, line 2 = zone 2, etc.
// The 6-cycle values 1,2,4,8,7,5 map to zones 1,2,4,8,7,5
// Syzygies among these: 8:1 (sum 9), 7:2 (sum 9), 5:4 (sum 9) — all three time-circuit syzygies

export const HEXAGRAM_LINE_ZONES = [1, 2, 4, 8, 7, 5]; // line 1→zone 1, line 2→zone 2, etc.
export const LINE_PAIR_SYZYGIES = [
  { lines: [0, 5], zones: [1, 5], syzygy: "Katak (5::4)", syzDemon: 14 },   // but 1+5≠9... 
  // Actually the pairing is by 9-twinning of the VALUES:
  // 8↔1 (sum 9), 7↔2 (sum 9), 5↔4 (sum 9)
  // Line with value 1 pairs with line with value 8: that's line-1 (val 1) + line-4 (val 8) → syzygy 8:1
  // Line with value 2 pairs with line with value 7: that's line-2 (val 2) + line-5 (val 7) → syzygy 7:2
  // Line with value 4 pairs with line with value 5: that's line-3 (val 4) + line-6 (val 5) → syzygy 5:4
  { lines: [0, 3], zones: [1, 8], syzygy: "Mur Mur (8::1)", syzIdx: 1 },
  { lines: [1, 4], zones: [2, 7], syzygy: "Oddubb (7::2)", syzIdx: 2 },
  { lines: [2, 5], zones: [4, 5], syzygy: "Katak (5::4)", syzIdx: 4 },
];

// Map THC tetragram to Warp/Plex zones
// The THC accesses zones 0, 3, 6, 9 — the triadic residue
// 4 tetragram lines map to 4 outer zones
// Line 1 (top) → Zone 9 (terminal, Greater Depths)
// Line 2 → Zone 6 (Twin Heavens, upper Warp)  
// Line 3 → Zone 3 (The Swirl, lower Warp)
// Line 4 (bottom) → Zone 0 (The Abyss, Plex)
export const TETRAGRAM_LINE_ZONES = [9, 6, 3, 0];

// Determine which zones are activated by a cast
export function mapDecagram(hexLines, tetLines) {
  const zoneIntensity = {};
  for (let z = 0; z <= 9; z++) zoneIntensity[z] = 0;
  
  // HEXAGRAM → TIME-CIRCUIT ZONES
  // The binodigital 6-cycle maps each line position to a zone
  // Changing lines = maximum intensity (the zone is in active transformation)
  // Yang lines = strong activation (zone is energized)
  // Yin lines = weak/receptive (zone is present but passive)
  // The LINE VALUE also matters: a changing yang (old yang, 9) is stronger than changing yin (old yin, 6)
  hexLines.forEach((line, i) => {
    const zone = HEXAGRAM_LINE_ZONES[i];
    if (line.changing && line.yang) zoneIntensity[zone] = 4;       // Old Yang (9) = maximum — yang transforming
    else if (line.changing && !line.yang) zoneIntensity[zone] = 3; // Old Yin (6) = strong — yin transforming
    else if (line.yang) zoneIntensity[zone] = 2;                   // Young Yang (7) = moderate — stable yang
    else zoneIntensity[zone] = 1;                                   // Young Yin (8) = low — stable yin
  });
  
  // TETRAGRAM → WARP/PLEX ZONES
  // Heaven (solid) = maximum intensity (the zone is fully activated by creative force)
  // Earth (once-broken) = moderate (zone is present, grounded)
  // Man (twice-broken) = low (zone is fragmented, diffuse)
  // The mapping: line 1 (top) → Zone 9, line 2 → Zone 6, line 3 → Zone 3, line 4 (bottom) → Zone 0
  tetLines.forEach((line, i) => {
    const zone = TETRAGRAM_LINE_ZONES[i];
    if (line.value === 0) zoneIntensity[zone] = 4;     // Heaven = maximum
    else if (line.value === 1) zoneIntensity[zone] = 2; // Earth = moderate
    else zoneIntensity[zone] = 1;                        // Man = low
  });
  
  // Build active zone set (intensity >= 2 = meaningfully active)
  const activeZones = new Set();
  for (let z = 0; z <= 9; z++) {
    if (zoneIntensity[z] >= 2) activeZones.add(z);
  }
  
  // Identify active syzygies (both zones meaningfully active)
  const activeSyzygies = SYZYGIES.filter(s => 
    zoneIntensity[s.pair[0]] >= 2 && zoneIntensity[s.pair[1]] >= 2
  );
  
  // Rank zones by intensity
  const hotZones = Object.entries(zoneIntensity)
    .map(([k, v]) => ({ zone: parseInt(k), intensity: v, region: ZONES[parseInt(k)].region }))
    .sort((a, b) => b.intensity - a.intensity);
  
  // Determine dominant time-system
  const tcIntensity = [1,2,4,5,7,8].reduce((s, z) => s + zoneIntensity[z], 0);
  const warpIntensity = zoneIntensity[3] + zoneIntensity[6];
  const plexIntensity = zoneIntensity[0] + zoneIntensity[9];
  const dominantSystem = tcIntensity >= warpIntensity + plexIntensity ? "Time-Circuit" 
    : warpIntensity > plexIntensity ? "Warp" : "Plex";
  
  // Check for cross-system resonance (when both TC and Outer zones are strongly active)
  const crossResonance = tcIntensity >= 8 && (warpIntensity >= 4 || plexIntensity >= 4);
  
  return { activeZones, zoneIntensity, activeSyzygies, hotZones, dominantSystem, crossResonance, tcIntensity, warpIntensity, plexIntensity };
}
