import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import geoTz from "geo-tz";
import fs from "node:fs";
import path from "node:path";
import { load, Constants } from "@fusionstrings/swisseph-wasi";

export const runtime = "nodejs";

let ephPromise = null;
function getEph() {
  if (!ephPromise) {
    const wasmPath = path.join(process.cwd(), "src/wasm/libswephe.wasm");
    const wasmBytes = fs.readFileSync(wasmPath);
    ephPromise = load({ wasmSource: new Uint8Array(wasmBytes) }).then((eph) => {
      eph.swe_set_sid_mode(Constants.SE_SIDM_LAHIRI, 0, 0);
      return eph;
    });
  }
  return ephPromise;
}
const VALID_GENDERS = ["MALE", "FEMALE", "OTHER"];

const NAKSHATRAS = [
  { name: "Ashwini", lord: "Ketu", deity: "Ashwini Kumaras" },
  { name: "Bharani", lord: "Venus", deity: "Yama" },
  { name: "Krittika", lord: "Sun", deity: "Agni" },
  { name: "Rohini", lord: "Moon", deity: "Brahma" },
  { name: "Mrigashira", lord: "Mars", deity: "Soma" },
  { name: "Ardra", lord: "Rahu", deity: "Rudra" },
  { name: "Punarvasu", lord: "Jupiter", deity: "Aditi" },
  { name: "Pushya", lord: "Saturn", deity: "Brihaspati" },
  { name: "Ashlesha", lord: "Mercury", deity: "Nagas" },
  { name: "Magha", lord: "Ketu", deity: "Pitris" },
  { name: "Purva Phalguni", lord: "Venus", deity: "Bhaga" },
  { name: "Uttara Phalguni", lord: "Sun", deity: "Aryaman" },
  { name: "Hasta", lord: "Moon", deity: "Savitar" },
  { name: "Chitra", lord: "Mars", deity: "Tvashtar" },
  { name: "Swati", lord: "Rahu", deity: "Vayu" },
  { name: "Vishakha", lord: "Jupiter", deity: "Indra-Agni" },
  { name: "Anuradha", lord: "Saturn", deity: "Mitra" },
  { name: "Jyeshtha", lord: "Mercury", deity: "Indra" },
  { name: "Mula", lord: "Ketu", deity: "Nirriti" },
  { name: "Purva Ashadha", lord: "Venus", deity: "Apas" },
  { name: "Uttara Ashadha", lord: "Sun", deity: "Vishve Devah" },
  { name: "Shravana", lord: "Moon", deity: "Vishnu" },
  { name: "Dhanishta", lord: "Mars", deity: "Vasus" },
  { name: "Shatabhisha", lord: "Rahu", deity: "Varuna" },
  { name: "Purva Bhadrapada", lord: "Jupiter", deity: "Aja Ekapada" },
  { name: "Uttara Bhadrapada", lord: "Saturn", deity: "Ahir Budhnya" },
  { name: "Revati", lord: "Mercury", deity: "Pushan" },
];

const SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];

// index 0 = Aries lord ... index 11 = Pisces lord
const SIGN_LORDS = [
  "mars", "venus", "mercury", "moon", "sun", "mercury",
  "venus", "mars", "jupiter", "saturn", "saturn", "jupiter",
];

const OWN_SIGNS = {
  sun: [5], moon: [4], mars: [1, 8], mercury: [3, 6],
  jupiter: [9, 12], venus: [2, 7], saturn: [10, 11],
};

// sign numbers are 1-indexed (Aries = 1)
const EXALTATION = {
  sun: 1, moon: 2, mars: 10, mercury: 6, jupiter: 4, venus: 12, saturn: 7,
};

const NATURAL_FRIENDS = {
  sun: ["moon", "mars", "jupiter"],
  moon: ["sun", "mercury"],
  mars: ["sun", "moon", "jupiter"],
  mercury: ["sun", "venus"],
  jupiter: ["sun", "moon", "mars"],
  venus: ["mercury", "saturn"],
  saturn: ["mercury", "venus"],
};

