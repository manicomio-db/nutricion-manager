import Link from "next/link";
import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Profile } from "@/lib/types";
import { CreateClientForm } from "./create-client-form";

export default async function AdminPage() {
  const { supabase } = await requireAdmin();

  const { data: clientes } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "cliente")
    .order("full_name", { ascending: true })
    .returns<Profile[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Clientes</h1>
        <p className="text-muted-foreground">Crea cuentas y administra los planes de cada cliente.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear cuenta de cliente</CardTitle>
          <CardDescription>Le compartes el correo y contraseña para que entre a ver su plan.</CardDescription>
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
          {(clientes ?? []).map((c) => (
            <Link
              key={c.id}
              href={`/admin/clientes/${c.id}`}
              className="flex items-center justify-between rounded-md border p-3 text-sm transition-colors hover:bg-muted"
            >
              <span className="font-medium">{c.full_name ?? "Sin nombre"}</span>
              <span className="text-muted-foreground">{c.objetivo ?? "Sin objetivo definido"}</span>
            </Link>
          ))}
          {(!clientes || clientes.length === 0) && (
            <p className="text-muted-foreground">Aún no has creado ningún cliente.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
