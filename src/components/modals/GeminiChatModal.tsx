import React, { useState, useRef, useEffect } from 'react';

interface ChatMessage {
  role: 'user' | 'model';
  content: string;
  modelUsed?: string;
  timestamp: string;
}

export const GeminiChatModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'model',
      content:
        'Greetings, Trader. I am your Institutional Risk Coach & Trade Psychologist powered by Gemini. Ask me about execution discipline, how to size out of winners, overcoming FOMO, or analyzing your risk-to-reward metrics.',
      modelUsed: 'gemini-3.5-flash',
      timestamp: 'Just now',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [modelTier, setModelTier] = useState<'general' | 'complex' | 'fast'>('general');
  const [systemRole, setSystemRole] = useState<'psychologist' | 'quant' | 'risk_manager'>('psychologist');
  const [loading, setLoading] = useState(false);
  const threadEndRef = useRef<HTMLDivElement>(null);

  const roleDescriptions: Record<string, string> = {
    psychologist:
      'You are an empathetic, disciplined Senior Trading Psychologist. Focus on cognitive biases (FOMO, revenge trading, regret, hesitation, and overtrading).',
    quant:
      'You are a Lead Quantitative Execution Strategist. Focus on expectancy, Sharpe ratio, statistical edges, Kelly criterion position sizing, and VWAP confluences.',
    risk_manager:
      'You are a strict Prop Desk Risk Manager. Enforce drawdown limits, hard stop adherence, position caps, and disciplined risk-to-reward thresholds.',
  };

  useEffect(() => {
    if (isOpen) {
      threadEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSend = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || loading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: inputText.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newHistory = [...messages, userMsg];
    setMessages(newHistory);
    setInputText('');
    setLoading(true);

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newHistory.map((m) => ({ role: m.role, content: m.content })),
          modelTier,
          systemInstruction: roleDescriptions[systemRole],
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Server error');

      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: data.text,
          modelUsed: data.modelUsed,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'model',
          content: `⚠️ Error communicating with Gemini: ${err.message}`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-1 sm:p-4 bg-black/80 backdrop-blur-md animate-fadeIn select-none">
      <div className="w-full max-w-2xl rounded-xl sm:rounded-2xl bg-surface-container-low border border-surface-container-highest/60 shadow-2xl flex flex-col h-[96vh] sm:h-[85vh] max-h-[750px] overflow-hidden">
        {/* Top Header */}
        <div className="p-3 sm:p-4 border-b border-surface-container-highest/40 flex items-center justify-between bg-surface-container/60 gap-2">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-primary-container/20 flex items-center justify-center text-primary">
              <span className="material-symbols-outlined text-[24px]">psychology</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-sm text-headline-sm text-on-surface font-semibold">
                  Gemini Trading Copilot
                </h3>
                <span className="font-tag-mono text-[10px] px-2 py-0.5 rounded-full bg-secondary/10 text-secondary font-bold">
                  MULTI-TURN
                </span>
              </div>
              <p className="font-tag-mono text-[11px] text-on-surface-variant">
                Models: gemini-3.1-pro-preview · gemini-3.5-flash · gemini-3.1-flash-lite
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-surface-container-high flex items-center justify-center text-on-surface-variant hover:text-on-surface transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        {/* Persona & Model Tier Bar */}
        <div className="p-3 bg-surface-container-lowest/80 border-b border-surface-container-highest/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          {/* Persona selector */}
          <div className="flex items-center gap-1.5">
            <span className="font-label-caps text-[10px] text-outline uppercase">Copilot Persona:</span>
            <select
              value={systemRole}
              onChange={(e) => setSystemRole(e.target.value as any)}
              className="bg-surface-container text-on-surface text-xs rounded px-2 py-1 border border-surface-container-highest/40 focus:outline-none"
            >
              <option value="psychologist">Trading Psychologist</option>
              <option value="quant">Quantitative Strategist</option>
              <option value="risk_manager">Prop Desk Risk Officer</option>
            </select>
          </div>

          {/* Model tier toggle */}
          <div className="flex items-center gap-1">
            <span className="font-label-caps text-[10px] text-outline uppercase mr-1">Speed/Power:</span>
            <button
              onClick={() => setModelTier('fast')}
              className={`px-2 py-0.5 rounded text-[11px] font-tag-mono transition-all ${
                modelTier === 'fast'
                  ? 'bg-secondary/20 text-secondary font-bold border border-secondary/40'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              title="gemini-3.1-flash-lite (Fast)"
            >
              ⚡ Fast (Flash-Lite)
            </button>
            <button
              onClick={() => setModelTier('general')}
              className={`px-2 py-0.5 rounded text-[11px] font-tag-mono transition-all ${
                modelTier === 'general'
                  ? 'bg-primary-container text-on-primary-container font-bold'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              title="gemini-3.5-flash (General)"
            >
              🎯 General (3.5-Flash)
            </button>
            <button
              onClick={() => setModelTier('complex')}
              className={`px-2 py-0.5 rounded text-[11px] font-tag-mono transition-all ${
                modelTier === 'complex'
                  ? 'bg-primary/20 text-primary font-bold border border-primary/40'
                  : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`}
              title="gemini-3.1-pro-preview (Complex reasoning)"
            >
              🧠 Complex (3.1-Pro)
            </button>
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3.5 bg-surface-container-low/50">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={index}
                className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl p-3.5 shadow-sm text-sm ${
                    isUser
                      ? 'bg-primary-container text-on-primary-container rounded-br-none'
                      : 'bg-surface-container text-on-surface border border-surface-container-highest/40 rounded-bl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                </div>
                <div className="flex items-center gap-2 mt-1 px-1 text-[10px] font-tag-mono text-on-surface-variant/70">
                  <span>{msg.timestamp}</span>
                  {msg.modelUsed && <span>• {msg.modelUsed}</span>}
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="flex items-center gap-2 text-primary font-tag-mono text-xs p-2">
              <span className="material-symbols-outlined text-[16px] animate-spin">
                progress_activity
              </span>
              <span>Thinking with {modelTier === 'complex' ? 'gemini-3.1-pro-preview' : modelTier === 'fast' ? 'gemini-3.1-flash-lite' : 'gemini-3.5-flash'}...</span>
            </div>
          )}
          <div ref={threadEndRef} />
        </div>

        {/* Input Bar */}
        <form onSubmit={handleSend} className="p-3 bg-surface-container/80 border-t border-surface-container-highest/40 flex items-center gap-2">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask your risk officer about discipline, sizing, FOMO..."
            className="flex-1 bg-surface-container-lowest text-on-surface text-sm rounded-xl px-3.5 py-2.5 border border-surface-container-highest/40 focus:outline-none focus:border-primary"
          />
          <button
            type="submit"
            disabled={loading || !inputText.trim()}
            className="px-4 py-2.5 rounded-xl bg-primary-container text-on-primary-container font-headline-sm text-sm font-semibold flex items-center gap-1.5 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all"
          >
            <span>Send</span>
            <span className="material-symbols-outlined text-[18px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
};
