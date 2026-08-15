import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getUserFromHeaders(request) {
  const userId = request.headers.get('x-user-id');
  if (!userId) return null;
  return {
    id: userId,
    email: request.headers.get('x-user-email') || '',
    name: request.headers.get('x-user-name') || '',
  };
}

// ─── Normalizers ─────────────────────────────────────────────────────────────

const normalizeBooking = (b) => ({
  id: b.id,
  orderId: b.bookingId,
  type: "POOJA",
  title: b.poojaTitle,
  image: b.poojaImage,
  amount: Number(b.amount),
  originalPrice: b.originalPrice ? Number(b.originalPrice) : null,
  discount: b.discount ? Number(b.discount) : null,
  status: b.status,
  paymentStatus: b.paymentStatus,
  paymentId: b.razorpayPaymentId,
  createdAt: b.createdAt,
  meta: {
    mode: b.poojaMode,
    duration: b.duration,
    scheduledDate: b.scheduledDate,
    timeSlot: b.timeSlot,
    customerName: b.customerName,
    customerPhone: b.customerPhone,
    customerEmail: b.customerEmail,
    address: b.houseNo
      ? [b.houseNo, b.address, b.landmark, b.pinCode].filter(Boolean).join(", ")
      : b.address || null,
  },
});

const normalizeOrder = (o) => ({
  id: o.id,
  orderId: o.orderId || `ORD_${o.id.slice(-8).toUpperCase()}`,
  type: "PRODUCT",
  title: o.productTitle || "Product Order",
  image: o.productImage || null,
  amount: Number(o.totalAmount),
  originalPrice: null,
  discount: null,
  status: o.status,
  paymentStatus: o.paymentStatus,
  paymentId: o.razorpayPaymentId || null,
  createdAt: o.createdAt,
  meta: {
    quantity: o.quantity || 1,
    unitPrice: o.unitPrice || null,
    deliveryStatus: o.deliveryStatus || null,
    estimatedDelivery: o.estimatedDelivery || null,
    deliveredAt: o.deliveredAt || null,
    specialRequests: o.specialRequests || null,
    address: o.fullAddress || o.address || null,
    addressType: o.addressType || "manual",
    latitude: o.latitude || null,
    longitude: o.longitude || null,
  },
});

const normalizePlan = (up) => ({
  id: up.id,
  orderId: `PLAN_${up.id.slice(-8).toUpperCase()}`,
  type: "TALKTIME",
  title: up.plan.name,
  image: null,
  amount: up.plan.price / 100,
  originalPrice: null,
  discount: null,
  status: up.isActive ? "ACTIVE" : "EXPIRED",
  paymentStatus: "SUCCESS",
  paymentId: null,
  createdAt: up.startDate,
  meta: {
    seconds: up.plan.seconds,
    remainingSeconds: up.remainingSeconds,
    validDays: up.plan.validDays,
    endDate: up.endDate,
    perDayLimit: up.plan.perDayLimit,
    planType: up.plan.planType,
    isActive: up.isActive,
    perDayUsedSeconds: up.perDayUsedSeconds,
  },
});

// ─── Query Selections ────────────────────────────────────────────────────────

const BOOKING_SELECT = {
  id: true,
  bookingId: true,
  poojaTitle: true,
  poojaMode: true,
  poojaImage: true,
  duration: true,
  amount: true,
  originalPrice: true,
  discount: true,
  customerName: true,
  customerPhone: true,
  customerEmail: true,
  scheduledDate: true,
  timeSlot: true,
  status: true,
  paymentStatus: true,
  houseNo: true,
  address: true,
  landmark: true,
  pinCode: true,
  razorpayPaymentId: true,
  createdAt: true,
};

const ORDER_SELECT = {
  id: true,
  orderId: true,
  productTitle: true,
  productImage: true,
  quantity: true,
  unitPrice: true,
  totalAmount: true,
  status: true,
  paymentStatus: true,
  deliveryStatus: true,
  fullAddress: true,
  houseNo: true,
  address: true,
  landmark: true,
  pinCode: true,
  latitude: true,
  longitude: true,
  addressType: true,
  razorpayPaymentId: true,
  estimatedDelivery: true,
  deliveredAt: true,
  specialRequests: true,
  createdAt: true,
};

const PLAN_INCLUDE = {
  plan: {
    select: {
      name: true,
      price: true,
      seconds: true,
      validDays: true,
      perDayLimit: true,
      planType: true,
    },
  },
};

// ─── Main Handler ────────────────────────────────────────────────────────────

export async function GET(request) {
  try {
    const user = getUserFromHeaders(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "ALL";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "10")));
    const skip = (page - 1) * limit;

    // Parallel fetch with conditional queries
    const fetchBookings = filter === "ALL" || filter === "POOJA";
    const fetchOrders = filter === "ALL" || filter === "PRODUCT";
    const fetchPlans = filter === "ALL" || filter === "TALKTIME";

    const [bookings, productOrders, userPlans] = await Promise.all([
      fetchBookings
        ? prisma.booking.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: BOOKING_SELECT,
          })
        : [],
      fetchOrders
        ? prisma.order.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: ORDER_SELECT,
          })
        : [],
      fetchPlans
        ? prisma.userPlan.findMany({
            where: { userId: user.id },
            orderBy: { startDate: "desc" },
            include: PLAN_INCLUDE,
          })
        : [],
    ]);

    // Normalize and combine
    const normalizedOrders = [
      ...bookings.map(normalizeBooking),
      ...productOrders.map(normalizeOrder),
      ...userPlans.map(normalizePlan),
    ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    const total = normalizedOrders.length;

    return NextResponse.json({
      success: true,
      orders: normalizedOrders.slice(skip, skip + limit),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasMore: skip + limit < total,
      },
      counts: {
        all: total,
        pooja: bookings.length,
        product: productOrders.length,
        talktime: userPlans.length,
      },
    });
  } catch (error) {
    console.error("Orders fetch error:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal Server Error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
      },
      { status: 500 }
    );
  }
}