import type { FAQ } from "@/types";

export interface Testimonial {
  quote: string;
  name: string;
  detail: string;
  result: string;
  program: string;
}

export const TESTIMONIALS: Testimonial[] = [
  {
    quote:
      "The first CBT told me something no coaching test had: I was losing 22 marks a paper to guessing, not to not knowing. Two months of discipline later my accuracy went from 71% to 89%.",
    name: "Ananya Iyer",
    detail: "Class 12 · Chennai",
    result: "Percentile 98.2",
    program: "NEET Advantage",
  },
  {
    quote:
      "Sitting the exam at an actual centre with a timer and a palette changed everything. By the fourth CBT the real interface felt boring — which is exactly what you want on exam day.",
    name: "Arjun Malhotra",
    detail: "Dropper · New Delhi",
    result: "Rank #64",
    program: "JEE Advantage",
  },
  {
    quote:
      "As a parent I finally had numbers I could understand. Score, rank, percentile and a plain-language note on what he should revise. No vague reassurance.",
    name: "Sunita Nair",
    detail: "Parent · Kochi",
    result: "Score +94 marks",
    program: "Class 11 Foundation",
  },
  {
    quote:
      "Devoter is the first time my scriptural study has been assessed with the same seriousness as a science subject. The percentile made my scholarship application credible.",
    name: "Aditya Mishra",
    detail: "Class 12 · Varanasi",
    result: "Percentile 94.6",
    program: "Devoter",
  },
  {
    quote:
      "The topic-level report ranks my weaknesses by the marks they cost. I stopped revising what felt hard and started revising what was expensive.",
    name: "Tanvi Reddy",
    detail: "Class 12 · Bengaluru",
    result: "Rank #211 → #58",
    program: "JEE Advantage",
  },
  {
    quote:
      "Admit card, credentials, seat number and centre address all arrived in the portal a week early. Nothing about exam day was a surprise.",
    name: "Riya Chauhan",
    detail: "Class 12 · Bhopal",
    result: "Score 612/720",
    program: "NEET Advantage",
  },
];

export const HOME_FAQS: FAQ[] = [
  {
    q: "Where do the examinations take place?",
    a: "Every Nirvona CBT is an offline, supervised examination held at one of our examination centres. You appear in person, sit at an allotted computer, and take the test in a proctored environment. Your centre and seat number are printed on your admit card.",
  },
  {
    q: "How is this different from an online mock test?",
    a: "An online mock is taken at home with no supervision, no cohort and no real rank. A Nirvona CBT is a scheduled examination with thousands of candidates sitting the same paper at the same time, which is what makes the rank and percentile meaningful.",
  },
  {
    q: "How soon do I get my result?",
    a: "The answer key is published within 24 hours of the examination and results are released within 72 hours. Your result includes score, rank, percentile, subject breakdown, accuracy, time analysis and topic-level performance.",
  },
  {
    q: "What are exam login credentials, and how are they different from my portal login?",
    a: "Your portal login is the email and password you use on this website. Your exam login is a separate ID and password issued only for the CBT machine in the examination hall, printed on your admit card. They are deliberately kept separate for exam security — one never grants access to the other.",
  },
  {
    q: "Can I buy a package part-way through the year?",
    a: "Yes. Packages start from the date of purchase and run for their full duration. If you join mid-session, the 3-month and 6-month packages are designed exactly for that case.",
  },
  {
    q: "Which programs offer a 2-year package?",
    a: "Class 11, JEE and NEET support up to a 24-month package because they span two academic sessions. Class 12 and Devoter are capped at 12 months, since both are single-session programs.",
  },
  {
    q: "What happens if I miss an examination?",
    a: "Your enrolment is unaffected and you keep access to the paper, the answer key and the solutions. You will not receive a rank for that CBT, since ranking requires an attempt under examination conditions.",
  },
  {
    q: "Do you provide study material?",
    a: "Nirvona is an examination and analytics platform, not a coaching institute. Our 2-year packages include a printed revision compendium, but the core product is the testing, evaluation and performance analysis around whatever you study.",
  },
];

export const CONTACT_REASONS = [
  { value: "admission", label: "Program & package enquiry" },
  { value: "payment", label: "Payment or receipt issue" },
  { value: "exam", label: "Examination, admit card or centre" },
  { value: "result", label: "Result or answer key" },
  { value: "school", label: "School / institution partnership" },
  { value: "other", label: "Something else" },
];

export const INDIAN_STATES = [
  "Andhra Pradesh", "Assam", "Bihar", "Chandigarh", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jammu & Kashmir", "Jharkhand", "Karnataka", "Kerala",
  "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Odisha", "Puducherry", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand",
  "West Bengal",
];
