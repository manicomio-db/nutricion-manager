"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Droplets, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { addWater } from "../hoy-actions";
import { GLASS_ML } from "@/lib/water";

export function WaterTracker({
  consumedMl,
  goalMl,
}: {
  consumedMl: number;
  goalMl: number | null;
}) {
  const [pending, startTransition] = useTransition();

  function change(delta: number) {
    startTransition(async () => {
      const res = await addWater(delta);
      if (res.error) toast.error(res.error);
    });
  }

  const glasses = Math.round(consumedMl / GLASS_ML);
  const goalGlasses = goalMl ? Math.round(goalMl / GLASS_ML) : null;
  const pct = goalMl ? Math.min(100, Math.round((consumedMl / goalMl) * 100)) : 0;
  const met = goalMl !== null && consumedMl >= goalMl;
  // Se dibujan al menos los vasos de la meta (o 8 si aún no hay meta), y más si ya pasó.
  const totalIcons = Math.max(goalGlasses ?? 8, glasses);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="text-3xl font-bold">
            {(consumedMl / 1000).toFixed(2).replace(/\.?0+$/, "")}
            <span className="text-base font-normal text-muted-foreground"> L</span>
          </p>
          <p className="text-sm text-muted-foreground">
            {goalMl ? `de ${(goalMl / 1000).toFixed(2).replace(/\.?0+$/, "")} L (${goalGlasses} vasos)` : `${glasses} vasos`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="icon" variant="outline" disabled={pending || consumedMl <= 0} onClick={() => change(-1)}>
            <Minus className="size-4" />
          </Button>
          <Button disabled={pending} onClick={() => change(1)}>
            <Plus className="mr-1 size-4" /> Vaso ({GLASS_ML} ml)
          </Button>
        </div>
      </div>

      {goalMl && (
        <div className="h-2.5 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      )}

      <div className="flex flex-wrap gap-1.5">
        {Array.from({ length: totalIcons }, (_, i) => (
          <button
            key={i}
            type="button"
            disabled={pending}
            aria-label={`Vaso ${i + 1}`}
            // Tocar un vaso lo marca/desmarca hasta ese punto.
            onClick={() => change(i + 1 - glasses)}
            className={i < glasses ? "text-primary" : "text-muted-foreground/40"}
          >
            <Droplets className="size-7" fill={i < glasses ? "currentColor" : "none"} />
          </button>
        ))}
      </div>

      {goalMl &&
        (met ? (
          <p className="text-sm font-medium text-primary">¡Meta de agua cumplida hoy! 💧</p>
        ) : (
          <p className="text-sm text-muted-foreground">
            Te faltan {((goalMl - consumedMl) / 1000).toFixed(2).replace(/\.?0+$/, "")} L (
            {Math.ceil((goalMl - consumedMl) / GLASS_ML)} vasos).
          </p>
        ))}
    </div>
  );
}
