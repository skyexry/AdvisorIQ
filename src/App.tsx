import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Shield, TrendingUp, Info, Plus, MessageSquare, Trash2, X, Users, ChevronRight, CheckCircle2, Upload, PenLine, ExternalLink, TrendingDown, Minus, AlertTriangle, Database, Building2, BarChart2, Mic } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

// === DATE HELPERS ===
const _now = new Date();
const _fmt = (d: Date) => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
const _fmtTime = (d: Date) => d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
const TODAY = _fmt(_now);
const NOW_ET = `${TODAY} ${_fmtTime(_now)} ET`;
const _tomorrow = new Date(_now); _tomorrow.setDate(_tomorrow.getDate() + 1);
const TOMORROW_DATE = _fmt(_tomorrow);

// === CONFIG ===
const CONFIG = {
  DOCUMENT_TYPES: [
    { id: 'portfolio',   name: 'Client Portfolio',              icon: TrendingUp, syncLabel: `Synced from ClientWorks · ${TODAY}` },
    { id: 'meeting',     name: 'Meeting History',               icon: FileText,   syncLabel: '2 sessions synced · Last: Feb 12, 2026' },
    { id: 'research',    name: 'LPL Research Report',           icon: Info,       syncLabel: '2026 Outlook loaded · LPL Research' },
    { id: 'compliance',  name: 'Compliance Reference',          icon: Shield,     syncLabel: 'Auto-updated · FINRA compliant' },
    { id: 'salesforce',  name: 'Salesforce CRM',                icon: Database,   syncLabel: `Synced from Salesforce · ${TODAY}` },
    { id: 'wealth',      name: 'Wealth.com Estate',             icon: Building2,  syncLabel: 'Synced from Wealth.com · Apr 20, 2026' },
    { id: 'factset',     name: 'FactSet Market Data',           icon: BarChart2,  syncLabel: `Live feed · ${NOW_ET}` },
    { id: 'jump',        name: 'Jump Meeting Notes',            icon: Mic,        syncLabel: 'Last sync: Feb 12, 2026 meeting' }
  ],
  systemPromptBase: "You are AdvisorIQ, an AI assistant for LPL Financial advisors. You have access to data automatically synced from ClientWorks (client portfolio and meeting history), LPL Research 2026 Outlook, and FINRA/SEC compliance rules. Answer questions by synthesizing information across all available data sources. ALWAYS cite at least two data sources in every response, and end your answer with citation tags like [ClientWorks] [LPL Research 2026] [FINRA Rule 2111] as applicable. If the query involves investment recommendations, suitability, or tax advice, append a compliance flag noting relevant FINRA or SEC considerations. IMPORTANT: You must return the response as a JSON object with EXACTLY the following format, and do not wrap it in markdown block quotes. Format: { \"answer\": \"string containing your response in plain advisor-friendly language using markdown for formatting (use **bold** for headers, - for lists). End with citation tags like [ClientWorks] [LPL Research 2026] [FINRA Rule 2111]\", \"sources\": [\"ClientWorks\", \"LPL Research 2026\"], \"complianceFlags\": [\"string\"], \"dataSourcesUsed\": [\"string\"], \"suggestedQuestions\": [\"string\", \"string\", \"string\"] }. For suggestedQuestions, generate 3 concise follow-up questions an advisor would naturally ask next."
};

// === DATA SOURCES ===
const mockClients = [
  {
    id: 'margaret',
    name: "Margaret Chen",
    age: 58,
    occupation: "Retired CFO",
    aum: "$4.2M",
    riskProfile: "Moderate-Aggressive",
    concentration: "NVDA 40%",
    state: "California",
    marginalTaxRate: "~54%",
    nextMeeting: "May 6, 2026",
    openItems: [
      "CRT vs DAF comparison not sent",
      "Private credit options not researched",
      "Trust structure pending"
    ],
    portfolioAllocation: [
      { name: 'Equity', value: 40, color: '#003087' },
      { name: 'Fixed Income', value: 20, color: '#0055A5' },
      { name: 'Real Estate', value: 18, color: '#4BA4D5' },
      { name: 'Cash', value: 15, color: '#C9A84C' },
      { name: 'Alternatives', value: 7, color: '#A08D45' }
    ]
  },
  {
    id: 'robert',
    name: "Robert Martinez",
    age: 65,
    occupation: "Business Owner",
    aum: "$2.8M",
    riskProfile: "Conservative",
    concentration: "Cash 35%",
    state: "Texas",
    marginalTaxRate: "~37%",
    nextMeeting: "Apr 25, 2026",
    openItems: [
      "IRA rollover strategy pending",
      "Estate planning review overdue"
    ],
    portfolioAllocation: [
      { name: 'Equity', value: 25, color: '#003087' },
      { name: 'Fixed Income', value: 40, color: '#0055A5' },
      { name: 'Real Estate', value: 0, color: '#4BA4D5' },
      { name: 'Cash', value: 35, color: '#C9A84C' },
      { name: 'Alternatives', value: 0, color: '#A08D45' }
    ]
  },
  {
    id: 'sarah',
    name: "Sarah Johnson",
    age: 45,
    occupation: "Tech Executive",
    aum: "$1.5M",
    riskProfile: "Aggressive",
    concentration: "Tech Sector 55%",
    state: "Washington",
    marginalTaxRate: "~43%",
    nextMeeting: "May 2, 2026",
    openItems: [
      "RSU vesting strategy needed",
      "401k allocation review"
    ],
    portfolioAllocation: [
      { name: 'Equity', value: 65, color: '#003087' },
      { name: 'Fixed Income', value: 10, color: '#0055A5' },
      { name: 'Real Estate', value: 5, color: '#4BA4D5' },
      { name: 'Cash', value: 10, color: '#C9A84C' },
      { name: 'Alternatives', value: 10, color: '#A08D45' }
    ]
  },
  {
    id: 'david',
    name: "David Park",
    age: 52,
    occupation: "Surgeon",
    aum: "$3.1M",
    riskProfile: "Moderate",
    concentration: "Real Estate 42%",
    state: "New York",
    marginalTaxRate: "~50%",
    nextMeeting: "May 8, 2026",
    openItems: [
      "Malpractice insurance review",
      "529 plan contribution strategy"
    ],
    portfolioAllocation: [
      { name: 'Equity', value: 30, color: '#003087' },
      { name: 'Fixed Income', value: 18, color: '#0055A5' },
      { name: 'Real Estate', value: 42, color: '#4BA4D5' },
      { name: 'Cash', value: 5, color: '#C9A84C' },
      { name: 'Alternatives', value: 5, color: '#A08D45' }
    ]
  }
];

const MOCK_DOC_CONTENT: Record<string, string> = {
  portfolio: `CLIENT PORTFOLIO — Margaret Chen
Source: ClientWorks  |  As of: April 24, 2026

Total AUM: $4,200,000
Risk Profile: Moderate-Aggressive
Marginal Tax Rate: ~54% (California)
Occupation: Retired CFO, Age 58

─── HOLDINGS ───────────────────────────
NVDA (NVIDIA Corp)       40%   $1,680,000
Fixed Income (diversified) 20%   $840,000
Real Estate                18%   $756,000
Cash & Equivalents         15%   $630,000
Alternatives                7%   $294,000

─── FLAGS ──────────────────────────────
⚠  NVDA position at 40% — concentrated single-stock risk
⚠  California suitability review required (CCR Title 10)
⚠  High marginal tax rate — tax-efficient structures advised

─── OPEN ITEMS ─────────────────────────
• CRT vs DAF comparison — not sent (since Jan 2026)
• Private credit options — not researched
• Trust structure — pending legal review`,

  meeting: `MEETING HISTORY — Margaret Chen
Source: ClientWorks CRM  |  3 sessions on file

─── SESSION 3 — Mar 15, 2026 ───────────
Topics: Estate planning, trust structure, wealth transfer
Duration: 60 min  |  Format: In-person
Key Discussion:
  - Reviewed irrevocable trust options for estate tax mitigation
  - Client expressed interest in charitable remainder trust (CRT)
  - Discussed DAF as alternative for philanthropic goals
Action Items (PENDING):
  • Send CRT vs DAF side-by-side comparison
  • Introduce estate attorney contact

─── SESSION 2 — Feb 28, 2026 ───────────
Topics: NVDA concentration, private credit overview
Duration: 45 min  |  Format: Video call
Key Discussion:
  - Reviewed NVDA position and downside risk scenarios
  - Client acknowledged concentration risk (documented)
  - Introduced private credit as alternative yield source
Action Items (PENDING):
  • Research LPL-approved private credit vehicles
  • Model portfolio impact of 10% alt allocation

─── SESSION 1 — Jan 12, 2026 ───────────
Topics: Year-end tax review, Q1 strategy
Duration: 50 min  |  Format: In-person
Key Discussion:
  - Reviewed 2025 realized gains and tax positioning
  - Discussed harvesting losses in fixed income sleeve
Action Items (COMPLETE): Tax summary sent ✓`,

  research: `LPL RESEARCH 2026 OUTLOOK
Source: LPL Research  |  Published: January 2026

─── MACRO VIEWS ────────────────────────
• 10-Year Treasury: 3.75–4.25% range expected through 2026
• Equities: Neutral; policy-driven volatility elevated in H1
• Inflation: Moderating but above 2% target through mid-year
• Fed: 1–2 cuts expected in H2 2026, data-dependent

─── ASSET CLASS RECOMMENDATIONS ─────────
Overweight:
  + Private Credit — strong risk-adjusted yield vs. IG bonds
  + Infrastructure & Real Assets — inflation hedge
  + Alternatives — low correlation in volatile environment

Neutral:
  = US Large Cap Equity — valuation stretched post-AI rally
  = International Developed — currency risk offsets value

Underweight:
  - Long-Duration Treasuries — rate sensitivity risk
  - Speculative Tech — AI concentration premium elevated

─── HIGH-NET-WORTH GUIDANCE ────────────
• California clients: prioritize tax-efficient structures
  (CRT, DAF, 1031 exchanges, direct indexing)
• Concentrated equity positions: systematic diversification
  recommended; explore exchange funds or collars
• Estate planning: elevated exemption sunset risk in 2026`,

  compliance: `COMPLIANCE REFERENCE — Active Rules
Source: LPL Compliance Engine  |  Auto-updated: April 24, 2026

─── FINRA RULE 2111 — SUITABILITY ──────
Advisors must have a reasonable basis to believe a
recommendation is suitable for the customer based on their
investment profile. Document client profile before recommending
alternatives, concentrated equity, or leveraged products.

─── SEC REGULATION BEST INTEREST ───────
All recommendations must be in the client's best interest.
Full documentation of rationale required. Conflicts of interest
must be disclosed at point of recommendation.

─── CCR TITLE 10 (CALIFORNIA) ──────────
California-specific suitability requirements apply to all
product recommendations made to CA-domiciled clients.
State-level fiduciary standard may exceed federal requirements.

─── LPL TAX ADVICE POLICY ──────────────
LPL Financial does not provide tax advice. Advisors may
discuss general tax concepts but must refer clients to a
qualified CPA or tax attorney for specific advice.

─── CONCENTRATED POSITION POLICY ───────
Positions exceeding 20% of portfolio in a single security
require documented client acknowledgment of concentration risk.
Annual review and re-acknowledgment recommended.

─── CHARITABLE GIVING RULES ────────────
CRT and DAF recommendations require disclosure of tax
benefits, limitations, and irrevocability where applicable.
Refer to LPL Charitable Strategies desk for structuring.`
};

const COMPLIANCE_RULES_DETAILED = [
  {
    id: 'finra-2111', badge: 'FINRA', badgeColor: 'bg-blue-100 text-blue-700',
    title: 'Rule 2111 — Suitability',
    summary: 'Must confirm client investment profile before recommending alternatives, concentrated equity, or leveraged products.',
    url: 'https://www.finra.org/rules-guidance/rulebooks/finra-rules/2111',
    trigger: 'Any investment recommendation'
  },
  {
    id: 'reg-bi', badge: 'SEC', badgeColor: 'bg-purple-100 text-purple-700',
    title: 'Regulation Best Interest (Rule 15l-1)',
    summary: "All recommendations must prioritize the client's best interest. Conflicts of interest must be disclosed at point of recommendation.",
    url: 'https://www.sec.gov/info/smallbus/secg/regulation-best-interest',
    trigger: 'Any product or strategy recommendation'
  },
  {
    id: 'ca-ccr', badge: 'CA', badgeColor: 'bg-yellow-100 text-yellow-700',
    title: 'CCR Title 10 — California Suitability',
    summary: 'California-specific suitability requirements for CA-domiciled clients. State fiduciary standard may exceed federal requirements.',
    url: 'https://dfpi.ca.gov/licensees-and-industries/investment-advisers/',
    trigger: 'Client is California-domiciled ✓ (Margaret Chen)'
  },
  {
    id: 'lpl-tax', badge: 'LPL', badgeColor: 'bg-green-100 text-green-700',
    title: 'LPL Tax Advice Policy',
    summary: 'LPL Financial does not provide tax advice. Advisors may discuss general tax concepts but must refer clients to a CPA or tax attorney.',
    url: 'https://www.irs.gov/businesses/small-businesses-self-employed/investment-income-and-expenses',
    trigger: 'Any tax-related strategy discussion'
  },
  {
    id: 'concentration', badge: 'FINRA', badgeColor: 'bg-red-100 text-red-700',
    title: 'Concentrated Position Policy',
    summary: 'Positions >20% in a single security require documented client acknowledgment of concentration risk. Annual re-acknowledgment recommended.',
    url: 'https://www.finra.org/investors/insights/concentrated-stock-positions',
    trigger: 'NVDA at 40% — acknowledgment required ⚠'
  },
  {
    id: 'charitable', badge: 'IRS', badgeColor: 'bg-orange-100 text-orange-700',
    title: 'Charitable Remainder Trust & DAF Rules',
    summary: 'CRT and DAF recommendations require disclosure of irrevocability, tax benefits, distribution requirements, and investment restrictions.',
    url: 'https://www.irs.gov/charities-non-profits/charitable-remainder-trusts',
    trigger: 'CRT or DAF discussion with client'
  }
];

