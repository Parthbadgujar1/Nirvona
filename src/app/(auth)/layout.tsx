import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { AuthAside } from "@/components/public/auth-aside";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)]">
      <AuthAside />

      <main id="main" className="flex min-h-dvh flex-col bg-white">
        <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4 sm:px-8 lg:border-b-0">
          <Logo size="sm" className="lg:hidden" />
          <Link
            href="/"
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-ink-500 transition-colors hover:text-navy-900"
          >
            <ArrowLeft className="size-4" aria-hidden />
            Back to website
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center px-5 py-8 sm:px-8 lg:py-12">
          <div className="w-full max-w-md lg:max-w-lg">{children}</div>
        </div>
      </main>
    </div>
  );
}
