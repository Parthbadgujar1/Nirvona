"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft, ArrowRight, CheckCircle2, Eye, EyeOff, Mail, Phone, UserPlus,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Steps, ProgressBar } from "@/components/ui/progress";
import { Alert } from "@/components/ui/alert";
import { COURSES } from "@/data/courses";
import { INDIAN_STATES } from "@/data/site";
import { authService } from "@/services/auth.service";

const STEPS = [
  { label: "Personal", description: "Who you are" },
  { label: "Academic", description: "What you study" },
  { label: "Account", description: "Secure your login" },
];

interface FormState {
  fullName: string;
  mobile: string;
  email: string;
  dateOfBirth: string;
  className: string;
  school: string;
  city: string;
  state: string;
  examPreference: string;
  password: string;
  confirmPassword: string;
  terms: boolean;
}

const EMPTY: FormState = {
  fullName: "", mobile: "", email: "", dateOfBirth: "",
  className: "Class 11", school: "", city: "", state: "",
  examPreference: "jee", password: "", confirmPassword: "", terms: false,
};

type Errors = Partial<Record<keyof FormState, string>>;

function passwordScore(password: string) {
  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;
  return score;
}

export function RegisterWizard() {
  const router = useRouter();
  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState<FormState>(EMPTY);
  const [errors, setErrors] = React.useState<Errors>({});
  const [submitting, setSubmitting] = React.useState(false);
  const [reveal, setReveal] = React.useState(false);
  const [done, setDone] = React.useState<string | null>(null);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function validateStep(index: number): boolean {
    const next: Errors = {};
    if (index === 0) {
      if (values.fullName.trim().length < 3) next.fullName = "Enter your full name as on your school records.";
      if (!/^[0-9+\s-]{10,15}$/.test(values.mobile)) next.mobile = "Enter a valid 10-digit mobile number.";
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(values.email)) next.email = "Enter a valid email address.";
      if (!values.dateOfBirth) next.dateOfBirth = "Date of birth is required.";
      else {
        const age = (Date.now() - new Date(values.dateOfBirth).getTime()) / 31557600000;
        if (age < 12 || age > 40) next.dateOfBirth = "Enter a date of birth between 12 and 40 years of age.";
      }
    }
    if (index === 1) {
      if (values.school.trim().length < 3) next.school = "Enter your school or institution name.";
      if (values.city.trim().length < 2) next.city = "Enter your city.";
      if (!values.state) next.state = "Select your state.";
    }
    if (index === 2) {
      if (passwordScore(values.password) < 3)
        next.password = "Use at least 8 characters with a capital letter and a number.";
      if (values.password !== values.confirmPassword)
        next.confirmPassword = "Passwords do not match.";
      if (!values.terms) next.terms = "Please accept the terms to continue.";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!validateStep(2)) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await authService.register({ ...values, password: undefined });
      setDone(result.studentId);
      toast.success("Account created", { description: `Your student ID is ${result.studentId}` });
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
        className="text-center"
      >
        <span className="mx-auto flex size-16 items-center justify-center rounded-2xl bg-success-50 text-success-600 ring-1 ring-success-100">
          <CheckCircle2 className="size-8" aria-hidden />
        </span>
        <h1 className="mt-6 font-display text-3xl font-bold text-navy-900">
          Welcome to Nirvona, {values.fullName.split(" ")[0]}
        </h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-500">
          Your account is ready. Your student ID is shown below — you will need it for admit cards,
          examinations and support requests.
        </p>
        <div className="mx-auto mt-6 max-w-xs rounded-xl border border-ink-200 bg-canvas p-4">
          <p className="text-2xs font-bold uppercase tracking-wider text-ink-400">Student ID</p>
          <p className="mt-1 font-display text-xl font-bold tracking-tight text-navy-900">{done}</p>
        </div>
        <div className="mt-8 grid gap-2 sm:grid-cols-2">
          <Button size="lg" onClick={() => router.push("/courses")}>
            Choose a program
            <ArrowRight />
          </Button>
          <Button variant="secondary" size="lg" onClick={() => router.push("/student/dashboard")}>
            Go to dashboard
          </Button>
        </div>
      </motion.div>
    );
  }

  const score = passwordScore(values.password);
  const scoreTone = score >= 4 ? "success" : score === 3 ? "warning" : "danger";

  return (
    <div>
      <h1 className="font-display text-3xl font-bold tracking-tight text-navy-900">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-ink-500">
        Three short steps. You can choose a program and package after registering.
      </p>

      <Steps steps={STEPS} current={step} className="mt-8" />
      <ProgressBar
        value={((step + 1) / STEPS.length) * 100}
        size="xs"
        tone="ember"
        className="mt-5"
        label={`Step ${step + 1} of ${STEPS.length}`}
      />

      <form
        onSubmit={handleSubmit}
        noValidate
        className="mt-8"
        onKeyDown={(e) => {
          if (e.key === "Enter" && step < 2) {
            e.preventDefault();
            goNext();
          }
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 16 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -16 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="space-y-4"
          >
            {step === 0 && (
              <>
                <Field label="Full name" htmlFor="fullName" required error={errors.fullName}>
                  <Input
                    id="fullName"
                    value={values.fullName}
                    onChange={(e) => set("fullName", e.target.value)}
                    placeholder="Aarav Sharma"
                    autoComplete="name"
                    invalid={Boolean(errors.fullName)}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Mobile number" htmlFor="mobile" required error={errors.mobile}>
                    <Input
                      id="mobile"
                      type="tel"
                      value={values.mobile}
                      onChange={(e) => set("mobile", e.target.value)}
                      placeholder="98290 00220"
                      autoComplete="tel"
                      leading={<Phone />}
                      invalid={Boolean(errors.mobile)}
                    />
                  </Field>
                  <Field
                    label="Date of birth"
                    htmlFor="dob"
                    required
                    error={errors.dateOfBirth}
                  >
                    <Input
                      id="dob"
                      type="date"
                      value={values.dateOfBirth}
                      onChange={(e) => set("dateOfBirth", e.target.value)}
                      invalid={Boolean(errors.dateOfBirth)}
                    />
                  </Field>
                </div>
                <Field
                  label="Email address"
                  htmlFor="email"
                  required
                  error={errors.email}
                  hint="Results, admit cards and receipts are sent here."
                >
                  <Input
                    id="email"
                    type="email"
                    value={values.email}
                    onChange={(e) => set("email", e.target.value)}
                    placeholder="you@example.com"
                    autoComplete="email"
                    leading={<Mail />}
                    invalid={Boolean(errors.email)}
                  />
                </Field>
              </>
            )}

            {step === 1 && (
              <>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Current class" htmlFor="className" required>
                    <Select
                      id="className"
                      value={values.className}
                      onChange={(e) => set("className", e.target.value)}
                    >
                      {["Class 11", "Class 12", "Dropper", "Other"].map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Exam preference" htmlFor="examPreference" required>
                    <Select
                      id="examPreference"
                      value={values.examPreference}
                      onChange={(e) => set("examPreference", e.target.value)}
                    >
                      {COURSES.map((course) => (
                        <option key={course.slug} value={course.slug}>
                          {course.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Field label="School / institution" htmlFor="school" required error={errors.school}>
                  <Input
                    id="school"
                    value={values.school}
                    onChange={(e) => set("school", e.target.value)}
                    placeholder="Vidya Bhawan Sr. Sec. School"
                    invalid={Boolean(errors.school)}
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="City" htmlFor="city" required error={errors.city}>
                    <Input
                      id="city"
                      value={values.city}
                      onChange={(e) => set("city", e.target.value)}
                      placeholder="Jaipur"
                      autoComplete="address-level2"
                      invalid={Boolean(errors.city)}
                    />
                  </Field>
                  <Field label="State" htmlFor="state" required error={errors.state}>
                    <Select
                      id="state"
                      value={values.state}
                      onChange={(e) => set("state", e.target.value)}
                      invalid={Boolean(errors.state)}
                    >
                      <option value="">Select your state</option>
                      {INDIAN_STATES.map((state) => (
                        <option key={state} value={state}>
                          {state}
                        </option>
                      ))}
                    </Select>
                  </Field>
                </div>
                <Alert tone="neutral">
                  Your city and state determine which examination centres are offered to you when
                  you enrol.
                </Alert>
              </>
            )}

            {step === 2 && (
              <>
                <Field
                  label="Password"
                  htmlFor="password"
                  required
                  error={errors.password}
                  hint="At least 8 characters, with one capital letter and one number."
                >
                  <Input
                    id="password"
                    type={reveal ? "text" : "password"}
                    value={values.password}
                    onChange={(e) => set("password", e.target.value)}
                    autoComplete="new-password"
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
                </Field>

                {values.password && (
                  <div>
                    <ProgressBar
                      value={score * 25}
                      size="xs"
                      tone={scoreTone}
                      label="Password strength"
                    />
                    <p className="mt-1.5 text-xs text-ink-500">
                      Strength:{" "}
                      <span className="font-semibold text-navy-900">
                        {["Very weak", "Weak", "Fair", "Good", "Strong"][score]}
                      </span>
                    </p>
                  </div>
                )}

                <Field
                  label="Confirm password"
                  htmlFor="confirmPassword"
                  required
                  error={errors.confirmPassword}
                >
                  <Input
                    id="confirmPassword"
                    type={reveal ? "text" : "password"}
                    value={values.confirmPassword}
                    onChange={(e) => set("confirmPassword", e.target.value)}
                    autoComplete="new-password"
                    invalid={Boolean(errors.confirmPassword)}
                  />
                </Field>

                <div>
                  <div className="flex items-start gap-2.5">
                    <Checkbox
                      id="terms"
                      checked={values.terms}
                      onCheckedChange={(v) => set("terms", v === true)}
                      aria-describedby="terms-error"
                    />
                    <label htmlFor="terms" className="cursor-pointer text-sm leading-relaxed text-ink-600">
                      I agree to the{" "}
                      <Link href="/contact" className="font-semibold text-royal-700 hover:underline">
                        terms of service
                      </Link>{" "}
                      and{" "}
                      <Link href="/contact" className="font-semibold text-royal-700 hover:underline">
                        privacy policy
                      </Link>
                      .
                    </label>
                  </div>
                  {errors.terms && (
                    <p id="terms-error" role="alert" className="mt-1.5 text-xs font-medium text-danger-600">
                      {errors.terms}
                    </p>
                  )}
                </div>

                <Alert tone="info" title="About your login">
                  This password signs you in to the Nirvona website. Examination-hall credentials are
                  issued separately on each admit card and are never the same as this password.
                </Alert>
              </>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="mt-8 flex items-center gap-3">
          {step > 0 && (
            <Button type="button" variant="secondary" size="lg" onClick={() => setStep((s) => s - 1)}>
              <ArrowLeft />
              Back
            </Button>
          )}
          {step < STEPS.length - 1 ? (
            <Button type="button" size="lg" className="flex-1" onClick={goNext}>
              Continue
              <ArrowRight />
            </Button>
          ) : (
            <Button type="submit" size="lg" className="flex-1" loading={submitting}>
              <UserPlus />
              Create account
            </Button>
          )}
        </div>
      </form>

      <p className="mt-6 text-center text-sm text-ink-500">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-ember-600 hover:text-ember-700">
          Login
        </Link>
      </p>
    </div>
  );
}
