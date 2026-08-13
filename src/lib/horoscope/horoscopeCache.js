// src/lib/horoscope/horoscopeCache.js
import { prisma } from '@/lib/prisma';

export function normalizeDateKey(date, period) {
  const d = date instanceof Date ? date : new Date(date);

  switch (period) {
    case 'daily':
      return d.toISOString().split('T')[0];

    case 'weekly': {
      const tmp = new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
      const day = tmp.getUTCDay() || 7;
      tmp.setUTCDate(tmp.getUTCDate() + 4 - day);
      const yearStart = new Date(Date.UTC(tmp.getUTCFullYear(), 0, 1));
      const week = Math.ceil((((tmp - yearStart) / 86400000) + 1) / 7);
      return `${tmp.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
    }

    case 'monthly':
      return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;

    case 'yearly':
      return `${d.getUTCFullYear()}`;

    default:
      return d.toISOString().split('T')[0];
  }
}

const TTL_DAYS = { daily: 2, weekly: 8, monthly: 31, yearly: 366 };

function getExpiresAt(period) {
  return new Date(Date.now() + (TTL_DAYS[period] ?? 7) * 86_400_000);
}

// ─── Read ──────────────────────────────────────────────────────────────────

export async function getCached(rashi, period, date) {
  const row = await prisma.horoscopeCache.findUnique({
    where: {
      rashi_period_dateKey: {
        rashi: rashi.toLowerCase(),
        period,
        dateKey: normalizeDateKey(date, period),
      },
    },
  });

  if (!row || row.expiresAt < new Date()) return null;
  return row.data;
}

export async function getCachedBatch(period, date) {
  const rows = await prisma.horoscopeCache.findMany({
    where: {
      period,
      dateKey: normalizeDateKey(date, period),
      expiresAt: { gt: new Date() },
    },
    select: { rashi: true, data: true },
  });

  if (!rows.length) return null;
  return Object.fromEntries(rows.map(r => [r.rashi, r.data]));
}

export async function getMissingRashis(allRashis, period, date) {
  const cached = await prisma.horoscopeCache.findMany({
    where: {
      period,
      dateKey: normalizeDateKey(date, period),
      rashi: { in: allRashis.map(r => r.toLowerCase()) },
      expiresAt: { gt: new Date() },
    },
    select: { rashi: true },
  });

  const cachedSet = new Set(cached.map(r => r.rashi));
  return allRashis.filter(r => !cachedSet.has(r.toLowerCase()));
}

// ─── Write ─────────────────────────────────────────────────────────────────

export async function setCached(rashi, period, date, data) {
  const key = {
    rashi: rashi.toLowerCase(),
    period,
    dateKey: normalizeDateKey(date, period),
  };
  await prisma.horoscopeCache.upsert({
    where: { rashi_period_dateKey: key },
    create: { ...key, data, expiresAt: getExpiresAt(period) },
    update: { data, generatedAt: new Date(), expiresAt: getExpiresAt(period) },
  });
}

export async function setCachedBatch(horoscopes, period, date) {
  const dateKey   = normalizeDateKey(date, period);
  const expiresAt = getExpiresAt(period);
  const now       = new Date();

  const ops = Object.entries(horoscopes).map(([rashi, data]) => {
    const key = { rashi: rashi.toLowerCase(), period, dateKey };
    return prisma.horoscopeCache.upsert({
      where: { rashi_period_dateKey: key },
      create: { ...key, data, expiresAt },
      update: { data, generatedAt: now, expiresAt },
    });
  });

  await prisma.$transaction(ops);
}

// ─── Auto-Cleanup: Delete old data BEFORE saving new ──────────────────────
// ✅ NEW: Deletes data older than (yesterday, last week, last month, last year)

export async function cleanupOldCache() {
  const results = {};

  for (const period of ['daily', 'weekly', 'monthly', 'yearly']) {
    const validKeys = [];

    // Generate valid dateKeys for -1, 0, +1
    for (const offset of [-1, 0, 1]) {
      const date = new Date();
      
      if (period === 'daily') {
        date.setDate(date.getDate() + offset);
      } else if (period === 'weekly') {
        date.setDate(date.getDate() + offset * 7);
      } else if (period === 'monthly') {
        date.setMonth(date.getMonth() + offset);
      } else if (period === 'yearly') {
        date.setFullYear(date.getFullYear() + offset);
      }

      validKeys.push(normalizeDateKey(date, period));
    }

    // ✅ Delete everything NOT in validKeys (keeps only -1, 0, +1)
    const deleted = await prisma.horoscopeCache.deleteMany({
      where: {
        period,
        dateKey: { notIn: validKeys },
      },
    });

    results[period] = {
      kept: validKeys,
      deleted: deleted.count,
    };

    if (deleted.count > 0) {
      console.log(`🗑️ Cleaned ${period}: kept ${validKeys.join(', ')}, deleted ${deleted.count} old entries`);
    }
  }

  return results;
}

// ─── Generation log ────────────────────────────────────────────────────────

export async function logGeneration(date, period, totalRashis, apiCalls, status = 'SUCCESS') {
  const dateKey = normalizeDateKey(date, period);
  await prisma.horoscopeGenerationLog.upsert({
    where: { period_dateKey: { period, dateKey } },
    create: { period, dateKey, totalRashis, apiCalls, status },
    update: { totalRashis, apiCalls, status, completedAt: new Date() },
  });
}

export async function wasAlreadyGenerated(period, date) {
  const row = await prisma.horoscopeGenerationLog.findUnique({
    where: {
      period_dateKey: {
        period,
        dateKey: normalizeDateKey(date, period),
      },
    },
  });
  return row?.status === 'SUCCESS' || row?.status === 'PARTIAL';
}

// ─── Maintenance ───────────────────────────────────────────────────────────

export async function purgeExpired() {
  const [cache] = await Promise.all([
    prisma.horoscopeCache.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.horoscopeGenerationLog.deleteMany({
      where: { completedAt: { lt: new Date(Date.now() - 30 * 86_400_000) } },
    }),
  ]);
  return cache.count;
}

export async function getCacheStats() {
  const [total, active, logs] = await Promise.all([
    prisma.horoscopeCache.count(),
    prisma.horoscopeCache.count({ where: { expiresAt: { gt: new Date() } } }),
    prisma.horoscopeGenerationLog.findMany({
      orderBy: { completedAt: 'desc' },
      take: 10,
    }),
  ]);
  return { total, active, expired: total - active, recentGenerations: logs };
}