# BreakEven Navigator

Asistente financiero conversacional que ayuda a emprendedores latinoamericanos a calcular su **punto de equilibrio** y generar un plan de acción personalizado, usando inteligencia artificial (Claude de Anthropic).

---

## ¿Qué hace?

El usuario pasa por un wizard de 5 pasos:

1. **Industria** — selecciona el sector de su negocio (restaurante, tecnología, educación, etc.)
2. **Tu negocio** — ingresa nombre, ciudad, capital inicial y nivel de experiencia
3. **Cuéntanos más** — chat conversacional con IA que recopila producto, precio, costos, canales de venta y tamaño de mercado
4. **Análisis** — la IA procesa los datos y calcula el punto de equilibrio con proyecciones reales
5. **Resultados** — plan de acción paso a paso, gráficas de capital e ingresos, y ruta conservadora alternativa

---

## Stack tecnológico

| Capa | Tecnología |
|------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| Estilos | Tailwind CSS + shadcn/ui |
| Backend | Node.js + Express + TypeScript |
| IA | Anthropic Claude (`claude-sonnet-4-6`) vía `@anthropic-ai/sdk` |
| Contenedores | Docker + Docker Compose |

---

## Estructura del proyecto

```
breakeven-navigator-89/
├── frontend/               # App React/Vite
│   ├── src/
│   │   ├── pages/Index.tsx # Wizard principal (5 pasos)
│   │   └── lib/api.ts      # Cliente HTTP hacia el backend
│   ├── Dockerfile
│   └── vite.config.ts      # Proxy /api → backend:3001
├── backend/                # API Express
│   ├── src/
│   │   ├── index.ts        # Servidor Express (puerto 3001)
│   │   ├── routes/
│   │   │   ├── chat.ts     # POST /api/chat — chat conversacional con Claude
│   │   │   └── analyze.ts  # POST /api/analyze — análisis de punto de equilibrio
│   │   └── types.ts        # Tipos compartidos
│   ├── .env                # API key de Anthropic (NO se sube al repo)
│   └── Dockerfile
└── docker-compose.yml      # Orquesta frontend + backend
```

---

## Requisitos previos

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y corriendo
- Una API key de Anthropic ([console.anthropic.com](https://console.anthropic.com))

---

## Cómo desplegar con Docker Compose

### 1. Clonar el repositorio

```bash
git clone https://github.com/sofimq167/breakeven-navigator-89.git
cd breakeven-navigator-89
```

### 2. Configurar la API key

Crea el archivo `backend/.env`:

```bash
echo "ANTHROPIC_API_KEY=sk-ant-tu-clave-aqui" > backend/.env
```

> La clave se obtiene en [console.anthropic.com/settings/api-keys](https://console.anthropic.com/settings/api-keys).  
> Este archivo está en `.gitignore` y **nunca** se sube al repositorio.

### 3. Levantar los servicios

```bash
docker compose up --build
```

La primera vez descarga las imágenes base y construye los contenedores (~2-3 min). Las siguientes veces es más rápido.

| Servicio | URL |
|----------|-----|
| Frontend | http://localhost:8080 |
| Backend (API) | http://localhost:3001 |
| Health check | http://localhost:3001/health |

### 4. Detener los servicios

```bash
docker compose down
```

---

## Desarrollo local (sin Docker)

### Backend

```bash
cd backend
cp .env.example .env   # o crea .env manualmente con ANTHROPIC_API_KEY
npm install
npm run dev            # tsx watch — hot reload en puerto 3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev            # Vite — hot reload en puerto 8080
```

> El frontend tiene un proxy en `vite.config.ts` que redirige `/api` → `http://localhost:3001` en desarrollo.

---

## Endpoints del backend

### `POST /api/chat`

Chat conversacional que recopila los datos del negocio.

**Body:**
```json
{
  "business": { "name": "...", "city": "...", "capital": "10000000", "currency": "COP", "experience": "Moderada" },
  "industryName": "Educación y formación",
  "messages": [{ "role": "user", "text": "..." }, { "role": "bot", "text": "..." }],
  "turn": 2
}
```

**Response:**
```json
{
  "message": "Respuesta de Claude",
  "confirmedItem": "product" // uno de: product, price, cost, channel, market — o null
}
```

### `POST /api/analyze`

Genera el análisis completo de punto de equilibrio usando los datos de la conversación.

**Body:**
```json
{
  "business": { ... },
  "industryName": "...",
  "messages": [ /* historial completo del chat */ ]
}
```

**Response:** objeto `AnalysisResults` con `periodsToBreakEven`, `steps`, `capitalCurve`, `revenueCurve`, etc.

---

## Variables de entorno

| Variable | Descripción | Requerida |
|----------|-------------|-----------|
| `ANTHROPIC_API_KEY` | API key de Anthropic Claude | Sí |
| `NODE_ENV` | Entorno (`development` / `production`) | No (default: development) |
| `PORT` | Puerto del backend | No (default: 3001) |
