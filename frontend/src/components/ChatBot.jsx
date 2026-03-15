import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Bot, User } from "lucide-react";
import useStore from "../store/useStore.js";

const SUGGESTIONS = [
  "Common risks in metro rail projects?",
  "How to reduce land acquisition delays?",
  "PMGSY standards for rural roads?",
  "EIA requirements in India?",
];

export default function ChatBot() {
  const { chatOpen, toggleChat, chatMessages, sendChat, clearChat } = useStore();
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  const send = async () => {
    if (!input.trim() || sending) return;
    const m = input.trim();
    setInput("");
    setSending(true);
    await sendChat(m);
    setSending(false);
  };

  if (!chatOpen) {
    return (
      <button
        onClick={toggleChat}
        style={{
          position: "fixed", bottom: "24px", right: "24px", zIndex: 50,
          width: "52px", height: "52px", borderRadius: "50%",
          background: "var(--amber)", border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 4px 24px rgba(255,183,43,0.4)", transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.08)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
      >
        <MessageSquare size={20} color="#0e0f0f" />
      </button>
    );
  }

  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 50,
      width: "360px", height: "500px",
      display: "flex", flexDirection: "column",
      background: "#1a1b1c", borderRadius: "16px", overflow: "hidden",
      border: "1px solid rgba(255,183,43,0.25)",
      boxShadow: "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(255,183,43,0.08)",
    }}>
      {/* Header */}
      <div style={{
        padding: "12px 16px", display: "flex", alignItems: "center", gap: "10px",
        background: "rgba(255,183,43,0.06)", borderBottom: "1px solid rgba(255,183,43,0.15)",
        flexShrink: 0,
      }}>
        <div style={{
          width: "32px", height: "32px", borderRadius: "9px",
          background: "rgba(255,183,43,0.15)", display: "flex", alignItems: "center", justifyContent: "center",
        }}>
          <Bot size={15} color="#ffb72b" />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Syne", fontWeight: 700, fontSize: "14px" }}>InfraBot</div>
          <div style={{ fontSize: "11px", color: "#5a5753", display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#4ade80", display: "inline-block" }} />
            Infrastructure AI
          </div>
        </div>
        <button onClick={clearChat} style={{ background: "none", border: "none", color: "#5a5753", cursor: "pointer", fontSize: "11px" }}>
          Clear
        </button>
        <button onClick={toggleChat} style={{ background: "none", border: "none", color: "#5a5753", cursor: "pointer", padding: "4px" }}>
          <X size={15} />
        </button>
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: "auto", padding: "14px", display: "flex", flexDirection: "column", gap: "10px" }}>
        {chatMessages.length === 0 && (
          <div style={{ textAlign: "center", paddingTop: "16px" }}>
            <div style={{ fontSize: "24px", marginBottom: "8px" }}>🏗️</div>
            <p style={{ fontSize: "13px", fontWeight: 600, marginBottom: "4px" }}>InfraBot AI</p>
            <p style={{ fontSize: "12px", color: "#5a5753", marginBottom: "14px" }}>Ask about infrastructure planning</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {SUGGESTIONS.map((s) => (
                <button key={s} onClick={() => setInput(s)}
                  style={{
                    textAlign: "left", fontSize: "12px", padding: "8px 10px", borderRadius: "8px",
                    background: "rgba(255,183,43,0.05)", border: "1px solid rgba(255,183,43,0.15)",
                    color: "#9a9690", cursor: "pointer", fontFamily: "Outfit",
                  }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div key={msg.id} style={{ display: "flex", gap: "7px", justifyContent: msg.role === "user" ? "flex-end" : "flex-start" }}>
            {msg.role === "assistant" && (
              <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "rgba(255,183,43,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                <Bot size={11} color="#ffb72b" />
              </div>
            )}
            <div style={{
              maxWidth: "82%", fontSize: "12px", lineHeight: 1.55, padding: "8px 11px", borderRadius: "10px",
              background: msg.role === "user" ? "rgba(255,183,43,0.12)" : "rgba(255,255,255,0.04)",
              color: "#f0ede8",
              border: msg.role === "user" ? "1px solid rgba(255,183,43,0.2)" : "1px solid rgba(255,255,255,0.05)",
              borderRadius: msg.role === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
            }}>
              {msg.content}
              {msg.source && (
                <div style={{ marginTop: "5px", fontSize: "10px", color: "#5a5753", fontFamily: "IBM Plex Mono" }}>
                  via {msg.source}
                </div>
              )}
            </div>
            {msg.role === "user" && (
              <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "rgba(96,165,250,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, marginTop: "2px" }}>
                <User size={11} color="#60a5fa" />
              </div>
            )}
          </div>
        ))}

        {sending && (
          <div style={{ display: "flex", gap: "7px" }}>
            <div style={{ width: "24px", height: "24px", borderRadius: "7px", background: "rgba(255,183,43,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Bot size={11} color="#ffb72b" />
            </div>
            <div style={{ padding: "10px 12px", borderRadius: "10px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.05)", display: "flex", gap: "4px" }}>
              {[0, 1, 2].map((i) => (
                <span key={i} style={{ width: 6, height: 6, borderRadius: "50%", background: "#ffb72b", display: "inline-block", animation: "dot-pulse 1.4s ease-in-out infinite", animationDelay: `${i * 0.18}s` }} />
              ))}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Input */}
      <div style={{ padding: "10px 12px", borderTop: "1px solid rgba(255,183,43,0.12)", flexShrink: 0 }}>
        <div style={{ display: "flex", gap: "8px" }}>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(); } }}
            placeholder="Ask about infrastructure planning…"
            rows={2}
            style={{
              flex: 1, resize: "none", fontSize: "12px", fontFamily: "Outfit",
              background: "var(--ink3)", border: "1px solid rgba(255,183,43,0.15)",
              borderRadius: "9px", padding: "8px 11px", color: "var(--text)",
              outline: "none",
            }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || sending}
            style={{
              width: "38px", height: "38px", borderRadius: "9px", flexShrink: 0, alignSelf: "flex-end",
              background: input.trim() ? "var(--amber)" : "rgba(255,183,43,0.1)",
              border: "none", cursor: input.trim() ? "pointer" : "default",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Send size={14} color={input.trim() ? "#0e0f0f" : "#5a5753"} />
          </button>
        </div>
      </div>
    </div>
  );
}
