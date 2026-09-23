import { LegalPage, type LegalSection } from "@/components/public/legal-page";

const SECTIONS: LegalSection[] = [
  {
    heading: "About this policy",
    body: [
      "Nirvona Education Tech Pvt. Ltd. (\"Nirvona\", \"we\") respects your privacy. This policy explains what personal information we collect through our website and student portal, why we collect it, and the choices you have.",
    ],
  },
  {
    heading: "Information we collect",
    body: [
      [
        "Registration details: name, email address, mobile number, date of birth, gender, class, school, city, state, address, and parent or guardian name and mobile number.",
        "Account information: your password, stored only in a one-way encrypted (hashed) form that we cannot read.",
        "Examination information: your test attempts, responses, scores, ranks, analytics, admit cards and attendance.",
        "Payment information: which plan you bought, the amount, coupon used and the payment status. Card, UPI and bank details are entered on the payment gateway's own page and are not stored by Nirvona.",
        "Technical information: basic device and browser information and a sign-in token stored in your browser so you stay signed in.",
        "Messages you send us through the contact form or support.",
      ],
    ],
  },
  {
    heading: "How we use your information",
    body: [
      [
        "To create and run your account and enrol you in the plans you purchase.",
        "To schedule tests, issue admit cards and examination credentials, evaluate answers and publish results and analytics.",
        "To process payments and issue receipts.",
        "To send you important updates about tests, admit cards and results by portal notification, email, SMS or WhatsApp, according to your notification preferences.",
        "To respond to your questions and provide support.",
        "To keep the platform secure, prevent misuse and improve our services.",
      ],
    ],
  },
  {
    heading: "Who we share it with",
    body: [
      "We do not sell your personal information. We share it only with service providers who help us run the Services - such as our payment gateway, and messaging and email providers - and only to the extent needed for that purpose. We may also disclose information where the law requires it or to protect the rights and safety of Nirvona, our students or others.",
      "Your examination results and rank are visible to you. Any ranking shown to other students does not reveal your personal details.",
    ],
  },
  {
    heading: "Accuracy and changes to your details",
    body: [
      "To keep examination records reliable, your registered details are locked once you register. If any detail needs correcting, send a change request from your profile; our admin will review and update it.",
    ],
  },
  {
    heading: "How long we keep it",
    body: [
      "We keep your information for as long as your account is active and as needed to provide the Services, keep examination and payment records, and meet legal and accounting obligations. Where you ask us to delete your account, we will do so unless we are required to retain certain records.",
    ],
  },
  {
    heading: "Security",
    body: [
      "We protect your information with measures such as hashed passwords, encrypted connections, role-based access controls, rate limiting against automated attacks and audit logging of administrative actions. No system is completely secure, so please keep your password private and sign out on shared devices.",
    ],
  },
  {
    heading: "Children",
    body: [
      "Many of our students are under 18. We collect their information for educational purposes with the knowledge of a parent or guardian, and we ask parents and guardians to contact us for any question about a student's information.",
    ],
  },
  {
    heading: "Your rights",
    body: [
      "You may ask us to tell you what personal information we hold about you, to correct it, or to delete your account. To make a request, use the contact details on this page or send a change request from your profile.",
    ],
  },
  {
    heading: "Cookies and local storage",
    body: [
      "We use your browser's local storage to keep you signed in and to remember simple preferences. We do not use it to track you across other websites.",
    ],
  },
  {
    heading: "Changes to this policy",
    body: [
      "We may update this policy from time to time. The latest version, with its \"last updated\" date, is always available on this page.",
    ],
  },
  {
    heading: "Contact and grievances",
    body: [
      "For any question or complaint about how we handle your information, write to us using the contact details on this page. We aim to respond within a reasonable time.",
    ],
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      eyebrow="Privacy policy"
      title="Privacy Policy"
      intro="What information Nirvona collects, why we collect it and how we protect it."
      updated="23 September 2026"
      sections={SECTIONS}
    />
  );
}
