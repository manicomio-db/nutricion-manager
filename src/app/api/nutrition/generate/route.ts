import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireProfile } from "@/lib/supabase/session";

export async function POST(req: Request) {
  const { profile } = await requireProfile();
  if (profile.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "Falta configurar ANTHROPIC_API_KEY en el servidor." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const { objetivo, restricciones, comidas_dia } = body as {
    objetivo: string;
    restricciones: string | null;
    comidas_dia: number | null;
  };

  if (!objetivo) {
    return NextResponse.json({ error: "Falta el objetivo del cliente." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const comidas = comidas_dia && comidas_dia > 0 ? comidas_dia : 4;

  const prompt = `Eres un nutricionista experto. Diseña un plan de alimentación de un día para un cliente con estos datos:
- Objetivo: ${objetivo}
- Restricciones o alergias: ${restricciones || "ninguna reportada"}
- Comidas al día: ${comidas}

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin texto extra) con esta forma exacta:
{
  "comidas": [
    {
      "nombre": "string, ej. Desayuno",
      "items": [
        {
          "food_nombre": "string, nombre del alimento",
          "gramos": number,
          "kcal": number,
          "proteina": number,
          "carbos": number,
          "grasas": number
        }
      ]
    }
  ]
}

Incluye exactamente ${comidas} comidas. Los valores kcal/proteina/carbos/grasas de cada item deben corresponder a la porción indicada en gramos (no a 100g). Evita alimentos que choquen con las restricciones reportadas.`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 4000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "La IA no devolvió un JSON válido." }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ comidas: parsed.comidas });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error generando el plan con IA." }, { status: 500 });
  }
}
