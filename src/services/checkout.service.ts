import type { Package, Payment } from "@/types";
import type { Session } from "@/services/auth.service";
import { resolve, post, ApiError } from "./http";
import { loadRazorpayScript } from "@/lib/razorpay";

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

type CheckoutMethod = Payment["method"];

interface RazorpayOrderResponse {
  paymentId: string;
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  amountPaise: number;
  currency: string;
  summary: OrderSummary;
}

/** Shape of the payments row the backend returns (snake_case gateway
 * fields aside, everything else already matches `Payment` 1:1 except
 * the fields it can't know about - student/package display names,
 * duration - which are filled in client-side from data already on hand. */
interface BackendPaymentRow {
  id: string;
  studentId: string;
  packageId: string;
  courseSlug: string;
  total: number;
  discount: number;
  tax: number;
  amount: number;
  status: string;
  method: string;
  transactionId: string;
  date: string;
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
   * Real Razorpay Checkout flow:
   *  1. Ask the backend to create a Razorpay order (it recomputes the
   *     amount server-side from the package price - never trusts the
   *     client's `summary`).
   *  2. Open Razorpay's Checkout widget with that order.
   *  3. On success, send the payment id + signature back to the
   *     backend, which verifies it's genuine before marking the
   *     payment successful and enrolling the student.
   *
   * Rejects with an ApiError on decline, verification failure, or if
   * the user closes the widget - `checkout-client.tsx` already routes
   * any thrown error to the /payment/failed screen.
   *
   * `hooks.onOpen`/`onVerifying` let the caller distinguish "Razorpay's
   * own widget is up, waiting on the user" from "we're confirming the
   * payment server-side" - both are async, but only the second one
   * should show an app-level "processing" overlay (the widget is
   * already its own full-screen UI).
   */
  createOrder: async (
    pkg: Package,
    session: Session,
    method: CheckoutMethod,
    couponCode?: string,
    hooks?: { onOpen?: () => void; onVerifying?: () => void },
  ): Promise<Payment> => {
    const order = await post<RazorpayOrderResponse>("/students/me/payments/order", {
      packageId: pkg.id,
      courseSlug: pkg.courseSlug,
      couponCode,
    });

    await loadRazorpayScript();

    return new Promise<Payment>((resolvePromise, reject) => {
      // Razorpay lets the customer retry inside its window after a failed
      // attempt (wrong OTP, declined card, bank page "failure"), and a later
      // success still calls `handler`. So a failed attempt must NOT end the
      // checkout - remember why it failed and only report it if they close
      // the window without paying.
      let lastFailure: string | undefined;
      if (!window.Razorpay) {
        reject(new ApiError("Payment gateway failed to load.", 500, "gateway_load_failed"));
        return;
      }

      const rzp = new window.Razorpay({
        key: order.razorpayKeyId,
        amount: order.amountPaise,
        currency: order.currency,
        name: "Nirvona",
        description: `${pkg.name} - ${pkg.durationLabel ?? pkg.duration}`,
        order_id: order.razorpayOrderId,
        prefill: { name: session.name, email: session.email },
        theme: { color: "#0f1e42" },
        handler: (response) => {
          hooks?.onVerifying?.();
          post<{ payment: BackendPaymentRow }>(
            `/students/me/payments/${order.paymentId}/verify`,
            {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              method,
            },
          )
            .then(({ payment }) => {
              resolvePromise({
                id: payment.id,
                transactionId: payment.transactionId,
                studentId: payment.studentId,
                studentName: session.name,
                courseSlug: payment.courseSlug as Payment["courseSlug"],
                packageId: payment.packageId,
                packageName: pkg.name,
                duration: pkg.duration,
                amount: Number(payment.amount),
                discount: Number(payment.discount),
                tax: Number(payment.tax),
                total: Number(payment.total),
                status: "successful",
                method,
                date: payment.date.slice(0, 10),
              });
            })
            .catch(reject);
        },
        modal: {
          ondismiss: () =>
            reject(
              lastFailure
                ? new ApiError(lastFailure, 402, "payment_declined")
                : new ApiError("Payment was cancelled.", 499, "payment_cancelled"),
            ),
        },
      });

      rzp.on("payment.failed", (response) => {
        lastFailure = response.error.description || "Your bank declined the transaction.";
      });

      hooks?.onOpen?.();
      rzp.open();
    });
  },
};