const RESEARCH_ASSET_CLASSES = [
  { name: 'Private Credit', stance: 'Overweight', note: 'Strong risk-adjusted yield vs. IG bonds' },
  { name: 'Infrastructure & Real Assets', stance: 'Overweight', note: 'Inflation hedge, low correlation to equities' },
  { name: 'Alternatives', stance: 'Overweight', note: 'Diversification in policy-volatile environment' },
  { name: 'US Large Cap Equity', stance: 'Neutral', note: 'Valuation stretched post-AI rally' },
  { name: 'International Developed', stance: 'Neutral', note: 'Currency risk offsets valuation discount' },
  { name: 'Long-Duration Treasuries', stance: 'Underweight', note: 'Rate sensitivity risk remains elevated' },
  { name: 'Speculative Tech', stance: 'Underweight', note: 'AI concentration premium at historical highs' }
];

const CITATION_COLORS: Record<string, { bg: string; text: string; label: string }> = {
  'CW':    { bg: '#003087', text: '#ffffff', label: 'ClientWorks' },
  'MTG':   { bg: '#0F766E', text: '#ffffff', label: 'Meeting History' },
  'LPL-R': { bg: '#C9A84C', text: '#ffffff', label: 'LPL Research' },
  'Compl': { bg: '#DC2626', text: '#ffffff', label: 'Compliance Rules' },
  'SF':    { bg: '#1D4ED8', text: '#ffffff', label: 'Salesforce CRM' },
  'W.com': { bg: '#7C3AED', text: '#ffffff', label: 'Wealth.com Estate' },
  'FS':    { bg: '#15803D', text: '#ffffff', label: 'FactSet Market Data' },
  'Jump':  { bg: '#EA580C', text: '#ffffff', label: 'Jump Meeting Notes' },
};

const AUDIT_ROWS = [
  { id: 'A001', date: TODAY,          client: 'Margaret Chen',   advisor: 'J. Whitfield', type: 'NVDA Concentration — Rebalance Decision', tags: ['NVDA', 'Concentration', 'CA'],   isLive: true,  status: 'pending'   as const },
  { id: 'A002', date: 'Mar 15, 2026', client: 'Robert Martinez', advisor: 'J. Whitfield', type: 'IRA Rollover Strategy',                   tags: ['IRA', 'Rollover'],              isLive: false, status: 'approved'  as const },
  { id: 'A003', date: 'Feb 22, 2026', client: 'Sarah Johnson',   advisor: 'J. Whitfield', type: 'Tech Sector Concentration (55%)',           tags: ['Tech', 'Concentration'],        isLive: false, status: 'overridden' as const },
  { id: 'A004', date: 'Feb 8, 2026',  client: 'Margaret Chen',   advisor: 'J. Whitfield', type: 'CRT Recommendation Review',                 tags: ['CRT', 'Charitable'],            isLive: false, status: 'approved'  as const },
  { id: 'A005', date: 'Jan 12, 2026', client: 'David Park',      advisor: 'J. Whitfield', type: 'Real Estate Concentration (42%)',           tags: ['Real Estate', 'Concentration'], isLive: false, status: 'approved'  as const },
  { id: 'A006', date: 'Dec 10, 2025', client: 'Robert Martinez', advisor: 'J. Whitfield', type: 'IRA Rollover to Managed Account',           tags: ['IRA', 'Managed'],              isLive: false, status: 'approved'  as const },
  { id: 'A007', date: 'Nov 18, 2025', client: 'Margaret Chen',   advisor: 'J. Whitfield', type: 'Private Credit Allocation Review',          tags: ['Private Credit', 'Alt'],       isLive: false, status: 'approved'  as const },
];

const mockResearchData = {
  views: "Favor alternatives and private credit for 2026. 10-year Treasury expected to remain in 3.75-4.25% range. Policy-driven volatility expected."
};

const mockComplianceData = [
  { trigger: "California", rule: "California-specific: Verify state suitability requirements under CCR Title 10", citation: "CCR Title 10" },
  { trigger: "recommend", rule: "FINRA Rule 2111 — Suitability: Confirm client profile before recommending alternatives", citation: "FINRA Rule 2111" },
  { trigger: "tax", rule: "LPL Tax Advice Policy: Remind client that LPL Financial does not provide tax advice. Consult a tax professional.", citation: "LPL Policy" },
  { trigger: "NVDA", rule: "Concentrated position: Document client acknowledgment of NVDA concentration risk", citation: "Risk Disclosure" },
  { trigger: "concentrat", rule: "Concentrated position: Document client acknowledgment of concentration risk", citation: "Risk Disclosure" }
];

// === TYPES ===
interface ChatMsg {
  role: 'user' | 'assistant';
  content: string;
  sources?: string[];
  complianceFlags?: string[];
  suggestedQuestions?: string[];
  timestamp: number;
  specialType?: 'meeting-brief' | 'compliance-gate';
}

interface ChatSession {
  id: string;
  title: string;
  messages: ChatMsg[];
  timestamp: number;
}

// === SESSION STORAGE ===
const SESSIONS_KEY = 'advisoriq_sessions';

const loadSessions = (): ChatSession[] => {
  try {
    return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]');
  } catch {
    return [];
  }
};

const persistSessions = (sessions: ChatSession[]) => {
  const trimmed = sessions.slice(0, 20);
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(trimmed));
};

const newSessionId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// === INIT ===
const loadPdfJs = async () => {
   if ((window as any).pdfjsLib) return (window as any).pdfjsLib;
   return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
      script.onload = () => {
         (window as any).pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';
         resolve((window as any).pdfjsLib);
      };
      script.onerror = reject;
      document.body.appendChild(script);
   });
};

// === MARKDOWN RENDERER ===
const renderInline = (text: string): React.ReactNode => {
  const segments: React.ReactNode[] = [];
  const regex = /\*\*([^*]+)\*\*|\*([^*]+)\*/g;
  let lastIndex = 0;
  let match;
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) segments.push(text.slice(lastIndex, match.index));
    if (match[1] !== undefined) segments.push(<strong key={match.index}>{match[1]}</strong>);
    else segments.push(<em key={match.index}>{match[2]}</em>);
    lastIndex = regex.lastIndex;
  }
  if (lastIndex < text.length) segments.push(text.slice(lastIndex));
  return segments.length === 0 ? text : segments.length === 1 ? segments[0] : <>{segments}</>;
};

const renderMarkdown = (text: string): React.ReactNode => {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let listItems: string[] = [];
  let key = 0;

  const flushList = () => {
    if (listItems.length === 0) return;
    elements.push(
      <ul key={key++} className="list-disc pl-5 space-y-0.5 my-1">
        {listItems.map((item, i) => <li key={i}>{renderInline(item)}</li>)}
      </ul>
    );
    listItems = [];
  };

  lines.forEach((line) => {
    if (line.startsWith('### ')) {
      flushList();
      elements.push(<p key={key++} className="font-bold text-sm mt-2 mb-0.5">{renderInline(line.slice(4))}</p>);
    } else if (line.startsWith('## ')) {
      flushList();
      elements.push(<p key={key++} className="font-bold text-sm mt-2 mb-0.5">{renderInline(line.slice(3))}</p>);
    } else if (line.startsWith('# ')) {
      flushList();
      elements.push(<p key={key++} className="font-bold text-base mt-2 mb-1">{renderInline(line.slice(2))}</p>);
    } else if (line.startsWith('- ') || line.startsWith('* ')) {
      listItems.push(line.slice(2));
    } else if (line.trim() === '') {
      flushList();
      if (elements.length > 0) elements.push(<div key={key++} className="h-1" />);
    } else {
      flushList();
      elements.push(<p key={key++} className="mb-0.5">{renderInline(line)}</p>);
    }
  });
  flushList();
  return <>{elements}</>;
};

// === API LAYER ===
const constructPrompt = (inputText: string, uploadedDocs: any, clientData: any, advisorNotes: string[]) => {
  const notesSection = advisorNotes.length > 0
    ? `\n\nAdvisor Notes & Updates (manually entered — high priority context):\n${advisorNotes.map((n, i) => `${i + 1}. ${n}`).join('\n')}`
    : '';
  let contextData = `Current Client Context:\n${JSON.stringify(clientData, null, 2)}${notesSection}\n\nLPL Research Context (2026):\n${JSON.stringify(mockResearchData, null, 2)}\n\nCompliance Rules Available:\n${JSON.stringify(mockComplianceData, null, 2)}\n\nUploaded Documents:\n`;
  Object.values(uploadedDocs).forEach((doc: any) => {
     if (doc && doc.text) {
        const typeName = CONFIG.DOCUMENT_TYPES.find(t => t.id === doc.typeId)?.name;
        contextData += `\n--- Document Type: ${typeName} (Filename: ${doc.filename}) ---\n${doc.text}\n`;
     }
  });
  return `${contextData}\n\nUser Question: ${inputText}`;
};

const callAnthropicAPI = async (systemPrompt: string, userPrompt: string, apiKey: string) => {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      signal: controller.signal,
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }]
      })
    });
    clearTimeout(timeout);

    if (!response.ok) {
       const errText = await response.text();
       throw new Error(`Anthropic API Error: ${response.status} - ${errText}`);
    }

    const data = await response.json();
    let textOut = data.content?.[0]?.text || '{}';
    const jsonMatch = textOut.match(/```json\n([\s\S]*?)\n```/);
    if (jsonMatch) textOut = jsonMatch[1];
    return JSON.parse(textOut);
  } catch (err) {
    console.error("Anthropic call failed", err);
    throw err;
  }
};

const callGeminiAPI = async (systemPrompt: string, userPrompt: string) => {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    config: {
      systemInstruction: systemPrompt,
      responseMimeType: 'application/json',
      responseSchema: {
         type: Type.OBJECT,
         properties: {
             answer: { type: Type.STRING },
             sources: { type: Type.ARRAY, items: { type: Type.STRING } },
             complianceFlags: { type: Type.ARRAY, items: { type: Type.STRING } },
             dataSourcesUsed: { type: Type.ARRAY, items: { type: Type.STRING } },
             suggestedQuestions: { type: Type.ARRAY, items: { type: Type.STRING } }
         },
         required: ["answer", "sources", "complianceFlags", "dataSourcesUsed", "suggestedQuestions"]
      }
    }
  });
  return JSON.parse(response.text);
};

const askAdvisorIQ = async (inputText: string, uploadedDocs: any, clientData: any, advisorNotes: string[]) => {
   const systemPrompt = CONFIG.systemPromptBase;
   const fullPrompt = constructPrompt(inputText, uploadedDocs, clientData, advisorNotes);

   const anthropicKey = (import.meta as any).env.VITE_ANTHROPIC_API_KEY;
   if (anthropicKey) {
      return await callAnthropicAPI(systemPrompt, fullPrompt, anthropicKey);
   } else if (process.env.GEMINI_API_KEY) {
      return await callGeminiAPI(systemPrompt, fullPrompt);
   } else {
      throw new Error("No valid AI API Configuration found.");
   }
};

// === CITATION PIN ===
const CitationPin: React.FC<{ code: string; onClick?: () => void }> = ({ code, onClick }) => {
  const [show, setShow] = useState(false);
  const c = CITATION_COLORS[code] ?? { bg: '#64748B', text: '#ffffff', label: code };
  return (
    <span
      className={`relative inline-flex items-center mx-0.5 align-middle ${onClick ? 'cursor-pointer' : 'cursor-default'}`}
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
      onClick={onClick}
    >
      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded leading-none" style={{ backgroundColor: c.bg, color: c.text }}>
        {code}
      </span>
      {show && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-gray-900 text-white text-[10px] px-2 py-1 rounded z-50 pointer-events-none shadow-lg">
          {c.label}
        </span>
      )}
    </span>
  );
};

