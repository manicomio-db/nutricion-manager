"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/(auth)/actions";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/admin", label: "Clientes" },
  { href: "/admin/alimentos", label: "Alimentos" },
  { href: "/admin/tips", label: "Aprender" },
];

function isActive(pathname: string, href: string) {
  if (href === "/admin") return pathname === "/admin" || pathname.startsWith("/admin/clientes");
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  name,
  children,
}: {
  name: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  // Solo en celular/tablet: el menú lateral se abre como cajón.
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-svh flex-col lg:flex-row">
      {/* Barra superior en celular */}
      <header className="brand-lines sticky top-0 z-30 flex items-center justify-between overflow-hidden bg-sidebar px-4 py-2.5 pt-[max(0.625rem,env(safe-area-inset-top))] text-sidebar-foreground lg:hidden">
        <div className="flex min-w-0 items-center gap-3">
          <Image
            src="/logo.png"
            alt="Manicomio Gym"
            width={1320}
            height={1283}
            className="w-9 shrink-0 rounded-xl ring-1 ring-white/15"
            priority
          />
          <span className="truncate text-sm font-semibold">Nutrición · Admin</span>
        </div>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Abrir menú"
          className="rounded-md p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white"
        >
          <Menu className="size-5" />
        </button>
        <span aria-hidden className="brand-line absolute inset-x-0 bottom-0" />
      </header>

      {open && (
        <div
          aria-hidden
          className="fixed inset-0 z-40 bg-black/55 backdrop-blur-sm lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={cn(
          "brand-lines fixed inset-y-0 left-0 z-50 flex w-64 max-w-[85vw] shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground transition-transform duration-200",
          "lg:relative lg:z-auto lg:max-w-none lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="mb-6 flex items-start justify-between px-2">
          <div>
            <Image
              src="/logo.png"
              alt="Manicomio Gym"
              width={1320}
              height={1283}
              className="w-20 rounded-2xl shadow-lg shadow-primary/30 ring-1 ring-white/15"
              priority
            />
            <p className="mt-3 text-[11px] font-semibold uppercase tracking-widest text-sidebar-foreground/60">
              Nutrición · Admin
            </p>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Cerrar menú"
            className="rounded-md p-2 text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-white lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "rounded-lg px-3 py-2.5 text-sm font-semibold transition-colors",
                  active
                    ? "bg-primary text-primary-foreground shadow-md shadow-primary/30"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
                )}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-4 border-t border-sidebar-border pt-4">
          <p className="truncate px-2 text-sm font-medium">{name ?? "Usuario"}</p>
          <ThemeToggle
            showLabel
            className="mt-2 w-full px-3 py-2 text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
          />
          <form action={logout}>
            <button
              type="submit"
              className="mt-2 w-full rounded-md px-3 py-2 text-left text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-white"
            >
              Cerrar sesión
            </button>
          </form>
        </div>
      </aside>

      <main className="min-w-0 flex-1 p-3 sm:p-6">{children}</main>
    </div>
  );
}
