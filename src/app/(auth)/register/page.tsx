import type { Metadata } from "next";
import { RegisterWizard } from "@/components/public/register-wizard";

export const metadata: Metadata = {
  title: "Register",
  description: "Create your Nirvona Education Tech student account in three steps.",
};

export default function RegisterPage() {
  return <RegisterWizard />;
}
