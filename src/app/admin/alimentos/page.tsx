import { requireAdmin } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { Food } from "@/lib/types";
import { FoodForm } from "./food-form";
import { deleteFood } from "../actions";
import { Button } from "@/components/ui/button";

export default async function AlimentosPage() {
  const { supabase } = await requireAdmin();

  const { data: foods } = await supabase
    .from("foods")
    .select("*")
    .order("nombre", { ascending: true })
    .returns<Food[]>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Alimentos</h1>
        <p className="text-muted-foreground">
          Catálogo de macros por cada 100g. Usa &quot;Estimar con IA&quot; si no conoces los valores.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Agregar alimento</CardTitle>
          <CardDescription>Valores por 100 gramos.</CardDescription>
        </CardHeader>
        <CardContent>
          <FoodForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Catálogo ({foods?.length ?? 0})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Alimento</TableHead>
                <TableHead>Kcal</TableHead>
                <TableHead>Proteína</TableHead>
                <TableHead>Carbos</TableHead>
                <TableHead>Grasas</TableHead>
                <TableHead>Fuente</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {(foods ?? []).map((f) => (
                <TableRow key={f.id}>
                  <TableCell className="font-medium">{f.nombre}</TableCell>
                  <TableCell>{f.kcal_100g}</TableCell>
                  <TableCell>{f.proteina_100g}g</TableCell>
                  <TableCell>{f.carbos_100g}g</TableCell>
                  <TableCell>{f.grasas_100g}g</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{f.fuente === "ia" ? "IA" : "Manual"}</Badge>
                  </TableCell>
                  <TableCell>
                    <form action={deleteFood}>
                      <input type="hidden" name="id" value={f.id} />
                      <Button type="submit" size="sm" variant="ghost" className="text-destructive">
                        Borrar
                      </Button>
                    </form>
                  </TableCell>
                </TableRow>
              ))}
              {(!foods || foods.length === 0) && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground">
                    Aún no hay alimentos en el catálogo.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
