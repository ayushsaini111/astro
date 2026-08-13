// src/app/api/horoscope/[period]/route.js
// Cache-first. On miss: generates ONLY the requested rashi (1 API call).
// Never batches on user requests — that causes RPM quota spikes.

import { NextResponse } from 'next/server';
import { GeminiHoroscopeService, QuotaError, ALL_RASHIS } from '@/lib/ai/geminiService';
import {
  getCached,
  setCached,
  purgeExpired,
} from '@/lib/horoscope/horoscopeCache';

const gemini = new GeminiHoroscopeService();

export async function GET(request, context) {
  try {
    purgeExpired().catch(() => {});

    const { searchParams } = new URL(request.url);
    const rashiParam = searchParams.get('rashi')?.toLowerCase()?.trim();
    const dateStr    = searchParams.get('date');
    const { period } = await context.params;

    // ── Validation ──────────────────────────────────────────────────────────
    if (!rashiParam) return json({ success: false, error: 'rashi is required' }, 400);

    const rashiName = ALL_RASHIS.find(r => r.toLowerCase() === rashiParam);
    if (!rashiName) return json({ success: false, error: 'Invalid rashi' }, 400);

    const date = dateStr ? new Date(dateStr) : new Date();
    if (isNaN(date.getTime())) return json({ success: false, error: 'Invalid date' }, 400);

    const validPeriods = ['daily', 'weekly', 'monthly', 'yearly'];
    if (!validPeriods.includes(period)) return json({ success: false, error: 'Invalid period' }, 400);

    // ── 1. Cache hit — instant response, 0 API calls ────────────────────────
    const cached = await getCached(rashiName, period, date);
    if (cached) {
      console.log(`[Cache HIT] ${rashiName} ${period} ${date.toISOString().split('T')[0]}`);
      return json({ success: true, horoscope: cached, period, rashi: rashiName, source: 'cache' });
    }

    console.log(`[Cache MISS] ${rashiName} ${period} ${date.toISOString().split('T')[0]}`);

    // ── 2. Quota check ──────────────────────────────────────────────────────
    if (gemini.isQuotaExhausted()) {
      return json({
        success: false,
        error: `Busy generating horoscopes. Retry in ${gemini.quotaSecondsLeft()}s.`,
        quotaExhausted: true,
        retryAfter: gemini.quotaSecondsLeft(),
      }, 429);
    }

    // ── 3. Generate exactly 1 rashi — never more ────────────────────────────
    // Cron pre-warms the cache. This handles any stragglers or past-date requests.
    const horoscope = await gemini.generateHoroscope(rashiName, date, period);
    await setCached(rashiName, period, date, horoscope);

    return json({ success: true, horoscope, period, rashi: rashiName, source: 'ai' });

  } catch (err) {
    const isQuota = err instanceof QuotaError || err?.name === 'QuotaError';
    console.error('[Horoscope API]', err.message);

    if (isQuota) {
      return json({
        success: false,
        error: `Busy generating horoscopes. Retry in ${gemini.quotaSecondsLeft()}s.`,
        quotaExhausted: true,
        retryAfter: gemini.quotaSecondsLeft(),
      }, 429);
    }

    return json({ success: false, error: 'Failed to generate horoscope', details: err.message }, 500);
  }
}

export const dynamic = 'force-dynamic';
function json(body, status = 200) { return NextResponse.json(body, { status }); }