const NATURAL_ENEMIES = {
  sun: ["venus", "saturn"],
  moon: [],
  mars: ["mercury"],
  mercury: ["moon"],
  jupiter: ["mercury", "venus"],
  venus: ["sun", "moon"],
  saturn: ["sun", "moon", "mars"],
};

// orb in degrees within which a planet is considered combust (too close to the Sun)
const COMBUSTION_ORB = { moon: 12, mars: 17, mercury: 14, venus: 10, jupiter: 11, saturn: 15 };

const PLANET_SYMBOLS = {
  sun: "☉", moon: "☽", mars: "♂", mercury: "☿",
  jupiter: "♃", venus: "♀", saturn: "♄", rahu: "☊", ketu: "☋",
};

const PLANET_IDS = {
  sun: Constants.SE_SUN,
  moon: Constants.SE_MOON,
  mercury: Constants.SE_MERCURY,
  venus: Constants.SE_VENUS,
  mars: Constants.SE_MARS,
  jupiter: Constants.SE_JUPITER,
  saturn: Constants.SE_SATURN,
};

// Vimshottari Dasha — 120 year cycle
const DASHA_YEARS = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
const DASHA_ORDER = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const NAK_SPAN = 360 / 27;

// Jaimini karakas
const KARAKA_LABELS = ["Atma", "Amatya", "Bhratru", "Matru", "Putra", "Gnati", "Dara"];
const STHIR_KARAKAS = [
  { karaka: "Atma", planet: "sun" },
  { karaka: "Amatya", planet: "mercury" },
  { karaka: "Bhratru", planet: "mars" },
  { karaka: "Matru", planet: "moon" },
  { karaka: "Putra", planet: "jupiter" },
  { karaka: "Gnati", planet: "saturn" },
  { karaka: "Dara", planet: "venus" },
];

function normDeg(longitude) {
  return ((longitude % 360) + 360) % 360;
}

function getZodiacSign(longitude) {
  return SIGNS[Math.floor(normDeg(longitude) / 30)];
}

function getNakshatra(longitude) {
  const norm = normDeg(longitude);
  const index = Math.min(Math.floor(norm / NAK_SPAN), 26);
  const posInNak = norm % NAK_SPAN;
  const pada = Math.min(4, Math.max(1, Math.floor(posInNak / (NAK_SPAN / 4)) + 1));
  return { ...NAKSHATRAS[index], number: index + 1, pada };
}

// Simplified Navamsa (D9) sign formula:
// navamsaSignIndex = (signIndex*9 + navamsaSegmentWithinSign) mod 12
function getNavamsaSignIndex(longitude) {
  const norm = normDeg(longitude);
  const signIndex = Math.floor(norm / 30);
  const degInSign = norm % 30;
  const segment = Math.min(8, Math.floor(degInSign / (30 / 9)));
  return (signIndex * 9 + segment) % 12;
}

function getRelation(planetKey, signNumber) {
  if (!SIGN_LORDS.includes(planetKey)) return null; // rahu/ketu — dignity not classically assigned
  const exaltSign = EXALTATION[planetKey];
  if (exaltSign === signNumber) return "Exalted";
  const debilSign = exaltSign ? ((exaltSign - 1 + 6) % 12) + 1 : null;
  if (debilSign === signNumber) return "Debilitated";
  if (OWN_SIGNS[planetKey]?.includes(signNumber)) return "Own";
  const signLord = SIGN_LORDS[signNumber - 1];
  if (signLord === planetKey) return "Own";
  if (NATURAL_FRIENDS[planetKey]?.includes(signLord)) return "Friendly";
  if (NATURAL_ENEMIES[planetKey]?.includes(signLord)) return "Enemy";
  return "Neutral";
}

