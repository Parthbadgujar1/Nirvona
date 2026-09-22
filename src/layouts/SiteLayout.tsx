import { Outlet } from "react-router-dom";
import { Navbar } from "@/components/public/navbar";
import { Footer } from "@/components/public/footer";
import { LaunchBanner } from "@/components/public/launch-banner";

export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col bg-white">
      <LaunchBanner />
      <Navbar />
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}
