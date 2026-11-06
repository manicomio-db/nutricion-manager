"use client";

import { useTransition } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { deleteMealLog } from "../hoy-actions";

export function DeleteLogButton({ id }: { id: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <Button
      size="sm"
      variant="ghost"
      className="text-destructive"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          const res = await deleteMealLog(id);
          if (res.error) toast.error(res.error);
        })
      }
    >
      Borrar
    </Button>
  );
}
