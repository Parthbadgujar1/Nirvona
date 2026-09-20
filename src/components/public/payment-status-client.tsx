"use client";

import * as React from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/shared/states";
import { LogoMark } from "@/components/brand/logo";
import { useSession } from "@/hooks/use-session";
import { checkoutService } from "@/services/checkout.service";
import { loginUrl } from "@/lib/redirect";

const POLL_MS = 3000;
/** ~2 minutes of polling: enough for a UPI request to be approved on the phone. */
const MAX_POLLS = 40;
/** Consecutive network/server errors tolerated before we stop and say so. */
const MAX_ERRORS = 4;

type Phase = "checking" | "pending-timeout" | "error" | "missing";

/**
 * Where PhonePe sends the customer back to after the payment page.
 *
 * Coming back here proves nothing (anyone can open this URL), so this page
 * never decides the outcome itself: it asks the backend, which asks PhonePe
 * server-to-server, and only then routes to the success or failed screen.
 * While PhonePe still reports the payment as pending (e.g. a UPI approval
 * that has not been completed yet) it keeps checking.
 */
export function PaymentStatusClient() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { session, hydrated } = useSession();
  const paymentId = params.get("payment") ?? "";
  const [phase, setPhase] = React.useState<Phase>(paymentId ? "checking" : "missing");
  // Bumping this restarts the polling loop ("Check again").
  const [round, setRound] = React.useState(0);

  React.useEffect(() => {
    if (hydrated && !session) {
      // The session normally survives the trip to PhonePe; if it does not,
      // sign in again and come straight back to this page.
      navigate(loginUrl(location.pathname + location.search), { replace: true });
    }
  }, [hydrated, session, navigate, location.pathname, location.search]);

  React.useEffect(() => {
    if (!paymentId || !hydrated || !session) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;
    let polls = 0;
    let errors = 0;
    setPhase("checking");

    async function check() {
      try {
        const result = await checkoutService.paymentStatus(paymentId);
        if (cancelled) return;
        errors = 0;

        if (result.status === "successful") {
          navigate(`/payment/success?order=${encodeURIComponent(result.payment.id)}`, { replace: true });
          return;
        }
        if (result.status === "failed") {
          const reason = result.reason || "The payment was not completed.";
          navigate(
            `/payment/failed?package=${encodeURIComponent(result.payment.packageId)}&reason=${encodeURIComponent(reason)}`,
            { replace: true },
          );
          return;
        }

        polls += 1;
        if (polls >= MAX_POLLS) {
          setPhase("pending-timeout");
          return;
        }
      } catch {
        if (cancelled) return;
        errors += 1;
        if (errors >= MAX_ERRORS) {
          setPhase("error");
          return;
        }
      }
      timer = setTimeout(check, POLL_MS);
    }

    void check();
    return () => {
      cancelled = true;
      if (timer) clearTimeout(timer);
    };
  }, [paymentId, hydrated, session, navigate, round]);

  if (phase === "missing") {
    return (
      <div className="container-nv py-20">
        <EmptyState
          branded
          title="No payment to confirm"
          description="This page confirms a payment after you return from PhonePe. Open your payment history to see your orders."
          action={{ label: "View payment history", href: "/student/payments" }}
          secondaryAction={{ label: "Browse packages", href: "/student/packages" }}
        />
      </div>
    );
  }

  if (phase === "pending-timeout" || phase === "error") {
    return (
      <div className="container-nv py-16">
        <Card className="mx-auto max-w-lg p-8 text-center">
          <h1 className="font-display text-2xl font-bold text-navy-900">
            {phase === "error" ? "We could not check your payment" : "Your payment is still pending"}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            {phase === "error"
              ? "We could not reach the server to confirm the payment. Nothing has been lost - check again in a moment."
              : "PhonePe has not confirmed this payment yet. If you approved it in your UPI app, it can take a minute to arrive. If money was debited, your enrolment will activate automatically once PhonePe confirms it."}
          </p>
          <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
            <Button onClick={() => setRound((n) => n + 1)}>Check again</Button>
            <Button variant="secondary" asChild>
              <Link to="/student/payments">View payment history</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container-nv flex min-h-[50vh] flex-col items-center justify-center py-16 text-center" role="status" aria-live="polite">
      <span className="relative flex size-20 items-center justify-center">
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-navy-900/10" />
        <span className="flex size-16 items-center justify-center rounded-2xl bg-white shadow-lg ring-1 ring-ink-100">
          <LogoMark size="lg" />
        </span>
      </span>
      <h1 className="mt-8 font-display text-2xl font-bold text-navy-900">Confirming your payment</h1>
      <p className="mt-2 max-w-sm text-sm text-ink-500">
        Checking with PhonePe. This usually takes a few seconds — please do not refresh or close this
        page.
      </p>
      <div className="mt-8 h-1 w-56 overflow-hidden rounded-full bg-ink-100">
        <motion.div
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
          className="h-full w-1/2 rounded-full bg-brand-ember"
        />
      </div>
    </div>
  );
}
