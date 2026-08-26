import { NextResponse } from "next/server";
import { DateTime } from "luxon";
import geoTz from "geo-tz";
import fs from "node:fs";
import path from "node:path";
import { load, Constants } from "@fusionstrings/swisseph-wasi";
import { gunaMilan } from "@/lib/gunaMilan";

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

async function getMoonLongitude(person, eph) {
  const { date, time, lat, lng } = person;
  const latitude = parseFloat(lat);
  const longitude = parseFloat(lng);

  if (!date || !time || isNaN(latitude) || isNaN(longitude)) {
    throw new Error("Each person needs date, time, lat, and lng.");
  }

  const zones = geoTz.find(latitude, longitude);
  const zone = zones[0] || "UTC";
  const localDt = DateTime.fromISO(`${date}T${time}`, { zone });

  if (!localDt.isValid) {
    throw new Error("Invalid date/time.");
  }

  const utcDt = localDt.toUTC();
  const ut = utcDt.hour + utcDt.minute / 60 + utcDt.second / 3600;
  const jd = eph.swe_julday(utcDt.year, utcDt.month, utcDt.day, ut, Constants.SE_GREG_CAL);

  const flags = Constants.SEFLG_SWIEPH | Constants.SEFLG_SIDEREAL | Constants.SEFLG_SPEED;
  const { xx, error } = eph.swe_calc_ut(jd, Constants.SE_MOON, flags);

  if (error && !error.includes("using Moshier")) {
    throw new Error(`Moon calculation failed: ${error}`);
  }

  return ((xx[0] % 360) + 360) % 360;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { boy, girl } = body;

    if (!boy || !girl) {
      return NextResponse.json(
        { success: false, error: "Both boy and girl birth details are required." },
        { status: 400 }
      );
    }

    const eph = await getEph();

    const [boyMoonLongitude, girlMoonLongitude] = await Promise.all([
      getMoonLongitude(boy, eph),
      getMoonLongitude(girl, eph),
    ]);

    const result = gunaMilan({ boyMoonLongitude, girlMoonLongitude });

    return NextResponse.json({
      success: true,
      match: {
        ...result,
        boy: { ...result.boy, name: boy.name || "Boy" },
        girl: { ...result.girl, name: girl.name || "Girl" },
      },
    });
  } catch (error) {
    console.error("❌ Kundali matching error:", error);
    return NextResponse.json(
      { success: false, error: `Matching failed: ${error.message}` },
      { status: 500 }
    );
  }
}