export type BusinessData = {
  name: string;
  city: string;
  capital: string;
  currency: string;
  experience: string;
};

export type ChatMessage = { role: "bot" | "user"; text: string };

export type ChatResponse = {
  message: string;
  confirmedItem: string | null;
};

export type AnalysisStep = {
  period: string;
  action: string;
  reasoning: string;
  outcome: string;
  risk: string | null;
};

export type ConservativeStep = {
  period: string;
  action: string;
  outcome: string;
};

export type WhatIfParams = {
  capital: string;
  fixedCosts: string;
  variableCost: string;
  price: string;
  channels: string[];
  market: string;
};

export type AnalysisResults = {
  periodsToBreakEven: number;
  capitalEfficiency: number;
  optimalChannel: string;
  channelConversionRate: string;
  priceRange: string;
  steps: AnalysisStep[];
  capitalCurve: number[];
  revenueCurve: number[];
  conservativeSteps: ConservativeStep[];
};

export async function sendChatMessage(
  business: BusinessData,
  industryName: string,
  messages: ChatMessage[],
  turn: number
): Promise<ChatResponse> {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ business, industryName, messages, turn }),
  });
  if (!res.ok) throw new Error("Error en el servidor de chat");
  return res.json();
}

export async function runAnalysis(
  business: BusinessData,
  industryName: string,
  messages: ChatMessage[],
  whatIf?: WhatIfParams
): Promise<AnalysisResults> {
  const res = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ business, industryName, messages, whatIf }),
  });
  if (!res.ok) throw new Error("Error en el análisis");
  return res.json();
}
