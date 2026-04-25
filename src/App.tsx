import React, { useState, useRef, useEffect, useCallback } from 'react';
import { FileText, Shield, TrendingUp, Info, Plus, MessageSquare, Trash2, X, Users, ChevronRight } from 'lucide-react';
import { GoogleGenAI, Type } from '@google/genai';

// === CONFIG ===
const CONFIG = {
  DOCUMENT_TYPES: [
    { id: 'portfolio', name: 'Client Portfolio', icon: TrendingUp },
    { id: 'meeting', name: 'Meeting History', icon: FileText },
    { id: 'research', name: 'LPL Research Report', icon: Info },
    { id: 'compliance', name: 'Compliance / Regulatory Document', icon: Shield }
  ],
  systemPromptBase: "You are AdvisorIQ, an AI assistant for LPL Financial advisors. Answer questions using only the provided documents and data sources. Always cite which document your answer comes from. If the query involves investment recommendations, suitability, or tax advice, append a compliance flag noting relevant FINRA or SEC considerations. Never fabricate information not present in the provided context. IMPORTANT: You must return the response as a JSON object with EXACTLY the following format, and do not wrap it in markdown block quotes. Format: { \"answer\": \"string containing your response in plain advisor-friendly language using markdown for formatting (use **bold** for headers, - for lists)\", \"sources\": [\"string\", \"string\"], \"complianceFlags\": [\"string\", \"string\"], \"dataSourcesUsed\": [\"string\"], \"suggestedQuestions\": [\"string\", \"string\", \"string\"] }. For suggestedQuestions, generate 3 concise follow-up questions an advisor would naturally ask next based on the conversation context."
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
    nextMeeting: "Tomorrow, Apr 22, 2026",
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
const constructPrompt = (inputText: string, uploadedDocs: any, clientData: any) => {
  let contextData = `Current Client Context:\n${JSON.stringify(clientData, null, 2)}\n\nLPL Research Context (2026):\n${JSON.stringify(mockResearchData, null, 2)}\n\nCompliance Rules Available:\n${JSON.stringify(mockComplianceData, null, 2)}\n\nUploaded Documents:\n`;
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

const askAdvisorIQ = async (inputText: string, uploadedDocs: any, clientData: any) => {
   const systemPrompt = CONFIG.systemPromptBase;
   const fullPrompt = constructPrompt(inputText, uploadedDocs, clientData);

   const anthropicKey = (import.meta as any).env.VITE_ANTHROPIC_API_KEY;
   if (anthropicKey) {
      return await callAnthropicAPI(systemPrompt, fullPrompt, anthropicKey);
   } else if (process.env.GEMINI_API_KEY) {
      return await callGeminiAPI(systemPrompt, fullPrompt);
   } else {
      throw new Error("No valid AI API Configuration found.");
   }
};

// === UI COMPONENTS ===
const WelcomeScreen = ({ onSuggestionClick, clientName }: any) => {
  const queries = [
    `Prepare meeting brief for ${clientName.split(' ')[0]} tomorrow`,
    "Compliance flags for NVDA concentration",
    "What does LPL Research say about private credit?",
    "What are the open items from our last meeting?"
  ];

  return (
    <div className="bg-white border border-border p-4 px-5 rounded-xl text-[14px] leading-relaxed mb-4 max-w-[85%] text-gray-800">
      <p className="mb-4">Hello James. I've processed the uploaded portfolio for {clientName} and cross-referenced it with the LPL 2026 Outlook. How can I assist with your preparation for tomorrow's meeting?</p>
      <div className="grid grid-cols-2 gap-3">
        {queries.map((q, i) => (
          <button
             key={i}
             onClick={() => onSuggestionClick(q)}
             className="text-left p-3 border border-border rounded-lg hover:border-[#003087] transition-colors group"
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

const DocumentSlot = ({ type, doc, onUpload, isProcessing }: any) => {
   const fileInputRef = useRef<HTMLInputElement>(null);
   const [isDragOver, setIsDragOver] = useState(false);

   const handleDrop = (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const file = e.dataTransfer.files?.[0];
      if (file && file.type === 'application/pdf') onUpload(file);
   };

   return (
      <div
         className={`border rounded-md p-2.5 mb-2 text-xs transition-all cursor-pointer ${
           isDragOver
             ? 'border-[#003087] bg-[#EEF2FF] border-solid scale-[1.01]'
             : doc
             ? 'border-blue-200 bg-[#EFF6FF] border-solid'
             : 'border-dashed border-[#CBD5E1] bg-[#F8FAFC]'
         }`}
         onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
         onDragEnter={(e) => { e.preventDefault(); setIsDragOver(true); }}
         onDragLeave={() => setIsDragOver(false)}
         onDrop={handleDrop}
         onClick={() => !doc && !isProcessing && fileInputRef.current?.click()}
      >
         <div className="flex justify-between font-semibold text-gray-700">
            <span className={doc ? "text-blue-700" : (isProcessing ? "opacity-50" : "opacity-75")}>{type.name}</span>
            {doc ? (
               <span className="text-green-600">✓</span>
            ) : (
               <button
                  onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  disabled={isProcessing}
                  className="text-blue-500 hover:text-blue-700 disabled:opacity-50 cursor-pointer"
               >
                  +
               </button>
            )}
         </div>
         <div className="mt-1 flex items-center justify-between">
            {doc ? (
               <>
                  <span className="text-[10px] text-blue-500 truncate" title={doc.filename}>{doc.filename}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                    className="text-[9px] text-[#003087] hover:underline"
                  >
                    Replace
                  </button>
               </>
            ) : (
               <span className="text-[10px] text-gray-400 italic">
                 {isProcessing ? "Processing..." : isDragOver ? "Drop PDF here" : "Click or drag PDF here"}
               </span>
            )}
         </div>
         <input
            type="file"
            accept="application/pdf"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => {
               const file = e.target.files?.[0];
               if (file) onUpload(file);
               e.target.value = '';
            }}
         />
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

  const handleUpload = async (docTypeId: string, file: File) => {
     if (!file) return;
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

  const handleQuerySubmit = async (query: string) => {
     if (!query.trim() || isThinking) return;

     const userMsg: ChatMsg = { role: 'user', content: query, timestamp: Date.now() };
     const nextMessages = [...messages, userMsg];
     setMessages(nextMessages);
     setInputText("");
     setIsThinking(true);

     try {
        const responseData = await askAdvisorIQ(query, uploadedDocs, selectedClient);
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
          <div className="text-[10px] text-gray-500 uppercase tracking-wider">Powered by LPL Research</div>
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
                 doc={uploadedDocs[type.id]}
                 onUpload={(file: File) => handleUpload(type.id, file)}
                 isProcessing={processingDocs[type.id]}
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
               </div>
            </div>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col min-w-0 bg-[#F8F9FB] relative">
          <div className="flex-1 overflow-y-auto p-6 space-y-4 pr-2">
            {messages.length === 0 ? (
               <WelcomeScreen onSuggestionClick={handleQuerySubmit} clientName={selectedClient.name} />
            ) : (
               <div className="max-w-4xl mx-auto space-y-4">
                  {messages.map((msg, i) => (
                    <ChatMessage
                      key={i}
                      msg={msg}
                      isLast={i === lastAssistantIdx}
                      onSuggestionClick={handleQuerySubmit}
                    />
                  ))}

                  {isThinking && (
                     <div className="flex items-center gap-3 text-gray-400 p-4">
                       <span className="text-sm font-medium tracking-wide">Processing...</span>
                     </div>
                  )}
                  <div ref={chatEndRef} className="h-6" />
               </div>
            )}
          </div>

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
