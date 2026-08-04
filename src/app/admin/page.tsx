import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { Profile } from "@/lib/types";
import { todayLocal } from "@/lib/date";
import { membershipStatus } from "@/lib/payments";
import { CreateClientForm } from "./create-client-form";

const MEMBERSHIP_LABEL: Record<string, string> = {
  activo: "Activo",
  vencido: "Vencido",
  sin_pago: "Sin pagos",
};

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const [{ data: clientes }, { data: payments }] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "cliente")
      .order("full_name", { ascending: true })
      .returns<Profile[]>(),
    supabase
      .from("payments")
      .select("client_id, fecha_vencimiento")
      .order("fecha_vencimiento", { ascending: false })
      .returns<{ client_id: string; fecha_vencimiento: string }[]>(),
  ]);

  const latestVencimiento = new Map<string, string>();
  for (const p of payments ?? []) {
    if (!latestVencimiento.has(p.client_id)) {
      latestVencimiento.set(p.client_id, p.fecha_vencimiento);
    }
  }
  const today = todayLocal();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Crea cuentas y administra los planes de cada cliente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta de cliente</CardTitle>
          <CardDescription>Le compartes el usuario y contraseña para que entre a ver su plan.</CardDescription>
        </CardHeader>
        <CardContent>
          <CreateClientForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Todos los clientes ({clientes?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {(clientes ?? []).map((c) => {
            const status = membershipStatus(latestVencimiento.get(c.id), today);
            return (
              <Link
                key={c.id}
                href={`/admin/clientes/${c.id}`}
                className="flex items-center justify-between gap-3 rounded-md border p-3 text-sm transition-colors hover:bg-muted"
              >
                <div className="flex flex-col">
                  <span className="font-medium">{c.full_name ?? "Sin nombre"}</span>
                  <span className="text-muted-foreground">
                    {c.username ? `@${c.username}` : "Sin usuario"}
                    {c.objetivo ? ` · ${c.objetivo}` : ""}
                  </span>
                </div>
                <Badge variant={status === "activo" ? "default" : status === "vencido" ? "destructive" : "secondary"}>
                  {MEMBERSHIP_LABEL[status]}
                </Badge>
              </Link>
            );
          })}
          {(!clientes || clientes.length === 0) && (
            <p className="text-muted-foreground">Aún no has creado ningún cliente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
