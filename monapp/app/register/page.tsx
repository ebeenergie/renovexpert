"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const DARK_BLUE = "#1e3a5f";
const ORANGE = "#d97706";

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("pro");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 700));

    const users = JSON.parse(localStorage.getItem("renovexpert_users") || "[]");
    if (users.find((u: { email: string }) => u.email === email)) {
      setError("Un compte avec cet email existe déjà.");
      setLoading(false);
      return;
    }

    const newUser = { name, company, email, password, plan, createdAt: new Date().toISOString() };
    users.push(newUser);
    localStorage.setItem("renovexpert_users", JSON.stringify(users));
    localStorage.setItem("renovexpert_auth", JSON.stringify(newUser));
    router.push("/dashboard");
  }

  const plans = [
    { id: "essentiel", label: "Essentiel", price: "15€/mois" },
    { id: "pro", label: "Pro", price: "25€/mois" },
    { id: "premium", label: "Premium", price: "39€/mois" },
  ];

  return (
    <div
      style={{
        minHeight: "100vh",
        background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #2d5a8e 100%)`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "20px",
      }}
    >
      <div
        style={{
          background: "#ffffff",
          borderRadius: "16px",
          padding: "48px 40px",
          width: "100%",
          maxWidth: "480px",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "32px" }}>
          <a
            href="/"
            style={{
              fontSize: "24px",
              fontWeight: "800",
              color: DARK_BLUE,
              display: "block",
              marginBottom: "8px",
            }}
          >
            Renov<span style={{ color: ORANGE }}>Expert</span>
          </a>
          <h1
            style={{
              fontSize: "22px",
              fontWeight: "700",
              color: "#1e293b",
              marginBottom: "6px",
            }}
          >
            Créer votre compte
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            14 jours d'essai gratuit, sans carte bancaire
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "16px",
              marginBottom: "16px",
            }}
          >
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Prénom & Nom
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Jean Dupont"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#1e293b",
                  background: "#f9fafb",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
                Entreprise
              </label>
              <input
                type="text"
                required
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="Dupont Rénovation"
                style={{
                  width: "100%",
                  padding: "11px 14px",
                  border: "1.5px solid #d1d5db",
                  borderRadius: "8px",
                  fontSize: "14px",
                  color: "#1e293b",
                  background: "#f9fafb",
                }}
              />
            </div>
          </div>

          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
              Adresse email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@exemple.fr"
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "1.5px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#1e293b",
                background: "#f9fafb",
              }}
            />
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 6 caractères"
              style={{
                width: "100%",
                padding: "11px 14px",
                border: "1.5px solid #d1d5db",
                borderRadius: "8px",
                fontSize: "14px",
                color: "#1e293b",
                background: "#f9fafb",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "10px" }}>
              Choisissez votre offre
            </label>
            <div style={{ display: "flex", gap: "10px" }}>
              {plans.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPlan(p.id)}
                  style={{
                    flex: 1,
                    padding: "10px 8px",
                    borderRadius: "8px",
                    border: plan === p.id ? `2px solid ${ORANGE}` : "1.5px solid #d1d5db",
                    background: plan === p.id ? "#fff8ed" : "#f9fafb",
                    cursor: "pointer",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "13px", fontWeight: "700", color: DARK_BLUE }}>{p.label}</div>
                  <div style={{ fontSize: "11px", color: "#64748b" }}>{p.price}</div>
                </button>
              ))}
            </div>
          </div>

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "16px",
              }}
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              width: "100%",
              background: loading ? "#94a3b8" : ORANGE,
              color: "#ffffff",
              padding: "13px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              boxShadow: loading ? "none" : "0 4px 15px rgba(217,119,6,0.35)",
            }}
          >
            {loading ? "Création du compte..." : "Créer mon compte gratuit →"}
          </button>
        </form>

        <p
          style={{
            marginTop: "16px",
            textAlign: "center",
            fontSize: "11px",
            color: "#94a3b8",
            lineHeight: "1.5",
          }}
        >
          En créant votre compte, vous acceptez nos{" "}
          <a href="#" style={{ color: ORANGE }}>CGU</a> et notre{" "}
          <a href="#" style={{ color: ORANGE }}>politique de confidentialité</a>.
        </p>

        <div style={{ marginTop: "20px", textAlign: "center", fontSize: "14px", color: "#64748b" }}>
          Déjà un compte ?{" "}
          <a href="/login" style={{ color: ORANGE, fontWeight: "600" }}>
            Se connecter
          </a>
        </div>
      </div>
    </div>
  );
}
