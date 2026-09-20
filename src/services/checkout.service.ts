import type { Package, Payment } from "@/types";
import type { Session } from "@/services/auth.service";
import { resolve, post, ApiError } from "./http";

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

/** Frontend-only coupon table, used purely to give instant "valid code"
 * feedback in the UI. The backend keeps its own copy (PaymentService::COUPONS)
 * and recomputes the discount itself when the order is created - this
 * table is never trusted for the actual charge. */
const COUPONS: Record<string, number> = {
  NIRVONA10: 10,
  FIRSTCBT: 15,
};

interface StartedPayment {
  paymentId: string;
  /** PhonePe's hosted payment page - the browser is sent here to pay. */
  redirectUrl: string;
  amount: number;
  summary: OrderSummary;
}

/** What the backend reports for a payment after asking PhonePe. */
export interface PaymentStatusResult {
  status: "successful" | "failed" | "pending";
  payment: BackendPaymentRow;
  reason?: string | null;
}

interface BackendPaymentRow {
  id: string;
  studentId: string;
  packageId: string;
  courseSlug: string;
  total: number;
  status: string;
}

export const checkoutService = {
  applyCoupon: async (code: string) => {
    const percent = COUPONS[code.trim().toUpperCase()];
    if (!percent) throw new ApiError("This coupon code is not valid.", 422, "invalid_coupon");
    // No endpoint: this is deliberately a frontend-only coupon table (see
    // comment above), not something the backend validates. `500` was
    // meant as the simulated latency (4th arg) but landed in the
    // `endpoint` slot instead, which - now that USE_MOCK_DATA is false -
    // would have made this try to fetch literally "/500" from the API.
    return resolve({ code: code.trim().toUpperCase(), percent }, undefined, undefined, 500);
  },

  /**
   * PhonePe hosted-checkout flow:
   *  1. Ask the backend to create the PhonePe order (it recomputes the
   *     amount server-side from the package price - never trusts the
   *     client's `summary`). It hands back PhonePe's payment-page URL.
   *  2. The caller sends the browser to that URL; the customer pays on
   *     PhonePe (UPI, card, netbanking, wallet) and PhonePe returns them
   *     to /payment/status.
   *  3. That page calls `paymentStatus`, where the backend asks PhonePe
   *     directly whether the payment really completed - only then is the
   *     payment marked successful and the student enrolled.
   */
  startPayment: (pkg: Package, couponCode?: string): Promise<StartedPayment> =>
    post<StartedPayment>("/students/me/payments/order", {
      packageId: pkg.id,
      courseSlug: pkg.courseSlug,
      couponCode,
    }),

  paymentStatus: (paymentId: string): Promise<PaymentStatusResult> =>
    post<PaymentStatusResult>(`/students/me/payments/${encodeURIComponent(paymentId)}/verify`, {}),
};
