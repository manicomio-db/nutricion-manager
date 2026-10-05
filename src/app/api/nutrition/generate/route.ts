import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { requireProfile } from "@/lib/supabase/session";
import type { Meal } from "@/lib/types";

export const maxDuration = 60;

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
    metas,
    suplementacion,
    pre_entreno,
    post_entreno,
  } = body as {
    suplementacion?: string | null;
    pre_entreno?: number | null; // número de comida (1-based)
    post_entreno?: number | null;
    metas?: { kcal: number; proteina: number; carbos: number; grasas: number } | null;
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

  const hasMetas = !!metas && metas.kcal > 0;

  const preN = pre_entreno && pre_entreno >= 1 && pre_entreno <= comidas ? pre_entreno : null;
  const postN = post_entreno && post_entreno >= 1 && post_entreno <= comidas ? post_entreno : null;
  const extras = [
    preN
      ? `- La comida ${preN} es la PRE-ENTRENO: carbohidratos de buena calidad y fáciles de digerir, proteína moderada, grasa y fibra bajas.`
      : null,
    postN
      ? `- La comida ${postN} es la POST-ENTRENO: proteína de alta calidad y carbohidratos para recuperar glucógeno, grasa baja.`
      : null,
    suplementacion?.trim()
      ? `- Suplementación indicada por el nutricionista (tenla en cuenta; no la incluyas como alimentos salvo que sea un polvo de proteína u otro suplemento calórico mencionado): ${suplementacion.trim()}`
      : null,
  ]
    .filter(Boolean)
    .join("\n");

  const prompt = `Eres un nutricionista experto. Diseña un plan de alimentación de un día para un cliente con estos datos:
- Objetivo: ${objetivo}
- Restricciones o alergias: ${restricciones || "ninguna reportada"}
- Comidas al día: ${comidas}${datosCorporales ? `\n- ${datosCorporales}` : ""}

${
  hasMetas
    ? `Metas diarias OBLIGATORIAS (ya calculadas por el nutricionista): ${metas!.kcal} kcal, ${metas!.proteina} g de proteína, ${metas!.carbos} g de carbohidratos, ${metas!.grasas} g de grasas. La suma de todos los alimentos del día debe acercarse lo más posible a esas metas (kcal y los tres macros). Reparte las metas de forma lógica entre las comidas (más proteína distribuida, carbohidratos alrededor del entrenamiento) y usa porciones realistas.`
    : "Si hay datos corporales, ténlos en cuenta internamente (gasto energético, proteína por kg de peso/masa muscular, etc.) para definir las calorías y macros del día. Si no hay datos corporales, usa buen juicio nutricional general según el objetivo."
}

${extras ? `Indicaciones adicionales:\n${extras}\n\n` : ""}No escribas cálculos, explicaciones ni ningún texto fuera del JSON. Tu respuesta completa debe ser ÚNICAMENTE el JSON (sin markdown, sin comentarios) con esta forma exacta:
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
      // Sin razonamiento extendido: con él tardaba ~55 s y Vercel cortaba la petición.
      thinking: { type: "disabled" },
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
    let comidasOut: Meal[] = parsed.comidas;

    // La IA suele desviarse un poco al sumar: escala las porciones para que las kcal
    // del día coincidan con la meta (los macros se escalan en la misma proporción).
    if (hasMetas) {
      const total = comidasOut.reduce(
        (s, m) => s + m.items.reduce((s2, i) => s2 + (Number(i.kcal) || 0), 0),
        0
      );
      const factor = total > 0 ? metas!.kcal / total : 1;
      if (factor > 0.6 && factor < 1.6 && Math.abs(factor - 1) > 0.01) {
        const r1 = (n: number) => Math.round(n * 10) / 10;
        comidasOut = comidasOut.map((m) => ({
          ...m,
          items: m.items.map((i) => ({
            ...i,
            gramos: Math.round(i.gramos * factor),
            kcal: r1(i.kcal * factor),
            proteina: r1(i.proteina * factor),
            carbos: r1(i.carbos * factor),
            grasas: r1(i.grasas * factor),
          })),
        }));
      }
    }

    return NextResponse.json({ comidas: comidasOut });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error generando el plan con IA." }, { status: 500 });
  }
}
