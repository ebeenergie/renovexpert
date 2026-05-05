"use client";

const DARK_BLUE = "#1e3a5f";
const ORANGE = "#d97706";
const LIGHT_BG = "#f8fafc";
const WHITE = "#ffffff";

const features = [
  {
    icon: "🏗️",
    title: "Gestion de chantiers",
    desc: "Suivez l'avancement de vos chantiers en temps réel. Planifiez, organisez et supervisez chaque étape de vos projets de rénovation.",
  },
  {
    icon: "💰",
    title: "Aides MPR & CEE",
    desc: "Accédez aux aides MaPrimeRénov' et aux Certificats d'Économies d'Énergie. Notre IA vous guide pour maximiser les subventions.",
  },
  {
    icon: "🏛️",
    title: "Dossiers ANAH",
    desc: "Constituez et suivez vos dossiers ANAH en toute simplicité. Formulaires pré-remplis et vérification automatique de conformité.",
  },
  {
    icon: "🤖",
    title: "Assistant IA intégré",
    desc: "Posez vos questions à notre assistant intelligent. Il connaît toutes les réglementations et vous aide à optimiser chaque dossier.",
  },
  {
    icon: "📊",
    title: "Rapports & Devis",
    desc: "Générez des devis professionnels et des rapports détaillés en quelques clics. Importez vos données, exportez en PDF.",
  },
  {
    icon: "📱",
    title: "Application mobile",
    desc: "Gérez vos chantiers depuis votre smartphone. Photos, signatures électroniques et mises à jour en temps réel sur le terrain.",
  },
];

const plans = [
  {
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
    cta: "Commencer gratuitement",
    highlighted: false,
  },
  {
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
    cta: "Essai 14 jours gratuit",
    highlighted: true,
  },
  {
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
    cta: "Contacter les ventes",
    highlighted: false,
  },
];

