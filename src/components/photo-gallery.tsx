"use client";

export type GalleryPhoto = {
  id: string;
  path: string;
  url: string;
  fecha: string;
  notas: string | null;
};

export function PhotoGallery({
  photos,
  deleteAction,
  extraFields,
}: {
  photos: GalleryPhoto[];
  deleteAction: (formData: FormData) => void | Promise<void>;
  extraFields?: Record<string, string>;
}) {
  if (photos.length === 0) {
    return <p className="text-muted-foreground">Aún no hay fotos.</p>;
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
      {photos.map((photo) => (
        <div key={photo.id} className="flex flex-col gap-1">
          <a href={photo.url} target="_blank" rel="noopener noreferrer">
            <img
              src={photo.url}
              alt={`Foto de progreso — ${photo.fecha}`}
              className="aspect-square w-full rounded-md border object-cover"
            />
          </a>
          <p className="text-xs text-muted-foreground">{photo.fecha}</p>
          {photo.notas && <p className="text-xs text-muted-foreground">{photo.notas}</p>}
          <form action={deleteAction}>
            <input type="hidden" name="id" value={photo.id} />
            <input type="hidden" name="path" value={photo.path} />
            {extraFields &&
              Object.entries(extraFields).map(([key, value]) => (
                <input key={key} type="hidden" name={key} value={value} />
              ))}
            <button type="submit" className="text-left text-xs text-destructive hover:underline">
              Borrar
            </button>
          </form>
        </div>
      ))}
    </div>
  );
}
