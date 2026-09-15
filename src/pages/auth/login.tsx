import { LoginForm } from "@/components/public/login-form";
import { usePageTitle } from "@/hooks/use-page-title";

export default function LoginPage() {
  usePageTitle("Login", "Sign in to your Nirvona Education Tech student or admin portal.");
  return <LoginForm />;
}
