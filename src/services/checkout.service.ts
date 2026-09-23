import type { Package, Payment } from "@/types";
import type { Session } from "@/services/auth.service";
import { post, ApiError } from "./http";

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

export interface CouponQuote {
  code: string;
  percent: number;
  /** The server's own price breakdown with this coupon applied - exactly what will be charged. */
  summary: OrderSummary;
}

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
  /**
   * Validate an admin-issued coupon against a package. The backend owns the
   * coupon table (Admin -> Coupons) and prices the order; the response is
   * the exact breakdown that will be charged.
   */
  applyCoupon: async (code: string, packageId: string): Promise<CouponQuote> => {
    const result = await post<{ summary: OrderSummary & { couponCode: string | null; couponPercent: number } }>(
      "/students/me/payments/quote",
      { packageId, couponCode: code },
    );
    const { couponCode, couponPercent, ...summary } = result.summary;
    if (!couponCode) throw new ApiError("This coupon code is not valid.", 422, "invalid_coupon");
    return { code: couponCode, percent: couponPercent, summary };
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
