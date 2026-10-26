import type { Metadata } from "next";
import { AdminPage } from "@/components/admin/AdminPage";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { requireAdmin } from "@/lib/auth";
import { getBusiness } from "@/lib/data";

export const metadata: Metadata = { title: "Settings" };

export default async function SettingsPage() {
  await requireAdmin("/admin/settings");
  const business = await getBusiness();

  return (
    <AdminPage title="Settings" back={{ href: "/", label: "Invoices" }}>
      <SettingsForm initial={business} />
    </AdminPage>
  );
}
