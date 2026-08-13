// Ashtakoot Guna Milan — traditional 8-factor, 36-point Vedic compatibility system.
// Reference data below reflects the standard tables used across most Vedic software
// (Lahiri ayanamsa, whole-sign rashi/nakshatra indexing). Some sub-scores (Vashya, Yoni)
// use commonly published simplified matrices — sufficient for a product-facing estimate,
// but not a substitute for a pandit's manual review, especially where Nadi or Bhakoot
// dosha appears.

export const NAKSHATRA_NAMES = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta", "Shatabhisha",
  "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

export const RASHI_NAMES = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

const RASHI_LORD = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury",
  "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];

const RASHI_ELEMENT = ["Fire", "Earth", "Air", "Water", "Fire", "Earth",
  "Air", "Water", "Fire", "Earth", "Air", "Water"];

const VARNA_BY_ELEMENT = { Water: "Brahmin", Fire: "Kshatriya", Earth: "Vaishya", Air: "Shudra" };
const VARNA_RANK = { Brahmin: 4, Kshatriya: 3, Vaishya: 2, Shudra: 1 };

// Simplified vashya grouping (whole-sign; ignores half-sign splits used in some texts)
const VASHYA_GROUP = [
  "Chatushpada", "Chatushpada", "Manav", "Jalachar", "Vanachar", "Manav",
  "Manav", "Keet", "Manav", "Manav", "Manav", "Jalachar",
];

const VASHYA_SCORE = {
  Chatushpada: { Chatushpada: 2, Manav: 1, Jalachar: 1, Vanachar: 0.5, Keet: 0.5 },
  Manav: { Chatushpada: 1, Manav: 2, Jalachar: 1, Vanachar: 0.5, Keet: 0.5 },
  Jalachar: { Chatushpada: 1, Manav: 1, Jalachar: 2, Vanachar: 0.5, Keet: 0.5 },
  Vanachar: { Chatushpada: 0.5, Manav: 0.5, Jalachar: 0.5, Vanachar: 2, Keet: 0 },
  Keet: { Chatushpada: 0.5, Manav: 0.5, Jalachar: 0.5, Vanachar: 0, Keet: 2 },
};

const NAKSHATRA_GANA = [
  "Deva", "Manushya", "Rakshasa", "Manushya", "Deva", "Rakshasa",
  "Deva", "Deva", "Rakshasa", "Rakshasa", "Manushya", "Manushya",
  "Deva", "Rakshasa", "Deva", "Rakshasa", "Deva", "Rakshasa",
  "Rakshasa", "Manushya", "Manushya", "Deva", "Rakshasa", "Rakshasa",
  "Manushya", "Manushya", "Deva",
];

const GANA_SCORE = {
  Deva: { Deva: 6, Manushya: 5, Rakshasa: 1 },
  Manushya: { Deva: 5, Manushya: 6, Rakshasa: 3 },
  Rakshasa: { Deva: 1, Manushya: 3, Rakshasa: 6 },
};

const NAKSHATRA_YONI = [
  "Horse", "Elephant", "Sheep", "Serpent", "Serpent", "Dog",
  "Cat", "Sheep", "Cat", "Rat", "Rat", "Cow",
  "Buffalo", "Tiger", "Buffalo", "Tiger", "Deer", "Deer",
  "Dog", "Monkey", "Mongoose", "Monkey", "Lion", "Horse",
  "Lion", "Cow", "Elephant",
];

const YONI_ENEMIES = [
  ["Cow", "Tiger"], ["Buffalo", "Horse"], ["Dog", "Deer"],
  ["Serpent", "Mongoose"], ["Rat", "Cat"], ["Sheep", "Monkey"], ["Elephant", "Lion"],
];

const YONI_TYPE = {
  Dog: "predator", Cat: "predator", Tiger: "predator", Lion: "predator", Mongoose: "predator",
  Horse: "herbivore", Elephant: "herbivore", Sheep: "herbivore", Cow: "herbivore",
  Buffalo: "herbivore", Deer: "herbivore", Monkey: "herbivore", Rat: "herbivore",
  Serpent: "other",
};

const NAKSHATRA_NADI = [
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi",
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi",
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi",
  "Aadi", "Madhya", "Antya", "Antya", "Madhya", "Aadi",
  "Aadi", "Madhya", "Antya",
];

const PLANET_FRIENDSHIP = {
  Sun: { friends: ["Moon", "Mars", "Jupiter"], enemies: ["Venus", "Saturn"] },
  Moon: { friends: ["Sun", "Mercury"], enemies: [] },
  Mars: { friends: ["Sun", "Moon", "Jupiter"], enemies: ["Mercury"] },
  Mercury: { friends: ["Sun", "Venus"], enemies: ["Moon"] },
  Jupiter: { friends: ["Sun", "Moon", "Mars"], enemies: ["Mercury", "Venus"] },
  Venus: { friends: ["Mercury", "Saturn"], enemies: ["Sun", "Moon"] },
  Saturn: { friends: ["Mercury", "Venus"], enemies: ["Sun", "Moon", "Mars"] },
};

function relation(a, b) {
  if (a === b) return "same";
  if (PLANET_FRIENDSHIP[a].friends.includes(b)) return "friend";
  if (PLANET_FRIENDSHIP[a].enemies.includes(b)) return "enemy";
  return "neutral";
}

function grahaMaitriScore(lordA, lordB) {
  const ab = relation(lordA, lordB);
  const ba = relation(lordB, lordA);
  if (ab === "same") return 5;
  if (ab === "friend" && ba === "friend") return 4;
  if ((ab === "friend" && ba === "neutral") || (ab === "neutral" && ba === "friend")) return 3;
  if (ab === "neutral" && ba === "neutral") return 2.5;
  if ((ab === "friend" && ba === "enemy") || (ab === "enemy" && ba === "friend")) return 1;
  if ((ab === "neutral" && ba === "enemy") || (ab === "enemy" && ba === "neutral")) return 0.5;
  return 0;
}

