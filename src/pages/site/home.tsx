import { Hero } from "@/components/public/hero";
import { TrustBar } from "@/components/public/trust-bar";
import { WhyNirvona } from "@/components/public/why-nirvona";
import { ProgramsSection } from "@/components/public/programs-section";
import { HowItWorks } from "@/components/public/how-it-works";
import { CbtExplainer } from "@/components/public/cbt-explainer";
import { AnalyticsPreview } from "@/components/public/analytics-preview";
import { UpcomingExams } from "@/components/public/upcoming-exams";
import { Testimonials } from "@/components/public/testimonials";
import { FaqSection } from "@/components/public/faq-section";
import { FinalCta } from "@/components/public/final-cta";
import { HOME_FAQS } from "@/data/site";
import { useEffect } from "react";

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
      <AnalyticsPreview />
      <UpcomingExams />
      <Testimonials />
      <FaqSection faqs={HOME_FAQS.slice(0, 6)} />
      <FinalCta />
    </>
  );
}
