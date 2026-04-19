# 🌐 AI Smart Browser

> Chat with any webpage. Summarize, extract, and analyze web content using AI.

![AI Smart Browser](https://img.shields.io/badge/Next.js-14-black?style=flat-square&logo=nextdotjs)
![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-green?style=flat-square&logo=supabase)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o--mini-blue?style=flat-square&logo=openai)
![Tailwind](https://img.shields.io/badge/Tailwind-CSS-38bdf8?style=flat-square&logo=tailwindcss)

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔗 URL Fetch | Enter any URL and instantly load the page content |
| 📋 Paste Mode | Paste HTML or text directly for analysis |
| 💬 AI Chat | Chat with the page like ChatGPT — RAG-powered |
| ⚡ TL;DR | One-click quick summary |
| 📝 Bullet Points | Key points in digestible bullet format |
| 👶 ELI5 | Explain Like I'm 10 — no jargon |
| 🎯 Key Takeaways | Important facts and insights |
| ❓ Key Questions | Questions the content raises |
| 📧 Email Extractor | Regex + AI fallback extraction |
| 📞 Phone Extractor | International phone number detection |
| 📊 Table Extractor | AI-powered structured data extraction |
| 💾 Save Pages | Save to Supabase with tags |
| 🔍 Search History | Full-text search through saved pages |
| 🌙 Dark Mode | System preference + manual toggle |
| 🔐 Auth | Supabase email authentication |
| ⚡ Caching | Page content cached for 10 minutes |
| 🛡️ Rate Limiting | API protection per IP |

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT BROWSER                           │
│                                                                 │
│  ┌──────────────────┐        ┌────────────────────────────────┐ │
│  │   LEFT SIDEBAR   │        │         RIGHT PANEL            │ │
│  │                  │        │                                │ │
│  │  ┌─────────────┐ │        │  ┌────────────────────────┐   │ │
│  │  │  URL Input  │ │        │  │      Chat Panel        │   │ │
│  │  │  Paste Mode │ │        │  │   (ChatGPT-style UI)   │   │ │
│  │  └─────────────┘ │        │  └────────────────────────┘   │ │
│  │  ┌─────────────┐ │        │  ┌────────────────────────┐   │ │
│  │  │   History   │ │        │  │     Summarizer         │   │ │
│  │  │   Search    │ │        │  │  TL;DR | Bullets | ELI5│   │ │
│  │  └─────────────┘ │        │  └────────────────────────┘   │ │
│  └──────────────────┘        │  ┌────────────────────────┐   │ │
│                              │  │    Data Extractor      │   │ │
│                              │  │  Emails | Phones | Data│   │ │
│                              │  └────────────────────────┘   │ │
│                              └────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    ▼               ▼               ▼
            ┌──────────────┐ ┌──────────┐ ┌─────────────┐
            │ /api/fetch-  │ │/api/chat │ │/api/summarize│
            │   page       │ │          │ │/api/extract  │
            └──────┬───────┘ └────┬─────┘ └──────┬──────┘
                   │              │               │
                   ▼              ▼               ▼
            ┌──────────────────────────────────────────┐
            │              External Services           │
            │                                          │
            │  ┌──────────┐  ┌──────────────────────┐  │
            │  │ Web URLs │  │   OpenAI GPT-4o-mini  │  │
            │  │ (fetch)  │  │  (chat/summarize/     │  │
            │  └──────────┘  │   extract)            │  │
            │                └──────────────────────┘  │
            │  ┌───────────────────────────────────┐   │
            │  │          Supabase                 │   │
            │  │   Auth │ Pages │ Summaries │ Chats│   │
            │  └───────────────────────────────────┘   │
            └──────────────────────────────────────────┘
```

### AI / RAG Flow

```
User Question
     │
     ▼
Page Content (raw)
     │
     ▼
Chunk Content (3000 chars/chunk)
     │
     ▼
Keyword Scoring (find relevant chunks)
     │
     ▼
Top 5 Chunks → System Prompt
     │
     ▼
OpenAI GPT-4o-mini
     │
     ▼
Streamed Response → Chat UI
```

---

## 📁 Folder Structure

```
ai-smart-browser/
├── app/
│   ├── api/
│   │   ├── fetch-page/route.ts    # HTML fetcher + cleaner
│   │   ├── chat/route.ts          # AI chat endpoint
│   │   ├── summarize/route.ts     # Summary generation
│   │   └── extract/route.ts       # Data extraction
│   ├── components/
│   │   ├── UrlInput.tsx           # URL/paste input UI
│   │   ├── ChatPanel.tsx          # Chat interface
│   │   ├── Summarizer.tsx         # Summary buttons + display
│   │   ├── DataExtractor.tsx      # Extraction UI
│   │   ├── HistoryPanel.tsx       # Saved pages list
│   │   ├── SavePageModal.tsx      # Save dialog
│   │   └── AuthForm.tsx           # Login/signup form
│   ├── lib/
│   │   ├── supabase.ts            # Supabase client + types
│   │   └── openai.ts              # OpenAI client + RAG utils
│   ├── styles/
│   │   └── globals.css            # Global styles + Tailwind
│   ├── utils/
│   │   ├── parser.ts              # HTML cleaner/parser
│   │   ├── extractor.ts           # Regex extractors
│   │   └── rateLimit.ts           # Rate limiter
│   ├── types.ts                   # TypeScript types
│   ├── layout.tsx                 # Root layout
│   └── page.tsx                   # Main dashboard
├── supabase-schema.sql            # Database schema + RLS
├── .env.example                   # Environment variables
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

---

## 🚀 Setup Instructions

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/ai-smart-browser.git
cd ai-smart-browser
npm install
```

### 2. Environment Variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Supabase - Get from https://supabase.com/dashboard
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key_here

# OpenAI - Get from https://platform.openai.com
OPENAI_API_KEY=sk-...

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 3. Set Up Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** in your Supabase dashboard
3. Copy and paste the contents of `supabase-schema.sql`
4. Click **Run**
5. Enable **Email Auth** in Authentication → Providers

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 5. Deploy to Vercel

```bash
npm install -g vercel
vercel deploy
```

Add your environment variables in the Vercel dashboard.

---

## 🔑 API Reference

### `POST /api/fetch-page`
Fetches and cleans a webpage.

**Body:**
```json
{ "url": "https://example.com" }
// OR
{ "pastedContent": "<html>...</html>" }
```

**Response:**
```json
{
  "title": "Page Title",
  "content": "Cleaned text content...",
  "source": "fetch | cache | paste",
  "url": "https://example.com",
  "stats": { "chars": 12543, "estimatedTokens": 3136 }
}
```

### `POST /api/chat`
Chat with page content using AI.

**Body:**
```json
{
  "question": "What is this about?",
  "pageContent": "...",
  "pageTitle": "Example Page",
  "history": [{ "role": "user", "content": "..." }]
}
```

### `POST /api/summarize`
Generate a summary.

**Body:**
```json
{
  "type": "tldr | bullets | eli5 | keypoints | questions",
  "pageContent": "...",
  "pageTitle": "..."
}
```

### `POST /api/extract`
Extract structured data.

**Body:**
```json
{
  "type": "emails | phones | tables | all",
  "pageContent": "..."
}
```

---

## 🧠 AI Logic

### Context Chunking
- Content is split into ~3000 character chunks at paragraph boundaries
- Prevents token overflow (GPT-4o-mini has 128k context but we optimize for cost)

### Basic RAG
1. User asks a question
2. Content is chunked into paragraphs
3. Each chunk is scored by keyword relevance to the question
4. Top 5 most relevant chunks are sent to OpenAI
5. Reduces token usage by ~80% while maintaining accuracy

### Token Optimization
- Content capped at 50,000 chars (from the HTML cleaner)
- Max 5 chunks × 3000 chars = ~15,000 chars to AI
- Last 10 conversation messages kept in history

---

## 🔐 Security

- Row Level Security (RLS) on all Supabase tables
- Users can only access their own data
- Rate limiting: 10 requests/minute per IP
- URL validation before fetching
- Content-type verification (HTML only)
- 15-second fetch timeout

---

## 🚀 Future Improvements

- [ ] **Embeddings / Vector Search** — Use pgvector in Supabase for semantic chunk retrieval
- [ ] **Streaming responses** — Stream AI output token by token
- [ ] **Chrome Extension** — Browser extension with highlight-to-ask feature
- [ ] **PDF Support** — Upload and analyze PDF documents
- [ ] **Export to PDF** — Export summaries with formatting
- [ ] **Collaboration** — Share pages and chats with team members
- [ ] **Webhooks** — Monitor pages for content changes
- [ ] **API Keys** — Let users bring their own OpenAI key
- [ ] **Multiple AI providers** — Anthropic Claude, Gemini support
- [ ] **Audio summaries** — Text-to-speech for summaries
- [ ] **Browser history sync** — Chrome extension reading history
- [ ] **Redis caching** — Replace in-memory cache with Redis

---

## 📄 License

MIT License — see [LICENSE](./LICENSE) for details.
