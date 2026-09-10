import Link from "next/link";
import { Lock } from "lucide-react";
import { Logo } from "@/components/brand/logo";

export default function FlowLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas">
      <header className="border-b border-ink-200 bg-white">
        <div className="container-nv flex h-16 items-center justify-between">
          <Logo size="sm" />
          <p className="flex items-center gap-1.5 text-xs font-medium text-ink-500">
            <Lock className="size-3.5 text-success-600" aria-hidden />
            Secure checkout
          </p>
        </div>
      </header>

      <main id="main" className="flex-1">{children}</main>

      <footer className="border-t border-ink-200 bg-white py-6">
        <div className="container-nv flex flex-col items-center justify-between gap-3 text-xs text-ink-500 sm:flex-row">
          <p>© {new Date().getFullYear()} Nirvona Education Tech Pvt. Ltd.</p>
          <nav className="flex gap-5">
            <Link href="/contact" className="transition-colors hover:text-navy-900">
              Refund policy
            </Link>
            <Link href="/contact" className="transition-colors hover:text-navy-900">
              Terms
            </Link>
            <Link href="/contact" className="transition-colors hover:text-navy-900">
              Support
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
