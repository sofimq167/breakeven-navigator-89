import { Router, Request, Response } from "express";
import Anthropic from "@anthropic-ai/sdk";
import { BusinessData, ChatMessage } from "../types.js";

const router = Router();
const client = new Anthropic();

type ChatBody = {
  business: BusinessData;
  industryName: string;
  messages: ChatMessage[];
  turn: number;
};

const SYSTEM_PROMPT = `Eres un consultor experto en análisis de punto de equilibrio financiero para pequeños y medianos negocios en Latinoamérica. Tu objetivo es recopilar información clave del negocio del usuario de forma conversacional, amigable y profesional.

Debes recopilar los siguientes 5 datos (en el orden que fluya naturalmente):
1. product — Producto o servicio principal que ofrece el negocio
2. price — Precio de venta unitario o por servicio
3. cost — Costo aproximado por unidad o servicio
4. channel — Canales de venta que planea usar
5. market — Tamaño del mercado objetivo y clientes potenciales

Reglas importantes:
- Recopila un dato por turno.
- Confirma lo que el usuario acaba de decir antes de pasar al siguiente dato.
- Cuando el usuario confirme un dato con claridad, ese dato queda confirmado aunque luego haga preguntas adicionales.
- Una vez tengas los 5 datos confirmados, díselo al usuario y anímalo a iniciar el análisis.
- Responde siempre en español, de forma concisa (máximo 3 oraciones).

Al final de CADA respuesta tuya, en una línea separada, escribe exactamente:
CONFIRMED:[id] donde [id] es uno de: product, price, cost, channel, market
O si en este turno no se confirmó ningún dato nuevo, escribe:
CONFIRMED:none`;

router.post("/", async (req: Request, res: Response) => {
  const { business, industryName, messages, turn } = req.body as ChatBody;

  if (!business?.name || !industryName || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Faltan campos requeridos: business, industryName, messages" });
  }

  // Drop leading bot messages — Anthropic requires the first message to be from "user"
  const trimmed = [...messages];
  while (trimmed.length > 0 && trimmed[0].role !== "user") trimmed.shift();

  if (trimmed.length === 0) {
    return res.json({ message: `¿Cuál es el producto o servicio principal que ofrece ${business.name}?`, confirmedItem: null });
  }

  const anthropicMessages: Anthropic.MessageParam[] = trimmed.flatMap((m) => {
    if (typeof m.text !== "string") return [];
    const text = m.text.trim();
    if (!text) return [];

    return [{
      role: m.role === "user" ? "user" : "assistant",
      content: text,
    }];
  });

  if (anthropicMessages.length === 0) {
    return res.json({ message: `¿Cuál es el producto o servicio principal que ofrece ${business.name}?`, confirmedItem: null });
  }

  const contextNote = `Contexto del negocio: "${business.name}" en ${business.city}, industria "${industryName}", capital inicial ${business.capital} ${business.currency}, experiencia: ${business.experience}.`;

  let raw = "";
  try {
    const stream = client.messages.stream({
      model: "claude-sonnet-4-6",
      max_tokens: 400,
      system: [
        { type: "text", text: SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
        { type: "text", text: contextNote },
      ],
      messages: anthropicMessages,
    });

    const response = await stream.finalMessage();
    raw = response.content[0]?.type === "text" ? response.content[0].text : "";
  } catch (error) {
    console.error("[chat] Error al consultar Anthropic:", error);
    return res.status(502).json({ error: "Error al consultar el modelo" });
  }

  // Extract CONFIRMED tag and clean message
  const VALID_ITEMS = ["product", "price", "cost", "channel", "market"];
  const match = raw.match(/\nCONFIRMED:(\w+)\s*$/);
  const confirmedTag = match ? match[1] : "none";
  const confirmedItem = VALID_ITEMS.includes(confirmedTag) ? confirmedTag : null;
  const message = raw.replace(/\nCONFIRMED:\w+\s*$/, "").trim();

  return res.json({ message, confirmedItem });
});

export default router;
