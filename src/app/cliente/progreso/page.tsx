import { requireClient } from "@/lib/supabase/session";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProgressChart } from "@/components/progress-chart";
import { PhotoGallery } from "@/components/photo-gallery";
import { PhotoUploadForm } from "./photo-upload-form";
import { deleteOwnProgressPhoto } from "../actions";
import type { ProgressLog, ProgressPhoto } from "@/lib/types";

export default async function ClienteProgresoPage() {
  const { profile, supabase } = await requireClient();

  const [{ data: logs }, { data: photos }] = await Promise.all([
    supabase
      .from("progress_logs")
      .select("*")
      .eq("client_id", profile.id)
      .order("fecha", { ascending: true })
      .returns<ProgressLog[]>(),
    supabase
      .from("progress_photos")
      .select("*")
      .eq("client_id", profile.id)
      .order("fecha", { ascending: false })
      .returns<ProgressPhoto[]>(),
  ]);

  let galleryPhotos: { id: string; path: string; url: string; fecha: string; notas: string | null }[] = [];
  if (photos && photos.length > 0) {
    const { data: signed } = await supabase.storage
      .from("progress-photos")
      .createSignedUrls(
        photos.map((p) => p.storage_path),
        3600
      );
    galleryPhotos = photos.map((p, i) => ({
      id: p.id,
      path: p.storage_path,
      url: signed?.[i]?.signedUrl ?? "",
      fecha: p.fecha,
      notas: p.notas,
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Mi progreso</h1>
        <p className="text-muted-foreground">Mediciones y fotos de tu progreso físico.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Subir foto de progreso</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoUploadForm />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mis fotos</CardTitle>
        </CardHeader>
        <CardContent>
          <PhotoGallery photos={galleryPhotos} deleteAction={deleteOwnProgressPhoto} />
        </CardContent>
      </Card>

      {logs && logs.length > 0 ? (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Evolución</CardTitle>
            </CardHeader>
            <CardContent>
              <ProgressChart logs={logs} />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Historial</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              {logs
                .slice()
                .reverse()
                .map((l) => (
                  <div key={l.id} className="rounded-md border p-3 text-sm">
                    <p className="font-medium">{l.fecha}</p>
                    <p className="text-muted-foreground">
                      {l.peso_kg ? `${l.peso_kg}kg` : "sin peso"}
                      {l.grasa_pct ? ` · ${l.grasa_pct}% grasa` : ""}
                      {l.masa_muscular_kg ? ` · ${l.masa_muscular_kg}kg músculo` : ""}
                      {l.masa_grasa_kg ? ` · ${l.masa_grasa_kg}kg grasa` : ""}
                      {l.grasa_visceral ? ` · grasa visceral ${l.grasa_visceral}` : ""}
                      {l.agua_corporal_l ? ` · ${l.agua_corporal_l}L agua` : ""}
                      {l.tasa_metabolica_kcal ? ` · TMB ${l.tasa_metabolica_kcal}kcal` : ""}
                      {l.notas ? ` · ${l.notas}` : ""}
                    </p>
                  </div>
                ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <Card>
          <CardContent className="pt-6">
            <p className="text-muted-foreground">Aún no hay mediciones registradas.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
