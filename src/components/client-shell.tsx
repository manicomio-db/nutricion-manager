"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Home,
  ClipboardList,
  Dumbbell,
  TrendingUp,
  BookOpen,
  LogOut,
  HeartPulse,
  CalendarCheck,
  KeyRound,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { logout } from "@/app/(auth)/actions";

const NAV = [
  { href: "/cliente", label: "Inicio", icon: Home },
  { href: "/cliente/hoy", label: "Hoy", icon: CalendarCheck },
  { href: "/cliente/plan", label: "Plan", icon: ClipboardList },
  { href: "/cliente/entrenamiento", label: "Entreno", icon: Dumbbell },
  { href: "/cliente/progreso", label: "Progreso", icon: TrendingUp },
  { href: "/cliente/aprender", label: "Aprender", icon: BookOpen },
];

export function ClientShell({
  name,
  children,
}: {
  name: string | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-svh flex-col">
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-background/95 px-4 py-2.5 backdrop-blur">
        <span aria-hidden className="brand-line absolute inset-x-0 bottom-0" />
        <div className="flex min-w-0 items-center gap-2">
          <Image src="/logo.png" alt="Manicomio Gym" width={1320} height={1283} className="w-8 shrink-0 rounded-lg shadow-sm" priority />
          <span className="truncate text-sm font-medium">{name ?? "Usuario"}</span>
        </div>
        <div className="flex shrink-0 items-center gap-0.5">
          <ThemeToggle className="text-muted-foreground hover:bg-muted hover:text-foreground" />
          <Link
            href="/cliente/ficha"
            className={cn(
              "flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-xs hover:bg-muted hover:text-foreground",
              pathname === "/cliente/ficha" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <HeartPulse className="size-3.5" />
            Mi ficha
          </Link>
          <Link
            href="/cliente/cuenta"
            className={cn(
              "flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-xs hover:bg-muted hover:text-foreground",
              pathname === "/cliente/cuenta" ? "text-primary" : "text-muted-foreground"
            )}
          >
            <KeyRound className="size-3.5" />
            Cuenta
          </Link>
          <form action={logout}>
            <button
              type="submit"
              className="flex items-center gap-1 whitespace-nowrap rounded-md px-1.5 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <LogOut className="size-3.5" />
              Salir
            </button>
          </form>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 overflow-y-auto px-4 pt-4 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur">
        <span aria-hidden className="brand-line absolute inset-x-0 top-0" />
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-2 py-1.5 text-[9px] font-medium uppercase tracking-wide transition-colors",
                  active ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="size-5" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
