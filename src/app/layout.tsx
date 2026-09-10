import type { Metadata, Viewport } from "next";
import { Inter, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-jakarta",
  weight: ["500", "600", "700", "800"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Nirvona Education Tech — Prepare. Test. Analyze. Improve.",
    template: "%s · Nirvona Education Tech",
  },
  description:
    "India's next-generation examination and performance platform for ambitious students. Computer-based tests, all-India ranking and detailed performance analytics.",
  keywords: [
    "CBT exam", "JEE mock test", "NEET mock test", "Class 11", "Class 12",
    "online examination platform", "Nirvona Education Tech",
  ],
  icons: { icon: "/brand/nirvona-logo.svg" },
  openGraph: {
    title: "Nirvona Education Tech",
    description:
      "India's next-generation examination and performance platform for ambitious students.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0e1d4a",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jakarta.variable}`}>
      <body className="min-h-dvh antialiased">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-navy-900 focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-white"
        >
          Skip to main content
        </a>
        <TooltipProvider delayDuration={200}>{children}</TooltipProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            classNames: {
              toast:
                "!rounded-xl !border !border-ink-200 !bg-white !shadow-lg !font-sans !text-navy-900",
              description: "!text-ink-500",
              actionButton: "!bg-navy-900 !text-white !rounded-md",
            },
          }}
        />
      </body>
    </html>
  );
}
