"use client";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { todayLocal } from "@/lib/date";
import { addPayment } from "../../actions";

export function PaymentForm({ clientId }: { clientId: string }) {
  async function onSubmit(formData: FormData) {
    await addPayment(formData);
    toast.success("Pago registrado.");
  }

  const today = todayLocal();

  return (
    <form action={onSubmit} className="flex flex-col gap-4">
      <input type="hidden" name="client_id" value={clientId} />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label>Fecha de pago</Label>
          <Input name="fecha_pago" type="date" defaultValue={today} required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Vence el</Label>
          <Input name="fecha_vencimiento" type="date" required />
        </div>
        <div className="flex flex-col gap-2">
          <Label>Monto</Label>
          <Input name="monto" type="number" step="0.01" min={0} />
        </div>
      </div>
      <div className="flex flex-col gap-2">
        <Label>Notas</Label>
        <Textarea name="notas" placeholder="Método de pago, plan, etc. (opcional)" />
      </div>
      <Button type="submit" className="w-fit">
        Registrar pago
      </Button>
    </form>
  );
}
