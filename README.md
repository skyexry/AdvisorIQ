# LPL Financial AdvisorIQ

🔗 **Live Demo:** [[advisoriq.vercel.app](https://advisoriq.vercel.app)](https://advisoriq-qvdk3snt4-skyexrys-projects.vercel.app/)

**AdvisorIQ** is an internal AI assistant for LPL Financial advisors. It unifies client portfolios, meeting history, LPL research reports, and compliance documents into a single conversational interface — so advisors can prepare for complex client meetings in minutes instead of hours.

---

## Background

LPL Financial (NASDAQ: LPLA) is the largest independent broker-dealer in the United States, supporting over 32,000 financial advisors and approximately $2.4 trillion in assets under management.

In February 2026, LPL's stock dropped 8.3% after fintech competitor Altruist launched Hazel, a $60/seat AI tax-planning tool that threatened to automate core advisory services. LPL responded with a wave of AI partnerships — Claude (Anthropic), Wealth.com, Jump, Microsoft 365 Copilot, and FactSet — but these tools remained siloed, each solving one workflow in isolation.

**AdvisorIQ** addresses that gap. Modeled on Morgan Stanley's "AI @ Morgan Stanley," it acts as a unified RAG (Retrieval-Augmented Generation) knowledge layer over LPL's fragmented data sources, giving advisors one place to ask questions and get answers grounded in their actual client context.

---

## What It Does

| Feature | Description |
|---|---|
| **Document ingestion** | Upload client portfolios, meeting notes, LPL research reports, and compliance documents as PDFs |
| **Contextual Q&A** | Ask plain-language questions; answers are grounded in the uploaded documents and live client data |
| **Compliance engine** | Automatically surfaces relevant FINRA and SEC rules when answers touch on suitability, tax, or concentrated positions |
| **Source citations** | Every answer cites which document it came from |
| **Suggested follow-ups** | The AI proposes the next three questions an advisor would naturally ask |
| **Chat history** | Conversations are saved locally and can be resumed at any time |

---

## Example Queries

- *"Prepare a meeting brief for Margaret Chen tomorrow."*
- *"What are the compliance flags for her NVDA concentration?"*
- *"What does LPL Research say about private credit for 2026?"*
- *"What open items did we discuss in our last meeting?"*

---

## Why It Matters

High-net-worth clients have complex needs — tax optimization, wealth transfer, alternative assets — that require the trust and judgment that AI alone cannot replicate. AdvisorIQ does not replace advisors; it amplifies their capacity by eliminating the hours spent manually cross-referencing research, compliance rules, and client history before every meeting.

---

## Tech Stack

- **Frontend:** React + TypeScript + Tailwind CSS (Vite)
- **AI:** Claude (Anthropic) via `claude-sonnet-4-6`, with Gemini fallback
- **Document parsing:** PDF.js (client-side, no server upload required)
- **Storage:** Browser localStorage for chat session history

---

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set API keys in `.env.local`:
   ```
   VITE_ANTHROPIC_API_KEY="your-anthropic-api-key"
   GEMINI_API_KEY="your-gemini-api-key"
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

The app runs on `http://localhost:5173`. Upload PDFs using the Document Library in the sidebar, then start asking questions.

---

## Project

Built as a prototype for an IT strategy course exploring AI innovation in wealth management. A five-person team — two members focused on the presentation and IT strategy document, three on the prototype.
