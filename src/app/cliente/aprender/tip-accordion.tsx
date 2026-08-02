"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Tip } from "@/lib/types";

export function TipAccordion({ tips }: { tips: Tip[] }) {
  const [openId, setOpenId] = useState<string | null>(null);

  return (
    <div className="flex flex-col divide-y divide-border rounded-md border">
      {tips.map((tip, i) => {
        const open = openId === tip.id;
        return (
          <div key={tip.id}>
            <button
              type="button"
              onClick={() => setOpenId(open ? null : tip.id)}
              className="flex w-full items-center gap-3 px-4 py-3 text-left"
            >
              {tip.emoji && <span className="text-xl">{tip.emoji}</span>}
              <span className="flex-1 font-medium">
                {i + 1}. {tip.titulo}
              </span>
              <ChevronDown
                className={cn("size-4 text-muted-foreground transition-transform", open && "rotate-180")}
              />
            </button>
            {open && (
              <div className="px-4 pb-4 text-sm text-muted-foreground">{tip.contenido}</div>
            )}
          </div>
        );
      })}
    </div>
  );
}
