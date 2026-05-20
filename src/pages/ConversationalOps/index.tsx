import React, { useState, useRef, useEffect } from 'react';
import { useMutation } from '@tanstack/react-query';
import { chatApi } from '@/services/api/client';
import { ChatMessage } from '@/types/apea.types';
import { PageHeader, Spinner } from '@/components/ui/shared';
import { MessageCircle, Send, Bot, User, Zap, Database, RotateCcw } from 'lucide-react';

const SUGGESTED = [
  'What are the top risk exceptions right now?',
  'Which plants have the most open deviations?',
  'Summarize all escalated exceptions',
  'What playbooks exist for equipment faults?',
  'Show me exceptions with SLA at risk',
];

const MsgBubble: React.FC<{ msg: ChatMessage }> = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex items-start gap-3 animate-slide-up ${isUser ? 'flex-row-reverse' : ''}`}>
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser ? 'var(--accent)' : 'var(--bg-card)',
          border: isUser ? 'none' : '1px solid var(--border)',
        }}
      >
        {isUser ? <User size={14} color="#fff" /> : <Bot size={14} style={{ color: 'var(--accent)' }} />}
      </div>
      <div className={`flex-1 max-w-[80%] ${isUser ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        <div
          className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
          style={{
            background: isUser ? 'var(--accent)' : 'var(--bg-card)',
            color: isUser ? '#fff' : 'var(--text-primary)',
            border: isUser ? 'none' : '1px solid var(--border)',
            borderBottomLeftRadius: isUser ? undefined : 4,
            borderBottomRightRadius: isUser ? 4 : undefined,
          }}
        >
          {msg.content}
        </div>
        {/* Metadata row */}
        <div className="flex items-center gap-2 px-1">
          {msg.rag_used && (
            <span className="inline-flex items-center gap-1 text-xs"
                  style={{ color: 'var(--text-muted)' }}>
              <Database size={10} /> RAG
            </span>
          )}
          {msg.timestamp && (
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export const ConversationalOpsPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: "Hello! I'm your APEA Ops Assistant. I have access to your live production data and knowledge base. Ask me about exceptions, escalations, playbooks, risk scores, or SLA status.",
      timestamp: new Date().toISOString(),
    },
  ]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = useMutation({
    mutationFn: (query: string) =>
      chatApi.query({
        query,
        history: messages.slice(-10).map(m => ({ role: m.role, content: m.content })),
      }),
    onMutate: (query) => {
      setMessages(prev => [...prev, {
        role: 'user',
        content: query,
        timestamp: new Date().toISOString(),
      }]);
      setInput('');
    },
    onSuccess: (resp) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: resp.data.answer,
        timestamp: resp.data.timestamp,
        rag_used: resp.data.rag_used,
      }]);
    },
    onError: (err) => {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: `Error: ${(err as Error).message}`,
        timestamp: new Date().toISOString(),
      }]);
    },
  });

  const handleSend = () => {
    const q = input.trim();
    if (!q || send.isPending) return;
    send.mutate(q);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-96px)]">
      <PageHeader
        title="Ops Chat"
        subtitle="Conversational AI assistant with RAG and live production context"
        actions={
          <button
            className="btn-ghost text-xs"
            onClick={() => setMessages([{
              role: 'assistant',
              content: "Chat cleared. How can I help?",
              timestamp: new Date().toISOString(),
            }])}
          >
            <RotateCcw size={13} /> Clear
          </button>
        }
      />

      <div className="flex flex-1 gap-4 min-h-0">
        {/* Chat panel */}
        <div className="flex-1 flex flex-col card overflow-hidden">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg, i) => (
              <MsgBubble key={i} msg={msg} />
            ))}
            {send.isPending && (
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                     style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  <Bot size={14} style={{ color: 'var(--accent)' }} />
                </div>
                <div className="flex items-center gap-1.5 px-4 py-3 rounded-2xl"
                     style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
                  {[0,1,2].map(i => (
                    <span key={i} className="w-1.5 h-1.5 rounded-full animate-pulse"
                          style={{ background: 'var(--accent)', animationDelay: `${i * 200}ms` }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input area */}
          <div className="border-t p-4" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                className="input-field flex-1 resize-none"
                rows={2}
                placeholder="Ask about exceptions, SLA risk, playbooks, escalations…"
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
              />
              <button
                className="btn-primary flex-shrink-0 self-end"
                onClick={handleSend}
                disabled={!input.trim() || send.isPending}
              >
                {send.isPending ? <Spinner size={16} /> : <Send size={16} />}
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--text-muted)' }}>
              Press Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>

        {/* Suggestions sidebar */}
        <div className="w-64 flex-shrink-0 flex flex-col gap-3">
          <div className="card p-4">
            <p className="text-xs font-semibold mb-3 flex items-center gap-1.5"
               style={{ color: 'var(--text-secondary)' }}>
              <Zap size={12} style={{ color: 'var(--accent)' }} /> Suggested Queries
            </p>
            <div className="space-y-2">
              {SUGGESTED.map((s) => (
                <button
                  key={s}
                  onClick={() => send.mutate(s)}
                  disabled={send.isPending}
                  className="w-full text-left text-xs p-2.5 rounded-lg transition-all"
                  style={{
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-secondary)',
                    border: '1px solid var(--border)',
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          <div className="card p-4">
            <p className="text-xs font-semibold mb-2 flex items-center gap-1.5"
               style={{ color: 'var(--text-secondary)' }}>
              <Database size={12} style={{ color: 'var(--accent)' }} /> Context Sources
            </p>
            {[
              { label: 'Knowledge Base', desc: 'Qdrant RAG (playbooks, SOPs)', active: true },
              { label: 'Live DB',        desc: 'Real-time exception data',     active: true },
              { label: 'History',        desc: 'Last 10 conversation turns',   active: true },
            ].map(({ label, desc, active }) => (
              <div key={label} className="flex items-start gap-2 mb-2">
                <div className="w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0"
                     style={{ background: active ? 'var(--low)' : 'var(--border)' }} />
                <div>
                  <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConversationalOpsPage;