export default function HomePage() {
  return (
    <div style={{ minHeight: "100vh", background: LIGHT_BG }}>
      {/* Navbar */}
      <nav
        style={{
          background: DARK_BLUE,
          padding: "0 5%",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          height: "70px",
          position: "sticky",
          top: 0,
          zIndex: 100,
          boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
        }}
      >
        <div
          style={{
            color: WHITE,
            fontSize: "22px",
            fontWeight: "700",
            letterSpacing: "-0.5px",
          }}
        >
          Renov<span style={{ color: ORANGE }}>Expert</span>
        </div>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <a
            href="/login"
            style={{
              color: WHITE,
              padding: "8px 18px",
              fontSize: "14px",
              borderRadius: "6px",
              border: "1px solid rgba(255,255,255,0.3)",
              transition: "background 0.2s",
            }}
          >
            Connexion
          </a>
          <a
            href="/register"
            style={{
              background: ORANGE,
              color: WHITE,
              padding: "8px 18px",
              fontSize: "14px",
              borderRadius: "6px",
              fontWeight: "600",
            }}
          >
            Essai gratuit
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          background: `linear-gradient(135deg, ${DARK_BLUE} 0%, #2d5a8e 100%)`,
          color: WHITE,
          padding: "90px 5% 100px",
          textAlign: "center",
        }}
      >
        <div
          style={{
            display: "inline-block",
            background: "rgba(217,119,6,0.2)",
            color: ORANGE,
            padding: "6px 16px",
            borderRadius: "20px",
            fontSize: "13px",
            fontWeight: "600",
            marginBottom: "24px",
            border: "1px solid rgba(217,119,6,0.4)",
          }}
        >
          🚀 Nouveau : Assistant IA pour vos dossiers ANAH
        </div>
        <h1
          style={{
            fontSize: "clamp(32px, 5vw, 58px)",
            fontWeight: "800",
            lineHeight: "1.15",
            marginBottom: "24px",
            maxWidth: "800px",
            margin: "0 auto 24px",
          }}
        >
          Gérez vos chantiers et{" "}
          <span style={{ color: ORANGE }}>maximisez vos aides</span> avec
          l'intelligence artificielle
        </h1>
        <p
          style={{
            fontSize: "18px",
            color: "rgba(255,255,255,0.82)",
            maxWidth: "600px",
            margin: "0 auto 40px",
            lineHeight: "1.7",
          }}
        >
          RenovExpert est la plateforme SaaS conçue pour les artisans du
          bâtiment. Gérez MPR, CEE et ANAH sans prise de tête, avec l'aide de
          notre IA.
        </p>
        <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
          <a
            href="/register"
            style={{
              background: ORANGE,
              color: WHITE,
              padding: "14px 32px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "16px",
              display: "inline-block",
              boxShadow: "0 4px 15px rgba(217,119,6,0.4)",
            }}
          >
            Démarrer gratuitement →
          </a>
          <a
            href="#features"
            style={{
              background: "rgba(255,255,255,0.1)",
              color: WHITE,
              padding: "14px 32px",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "16px",
              display: "inline-block",
              border: "1px solid rgba(255,255,255,0.3)",
            }}
          >
            Découvrir les fonctionnalités
          </a>
        </div>
        <div
          style={{
            marginTop: "60px",
            display: "flex",
            gap: "40px",
            justifyContent: "center",
            flexWrap: "wrap",
          }}
        >
          {[
            { value: "2 500+", label: "Artisans actifs" },
            { value: "12 M€", label: "Aides obtenues" },
            { value: "98%", label: "Satisfaction client" },
          ].map((stat) => (
            <div key={stat.label} style={{ textAlign: "center" }}>
              <div
                style={{ fontSize: "32px", fontWeight: "800", color: ORANGE }}
              >
                {stat.value}
              </div>
              <div
                style={{ fontSize: "14px", color: "rgba(255,255,255,0.7)" }}
              >
                {stat.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        style={{ padding: "90px 5%", background: WHITE }}
      >
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 40px)",
              fontWeight: "800",
              color: DARK_BLUE,
              marginBottom: "16px",
            }}
          >
            Tout ce dont vous avez besoin
          </h2>
          <p
            style={{
              fontSize: "17px",
              color: "#64748b",
              maxWidth: "540px",
              margin: "0 auto",
            }}
          >
            Une suite complète d'outils pensés pour simplifier le quotidien des
            artisans du bâtiment.
          </p>
        </div>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
            gap: "28px",
            maxWidth: "1100px",
            margin: "0 auto",
          }}
        >
          {features.map((f) => (
            <div
              key={f.title}
              style={{
                background: LIGHT_BG,
                borderRadius: "14px",
                padding: "32px 28px",
                border: "1px solid #e2e8f0",
                transition: "transform 0.2s, box-shadow 0.2s",
              }}
            >
              <div style={{ fontSize: "36px", marginBottom: "16px" }}>
                {f.icon}
              </div>
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: DARK_BLUE,
                  marginBottom: "10px",
                }}
              >
                {f.title}
              </h3>
              <p style={{ fontSize: "14px", color: "#64748b", lineHeight: "1.7" }}>
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section
        id="pricing"
        style={{
          padding: "90px 5%",
          background: LIGHT_BG,
        }}
      >
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h2
            style={{
              fontSize: "clamp(26px, 4vw, 40px)",
              fontWeight: "800",
              color: DARK_BLUE,
              marginBottom: "16px",
            }}
          >
            Des tarifs transparents
          </h2>
          <p
            style={{
              fontSize: "17px",
              color: "#64748b",
              maxWidth: "500px",
              margin: "0 auto",
            }}
          >
            Sans engagement, sans surprise. Passez d'un plan à l'autre à tout
            moment.
          </p>
        </div>
        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            flexWrap: "wrap",
            maxWidth: "1050px",
            margin: "0 auto",
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan.name}
              style={{
                background: plan.highlighted ? DARK_BLUE : WHITE,
                color: plan.highlighted ? WHITE : "#1e293b",
                borderRadius: "16px",
                padding: "36px 32px",
                border: plan.highlighted
                  ? `2px solid ${ORANGE}`
                  : "1px solid #e2e8f0",
                width: "300px",
                flex: "0 0 300px",
                position: "relative",
                boxShadow: plan.highlighted
                  ? "0 8px 30px rgba(30,58,95,0.3)"
                  : "0 2px 8px rgba(0,0,0,0.05)",
              }}
            >
              {plan.highlighted && (
                <div
                  style={{
                    position: "absolute",
                    top: "-14px",
                    left: "50%",
                    transform: "translateX(-50%)",
                    background: ORANGE,
                    color: WHITE,
                    padding: "4px 16px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: "700",
                    whiteSpace: "nowrap",
                  }}
                >
                  ⭐ Plus populaire
                </div>
              )}
              <div
                style={{
                  fontSize: "20px",
                  fontWeight: "700",
                  marginBottom: "6px",
                  color: plan.highlighted ? WHITE : DARK_BLUE,
                }}
              >
                {plan.name}
              </div>
              <div
                style={{
                  fontSize: "13px",
                  color: plan.highlighted
                    ? "rgba(255,255,255,0.7)"
                    : "#64748b",
                  marginBottom: "20px",
                }}
              >
                {plan.desc}
              </div>
              <div style={{ marginBottom: "28px" }}>
                <span
                  style={{
                    fontSize: "48px",
                    fontWeight: "800",
                    color: plan.highlighted ? WHITE : DARK_BLUE,
                  }}
                >
                  {plan.price}€
                </span>
                <span
                  style={{
                    fontSize: "14px",
                    color: plan.highlighted
                      ? "rgba(255,255,255,0.6)"
                      : "#94a3b8",
                  }}
                >
                  /mois
                </span>
              </div>
              <ul
                style={{
                  listStyle: "none",
                  marginBottom: "28px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                {plan.features.map((feat) => (
                  <li
                    key={feat}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      fontSize: "14px",
                      color: plan.highlighted
                        ? "rgba(255,255,255,0.85)"
                        : "#475569",
                    }}
                  >
                    <span style={{ color: ORANGE, flexShrink: 0, marginTop: "1px" }}>✓</span>
                    {feat}
                  </li>
                ))}
              </ul>
              <a
                href="/register"
                style={{
                  display: "block",
                  textAlign: "center",
                  background: plan.highlighted ? ORANGE : DARK_BLUE,
                  color: WHITE,
                  padding: "13px",
                  borderRadius: "8px",
                  fontWeight: "700",
                  fontSize: "14px",
                }}
              >
                {plan.cta}
              </a>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer
        style={{
          background: DARK_BLUE,
          color: "rgba(255,255,255,0.7)",
          padding: "40px 5%",
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontSize: "20px",
            fontWeight: "700",
            color: WHITE,
            marginBottom: "12px",
          }}
        >
          Renov<span style={{ color: ORANGE }}>Expert</span>
        </div>
        <p style={{ fontSize: "14px", marginBottom: "20px" }}>
          La plateforme SaaS de référence pour les artisans du bâtiment en France.
        </p>
        <div
          style={{
            display: "flex",
            gap: "24px",
            justifyContent: "center",
            fontSize: "14px",
            flexWrap: "wrap",
          }}
        >
          <a href="#" style={{ color: "rgba(255,255,255,0.6)" }}>Mentions légales</a>
          <a href="#" style={{ color: "rgba(255,255,255,0.6)" }}>CGU</a>
          <a href="#" style={{ color: "rgba(255,255,255,0.6)" }}>Contact</a>
          <a href="/login" style={{ color: "rgba(255,255,255,0.6)" }}>Connexion</a>
        </div>
        <p style={{ fontSize: "12px", marginTop: "24px", color: "rgba(255,255,255,0.4)" }}>
          © {new Date().getFullYear()} RenovExpert. Tous droits réservés.
        </p>
      </footer>
    </div>
  );
}
