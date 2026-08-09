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
  const {
    objetivo,
    restricciones,
    comidas_dia,
    altura_cm,
    peso_kg,
    grasa_pct,
    grasa_visceral,
    masa_muscular_kg,
    agua_corporal_l,
  } = body as {
    objetivo: string;
    restricciones: string | null;
    comidas_dia: number | null;
    altura_cm?: number | null;
    peso_kg?: number | null;
    grasa_pct?: number | null;
    grasa_visceral?: number | null;
    masa_muscular_kg?: number | null;
    agua_corporal_l?: number | null;
  };

  if (!objetivo) {
    return NextResponse.json({ error: "Falta el objetivo del cliente." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const comidas = comidas_dia && comidas_dia > 0 ? comidas_dia : 4;

  const datosCorporales = [
    altura_cm ? `Altura: ${altura_cm} cm` : null,
    peso_kg ? `Peso: ${peso_kg} kg` : null,
    grasa_pct ? `% de grasa corporal: ${grasa_pct}%` : null,
    grasa_visceral ? `Grasa visceral: ${grasa_visceral}` : null,
    masa_muscular_kg ? `Masa muscular: ${masa_muscular_kg} kg` : null,
    agua_corporal_l ? `Agua corporal: ${agua_corporal_l} L` : null,
  ]
    .filter(Boolean)
    .join("\n- ");

  const prompt = `Eres un nutricionista experto. Diseña un plan de alimentación de un día para un cliente con estos datos:
- Objetivo: ${objetivo}
- Restricciones o alergias: ${restricciones || "ninguna reportada"}
- Comidas al día: ${comidas}${datosCorporales ? `\n- ${datosCorporales}` : ""}

Si hay datos corporales, ténlos en cuenta internamente (gasto energético, proteína por kg de peso/masa muscular, etc.) para definir las calorías y macros del día. Si no hay datos corporales, usa buen juicio nutricional general según el objetivo.

No escribas cálculos, explicaciones ni ningún texto fuera del JSON. Tu respuesta completa debe ser ÚNICAMENTE el JSON (sin markdown, sin comentarios) con esta forma exacta:
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

Incluye exactamente ${comidas} comidas. Los valores kcal/proteina/carbos/grasas de cada item deben corresponder a la porción indicada en gramos (no a 100g). Evita alimentos que choquen con las restricciones reportadas. Recuerda: responde solo con el JSON, empezando directamente con "{".`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 8000,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error("Nutrition AI: no JSON in response.", {
        stopReason: message.stop_reason,
        rawPreview: raw.slice(0, 500),
      });
      return NextResponse.json({ error: "La IA no devolvió un JSON válido." }, { status: 502 });
    }

    const parsed = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ comidas: parsed.comidas });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error generando el plan con IA." }, { status: 500 });
  }
}