// === MEETING BRIEF ===
const MeetingBriefContent = ({ onNvdaClick, client }: { onNvdaClick: () => void; client: any }) => {
  const openItems = [
    { text: 'CRT vs DAF comparison',       committed: 'Feb 19, 2026', overdue: 67, sources: ['MTG', 'SF'] },
    { text: 'LPL private credit research', committed: 'Mar 1, 2026',  overdue: 57, sources: ['MTG', 'LPL-R'] },
    { text: 'Estate attorney referral',    committed: 'Mar 15, 2026', overdue: 43, sources: ['W.com', 'SF'] },
  ];
  const lastSessionNotes = [
    { note: 'NVDA emotional attachment — client cited founder story as reason to hold', src: 'Jump' },
    { note: 'Exchange fund structure introduced — client receptive, wants modeling', src: 'LPL-R' },
    { note: 'CRT vs DAF comparison requested — "I\'d like a side-by-side"', src: 'MTG' },
    { note: 'Private credit interest: targets 5–7% yield without selling NVDA', src: 'LPL-R' },
    { note: 'Life insurance expiry flagged — aware policy expires Q3 2027', src: 'W.com' },
  ];
  const agenda = [
    { item: 'Present CRT vs DAF side-by-side comparison (overdue)',         sources: ['LPL-R', 'W.com'] },
    { item: 'LPL private credit fund options — present 3 vehicles',          sources: ['LPL-R'] },
    { item: 'Estate attorney introduction — 2019 will needs updating',        sources: ['W.com', 'SF'] },
    { item: 'Life insurance review — $1M term expires Q3 2027',              sources: ['W.com'] },
    { item: 'RSU tax positioning — $800K vested Jan 2026, no plan yet',      sources: ['FS', 'CW'] },
  ];
  return (
    <div className="bg-white border border-border rounded-xl text-[13px] leading-relaxed max-w-[90%] overflow-hidden shadow-sm">
      <div className="bg-[#003087] text-white px-5 py-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="font-bold text-base">Meeting Brief — {client.name}</div>
            <div className="text-[11px] text-blue-200 mt-0.5">{client.nextMeeting} · 2:00 PM · In-person · Palo Alto Office</div>
          </div>
          <div className="text-right text-[10px] text-blue-200 shrink-0 ml-4">
            <div>Prepared by AdvisorIQ</div>
            <div>8 data sources</div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* 1 — Snapshot */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Quick Snapshot</div>
          <div className="grid grid-cols-2 gap-2 mb-2">
            {[
              { label: 'Total AUM',    value: client.aum,           src: 'CW'  },
              { label: 'Risk Profile', value: client.riskProfile,   src: 'CW'  },
              { label: 'Tax Rate',     value: client.marginalTaxRate + ' (CA)', src: 'CW' },
              { label: 'Open Items',   value: '3 overdue',          src: 'SF'  },
            ].map(item => (
              <div key={item.label} className="bg-[#F8FAFC] border border-border rounded-lg p-2.5 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-gray-400">{item.label}</div>
                  <div className="text-xs font-bold text-gray-800">{item.value}</div>
                </div>
                <CitationPin code={item.src} />
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-red-50 border border-red-100 rounded-lg p-2.5">
            <AlertTriangle size={13} className="text-red-500 shrink-0" />
            <span className="text-xs text-red-700 font-medium">NVDA concentration: {client.concentration} ($1.68M)</span>
            <CitationPin code="CW" onClick={onNvdaClick} />
            <CitationPin code="Compl" onClick={onNvdaClick} />
            <button onClick={onNvdaClick} className="text-[10px] text-red-500 ml-auto underline hover:text-red-700">View detail →</button>
          </div>
        </div>

        {/* 2 — Open items */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">
            Open Action Items <span className="text-red-500">({openItems.length} overdue)</span>
          </div>
          <div className="space-y-2">
            {openItems.map((item, i) => (
              <div key={i} className="flex items-start gap-3 border border-red-100 bg-red-50 rounded-lg p-3">
                <AlertTriangle size={12} className="text-red-400 mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800">{item.text}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">Committed {item.committed}</div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded font-bold">+{item.overdue}d</span>
                  {item.sources.map(s => <CitationPin key={s} code={s} />)}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3 — Last session */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            Last Session — Feb 12, 2026
            <CitationPin code="MTG" /><CitationPin code="Jump" />
          </div>
          <div className="border border-border rounded-xl p-3 space-y-2">
            <div className="text-[10px] text-gray-400">75 min · In-person · Palo Alto</div>
            <div className="space-y-1.5">
              {lastSessionNotes.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-xs text-gray-700">
                  <span className="mt-1 text-gray-300 text-[8px]">●</span>
                  <span className="flex-1">{item.note}</span>
                  <CitationPin code={item.src} />
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2 mt-1">
              <AlertTriangle size={11} className="shrink-0" />
              Spouse (David Chen) was NOT present — expected at upcoming meeting
              <CitationPin code="Jump" />
            </div>
          </div>
        </div>

        {/* 4 — Agenda */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recommended Agenda</div>
          <div className="space-y-1.5">
            {agenda.map((a, i) => (
              <div key={i} className="flex items-center gap-2 p-2.5 bg-[#F8FAFC] border border-border rounded-lg">
                <span className="text-[10px] font-bold text-[#003087] w-4 shrink-0">{i + 1}.</span>
                <span className="text-xs text-gray-700 flex-1">{a.item}</span>
                <div className="flex gap-0.5 shrink-0">{a.sources.map(s => <CitationPin key={s} code={s} />)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* 5 — Compliance triggers */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Compliance Triggers</div>
          <div className="space-y-1.5">
            {[
              { rule: 'NVDA >20% single-stock — annual acknowledgment required' },
              { rule: 'CA CCR §260.218 — suitability documentation needed' },
              { rule: 'FINRA Rule 2111 — concentrated position disclosure' },
            ].map((c, i) => (
              <div key={i} className="flex items-center gap-2 p-2 border border-amber-100 bg-amber-50 rounded-lg">
                <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                <span className="text-[11px] text-amber-800 flex-1">{c.rule}</span>
                <CitationPin code="Compl" />
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="px-5 py-3 border-t border-border bg-[#F8F9FB] text-[10px] text-gray-400 flex items-center gap-2">
        <CheckCircle2 size={11} className="text-green-500 shrink-0" />
        8 systems consulted · 2.4s · 23 citations · $0.027 query cost
      </div>
    </div>
  );
};

// === OVERRIDE MODAL ===
const OverrideModal: React.FC<{
  onSubmit: (data: { category: string; rationale: string }) => void;
  onClose: () => void;
}> = ({ onSubmit, onClose }) => {
  const [category, setCategory] = useState('');
  const [rationale, setRationale] = useState('');
  const [clientAck, setClientAck] = useState<'aware' | 'pending' | ''>('');

  const CATEGORIES = [
    'Client preference / emotional attachment',
    'Tax loss harvesting in progress',
    'Alternative strategy already in motion',
    'Market timing consideration',
    'Supervisor-approved exception',
  ];

  const canSubmit = category && rationale.trim().length >= 20 && clientAck;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-[520px] max-h-[90vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-5 border-b border-border flex items-start justify-between">
          <div>
            <div className="font-bold text-sm text-gray-800">Override Recommendation</div>
            <div className="text-[10px] text-gray-400 mt-0.5">This action will be logged to the supervisor audit trail</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={16} /></button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">Override Category</label>
            <select
              value={category}
              onChange={e => setCategory(e.target.value)}
              className="w-full border border-border rounded-lg px-3 py-2.5 text-sm text-gray-800 outline-none focus:border-[#003087] bg-white"
            >
              <option value="">Select category...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1.5">
              Override Rationale <span className="font-normal text-gray-400">(min 20 characters)</span>
            </label>
            <textarea
              value={rationale}
              onChange={e => setRationale(e.target.value)}
              placeholder="Explain the reason for overriding this recommendation..."
              className="w-full border border-border rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#003087] resize-none leading-relaxed"
              rows={4}
            />
            <div className={`text-[10px] mt-1 ${rationale.trim().length >= 20 ? 'text-green-600' : 'text-gray-400'}`}>
              {rationale.trim().length} / 20 min characters
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-2">Client Acknowledgment</label>
            <div className="space-y-2">
              {([
                { value: 'aware',   label: 'Client is aware of this override and agrees with the decision' },
                { value: 'pending', label: 'Supervisor approval required — supervisor has been notified' },
              ] as const).map(opt => (
                <label key={opt.value} className="flex items-start gap-2.5 cursor-pointer">
                  <input type="radio" name="clientAck" value={opt.value} checked={clientAck === opt.value} onChange={() => setClientAck(opt.value)} className="mt-0.5" />
                  <span className="text-xs text-gray-700">{opt.label}</span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="p-5 border-t border-border flex gap-3">
          <button onClick={onClose} className="flex-1 border border-border text-gray-600 text-sm py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Cancel</button>
          <button
            onClick={() => canSubmit && onSubmit({ category, rationale: rationale.trim() })}
            disabled={!canSubmit}
            className="flex-1 bg-amber-600 text-white text-sm font-semibold py-2.5 rounded-lg hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Submit Override
          </button>
        </div>
      </div>
    </div>
  );
};

// === COMPLIANCE GATE ===
const ComplianceGateContent: React.FC<{
  acks: boolean[];
  exported: boolean;
  timestamp: string | null;
  recommendationStatus: 'accepted' | 'overridden' | null;
  overrideData: { category: string; rationale: string; timestamp: string } | null;
  onAck: (idx: number, val: boolean) => void;
  onExport: () => void;
  onAccept: () => void;
  onShowOverride: () => void;
}> = ({ acks, exported, timestamp, recommendationStatus, overrideData, onAck, onExport, onAccept, onShowOverride }) => {
  const allAcked = acks.every(Boolean);
  const isOverridden = recommendationStatus === 'overridden';

  const triggeredRules = [
    { badge: 'FINRA', color: 'bg-blue-100 text-blue-700',    title: 'Rule 2111 — Suitability',        note: 'Concentrated equity recommendation requires documented suitability review.' },
    { badge: 'CA',    color: 'bg-yellow-100 text-yellow-700', title: 'CCR §260.218 — State Fiduciary', note: 'California-domiciled client — state standard may exceed federal requirements.' },
    { badge: 'LPL',   color: 'bg-red-100 text-red-700',      title: 'Concentration Policy (>20%)',     note: 'NVDA at 40% requires annual documented client acknowledgment of concentration risk.' },
  ];

  const ackLabels = [
    'I confirm this recommendation has been reviewed for suitability under FINRA Rule 2111.',
    'I acknowledge California CCR §260.218 suitability requirements have been considered.',
    'I certify NVDA concentration risk (40%) has been documented and disclosed to the client.',
  ];

  return (
    <div className="bg-white border border-border rounded-xl text-[13px] leading-relaxed max-w-[90%] overflow-hidden shadow-sm">
      <div className="bg-amber-50 border-b border-amber-200 px-5 py-4">
        <div className="flex items-center gap-3">
          <AlertTriangle size={18} className="text-amber-600 shrink-0" />
          <div>
            <div className="font-bold text-sm text-amber-900">Compliance Gate — Action Required</div>
            <div className="text-[11px] text-amber-700 mt-0.5">3 compliance rules triggered. Acknowledge all items before exporting.</div>
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {/* Triggered rules */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Triggered Rules</div>
          <div className="space-y-2">
            {triggeredRules.map((r, i) => (
              <div key={i} className="flex items-start gap-3 p-3 border border-amber-100 bg-amber-50/60 rounded-lg">
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${r.color}`}>{r.badge}</span>
                <div>
                  <div className="text-xs font-semibold text-gray-800">{r.title}</div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{r.note}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* AI Recommendation */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1">
            AI-Generated Recommendation
            <CitationPin code="CW" /><CitationPin code="LPL-R" /><CitationPin code="FS" />
            {isOverridden && <span className="ml-auto text-[9px] bg-red-500 text-white px-2 py-0.5 rounded font-bold uppercase">Overridden</span>}
            {recommendationStatus === 'accepted' && <span className="ml-auto text-[9px] bg-green-600 text-white px-2 py-0.5 rounded font-bold uppercase">Accepted</span>}
          </div>
          <div className={`border rounded-xl p-4 space-y-2.5 text-xs text-gray-700 leading-relaxed transition-opacity ${isOverridden ? 'border-red-200 opacity-50' : 'border-border'}`}>
            {[
              { label: 'Option 1 — Exchange Fund', body: 'Transfer NVDA shares into an SEC-registered exchange fund. Achieves diversification without triggering a taxable event. Estimated lock-up: 7 years.', srcs: ['LPL-R', 'Compl'] },
              { label: 'Option 2 — Harvest Fixed Income Losses', body: 'Offset near-term gains by harvesting losses in the fixed income sleeve (~$840K notional). Estimated net tax savings ~$45K this calendar year.', srcs: ['CW', 'FS'] },
              { label: 'Option 3 — Phased Sale', body: 'Sell $200K of NVDA annually to remain within the 20% federal long-term cap gains bracket. Reduces concentration to <20% over 4–5 years.', srcs: ['CW', 'LPL-R'] },
              { label: 'Option 4 — Protective Collar', body: 'Buy puts + sell covered calls on NVDA to limit downside while preserving upside. Appropriate if client declines all sale strategies.', srcs: ['LPL-R'] },
            ].map((opt, i) => (
              <p key={i} className={isOverridden ? 'line-through' : ''}>
                <strong>{opt.label}:</strong> {opt.body}
                {opt.srcs.map(s => <CitationPin key={s} code={s} />)}
              </p>
            ))}
            <div className={`mt-1 bg-[#F8FAFC] border border-border rounded-lg p-2.5 text-[11px] text-gray-500 ${isOverridden ? 'line-through' : ''}`}>
              ⚠ Estimated tax at full liquidation: <strong className="text-red-700">~$647,535</strong> — 54% blended (Fed 20% LT + CA 13.3% + NIIT 3.8%)
              <CitationPin code="FS" /><CitationPin code="Compl" />
            </div>
          </div>

          {isOverridden && overrideData && (
            <div className="mt-2 border border-amber-200 bg-amber-50 rounded-xl p-3 space-y-1">
              <div className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Override Rationale — Logged to Audit</div>
              <div className="text-xs text-amber-800"><strong>Category:</strong> {overrideData.category}</div>
              <div className="text-xs text-amber-700 italic">"{overrideData.rationale}"</div>
              <div className="text-[10px] text-amber-500">{overrideData.timestamp}</div>
            </div>
          )}
        </div>

        {/* Action row */}
        {!recommendationStatus ? (
          <div className="flex gap-2">
            <button onClick={onAccept} className="flex-1 bg-green-600 text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-green-700 transition-colors">✓ Accept</button>
            <button className="flex-1 border border-border text-gray-600 text-xs font-semibold py-2.5 rounded-lg hover:bg-gray-50 transition-colors">Modify</button>
            <button onClick={onShowOverride} className="flex-1 border border-amber-300 text-amber-700 text-xs font-semibold py-2.5 rounded-lg hover:bg-amber-50 transition-colors">Override</button>
          </div>
        ) : (
          <div className={`flex items-center gap-2 rounded-lg p-3 ${recommendationStatus === 'accepted' ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
            {recommendationStatus === 'accepted'
              ? <CheckCircle2 size={14} className="text-green-600 shrink-0" />
              : <AlertTriangle size={14} className="text-amber-600 shrink-0" />}
            <span className={`text-xs font-semibold ${recommendationStatus === 'accepted' ? 'text-green-800' : 'text-amber-800'}`}>
              {recommendationStatus === 'accepted' ? 'Recommendation Accepted' : 'Recommendation Overridden — Logged to Supervisor Audit'}
            </span>
          </div>
        )}

        {/* Acknowledgment checkboxes */}
        <div>
          <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Required Acknowledgments</div>
          <div className="space-y-2">
            {ackLabels.map((label, i) => (
              <label key={i} className={`flex items-start gap-3 p-3 border rounded-xl cursor-pointer transition-colors ${acks[i] ? 'border-green-200 bg-green-50' : 'border-border hover:bg-gray-50'}`}>
                <input type="checkbox" checked={acks[i]} onChange={e => onAck(i, e.target.checked)} className="mt-0.5 shrink-0 h-4 w-4 rounded accent-green-600" />
                <span className={`text-xs leading-relaxed flex-1 ${acks[i] ? 'text-green-800' : 'text-gray-700'}`}>{label}</span>
                {acks[i] && <CheckCircle2 size={14} className="text-green-500 shrink-0 mt-0.5" />}
              </label>
            ))}
          </div>
        </div>

        {/* Export buttons */}
        {!exported && (
          <div className="flex gap-3">
            <button onClick={onExport} disabled={!allAcked} className="flex-1 bg-[#003087] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#002070] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Export to Supervisor</button>
            <button disabled={!allAcked} className="flex-1 border border-[#003087] text-[#003087] text-xs font-semibold py-2.5 rounded-lg hover:bg-[#EEF2FF] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">Send to Client</button>
          </div>
        )}

        {exported && timestamp && (
          <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
            <CheckCircle2 size={18} className="text-green-600 shrink-0" />
            <div>
              <div className="text-xs font-bold text-green-800">Submitted to Supervisor Audit Log</div>
              <div className="text-[11px] text-green-600 mt-0.5">{timestamp} · Tracking #CHEN-{timestamp.replace(/\D/g, '').slice(-6)}</div>
            </div>
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-border bg-[#F8F9FB] text-[10px] text-gray-400 flex items-center gap-2">
        <CheckCircle2 size={11} className="text-green-500 shrink-0" />
        6 systems consulted · 2.4s · 23 citations · $0.027 query cost
      </div>
    </div>
  );
};

// === SUPERVISOR VIEW ===
const SupervisorView = ({ rows, selectedEntry, onSelectEntry, complianceExported, complianceTimestamp, complianceAcks, recommendationStatus, overrideData }: any) => {
  const getLiveStatus = () => {
    if (recommendationStatus === 'overridden') return { label: 'Overridden',    cls: 'bg-amber-100 text-amber-700' };
    if (recommendationStatus === 'accepted')   return { label: 'Accepted',      cls: 'bg-green-100 text-green-700' };
    if (complianceExported)                    return { label: 'Acknowledged',  cls: 'bg-green-100 text-green-700' };
    return                                            { label: 'Pending',       cls: 'bg-red-100 text-red-700' };
  };
  const getStatus = (row: any) => {
    if (row.isLive) return getLiveStatus();
    if (row.status === 'overridden') return { label: 'Overridden', cls: 'bg-amber-100 text-amber-700' };
    return { label: 'Approved', cls: 'bg-green-100 text-green-700' };
  };
  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-4xl mx-auto">
        <div className="mb-5">
          <div className="font-bold text-lg text-gray-800">Supervisor Audit Log</div>
          <div className="text-xs text-gray-400 mt-0.5">All compliance reviews and recommendation events across your book.</div>
        </div>
        <div className="bg-white border border-border rounded-xl overflow-hidden shadow-sm">
          <div className="grid grid-cols-[110px_1fr_2fr_100px_90px] text-[10px] font-bold text-gray-400 uppercase tracking-widest border-b border-border px-4 py-3 gap-4">
            <span>Date</span><span>Client</span><span>Event</span><span>Advisor</span><span>Status</span>
          </div>
          {rows.map((row: any) => {
            const status = getStatus(row);
            const isSelected = selectedEntry === row.id;
            return (
              <button
                key={row.id}
                onClick={() => onSelectEntry(isSelected ? null : row.id)}
                className={`w-full grid grid-cols-[110px_1fr_2fr_100px_90px] items-start px-4 py-3.5 border-b border-border text-left transition-colors gap-4 ${isSelected ? 'bg-[#EEF2FF]' : 'hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-1.5 pt-0.5">
                  <span className="text-xs text-gray-600 leading-none">{row.date}</span>
                  {row.isLive && <span className="text-[8px] bg-red-500 text-white px-1.5 py-0.5 rounded-full font-bold animate-pulse shrink-0">LIVE</span>}
                </div>
                <span className="text-xs font-semibold text-gray-800 pt-0.5">{row.client}</span>
                <div>
                  <div className="text-xs text-gray-700">{row.type}</div>
                  <div className="flex gap-1 mt-1 flex-wrap">
                    {row.tags.map((t: string) => <span key={t} className="text-[9px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">{t}</span>)}
                  </div>
                </div>
                <span className="text-xs text-gray-500 pt-0.5">{row.advisor}</span>
                <span className={`text-[10px] font-bold px-2 py-1 rounded-lg text-center w-fit ${status.cls}`}>{status.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const AuditDetailPanel = ({ entryId, rows, complianceExported, complianceTimestamp, complianceAcks, recommendationStatus, overrideData, onClose }: any) => {
  const row = rows.find((r: any) => r.id === entryId);
  if (!row) return null;

  const ACK_LABELS = [
    'FINRA Rule 2111 — Suitability review',
    'CA CCR §260.218 — State fiduciary standard',
    'NVDA Concentration (>20%) — Annual acknowledgment',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div className="mt-[64px] mr-0 w-[440px] bg-white border-l border-border shadow-xl h-[calc(100vh-64px)] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="p-4 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <div className="font-bold text-sm text-gray-800">{row.type}</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{row.client} · {row.date}</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 mt-0.5"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {row.isLive ? (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[9px] bg-red-500 text-white px-2 py-0.5 rounded-full font-bold">LIVE SESSION</span>
                <span className="text-xs text-gray-400">{TODAY}</span>
              </div>

              <div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Compliance Acknowledgments</div>
                {ACK_LABELS.map((label, i) => (
                  <div key={i} className={`flex items-center gap-2 p-2.5 rounded-lg mb-1.5 border ${complianceAcks[i] ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
                    {complianceAcks[i]
                      ? <CheckCircle2 size={13} className="text-green-600 shrink-0" />
                      : <div className="h-3.5 w-3.5 rounded-full border-2 border-gray-300 shrink-0" />}
                    <span className={`text-xs ${complianceAcks[i] ? 'text-green-800' : 'text-gray-400'}`}>{label}</span>
                  </div>
                ))}
              </div>

              {recommendationStatus && (
                <div>
                  <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Recommendation Decision</div>
                  <div className={`flex items-center gap-2 p-3 rounded-xl border ${recommendationStatus === 'accepted' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                    {recommendationStatus === 'accepted' ? <CheckCircle2 size={14} className="text-green-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
                    <span className={`text-xs font-semibold ${recommendationStatus === 'accepted' ? 'text-green-800' : 'text-amber-800'}`}>
                      {recommendationStatus === 'accepted' ? 'Advisor accepted AI recommendation' : 'Advisor submitted override'}
                    </span>
                  </div>
                  {recommendationStatus === 'overridden' && overrideData && (
                    <div className="mt-2 bg-amber-50 border border-amber-200 rounded-xl p-3 space-y-1">
                      <div className="text-[10px] font-bold text-amber-800 uppercase tracking-widest">Override Details</div>
                      <div className="text-xs text-amber-800"><strong>Category:</strong> {overrideData.category}</div>
                      <div className="text-xs text-amber-700 italic">"{overrideData.rationale}"</div>
                      <div className="text-[10px] text-amber-500">{overrideData.timestamp}</div>
                    </div>
                  )}
                </div>
              )}

              {complianceExported ? (
                <div className="flex items-center gap-3 bg-green-50 border border-green-200 rounded-xl p-4">
                  <CheckCircle2 size={16} className="text-green-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-green-800">Exported to Audit Log</div>
                    <div className="text-[11px] text-green-600 mt-0.5">
                      {complianceTimestamp} · #CHEN-{(complianceTimestamp ?? '').replace(/\D/g, '').slice(-6)}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 rounded-xl p-3">
                  <AlertTriangle size={14} className="text-amber-600 shrink-0" />
                  <span className="text-xs text-amber-800">Pending — advisor has not yet exported acknowledgment</span>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-2">
                {[{ label: 'Client', value: row.client }, { label: 'Advisor', value: row.advisor }, { label: 'Date', value: row.date }, { label: 'Status', value: row.status === 'approved' ? 'Approved' : 'Overridden' }].map(item => (
                  <div key={item.label} className="bg-[#F8FAFC] border border-border rounded-lg p-2.5">
                    <div className="text-[9px] text-gray-400 uppercase tracking-wide">{item.label}</div>
                    <div className="text-xs font-semibold text-gray-800 mt-0.5">{item.value}</div>
                  </div>
                ))}
              </div>
              <div className={`flex items-center gap-2 p-3 rounded-xl border ${row.status === 'approved' ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'}`}>
                {row.status === 'approved' ? <CheckCircle2 size={14} className="text-green-600" /> : <AlertTriangle size={14} className="text-amber-600" />}
                <span className={`text-xs font-semibold ${row.status === 'approved' ? 'text-green-800' : 'text-amber-800'}`}>
                  {row.status === 'approved' ? 'All compliance requirements met and approved' : 'Recommendation override logged to audit trail'}
                </span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {row.tags.map((t: string) => <span key={t} className="text-[10px] bg-[#EEF2FF] text-[#003087] px-2 py-0.5 rounded font-medium">{t}</span>)}
              </div>
            </>
          )}
        </div>

        <div className="p-4 border-t border-border bg-[#F8F9FB] shrink-0 text-center text-[10px] text-gray-400">
          LPL Supervisor Audit System · All entries are immutable once logged
        </div>
      </div>
    </div>
  );
};

// === METRICS STRIP ===
const MetricsStrip = () => (
  <div className="px-6 shrink-0 max-w-5xl mx-auto w-full">
    <div className="border-t border-border pt-2 pb-1 flex items-center justify-center gap-2 flex-wrap">
      {[
        { icon: '⚡', label: '2.4s avg response' },
        { icon: '📚', label: '8 systems' },
        { icon: '🔗', label: '23 citations / query' },
        { icon: '💲', label: '$0.027 / query' },
        { icon: '✓',  label: '99.2% uptime' },
      ].map((m, i, arr) => (
        <span key={m.label} className="flex items-center gap-1">
          <span className="text-[11px] text-gray-400">
            <span className="mr-0.5">{m.icon}</span>{m.label}
          </span>
          {i < arr.length - 1 && <span className="text-gray-200 ml-2">·</span>}
        </span>
      ))}
    </div>
  </div>
);

// === UI COMPONENTS ===
const WelcomeScreen = ({ onSuggestionClick, clientName }: any) => {
  const firstName = clientName.split(' ')[0];
  const queries = [
    `Prepare meeting brief for ${firstName} tomorrow`,
    "Compliance flags for NVDA concentration",
    "What does LPL Research say about private credit?",
    "What are the open items from our last meeting?",
    `Should ${firstName} rebalance, harvest losses, or hold given her NVDA concentration?`
  ];

  return (
    <div className="bg-white border border-border p-4 px-5 rounded-xl text-[14px] leading-relaxed mb-4 max-w-[85%] text-gray-800">
      <p className="mb-4">I've pulled {clientName}'s latest portfolio and activity directly from ClientWorks, and loaded today's LPL Research and compliance rules. How can I assist with your preparation for tomorrow's meeting?</p>
      <div className="grid grid-cols-2 gap-3">
        {queries.map((q, i) => (
          <button
             key={i}
             onClick={() => onSuggestionClick(q)}
             className={`text-left p-3 border border-border rounded-lg hover:border-[#003087] transition-colors group${i === 4 ? ' col-span-2' : ''}`}
          >
             <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">Suggested</div>
             <div className="text-xs font-medium group-hover:text-[#003087]">{q}</div>
          </button>
        ))}
      </div>
    </div>
  );
};

const ChatMessage = ({ msg, isLast, onSuggestionClick }: any) => {
  const isUser = msg.role === 'user';

  if (isUser) {
    return (
      <div className="flex justify-end mb-4">
        <div className="bg-[#003087] text-white p-3 px-4 rounded-xl text-[14px] leading-relaxed max-w-[85%]">
          {msg.content}
        </div>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="bg-white border border-border p-3 px-4 rounded-xl text-[14px] leading-relaxed max-w-[85%]">
        <div className="text-[14px] leading-relaxed">{renderMarkdown(msg.content)}</div>

        {msg.sources && msg.sources.length > 0 && (
           <div className="mt-3">
             {msg.sources.map((src: string, idx: number) => (
                <span key={idx} className="inline-block bg-[#EDF2F7] px-2 py-0.5 rounded text-[10px] font-semibold text-[#4A5568] mr-1">
                   [{src}]
                </span>
             ))}
           </div>
        )}

        {msg.complianceFlags && msg.complianceFlags.length > 0 && (
           <div className="space-y-2 mt-3">
              {msg.complianceFlags.map((flag: string, idx: number) => (
                 <div key={idx} className="bg-[#FFFBEB] border border-[#FEF3C7] border-l-4 border-l-[#F59E0B] rounded-md p-3">
                    <div className="text-[11px] font-bold text-[#92400E] flex items-center gap-1 mb-1">
                       <span>⚠</span> COMPLIANCE NOTICE
                    </div>
                    <div className="text-xs text-[#92400E] leading-relaxed">
                       <p><strong>Compliance Engine:</strong> {flag}</p>
                    </div>
                    <div className="mt-2 text-[9px] text-[#D97706] border-t border-[#FEF3C7] pt-1 uppercase">
                       LPL Compliance Review Required • Tracking #{msg.timestamp.toString().slice(-6)}-CHEN
                    </div>
                 </div>
              ))}
           </div>
        )}
      </div>

      {isLast && msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2 max-w-[85%]">
          {msg.suggestedQuestions.map((q: string, idx: number) => (
            <button
              key={idx}
              onClick={() => onSuggestionClick(q)}
              className="text-left text-[11px] bg-white border border-[#003087]/20 text-[#003087] px-3 py-1.5 rounded-full hover:bg-[#003087] hover:text-white transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DocumentSlot = ({ type, uploadedDoc, onClick }: any) => {
   return (
      <button
         onClick={onClick}
         className="w-full text-left border border-green-100 bg-[#F0FDF4] hover:bg-[#DCFCE7] hover:border-green-300 rounded-md p-2.5 mb-2 text-xs transition-colors group"
      >
         <div className="flex items-center justify-between">
            <span className="font-semibold text-gray-700 group-hover:text-green-800">{type.name}</span>
            <div className="flex items-center gap-1">
               {uploadedDoc && <span className="text-[9px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-bold uppercase">Overridden</span>}
               <CheckCircle2 size={13} className="text-green-500 shrink-0" />
            </div>
         </div>
         <div className="mt-1 text-[10px] text-green-600">
            {uploadedDoc ? `Overridden: ${uploadedDoc.filename}` : type.syncLabel}
         </div>
      </button>
   );
};

// === DOCUMENT VIEWS ===
const PortfolioDocView = ({ client }: any) => {
  const totalAum = parseFloat(client.aum.replace(/[$M]/g, '')) * 1_000_000;
  return (
    <div className="space-y-5">
      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Total AUM', value: client.aum },
          { label: 'Risk Profile', value: client.riskProfile },
          { label: 'Tax Rate', value: client.marginalTaxRate }
        ].map(s => (
          <div key={s.label} className="bg-[#F8FAFC] border border-border rounded-lg p-3 text-center">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
            <div className="text-sm font-bold text-gray-800 mt-0.5">{s.value}</div>
          </div>
        ))}
      </div>

      {/* Donut chart + legend */}
      <div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Portfolio Allocation</div>
        <div className="flex items-center gap-4">
          <ResponsiveContainer width={160} height={160}>
            <PieChart>
              <Pie data={client.portfolioAllocation} cx="50%" cy="50%" innerRadius={45} outerRadius={72} paddingAngle={2} dataKey="value">
                {client.portfolioAllocation.map((entry: any, i: number) => (
                  <Cell key={i} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip formatter={(v: any) => `${v}%`} />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex-1 space-y-2">
            {client.portfolioAllocation.map((a: any) => (
              <div key={a.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: a.color }} />
                  <span className="text-xs text-gray-600">{a.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${a.value}%`, backgroundColor: a.color }} />
                  </div>
                  <span className="text-xs font-bold text-gray-700 w-8 text-right">{a.value}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Holdings table */}
      <div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Key Holdings</div>
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-border text-gray-400 text-[10px]">
              <th className="text-left pb-1.5">Asset</th>
              <th className="text-right pb-1.5">Weight</th>
              <th className="text-right pb-1.5">Value</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {client.portfolioAllocation.map((a: any) => (
              <tr key={a.name}>
                <td className="py-1.5 text-gray-700">{a.name}</td>
                <td className="py-1.5 text-right font-medium text-gray-700">{a.value}%</td>
                <td className="py-1.5 text-right text-gray-500">${((totalAum * a.value) / 100 / 1000).toFixed(0)}K</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Flags */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest">Risk Flags</div>
        <div className="flex items-start gap-2 bg-red-50 border border-red-100 rounded-lg p-3">
          <AlertTriangle size={13} className="text-red-500 mt-0.5 shrink-0" />
          <span className="text-xs text-red-700">{client.concentration} — concentrated single-stock risk. Client acknowledgment required.</span>
        </div>
        <div className="flex items-start gap-2 bg-amber-50 border border-amber-100 rounded-lg p-3">
          <AlertTriangle size={13} className="text-amber-500 mt-0.5 shrink-0" />
          <span className="text-xs text-amber-700">Marginal tax rate {client.marginalTaxRate} ({client.state}) — tax-efficient structures advised.</span>
        </div>
      </div>
    </div>
  );
};

const MeetingDocView = ({ advisorNotes }: any) => {
  const sessions = [
    {
      date: 'Feb 12, 2026', format: 'In-person', duration: '75 min', location: 'Palo Alto',
      topics: ['NVDA concentration', 'Exchange fund', 'CRT vs DAF', 'Private credit', 'Life insurance', 'Estate planning'],
      items: [
        { text: 'CRT vs DAF comparison — committed Feb 19', done: false, overdue: '67 days' },
        { text: 'LPL private credit research — committed Mar 1', done: false, overdue: '57 days' },
        { text: 'Estate attorney referral — committed Mar 15', done: false, overdue: '43 days' }
      ],
      warning: '⚠ Spouse (David Chen) was NOT present at this meeting'
    },
    {
      date: 'Nov 4, 2025', format: 'Video call', duration: '45 min', location: 'Remote',
      topics: ['Retirement planning', 'Beneficiary updates'],
      items: [{ text: 'Beneficiary updates completed', done: true, overdue: '' }],
      warning: ''
    }
  ];
  const meetingNotes = (advisorNotes || []).filter((n: string) => /meeting|session|discussed|client said|update/i.test(n));

  return (
    <div className="space-y-4">
      {meetingNotes.length > 0 && (
        <div className="bg-[#EEF2FF] border border-[#003087]/20 rounded-lg p-3">
          <div className="text-[10px] font-bold text-[#003087] uppercase tracking-widest mb-2">Advisor Updates</div>
          {meetingNotes.map((n: string, i: number) => (
            <div key={i} className="flex items-start gap-2 text-xs text-[#003087] mb-1">
              <span className="mt-0.5">•</span><span>{n}</span>
            </div>
          ))}
        </div>
      )}
      {sessions.map((s, i) => (
        <div key={i} className="border border-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-bold text-gray-800">{s.date}</span>
            <div className="flex gap-1.5">
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{s.format}</span>
              <span className="text-[10px] bg-gray-100 text-gray-500 px-2 py-0.5 rounded font-medium">{s.duration}</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-1 mb-3">
            {s.topics.map(t => <span key={t} className="text-[10px] bg-[#EFF6FF] text-blue-600 px-2 py-0.5 rounded">{t}</span>)}
          </div>
          <div className="space-y-1.5">
            {s.items.map((item, j) => (
              <div key={j} className="flex items-start gap-2">
                <div className={`h-3.5 w-3.5 rounded-full border-2 mt-0.5 shrink-0 flex items-center justify-center ${item.done ? 'bg-green-500 border-green-500' : 'border-amber-400'}`}>
                  {item.done && <span className="text-white text-[8px]">✓</span>}
                </div>
                <span className={`text-xs flex-1 ${item.done ? 'text-gray-400 line-through' : 'text-gray-700'}`}>{item.text}</span>
                {!item.done && item.overdue && (
                  <span className="text-[9px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded shrink-0">+{item.overdue}</span>
                )}
                {item.done && <span className="text-[9px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded shrink-0">Done</span>}
              </div>
            ))}
          </div>
          {s.warning && (
            <div className="mt-3 flex items-center gap-2 text-[11px] text-amber-700 bg-amber-50 border border-amber-100 rounded-lg p-2">
              <AlertTriangle size={11} className="shrink-0" />{s.warning}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

const ResearchDocView = () => {
  const macroStats = [
    { label: '10-Yr Treasury', value: '3.75–4.25%', sub: 'Expected range' },
    { label: 'Fed Cuts', value: '1–2', sub: 'Expected H2 2026' },
    { label: 'Inflation', value: '>2%', sub: 'Through mid-year' }
  ];
  const stanceStyle: Record<string, string> = {
    Overweight: 'bg-green-100 text-green-700',
    Neutral: 'bg-gray-100 text-gray-600',
    Underweight: 'bg-red-100 text-red-600'
  };
  const stanceIcon: Record<string, React.ReactNode> = {
    Overweight: <TrendingUp size={11} />,
    Neutral: <Minus size={11} />,
    Underweight: <TrendingDown size={11} />
  };
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {macroStats.map(s => (
          <div key={s.label} className="bg-[#F8FAFC] border border-border rounded-lg p-3 text-center">
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">{s.label}</div>
            <div className="text-sm font-bold text-gray-800 mt-0.5">{s.value}</div>
            <div className="text-[10px] text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Asset Class Views</div>
        <div className="space-y-2">
          {RESEARCH_ASSET_CLASSES.map(a => (
            <div key={a.name} className="flex items-center gap-3 p-2.5 border border-border rounded-lg">
              <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full shrink-0 ${stanceStyle[a.stance]}`}>
                {stanceIcon[a.stance]}{a.stance}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-semibold text-gray-800">{a.name}</div>
                <div className="text-[10px] text-gray-400">{a.note}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-[#FFF7ED] border border-orange-100 rounded-lg p-4">
        <div className="text-[11px] font-bold text-orange-700 uppercase tracking-widest mb-2">HNW Guidance</div>
        <div className="space-y-1">
          {['Prioritize CRT, DAF, or direct indexing for CA clients at ~54% marginal rate',
            'Systematic NVDA diversification via exchange fund or protective collar',
            'Estate exemption sunset risk in 2026 — act before year-end'].map(tip => (
            <div key={tip} className="flex items-start gap-2 text-xs text-orange-800">
              <span className="mt-0.5 shrink-0">→</span><span>{tip}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const ComplianceDocView = () => (
  <div className="space-y-3">
    {COMPLIANCE_RULES_DETAILED.map(rule => (
      <div key={rule.id} className="border border-border rounded-xl p-4 hover:border-gray-300 transition-colors">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${rule.badgeColor}`}>{rule.badge}</span>
            <span className="text-sm font-bold text-gray-800">{rule.title}</span>
          </div>
          <a
            href={rule.url}
            target="_blank"
            rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            className="flex items-center gap-1 text-[11px] text-[#003087] font-medium hover:underline shrink-0"
          >
            View Rule <ExternalLink size={11} />
          </a>
        </div>
        <p className="text-xs text-gray-600 leading-relaxed mb-2">{rule.summary}</p>
        <div className="text-[10px] text-gray-400 flex items-center gap-1">
          <span className="font-medium">Trigger:</span> {rule.trigger}
        </div>
      </div>
    ))}
  </div>
);

const SalesforceCRMView = () => {
  const timeline = [
    { date: 'Apr 24, 2026', type: 'Email',   note: 'Pre-meeting prep — agenda sent to client' },
    { date: 'Apr 1, 2026',  type: 'Call',    note: 'Quick check-in re: Q1 portfolio performance' },
    { date: 'Feb 12, 2026', type: 'Meeting', note: 'Annual review — 75 min, Palo Alto office' },
    { date: 'Jan 15, 2026', type: 'Email',   note: 'Year-end tax summary delivered' },
    { date: 'Nov 4, 2025',  type: 'Video',   note: 'Beneficiary update meeting — 45 min' },
  ];
  const tagColor: Record<string, string> = {
    Meeting: 'bg-blue-100 text-blue-700',
    Email:   'bg-gray-100 text-gray-600',
    Call:    'bg-green-100 text-green-700',
    Video:   'bg-purple-100 text-purple-700',
  };
  return (
    <div className="space-y-5">
      <div className="bg-[#F0F7FF] border border-blue-100 rounded-xl p-4">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-12 w-12 rounded-xl bg-[#1D4ED8] text-white flex items-center justify-center font-bold text-lg shrink-0">MC</div>
          <div className="flex-1 min-w-0">
            <div className="font-bold text-gray-800">Margaret Chen</div>
            <div className="text-[10px] text-gray-500">SF-00483921 · Client since Mar 2019</div>
          </div>
          <span className="text-[10px] bg-[#1D4ED8] text-white px-2 py-0.5 rounded font-bold uppercase shrink-0">Platinum</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Service Tier', value: 'Platinum HNW' },
            { label: 'Relationship Mgr', value: 'J. Whitfield' },
            { label: 'Preferred Contact', value: 'WhatsApp / Email' },
            { label: 'Referrals Given', value: '2 colleagues' },
          ].map(item => (
            <div key={item.label} className="bg-white rounded-lg p-2.5">
              <div className="text-[9px] text-gray-400 uppercase tracking-wide">{item.label}</div>
              <div className="text-xs font-semibold text-gray-800 mt-0.5">{item.value}</div>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Interaction Timeline</div>
        <div className="space-y-2">
          {timeline.map((t, i) => (
            <div key={i} className="flex items-start gap-3 p-2.5 border border-border rounded-lg">
              <span className={`text-[9px] font-bold px-2 py-0.5 rounded shrink-0 mt-0.5 ${tagColor[t.type]}`}>{t.type}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs text-gray-700">{t.note}</div>
                <div className="text-[10px] text-gray-400 mt-0.5">{t.date}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-amber-50 border border-amber-100 rounded-lg p-3">
        <div className="text-[10px] font-bold text-amber-700 uppercase tracking-widest mb-2">CRM Advisor Notes</div>
        <div className="space-y-1.5">
          {[
            'Prefers WhatsApp for quick updates, email for formal documents',
            'Needs thorough explanation before agreeing to alternatives',
            'Strong emotional tie to NVDA position (held since IPO)',
            'Spouse (David Chen) not yet involved in financial meetings',
          ].map((note, i) => (
            <div key={i} className="flex items-start gap-2 text-xs text-amber-800">
              <span className="shrink-0 mt-0.5">→</span><span>{note}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const WealthcomEstateView = () => {
  const docs = [
    { name: 'Last Will & Testament',    date: '2019', status: 'Needs update', urgent: true },
    { name: 'Financial Power of Attorney', date: '2019', status: 'Current',      urgent: false },
    { name: 'Healthcare Directive',      date: '2019', status: 'Current',      urgent: false },
  ];
  const beneficiaries = [
    { role: 'Primary',    name: 'David Chen (Spouse)',  pct: '100%' },
    { role: 'Contingent', name: 'Alex Chen (Child)',    pct: '50%' },
    { role: 'Contingent', name: 'Jamie Chen (Child)',   pct: '50%' },
  ];
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-3">
        {[
          { label: 'Financial Assets', value: '$4.2M',    sub: 'Liquid + invested' },
          { label: 'Primary Residence', value: '~$3.4M', sub: 'Est. current value' },
          { label: 'Total Estate',     value: '~$7.6M',  sub: 'Est. gross estate' },
          { label: 'Fed. Exemption',   value: '$13.61M', sub: '2026 — sunset risk' },
        ].map(s => (
          <div key={s.label} className="bg-[#F8FAFC] border border-border rounded-lg p-3">
            <div className="text-[9px] text-gray-400 uppercase tracking-wide">{s.label}</div>
            <div className="text-sm font-bold text-gray-800 mt-0.5">{s.value}</div>
            <div className="text-[10px] text-gray-400">{s.sub}</div>
          </div>
        ))}
      </div>
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-2">
          <AlertTriangle size={13} className="text-amber-600 shrink-0" />
          <div className="text-xs font-bold text-amber-800">No Trust Structure in Place</div>
        </div>
        <p className="text-xs text-amber-700 mb-2">Client has no revocable or irrevocable trust. Structures under advisor review:</p>
        <div className="flex gap-2 flex-wrap">
          {['SLAT', 'GRAT', 'IDGT', 'CRT'].map(t => (
            <span key={t} className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded font-medium">{t} — Under Review</span>
          ))}
        </div>
      </div>
      <div className="border border-red-100 bg-red-50 rounded-xl p-4">
        <div className="text-[10px] font-bold text-red-700 uppercase tracking-widest mb-2">Life Insurance — Expiration Alert</div>
        <div className="text-xs text-red-800 font-semibold">$1,000,000 20-Yr Term · Hartford Life · Expires Q3 2027</div>
        <div className="text-[10px] text-red-600 mt-1">⚠ Review needed — client may be uninsurable at current rates after expiry</div>
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Documents on File</div>
        <div className="space-y-2">
          {docs.map(doc => (
            <div key={doc.name} className="flex items-center justify-between p-2.5 border border-border rounded-lg">
              <div>
                <div className="text-xs font-semibold text-gray-800">{doc.name}</div>
                <div className="text-[10px] text-gray-400">Signed {doc.date}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${doc.urgent ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
                {doc.status}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Beneficiaries (Updated Dec 2025)</div>
        <div className="space-y-1.5">
          {beneficiaries.map(b => (
            <div key={b.name} className="flex items-center justify-between p-2.5 bg-[#F8FAFC] border border-border rounded-lg">
              <div>
                <div className="text-xs font-semibold text-gray-800">{b.name}</div>
                <div className="text-[10px] text-gray-400">{b.role}</div>
              </div>
              <span className="text-xs font-bold text-gray-600">{b.pct}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const FactSetMarketDataView = () => (
  <div className="space-y-5">
    <div className="bg-[#F0FFF4] border border-green-100 rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-bold text-xl text-gray-800">NVDA <span className="text-sm font-normal text-gray-500">NVIDIA Corp</span></div>
          <div className="text-[10px] text-gray-400">NASDAQ · FactSet Live · {NOW_ET}</div>
        </div>
        <div className="text-right">
          <div className="text-2xl font-bold text-gray-800">$142.30</div>
          <div className="text-xs text-green-600 font-medium">+$2.14 (+1.52%) today</div>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        {[
          { label: '52-Wk Low',  value: '$85.20' },
          { label: '52-Wk High', value: '$162.40' },
          { label: 'P/E (Fwd)',  value: '42.3×' },
          { label: 'Mkt Cap',    value: '$348B' },
          { label: 'Beta',       value: '1.89' },
          { label: 'Consensus',  value: 'Hold' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-lg p-2 text-center">
            <div className="text-[9px] text-gray-400">{s.label}</div>
            <div className="text-xs font-bold text-gray-800">{s.value}</div>
          </div>
        ))}
      </div>
    </div>
    <div>
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Client Position — Margaret Chen</div>
      <div className="border border-border rounded-xl overflow-hidden">
        <table className="w-full text-xs">
          <tbody className="divide-y divide-gray-50">
            {[
              { label: 'Shares Held',      value: '11,800' },
              { label: 'Current Price',    value: '$142.30' },
              { label: 'Market Value',     value: '$1,679,140' },
              { label: 'Avg Cost Basis',   value: '~$40.68 / share' },
              { label: 'Total Cost Basis', value: '~$480,000' },
              { label: 'Unrealized Gain',  value: '~$1,199,140 (+250%)' },
            ].map(row => (
              <tr key={row.label} className="hover:bg-gray-50">
                <td className="p-2.5 text-gray-500">{row.label}</td>
                <td className="p-2.5 text-right font-semibold text-gray-800">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mt-2 bg-red-50 border border-red-100 rounded-lg p-2.5">
        <div className="text-[10px] font-bold text-red-700 mb-0.5">Estimated Tax at Full Sale (~54% blended)</div>
        <div className="text-sm font-bold text-red-800">~$647,535 total tax impact</div>
        <div className="text-[10px] text-red-600 mt-0.5">Fed 20% LT cap gains + CA 13.3% + NIIT 3.8% + surcharge</div>
      </div>
    </div>
    <div>
      <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Analyst Consensus (30 analysts)</div>
      <div className="flex gap-3">
        {[{ label: 'Buy', count: 8, color: '#22C55E' }, { label: 'Hold', count: 18, color: '#F59E0B' }, { label: 'Sell', count: 4, color: '#EF4444' }].map(a => (
          <div key={a.label} className="flex-1 bg-[#F8FAFC] border border-border rounded-lg p-3 text-center">
            <div className="h-1.5 rounded-full mb-2 mx-auto" style={{ width: `${(a.count / 30) * 100}%`, backgroundColor: a.color }} />
            <div className="text-lg font-bold text-gray-800">{a.count}</div>
            <div className="text-[10px] text-gray-400">{a.label}</div>
          </div>
        ))}
      </div>
    </div>
    <div className="bg-[#EEF2FF] border border-[#003087]/10 rounded-lg p-3">
      <div className="text-[10px] font-bold text-[#003087] uppercase tracking-widest mb-1.5">Key Driver — AI Datacenter</div>
      <div className="text-xs text-[#003087]">AI datacenter revenue +147% YoY in Q4 2025. Q4 earnings beat estimates by +18%. Blackwell GPU backlog extends through Q3 2026.</div>
    </div>
  </div>
);

const JumpMeetingNotesView = () => {
  const moments = [
    { time: '08:14', topic: 'NVDA Position',   quote: '"I\'ve held this since the IPO. It\'s not just money — it\'s part of who I am."' },
    { time: '18:30', topic: 'Exchange Fund',   quote: 'Advisor introduced exchange fund. Client: "That\'s interesting. Can we model it out?"' },
    { time: '32:45', topic: 'CRT vs DAF',      quote: '"What\'s the real difference in terms of control? I\'d like a side-by-side."' },
    { time: '45:10', topic: 'Private Credit',  quote: '"If I can get 5–7% without touching my NVDA, I\'m open to it."' },
    { time: '58:20', topic: 'Life Insurance',  quote: '"Oh, I forgot that was expiring. Let\'s add that to the list."' },
    { time: '67:40', topic: 'Spouse',          quote: '"David should probably be at the next one."' },
  ];
  return (
    <div className="space-y-5">
      <div className="bg-[#FFF7ED] border border-orange-100 rounded-xl p-4">
        <div className="flex items-center gap-2 mb-3">
          <Mic size={14} className="text-orange-600 shrink-0" />
          <div className="font-bold text-sm text-gray-800">AI Meeting Summary</div>
          <span className="ml-auto text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold">Jump AI</span>
        </div>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[
            { label: 'Date',     value: 'Feb 12, 2026' },
            { label: 'Duration', value: '75 min' },
            { label: 'Location', value: 'Palo Alto' },
          ].map(s => (
            <div key={s.label} className="bg-white rounded-lg p-2 text-center">
              <div className="text-[9px] text-gray-400">{s.label}</div>
              <div className="text-xs font-bold text-gray-800">{s.value}</div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-gray-500">AI Sentiment Score</span>
          <div className="flex items-center gap-2">
            <div className="w-24 h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 rounded-full" style={{ width: '82%' }} />
            </div>
            <span className="text-xs font-bold text-green-600">8.2 / 10</span>
          </div>
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Key Moments (AI Transcript)</div>
        <div className="space-y-2.5">
          {moments.map((m, i) => (
            <div key={i} className="border border-border rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] font-bold text-gray-400 font-mono">{m.time}</span>
                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded font-medium">{m.topic}</span>
              </div>
              <p className="text-xs text-gray-700 italic leading-relaxed">{m.quote}</p>
            </div>
          ))}
        </div>
      </div>
      <div>
        <div className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">AI-Detected Topics</div>
        <div className="flex flex-wrap gap-1.5">
          {['Concentrated equity', 'NVDA emotional attachment', 'Exchange fund', 'CRT / DAF', 'Private credit', 'Life insurance', 'Estate planning', 'Spouse involvement'].map(t => (
            <span key={t} className="text-[10px] bg-[#F8FAFC] border border-border text-gray-600 px-2 py-0.5 rounded">{t}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

const NvdaDrilldownPanel = ({ onClose }: { onClose: () => void }) => {
  const SHARES = 11800;
  const PRICE  = 142.30;
  const VALUE  = SHARES * PRICE;          // 1,679,140
  const BASIS  = 480000;
  const GAIN   = VALUE - BASIS;           // 1,199,140
  const GAIN_PCT = ((GAIN / BASIS) * 100).toFixed(0);

  const taxRows = [
    { label: 'Federal LT cap gains', rate: '20%',   amt: Math.round(GAIN * 0.200) },
    { label: 'California income tax', rate: '13.3%', amt: Math.round(GAIN * 0.133) },
    { label: 'Federal NIIT',          rate: '3.8%',  amt: Math.round(GAIN * 0.038) },
    { label: 'Additional surcharges', rate: '~17%',  amt: Math.round(GAIN * 0.169) },
  ];
  const totalTax = taxRows.reduce((s, r) => s + r.amt, 0);

  const strategies = [
    { icon: '↔', label: 'Exchange Fund',           sub: '7-yr lock-up · no immediate tax event' },
    { icon: '↓', label: 'Phased Sale ($200K / yr)', sub: 'Stays within 20% federal bracket' },
    { icon: '✂', label: 'Harvest FI Losses',        sub: '~$45K tax savings this year' },
    { icon: '⚙', label: 'Protective Collar',        sub: 'Limit downside · defer sale decision' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="mt-[64px] mr-0 w-[440px] bg-white border-l border-border shadow-xl h-[calc(100vh-64px)] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-4 border-b border-border flex items-start justify-between shrink-0">
          <div>
            <div className="font-bold text-sm text-gray-800">NVDA — Position Detail</div>
            <div className="text-[10px] text-green-600 mt-0.5 flex items-center gap-1">
              <CheckCircle2 size={10} />
              FactSet Live · {NOW_ET}
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 mt-0.5"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Position summary */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Position Summary</div>
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <tbody className="divide-y divide-gray-50">
                  {[
                    { label: 'Shares Held',      value: SHARES.toLocaleString(),                                  hi: false },
                    { label: 'Current Price',    value: `$${PRICE.toFixed(2)}`,                                   hi: false },
                    { label: 'Market Value',     value: `$${VALUE.toLocaleString()}`,                             hi: false },
                    { label: 'Cost Basis',       value: `~$${(BASIS/1000).toFixed(0)}K  (~$${(BASIS/SHARES).toFixed(2)}/share)`, hi: false },
                    { label: 'Unrealized Gain',  value: `~$${(GAIN/1000).toFixed(0)}K (+${GAIN_PCT}%)`,          hi: true  },
                    { label: 'Portfolio Weight', value: '40% of $4.2M AUM',                                       hi: true  },
                  ].map(row => (
                    <tr key={row.label} className="hover:bg-gray-50">
                      <td className="p-2.5 text-gray-500">{row.label}</td>
                      <td className={`p-2.5 text-right font-semibold ${row.hi ? 'text-[#003087]' : 'text-gray-800'}`}>{row.value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-3">
              <div className="flex items-center justify-between text-[10px] text-gray-400 mb-1">
                <span>Portfolio concentration</span><span className="text-red-600 font-semibold">40% NVDA</span>
              </div>
              <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden flex">
                <div className="h-full bg-red-500 rounded-l-full" style={{ width: '40%' }} />
                <div className="h-full bg-[#003087]/20" style={{ width: '60%' }} />
              </div>
              <div className="flex items-center gap-1.5 mt-1.5">
                <AlertTriangle size={10} className="text-red-500 shrink-0" />
                <span className="text-[10px] text-red-600">Exceeds 20% concentration threshold by 20 percentage points</span>
              </div>
            </div>
          </div>

          {/* Tax impact */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Estimated Tax at Full Sale</div>
            <div className="border border-red-100 bg-red-50 rounded-xl p-4">
              <div className="text-2xl font-bold text-red-700 mb-0.5">${(totalTax / 1000).toFixed(0)}K</div>
              <div className="text-[10px] text-red-500 mb-3">estimated total tax liability at full liquidation</div>
              <div className="space-y-1.5">
                {taxRows.map(t => (
                  <div key={t.label} className="flex items-center justify-between text-xs">
                    <span className="text-gray-700">{t.label} <span className="text-gray-400">({t.rate})</span></span>
                    <span className="font-semibold text-red-700">${t.amt.toLocaleString()}</span>
                  </div>
                ))}
                <div className="pt-1.5 border-t border-red-200 flex items-center justify-between text-xs font-bold">
                  <span className="text-gray-800">Total (~54% blended)</span>
                  <span className="text-red-700">${totalTax.toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Diversification strategies */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Diversification Strategies</div>
            <div className="space-y-2">
              {strategies.map((s, i) => (
                <div key={i} className="flex items-center gap-3 p-2.5 border border-border rounded-lg bg-[#F8FAFC]">
                  <div className="h-8 w-8 rounded-lg bg-[#EEF2FF] text-[#003087] flex items-center justify-center font-bold text-sm shrink-0">{s.icon}</div>
                  <div>
                    <div className="text-xs font-semibold text-gray-800">{s.label}</div>
                    <div className="text-[10px] text-gray-400">{s.sub}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Compliance triggers */}
          <div>
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Compliance Triggers</div>
            <div className="space-y-1.5">
              {[
                'NVDA >20% — annual documented acknowledgment required',
                'CA CCR §260.218 — suitability documentation needed',
                'FINRA Rule 2111 — concentrated position disclosure',
              ].map((c, i) => (
                <div key={i} className="flex items-center gap-2 p-2 border border-amber-100 bg-amber-50 rounded-lg">
                  <AlertTriangle size={11} className="text-amber-500 shrink-0" />
                  <span className="text-[11px] text-amber-800">{c}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-border bg-[#F8F9FB] shrink-0 text-center text-[10px] text-gray-400">
          Data sourced from FactSet · ClientWorks · LPL Compliance Engine
        </div>
      </div>
    </div>
  );
};

const DocumentDetailPanel = ({ type, uploadedDoc, isProcessing, onUpload, onClose, advisorNotes, selectedClient }: any) => {
   const fileInputRef = useRef<HTMLInputElement>(null);

   const renderContent = () => {
      if (uploadedDoc) {
         return (
            <pre className="text-[11px] text-gray-700 leading-relaxed whitespace-pre-wrap font-mono bg-[#F8FAFC] border border-border rounded-lg p-4">
               {uploadedDoc.text}
            </pre>
         );
      }
      if (type.id === 'portfolio')  return <PortfolioDocView client={selectedClient} />;
      if (type.id === 'meeting')    return <MeetingDocView advisorNotes={advisorNotes} />;
      if (type.id === 'research')   return <ResearchDocView />;
      if (type.id === 'compliance') return <ComplianceDocView />;
      if (type.id === 'salesforce') return <SalesforceCRMView />;
      if (type.id === 'wealth')     return <WealthcomEstateView />;
      if (type.id === 'factset')    return <FactSetMarketDataView />;
      if (type.id === 'jump')       return <JumpMeetingNotesView />;
      return null;
   };

   return (
      <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
         <div
            className="mt-[64px] mr-0 w-[440px] bg-white border-l border-border shadow-xl h-[calc(100vh-64px)] flex flex-col"
            onClick={(e) => e.stopPropagation()}
         >
            <div className="p-4 border-b border-border flex items-start justify-between shrink-0">
               <div>
                  <div className="font-bold text-sm text-gray-800">{type.name}</div>
                  <div className="text-[10px] text-green-600 mt-0.5 flex items-center gap-1">
                     <CheckCircle2 size={10} />
                     {uploadedDoc ? `Overridden: ${uploadedDoc.filename}` : type.syncLabel}
                  </div>
               </div>
               <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1 mt-0.5">
                  <X size={16} />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
               {renderContent()}
            </div>

            <div className="p-4 border-t border-border bg-[#F8F9FB] shrink-0">
               <p className="text-[10px] text-gray-400 mb-2">Upload a PDF to override synced content for this session.</p>
               <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  className="w-full flex items-center justify-center gap-2 border border-dashed border-[#003087]/30 text-[#003087] text-xs font-medium py-2 px-3 rounded-lg hover:bg-[#EEF2FF] transition-colors disabled:opacity-50"
               >
                  <Upload size={13} />
                  {isProcessing ? 'Processing...' : uploadedDoc ? 'Replace PDF' : 'Upload PDF to override'}
               </button>
               {uploadedDoc && (
                  <button onClick={() => onUpload(null)} className="w-full mt-2 text-[10px] text-gray-400 hover:text-red-500 transition-colors">
                     Remove override — revert to synced data
                  </button>
               )}
               <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef}
                  onChange={(e) => { const file = e.target.files?.[0]; if (file) onUpload(file); e.target.value = ''; }}
               />
            </div>
         </div>
      </div>
   );
};

const AdvisorPanel = ({ clients, selectedClientId, onSelectClient, onClose }: any) => {
  return (
    <div className="fixed inset-0 z-50 flex items-start justify-end" onClick={onClose}>
      <div
        className="mt-[64px] mr-0 w-[340px] bg-white border-l border-b border-border shadow-xl h-[calc(100vh-64px)] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-gray-800">James Whitfield</div>
            <div className="text-[10px] text-gray-400 uppercase tracking-wide">AI Advisor Solutions</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1">
            <X size={16} />
          </button>
        </div>

        <div className="p-4 border-b border-border bg-[#F8F9FB]">
          <div className="flex items-center gap-2 text-[11px] text-gray-500 font-bold uppercase tracking-widest">
            <Users size={12} />
            My Clients ({clients.length})
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {clients.map((client: any) => {
            const isSelected = client.id === selectedClientId;
            const initials = client.name.split(' ').map((n: string) => n[0]).join('');
            return (
              <button
                key={client.id}
                onClick={() => { onSelectClient(client.id); onClose(); }}
                className={`w-full text-left p-4 border-b border-border transition-colors flex items-center gap-3 ${
                  isSelected ? 'bg-[#EEF2FF]' : 'hover:bg-gray-50'
                }`}
              >
                <div className={`h-9 w-9 rounded-lg flex items-center justify-center font-bold text-sm shrink-0 ${
                  isSelected ? 'bg-[#003087] text-white' : 'bg-gray-100 text-gray-700'
                }`}>
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${isSelected ? 'text-[#003087]' : 'text-gray-800'}`}>
                      {client.name}
                    </span>
                    {isSelected && <span className="text-[9px] bg-[#003087] text-white px-1.5 py-0.5 rounded font-bold uppercase">Active</span>}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5">{client.occupation} • Age {client.age}</div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-[11px] font-bold text-gray-700">{client.aum} AUM</span>
                    <span className="text-[10px] text-gray-400">{client.state}</span>
                  </div>
                  {client.openItems.length > 0 && (
                    <div className="mt-1 text-[10px] text-orange-600 font-medium">{client.openItems.length} open item{client.openItems.length > 1 ? 's' : ''}</div>
                  )}
                </div>
                <ChevronRight size={14} className="text-gray-300 shrink-0" />
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const NotesModal = ({ clientName, notes, noteInput, onNoteChange, onSave, onDelete, onClose }: any) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  useEffect(() => { textareaRef.current?.focus(); }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30" onClick={onClose}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-[480px] max-h-[80vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-5 border-b border-border flex items-center justify-between">
          <div>
            <div className="font-bold text-sm text-gray-800">Update Client Notes</div>
            <div className="text-[10px] text-gray-400 mt-0.5">{clientName} — preferences, habits, meeting updates</div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="p-5 flex flex-col gap-3">
          <textarea
            ref={textareaRef}
            value={noteInput}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder={`e.g. "Client prefers avoiding tech sector above 40%"\n"Apr 24 meeting: discussed rebalancing NVDA into private credit"\n"Client is risk-averse about alternatives despite profile"`}
            className="w-full border border-border rounded-xl px-4 py-3 text-sm text-gray-800 placeholder:text-gray-400 outline-none focus:border-[#003087] resize-none leading-relaxed"
            rows={4}
            onKeyDown={(e) => { if (e.key === 'Enter' && e.metaKey) onSave(); }}
          />
          <button
            onClick={onSave}
            disabled={!noteInput.trim()}
            className="w-full bg-[#003087] text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-[#002070] transition-colors disabled:opacity-40"
          >
            Save Note — will be included in all future AI responses
          </button>
          <p className="text-[10px] text-gray-400 text-center">⌘ + Enter to save</p>
        </div>

        {notes.length > 0 && (
          <div className="px-5 pb-5 border-t border-border pt-4">
            <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Saved Notes</div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {notes.map((note: string, i: number) => (
                <div key={i} className="flex items-start gap-2 bg-[#F8FAFC] rounded-lg p-2.5">
                  <span className="text-[11px] text-gray-700 flex-1 leading-relaxed">{note}</span>
                  <button onClick={() => onDelete(i)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0 mt-0.5">
                    <X size={11} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// === MAIN APP COMPONENT ===
export default function App() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string>(newSessionId());
  const [inputText, setInputText] = useState("");
  const [isThinking, setIsThinking] = useState(false);
  const [uploadedDocs, setUploadedDocs] = useState<Record<string, any>>({});
  const [processingDocs, setProcessingDocs] = useState<Record<string, boolean>>({});
  const [selectedClientId, setSelectedClientId] = useState<string>('margaret');
  const [showAdvisorPanel, setShowAdvisorPanel] = useState(false);
  const [rightPanel, setRightPanel] = useState<{ type: 'doc'; docId: string } | { type: 'nvda' } | null>(null);
  const [clientNotes, setClientNotes] = useState<Record<string, string[]>>({});
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [noteInput, setNoteInput] = useState("");
  const [complianceAcks, setComplianceAcks] = useState([false, false, false]);
  const [complianceExported, setComplianceExported] = useState(false);
  const [complianceTimestamp, setComplianceTimestamp] = useState<string | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overrideData, setOverrideData] = useState<{ category: string; rationale: string; timestamp: string } | null>(null);
  const [recommendationAccepted, setRecommendationAccepted] = useState<'accepted' | 'overridden' | null>(null);
  const [currentView, setCurrentView] = useState<'advisor' | 'supervisor'>('advisor');
  const [selectedAuditEntry, setSelectedAuditEntry] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const selectedClient = mockClients.find(c => c.id === selectedClientId) || mockClients[0];

  useEffect(() => {
     loadPdfJs().catch(err => console.error("Failed to load PDF.js", err));
     setSessions(loadSessions());
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking]);

  const saveCurrentSession = useCallback((msgs: ChatMsg[], sessionId: string) => {
    if (msgs.length === 0) return;
    const title = msgs.find(m => m.role === 'user')?.content.slice(0, 45) || 'New Chat';
    const session: ChatSession = { id: sessionId, title, messages: msgs, timestamp: Date.now() };
    setSessions(prev => {
      const without = prev.filter(s => s.id !== sessionId);
      const updated = [session, ...without];
      persistSessions(updated);
      return updated;
    });
  }, []);

  // === EVENT HANDLERS ===
  const handleNewChat = () => {
    saveCurrentSession(messages, currentSessionId);
    setMessages([]);
    setCurrentSessionId(newSessionId());
    setInputText("");
  };

  const handleLoadSession = (session: ChatSession) => {
    saveCurrentSession(messages, currentSessionId);
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setInputText("");
  };

  const handleDeleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    setSessions(prev => {
      const updated = prev.filter(s => s.id !== sessionId);
      persistSessions(updated);
      return updated;
    });
    if (sessionId === currentSessionId) {
      setMessages([]);
      setCurrentSessionId(newSessionId());
    }
  };

  const handleUpload = async (docTypeId: string, file: File | null) => {
     if (!file) {
        setUploadedDocs(prev => { const next = { ...prev }; delete next[docTypeId]; return next; });
        return;
     }
     try {
        setProcessingDocs(prev => ({ ...prev, [docTypeId]: true }));
        const pdfjs = await loadPdfJs();
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjs.getDocument({ data: arrayBuffer }).promise;

        let fullText = '';
        const maxPages = Math.min(pdf.numPages, 10);
        for (let i = 1; i <= maxPages; i++) {
           const page = await pdf.getPage(i);
           const content = await page.getTextContent();
           fullText += content.items.map((item: any) => item.str).join(' ') + '\n';
        }

        setUploadedDocs(prev => ({
           ...prev,
           [docTypeId]: { typeId: docTypeId, filename: file.name, text: fullText }
        }));
     } catch (err) {
        console.error("PDF Parsing error", err);
        alert("Failed to parse PDF document. It may be protected or malformed.");
     } finally {
        setProcessingDocs(prev => ({ ...prev, [docTypeId]: false }));
     }
  };

  const handleComplianceExport = () => {
    const d = new Date();
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setComplianceExported(true);
    setComplianceTimestamp(`${date} ${time} ET`);
  };

  const handleOverrideSubmit = (data: { category: string; rationale: string }) => {
    const d = new Date();
    const date = d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const time = d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    setOverrideData({ ...data, timestamp: `${date} ${time} ET` });
    setRecommendationAccepted('overridden');
    setShowOverrideModal(false);
  };

  const handleQuerySubmit = async (query: string) => {
     if (!query.trim() || isThinking) return;

     const userMsg: ChatMsg = { role: 'user', content: query, timestamp: Date.now() };
     const nextMessages = [...messages, userMsg];
     setMessages(nextMessages);
     setInputText("");
     setIsThinking(true);

     // Hardcoded demo flows — skip AI call
     if (/prepare meeting brief/i.test(query)) {
       await new Promise(r => setTimeout(r, 1200));
       const assistantMsg: ChatMsg = { role: 'assistant', content: '', specialType: 'meeting-brief', timestamp: Date.now() };
       const finalMessages = [...nextMessages, assistantMsg];
       setMessages(finalMessages);
       saveCurrentSession(finalMessages, currentSessionId);
       setIsThinking(false);
       if (inputRef.current) inputRef.current.style.height = 'auto';
       return;
     }

     if (/harvest losses|rebalance.*harvest|should.*rebalance.*hold|nvda concentration/i.test(query)) {
       await new Promise(r => setTimeout(r, 1500));
       setComplianceAcks([false, false, false]);
       setComplianceExported(false);
       setComplianceTimestamp(null);
       setRecommendationAccepted(null);
       setOverrideData(null);
       const assistantMsg: ChatMsg = { role: 'assistant', content: '', specialType: 'compliance-gate', timestamp: Date.now() };
       const finalMessages = [...nextMessages, assistantMsg];
       setMessages(finalMessages);
       saveCurrentSession(finalMessages, currentSessionId);
       setIsThinking(false);
       if (inputRef.current) inputRef.current.style.height = 'auto';
       return;
     }

     try {
        const responseData = await askAdvisorIQ(query, uploadedDocs, selectedClient, clientNotes[selectedClientId] || []);
        const assistantMsg: ChatMsg = {
           role: 'assistant',
           content: responseData.answer || "No specific answer provided.",
           sources: responseData.sources || [],
           complianceFlags: responseData.complianceFlags || [],
           suggestedQuestions: responseData.suggestedQuestions || [],
           timestamp: Date.now()
        };
        const finalMessages = [...nextMessages, assistantMsg];
        setMessages(finalMessages);
        saveCurrentSession(finalMessages, currentSessionId);
     } catch (err: any) {
        const errMsg: ChatMsg = {
           role: 'assistant',
           content: `System Error: ${err.message}. Please check your configuration.`,
           sources: [],
           complianceFlags: ["Failed to connect to required AI provider or process compliance evaluation."],
           timestamp: Date.now()
        };
        const finalMessages = [...nextMessages, errMsg];
        setMessages(finalMessages);
     } finally {
        setIsThinking(false);
        if (inputRef.current) inputRef.current.style.height = 'auto';
     }
  };

  const lastAssistantIdx = messages.reduce((acc, m, i) => m.role === 'assistant' ? i : acc, -1);

  return (
    <div className="flex h-screen bg-bg flex-col overflow-hidden font-sans text-[#1A1C21]">
      {/* Header */}
      <header className="h-[64px] bg-white border-b-2 border-[#003087] flex items-center justify-between px-6 shrink-0 z-40">
        <div className="flex items-center gap-3">
          <div className="font-bold text-[18px] text-[#003087]">LPL Financial <span className="text-[#C9A84C] ml-1 font-medium">AdvisorIQ</span></div>
          <div className="h-4 w-[1px] bg-gray-300"></div>
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Powered by LPL Research · Anthropic</div>
        </div>

        <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1">
          {(['advisor', 'supervisor'] as const).map(view => (
            <button
              key={view}
              onClick={() => { setCurrentView(view); setSelectedAuditEntry(null); }}
              className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors capitalize ${
                currentView === view ? 'bg-white text-[#003087] shadow-sm' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {view === 'advisor' ? 'Advisor View' : 'Supervisor View'}
            </button>
          ))}
        </div>

        <button
          onClick={() => setShowAdvisorPanel(prev => !prev)}
          className="flex items-center gap-4 hover:opacity-80 transition-opacity cursor-pointer"
        >
          <div className="text-right">
             <div className="text-xs font-bold text-gray-800">James Whitfield</div>
             <div className="text-[10px] text-gray-400">AI Advisor Solutions</div>
          </div>
          <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold transition-colors ${showAdvisorPanel ? 'bg-[#C9A84C]' : 'bg-[#003087]'}`}>JW</div>
        </button>
      </header>

      {showAdvisorPanel && (
        <AdvisorPanel
          clients={mockClients}
          selectedClientId={selectedClientId}
          onSelectClient={(id: string) => { setSelectedClientId(id); setMessages([]); setCurrentSessionId(newSessionId()); }}
          onClose={() => setShowAdvisorPanel(false)}
        />
      )}

      {showOverrideModal && (
        <OverrideModal
          onSubmit={handleOverrideSubmit}
          onClose={() => setShowOverrideModal(false)}
        />
      )}

      {showNotesModal && (
        <NotesModal
          clientName={selectedClient.name}
          notes={clientNotes[selectedClientId] || []}
          noteInput={noteInput}
          onNoteChange={setNoteInput}
          onSave={() => {
            if (!noteInput.trim()) return;
            const ts = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const entry = `[${ts}] ${noteInput.trim()}`;
            setClientNotes(prev => ({
              ...prev,
              [selectedClientId]: [...(prev[selectedClientId] || []), entry]
            }));
            setNoteInput("");
          }}
          onDelete={(idx: number) => {
            setClientNotes(prev => ({
              ...prev,
              [selectedClientId]: (prev[selectedClientId] || []).filter((_: string, i: number) => i !== idx)
            }));
          }}
          onClose={() => { setShowNotesModal(false); setNoteInput(""); }}
        />
      )}

      {rightPanel?.type === 'doc' && (() => {
        const docType = CONFIG.DOCUMENT_TYPES.find(t => t.id === rightPanel.docId)!;
        return (
          <DocumentDetailPanel
            type={docType}
            uploadedDoc={uploadedDocs[rightPanel.docId]}
            isProcessing={processingDocs[rightPanel.docId]}
            onUpload={(file: File | null) => handleUpload(rightPanel.docId, file)}
            onClose={() => setRightPanel(null)}
            advisorNotes={clientNotes[selectedClientId] || []}
            selectedClient={selectedClient}
          />
        );
      })()}

      {rightPanel?.type === 'nvda' && (
        <NvdaDrilldownPanel onClose={() => setRightPanel(null)} />
      )}

      {selectedAuditEntry && currentView === 'supervisor' && (
        <AuditDetailPanel
          entryId={selectedAuditEntry}
          rows={AUDIT_ROWS}
          complianceExported={complianceExported}
          complianceTimestamp={complianceTimestamp}
          complianceAcks={complianceAcks}
          recommendationStatus={recommendationAccepted}
          overrideData={overrideData}
          onClose={() => setSelectedAuditEntry(null)}
        />
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-[280px] bg-white border-r border-border flex flex-col overflow-y-auto shrink-0 z-10">

          {/* New Chat Button */}
          <div className="p-4 pb-2">
            <button
              onClick={handleNewChat}
              className="w-full flex items-center justify-center gap-2 bg-[#003087] text-white text-xs font-semibold py-2 px-3 rounded-lg hover:bg-[#002070] transition-colors"
            >
              <Plus size={13} /> New Chat
            </button>
          </div>

          {/* Document Library */}
          <div className="p-4">
            <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-3">Document Library</h2>
            {CONFIG.DOCUMENT_TYPES.map(type => (
              <DocumentSlot
                key={type.id}
                type={type}
                uploadedDoc={uploadedDocs[type.id]}
                onClick={() => setRightPanel({ type: 'doc', docId: type.id })}
              />
            ))}
          </div>

          {/* Recent Chats */}
          {sessions.length > 0 && (
            <div className="px-4 pb-2">
              <h2 className="text-[11px] font-bold text-gray-500 uppercase tracking-widest mb-2">Recent Chats</h2>
              <div className="space-y-1">
                {sessions.map(session => (
                  <div
                    key={session.id}
                    className={`group w-full flex items-center gap-1 px-2 py-2 rounded-lg text-xs transition-colors ${session.id === currentSessionId ? 'bg-[#EEF2FF] text-[#003087]' : 'hover:bg-gray-50 text-gray-600'}`}
                  >
                    <button
                      onClick={() => handleLoadSession(session)}
                      className="flex items-start gap-2 flex-1 min-w-0 text-left"
                    >
                      <MessageSquare size={12} className="mt-0.5 shrink-0 opacity-60" />
                      <span className="truncate leading-relaxed">{session.title}</span>
                    </button>
                    <button
                      onClick={(e) => handleDeleteSession(e, session.id)}
                      className="shrink-0 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all p-0.5 rounded"
                      title="Delete chat"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Client Card */}
          <div className="mt-auto">
            <div className="bg-white border border-border rounded-xl p-4 m-4 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.05)]">
               <div className="flex items-center gap-3 mb-3">
                  <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center font-bold text-gray-800">
                     {selectedClient.name.split(' ').map(n=>n[0]).join('')}
                  </div>
                  <div>
                     <div className="text-sm font-bold text-gray-800">{selectedClient.name}</div>
                     <div className="text-[10px] text-gray-500">Age {selectedClient.age} • {selectedClient.state}</div>
                  </div>
               </div>
               <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                     <span className="text-gray-500">Total AUM</span>
                     <span className="font-bold text-gray-800">{selectedClient.aum}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                     <span className="text-gray-500">Risk Profile</span>
                     <span className="font-bold text-gray-800">{selectedClient.riskProfile}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 mt-2">
                     <span className="bg-[#FEE2E2] text-[#B91C1C] px-2 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase">{selectedClient.concentration}</span>
                     <span className="bg-[#FFEDD5] text-[#9A3412] px-2 py-0.5 rounded text-[9px] font-bold tracking-tight uppercase">{selectedClient.openItems.length} OPEN ITEMS</span>
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                     <div className="text-[10px] text-gray-400">Next Meeting</div>
                     <div className="text-xs font-semibold text-gray-800">{selectedClient.nextMeeting}</div>
                  </div>
                  <div className="mt-2 text-[10px] text-gray-400">Pulled from ClientWorks</div>

                  {/* Advisor notes preview */}
                  {(clientNotes[selectedClientId] || []).length > 0 && (
                    <div className="mt-2 pt-2 border-t border-gray-100">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-1">Advisor Notes ({(clientNotes[selectedClientId] || []).length})</div>
                      {(clientNotes[selectedClientId] || []).slice(-2).map((note: string, i: number) => (
                        <div key={i} className="text-[10px] text-gray-500 leading-relaxed truncate">{note}</div>
                      ))}
                    </div>
                  )}

                  <button
                    onClick={() => setShowNotesModal(true)}
                    className="mt-3 w-full flex items-center justify-center gap-1.5 border border-dashed border-[#003087]/30 text-[#003087] text-[10px] font-semibold py-1.5 rounded-lg hover:bg-[#EEF2FF] transition-colors"
                  >
                    <PenLine size={11} />
                    Update preferences / meeting notes
                  </button>
               </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB] relative">
          {currentView === 'supervisor' && (
            <div className="absolute inset-x-0 top-0 z-10 bg-[#F8F9FB] flex flex-col overflow-hidden" style={{ bottom: '2rem' }}>
              <SupervisorView
                rows={AUDIT_ROWS}
                selectedEntry={selectedAuditEntry}
                onSelectEntry={setSelectedAuditEntry}
                complianceExported={complianceExported}
                complianceTimestamp={complianceTimestamp}
                complianceAcks={complianceAcks}
                recommendationStatus={recommendationAccepted}
                overrideData={overrideData}
              />
            </div>
          )}

          <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-2">
            {messages.length === 0 ? (
               <WelcomeScreen onSuggestionClick={handleQuerySubmit} clientName={selectedClient.name} />
            ) : (
               <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map((msg, i) => {
                    if (msg.specialType === 'meeting-brief') {
                      return (
                        <div key={i} className="mb-4">
                          <MeetingBriefContent
                            onNvdaClick={() => setRightPanel({ type: 'nvda' })}
                            client={selectedClient}
                          />
                        </div>
                      );
                    }
                    if (msg.specialType === 'compliance-gate') {
                      return (
                        <div key={i} className="mb-4">
                          <ComplianceGateContent
                            acks={complianceAcks}
                            exported={complianceExported}
                            timestamp={complianceTimestamp}
                            recommendationStatus={recommendationAccepted}
                            overrideData={overrideData}
                            onAck={(idx, val) => setComplianceAcks(prev => { const n = [...prev]; n[idx] = val; return n; })}
                            onExport={handleComplianceExport}
                            onAccept={() => setRecommendationAccepted('accepted')}
                            onShowOverride={() => setShowOverrideModal(true)}
                          />
                        </div>
                      );
                    }
                    return (
                      <ChatMessage
                        key={i}
                        msg={msg}
                        isLast={i === lastAssistantIdx}
                        onSuggestionClick={handleQuerySubmit}
                      />
                    );
                  })}

                  {isThinking && (
                     <div className="flex items-center gap-3 text-gray-400 p-4">
                       <span className="text-sm font-medium tracking-wide">Processing...</span>
                     </div>
                  )}
                  <div ref={chatEndRef} className="h-6" />
               </div>
            )}
          </div>

          <MetricsStrip />

          {/* Chat Input */}
          <div className="p-6 pt-2 shrink-0 max-w-5xl mx-auto w-full">
             <div className="mt-4 flex gap-3">
               <div className="flex-1 bg-white border border-border rounded-xl px-4 py-2 flex items-center shadow-sm">
                 <textarea
                   ref={inputRef}
                   className="flex-1 min-h-[44px] max-h-48 py-3 resize-none outline-none text-[#1A1C21] bg-transparent text-sm leading-relaxed placeholder:text-gray-400"
                   placeholder="Ask about client data, research, or compliance..."
                   rows={1}
                   value={inputText}
                   onChange={(e) => {
                      setInputText(e.target.value);
                      e.target.style.height = 'auto';
                      e.target.style.height = e.target.scrollHeight + 'px';
                   }}
                   onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                         e.preventDefault();
                         handleQuerySubmit(inputText);
                      }
                   }}
                 />
                 <button
                    onClick={() => handleQuerySubmit(inputText)}
                    disabled={!inputText.trim() || isThinking}
                    className="ml-2 text-[#C9A84C] font-bold text-sm disabled:opacity-50 transition-all uppercase tracking-wide cursor-pointer disabled:cursor-default"
                 >
                    SEND
                 </button>
               </div>
             </div>
          </div>

          <footer className="h-8 bg-white border-t border-border text-[10px] text-[#64748B] flex items-center justify-center shrink-0 px-6 text-center">
            This tool is for advisor use only and does not constitute investment advice. LPL Financial LLC, Member FINRA/SIPC. AI-generated content requires advisor review. © 2026 LPL Financial LLC.
          </footer>
        </main>
      </div>
    </div>
  );
}
