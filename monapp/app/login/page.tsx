"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";

const DARK_BLUE = "#1e3a5f";
const ORANGE = "#d97706";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    await new Promise((r) => setTimeout(r, 600));

    const users = JSON.parse(localStorage.getItem("renovexpert_users") || "[]");
    const user = users.find(
      (u: { email: string; password: string }) =>
        u.email === email && u.password === password
    );

    if (!user) {
      setError("Email ou mot de passe incorrect.");
      setLoading(false);
      return;
    }

    localStorage.setItem("renovexpert_auth", JSON.stringify(user));
    router.push("/dashboard");
  }

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
          maxWidth: "420px",
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
            Bon retour parmi nous
          </h1>
          <p style={{ fontSize: "14px", color: "#64748b" }}>
            Connectez-vous à votre espace artisan
          </p>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
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
                transition: "border-color 0.2s",
              }}
            />
          </div>

          <div style={{ marginBottom: "24px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                fontWeight: "600",
                color: "#374151",
                marginBottom: "6px",
              }}
            >
              Mot de passe
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
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

          {error && (
            <div
              style={{
                background: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#dc2626",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                marginBottom: "20px",
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
              background: loading ? "#94a3b8" : DARK_BLUE,
              color: "#ffffff",
              padding: "13px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "15px",
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background 0.2s",
            }}
          >
            {loading ? "Connexion en cours..." : "Se connecter"}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "14px",
            color: "#64748b",
          }}
        >
          Pas encore de compte ?{" "}
          <a
            href="/register"
            style={{ color: ORANGE, fontWeight: "600" }}
          >
            Créer un compte gratuit
          </a>
        </div>

        <div
          style={{
            marginTop: "32px",
            paddingTop: "24px",
            borderTop: "1px solid #e2e8f0",
            background: "#f8fafc",
            borderRadius: "8px",
            padding: "16px",
            fontSize: "12px",
            color: "#94a3b8",
          }}
        >
          <strong style={{ color: "#64748b" }}>Compte démo :</strong> Créez
          d'abord un compte via{" "}
          <a href="/register" style={{ color: ORANGE }}>
            l'inscription
          </a>
          .
        </div>
      </div>
    </div>
  );
}
