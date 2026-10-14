import Link from "next/link";
import { HeartPulse } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FichaRequired({ texto }: { texto?: string }) {
  return (
    <div className="flex flex-col gap-3 rounded-md border border-primary/40 bg-primary/5 p-4">
      <div className="flex items-center gap-2 font-medium">
        <HeartPulse className="size-5 text-primary" />
        Primero llena tu ficha de salud
      </div>
      <p className="text-sm text-muted-foreground">
        {texto ??
          "Necesitamos tu edad, peso, estatura y condiciones de salud para armar un plan preciso y seguro para ti."}
      </p>
      <Button nativeButton={false} render={<Link href="/cliente/ficha" />} className="w-fit">
        Llenar mi ficha
      </Button>
    </div>
  );
}
