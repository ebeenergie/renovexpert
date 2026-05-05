import Link from 'next/link'
import Navbar from './components/Navbar'

const features = [
  {
    icon: '📋',
    title: "Dossiers MPR automatisés",
    desc: "Créez et gérez vos dossiers MaPrimeRénov' en quelques clics. Notre IA complète les formulaires automatiquement.",
  },
  {
    icon: '⚡',
    title: 'Gestion CEE simplifiée',
    desc: "Optimisez vos Certificats d'Économies d'Énergie. Calculez vos primes et soumettez vos dossiers sans erreur.",
  },
  {
    icon: '🏠',
    title: 'Suivi ANAH complet',
    desc: 'Accompagnez vos clients dans leurs demandes ANAH. Suivez chaque étape en temps réel.',
  },
  {
    icon: '🤖',
    title: 'Assistant IA 24/7',
    desc: 'Posez toutes vos questions sur les aides à la rénovation. Notre IA répond instantanément.',
  },
  {
    icon: '📊',
    title: 'Tableau de bord complet',
    desc: 'Visualisez tous vos dossiers en cours, les montants obtenus et les délais de traitement.',
  },
  {
    icon: '📄',
    title: 'Génération de devis',
    desc: "Créez des devis conformes aux exigences des dispositifs d'aides en quelques secondes.",
  },
]

const plans = [
  {
    name: 'Essentiel',
    price: '15',
    features: ['5 dossiers/mois', 'Assistant IA', 'MPR basique', 'Support email'],
    popular: false,
  },
  {
    name: 'Pro',
    price: '25',
    features: ['20 dossiers/mois', 'Assistant IA avancé', 'MPR + CEE', 'ANAH inclus', 'Support prioritaire'],
    popular: true,
  },
  {
    name: 'Premium',
    price: '39',
    features: ['Dossiers illimités', 'IA premium', 'MPR + CEE + ANAH', 'Génération devis', 'Support dédié', 'Formation incluse'],
    popular: false,
  },
]

