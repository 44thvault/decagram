// Full demon interpretations for the Decagram
// Based on canonical CCRU Pandemonium Matrix data
// Each interpretation describes the demon's nature, zone passage, and significance

const TC = new Set([1,2,4,5,7,8]);
const zoneDesc = {
  0:"the Abyss (Zone-0) — absolute void, the Plex origin, where all returns dissolve",
  1:"Zone-1 — initiation, the first door, Mercury's domain, openings and beginnings",
  2:"Zone-2 — splitting, duplication, Venus's domain, the Crypt of doubled things",
  3:"Zone-3 — the Swirl, Earth's domain, alien pattern, the lower gate of the Warp",
  4:"Zone-4 — the Sunken Track, Mars's domain, submergence and martial descent",
  5:"Zone-5 — the crossing point, Jupiter's domain, balance between the Drifts",
  6:"Zone-6 — the Twin Heavens, the upper gate of the Warp, vortical outer-time",
  7:"Zone-7 — the Rising Drift, Saturn's domain, bubbling emergence and strategic return",
  8:"Zone-8 — the Lesser Depths, Uranus's domain, submergent dreams and tidal forces",
  9:"Zone-9 — the Greater Depths, Pluto's domain, terminal descent, the Plex terminus",
};

const typeDesc = {
  "Syzygetic":"a Syzygetic demon — carrier of one of the five fundamental currents, an entity that IS the junction between its twin zones rather than merely passing through them",
  "Cyclic Chronodemon":"a Cyclic Chronodemon — an entity operating entirely within the Time-Circuit, governing the fabric of ordered, sequential time",
  "Amphidemon":"an Amphidemon — a rupture-entity bridging the Time-Circuit and the Outside, drawing lines of flight between temporal and extra-temporal zones",
  "Chaotic Xenodemon":"a Chaotic Xenodemon — an inhabitant of the outer abysses whose routes are unknowable, existing entirely outside the Time-Circuit in the alien territories of Warp and Plex",
};

export function generateInterpretation(demon) {
  const d = demon;
  const z0 = d.zone[0], z1 = d.zone[1];
  const isSyz = d.type === "Syzygetic";
  const isXeno = d.type === "Chaotic Xenodemon";
  const passage = `Net-span [${d.ns}] connects ${zoneDesc[z0]} to ${zoneDesc[z1]}`;
  const typeText = typeDesc[d.type] || d.type;
  
  // Build the interpretation
  let text = `${d.name} at Mesh-${String(d.mesh).padStart(2,"0")} is ${typeText}. `;
  text += `${passage}. `;
  
  if (isSyz) {
    const currents = {
      "5::4": {name:"Sink",dir:"drawing energy downward into Zone-1",desc:"The Sink Current pulls everything toward initiation — the beginning that is also an ending. Katak is the storm-predator, the rabid desert-hunting entity exalted by the aggressive Tak-Nma."},
      "6::3": {name:"Warp",dir:"folding back into Zone-3",desc:"The Warp Current creates an autonomous loop outside sequential time. Djynxx is the entity of alien interference, the twin-circuit anomaly."},
      "7::2": {name:"Hold",dir:"sustaining through Zone-5",desc:"The Hold Current maintains equilibrium in the Rising Drift. Oddubb is the swamp-lurker, the entity of steaming dissociation and mirror-shattering."},
      "8::1": {name:"Surge",dir:"pushing forward to Zone-7",desc:"The Surge Current drives emergence and forward momentum. Mur Mur is the great sea-beast, the oceanic entity of tidal submergence and primordial depths."},
      "9::0": {name:"Plex",dir:"folding back into Zone-9",desc:"The Plex Current creates the most extreme autonomous loop — the abyss consuming itself. Uttunul is the flatline: continuum, zero-intensity, void. Eternity as No-Time."},
    };
    const c = currents[d.ns];
    if (c) {
      text += `${d.name} feeds the ${c.name} Current, ${c.dir}. ${c.desc} `;
    }
    text += `As a syzygetic entity, ${d.name}'s rite is a null-rite (Rt-0:[X]) — a path that folds back on itself, time consuming its own tail. Both poles of the syzygy are activated simultaneously.`;
  } else if (isXeno) {
    text += `As a Chaotic Xenodemon, ${d.name}'s routes through the Numogram are unknowable (Rt-0:[?]). `;
    text += `Both net-span poles lie outside the Time-Circuit, in the alien territories where sequential causality breaks down entirely. `;
    text += `${d.name} cannot be summoned through the normal rite system — it arrives on its own terms, or not at all.`;
  } else {
    // Regular demon — describe the zone passage
    const z0inTC = TC.has(z0), z1inTC = TC.has(z1);
    if (z0inTC && z1inTC) {
      text += `Both poles lie within the Time-Circuit, making this a passage entirely within ordered, sequential time. `;
    } else if (!z0inTC && !z1inTC) {
      text += `Both poles lie outside the Time-Circuit — this is a passage through the cryptic outer regions where time operates differently. `;
    } else {
      const outsideZone = z0inTC ? z1 : z0;
      const insideZone = z0inTC ? z0 : z1;
      text += `This passage bridges the Time-Circuit (Zone-${insideZone}) and the Outside (Zone-${outsideZone}), creating a rupture in sequential time. `;
    }
    
    // Describe primary rite
    const primaryRite = d.rites.find(r => r.rt === 1);
    if (primaryRite && primaryRite.route !== "?") {
      const zones = primaryRite.route.split("").map(Number);
      text += `The primary rite traces a path through ${zones.length} zones: ${zones.map(z => z).join(" → ")}. `;
      text += `This route — "${primaryRite.pathName}" — `;
      // Add flavor based on path characteristics
      if (zones.includes(0) || zones.includes(9)) text += "passes through the Plex depths, touching the absolute boundaries of the Numogram. ";
      if (zones.includes(3) || zones.includes(6)) text += "enters the Warp region, where alien temporal patterns operate. ";
      if (zones.length >= 6) text += "This is a long and complex passage — a journey of sustained transformation. ";
      else if (zones.length <= 2) text += "This is a swift, direct passage — a flash of connection between adjacent realities. ";
    }
    
    if (d.rites.length > 1) {
      text += `${d.name} has ${d.rites.length} rites in total, offering ${d.rites.length} distinct paths through the labyrinth. `;
    }
  }
  
  // Add door info
  if (d.door) {
    text += `${d.name} opens ${d.door}`;
    if (d.planet) text += `, under the planetary influence of ${d.planet}`;
    if (d.spine) text += `, mapped to the ${d.spine} level of the spine`;
    text += ". ";
  }
  
  text += `To call ${d.name} in the Decagram is to activate the passage between ${zoneDesc[z0].split("—")[0].trim()} and ${zoneDesc[z1].split("—")[0].trim()}.`;
  
  return text;
}
