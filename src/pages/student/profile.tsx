import { ProfileView } from "@/components/student/profile-view";
import { usePageTitle } from "@/hooks/use-page-title";

export default function StudentProfilePage() {
  usePageTitle("My Profile");
  return <ProfileView />;
}
