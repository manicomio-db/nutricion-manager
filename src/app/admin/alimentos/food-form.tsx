"use client";

import { useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { upsertFood } from "../actions";

export function FoodForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [nombre, setNombre] = useState("");
  const [kcal, setKcal] = useState("");
  const [proteina, setProteina] = useState("");
  const [carbos, setCarbos] = useState("");
  const [grasas, setGrasas] = useState("");
  const [fuente, setFuente] = useState<"manual" | "ia">("manual");
  const [estimating, setEstimating] = useState(false);

  async function estimar() {
    if (!nombre.trim()) {
      toast.error("Escribe primero el nombre del alimento.");
      return;
    }
    setEstimating(true);
    try {
      const res = await fetch("/api/foods/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error estimando");
      setKcal(String(data.macros.kcal_100g));
      setProteina(String(data.macros.proteina_100g));
      setCarbos(String(data.macros.carbos_100g));
      setGrasas(String(data.macros.grasas_100g));
      setFuente("ia");
      toast.success("Valores estimados. Revísalos antes de guardar.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Error estimando el alimento");
    } finally {
      setEstimating(false);
    }
  }

  async function onSubmit(formData: FormData) {
    await upsertFood(formData);
    formRef.current?.reset();
    setNombre("");
    setKcal("");
    setProteina("");
    setCarbos("");
    setGrasas("");
    setFuente("manual");
    toast.success("Alimento guardado.");
  }

  return (
    <form ref={formRef} action={onSubmit} className="flex flex-col gap-3">
      <input type="hidden" name="fuente" value={fuente} />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-[2fr_1fr_1fr_1fr_1fr]">
        <div className="flex flex-col gap-2">
          <Label>Alimento</Label>
          <Input
            name="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            placeholder="Ej: Pechuga de pollo"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Kcal /100g</Label>
          <Input
            name="kcal_100g"
            type="number"
            step="0.1"
            value={kcal}
            onChange={(e) => setKcal(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Proteína /100g</Label>
          <Input
            name="proteina_100g"
            type="number"
            step="0.1"
            value={proteina}
            onChange={(e) => setProteina(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Carbos /100g</Label>
          <Input
            name="carbos_100g"
            type="number"
            step="0.1"
            value={carbos}
            onChange={(e) => setCarbos(e.target.value)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Grasas /100g</Label>
          <Input
            name="grasas_100g"
            type="number"
            step="0.1"
            value={grasas}
            onChange={(e) => setGrasas(e.target.value)}
            required
          />
        </div>
      </div>
      <div className="flex gap-2">
        <Button type="button" variant="outline" onClick={estimar} disabled={estimating}>
          {estimating ? "Estimando..." : "Estimar con IA"}
        </Button>
        <Button type="submit" className="w-fit">
          Guardar alimento
        </Button>
      </div>
    </form>
  );
}
