"use client";

import * as React from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Eye, EyeOff, LogIn, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert } from "@/components/ui/alert";
import { useSession } from "@/hooks/use-session";
import { safeNext } from "@/lib/redirect";

export function LoginForm() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  // Where the visitor was headed before being asked to sign in (e.g. a
  // checkout for a specific package) - previously ignored, so signing in
  // always dropped them on the dashboard and the package they picked was lost.
  const returnTo = safeNext(params.get("next"), "");
  const { signIn } = useSession();
  const [identifier, setIdentifier] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [reveal, setReveal] = React.useState(false);
  const [errors, setErrors] = React.useState<{ identifier?: string; password?: string }>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [formError, setFormError] = React.useState<string>();

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const next: typeof errors = {};
    if (!identifier.trim()) next.identifier = "Enter your registered email or mobile number.";
    if (password.length < 4) next.password = "Password must be at least 4 characters.";
    setErrors(next);
    if (Object.keys(next).length) return;

    setSubmitting(true);
    setFormError(undefined);
    try {
      const session = await signIn(identifier, password);
      toast.success(`Welcome back, ${session.name.split(" ")[0]}`);
      const isAdminPath = returnTo.startsWith("/admin");
      if (session.role === "admin") {
        navigate(isAdminPath ? returnTo : "/admin/dashboard");
      } else {
        navigate(returnTo && !isAdminPath ? returnTo : "/student/dashboard");
      }
    } catch (error) {
      setFormError(error instanceof Error ? error.message : "Unable to sign in.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">Welcome back</h1>
      <p className="mt-2 text-sm text-ink-500">
        Sign in to view your programs, admit cards, results and performance analytics.
      </p>

      {formError && (
        <Alert tone="danger" className="mt-6" title="Sign-in failed">
          {formError}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate className="mt-8 space-y-5">
        <Field
          label="Email or mobile number"
          htmlFor="identifier"
          required
          error={errors.identifier}
        >
          <Input
            id="identifier"
            value={identifier}
            onChange={(e) => {
              setIdentifier(e.target.value);
              setErrors((p) => ({ ...p, identifier: undefined }));
            }}
            placeholder="you@example.com"
            autoComplete="username"
            leading={<Mail />}
            invalid={Boolean(errors.identifier)}
          />
        </Field>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label htmlFor="password" className="text-sm font-medium text-ink-700">
              Password<span className="ml-0.5 text-ember-600">*</span>
            </label>
            <Link
              to="/contact"
              className="rounded text-xs font-semibold text-royal-700 transition-colors hover:text-royal-800"
            >
              Forgot password?
            </Link>
          </div>
          <Input
            id="password"
            type={reveal ? "text" : "password"}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((p) => ({ ...p, password: undefined }));
            }}
            placeholder="••••••••"
            autoComplete="current-password"
            invalid={Boolean(errors.password)}
            trailing={
              <button
                type="button"
                onClick={() => setReveal((r) => !r)}
                aria-label={reveal ? "Hide password" : "Show password"}
                className="rounded p-0.5 transition-colors hover:text-navy-900"
              >
                {reveal ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
          {errors.password && (
            <p role="alert" className="mt-1.5 text-xs font-medium text-danger-600">
              {errors.password}
            </p>
          )}
        </div>

        <div className="flex items-center gap-2.5">
          <Checkbox
            id="remember"
            checked={remember}
            onCheckedChange={(v) => setRemember(v === true)}
          />
          <label htmlFor="remember" className="cursor-pointer text-sm text-ink-600">
            Keep me signed in on this device
          </label>
        </div>

        <Button type="submit" size="lg" block loading={submitting}>
          <LogIn />
          Login
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Don&apos;t have an account?{" "}
        <Link
          to={returnTo ? `/register?next=${encodeURIComponent(returnTo)}` : "/register"}
          className="font-semibold text-ember-600 hover:text-ember-700"
        >
          Register
        </Link>
      </p>
    </div>
  );
}
