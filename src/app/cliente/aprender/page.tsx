import { requireClient } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import type { Tip, TipCategory } from "@/lib/types";
import { TipAccordion } from "./tip-accordion";

export default async function AprenderPage() {
  const { supabase } = await requireClient();

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

  const sections = (categories ?? [])
    .map((cat) => ({
      category: cat,
      tips: (tips ?? []).filter((t) => t.category_id === cat.id),
    }))
    .filter((s) => s.tips.length > 0);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Aprender</h1>
        <p className="text-muted-foreground">Tips de Manicomio Gym para estar saludable.</p>
      </div>

      {sections.length > 0 ? (
        sections.map(({ category, tips: sectionTips }) => (
          <Card key={category.id}>
            <CardHeader>
              <CardTitle>{category.titulo}</CardTitle>
              <CardDescription>Toca cada tip para ver el detalle.</CardDescription>
            </CardHeader>
            <CardContent>
              <TipAccordion tips={sectionTips} />
            </CardContent>
          </Card>
        ))
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Aún no hay tips publicados.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
