import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { Tip, TipCategory } from "@/lib/types";
import { CategoryForm } from "./category-form";
import { TipForm } from "./tip-form";
import { deleteTip, deleteTipCategory } from "../actions";

export default async function TipsPage() {
  const { supabase } = await requireAdmin();

  const [{ data: categories }, { data: tips }] = await Promise.all([
    supabase
      .from("tip_categories")
      .select("*")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<TipCategory[]>(),
    supabase
      .from("tips")
      .select("*")
      .order("orden", { ascending: true })
      .order("created_at", { ascending: true })
      .returns<Tip[]>(),
  ]);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Aprender</h1>
        <p className="text-muted-foreground">
          Organiza el contenido en secciones (ej. &quot;ManicomioTips&quot;, &quot;Abdomen Plano&quot;)
          y agrega tips dentro de cada una. Los clientes las ven en su sección &quot;Aprender&quot;.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Crear sección</CardTitle>
          <CardDescription>Puedes agregar tantas secciones como quieras.</CardDescription>
        </CardHeader>
        <CardContent>
          <CategoryForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agregar tip</CardTitle>
          <CardDescription>El número de orden más bajo aparece primero.</CardDescription>
        </CardHeader>
        <CardContent>
          <TipForm categories={categories ?? []} />
        </CardContent>
      </Card>

      <div className="flex flex-col gap-6">
        {(categories ?? []).map((cat) => {
          const catTips = (tips ?? []).filter((t) => t.category_id === cat.id);
          return (
            <Card key={cat.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{cat.titulo}</CardTitle>
                  <form action={deleteTipCategory}>
                    <input type="hidden" name="id" value={cat.id} />
                    <Button
                      type="submit"
                      size="sm"
                      variant="ghost"
                      className="text-destructive"
                    >
                      Borrar sección
                    </Button>
                  </form>
                </div>
                <CardDescription>{catTips.length} tips</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                {catTips.map((tip) => (
                  <div key={tip.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                    <div className="flex flex-1 gap-3">
                      <span className="text-xl">{tip.emoji}</span>
                      <div>
                        <p className="font-medium">{tip.titulo}</p>
                        <p className="text-sm text-muted-foreground">{tip.contenido}</p>
                      </div>
                    </div>
                    <form action={deleteTip}>
                      <input type="hidden" name="id" value={tip.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Borrar
                      </Button>
                    </form>
                  </div>
                ))}
                {catTips.length === 0 && (
                  <p className="text-muted-foreground">Aún no hay tips en esta sección.</p>
                )}
              </CardContent>
            </Card>
          );
        })}
        {(!categories || categories.length === 0) && (
          <p className="text-muted-foreground">Crea tu primera sección arriba para empezar.</p>
        )}
      </div>
    </div>
  );
}
