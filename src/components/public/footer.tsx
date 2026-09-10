import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Logo } from "@/components/brand/logo";
import { COURSES } from "@/data/courses";

const COLUMNS = [
  {
    title: "Programs",
    links: COURSES.map((course) => ({
      label: course.shortName,
      href: `/courses/${course.slug}`,
    })),
  },
  {
    title: "Platform",
    links: [
      { label: "How CBT works", href: "/cbt" },
      { label: "Packages & pricing", href: "/packages" },
      { label: "Student portal", href: "/student/dashboard" },
      { label: "Admin portal", href: "/admin/dashboard" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About Nirvona", href: "/about" },
      { label: "Contact us", href: "/contact" },
      { label: "FAQs", href: "/faqs" },
      { label: "Register", href: "/register" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t border-navy-800/40 bg-navy-950 text-white/70">
      <div className="container-nv py-14 lg:py-16">
        <div className="grid gap-12 lg:grid-cols-[1.4fr_2fr]">
          <div>
            <Logo onDark size="md" />
            <p className="mt-5 max-w-sm text-sm leading-relaxed">
              India&apos;s next-generation examination and performance platform. Computer-based
              testing, transparent results and analytics that tell students exactly what to do next.
            </p>
            <ul className="mt-6 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <MapPin className="mt-0.5 size-4 shrink-0 text-saffron-400" aria-hidden />
                <span>
                  Nirvona Education Tech Pvt. Ltd.
                  <br />
                  Malviya Nagar, Jaipur, Rajasthan 302017
                </span>
              </li>
              <li className="flex items-center gap-2.5">
                <Phone className="size-4 shrink-0 text-saffron-400" aria-hidden />
                <a href="tel:+911414002200" className="transition-colors hover:text-white">
                  +91 141 400 2200
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail className="size-4 shrink-0 text-saffron-400" aria-hidden />
                <a href="mailto:support@nirvona.edu.in" className="transition-colors hover:text-white">
                  support@nirvona.edu.in
                </a>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            {COLUMNS.map((column) => (
              <div key={column.title}>
                <h3 className="font-display text-sm font-semibold text-white">{column.title}</h3>
                <ul className="mt-4 space-y-2.5">
                  {column.links.map((link) => (
                    <li key={link.href}>
                      <Link
                        href={link.href}
                        className="text-sm transition-colors hover:text-white"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs">
            © {new Date().getFullYear()} Nirvona Education Tech Pvt. Ltd. All rights reserved.
          </p>
          <ul className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <li>
              <Link href="/faqs" className="transition-colors hover:text-white">
                Help centre
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-white">
                Privacy policy
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-white">
                Terms of service
              </Link>
            </li>
            <li>
              <Link href="/contact" className="transition-colors hover:text-white">
                Refund policy
              </Link>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
