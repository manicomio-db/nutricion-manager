"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { ProgressLog } from "@/lib/types";

export function ProgressChart({ logs }: { logs: ProgressLog[] }) {
  const data = logs.map((l) => ({
    fecha: l.fecha,
    peso: l.peso_kg,
    grasa: l.grasa_pct,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
          <XAxis dataKey="fecha" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis yAxisId="peso" stroke="var(--muted-foreground)" fontSize={12} />
          <YAxis yAxisId="grasa" orientation="right" stroke="var(--muted-foreground)" fontSize={12} />
          <Tooltip
            contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", color: "var(--popover-foreground)" }}
          />
          <Line yAxisId="peso" type="monotone" dataKey="peso" name="Peso (kg)" stroke="var(--primary)" strokeWidth={2} dot={false} />
          <Line yAxisId="grasa" type="monotone" dataKey="grasa" name="% Grasa" stroke="var(--chart-3)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
