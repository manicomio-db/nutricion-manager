import { describeChange, describePoint, type ExerciseProgress } from "@/lib/progress";

export function ProgressTable({ progress }: { progress: ExerciseProgress[] }) {
  if (progress.length === 0) {
    return <p className="text-sm text-muted-foreground">Todavía no hay registros de entrenamiento.</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {progress.map((p) => (
        <div key={p.exercise} className="flex flex-col gap-1 rounded-md border p-3 text-sm">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium">{p.exercise}</span>
            <span className="text-xs text-muted-foreground">
              {p.sessions} {p.sessions === 1 ? "sesión" : "sesiones"}
            </span>
          </div>
          <p className="text-muted-foreground">
            {p.sessions > 1 ? (
              <>
                {describePoint(p.first)} → <strong className="text-foreground">{describePoint(p.last)}</strong>
              </>
            ) : (
              describePoint(p.last)
            )}
          </p>
          <p className="text-xs text-primary">{describeChange(p)}</p>
        </div>
      ))}
    </div>
  );
}