function isCombust(planetKey, planetLongitude, sunLongitude) {
  const orb = COMBUSTION_ORB[planetKey];
  if (!orb) return false;
  let diff = Math.abs(normDeg(planetLongitude) - normDeg(sunLongitude));
  if (diff > 180) diff = 360 - diff;
  return diff <= orb;
}

function getBaladiAvastha(signNumber, degInSign) {
  const isOdd = signNumber % 2 === 1;
  const stages = ["Bala", "Kumara", "Yuva", "Vridha", "Mrita"];
  const stageIndex = Math.min(4, Math.floor(degInSign / 6));
  return isOdd ? stages[stageIndex] : stages[4 - stageIndex];
}

function getJagratAvastha(signNumber) {
  if ([1, 4, 7, 10].includes(signNumber)) return "Jagrat";
  if ([2, 5, 8, 11].includes(signNumber)) return "Sushupta";
  return "Swapna";
}

function formatPlanet(name, longitude, speed) {
  const norm = normDeg(longitude);
  const degInSign = norm % 30;

  return {
    longitude: norm,
    sign: getZodiacSign(norm),
    signNumber: Math.floor(norm / 30) + 1,
    degree: Math.floor(degInSign),
    minute: Math.floor((degInSign % 1) * 60),
    second: Math.floor((((degInSign % 1) * 60) % 1) * 60),
    symbol: PLANET_SYMBOLS[name] || name,
    nakshatra: getNakshatra(norm),
    house: null,
    isRetrograde: speed < 0,
    relation: null, // filled in after all planets are computed
    isCombust: false,
  };
}

function formatYMD(totalYears) {
  const totalDays = Math.max(0, totalYears) * 365.25;
  const years = Math.floor(totalDays / 365.25);
  const remAfterYears = totalDays - years * 365.25;
  const months = Math.floor(remAfterYears / 30.4375);
  const days = Math.max(0, Math.floor(remAfterYears - months * 30.4375));
  return `${years}Y ${months}M ${days}D`;
}

function computeAntardashas(startDateTime, mahaLord, mahaYears) {
  const startIdx = DASHA_ORDER.indexOf(mahaLord);
  let cursor = startDateTime;
  const subs = [];
  for (let i = 0; i < 9; i++) {
    const subLord = DASHA_ORDER[(startIdx + i) % 9];
    const subYears = mahaYears * (DASHA_YEARS[subLord] / 120);
    const end = cursor.plus({ years: subYears });
    subs.push({ lord: subLord, startDate: cursor.toISODate(), endDate: end.toISODate() });
    cursor = end;
  }
  return subs;
}

function computeVimshottariDasha(moonLongitude, birthDateTime) {
  const norm = normDeg(moonLongitude);
  const nakIndex = Math.floor(norm / NAK_SPAN);
  const posInNak = norm % NAK_SPAN;
  const elapsedFraction = posInNak / NAK_SPAN;
  const remainingFraction = 1 - elapsedFraction;
  const startLordIndex = nakIndex % 9;
  const startLord = DASHA_ORDER[startLordIndex];
  const balanceYears = remainingFraction * DASHA_YEARS[startLord];

  const periods = [];
  let cursor = birthDateTime;

  const firstEnd = cursor.plus({ years: balanceYears });
  periods.push({
    lord: startLord,
    startDate: cursor.toISODate(),
    endDate: firstEnd.toISODate(),
    years: parseFloat(balanceYears.toFixed(2)),
    isBalance: true,
    antardashas: computeAntardashas(cursor, startLord, balanceYears),
  });
  cursor = firstEnd;

  let idx = startLordIndex;
  for (let i = 0; i < 8; i++) {
    idx = (idx + 1) % 9;
    const lord = DASHA_ORDER[idx];
    const years = DASHA_YEARS[lord];
    const end = cursor.plus({ years });
    periods.push({
      lord,
      startDate: cursor.toISODate(),
      endDate: end.toISODate(),
      years,
      isBalance: false,
      antardashas: computeAntardashas(cursor, lord, years),
    });
    cursor = end;
  }

  return {
    balanceLabel: `${startLord.toUpperCase()} ${formatYMD(balanceYears)}`,
    periods,
  };
}

