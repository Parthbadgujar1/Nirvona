import type { Metadata } from "next";
import { LoginForm } from "@/components/public/login-form";

export const metadata: Metadata = {
  title: "Login",
  description: "Sign in to your Nirvona Education Tech student or admin portal.",
};

export default function LoginPage() {
  return <LoginForm />;
}
