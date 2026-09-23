import { LegalPage, type LegalSection } from "@/components/public/legal-page";

const SECTIONS: LegalSection[] = [
  {
    heading: "No refunds",
    body: [
      "All purchases made on Nirvona - including test-series packages, plans and any add-ons - are final. Once a payment has been completed successfully and your enrolment is active, the fee paid is non-refundable and non-transferable.",
      "This applies regardless of how many tests you attend, when you join, or whether you later change your mind, your course, your exam or your city. By completing a purchase you confirm that you have read and accepted this policy.",
    ],
  },
  {
    heading: "Joining part-way through the session",
    body: [
      "Every plan includes the tests that are still to be conducted on the day you purchase it. Tests that have already been held before your purchase are not part of your plan, and the number of tests shown on a plan is always the number of tests remaining.",
      "Because of this, no refund, credit or pro-rata adjustment is given for tests conducted before you enrol.",
    ],
  },
  {
    heading: "Missed, rescheduled or unattended tests",
    body: [
      "No refund or credit is given if you miss a test, cannot attend on the scheduled day, or choose not to appear for any reason.",
      "If a test is postponed or rescheduled by Nirvona, your enrolment continues and you can attend the test on the revised date. Revised dates are published on the Test Schedule page and in your student portal.",
    ],
  },
  {
    heading: "Coupons and discounts",
    body: [
      "Discounts and coupon codes reduce the price you pay at the time of purchase. Coupons have no cash value, cannot be exchanged or transferred, and the discount is not refundable.",
    ],
  },
  {
    heading: "Payment failures and duplicate charges",
    body: [
      "This is not a refund of a completed purchase. If money is debited from your account but your enrolment is not activated, or if you are charged more than once for the same order, the amount is reversed to your original payment method by the payment gateway and your bank, normally within 5 to 7 working days.",
      "If the amount does not return within that time, contact us with your order ID, the transaction reference and the date and time of the payment, and we will help you trace it with the payment gateway.",
    ],
  },
  {
    heading: "Before you purchase",
    body: [
      "Please review the plan, its test schedule and the chapters each test covers on the Test Schedule page before you pay. If you have any question about which plan is right for you, contact us first - we are happy to help you choose.",
    ],
  },
  {
    heading: "Contact us",
    body: [
      "For any question about this policy or a payment, write to us at the email address or call the number shown on this page. Please quote your Student ID and order ID.",
    ],
  },
];

export default function RefundPolicyPage() {
  return (
    <LegalPage
      eyebrow="Refund policy"
      title="Refund & Cancellation Policy"
      intro="Please read this policy before you purchase a plan on Nirvona."
      updated="23 September 2026"
      highlight="All purchases are final. No refunds are allowed once a payment is completed and the plan is activated."
      sections={SECTIONS}
    />
  );
}