function computeCharaKarakas(planets) {
  const relevant = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
  const withDeg = relevant.map((p) => ({ planet: p, degInSign: planets[p].longitude % 30 }));
  withDeg.sort((a, b) => b.degInSign - a.degInSign);
  return withDeg.map((item, i) => ({ karaka: KARAKA_LABELS[i], planet: item.planet }));
}

function computeAvasthas(planets) {
  const relevant = ["sun", "moon", "mars", "mercury", "jupiter", "venus", "saturn"];
  return relevant.map((p) => {
    const planet = planets[p];
    const degInSign = planet.longitude % 30;
    return {
      planet: p,
      baladi: getBaladiAvastha(planet.signNumber, degInSign),
      jagrat: getJagratAvastha(planet.signNumber),
    };
  });
}

function buildWholeSignHouses(ascSignIndex, planetsWithLongitude) {
  const houses = Array.from({ length: 12 }, (_, i) => {
    const signIndex = (ascSignIndex + i) % 12;
    return { number: i + 1, sign: SIGNS[signIndex], signNumber: signIndex + 1, planets: [] };
  });

  Object.entries(planetsWithLongitude).forEach(([planetName, planetData]) => {
    const planetSignIndex = Math.floor(normDeg(planetData.longitude) / 30);
    const houseNumber = ((planetSignIndex - ascSignIndex + 12) % 12) + 1;
    const house = houses.find((h) => h.number === houseNumber);
    if (house) {
      house.planets.push({
        name: planetName,
        symbol: planetData.symbol,
        isRetrograde: planetData.isRetrograde,
      });
    }
  });

  return houses;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { name, gender, date, time, place, lat, lng } = body;

    if (!name?.trim()) {
      return NextResponse.json({ success: false, error: "Name is required" }, { status: 400 });
    }
    if (!gender || !VALID_GENDERS.includes(gender)) {
      return NextResponse.json(
        { success: false, error: "Please select a valid gender (MALE, FEMALE, or OTHER)" },
        { status: 400 }
      );
    }
    if (!date || !time) {
      return NextResponse.json({ success: false, error: "Birth date and time are required" }, { status: 400 });
    }
    if (lat === undefined || lng === undefined) {
      return NextResponse.json({ success: false, error: "Birth place coordinates are required" }, { status: 400 });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    if (isNaN(latitude) || isNaN(longitude)) {
      return NextResponse.json({ success: false, error: "Invalid coordinates" }, { status: 400 });
    }

    const zones = geoTz.find(latitude, longitude);
    const zone = zones[0] || "UTC";
    const localDt = DateTime.fromISO(`${date}T${time}`, { zone });
    if (!localDt.isValid) {
      return NextResponse.json({ success: false, error: "Invalid date/time" }, { status: 400 });
    }

    const utcDt = localDt.toUTC();
    const eph = await getEph();

    const ut = utcDt.hour + utcDt.minute / 60 + utcDt.second / 3600;
    const jd = eph.swe_julday(utcDt.year, utcDt.month, utcDt.day, ut, Constants.SE_GREG_CAL);
    const flags = Constants.SEFLG_SWIEPH | Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;

    const planets = {};
    for (const [key, id] of Object.entries(PLANET_IDS)) {
      const { xx, error } = eph.swe_calc_ut(jd, id, flags);
      if (error && !error.includes("using Moshier")) {
        throw new Error(`swe_calc_ut failed for ${key}: ${error}`);
      }
      planets[key] = formatPlanet(key, xx[0], xx[3]);
    }

    const rahuRes = eph.swe_calc_ut(jd, Constants.SE_MEAN_NODE, flags);
    if (rahuRes.error && !rahuRes.error.includes("using Moshier")) {
      throw new Error(`swe_calc_ut failed for rahu: ${rahuRes.error}`);
    }
    planets.rahu = formatPlanet("rahu", rahuRes.xx[0], -1);
    planets.ketu = formatPlanet("ketu", rahuRes.xx[0] + 180, -1);

    // dignity + combustion (needs full planet set, so done after the loop)
    Object.entries(planets).forEach(([key, p]) => {
      p.relation = getRelation(key, p.signNumber);
      p.isCombust = key === "sun" ? false : isCombust(key, p.longitude, planets.sun.longitude);
    });

    // Ascendant
    const houseRes = eph.swe_houses(jd, latitude, longitude, "W");
    const ascLongitude = normDeg(houseRes.ascmc[0]);
    const ascendant = {
      longitude: ascLongitude,
      sign: getZodiacSign(ascLongitude),
      signNumber: Math.floor(ascLongitude / 30) + 1,
      degree: Math.floor(ascLongitude % 30),
      minute: Math.floor(((ascLongitude % 30) % 1) * 60),
      second: 0,
      nakshatra: getNakshatra(ascLongitude),
    };

    // Lagna (Rashi) chart — Whole Sign houses
    const ascSignIndex = Math.floor(ascLongitude / 30);
    const houses = buildWholeSignHouses(ascSignIndex, planets);
    Object.entries(planets).forEach(([planetName, planetData]) => {
      const planetSignIndex = Math.floor(normDeg(planetData.longitude) / 30);
      planetData.house = ((planetSignIndex - ascSignIndex + 12) % 12) + 1;
    });

    // Navamsa (D9) chart
    const navamsaAscSignIndex = getNavamsaSignIndex(ascLongitude);
    const navamsaPlanetLongitudes = {};
    Object.entries(planets).forEach(([key, p]) => {
      // fabricate a "longitude" that lands in the correct navamsa sign for house-building reuse
      navamsaPlanetLongitudes[key] = { ...p, longitude: getNavamsaSignIndex(p.longitude) * 30 + 1 };
    });
    const navamsaHouses = buildWholeSignHouses(navamsaAscSignIndex, navamsaPlanetLongitudes);
    const navamsa = {
      ascendantSign: SIGNS[navamsaAscSignIndex],
      houses: navamsaHouses,
    };

    // Vimshottari Dasha
    const dasha = computeVimshottariDasha(planets.moon.longitude, localDt);

    // Jaimini Karakas
    const karakas = { sthir: STHIR_KARAKAS, chara: computeCharaKarakas(planets) };

    // Avasthas
    const avasthas = computeAvasthas(planets);

    const ayanamsaValue = eph.swe_get_ayanamsa_ut(jd);

    const kundali = {
      personalDetails: {
        name: name.trim(),
        gender,
        date,
        time,
        place: place || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude,
        timezone: zone,
      },
      ascendant,
      planets,
      houses,
      navamsa,
      dasha,
      karakas,
      avasthas,
      nakshatras: {
        moon: planets.moon.nakshatra,
        sun: planets.sun.nakshatra,
        ascendant: ascendant.nakshatra,
      },
      ayanamsa: { value: parseFloat(ayanamsaValue.toFixed(4)), name: "Lahiri (Chitrapaksha)" },
      houseSystem: "Whole Sign",
      coordinates: { latitude, longitude },
      julianDay: jd,
      generatedAt: new Date().toISOString(),
      source: "Swiss Ephemeris",
      accuracy: 99,
      method: "Swiss Ephemeris (Lahiri Ayanamsa, Whole Sign Houses)",
    };

    return NextResponse.json({ success: true, kundali });
  } catch (error) {
    console.error("❌ Kundali generation error:", error);
    return NextResponse.json(
      { success: false, error: `Kundali generation failed: ${error.message}` },
      { status: 500 }
    );
  }
}