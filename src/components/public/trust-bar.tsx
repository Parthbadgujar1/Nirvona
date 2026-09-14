import { Building2, MonitorCheck, ShieldCheck, Timer, Users } from "lucide-react";

const POINTS = [
  { icon: Users, label: "12,842 students", detail: "across 5 programs" },
  { icon: Building2, label: "6 examination centres", detail: "in 6 states" },
  { icon: MonitorCheck, label: "NTA-style CBT interface", detail: "identical controls" },
  { icon: Timer, label: "Results in 72 hours", detail: "of every examination" },
  { icon: ShieldCheck, label: "Proctored & secure", detail: "credential-gated login" },
];

export function TrustBar() {
  return (
    <section className="border-b border-ink-200 bg-white py-8">
      <div className="container-nv">
        <p className="text-center text-xs font-semibold uppercase tracking-[0.18em] text-ink-400">
          Trusted by students, parents and schools across India
        </p>
        <ul className="mt-7 grid grid-cols-2 gap-x-6 gap-y-7 sm:grid-cols-3 lg:grid-cols-5">
          {POINTS.map(({ icon: Icon, label, detail }) => (
            <li key={label} className="flex items-start gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-700 ring-1 ring-inset ring-navy-100">
                <Icon className="size-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold leading-tight text-navy-900">
                  {label}
                </span>
                <span className="mt-0.5 block text-xs text-ink-500">{detail}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
