"use client";

import { useActionState } from "react";
import Image from "next/image";
import { login, type AuthState } from "../actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const initialState: AuthState = { error: null };

export default function LoginPage() {
  const [state, formAction, pending] = useActionState(login, initialState);

  return (
    <div className="flex min-h-svh flex-col items-center justify-center gap-6 p-6">
      <Image src="/logo.png" alt="Manicomio Gym" width={1320} height={1283} className="w-40" priority />
      <Card className="w-full max-w-sm neon-border">
        <CardHeader>
          <CardTitle>Nutrición</CardTitle>
          <CardDescription>Accede a tu plan nutricional.</CardDescription>
        </CardHeader>
        <CardContent>
          <form action={formAction} className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="identifier">Usuario</Label>
              <Input id="identifier" name="identifier" required autoComplete="username" />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
              />
            </div>
            {state.error && <p className="text-sm text-destructive">{state.error}</p>}
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
