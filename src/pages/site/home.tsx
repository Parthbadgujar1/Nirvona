import { Hero } from "@/components/public/hero";
import { TrustBar } from "@/components/public/trust-bar";
import { WhyNirvona } from "@/components/public/why-nirvona";
import { ProgramsSection } from "@/components/public/programs-section";
import { HowItWorks } from "@/components/public/how-it-works";
import { CbtExplainer } from "@/components/public/cbt-explainer";
import { OnView } from "@/components/shared/on-view";
import { UpcomingExams } from "@/components/public/upcoming-exams";
import { Testimonials } from "@/components/public/testimonials";
import { FaqSection } from "@/components/public/faq-section";
import { FinalCta } from "@/components/public/final-cta";
import { HOME_FAQS } from "@/data/site";
import { lazy, Suspense, useEffect } from "react";

// Pulls in the whole charts library (~125 kB gzipped) - only fetched when the
// section is about to scroll into view, not for every visitor on page load.
const AnalyticsPreview = lazy(() =>
  import("@/components/public/analytics-preview").then((m) => ({ default: m.AnalyticsPreview })),
);

export default function HomePage() {
  // The home page's title is the site's own full brand title (matching
  // index.html's default <title>), not "<page> · Nirvona ..." like
  // every other page - usePageTitle always appends that suffix, so
  // this sets it directly instead.
  useEffect(() => {
    document.title = "Nirvona Education Tech — Prepare. Test. Analyze. Improve.";
  }, []);
  return (
    <>
      <Hero />
      <TrustBar />
      <WhyNirvona />
      <ProgramsSection />
      <HowItWorks />
      <CbtExplainer />
      <OnView minHeight={640}>
        <Suspense fallback={<div style={{ minHeight: 640 }} />}>
          <AnalyticsPreview />
        </Suspense>
      </OnView>
      <UpcomingExams />
      <Testimonials />
      <FaqSection faqs={HOME_FAQS.slice(0, 6)} />
      <FinalCta />
    </>
  );
}
