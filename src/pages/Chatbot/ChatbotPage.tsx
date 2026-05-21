import { useEffect, useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Send, Sparkles, Upload, FileText, Loader2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { chatApi, ragApi } from "@/services/api/endpoints";
import { API_CONFIG } from "@/config/api.config";
import { useUiStore } from "@/store/slices/ui";
import { cn } from "@/utils/cn";
import type { ChatMessage } from "@/types";

function newSessionId() {
  return `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

export function ChatbotPage() {
  const pushToast = useUiStore((s) => s.pushToast);
  const [sessionId] = useState(() => newSessionId());
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content:
        "Hi! I'm your APEA assistant. Ask me about deviations, root causes, or production playbooks. I'll cite the documents I use.",
    },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const docs = useQuery({ queryKey: ["rag-docs"], queryFn: ragApi.list });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streaming]);

  const baseUrl = useMemo(() => (import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/$/, ""), []);

  const sendStream = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", content: text }]);
    setMessages((m) => [...m, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const token = localStorage.getItem(API_CONFIG.tokenStorageKey);
      const url = `${baseUrl}/chat/stream?token=${encodeURIComponent(token || "")}`;
      const resp = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "text/event-stream" },
        body: JSON.stringify({ session_id: sessionId, message: text }),
      });
      if (!resp.body) throw new Error("No response body");
      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let citations: { source: string; score: number }[] | undefined;
      // SSE parsing
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";
        for (const evt of events) {
          const lines = evt.split("\n");
          let event = "message";
          const data: string[] = [];
          for (const ln of lines) {
            if (ln.startsWith("event:")) event = ln.slice(6).trim();
            else if (ln.startsWith("data:")) data.push(ln.slice(5).trim());
          }
          const payload = data.join("\n");
          if (event === "token") {
            const chunk = payload;
            setMessages((m) => {
              const next = [...m];
              const last = next[next.length - 1];
              if (last && last.role === "assistant") last.content += chunk;
              return next;
            });
          } else if (event === "citations") {
            try {
              citations = JSON.parse(payload) as { source: string; score: number }[];
            } catch {
              /* ignore */
            }
          } else if (event === "done") {
            if (citations) {
              setMessages((m) => {
                const next = [...m];
                const last = next[next.length - 1];
                if (last && last.role === "assistant") last.citations = citations;
                return next;
              });
            }
          } else if (event === "error") {
            pushToast({ title: "Stream error", description: payload, variant: "error" });
          }
        }
      }
    } catch (err) {
      // Fallback to non-streaming endpoint
      try {
        const reply = await chatApi.send(sessionId, text);
        setMessages((m) => {
          const next = [...m];
          if (next[next.length - 1]?.role === "assistant" && next[next.length - 1].content === "") {
            next[next.length - 1] = reply;
          } else {
            next.push(reply);
          }
          return next;
        });
      } catch (e) {
        pushToast({
          title: "Chat failed",
          description: e instanceof Error ? e.message : String(e),
          variant: "error",
        });
      }
    } finally {
      setStreaming(false);
    }
  };

  const onUpload = async (file: File) => {
    try {
      await ragApi.upload(file);
      pushToast({ title: "Document indexed", description: file.name, variant: "success" });
      docs.refetch();
    } catch (err) {
      pushToast({
        title: "Upload failed",
        description: err instanceof Error ? err.message : "error",
        variant: "error",
      });
    }
  };

  return (
    <PageWrapper title="APEA Assistant" description="Retrieval-augmented chat grounded on your playbooks">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2" padded={false}>
          <div className="flex flex-col h-[70vh]">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={cn("flex flex-col gap-1", m.role === "user" ? "items-end" : "items-start")}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                      m.role === "user"
                        ? "bg-primary text-primary-fg"
                        : "bg-muted text-text border border-border",
                    )}
                  >
                    {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                  </div>
                  {m.citations && m.citations.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {m.citations.map((c, j) => (
                        <Badge key={j} tone="info">
                          {c.source} · {(c.score * 100).toFixed(0)}%
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {streaming && (
                <div className="flex items-center gap-2 text-xs text-subtext">
                  <Loader2 className="h-3 w-3 animate-spin" /> generating…
                </div>
              )}
            </div>

            <div className="border-t border-border p-3 flex gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    sendStream();
                  }
                }}
                placeholder="Ask about a deviation, line, or playbook…"
                className="flex-1 resize-none rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text"
              />
              <Button
                onClick={sendStream}
                isLoading={streaming}
                leftIcon={<Send className="h-4 w-4" />}
                disabled={!input.trim()}
              >
                Send
              </Button>
            </div>
          </div>
        </Card>

        <Card title="Knowledge base" description="Upload playbooks, SOPs, and reports">
          <label className="flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-border bg-muted/30 p-6 text-sm text-subtext cursor-pointer hover:bg-muted/50 transition-colors">
            <Upload className="h-5 w-5" />
            <span>Drop or click to upload</span>
            <span className="text-xs">.txt .md .pdf .docx</span>
            <input
              type="file"
              accept=".txt,.md,.pdf,.docx"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) onUpload(f);
                e.target.value = "";
              }}
            />
          </label>

          <h4 className="mt-5 mb-2 text-sm font-semibold text-text flex items-center gap-1.5">
            <Sparkles className="h-4 w-4 text-primary" /> Indexed documents
          </h4>
          <ul className="space-y-1.5 text-sm">
            {(Array.isArray(docs.data) ? docs.data : []).map((d: any) => (
              <li key={d.id} className="flex items-center gap-2 text-text">
                <FileText className="h-3.5 w-3.5 text-subtext" />
                <span className="truncate">{d.filename}</span>
                <Badge tone="neutral" className="ml-auto">
                  {d.chunks} chunks
                </Badge>
              </li>
            ))}
            {!docs.isLoading && (docs.data?.length || 0) === 0 && (
              <li className="text-xs text-subtext">No documents yet.</li>
            )}
          </ul>
        </Card>
      </div>
    </PageWrapper>
  );
}
