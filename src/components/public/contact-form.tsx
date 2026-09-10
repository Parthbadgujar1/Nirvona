"use client";

import * as React from "react";
import { CheckCircle2, Send } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field, Input, Textarea } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { CONTACT_REASONS } from "@/data/site";

interface FormState {
  name: string;
  email: string;
  mobile: string;
  reason: string;
  message: string;
}

const EMPTY: FormState = { name: "", email: "", mobile: "", reason: "admission", message: "" };

export function ContactForm() {
  const [values, setValues] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validate() {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (values.name.trim().length < 2) next.name = "Please enter your full name.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) next.email = "Enter a valid email address.";
    if (!/^[0-9+\s-]{10,15}$/.test(values.mobile)) next.mobile = "Enter a valid 10-digit mobile number.";
    if (values.message.trim().length < 12) next.message = "Tell us a little more (at least 12 characters).";
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 1100));
    setSubmitting(false);
    setSent(true);
    setValues(EMPTY);
    toast.success("Message sent", { description: "Our team will reply within one working day." });
  }

  if (sent) {
    return (
      <Card className="flex flex-col items-center justify-center p-10 text-center">
        <span className="flex size-14 items-center justify-center rounded-2xl bg-success-50 text-success-600 ring-1 ring-success-100">
          <CheckCircle2 className="size-6" aria-hidden />
        </span>
        <h2 className="mt-5 font-display text-xl font-bold text-navy-900">Message received</h2>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-ink-500">
          Thank you for writing in. A member of the Nirvona team will reply to your email within one
          working day. For urgent examination-day issues, call us instead.
        </p>
        <Button variant="secondary" className="mt-6" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-6 lg:p-8">
      <h2 className="font-display text-xl font-bold text-navy-900">Send us a message</h2>
      <p className="mt-1.5 text-sm text-ink-500">
        All fields are required. We reply to the email address you provide.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" htmlFor="name" required error={errors.name}>
            <Input
              id="name"
              value={values.name}
              onChange={(e) => set("name", e.target.value)}
              placeholder="Aarav Sharma"
              autoComplete="name"
              invalid={Boolean(errors.name)}
            />
          </Field>
          <Field label="Mobile number" htmlFor="mobile" required error={errors.mobile}>
            <Input
              id="mobile"
              type="tel"
              value={values.mobile}
              onChange={(e) => set("mobile", e.target.value)}
              placeholder="98290 00220"
              autoComplete="tel"
              invalid={Boolean(errors.mobile)}
            />
          </Field>
        </div>

        <Field label="Email address" htmlFor="email" required error={errors.email}>
          <Input
            id="email"
            type="email"
            value={values.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            invalid={Boolean(errors.email)}
          />
        </Field>

        <Field label="What is this about?" htmlFor="reason" required>
          <Select id="reason" value={values.reason} onChange={(e) => set("reason", e.target.value)}>
            {CONTACT_REASONS.map((reason) => (
              <option key={reason.value} value={reason.value}>
                {reason.label}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Message" htmlFor="message" required error={errors.message}>
          <Textarea
            id="message"
            rows={5}
            value={values.message}
            onChange={(e) => set("message", e.target.value)}
            placeholder="Tell us what you need help with. Include your student ID or order ID if you have one."
            invalid={Boolean(errors.message)}
          />
        </Field>

        <Button type="submit" size="lg" block loading={submitting}>
          <Send />
          Send message
        </Button>
        <p className="text-center text-xs text-ink-400">
          By submitting you agree to be contacted about your enquiry.
        </p>
      </form>
    </Card>
  );
}