function taraScore(nakA, nakB) {
  // nakA/nakB are 0-indexed (0-26); classical counting is 1-indexed inclusive.
  const forward = (((nakB - nakA + 27) % 27) + 1);
  const backward = (((nakA - nakB + 27) % 27) + 1);

  const classify = (count) => {
    const r = ((count - 1) % 9) + 1; // 1..9
    if (r === 1) return 0.75; // Janma — cautious, partial credit
    if ([3, 5, 7].includes(r)) return 0; // Vipat, Pratyak, Vadha — inauspicious
    return 1.5; // Sampat, Kshema, Sadhak, Mitra, Parama Mitra
  };

  return classify(forward) + classify(backward);
}

function yoniScore(yoniA, yoniB) {
  if (yoniA === yoniB) return 4;
  const isEnemy = YONI_ENEMIES.some(
    ([x, y]) => (x === yoniA && y === yoniB) || (x === yoniB && y === yoniA)
  );
  if (isEnemy) return 0;
  if (YONI_TYPE[yoniA] === YONI_TYPE[yoniB]) return 3;
  return 2;
}

function bhakootScore(rashiA, rashiB) {
  const diff = (((rashiB - rashiA) % 12) + 12) % 12; // 0..11, houses from A to B
  const distance = diff + 1; // 1..12 counting inclusive
  const doshaDistances = [2, 12, 5, 9, 6, 8];
  const isDosha = doshaDistances.includes(distance);
  return { score: isDosha ? 0 : 7, dosha: isDosha };
}

/**
 * Compute Ashtakoot Guna Milan between two people, given each person's
 * sidereal Moon longitude (0-360).
 */
export function gunaMilan({ boyMoonLongitude, girlMoonLongitude }) {
  const rashiA = Math.floor(((boyMoonLongitude % 360) + 360) % 360 / 30);
  const rashiB = Math.floor(((girlMoonLongitude % 360) + 360) % 360 / 30);

  const nakSize = 360 / 27;
  const nakA = Math.min(Math.floor(((boyMoonLongitude % 360) + 360) % 360 / nakSize), 26);
  const nakB = Math.min(Math.floor(((girlMoonLongitude % 360) + 360) % 360 / nakSize), 26);

  // 1. Varna (1 point)
  const varnaA = VARNA_BY_ELEMENT[RASHI_ELEMENT[rashiA]];
  const varnaB = VARNA_BY_ELEMENT[RASHI_ELEMENT[rashiB]];
  const varna = VARNA_RANK[varnaA] >= VARNA_RANK[varnaB] ? 1 : 0;

  // 2. Vashya (2 points)
  const vashyaGroupA = VASHYA_GROUP[rashiA];
  const vashyaGroupB = VASHYA_GROUP[rashiB];
  const vashya = VASHYA_SCORE[vashyaGroupA][vashyaGroupB];

  // 3. Tara (3 points)
  const tara = taraScore(nakA, nakB);

  // 4. Yoni (4 points)
  const yoni = yoniScore(NAKSHATRA_YONI[nakA], NAKSHATRA_YONI[nakB]);

  // 5. Graha Maitri (5 points)
  const grahaMaitri = grahaMaitriScore(RASHI_LORD[rashiA], RASHI_LORD[rashiB]);

  // 6. Gana (6 points)
  const gana = GANA_SCORE[NAKSHATRA_GANA[nakA]][NAKSHATRA_GANA[nakB]];

  // 7. Bhakoot (7 points)
  const { score: bhakoot, dosha: bhakootDosha } = bhakootScore(rashiA, rashiB);

  // 8. Nadi (8 points)
  const nadiA = NAKSHATRA_NADI[nakA];
  const nadiB = NAKSHATRA_NADI[nakB];
  const nadiDosha = nadiA === nadiB;
  const nadi = nadiDosha ? 0 : 8;

  const total = varna + vashya + tara + yoni + grahaMaitri + gana + bhakoot + nadi;

  const verdict =
    total >= 32 ? "Excellent match"
    : total >= 24 ? "Good match"
    : total >= 18 ? "Average match — consider carefully"
    : "Not recommended without further review";

  return {
    kootas: [
      { name: "Varna", max: 1, score: varna, description: "Spiritual compatibility / ego alignment" },
      { name: "Vashya", max: 2, score: vashya, description: "Mutual attraction and control in the relationship" },
      { name: "Tara", max: 3, score: tara, description: "Health and general well-being of the couple" },
      { name: "Yoni", max: 4, score: yoni, description: "Physical and sexual compatibility" },
      { name: "Graha Maitri", max: 5, score: grahaMaitri, description: "Mental compatibility and intellectual rapport" },
      { name: "Gana", max: 6, score: gana, description: "Temperament and nature compatibility" },
      { name: "Bhakoot", max: 7, score: bhakoot, description: "Love, family growth, and prosperity", dosha: bhakootDosha },
      { name: "Nadi", max: 8, score: nadi, description: "Health of progeny and genetic compatibility", dosha: nadiDosha },
    ],
    total: Math.round(total * 100) / 100,
    maxTotal: 36,
    verdict,
    doshas: {
      nadi: nadiDosha,
      bhakoot: bhakootDosha,
    },
    boy: {
      rashi: RASHI_NAMES[rashiA],
      nakshatra: NAKSHATRA_NAMES[nakA],
    },
    girl: {
      rashi: RASHI_NAMES[rashiB],
      nakshatra: NAKSHATRA_NAMES[nakB],
    },
  };
}