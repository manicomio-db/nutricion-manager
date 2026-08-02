"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, Dumbbell, TrendingUp, BookOpen, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { logout } from "@/app/(auth)/actions";

const NAV = [
  { href: "/cliente", label: "Inicio", icon: Home },
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
        <div className="flex items-center gap-2">
          <Image src="/logo.png" alt="Manicomio Gym" width={1320} height={1283} className="w-8" priority />
          <span className="truncate text-sm font-medium">{name ?? "Usuario"}</span>
        </div>
        <form action={logout}>
          <button
            type="submit"
            className="flex items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <LogOut className="size-3.5" />
            Salir
          </button>
        </form>
      </header>

      <main className="flex-1 overflow-y-auto px-4 pt-4 pb-24">{children}</main>

      <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2">
          {NAV.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 rounded-xl px-3 py-1.5 text-[10px] font-medium uppercase tracking-wide transition-colors",
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
