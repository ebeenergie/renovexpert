"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";

const DARK_BLUE = "#1e3a5f";
const ORANGE = "#d97706";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface User {
  name: string;
  email: string;
  company: string;
  plan: string;
}

const quickActions = [
  {
    icon: "🏠",
    label: "Vérifier l'éligibilité MPR",
    prompt:
      "Comment vérifier si un client est éligible à MaPrimeRénov' ? Quels sont les critères principaux ?",
  },
  {
    icon: "⚡",
    label: "Calculer les CEE",
    prompt:
      "Comment calculer les CEE (Certificats d'Économies d'Énergie) pour des travaux d'isolation ? Quels documents fournir ?",
  },
  {
    icon: "🏛️",
    label: "Monter un dossier ANAH",
    prompt:
      "Quelles sont les étapes pour monter un dossier ANAH ? Quels formulaires sont obligatoires ?",
  },
  {
    icon: "📋",
    label: "Réglementations RGE",
    prompt:
      "Quelles sont les obligations RGE pour accéder aux aides à la rénovation énergétique ? Comment maintenir la certification ?",
  },
  {
    icon: "💶",
    label: "Cumul des aides",
    prompt:
      "Peut-on cumuler MPR, CEE et aides ANAH pour un même chantier ? Quelles sont les règles de cumul ?",
  },
  {
    icon: "📅",
    label: "Délais et procédures",
    prompt:
      "Quels sont les délais de traitement pour les dossiers MPR et ANAH ? Comment accélérer le traitement ?",
  },
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const auth = localStorage.getItem("renovexpert_auth");
    if (!auth) {
      router.push("/login");
      return;
    }
    setUser(JSON.parse(auth));
  }, [router]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function handleLogout() {
    localStorage.removeItem("renovexpert_auth");
    router.push("/");
  }

  async function sendMessage(content: string) {
    if (!content.trim() || isLoading) return;

    const newMessages: Message[] = [
      ...messages,
      { role: "user", content: content.trim() },
    ];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    const assistantMessage: Message = { role: "assistant", content: "" };
    setMessages([...newMessages, assistantMessage]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      if (!response.ok) throw new Error("Erreur de l'API");

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) throw new Error("Pas de flux");

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const updated = [...prev];
          const last = updated[updated.length - 1];
          if (last.role === "assistant") {
            updated[updated.length - 1] = {
              ...last,
              content: last.content + text,
            };
          }
          return updated;
        });
      }
    } catch {
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content:
            "Désolé, une erreur s'est produite. Vérifiez que la clé API Anthropic est configurée dans votre fichier .env.local.",
        };
        return updated;
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    await sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  if (!user) return null;

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "#f1f5f9" }}>
      {/* Sidebar */}
      <aside
        style={{
          width: sidebarOpen ? "260px" : "0",
          minWidth: sidebarOpen ? "260px" : "0",
          background: DARK_BLUE,
          color: "#ffffff",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          transition: "width 0.3s, min-width 0.3s",
          boxShadow: "2px 0 10px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ padding: "24px 20px", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ fontSize: "20px", fontWeight: "800", marginBottom: "4px" }}>
            Renov<span style={{ color: ORANGE }}>Expert</span>
          </div>
          <div style={{ fontSize: "12px", color: "rgba(255,255,255,0.5)" }}>
            Assistant IA rénovation
          </div>
        </div>

        <div style={{ padding: "20px", flex: 1, overflow: "auto" }}>
          <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
            Actions rapides
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {quickActions.map((action) => (
              <button
                key={action.label}
                onClick={() => sendMessage(action.prompt)}
                disabled={isLoading}
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "rgba(255,255,255,0.85)",
                  borderRadius: "8px",
                  padding: "10px 12px",
                  textAlign: "left",
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: "13px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  transition: "background 0.2s",
                  opacity: isLoading ? 0.5 : 1,
                }}
              >
                <span style={{ fontSize: "16px" }}>{action.icon}</span>
                <span>{action.label}</span>
              </button>
            ))}
          </div>

          <div style={{ marginTop: "24px" }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "12px" }}>
              Navigation
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { icon: "📊", label: "Tableau de bord", href: "/dashboard" },
                { icon: "💳", label: "Abonnement", href: "/subscription" },
              ].map((item) => (
                <a
                  key={item.label}
                  href={item.href}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    padding: "9px 12px",
                    borderRadius: "8px",
                    color: "rgba(255,255,255,0.75)",
                    fontSize: "13px",
                    background: "transparent",
                    transition: "background 0.2s",
                  }}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </a>
              ))}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#ffffff" }}>{user.name}</div>
            <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)" }}>{user.company}</div>
            <div style={{
              display: "inline-block",
              background: "rgba(217,119,6,0.3)",
              color: ORANGE,
              fontSize: "10px",
              fontWeight: "700",
              padding: "2px 8px",
              borderRadius: "10px",
              marginTop: "4px",
              textTransform: "capitalize",
            }}>
              Plan {user.plan}
            </div>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "rgba(255,255,255,0.08)",
              border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.7)",
              borderRadius: "6px",
              padding: "7px 14px",
              fontSize: "12px",
              cursor: "pointer",
              width: "100%",
            }}
          >
            Se déconnecter
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
        {/* Header */}
        <header
          style={{
            background: "#ffffff",
            padding: "0 24px",
            height: "62px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            borderBottom: "1px solid #e2e8f0",
            boxShadow: "0 1px 4px rgba(0,0,0,0.05)",
            flexShrink: 0,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              style={{
                background: "none",
                border: "none",
                padding: "6px",
                cursor: "pointer",
                color: "#64748b",
                fontSize: "18px",
                borderRadius: "6px",
              }}
            >
              ☰
            </button>
            <div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: DARK_BLUE }}>
                Assistant IA Rénovation
              </div>
              <div style={{ fontSize: "12px", color: "#94a3b8" }}>
                Aides MPR • CEE • ANAH • Réglementation
              </div>
            </div>
          </div>
          {messages.length > 0 && (
            <button
              onClick={() => setMessages([])}
              style={{
                background: "#f1f5f9",
                border: "1px solid #e2e8f0",
                color: "#64748b",
                borderRadius: "6px",
                padding: "6px 14px",
                fontSize: "13px",
                cursor: "pointer",
              }}
            >
              Nouvelle conversation
            </button>
          )}
        </header>

        {/* Chat area */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {messages.length === 0 ? (
            <div style={{ maxWidth: "700px", margin: "0 auto", textAlign: "center", paddingTop: "40px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🏗️</div>
              <h2 style={{ fontSize: "24px", fontWeight: "700", color: DARK_BLUE, marginBottom: "12px" }}>
                Bonjour {user.name.split(" ")[0]} !
              </h2>
              <p style={{ fontSize: "16px", color: "#64748b", marginBottom: "40px", lineHeight: "1.6" }}>
                Je suis votre assistant expert en rénovation énergétique. Posez-moi vos questions sur les aides
                MPR, CEE, ANAH ou toute réglementation du bâtiment.
              </p>
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: "12px",
                textAlign: "left",
              }}>
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => sendMessage(action.prompt)}
                    style={{
                      background: "#ffffff",
                      border: `1px solid #e2e8f0`,
                      borderRadius: "10px",
                      padding: "16px",
                      cursor: "pointer",
                      textAlign: "left",
                      transition: "border-color 0.2s, box-shadow 0.2s",
                    }}
                  >
                    <div style={{ fontSize: "24px", marginBottom: "8px" }}>{action.icon}</div>
                    <div style={{ fontSize: "13px", fontWeight: "600", color: DARK_BLUE }}>{action.label}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ maxWidth: "760px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "20px" }}>
              {messages.map((msg, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
                    gap: "12px",
                    alignItems: "flex-start",
                  }}
                >
                  {msg.role === "assistant" && (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: DARK_BLUE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        flexShrink: 0,
                      }}
                    >
                      🤖
                    </div>
                  )}
                  <div
                    style={{
                      maxWidth: "80%",
                      padding: "14px 18px",
                      borderRadius: msg.role === "user" ? "16px 16px 4px 16px" : "16px 16px 16px 4px",
                      background: msg.role === "user" ? DARK_BLUE : "#ffffff",
                      color: msg.role === "user" ? "#ffffff" : "#1e293b",
                      fontSize: "14px",
                      lineHeight: "1.7",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      whiteSpace: "pre-wrap",
                    }}
                  >
                    {msg.content || (
                      <span style={{ color: "#94a3b8" }}>
                        <span style={{ animation: "pulse 1s infinite" }}>●</span>{" "}
                        <span style={{ animation: "pulse 1s 0.2s infinite" }}>●</span>{" "}
                        <span style={{ animation: "pulse 1s 0.4s infinite" }}>●</span>
                      </span>
                    )}
                  </div>
                  {msg.role === "user" && (
                    <div
                      style={{
                        width: "36px",
                        height: "36px",
                        borderRadius: "50%",
                        background: ORANGE,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "16px",
                        flexShrink: 0,
                        fontWeight: "700",
                        color: "#ffffff",
                      }}
                    >
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input area */}
        <div
          style={{
            background: "#ffffff",
            borderTop: "1px solid #e2e8f0",
            padding: "16px 24px",
            flexShrink: 0,
          }}
        >
          <form onSubmit={handleSubmit} style={{ maxWidth: "760px", margin: "0 auto" }}>
            <div
              style={{
                display: "flex",
                gap: "12px",
                alignItems: "flex-end",
                background: "#f8fafc",
                border: "1.5px solid #e2e8f0",
                borderRadius: "12px",
                padding: "10px 14px",
              }}
            >
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Posez votre question sur les aides MPR, CEE, ANAH..."
                rows={1}
                style={{
                  flex: 1,
                  background: "transparent",
                  border: "none",
                  resize: "none",
                  fontSize: "14px",
                  color: "#1e293b",
                  lineHeight: "1.5",
                  maxHeight: "120px",
                  overflow: "auto",
                  fontFamily: "inherit",
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                style={{
                  background: !input.trim() || isLoading ? "#cbd5e1" : DARK_BLUE,
                  color: "#ffffff",
                  border: "none",
                  borderRadius: "8px",
                  width: "40px",
                  height: "40px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: !input.trim() || isLoading ? "not-allowed" : "pointer",
                  fontSize: "18px",
                  flexShrink: 0,
                  transition: "background 0.2s",
                }}
              >
                ↑
              </button>
            </div>
            <div style={{ textAlign: "center", marginTop: "8px", fontSize: "11px", color: "#94a3b8" }}>
              Appuyez sur Entrée pour envoyer • Maj+Entrée pour un saut de ligne
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
