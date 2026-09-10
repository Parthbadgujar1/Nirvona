import type { Package, Payment } from "@/types";
import { CURRENT_STUDENT } from "@/data/students";
import { resolve, ApiError } from "./http";

export interface CheckoutDraft {
  packageId: string;
  courseSlug: string;
  student: { fullName: string; email: string; mobile: string; city: string; state: string };
}

export interface OrderSummary {
  subtotal: number;
  discount: number;
  taxableValue: number;
  gst: number;
  total: number;
}

export const GST_RATE = 0.18;

export function priceOrder(pkg: Package, couponPercent = 0): OrderSummary {
  const listPrice = pkg.originalPrice ?? pkg.price;
  const packageDiscount = listPrice - pkg.price;
  const coupon = Math.round((pkg.price * couponPercent) / 100);
  const taxableValue = pkg.price - coupon;
  const gst = Math.round(taxableValue * GST_RATE);
  return {
    subtotal: listPrice,
    discount: packageDiscount + coupon,
    taxableValue,
    gst,
    total: taxableValue + gst,
  };
}

/** Frontend-only coupon table. Real validation belongs on the server. */
const COUPONS: Record<string, number> = {
  NIRVONA10: 10,
  FIRSTCBT: 15,
};

export const checkoutService = {
  applyCoupon: async (code: string) => {
    const percent = COUPONS[code.trim().toUpperCase()];
    if (!percent) throw new ApiError("This coupon code is not valid.", 422, "invalid_coupon");
    return resolve({ code: code.trim().toUpperCase(), percent }, 500);
  },

  /** Simulates a payment gateway round-trip. `forceFailure` drives the demo failure path. */
  createOrder: async (pkg: Package, summary: OrderSummary, forceFailure = false): Promise<Payment> => {
    await new Promise((r) => setTimeout(r, 1800));
    if (forceFailure) {
      throw new ApiError("Your bank declined the transaction.", 402, "payment_declined");
    }
    const now = new Date();
    const orderId = `ORD-${now.getFullYear()}-${String(Math.floor(Math.random() * 90000) + 10000)}`;
    return {
      id: orderId,
      transactionId: `pay_${Math.random().toString(36).slice(2, 14).toUpperCase()}`,
      studentId: CURRENT_STUDENT.id,
      studentName: CURRENT_STUDENT.fullName,
      courseSlug: pkg.courseSlug,
      packageId: pkg.id,
      packageName: pkg.name,
      duration: pkg.duration,
      amount: summary.subtotal,
      discount: summary.discount,
      tax: summary.gst,
      total: summary.total,
      status: "successful",
      method: "UPI",
      date: now.toISOString().slice(0, 10),
    };
  },
};
