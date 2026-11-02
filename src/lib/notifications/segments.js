import { prisma } from "@/lib/prisma";

const daysAgo = (n) => new Date(Date.now() - n * 24 * 60 * 60 * 1000);

// Each segment is a reusable Prisma `where` clause on User — built from
// existing relations (orders, bookings, plans, wallet, transactions, calls).
// No new tables needed; purely behavior-derived targeting.
export const SEGMENTS = {
  ALL: {
    label: "All Users",
    where: () => ({ isBlocked: false }),
  },
  NEW_USERS: {
    label: "New Users (joined <7d, never purchased)",
    where: () => ({
      isBlocked: false,
      createdAt: { gte: daysAgo(7) },
      orders: { none: {} },
      bookings: { none: {} },
      plans: { none: {} },
    }),
  },
  NO_PLAN_EVER: {
    label: "Never Bought a Plan (conversion push)",
    where: () => ({ isBlocked: false, plans: { none: {} } }),
  },
  PLAN_EXPIRED: {
    label: "Plan Expired (win-back)",
    where: () => ({
      isBlocked: false,
      plans: { some: { isActive: true, endDate: { lt: new Date() } } },
    }),
  },
  WALLET_IDLE: {
    label: "Wallet Balance Unused (14d+ no activity)",
    where: () => ({
      isBlocked: false,
      wallet: { balance: { gt: 0 } },
      transactions: { none: { createdAt: { gte: daysAgo(14) } } },
    }),
  },
  POOJA_INTERESTED: {
    label: "Has Booked a Pooja Before",
    where: () => ({ isBlocked: false, bookings: { some: {} } }),
  },
  PRODUCT_BUYERS: {
    label: "Has Bought a Product Before",
    where: () => ({ isBlocked: false, orders: { some: {} } }),
  },
  INACTIVE_30D: {
    label: "Inactive 30+ Days (win-back)",
    where: () => ({
      isBlocked: false,
      orders: { none: { createdAt: { gte: daysAgo(30) } } },
      bookings: { none: { createdAt: { gte: daysAgo(30) } } },
      calls: { none: { createdAt: { gte: daysAgo(30) } } },
    }),
  },
};

export async function getSegmentCounts() {
  const entries = Object.entries(SEGMENTS);
  const counts = await Promise.all(
    entries.map(([, seg]) => prisma.user.count({ where: seg.where() }))
  );
  return entries.map(([key, seg], i) => ({ key, label: seg.label, count: counts[i] }));
}

export async function getSegmentUserIds(key) {
  const seg = SEGMENTS[key];
  if (!seg) return [];
  const users = await prisma.user.findMany({ where: seg.where(), select: { id: true } });
  return users.map((u) => u.id);
}