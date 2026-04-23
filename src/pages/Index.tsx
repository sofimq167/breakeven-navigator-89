import { useEffect, useMemo, useRef, useState } from "react";

/* ============================================================
   BreakEven — single-file wizard
   ============================================================ */

// -------------------- Types & Constants --------------------

const INDUSTRIES = [
  { id: "rest", name: "Restaurantes y comida", icon: "fork" },
  { id: "retail", name: "Comercio y retail", icon: "bag" },
  { id: "tech", name: "Tecnología y software", icon: "code" },
  { id: "health", name: "Salud y bienestar", icon: "heart" },
  { id: "edu", name: "Educación y formación", icon: "cap" },
  { id: "build", name: "Construcción y remodelación", icon: "hammer" },
  { id: "fashion", name: "Moda y accesorios", icon: "shirt" },
  { id: "beauty", name: "Belleza y cuidado personal", icon: "sparkle" },
  { id: "art", name: "Arte, diseño y creatividad", icon: "brush" },
  { id: "logi", name: "Logística y transporte", icon: "truck" },
];

const STEP_LABELS = ["Industria", "Tu negocio", "Cuéntanos más", "Análisis", "Resultados"];

const EXPERIENCE_LEVELS = ["Ninguna", "Algo", "Moderada", "Soy experto/a"];

const CURRENCIES = ["COP", "USD", "EUR"];

const REQUIRED_CHECKLIST = [
  { id: "product", label: "Tipo de producto/servicio" },
  { id: "price", label: "Precio estimado" },
  { id: "cost", label: "Costos de producción" },
  { id: "channel", label: "Canales de venta" },
  { id: "market", label: "Tamaño del mercado objetivo" },
];

const PIPELINE_STAGES = [
  { id: "env", label: "Construyendo entorno", duration: 2000, icon: "globe" },
  { id: "agent", label: "Entrenando agente", duration: 8000, icon: "brain" },
  { id: "route", label: "Trazando ruta", duration: 3000, icon: "route" },
  { id: "rec", label: "Generando recomendaciones", duration: 4000, icon: "spark" },
];

const stageDescription = (id: string, industry: string) => {
  switch (id) {
    case "env":
      return `Simulando el comportamiento del mercado para ${industry || "tu industria"}...`;
    case "agent":
      return "El agente está aprendiendo las mejores decisiones en 5.000 simulaciones...";
    case "route":
      return "Encontrando el camino óptimo hacia el punto de equilibrio...";
    case "rec":
      return "Traduciendo los resultados a un plan de acción concreto...";
    default:
      return "";
  }
};

// -------------------- Mock results --------------------

const mockResults = {
  periodsToBreakEven: 8,
  capitalEfficiency: 73,
  optimalChannel: "Venta directa (local)",
  channelConversionRate: "7.2%",
  priceRange: "Medio-Alto (+15% del inicial)",
  steps: [
    {
      period: "1-2",
      action: "Aumenta el ticket promedio un 10%",
      reasoning:
        "Tu margen actual no soporta los costos de adquisición de clientes. Un ajuste del 10% prueba la elasticidad sin alejar a tu cliente habitual.",
      outcome: "+18% de margen por plato",
      risk: null as string | null,
    },
    {
      period: "2-3",
      action: "Prioriza el local sobre las plataformas de delivery",
      reasoning:
        "El CAC en Rappi/iFood consume el 40% de tu margen. Los clientes que entran al local tienen 7x mejor conversión y generan recompra.",
      outcome: "CAC reducido en 60%",
      risk: null,
    },
    {
      period: "3-5",
      action: "Reduce costos fijos en 5%",
      reasoning:
        "El capital está al 65%. Recortar costos fijos extiende el runway 2 periodos, dándole tiempo al canal directo para consolidarse.",
      outcome: "+2 periodos de runway",
      risk: "Capital bajo — evita gastos no esenciales",
    },
    {
      period: "5-7",
      action: "Aumenta inversión en redes sociales un 10%",
      reasoning:
        "La tendencia de ingresos ya es positiva. Reinvertir en adquisición mientras mantienes el precio acelera el crecimiento.",
      outcome: "+22% en tasa de nuevos clientes",
      risk: null,
    },
    {
      period: "7-8",
      action: "Mantén la estrategia actual",
      reasoning:
        "Estás a 1 periodo del punto de equilibrio. Ningún cambio es la decisión óptima aquí — la consistencia es tu mejor herramienta.",
      outcome: "Punto de equilibrio en periodo 8",
      risk: null,
    },
  ],
  capitalCurve: [100, 88, 79, 72, 68, 71, 78, 89, 103],
  revenueCurve: [12, 18, 24, 31, 42, 58, 78, 101, 128],
  conservativeSteps: [
    { period: "1-3", action: "Mantén precios actuales", outcome: "Estabilidad de demanda" },
    { period: "3-6", action: "Reduce costos fijos en 8%", outcome: "+3 periodos de runway" },
    { period: "6-10", action: "Crecimiento orgánico únicamente", outcome: "BE en periodo 11" },
  ],
};

// -------------------- Helpers --------------------

const formatNumber = (n: number | string) => {
  const v = typeof n === "string" ? Number(n.replace(/[^0-9]/g, "")) : n;
  if (!v && v !== 0) return "";
  return v.toLocaleString("es-CO");
};

const currencySymbol = (c: string) => (c === "COP" ? "$" : c === "USD" ? "US$" : "€");

// -------------------- SVG Icons --------------------