export default function Home() {
  return (
    <div style={{ minHeight: '100vh' }}>
      <Navbar />

      {/* Hero */}
      <section style={{
        background: 'linear-gradient(135deg, #1e3a5f 0%, #2d5a8e 100%)',
        color: 'white',
        padding: '6rem 2rem',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{
            display: 'inline-block',
            backgroundColor: 'rgba(217,119,6,0.2)',
            border: '1px solid #d97706',
            color: '#fbbf24',
            padding: '0.3rem 1rem',
            borderRadius: '20px',
            fontSize: '0.85rem',
            marginBottom: '1.5rem',
          }}>
            🏆 N°1 des outils pour artisans RGE en France
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: '800', lineHeight: '1.2', marginBottom: '1.5rem' }}>
            Simplifiez vos dossiers<br />
            <span style={{ color: '#d97706' }}>MPR, CEE et ANAH</span>
          </h1>
          <p style={{ fontSize: '1.2rem', color: '#cbd5e1', marginBottom: '2.5rem', lineHeight: '1.7' }}>
            RenovExpert est la plateforme tout-en-un pour les artisans du bâtiment.<br />
            Gérez vos aides à la rénovation grâce à l'intelligence artificielle.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <Link href="/register" style={{
              backgroundColor: '#d97706',
              color: 'white',
              padding: '0.9rem 2.5rem',
              borderRadius: '8px',
              fontWeight: '700',
              fontSize: '1.1rem',
              display: 'inline-block',
            }}>
              Commencer gratuitement →
            </Link>
            <Link href="#pricing" style={{
              backgroundColor: 'transparent',
              color: 'white',
              padding: '0.9rem 2.5rem',
              borderRadius: '8px',
              fontWeight: '600',
              fontSize: '1.1rem',
              border: '2px solid rgba(255,255,255,0.4)',
              display: 'inline-block',
            }}>
              Voir les tarifs
            </Link>
          </div>
          <p style={{ marginTop: '1.5rem', color: '#94a3b8', fontSize: '0.9rem' }}>
            ✓ Sans engagement · ✓ 14 jours d'essai gratuit · ✓ Annulation à tout moment
          </p>
        </div>
      </section>

      {/* Stats */}
      <section style={{ backgroundColor: '#f8fafc', padding: '3rem 2rem', borderBottom: '1px solid #e2e8f0' }}>
        <div style={{
          maxWidth: '900px',
          margin: '0 auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: '2rem',
          textAlign: 'center',
        }}>
          {[
            { number: '2 500+', label: 'Artisans inscrits' },
            { number: '15 000+', label: 'Dossiers traités' },
            { number: '12 M€+', label: 'Aides obtenues' },
          ].map((stat, i) => (
            <div key={i}>
              <div style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e3a5f' }}>{stat.number}</div>
              <div style={{ color: '#64748b', marginTop: '0.3rem' }}>{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" style={{ padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>
            Tout ce dont vous avez besoin
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem', fontSize: '1.1rem' }}>
            Une plateforme complète pour gérer toutes vos demandes d'aides à la rénovation
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '1.5rem',
          }}>
            {features.map((f, i) => (
              <div key={i} style={{
                backgroundColor: 'white',
                border: '1px solid #e2e8f0',
                borderRadius: '12px',
                padding: '1.8rem',
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
              }}>
                <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>{f.icon}</div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '0.5rem' }}>{f.title}</h3>
                <p style={{ color: '#64748b', lineHeight: '1.6', fontSize: '0.95rem' }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" style={{ backgroundColor: '#f8fafc', padding: '5rem 2rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2.2rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>
            Tarifs simples et transparents
          </h2>
          <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '3rem', fontSize: '1.1rem' }}>
            Choisissez le plan adapté à votre activité
          </p>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: '1.5rem',
            alignItems: 'center',
          }}>
            {plans.map((plan, i) => (
              <div key={i} style={{
                backgroundColor: plan.popular ? '#1e3a5f' : 'white',
                border: plan.popular ? 'none' : '1px solid #e2e8f0',
                borderRadius: '16px',
                padding: '2rem',
                textAlign: 'center',
                boxShadow: plan.popular ? '0 8px 30px rgba(30,58,95,0.3)' : '0 2px 8px rgba(0,0,0,0.05)',
                position: 'relative',
                transform: plan.popular ? 'scale(1.03)' : 'none',
              }}>
                {plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#d97706',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                  }}>
                    ⭐ POPULAIRE
                  </div>
                )}
                <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: plan.popular ? 'white' : '#1e3a5f', marginBottom: '0.5rem' }}>
                  {plan.name}
                </h3>
                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: '800', color: plan.popular ? '#fbbf24' : '#d97706' }}>
                    {plan.price}€
                  </span>
                  <span style={{ color: plan.popular ? '#cbd5e1' : '#94a3b8', fontSize: '0.9rem' }}>/mois</span>
                </div>
                <ul style={{ listStyle: 'none', marginBottom: '2rem', textAlign: 'left' }}>
                  {plan.features.map((f, j) => (
                    <li key={j} style={{
                      padding: '0.4rem 0',
                      color: plan.popular ? '#e2e8f0' : '#475569',
                      fontSize: '0.95rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                    }}>
                      <span style={{ color: '#d97706' }}>✓</span> {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" style={{
                  display: 'block',
                  backgroundColor: plan.popular ? '#d97706' : '#1e3a5f',
                  color: 'white',
                  padding: '0.8rem',
                  borderRadius: '8px',
                  fontWeight: '700',
                  fontSize: '0.95rem',
                  textAlign: 'center',
                }}>
                  Choisir {plan.name}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ backgroundColor: '#1e3a5f', color: '#cbd5e1', padding: '3rem 2rem', textAlign: 'center' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ fontSize: '1.5rem', fontWeight: '800', color: 'white', marginBottom: '1rem' }}>
            Renov<span style={{ color: '#d97706' }}>Expert</span>
          </div>
          <p style={{ fontSize: '0.9rem', marginBottom: '1.5rem' }}>
            La plateforme de référence pour les artisans du bâtiment en France
          </p>
          <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            <Link href="#features" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Fonctionnalités</Link>
            <Link href="#pricing" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Tarifs</Link>
            <Link href="/login" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Connexion</Link>
            <Link href="/register" style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Inscription</Link>
          </div>
          <p style={{ fontSize: '0.85rem', color: '#64748b' }}>© 2025 RenovExpert. Tous droits réservés.</p>
        </div>
      </footer>
    </div>
  )
}
