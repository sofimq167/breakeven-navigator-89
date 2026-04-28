export type BusinessData = {
  name: string;
  city: string;
  capital: string;
  currency: string;
  experience: string;
};

export type ChatMessage = {
  role: "bot" | "user";
  text: string;
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
