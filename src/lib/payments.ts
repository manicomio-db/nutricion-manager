export type MembershipStatus = "activo" | "vencido" | "sin_pago";

export function membershipStatus(
  fechaVencimiento: string | null | undefined,
  today: string
): MembershipStatus {
  if (!fechaVencimiento) return "sin_pago";
  return fechaVencimiento >= today ? "activo" : "vencido";
}
