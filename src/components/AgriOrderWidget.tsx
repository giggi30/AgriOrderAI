"use client";

import React, { useState, useRef, useEffect } from 'react';
import { askAgriOrderAI } from '@/lib/agriOrderService';
import { Send, Bot, CheckCheck, Loader2, Sparkles } from 'lucide-react';
import { Content } from '@google/generative-ai';
import ReactMarkdown from 'react-markdown';

interface Message {
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

export default function AgriOrderWidget() {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'ai',
      text: "👋 Ciao! Sono AgriOrder AI di **Ortuso**.\n\nCome posso aiutarti oggi? Puoi inviarmi un ordine informale, chiedere giacenze o verificare allergeni e listini B2B.",
      timestamp: '09:41'
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    const timestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { sender: 'user', text: query, timestamp };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    // Formattazione dello storico per Gemini
    // Escludiamo il messaggio di benvenuto iniziale se è il primo della lista per evitare l'errore 'First content should be with role user'
    const history: Content[] = messages
      .filter((m, i) => !(i === 0 && m.sender === 'ai'))
      .map(m => ({
        role: m.sender === 'user' ? 'user' : 'model',
        parts: [{ text: m.text }]
      }));

    const aiResponseText = await askAgriOrderAI(query, history);

    setIsTyping(false);
    setMessages(prev => [
      ...prev,
      {
        sender: 'ai',
        text: aiResponseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      }
    ]);
  };

  return (
    <div className="w-full max-w-sm mx-auto bg-slate-950 p-4 rounded-[40px] border-4 border-slate-800 shadow-2xl font-sans">
      {/* Visuale Header Smartphone */}
      <div className="bg-slate-900 p-3 rounded-t-[28px] border-b border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#707E3D]/20 border border-[#707E3D]/40 flex items-center justify-center text-[#A1B06B]">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-100 flex items-center gap-1.5">
              AgriOrder AI <Sparkles className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
            </h4>
            <span className="text-[11px] text-[#A1B06B] font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#707E3D] animate-pulse"></span> Gemini Connected
            </span>
          </div>
        </div>
      </div>

      {/* Area Chat */}
      <div className="h-[380px] overflow-y-auto p-3 space-y-3 bg-slate-900/50 scrollbar-hide">
        {messages.map((msg, index) => (
          <div key={index} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
              msg.sender === 'user'
                ? 'bg-[#707E3D] text-[#F2F4E9] rounded-br-none'
                : 'bg-slate-800 text-slate-200 border border-slate-700/60 rounded-bl-none shadow-md'
            }`}>
              <div className="markdown-container">
                <ReactMarkdown
                  components={{
                    h1: ({ ...props }) => <h1 className="text-sm font-bold my-1" {...props} />,
                    h2: ({ ...props }) => <h2 className="text-sm font-bold my-1" {...props} />,
                    h3: ({ ...props }) => <h3 className="text-xs font-bold my-1" {...props} />,
                    p: ({ ...props }) => <p className="mb-1 last:mb-0" {...props} />,
                    ul: ({ ...props }) => <ul className="list-disc ml-4 mb-1" {...props} />,
                    ol: ({ ...props }) => <ol className="list-decimal ml-4 mb-1" {...props} />,
                    li: ({ ...props }) => <li className="mb-0.5" {...props} />,
                    strong: ({ ...props }) => <strong className={`font-bold ${msg.sender === 'ai' ? 'text-[#A1B06B]' : 'text-white'}`} {...props} />,
                  }}
                >
                  {msg.text}
                </ReactMarkdown>
              </div>
              <div className="text-[9px] opacity-60 text-right mt-1 flex items-center justify-end gap-1">
                {msg.timestamp}
                {msg.sender === 'user' && <CheckCheck className="w-3 h-3 text-[#A1B06B]" />}
              </div>
            </div>
          </div>
        ))}

        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-slate-700 p-3 rounded-2xl rounded-bl-none text-slate-400 text-xs flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#A1B06B]" />
              Ortuso AI sta elaborando la richiesta...
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Quick Reply Buttons */}
      <div className="p-2 bg-slate-900 border-t border-slate-800 flex gap-1.5 overflow-x-auto no-scrollbar">
        <button
          onClick={() => handleSend("Ciao! Mi servono 5 casse di Chianti Classico e 2 latte di Olio EVO per venerdì al Ristorante Il Pino.")}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
        >
          📦 Ordine Ristorante
        </button>
        <button
          onClick={() => handleSend("Un cliente è allergico al sedano, la vostra salsa di pomodoro ne contiene? Posso ordinarne 10 casse?")}
          className="bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 px-2.5 py-1.5 rounded-full whitespace-nowrap transition-colors"
        >
          ⚠️ Verifica Allergeni
        </button>
      </div>

      {/* Input Bar */}
      <form
        onSubmit={(e) => { e.preventDefault(); handleSend(); }}
        className="p-2 bg-slate-950 flex items-center gap-2 rounded-b-[32px]"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Scrivi una richiesta o un ordine..."
          className="flex-1 bg-slate-900 border border-slate-800 rounded-full px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-[#707E3D]"
        />
        <button
          type="submit"
          className="w-8 h-8 bg-[#707E3D] hover:bg-[#5A6531] rounded-full flex items-center justify-center text-white transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
