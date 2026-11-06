"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/(auth)/actions";

type NavItem = { href: string; label: string };

const NAV: NavItem[] = [
  { href: "/admin", label: "Clientes" },
  { href: "/admin/alimentos", label: "Alimentos" },
  { href: "/admin/tips", label: "Aprender" },
];

export function AppShell({
  name,
  children,
}: {
  name: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh">
      <aside className="brand-lines flex w-64 shrink-0 flex-col overflow-hidden border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground">
        <div className="mb-6 px-2">
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
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-semibold transition-colors",
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
      <main className="flex-1 overflow-y-auto p-6">{children}</main>
    </div>
  );
}
