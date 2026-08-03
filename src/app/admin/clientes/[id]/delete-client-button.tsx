"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteClient } from "../../actions";

export function DeleteClientButton({ clientId, clientName }: { clientId: string; clientName: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function onClick() {
    if (
      !confirm(
        `¿Borrar la cuenta de ${clientName}? Se eliminan también sus planes, progreso, fotos y pagos. No se puede deshacer.`
      )
    ) {
      return;
    }
    startTransition(async () => {
      const formData = new FormData();
      formData.set("id", clientId);
      await deleteClient(formData);
      toast.success("Cliente eliminado.");
      router.push("/admin");
    });
  }

  return (
    <Button type="button" variant="outline" className="text-destructive" onClick={onClick} disabled={pending}>
      {pending ? "Eliminando..." : "Borrar cliente"}
    </Button>
  );
}
