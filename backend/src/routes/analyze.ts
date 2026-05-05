import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { BusinessData, ChatMessage, AnalysisResults } from "../types.js";

const router = Router();
const client = new Anthropic();

type WhatIfParams = {
  capital: string;
  fixedCosts: string;
  variableCost: string;
  price: string;
  channels: string[];
  market: string;
};

type AnalyzeBody = {
  business: BusinessData;
  industryName: string;
  messages: ChatMessage[];
  whatIf?: WhatIfParams;
};

const SYSTEM_PROMPT = `Eres un experto en análisis financiero de punto de equilibrio para pymes latinoamericanas.
Se te dará el perfil de un negocio y la conversación completa de onboarding donde el emprendedor reveló datos clave (producto, precio, costos, canales, mercado). DEBES usar esos datos exactos para los cálculos — no inventes ni uses datos genéricos.

Proceso obligatorio antes de responder:
1. Extrae de la conversación: precio de venta, costo por unidad/producción, canales mencionados, tamaño de mercado.
2. Calcula el margen por venta = precio - costo variable.
3. Estima los costos fijos mensuales del negocio según su industria y capital.
4. Calcula periodos al punto de equilibrio = costos fijos totales / margen por venta.
5. Genera un plan de acción concreto usando el producto/servicio y canales REALES del negocio.

Responde ÚNICAMENTE con un objeto JSON válido (sin markdown, sin texto adicional) con esta estructura exacta:
{
  "periodsToBreakEven": <número entero de períodos/meses calculado con los datos reales>,
  "capitalEfficiency": <número entre 40-95 basado en relación capital/costos>,
  "optimalChannel": <canal real mencionado en la conversación>,
  "channelConversionRate": <tasa estimada para ese canal específico>,
  "priceRange": <recomendación de precio basada en el precio real mencionado>,
  "steps": [
    {
      "period": <string rango ej: "1-2">,
      "action": <acción concreta usando el producto/servicio real del negocio>,
      "reasoning": <razonamiento con números reales del negocio>,
      "outcome": <resultado esperado con métricas concretas>,
      "risk": <riesgo específico o null>
    }
  ],
  "capitalCurve": [<array de periodsToBreakEven+1 números: % capital restante, decreciente de ~100 a ~0>],
  "revenueCurve": [<array de periodsToBreakEven+1 números: índice ingresos creciente, empezando en ~10>],
  "conservativeSteps": [
    { "period": <string>, "action": <string>, "outcome": <string> },
    { "period": <string>, "action": <string>, "outcome": <string> },
    { "period": <string>, "action": <string>, "outcome": <string> }
  ]
}

Los "steps" deben tener entre 4 y 6 elementos. IMPORTANTE: nunca uses datos de restaurantes u otros sectores si el negocio es diferente.`;

router.post("/", async (req: Request, res: Response) => {
  const { business, industryName, messages, whatIf } = req.body as AnalyzeBody;

  if (!business?.name || !industryName || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Faltan campos requeridos: business, industryName, messages" });
  }

  console.log("[analyze] messages recibidos:", messages.length, "| industria:", industryName, "| capital:", business.capital);

  const conversationSummary = messages
    .map((m) => `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.text}`)
    .join("\n");

  const whatIfNote = whatIf
    ? `\n\nSCENARIO WHAT-IF — usa estos parámetros en lugar de los de la conversación:
Capital inicial: ${whatIf.capital}
Costos fijos mensuales: ${whatIf.fixedCosts}
Costo variable por unidad: ${whatIf.variableCost}
Precio de venta: ${whatIf.price}
Canales: ${whatIf.channels.join(", ")}
Tamaño del mercado: ${whatIf.market}`
    : "";

  const userPrompt = `Negocio: "${business.name}"
Ciudad: ${business.city}
Industria: ${industryName}
Capital inicial: ${business.capital} ${business.currency}
Experiencia del emprendedor: ${business.experience}

Conversación de onboarding donde se recopiló información del negocio:
${conversationSummary}${whatIfNote}

Genera el análisis de punto de equilibrio completo.`;

  let raw = "";
  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 2048,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ],
      messages: [{ role: "user", content: userPrompt }],
    });

    const response = await stream.finalMessage();
    const textBlock = response.content.find((b) => b.type === "text");
    raw = textBlock?.type === "text" ? textBlock.text : "";
  } catch (error) {
    console.error("[analyze] Error al consultar Anthropic:", error);
    return res.status(502).json({ error: "Error al consultar el modelo" });
  }

  let results: AnalysisResults;
  try {
    results = JSON.parse(raw);
  } catch {
    // Fallback if JSON is wrapped in markdown code block
    const match = raw.match(/```(?:json)?\s*([\s\S]+?)```/);
    if (match) {
      results = JSON.parse(match[1]);
    } else {
      return res.status(500).json({ error: "No se pudo parsear la respuesta del modelo" });
    }
  }

  return res.json(results);
});

export default router;
