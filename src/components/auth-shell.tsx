import type { ReactNode } from "react";

/**
 * Marco de las pantallas de acceso: en pantallas grandes, foto de alimentos y accesorios a la
 * izquierda y panel con el formulario a la derecha; en celular, la foto va de fondo oscurecida
 * para que el formulario siga siendo legible.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  return (
    <div className="brand-bg flex min-h-svh">
      <div aria-hidden className="auth-photo relative hidden lg:block lg:flex-[1.35]" />
      <div className="auth-photo-mobile relative flex flex-1 items-center justify-center p-6 lg:m-6 lg:rounded-3xl lg:border lg:border-white/10 lg:bg-white/[0.04] lg:p-10 lg:backdrop-blur-xl">
        <div className="flex w-full max-w-sm flex-col items-center gap-6">{children}</div>
      </div>
    </div>
  );
}
