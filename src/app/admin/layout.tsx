import { requireAdmin } from "@/lib/supabase/session";
import { AppShell } from "@/components/app-shell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireAdmin();
  return (
    <AppShell name={profile.full_name}>
      {children}
    </AppShell>
  );
}
