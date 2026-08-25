// src/app/api/horoscope/cron/route.js

import { NextResponse } from 'next/server';
import {
  GeminiHoroscopeService,
  ALL_RASHIS,
  toDateKey,
} from '@/lib/ai/geminiService';
import {
  setCached,
  getMissingRashis,
  logGeneration,
  cleanupOldCache,
} from '@/lib/horoscope/horoscopeCache';

const VALID_PERIODS = ['daily', 'weekly', 'monthly', 'yearly'];
const GENERATE_DATES = [0, 1]; // today, tomorrow — "previous" stays cached from when it was "current"

export async function GET(request) {
  const { searchParams } = new URL(request.url);

  const secret = searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return json({ success: false, error: 'Unauthorized' }, 401);
  }

  const period = searchParams.get('period');
  if (!period || !VALID_PERIODS.includes(period)) {
    return json({
      success: false,
      error: `period required. Use: ${VALID_PERIODS.join(', ')}`,
    }, 400);
  }

  const force = searchParams.get('force') === 'true';
  const startedAt = Date.now();

  console.log(`\n🌙 [Cron] ${period} generation started at ${new Date().toISOString()}`);

  const cleanupResults = await cleanupOldCache();
  console.log(`✅ Cleanup: deleted ${cleanupResults[period]?.deleted || 0} old ${period} entries`);

  const gemini = new GeminiHoroscopeService(period);

  const results = {};
  let totalCalls = 0;

  for (const dayOffset of GENERATE_DATES) {
    const date = new Date();

    if (period === 'daily') {
      date.setDate(date.getDate() + dayOffset);
    } else if (period === 'weekly') {
      date.setDate(date.getDate() + dayOffset * 7);
    } else if (period === 'monthly') {
      date.setMonth(date.getMonth() + dayOffset);
    } else if (period === 'yearly') {
      date.setFullYear(date.getFullYear() + dayOffset);
    }

    const dateKey = toDateKey(date);
    const label = dayOffset === 0 ? 'current' : 'next';

    const missing = force ? [...ALL_RASHIS] : await getMissingRashis(ALL_RASHIS, period, date);

    if (missing.length === 0) {
      console.log(`✅ ${label} ${period} (${dateKey}) — all cached, skipping`);
      results[dateKey] = { skipped: true, period, label };
      continue;
    }

    console.log(`🔮 Generating ${label} ${period} (${dateKey}) — ${missing.length} rashis needed`);

    // Each rashi saves to the DB the moment it's generated — no more waiting
    // for the whole batch to finish, so live user requests hit cache immediately
    const { horoscopes, apiCalls } = await gemini.generateBatch(
      date, period, missing,
      async (rashi, data) => { await setCached(rashi, period, date, data); }
    );
    const generated = Object.keys(horoscopes).length;

    if (generated > 0 || missing.length > 0) {
      await logGeneration(
        date, period, generated, apiCalls,
        generated === missing.length ? 'SUCCESS' : generated > 0 ? 'PARTIAL' : 'FAILED'
      );
    }

    results[dateKey] = {
      label,
      period,
      generated,
      attempted: missing.length,
      apiCalls,
      status: generated === missing.length ? 'SUCCESS' : generated > 0 ? 'PARTIAL' : 'FAILED',
    };

    totalCalls += apiCalls;

    if (gemini.isQuotaExhausted()) {
      console.error(`🛑 Quota exhausted after ${totalCalls} calls`);
      return json({
        success: false,
        error: 'Quota exhausted',
        results,
        totalCalls,
        elapsedMs: Date.now() - startedAt,
      }, 429);
    }
  }

  const elapsedMs = Date.now() - startedAt;
  console.log(`\n✅ ${period} complete — ${totalCalls} API calls, ${Math.round(elapsedMs / 1000)}s\n`);

  return json({
    success: true,
    period,
    results,
    totalCalls,
    cleanup: cleanupResults[period],
    elapsedMs,
  });
}

export const dynamic = 'force-dynamic';
function json(body, status = 200) { return NextResponse.json(body, { status }); }