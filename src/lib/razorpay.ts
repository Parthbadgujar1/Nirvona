/**
 * Loads Razorpay's Checkout widget script on demand (it's not bundled -
 * Razorpay requires it be served from their CDN so it can be kept
 * current without an app redeploy). Cached so repeat checkouts don't
 * re-fetch it.
 */
let loadPromise: Promise<void> | null = null;

export function loadRazorpayScript(): Promise<void> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("Razorpay can only load in the browser"));
  }
  if (window.Razorpay) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loadPromise = null;
      reject(new Error("Could not load the payment gateway. Check your connection and try again."));
    };
    document.body.appendChild(script);
  });

  return loadPromise;
}

/** Minimal shape of what we pass to `new window.Razorpay(options)`. */
export interface RazorpayCheckoutOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description?: string;
  order_id: string;
  prefill?: { name?: string; email?: string; contact?: string };
  theme?: { color?: string };
  handler: (response: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }) => void;
  modal?: { ondismiss?: () => void };
}

declare global {
  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => {
      open: () => void;
      on: (event: "payment.failed", handler: (response: { error: { description: string } }) => void) => void;
    };
  }
}
