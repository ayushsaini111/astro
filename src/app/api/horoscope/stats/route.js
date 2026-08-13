// app/api/horoscope/stats/route.js
// View cache stats and recent generation history. Useful for debugging.

import { NextResponse } from 'next/server';
import { getCacheStats, purgeExpired } from '@/lib/horoscope/horoscopeCache';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');

  // Optional: protect with same CRON_SECRET
  if (process.env.CRON_SECRET && secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const purged = purgeExpired();
  const stats = getCacheStats();

  return NextResponse.json({
    success: true,
    purgedNow: purged,
    ...stats,
  });
}

export const dynamic = 'force-dynamic';