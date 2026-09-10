import type { Metadata } from "next";
import { PackagesManager } from "@/components/admin/packages-manager";

export const metadata: Metadata = { title: "Packages" };

export default function AdminPackagesPage() {
  return <PackagesManager />;
}
