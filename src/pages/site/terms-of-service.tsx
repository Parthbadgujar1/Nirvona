import { LegalPage, type LegalSection } from "@/components/public/legal-page";

const SECTIONS: LegalSection[] = [
  {
    heading: "Acceptance of these terms",
    body: [
      "These Terms of Service govern your use of the Nirvona website, student portal and test-series services (together, the \"Services\") provided by Nirvona Education Tech Pvt. Ltd. (\"Nirvona\", \"we\", \"us\"). By registering, purchasing a plan or using the Services you agree to these terms, our Privacy Policy and our Refund Policy.",
    ],
  },
  {
    heading: "Eligibility and accounts",
    body: [
      "You must provide accurate and complete information when you register. If you are under 18, you must use the Services with the knowledge and consent of a parent or guardian.",
      [
        "You are responsible for keeping your password and any examination-hall credentials confidential. Do not share them with anyone.",
        "Your registered details (name, date of birth, contact details and so on) are locked once you register. If something needs correcting, send a change request from your profile and the admin will review it.",
        "You are responsible for all activity carried out through your account.",
      ],
    ],
  },
  {
    heading: "Plans, tests and schedule",
    body: [
      "Each plan gives you access to the tests listed in its published schedule that are still to be conducted on the date of your purchase. Test dates, patterns, modes and chapter coverage may be revised by Nirvona; the latest information is always shown on the Test Schedule page and in your student portal.",
      "Your admit card is the final authority on your test date, reporting time and centre. Tests are conducted at the centre and in the mode (computer-based or OMR) stated for that test.",
    ],
  },
  {
    heading: "Prices, payments and coupons",
    body: [
      "Prices are shown in Indian Rupees and GST is added at checkout. Payments are processed securely by our payment partner; Nirvona does not store your card, UPI or bank details.",
      "Coupon codes are issued personally by Nirvona, are for the named recipient, and cannot be sold, shared publicly or combined unless we say so. We may withdraw a coupon that is misused.",
      "All purchases are subject to our Refund Policy. In short, purchases are final and non-refundable.",
    ],
  },
  {
    heading: "Examination conduct",
    body: [
      "You agree to follow the instructions of the invigilators and the examination rules printed on your admit card. Carry the required photo identification.",
      [
        "Do not copy, impersonate, use unfair means or help another candidate.",
        "Do not photograph, record, copy or share question papers, answer keys or any test material.",
        "Do not interfere with the computers, network or software at the examination centre.",
      ],
      "Nirvona may cancel a candidate's attempt, withhold a result or suspend an account where these rules are broken.",
    ],
  },
  {
    heading: "Intellectual property",
    body: [
      "All content on the Services - including question papers, answer keys, solutions, analytics, text, logos and software - belongs to Nirvona or its licensors and is protected by law. You receive a personal, non-transferable right to use it for your own preparation. You may not reproduce, distribute, sell or publish it without our written permission.",
    ],
  },
  {
    heading: "Acceptable use",
    body: [
      "You must not attempt to gain unauthorised access to the Services, other users' accounts or our systems, introduce malicious code, overload the platform, or use automated tools to scrape or copy content.",
    ],
  },
  {
    heading: "Suspension and termination",
    body: [
      "We may suspend or terminate access to the Services, without refund, if you breach these terms, misuse the platform or provide false information.",
    ],
  },
  {
    heading: "Disclaimer and limitation of liability",
    body: [
      "Nirvona provides test-series and practice services to help you prepare. We do not guarantee any particular score, rank, selection or admission.",
      "To the fullest extent permitted by law, Nirvona is not liable for indirect or consequential loss, or for interruptions caused by events beyond our reasonable control (such as power, network or payment-gateway failures). Our total liability in connection with the Services is limited to the amount you paid for the plan concerned.",
    ],
  },
  {
    heading: "Changes to these terms",
    body: [
      "We may update these terms from time to time. The updated version will be posted here with a new \"last updated\" date, and continued use of the Services means you accept the changes.",
    ],
  },
  {
    heading: "Governing law and contact",
    body: [
      "These terms are governed by the laws of India. Courts at Chhatrapati Sambhajinagar, Maharashtra have exclusive jurisdiction over any dispute, subject to applicable law.",
      "For any question about these terms, write to us using the contact details on this page.",
    ],
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalPage
      eyebrow="Terms of service"
      title="Terms of Service"
      intro="The rules for using the Nirvona website, student portal and test-series services."
      updated="23 September 2026"
      sections={SECTIONS}
    />
  );
}
