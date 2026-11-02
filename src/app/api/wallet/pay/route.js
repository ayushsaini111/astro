import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createReminders } from "@/services/reminders";
import { sendBookingConfirmation } from "@/services/whatsapp";

function getPoojaType(mode) {
  if (!mode) return "OFFLINE";
  const m = mode.toLowerCase();
  if (m.includes("video") || m.includes("online") || m.includes("call")) return "ONLINE";
  return "OFFLINE";
}

function mapSlotToTime(slot) {
  const map = {
    "8-12": "08:00", "12-15": "12:00", "15-19": "15:00", "19-22": "19:00",
    SLOT_8_12: "08:00", SLOT_12_15: "12:00", SLOT_15_19: "15:00", SLOT_19_22: "19:00",
  };
  return map[slot] || "10:00";
}

export async function POST(request) {
  try {
    const userId = request.headers.get("x-user-id");
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { orderType, redeemCode } = body;

    // ✅ Hard rule, enforced server-side: wallet payment + redeem code can never combine
    if (redeemCode) {
      return NextResponse.json(
        { success: false, error: "Redeem codes cannot be used with wallet payment" },
        { status: 400 }
      );
    }

    if (!["POOJA", "PRODUCT", "PLAN", "CART"].includes(orderType)) {
      return NextResponse.json({ success: false, error: "Invalid orderType" }, { status: 400 });
    }

    let amount, purpose, buildRecord;

    if (orderType === "POOJA") {
      const { userDetails, pooja, selectedDate, selectedTimeSlot } = body;
      const baseAmountPaise = Math.round(Number(pooja.offer_price) * 100);
      amount = Math.round(baseAmountPaise / 100); // Booking.amount is Int (rupees)
      purpose = "POOJA_PAYMENT";
      buildRecord = (tx) =>
        tx.booking.create({
          data: {
            bookingId: `RNT${Date.now()}${Math.floor(Math.random() * 1000)}`,
            userId,
            poojaId: Number(pooja.id),
            poojaTitle: pooja.title,
            poojaType: getPoojaType(pooja.mode),
            poojaImage: pooja.image || null,
            duration: pooja.duration || null,
            amount,
            originalPrice: pooja.price ? Math.round(Number(pooja.price)) : null,
            discount: 0,
            redeemCode: null,
            customerName: userDetails.name,
            customerPhone: userDetails.phone,
            customerEmail: userDetails.email,
            houseNo: userDetails.houseNo || null,
            address: userDetails.address || null,
            landmark: userDetails.landmark || null,
            pinCode: userDetails.pinCode || null,
            scheduledDate: selectedDate,
            scheduledTime: mapSlotToTime(selectedTimeSlot),
            status: "CONFIRMED",
            paymentStatus: "PAID",
          },
        });
    } else if (orderType === "PRODUCT") {
      const { userDetails, deliveryLocation, productDetails } = body;
      const baseAmountPaise = Math.round(parseFloat(productDetails.totalPrice) * 100);
      amount = baseAmountPaise / 100; // Order.totalAmount is Float
      purpose = "PRODUCT_PAYMENT";
      buildRecord = async (tx) => {
        const order = await tx.order.create({
          data: {
            orderId: `ORD${Date.now().toString().slice(-10)}`,
            userId,
            productId: productDetails.productId,
            productTitle: productDetails.productTitle,
            productImage: productDetails.productImage || null,
            quantity: parseInt(productDetails.quantity) || 1,
            unitPrice: parseFloat(productDetails.unitPrice) || 0,
            totalAmount: amount,
            redeemCode: null,
            customerName: userDetails.name || "",
            customerPhone: userDetails.phone || "",
            customerEmail: userDetails.email || "",
            paymentStatus: "SUCCESS",
            status: "CONFIRMED",
            deliveryStatus: "PENDING",
            estimatedDelivery: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
            specialRequests: userDetails.specialRequests || null,
            addressType: deliveryLocation.type === "coordinates" ? "GPS" : "MANUAL",
            latitude: deliveryLocation.latitude || null,
            longitude: deliveryLocation.longitude || null,
            fullAddress: deliveryLocation.fullAddress || "",
            houseNo: userDetails.houseNo || null,
            address: userDetails.address || null,
            landmark: userDetails.landmark || null,
            pinCode: userDetails.pinCode || null,
          },
        });
        await tx.orderItem.create({
          data: {
            orderId: order.id,
            productId: productDetails.productId,
            quantity: parseInt(productDetails.quantity) || 1,
            price: parseFloat(productDetails.unitPrice) || 0,
          },
        });
        return order;
      };
    } else if (orderType === "CART") {
      // ✅ NEW — multi-item single-payment wallet debit for Cart checkout
      const { userDetails, deliveryLocation, items } = body;
      if (!Array.isArray(items) || items.length === 0) {
        return NextResponse.json({ success: false, error: "Cart is empty" }, { status: 400 });
      }

      // Trust client-computed itemTotal, same trust model as existing bulk Razorpay route
      amount = items.reduce((sum, i) => sum + (parseFloat(i.itemTotal) || 0), 0);
      purpose = "PRODUCT_PAYMENT";

      buildRecord = async (tx) => {
        const estimatedDelivery = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const orders = [];

        for (const item of items) {
          const orderId = `ORD${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
          // small spacing to guarantee orderId uniqueness, mirrors existing bulk route
          await new Promise((resolve) => setTimeout(resolve, 1));

          const order = await tx.order.create({
            data: {
              orderId,
              userId,
              productId: item.productId,
              productTitle: item.productTitle,
              productImage: item.productImage || null,
              quantity: parseInt(item.quantity) || 1,
              unitPrice: parseFloat(item.unitPrice) || 0,
              totalAmount: parseFloat(item.itemTotal) || 0,
              shuddhikaranRequested: item.shuddhikaranRequested || false,
              shuddhikaranAmount: parseFloat(item.shuddhikaranAmount || 0),
              redeemCode: null,
              customerName: userDetails.name || "",
              customerPhone: userDetails.phone || "",
              customerEmail: userDetails.email || "",
              paymentStatus: "SUCCESS",
              status: "CONFIRMED",
              deliveryStatus: "PENDING",
              estimatedDelivery,
              specialRequests: userDetails.specialRequests || null,
              addressType: deliveryLocation.type === "coordinates" ? "GPS" : "MANUAL",
              latitude: deliveryLocation.latitude || null,
              longitude: deliveryLocation.longitude || null,
              fullAddress: deliveryLocation.fullAddress || "",
              houseNo: deliveryLocation.houseNo || null,
              address: deliveryLocation.fullAddress || null,
              landmark: deliveryLocation.landmark || null,
              pinCode: deliveryLocation.pinCode || null,
            },
          });

          await tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: parseInt(item.quantity) || 1,
              price: parseFloat(item.unitPrice) || 0,
            },
          });

          orders.push(order);
        }

        return orders; // array, not a single record
      };
    } else {
      const { planId } = body;
      const plan = await prisma.plan.findUnique({ where: { id: planId } });
      if (!plan) {
        return NextResponse.json({ success: false, error: "Plan not found" }, { status: 404 });
      }
      amount = plan.price / 100; // plan.price stored in paise
      purpose = "PLAN_PAYMENT";
      buildRecord = async (tx) => {
        const now = new Date();
        const endDate = new Date(now);
        endDate.setDate(endDate.getDate() + plan.validDays);
        let actualEndDate = endDate;
        if (plan.planType === "TOPUP") {
          const activePlan = await tx.userPlan.findFirst({
            where: { userId, isActive: true, endDate: { gte: now }, plan: { planType: "MONTHLY" } },
          });
          if (activePlan) actualEndDate = activePlan.endDate;
        }
        return tx.userPlan.create({
          data: {
            userId,
            planId,
            remainingSeconds: plan.seconds,
            startDate: now,
            endDate: actualEndDate,
            isActive: true,
            redeemCode: null,
          },
        });
      };
    }

    const idempotencyKey = `wallet_${orderType}_${userId}_${Date.now()}`;

    const result = await prisma.$transaction(async (tx) => {
      // ✅ Atomic conditional debit — DB-level race protection, no separate read-then-write
      const debited = await tx.wallet.updateMany({
        where: { userId, balance: { gte: amount } },
        data: { balance: { decrement: amount } },
      });
      if (debited.count === 0) {
        throw new Error("INSUFFICIENT_BALANCE");
      }

      const wallet = await tx.wallet.findUnique({ where: { userId } });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount,
          type: "DEBIT",
          purpose,
          status: "SUCCESS",
          idempotencyKey,
        },
      });

      const record = await buildRecord(tx);
      return { wallet, transaction, record };
    });

    if (orderType === "POOJA") {
      sendBookingConfirmation(result.record).catch((e) =>
        console.error("⚠️ WhatsApp confirmation failed (non-fatal):", e.message)
      );
      createReminders(result.record.id, result.record.scheduledDate, result.record.scheduledTime).catch((e) =>
        console.error("⚠️ Reminder scheduling failed (non-fatal):", e)
      );
    }

    return NextResponse.json({
      success: true,
      message: "Paid with wallet successfully",
      newBalance: result.wallet.balance,
      record: result.record, // array for CART, single object otherwise
    });
  } catch (error) {
    if (error.message === "INSUFFICIENT_BALANCE") {
      return NextResponse.json({ success: false, error: "Insufficient wallet balance" }, { status: 400 });
    }
    console.error("💥 Wallet payment error:", error);
    return NextResponse.json({ success: false, error: error.message || "Wallet payment failed" }, { status: 500 });
  }
}