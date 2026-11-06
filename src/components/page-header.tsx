import type { ReactNode } from "react";

/** Encabezado de página con el estilo de marca: grafito, líneas naranja y plata. */
export function PageHeader({
  title,
  subtitle,
  children,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  /** Contenido a la derecha (por ejemplo etiquetas o botones). */
  children?: ReactNode;
}) {
  return (
    <header className="brand-hero px-5 py-5 sm:px-7 sm:py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-extrabold tracking-tight text-white sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 text-sm text-white/70 first-letter:uppercase">{subtitle}</p>}
        </div>
        {children}
      </div>
    </header>
  );
}
