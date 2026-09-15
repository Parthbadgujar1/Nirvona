import { RegisterWizard } from "@/components/public/register-wizard";
import { usePageTitle } from "@/hooks/use-page-title";

export default function RegisterPage() {
  usePageTitle("Register", "Create your Nirvona Education Tech student account in three steps.");
  return <RegisterWizard />;
}
