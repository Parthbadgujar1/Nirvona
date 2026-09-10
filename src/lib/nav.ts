import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard, User, GraduationCap, ClipboardList, IdCard, Trophy,
  BarChart3, Receipt, Bell, LifeBuoy, Users, ShoppingCart, BookOpen,
  Boxes, CalendarClock, Building2, KeyRound, FileCheck2, FileSpreadsheet,
  Award, PieChart, FileBarChart, Settings, ListChecks,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  group?: string;
}

export const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "My Profile", href: "/student/profile", icon: User, group: "Overview" },
  { label: "My Programs", href: "/student/programs", icon: GraduationCap, group: "Learning" },
  { label: "My Exams", href: "/student/exams", icon: ClipboardList, group: "Learning" },
  { label: "Admit Card", href: "/student/admit-card", icon: IdCard, group: "Learning" },
  { label: "Results", href: "/student/results", icon: Trophy, group: "Performance" },
  { label: "Answer Key", href: "/student/answer-key", icon: ListChecks, group: "Performance" },
  { label: "Performance", href: "/student/performance", icon: BarChart3, group: "Performance" },
  { label: "Payments & Receipts", href: "/student/payments", icon: Receipt, group: "Account" },
  { label: "Notifications", href: "/student/notifications", icon: Bell, group: "Account" },
  { label: "Help & Support", href: "/student/support", icon: LifeBuoy, group: "Account" },
];

export const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard, group: "Overview" },
  { label: "Students", href: "/admin/students", icon: Users, group: "People" },
  { label: "Purchases", href: "/admin/purchases", icon: ShoppingCart, group: "People" },
  { label: "Courses", href: "/admin/courses", icon: BookOpen, group: "Catalogue" },
  { label: "Packages", href: "/admin/packages", icon: Boxes, group: "Catalogue" },
  { label: "Exams", href: "/admin/exams", icon: CalendarClock, group: "Examinations" },
  { label: "Exam Centres", href: "/admin/exam-centres", icon: Building2, group: "Examinations" },
  { label: "Exam Credentials", href: "/admin/exam-credentials", icon: KeyRound, group: "Examinations" },
  { label: "Admit Cards", href: "/admin/admit-cards", icon: IdCard, group: "Examinations" },
  { label: "Answer Keys", href: "/admin/answer-keys", icon: FileCheck2, group: "Evaluation" },
  { label: "Student Responses", href: "/admin/responses", icon: FileSpreadsheet, group: "Evaluation" },
  { label: "Results", href: "/admin/results", icon: Award, group: "Evaluation" },
  { label: "Analytics", href: "/admin/analytics", icon: PieChart, group: "Insights" },
  { label: "Reports", href: "/admin/reports", icon: FileBarChart, group: "Insights" },
  { label: "Notifications", href: "/admin/notifications", icon: Bell, group: "Insights" },
  { label: "Settings", href: "/admin/settings", icon: Settings, group: "System" },
];

export const publicNav = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "CBT Exams", href: "/cbt" },
  { label: "Programs", href: "/courses" },
  { label: "Packages", href: "/packages" },
  { label: "FAQs", href: "/faqs" },
  { label: "Contact", href: "/contact" },
];
