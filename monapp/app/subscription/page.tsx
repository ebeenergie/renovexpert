"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

const DARK_BLUE = "#1e3a5f";
const ORANGE = "#d97706";

interface User {
  name: string;
  email: string;
  company: string;
  plan: string;
  createdAt: string;
}

const plans = [
  {
    id: "essentiel",
    name: "Essentiel",
    price: "15",
    desc: "Pour les artisans indépendants",
    features: [
      "Jusqu'à 5 chantiers actifs",
      "Assistant IA (50 questions/mois)",
      "Gestion MPR de base",
      "Devis & factures",
      "Support par email",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "25",
    desc: "Pour les petites équipes",
    features: [
      "Chantiers illimités",
      "Assistant IA illimité",
      "MPR, CEE & ANAH complets",
      "Rapports avancés",
      "Support prioritaire",
      "2 utilisateurs inclus",
    ],
    popular: true,
  },
  {
    id: "premium",
    name: "Premium",
    price: "39",
    desc: "Pour les entreprises",
    features: [
      "Tout du plan Pro",
      "Utilisateurs illimités",
      "API & intégrations",
      "Formation personnalisée",
      "Account manager dédié",
      "SLA garanti 99,9%",
    ],
  },
];

export default function SubscriptionPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [selectedPlan, setSelectedPlan] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("renovexpert_auth");
    if (!auth) {
      router.push("/login");
      return;
    }
    const u = JSON.parse(auth);
    setUser(u);
    setSelectedPlan(u.plan || "pro");
  }, [router]);

  async function handleChangePlan(planId: string) {
    if (planId === user?.plan) return;
    setLoading(true);
    setSuccess("");

    await new Promise((r) => setTimeout(r, 800));

    const updatedUser = { ...user, plan: planId } as User;
    localStorage.setItem("renovexpert_auth", JSON.stringify(updatedUser));

    const users = JSON.parse(localStorage.getItem("renovexpert_users") || "[]");
    const idx = users.findIndex((u: User) => u.email === user?.email);
    if (idx !== -1) {
      users[idx] = updatedUser;
      localStorage.setItem("renovexpert_users", JSON.stringify(users));
    }

    setUser(updatedUser);
    setSelectedPlan(planId);
    setSuccess(`Votre abonnement a été mis à jour vers le plan ${plans.find((p) => p.id === planId)?.name} avec succès !`);
    setLoading(false);
  }

  if (!user) return null;

  const joinDate = new Date(user.createdAt).toLocaleDateString("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ minHeight: "100vh", background: "#f1f5f9" }}>
      {/* Navbar */}
      <nav
        style={{
          background: DARK_BLUE,
          padding: "0 5%",
          height: "62px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <a
          href="/dashboard"
          style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff" }}
        >
          Renov<span style={{ color: ORANGE }}>Expert</span>
        </a>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="/dashboard"
            style={{
              color: "rgba(255,255,255,0.8)",
              fontSize: "14px",
              padding: "6px 14px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.2)",
            }}
          >
            ← Tableau de bord
          </a>
        </div>
      </nav>

      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "40px 24px" }}>
        <h1
          style={{
            fontSize: "28px",
            fontWeight: "800",
            color: DARK_BLUE,
            marginBottom: "6px",
          }}
        >
          Mon abonnement
        </h1>
        <p style={{ fontSize: "15px", color: "#64748b", marginBottom: "36px" }}>
          Gérez votre plan et vos préférences de facturation.
        </p>

        {/* Current Plan Card */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "28px 32px",
            marginBottom: "32px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "flex-start",
              flexWrap: "wrap",
              gap: "16px",
            }}
          >
            <div>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>
                Abonnement actuel
              </div>
              <div style={{ fontSize: "22px", fontWeight: "800", color: DARK_BLUE, marginBottom: "6px", textTransform: "capitalize" }}>
                Plan {user.plan}
              </div>
              <div style={{ fontSize: "14px", color: "#64748b" }}>
                Membre depuis le {joinDate}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "4px" }}>
                Prochain renouvellement
              </div>
              <div style={{ fontSize: "18px", fontWeight: "700", color: "#1e293b" }}>
                {new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("fr-FR", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </div>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#dcfce7",
                  color: "#16a34a",
                  fontSize: "12px",
                  fontWeight: "600",
                  padding: "3px 10px",
                  borderRadius: "20px",
                  marginTop: "6px",
                }}
              >
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#16a34a", display: "inline-block" }} />
                Actif
              </div>
            </div>
          </div>

          <div
            style={{
              marginTop: "24px",
              paddingTop: "24px",
              borderTop: "1px solid #f1f5f9",
              display: "flex",
              gap: "24px",
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>Nom</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{user.name}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>Email</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{user.email}</div>
            </div>
            <div>
              <div style={{ fontSize: "12px", color: "#94a3b8", marginBottom: "2px" }}>Entreprise</div>
              <div style={{ fontSize: "14px", fontWeight: "600", color: "#1e293b" }}>{user.company}</div>
            </div>
          </div>
        </div>

        {success && (
          <div
            style={{
              background: "#dcfce7",
              border: "1px solid #bbf7d0",
              color: "#15803d",
              padding: "14px 20px",
              borderRadius: "10px",
              fontSize: "14px",
              fontWeight: "600",
              marginBottom: "24px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <span style={{ fontSize: "18px" }}>✅</span>
            {success}
          </div>
        )}

        {/* Plans */}
        <h2
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: DARK_BLUE,
            marginBottom: "20px",
          }}
        >
          Changer d'offre
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
            marginBottom: "40px",
          }}
        >
          {plans.map((plan) => {
            const isCurrent = user.plan === plan.id;
            return (
              <div
                key={plan.id}
                style={{
                  background: "#ffffff",
                  borderRadius: "14px",
                  padding: "28px 24px",
                  border: isCurrent ? `2px solid ${ORANGE}` : "1px solid #e2e8f0",
                  position: "relative",
                  boxShadow: isCurrent
                    ? "0 4px 20px rgba(217,119,6,0.15)"
                    : "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                {plan.popular && !isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: DARK_BLUE,
                      color: "#ffffff",
                      padding: "3px 14px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Plus populaire
                  </div>
                )}
                {isCurrent && (
                  <div
                    style={{
                      position: "absolute",
                      top: "-12px",
                      left: "50%",
                      transform: "translateX(-50%)",
                      background: ORANGE,
                      color: "#ffffff",
                      padding: "3px 14px",
                      borderRadius: "20px",
                      fontSize: "11px",
                      fontWeight: "700",
                      whiteSpace: "nowrap",
                    }}
                  >
                    ✓ Plan actuel
                  </div>
                )}

                <div style={{ fontSize: "18px", fontWeight: "700", color: DARK_BLUE, marginBottom: "4px" }}>
                  {plan.name}
                </div>
                <div style={{ fontSize: "13px", color: "#64748b", marginBottom: "16px" }}>
                  {plan.desc}
                </div>
                <div style={{ marginBottom: "20px" }}>
                  <span style={{ fontSize: "36px", fontWeight: "800", color: DARK_BLUE }}>
                    {plan.price}€
                  </span>
                  <span style={{ fontSize: "13px", color: "#94a3b8" }}>/mois</span>
                </div>

                <ul style={{ listStyle: "none", marginBottom: "24px", display: "flex", flexDirection: "column", gap: "10px" }}>
                  {plan.features.map((feat) => (
                    <li
                      key={feat}
                      style={{ display: "flex", gap: "8px", fontSize: "13px", color: "#475569", alignItems: "flex-start" }}
                    >
                      <span style={{ color: ORANGE, flexShrink: 0 }}>✓</span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleChangePlan(plan.id)}
                  disabled={isCurrent || loading}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: "8px",
                    border: "none",
                    background: isCurrent ? "#f1f5f9" : loading ? "#94a3b8" : DARK_BLUE,
                    color: isCurrent ? "#94a3b8" : "#ffffff",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: isCurrent || loading ? "not-allowed" : "pointer",
                  }}
                >
                  {isCurrent ? "Plan actuel" : loading ? "Mise à jour..." : `Passer au plan ${plan.name}`}
                </button>
              </div>
            );
          })}
        </div>

        {/* Billing info */}
        <div
          style={{
            background: "#ffffff",
            borderRadius: "14px",
            padding: "24px 32px",
            border: "1px solid #e2e8f0",
          }}
        >
          <h3 style={{ fontSize: "16px", fontWeight: "700", color: DARK_BLUE, marginBottom: "12px" }}>
            Informations de facturation
          </h3>
          <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.6" }}>
            Cette application est en mode démonstration. Aucune carte bancaire n'est requise.
            Dans la version de production, vous pourriez gérer vos informations de paiement ici.
          </p>
          <div style={{
            marginTop: "16px",
            padding: "12px 16px",
            background: "#fffbeb",
            borderRadius: "8px",
            border: "1px solid #fde68a",
            fontSize: "13px",
            color: "#92400e",
          }}>
            💡 <strong>Mode démo :</strong> Les changements de plan sont simulés localement dans votre navigateur.
          </div>
        </div>
      </div>
    </div>
  );
}
