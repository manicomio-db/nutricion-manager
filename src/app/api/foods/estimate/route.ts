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
  const { nombre } = body as { nombre: string };

  if (!nombre) {
    return NextResponse.json({ error: "Falta el nombre del alimento." }, { status: 400 });
  }

  const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const prompt = `Eres un nutricionista experto. Da los valores nutricionales aproximados de este alimento, por cada 100 gramos, en su forma cruda o tal como se consume habitualmente: "${nombre}".

Responde ÚNICAMENTE con un JSON válido (sin markdown, sin texto extra) con esta forma exacta:
{
  "kcal_100g": number,
  "proteina_100g": number,
  "carbos_100g": number,
  "grasas_100g": number
}`;

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 500,
      messages: [{ role: "user", content: prompt }],
    });

    const textBlock = message.content.find((b) => b.type === "text");
    const raw = textBlock && "text" in textBlock ? textBlock.text : "";

    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: "La IA no devolvió un JSON válido." }, { status: 502 });
    }

    const macros = JSON.parse(jsonMatch[0]);
    return NextResponse.json({ macros });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Error estimando el alimento con IA." }, { status: 500 });
  }
}
