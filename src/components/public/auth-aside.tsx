import Link from "next/link";
import { BarChart3, IdCard, ShieldCheck, Trophy } from "lucide-react";
import { Logo } from "@/components/brand/logo";

const POINTS = [
  { icon: Trophy, title: "All-India rank after every CBT", body: "Your score benchmarked against every candidate who sat the same paper." },
  { icon: BarChart3, title: "Analytics you can act on", body: "Topic-level accuracy, time analysis and a ranked list of what to revise next." },
  { icon: IdCard, title: "Admit cards in your portal", body: "Centre, seat number and exam-hall credentials, published a week early." },
  { icon: ShieldCheck, title: "Separate exam credentials", body: "Your portal login never doubles as an examination login." },
];

export function AuthAside() {
  return (
    <aside className="relative hidden overflow-hidden bg-navy-950 text-white lg:flex lg:flex-col lg:justify-between">
      <div aria-hidden className="absolute inset-0 grid-backdrop-dark opacity-60" />
      <div
        aria-hidden
        className="absolute -left-24 top-1/4 size-[26rem] rounded-full bg-royal-600/25 blur-[110px]"
      />
      <div
        aria-hidden
        className="absolute -bottom-24 -right-16 size-[24rem] rounded-full bg-ember-600/20 blur-[110px]"
      />

      <div className="relative p-10 xl:p-14">
        <Logo onDark size="lg" />
      </div>

      <div className="relative px-10 xl:px-14">
        <h2 className="font-display text-3xl font-bold leading-tight text-white xl:text-[2.5rem]">
          Prepare. Test.
          <br />
          <span className="text-brand-ember">Analyze. Improve.</span>
        </h2>
        <p className="mt-5 max-w-md text-base leading-relaxed text-white/65">
          Join 12,842 students sitting real computer-based examinations at Nirvona centres across
          India.
        </p>

        <ul className="mt-10 space-y-5">
          {POINTS.map(({ icon: Icon, title, body }) => (
            <li key={title} className="flex gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-white/8 ring-1 ring-inset ring-white/15">
                <Icon className="size-[18px] text-saffron-300" aria-hidden />
              </span>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="mt-1 text-sm leading-relaxed text-white/55">{body}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="relative p-10 xl:p-14">
        <div className="rounded-xl bg-white/[0.05] p-5 ring-1 ring-inset ring-white/10">
          <p className="text-sm leading-relaxed text-white/70">
            &ldquo;By the fourth CBT the real interface felt boring — which is exactly what you want
            on exam day.&rdquo;
          </p>
          <p className="mt-3 text-xs font-semibold text-white">
            Arjun Malhotra
            <span className="ml-2 font-normal text-white/45">JEE · Rank #64</span>
          </p>
        </div>
        <p className="mt-6 text-xs text-white/40">
          Need help?{" "}
          <Link href="/contact" className="underline transition-colors hover:text-white">
            Contact support
          </Link>
        </p>
      </div>
    </aside>
  );
}
