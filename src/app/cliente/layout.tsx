import { requireClient } from "@/lib/supabase/session";
import { ClientShell } from "@/components/client-shell";

export default async function ClienteLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireClient();
  return (
    <ClientShell name={profile.full_name}>
      {children}
    </ClientShell>
  );
}