const Icon = ({ name, className = "w-6 h-6" }: { name: string; className?: string }) => {
  const common = { className, fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, viewBox: "0 0 24 24" };
  switch (name) {
    case "fork":
      return (<svg {...common}><path d="M8 3v8a2 2 0 002 2h0v8M8 3v6M5 3v6M16 3c-1.5 1-2 3-2 5s.5 4 2 5v8" /></svg>);
    case "bag":
      return (<svg {...common}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6a3 3 0 016 0v2" /></svg>);
    case "code":
      return (<svg {...common}><path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 4l-4 16" /></svg>);
    case "heart":
      return (<svg {...common}><path d="M12 21s-7-4.5-9-10c-1-2.7.5-6 3.5-6 2 0 3.5 1.5 5.5 4 2-2.5 3.5-4 5.5-4 3 0 4.5 3.3 3.5 6-2 5.5-9 10-9 10z" /></svg>);
    case "cap":
      return (<svg {...common}><path d="M2 9l10-5 10 5-10 5L2 9z" /><path d="M6 11v5c0 1.5 3 3 6 3s6-1.5 6-3v-5" /></svg>);
    case "hammer":
      return (<svg {...common}><path d="M14 4l6 6-3 3-6-6 3-3z" /><path d="M11 7L3 15v4h4l8-8" /></svg>);
    case "shirt":
      return (<svg {...common}><path d="M4 7l4-3 4 2 4-2 4 3-3 3v10H7V10L4 7z" /></svg>);
    case "sparkle":
      return (<svg {...common}><path d="M12 3v4M12 17v4M3 12h4M17 12h4M5.5 5.5l2.5 2.5M16 16l2.5 2.5M5.5 18.5L8 16M16 8l2.5-2.5" /></svg>);
    case "brush":
      return (<svg {...common}><path d="M4 20s2-1 4-3 8-9 9-10-1-3-2-2-8 7-10 9-3 4-3 4z" /><circle cx="6" cy="18" r="1.5" /></svg>);
    case "truck":
      return (<svg {...common}><path d="M2 7h11v9H2zM13 10h5l3 3v3h-8" /><circle cx="6" cy="18" r="2" /><circle cx="17" cy="18" r="2" /></svg>);
    case "check":
      return (<svg {...common} strokeWidth={2.5}><path d="M5 12l5 5L20 7" /></svg>);
    case "arrow":
      return (<svg {...common} strokeWidth={2}><path d="M5 12h14M13 5l7 7-7 7" /></svg>);
    case "back":
      return (<svg {...common} strokeWidth={2}><path d="M19 12H5M11 19l-7-7 7-7" /></svg>);
    case "send":
      return (<svg {...common} strokeWidth={2}><path d="M3 12l18-9-7 18-3-7-8-2z" /></svg>);
    case "globe":
      return (<svg {...common}><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18" /></svg>);
    case "brain":
      return (<svg {...common}><path d="M9 4a3 3 0 00-3 3v1a3 3 0 00-2 5 3 3 0 002 5v1a3 3 0 003 3M15 4a3 3 0 013 3v1a3 3 0 012 5 3 3 0 01-2 5v1a3 3 0 01-3 3M12 4v18" /></svg>);
    case "route":
      return (<svg {...common}><circle cx="6" cy="6" r="3" /><circle cx="18" cy="18" r="3" /><path d="M9 6h6a3 3 0 013 3 3 3 0 01-3 3H9a3 3 0 00-3 3 3 3 0 003 3h6" /></svg>);
    case "spark":
      return (<svg {...common}><path d="M12 2l2.5 6.5L21 11l-6.5 2.5L12 20l-2.5-6.5L3 11l6.5-2.5L12 2z" /></svg>);
    case "chevron":
      return (<svg {...common}><path d="M6 9l6 6 6-6" /></svg>);
    case "x":
      return (<svg {...common} strokeWidth={2}><path d="M6 6l12 12M18 6L6 18" /></svg>);
    case "store":
      return (<svg {...common}><path d="M3 9l2-5h14l2 5M3 9v11h18V9M3 9c0 2 2 3 3 3s3-1 3-3 2 3 3 3 3-1 3-3 2 3 3 3 3-1 3-3" /></svg>);
    case "trend":
      return (<svg {...common} strokeWidth={2}><path d="M3 17l6-6 4 4 8-8M14 7h7v7" /></svg>);
    default:
      return null;
  }
};

// -------------------- Progress Bar --------------------

const ProgressBar = ({ current }: { current: number }) => {
  return (
    <header className="fixed top-0 left-0 right-0 z-40 backdrop-blur-xl bg-background/80 border-b border-border">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-primary/15 border border-primary/40 flex items-center justify-center">
            <div className="w-3 h-3 rounded-sm bg-primary" />
          </div>
          <span className="font-display text-xl tracking-tight">BreakEven</span>
        </div>
        <ol className="flex-1 flex items-center justify-between max-w-3xl mx-auto">
          {STEP_LABELS.map((label, i) => {
            const idx = i + 1;
            const completed = current > idx;
            const active = current === idx;
            return (
              <li key={label} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-1.5 min-w-0">
                  <div
                    className={[
                      "w-8 h-8 rounded-full flex items-center justify-center text-xs font-mono transition-all duration-500",
                      completed && "bg-primary text-primary-foreground",
                      active && "bg-background border-2 border-primary text-foreground ring-glow",
                      !completed && !active && "bg-muted/40 border border-border text-muted-foreground",
                    ].filter(Boolean).join(" ")}
                  >
                    {completed ? <Icon name="check" className="w-4 h-4" /> : idx}
                  </div>
                  <span className={[
                    "text-[11px] tracking-wide whitespace-nowrap transition-colors",
                    active ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}>{label}</span>
                </div>
                {i < STEP_LABELS.length - 1 && (
                  <div className="flex-1 h-px mx-2 mb-5 bg-border relative overflow-hidden">
                    <div
                      className="absolute inset-y-0 left-0 bg-primary transition-all duration-700"
                      style={{ width: completed ? "100%" : "0%" }}
                    />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
        <div className="w-7" />
      </div>
    </header>
  );
};

// -------------------- Step 1: Industry --------------------

const StepIndustry = ({ value, custom, onSelect, onCustom, onNext }: any) => {
  const [showCustom, setShowCustom] = useState<boolean>(!!custom);
  const canContinue = !!value || (showCustom && custom?.trim().length > 1);

  return (
    <section className="step-enter max-w-5xl mx-auto px-6 pt-32 pb-16">
      <div className="text-center mb-12 fade-up">
        <h1 className="font-display text-5xl md:text-6xl text-balance leading-[1.05] mb-4">
          ¿En qué industria está tu negocio?
        </h1>
        <p className="text-muted-foreground text-lg">
          Selecciona la que mejor describe lo que quieres crear
        </p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 mb-10">
        {INDUSTRIES.map((ind, i) => {
          const selected = value === ind.id && !showCustom;
          return (
            <button
              key={ind.id}
              onClick={() => { setShowCustom(false); onCustom(""); onSelect(ind.id); }}
              className={[
                "shimmer-overlay group relative overflow-hidden text-left rounded-xl border bg-card p-5 transition-all duration-300 fade-up",
                selected
                  ? "border-primary bg-primary/[0.06] ring-glow"
                  : "border-border hover:border-primary/60 hover:scale-[1.03] hover:bg-card/80",
              ].join(" ")}
              style={{ animationDelay: `${i * 40}ms` }}
            >
              {selected && (
                <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Icon name="check" className="w-3 h-3" />
                </span>
              )}
              <div className={[
                "w-12 h-12 rounded-lg flex items-center justify-center mb-4 transition-colors",
                selected ? "text-primary bg-primary/10" : "text-foreground/80 bg-muted/30 group-hover:text-primary",
              ].join(" ")}>
                <Icon name={ind.icon} className="w-7 h-7" />
              </div>
              <div className="text-sm font-medium leading-tight">{ind.name}</div>
            </button>
          );
        })}
      </div>

      <div className="text-center mb-10">
        {!showCustom ? (
          <button
            onClick={() => { setShowCustom(true); onSelect(""); }}
            className="text-sm text-muted-foreground hover:text-primary underline-offset-4 hover:underline transition-colors"
          >
            ¿No está tu industria? Descríbela →
          </button>
        ) : (
          <div className="max-w-md mx-auto fade-up">
            <input
              autoFocus
              value={custom}
              onChange={(e) => { onCustom(e.target.value); onSelect(""); }}
              placeholder="Describe tu industria..."
              className="w-full px-4 py-3 rounded-lg bg-card border border-primary/40 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary focus:ring-glow transition-all"
            />
            <button
              onClick={() => { setShowCustom(false); onCustom(""); }}
              className="text-xs text-muted-foreground hover:text-foreground mt-2"
            >
              ← Volver a las opciones
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-center">
        <button
          disabled={!canContinue}
          onClick={onNext}
          className={[
            "group flex items-center justify-center gap-2 w-full max-w-md py-4 rounded-lg font-medium transition-all duration-300",
            canContinue
              ? "bg-primary text-primary-foreground hover:scale-[1.02] hover:brightness-110 glow-primary"
              : "bg-muted/30 text-muted-foreground cursor-not-allowed",
          ].join(" ")}
        >
          Continuar
          <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
      </div>
    </section>
  );
};

// -------------------- Step 2: Business Data --------------------

const Chip = ({ active, onClick, children }: any) => (
  <button
    type="button"
    onClick={onClick}
    className={[
      "px-4 py-2 rounded-full border text-sm transition-all duration-200",
      active
        ? "bg-primary text-primary-foreground border-primary glow-primary"
        : "bg-card border-border text-foreground hover:border-primary/60",
    ].join(" ")}
  >
    {children}
  </button>
);

const StepBusiness = ({ data, industryName, industryIcon, onChange, onNext, onBack }: any) => {
  const [tooltip, setTooltip] = useState(false);

  const errors = {
    name: !data.name || data.name.trim().length < 2 ? "Nombre del negocio" : "",
    city: !data.city ? "Ciudad" : "",
    capital: !data.capital || Number(data.capital) <= 0 ? "Capital disponible" : "",
    experience: !data.experience ? "Experiencia previa" : "",
  };
  const missing = Object.values(errors).filter(Boolean);
  const valid = missing.length === 0;

  const handleCapital = (raw: string) => {
    const digits = raw.replace(/[^0-9]/g, "");
    onChange({ ...data, capital: digits });
  };

  return (
    <section className="step-enter max-w-xl mx-auto px-6 pt-32 pb-16">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
        <Icon name="back" className="w-4 h-4" /> Atrás
      </button>

      <div className="mb-8 fade-up">
        <h1 className="font-display text-4xl md:text-5xl mb-3 leading-tight">
          Cuéntanos sobre tu negocio
        </h1>
        <p className="text-muted-foreground">
          Esta información nos ayuda a personalizar el análisis
        </p>
      </div>

      {industryName && (
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/40 bg-primary/5 mb-8 fade-up">
          <Icon name={industryIcon} className="w-4 h-4 text-primary" />
          <span className="text-sm">{industryName}</span>
        </div>
      )}

      <div className="space-y-6">
        <Field
          label="¿Cómo se llamará tu negocio?"
          helper="Puede ser temporal, lo puedes cambiar después"
        >
          <input
            value={data.name}
            onChange={(e) => onChange({ ...data, name: e.target.value })}
            placeholder="Ej: Tacos El Patrón"
            className="w-full px-4 py-3 rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </Field>

        <Field
          label="¿En qué ciudad vas a operar?"
          helper="Esto nos ayuda a contextualizar el mercado"
        >
          <input
            value={data.city}
            onChange={(e) => onChange({ ...data, city: e.target.value })}
            placeholder="Ej: Cali, Colombia"
            className="w-full px-4 py-3 rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors"
          />
        </Field>

        <Field
          label="¿Con cuánto capital cuentas para arrancar?"
          helper="Incluye ahorros, inversión propia o capital de terceros"
        >
          <div className="flex gap-2">
            <div className="flex-1 relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground font-mono text-sm">
                {currencySymbol(data.currency)}
              </span>
              <input
                inputMode="numeric"
                value={data.capital ? formatNumber(data.capital) : ""}
                onChange={(e) => handleCapital(e.target.value)}
                placeholder="0"
                className="w-full pl-10 pr-4 py-3 rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors font-mono"
              />
            </div>
            <select
              value={data.currency}
              onChange={(e) => onChange({ ...data, currency: e.target.value })}
              className="px-3 py-3 rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors font-mono text-sm"
            >
              {CURRENCIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </Field>

        <Field label="¿Tienes experiencia previa en esta industria?">
          <div className="flex flex-wrap gap-2">
            {EXPERIENCE_LEVELS.map((lvl) => (
              <Chip key={lvl} active={data.experience === lvl} onClick={() => onChange({ ...data, experience: lvl })}>
                {lvl}
              </Chip>
            ))}
          </div>
        </Field>
      </div>

      <div className="mt-10 relative">
        <button
          disabled={!valid}
          onClick={onNext}
          onMouseEnter={() => setTooltip(true)}
          onMouseLeave={() => setTooltip(false)}
          className={[
            "group flex items-center justify-center gap-2 w-full py-4 rounded-lg font-medium transition-all duration-300",
            valid
              ? "bg-primary text-primary-foreground hover:scale-[1.01] hover:brightness-110 glow-primary"
              : "bg-muted/30 text-muted-foreground cursor-not-allowed",
          ].join(" ")}
        >
          Continuar <Icon name="arrow" className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </button>
        {!valid && tooltip && (
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 -translate-y-full text-xs px-3 py-2 rounded-md bg-bg-secondary border border-border text-muted-foreground whitespace-nowrap shadow-lg">
            Falta: {missing.join(", ")}
          </div>
        )}
      </div>
    </section>
  );
};

const Field = ({ label, helper, children }: any) => (
  <div className="fade-up">
    <label className="block text-sm font-medium mb-2">{label}</label>
    {children}
    {helper && <p className="text-xs text-muted-foreground mt-1.5">{helper}</p>}
  </div>
);

// -------------------- Step 3: Chat --------------------

type Msg = { id: string; role: "bot" | "user"; text: string; ts: string };

const timestamp = () => {
  const d = new Date();
  return `${d.getHours().toString().padStart(2, "0")}:${d.getMinutes().toString().padStart(2, "0")}`;
};

const StepChat = ({ business, industryName, industryIcon, onNext, onBack }: any) => {
  const greeting = useMemo(
    () =>
      `¡Hola! Ya tengo el contexto inicial de ${business.name}. Veo que quieres abrir un negocio de ${industryName} en ${business.city} con un capital de ${currencySymbol(business.currency)}${formatNumber(business.capital)} ${business.currency}. Para darte el análisis más preciso posible, necesito algunos detalles más sobre la operación. ¿Cuál sería tu producto o servicio principal y cuánto planeas cobrar por él?`,
    [business, industryName]
  );

  const [messages, setMessages] = useState<Msg[]>([
    { id: "g", role: "bot", text: greeting, ts: timestamp() },
  ]);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const [confirmed, setConfirmed] = useState<string[]>([]);
  const [turn, setTurn] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, typing]);

  const followUps = useMemo(() => {
    // Adapt by industry id (rough match)
    const id = INDUSTRIES.find((i) => i.name === industryName)?.id;
    const base = [
      { check: "product", q: "Perfecto. ¿Cuál es tu costo aproximado por unidad o servicio?" },
      { check: "price", q: id === "rest"
        ? "Entendido. ¿Por qué canales venderás? (local, delivery, eventos)"
        : id === "tech"
        ? "Genial. ¿Tu modelo será suscripción, one-time o freemium?"
        : "Bien. ¿Qué canales de venta planeas usar?" },
      { check: "cost", q: "Anotado. ¿Cuál es el tamaño aproximado de tu mercado objetivo?" },
      { check: "channel", q: "Excelente. Última pregunta: ¿cuántos clientes potenciales estimas en tu zona?" },
      { check: "market", q: "Perfecto, tengo todo lo que necesito. Puedes iniciar el análisis cuando quieras desde el panel izquierdo. 🎯" },
    ];
    return base;
  }, [industryName]);

  const send = () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", text: input.trim(), ts: timestamp() };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setTyping(true);

    setTimeout(() => {
      setTyping(false);
      const next = followUps[turn];
      if (next) {
        setConfirmed((c) => Array.from(new Set([...c, next.check])));
        setMessages((m) => [...m, { id: crypto.randomUUID(), role: "bot", text: next.q, ts: timestamp() }]);
        setTurn((t) => t + 1);
      }
    }, 1200);
  };

  const allDone = confirmed.length >= REQUIRED_CHECKLIST.length;

  return (
    <section className="step-enter pt-20 h-screen flex flex-col">
      <button onClick={onBack} className="absolute top-20 left-6 flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors z-10">
        <Icon name="back" className="w-4 h-4" /> Atrás
      </button>

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT */}
        <aside className="w-full max-w-[35%] border-r border-border bg-bg-secondary p-6 flex flex-col overflow-y-auto">
          <div className="rounded-xl bg-card border border-border p-5 mb-6 fade-up">
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full border border-primary/40 bg-primary/5 mb-4 text-xs">
              <Icon name={industryIcon} className="w-3.5 h-3.5 text-primary" />
              <span>{industryName}</span>
            </div>
            <h3 className="font-display text-2xl mb-3 leading-tight">{business.name}</h3>
            <dl className="text-sm space-y-2">
              <div className="flex justify-between"><dt className="text-muted-foreground">Ciudad</dt><dd>{business.city}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Capital</dt><dd className="font-mono text-primary">{currencySymbol(business.currency)}{formatNumber(business.capital)}</dd></div>
              <div className="flex justify-between"><dt className="text-muted-foreground">Experiencia</dt><dd>{business.experience}</dd></div>
            </dl>
          </div>

          <div className="mb-6">
            <h4 className="text-xs uppercase tracking-wider text-muted-foreground mb-3">Lo que aún necesitamos</h4>
            <ul className="space-y-2">
              {REQUIRED_CHECKLIST.map((item) => {
                const done = confirmed.includes(item.id);
                return (
                  <li key={item.id} className="flex items-center gap-3 text-sm">
                    <span className={[
                      "w-5 h-5 rounded border flex items-center justify-center transition-all",
                      done ? "bg-primary border-primary text-primary-foreground" : "border-border",
                    ].join(" ")}>
                      {done && <Icon name="check" className="w-3 h-3" />}
                    </span>
                    <span className={done ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground mt-auto mb-4">
            El análisis dura ~20 segundos una vez tengamos toda la información.
          </p>

          {allDone && (
            <button
              onClick={onNext}
              className="pulse-glow flex items-center justify-center gap-2 w-full py-3.5 rounded-lg bg-primary text-primary-foreground font-medium hover:brightness-110 transition"
            >
              Iniciar análisis <Icon name="arrow" className="w-4 h-4" />
            </button>
          )}
        </aside>

        {/* RIGHT */}
        <div className="flex-1 flex flex-col bg-background">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8">
            <div className="max-w-2xl mx-auto space-y-5">
              {messages.map((m) => (
                <div key={m.id} className={["flex gap-3 fade-up", m.role === "user" ? "justify-end" : "justify-start"].join(" ")}>
                  {m.role === "bot" && (
                    <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-mono font-semibold shrink-0">BE</div>
                  )}
                  <div className={["max-w-[80%]", m.role === "user" ? "items-end" : "items-start", "flex flex-col"].join(" ")}>
                    <div className={[
                      "px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      m.role === "bot"
                        ? "bg-card border border-border rounded-tl-sm"
                        : "bg-primary/15 border border-primary/30 text-foreground rounded-tr-sm",
                    ].join(" ")}>
                      {m.text}
                    </div>
                    <span className="text-[10px] font-mono text-muted-foreground mt-1 px-1">{m.ts}</span>
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-mono font-semibold">BE</div>
                  <div className="bg-card border border-border rounded-2xl rounded-tl-sm px-4 py-3 flex gap-1">
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "0ms" }} />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "200ms" }} />
                    <span className="typing-dot w-1.5 h-1.5 rounded-full bg-muted-foreground" style={{ animationDelay: "400ms" }} />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-border bg-bg-secondary p-4">
            <div className="max-w-2xl mx-auto flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Escribe tu respuesta..."
                disabled={allDone}
                className="flex-1 px-4 py-3 rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors disabled:opacity-50"
              />
              <button
                onClick={send}
                disabled={!input.trim()}
                className="px-4 rounded-lg bg-primary text-primary-foreground hover:brightness-110 disabled:opacity-30 disabled:cursor-not-allowed transition flex items-center justify-center"
              >
                <Icon name="send" className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// -------------------- Step 4: Analysis --------------------

const StepAnalysis = ({ business, industryName, onComplete, onBack }: any) => {
  const [stageIdx, setStageIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const totalDuration = useMemo(() => PIPELINE_STAGES.reduce((s, x) => s + x.duration, 0), []);

  useEffect(() => {
    let cancelled = false;
    let elapsed = 0;
    const startTimer = (i: number) => {
      if (cancelled || i >= PIPELINE_STAGES.length) {
        setTimeout(() => !cancelled && onComplete(), 400);
        return;
      }
      setStageIdx(i);
      const dur = PIPELINE_STAGES[i].duration;
      const start = performance.now();
      const tick = (now: number) => {
        if (cancelled) return;
        const local = Math.min(now - start, dur);
        const pct = ((elapsed + local) / totalDuration) * 100;
        setProgress(pct);
        if (local < dur) requestAnimationFrame(tick);
        else {
          elapsed += dur;
          startTimer(i + 1);
        }
      };
      requestAnimationFrame(tick);
    };
    startTimer(0);
    return () => { cancelled = true; };
  }, [onComplete, totalDuration]);

  return (
    <section className="step-enter pt-32 pb-20 px-6 max-w-3xl mx-auto min-h-screen flex flex-col">
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 self-start transition-colors">
        <Icon name="back" className="w-4 h-4" /> Atrás
      </button>

      <div className="text-center mb-4 fade-up">
        <h1 className="font-display text-5xl mb-3">Analizando tu negocio</h1>
        <p className="text-muted-foreground">Esto tarda entre 15 y 30 segundos</p>
      </div>

      <div className="text-center mb-12">
        <span className="font-display text-3xl text-primary">{business.name}</span>
      </div>

      <div className="mb-12">
        <ol className="flex items-center justify-between max-w-2xl mx-auto">
          {PIPELINE_STAGES.map((stage, i) => {
            const completed = i < stageIdx;
            const active = i === stageIdx;
            return (
              <li key={stage.id} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 min-w-0">
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    {active && (
                      <span className="absolute inset-0 rounded-full border-2 border-primary border-t-transparent spin-ring" />
                    )}
                    <div className={[
                      "w-12 h-12 rounded-full flex items-center justify-center transition-all",
                      completed && "bg-primary text-primary-foreground",
                      active && "bg-primary/15 text-primary",
                      !completed && !active && "bg-muted/30 text-muted-foreground",
                    ].filter(Boolean).join(" ")}>
                      {completed ? <Icon name="check" className="w-5 h-5" /> : <Icon name={stage.icon} className="w-5 h-5" />}
                    </div>
                  </div>
                  <span className={[
                    "text-[11px] text-center max-w-[100px] leading-tight",
                    active ? "text-foreground" : "text-muted-foreground",
                  ].join(" ")}>{stage.label}</span>
                </div>
                {i < PIPELINE_STAGES.length - 1 && (
                  <div className="flex-1 h-px mx-3 mb-6 bg-border relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 bg-primary transition-all duration-700" style={{ width: completed ? "100%" : active ? "50%" : "0%" }} />
                  </div>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      <div className="text-center mb-auto fade-up" key={stageIdx}>
        <p className="text-lg text-muted-foreground">
          {stageDescription(PIPELINE_STAGES[stageIdx]?.id || "", industryName)}
        </p>
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-border">
        <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
      </div>
    </section>
  );
};

// -------------------- Step 5: Results --------------------

const CountUp = ({ value, suffix = "", duration = 1100 }: { value: number; suffix?: string; duration?: number }) => {
  const [n, setN] = useState(0);
  useEffect(() => {
    const start = performance.now();
    let raf = 0;
    const tick = (now: number) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setN(Math.round(eased * value));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [value, duration]);
  return <>{n}{suffix}</>;
};

const ProjectionChart = ({ capital, revenue, breakEvenPeriod, highlightStep }: any) => {
  const W = 560, H = 280, P = 40;
  const max = Math.max(...capital, ...revenue);
  const xs = (i: number) => P + (i / (capital.length - 1)) * (W - P * 2);
  const ys = (v: number) => H - P - (v / max) * (H - P * 2);

  const capitalPath = capital.map((v: number, i: number) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(v)}`).join(" ");
  const revenuePath = revenue.map((v: number, i: number) => `${i === 0 ? "M" : "L"} ${xs(i)} ${ys(v)}`).join(" ");
  const beX = xs(breakEvenPeriod - 1);

  // Areas
  const beforeArea = `M ${P} ${H - P} L ${P} ${ys(0)} ${capital.slice(0, breakEvenPeriod).map((v: number, i: number) => `L ${xs(i)} ${ys(v)}`).join(" ")} L ${beX} ${H - P} Z`;
  const afterArea = `M ${beX} ${H - P} ${capital.slice(breakEvenPeriod - 1).map((v: number, i: number) => `L ${xs(i + breakEvenPeriod - 1)} ${ys(v)}`).join(" ")} L ${xs(capital.length - 1)} ${H - P} Z`;

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="w-full h-auto">
      {/* Grid */}
      {[0.25, 0.5, 0.75, 1].map((f) => (
        <line key={f} x1={P} x2={W - P} y1={H - P - f * (H - P * 2)} y2={H - P - f * (H - P * 2)} stroke="hsl(var(--border))" strokeDasharray="2 4" />
      ))}
      {/* Shaded zones */}
      <path d={beforeArea} fill="hsl(var(--secondary) / 0.08)" />
      <path d={afterArea} fill="hsl(var(--primary) / 0.08)" />

      {/* Axes labels */}
      {capital.map((_: any, i: number) => (
        <text key={i} x={xs(i)} y={H - P + 16} textAnchor="middle" fontSize="10" fill="hsl(var(--muted-foreground))" fontFamily="IBM Plex Mono">
          {i + 1}
        </text>
      ))}

      {/* Break-even line */}
      <line x1={beX} y1={P} x2={beX} y2={H - P} stroke="hsl(var(--primary))" strokeDasharray="4 4" strokeWidth="1" />
      <text x={beX + 6} y={P + 12} fontSize="10" fill="hsl(var(--primary))" fontFamily="IBM Plex Mono">Punto de equilibrio</text>

      {/* Capital line */}
      <path d={capitalPath} fill="none" stroke="hsl(var(--secondary))" strokeWidth="2" strokeDasharray="6 4" pathLength={1} strokeDashoffset={1} style={{ animation: "draw-line 1.6s ease-out 0.1s forwards", strokeDasharray: "1" }} />
      {/* Revenue line */}
      <path d={revenuePath} fill="none" stroke="hsl(var(--primary))" strokeWidth="2.5" pathLength={1} strokeDashoffset={1} style={{ animation: "draw-line 1.6s ease-out 0.4s forwards", strokeDasharray: "1" }} />

      {/* Highlight dot */}
      {highlightStep != null && (
        <circle cx={xs(Math.min(highlightStep, capital.length - 1))} cy={ys(revenue[Math.min(highlightStep, revenue.length - 1)])} r="6" fill="hsl(var(--primary))" stroke="hsl(var(--background))" strokeWidth="2" />
      )}
    </svg>
  );
};

const ArcGauge = ({ value }: { value: number }) => {
  const R = 50, CX = 60, CY = 60;
  const start = Math.PI;
  const end = start + (value / 100) * Math.PI;
  const sx = CX + R * Math.cos(start);
  const sy = CY + R * Math.sin(start);
  const ex = CX + R * Math.cos(end);
  const ey = CY + R * Math.sin(end);
  const large = end - start > Math.PI ? 1 : 0;
  return (
    <svg viewBox="0 0 120 70" className="w-full max-w-[160px]">
      <path d={`M ${CX - R} ${CY} A ${R} ${R} 0 0 1 ${CX + R} ${CY}`} fill="none" stroke="hsl(var(--border))" strokeWidth="8" strokeLinecap="round" />
      <path d={`M ${sx} ${sy} A ${R} ${R} 0 ${large} 1 ${ex} ${ey}`} fill="none" stroke="hsl(var(--primary))" strokeWidth="8" strokeLinecap="round" />
    </svg>
  );
};

const StepResults = ({ business, onWhatIf }: any) => {
  const [selectedStep, setSelectedStep] = useState<number | null>(null);
  const [conservativeOpen, setConservativeOpen] = useState(false);

  return (
    <section className="step-enter pt-20 min-h-screen flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border bg-bg-secondary/80 backdrop-blur-xl">
        <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center justify-between gap-4">
          <div className="flex items-baseline gap-3 min-w-0">
            <span className="font-display text-xl">BreakEven</span>
            <span className="text-sm text-muted-foreground truncate">{business.name}</span>
          </div>
          <div className="hidden md:block text-sm font-medium">
            Tu ruta al punto de equilibrio está lista
          </div>
          <button
            onClick={onWhatIf}
            className="px-4 py-2 rounded-lg bg-secondary/15 border border-secondary/40 text-secondary hover:bg-secondary/25 hover:scale-[1.02] transition text-sm"
          >
            ¿Qué pasa si...?
          </button>
        </div>
        <div className="h-px bg-primary/40" />
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 p-6 max-w-[1600px] mx-auto w-full">
        {/* LEFT — Plan */}
        <div className="col-span-12 lg:col-span-3 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pr-2">
          <h2 className="font-display text-2xl mb-4">Plan de acción</h2>
          <div className="space-y-3">
            {mockResults.steps.map((s, i) => (
              <article
                key={i}
                onClick={() => setSelectedStep(i)}
                className={[
                  "fade-up cursor-pointer rounded-xl border bg-card p-4 transition-all duration-300 hover:border-primary",
                  selectedStep === i ? "border-primary ring-glow" : "border-border",
                ].join(" ")}
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="font-mono text-2xl text-primary">{String(i + 1).padStart(2, "0")}</span>
                  <span className="text-xs text-muted-foreground font-mono">Periodos {s.period}</span>
                </div>
                <h3 className="font-medium text-sm mb-2 leading-snug">{s.action}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed mb-3">{s.reasoning}</p>
                <div className="inline-flex items-center px-2 py-1 rounded-md bg-primary/10 border border-primary/30 text-primary text-xs font-mono">
                  {s.outcome}
                </div>
                {s.risk && (
                  <div className="mt-2 flex items-start gap-2 text-xs italic text-secondary/90">
                    <span className="w-2 h-2 rounded-full bg-secondary mt-1.5 shrink-0" />
                    <span>{s.risk}</span>
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>

        {/* CENTER — Chart */}
        <div className="col-span-12 lg:col-span-6">
          <h2 className="font-display text-2xl mb-4">Proyección de capital e ingresos</h2>
          <div className="rounded-xl border border-border bg-card p-5">
            <div className="flex items-center gap-4 text-xs mb-4">
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-primary" /> Ingresos acumulados</span>
              <span className="flex items-center gap-1.5"><span className="w-3 h-0.5 bg-secondary" style={{ borderTop: "1px dashed" }} /> Capital restante</span>
            </div>
            <ProjectionChart
              capital={mockResults.capitalCurve}
              revenue={mockResults.revenueCurve}
              breakEvenPeriod={mockResults.periodsToBreakEven}
              highlightStep={selectedStep}
            />
            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground mb-2">Línea de tiempo</p>
              <div className="flex items-center gap-2">
                {mockResults.steps.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedStep(i)}
                    className={[
                      "w-3 h-3 rounded-full transition-all",
                      selectedStep === i ? "bg-primary scale-125 ring-glow" : "bg-muted hover:bg-primary/60",
                    ].join(" ")}
                    aria-label={`Paso ${i + 1}`}
                  />
                ))}
                <span className="ml-auto text-xs font-mono text-muted-foreground">
                  {selectedStep != null ? `Paso ${selectedStep + 1} • Periodos ${mockResults.steps[selectedStep].period}` : "Toca un punto"}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT — Metrics */}
        <div className="col-span-12 lg:col-span-3 lg:max-h-[calc(100vh-180px)] lg:overflow-y-auto pr-2 space-y-3">
          <h2 className="font-display text-2xl mb-4">Resumen</h2>

          <MetricCard label="periodos estimados" delay={0}>
            <div className="font-mono text-6xl text-primary leading-none">
              <CountUp value={mockResults.periodsToBreakEven} />
            </div>
            <div className="text-xs text-muted-foreground mt-1">Periodos al equilibrio</div>
          </MetricCard>

          <MetricCard label="eficiencia de capital" delay={100}>
            <div className="flex items-end justify-between">
              <ArcGauge value={mockResults.capitalEfficiency} />
              <div className="font-mono text-4xl text-primary -mb-1">
                <CountUp value={mockResults.capitalEfficiency} suffix="%" />
              </div>
            </div>
          </MetricCard>

          <MetricCard label="canal óptimo" delay={200}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Icon name="store" className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="font-medium text-sm truncate">{mockResults.optimalChannel}</div>
                <div className="font-mono text-xs text-muted-foreground">Conv. {mockResults.channelConversionRate}</div>
              </div>
            </div>
          </MetricCard>

          <MetricCard label="rango de precio" delay={300}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">{mockResults.priceRange}</span>
              <Icon name="trend" className="w-5 h-5 text-primary" />
            </div>
          </MetricCard>

          {/* Conservative */}
          <div className="rounded-xl border border-border bg-card overflow-hidden mt-4">
            <button
              onClick={() => setConservativeOpen((o) => !o)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm hover:bg-muted/20 transition"
            >
              <span className="font-medium">Ruta conservadora</span>
              <Icon name="chevron" className={["w-4 h-4 transition-transform", conservativeOpen && "rotate-180"].filter(Boolean).join(" ")} />
            </button>
            {conservativeOpen && (
              <div className="px-4 pb-4 space-y-2 fade-up">
                {mockResults.conservativeSteps.map((s, i) => (
                  <div key={i} className="text-xs border-l-2 border-neutral-accent/60 pl-3 py-1">
                    <div className="font-mono text-muted-foreground">Periodos {s.period}</div>
                    <div className="font-medium">{s.action}</div>
                    <div className="text-muted-foreground">{s.outcome}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

const MetricCard = ({ label, delay, children }: any) => (
  <div className="fade-up rounded-xl border border-border bg-card p-5 hover:border-primary/50 transition-colors" style={{ animationDelay: `${delay}ms` }}>
    <div className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">{label}</div>
    {children}
  </div>
);

// -------------------- What-if Modal --------------------

const WhatIfModal = ({ business, onClose, onReanalyze }: any) => {
  const [params, setParams] = useState({
    capital: business.capital,
    fixedCosts: "5000000",
    variableCost: "8000",
    price: "25000",
    channels: ["Local"] as string[],
    market: "medium",
  });

  const channelOpts = ["Local", "Delivery", "Online", "Eventos"];
  const marketOpts = [
    { id: "small", label: "Pequeño" },
    { id: "medium", label: "Mediano" },
    { id: "large", label: "Grande" },
  ];

  const toggleChannel = (c: string) =>
    setParams((p) => ({ ...p, channels: p.channels.includes(c) ? p.channels.filter((x) => x !== c) : [...p.channels, c] }));

  return (
    <div className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex items-center justify-center p-6 fade-up overflow-y-auto">
      <div className="w-full max-w-2xl bg-bg-secondary border border-border rounded-2xl p-8 my-auto">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="font-display text-3xl mb-2">Ajusta un parámetro</h2>
            <p className="text-sm text-muted-foreground">Modifica los valores y vuelve a correr el análisis</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted/30 transition">
            <Icon name="x" className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <NumField label="Capital inicial" value={params.capital} onChange={(v: string) => setParams({ ...params, capital: v })} />
            <NumField label="Costos fijos mensuales" value={params.fixedCosts} onChange={(v: string) => setParams({ ...params, fixedCosts: v })} />
            <NumField label="Costo variable / unidad" value={params.variableCost} onChange={(v: string) => setParams({ ...params, variableCost: v })} />
            <NumField label="Precio inicial" value={params.price} onChange={(v: string) => setParams({ ...params, price: v })} />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Canales disponibles</label>
            <div className="flex flex-wrap gap-2">
              {channelOpts.map((c) => (
                <Chip key={c} active={params.channels.includes(c)} onClick={() => toggleChannel(c)}>{c}</Chip>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tamaño del mercado</label>
            <div className="flex gap-2">
              {marketOpts.map((m) => (
                <Chip key={m.id} active={params.market === m.id} onClick={() => setParams({ ...params, market: m.id })}>{m.label}</Chip>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={onClose} className="flex-1 py-3 rounded-lg border border-border hover:bg-muted/20 transition">
            Cancelar
          </button>
          <button onClick={onReanalyze} className="flex-1 py-3 rounded-lg bg-primary text-primary-foreground hover:brightness-110 hover:scale-[1.01] transition glow-primary">
            Volver a analizar
          </button>
        </div>
      </div>
    </div>
  );
};

const NumField = ({ label, value, onChange }: any) => (
  <div>
    <label className="block text-xs text-muted-foreground mb-1.5">{label}</label>
    <input
      inputMode="numeric"
      value={value ? formatNumber(value) : ""}
      onChange={(e) => onChange(e.target.value.replace(/[^0-9]/g, ""))}
      className="w-full px-3 py-2.5 rounded-lg bg-card border border-border focus:border-primary focus:outline-none transition-colors font-mono text-sm"
    />
  </div>
);

// -------------------- Root --------------------

const Index = () => {
  const [step, setStep] = useState(1);
  const [industryId, setIndustryId] = useState("");
  const [customIndustry, setCustomIndustry] = useState("");
  const [showWhatIf, setShowWhatIf] = useState(false);

  const [business, setBusiness] = useState({
    name: "",
    city: "",
    capital: "",
    currency: "COP",
    experience: "",
  });

  const selectedIndustry = INDUSTRIES.find((i) => i.id === industryId);
  const industryName = customIndustry || selectedIndustry?.name || "";
  const industryIcon = selectedIndustry?.icon || "sparkle";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProgressBar current={step} />

      <main className="relative">
        {step === 1 && (
          <StepIndustry
            value={industryId}
            custom={customIndustry}
            onSelect={setIndustryId}
            onCustom={setCustomIndustry}
            onNext={() => setStep(2)}
          />
        )}
        {step === 2 && (
          <StepBusiness
            data={business}
            industryName={industryName}
            industryIcon={industryIcon}
            onChange={setBusiness}
            onNext={() => setStep(3)}
            onBack={() => setStep(1)}
          />
        )}
        {step === 3 && (
          <StepChat
            business={business}
            industryName={industryName}
            industryIcon={industryIcon}
            onNext={() => setStep(4)}
            onBack={() => setStep(2)}
          />
        )}
        {step === 4 && (
          <StepAnalysis
            business={business}
            industryName={industryName}
            onComplete={() => setStep(5)}
            onBack={() => setStep(3)}
          />
        )}
        {step === 5 && (
          <StepResults
            business={business}
            onWhatIf={() => setShowWhatIf(true)}
          />
        )}
      </main>

      {showWhatIf && (
        <WhatIfModal
          business={business}
          onClose={() => setShowWhatIf(false)}
          onReanalyze={() => { setShowWhatIf(false); setStep(4); }}
        />
      )}
    </div>
  );
};

export default Index;
