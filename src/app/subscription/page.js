'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const plans = [
  {
    name: 'Essentiel',
    price: 15,
    description: 'Parfait pour débuter',
    features: [
      '5 dossiers MPR/mois',
      'Simulation CEE basique',
      'Assistant IA (50 questions/mois)',
      'Tableau de bord',
      'Support par email',
    ],
    excluded: ['Dossiers ANAH', 'Génération de devis', 'Support prioritaire'],
    popular: false,
  },
  {
    name: 'Pro',
    price: 25,
    description: 'Le choix des professionnels',
    features: [
      '20 dossiers MPR/mois',
      'CEE avancé + simulation',
      'Dossiers ANAH inclus',
      'Assistant IA illimité',
      'Génération de devis',
      'Support prioritaire',
      'Rapports mensuels',
    ],
    excluded: ['Formation dédiée'],
    popular: true,
  },
  {
    name: 'Premium',
    price: 39,
    description: 'Pour les grandes structures',
    features: [
      'Dossiers illimités',
      'MPR + CEE + ANAH',
      'Assistant IA premium',
      'Génération de devis illimitée',
      'Support dédié 24/7',
      'Formation incluse',
      'API d\'intégration',
      'Rapports personnalisés',
    ],
    excluded: [],
    popular: false,
  },
]

const faqs = [
  { q: 'Puis-je changer de plan ?', r: 'Oui, vous pouvez upgrader ou downgrader à tout moment. La différence est calculée au prorata.' },
  { q: "Y a-t-il un engagement ?", r: 'Non, tous nos plans sont sans engagement. Vous pouvez annuler à tout moment.' },
  { q: "Comment fonctionne l'essai gratuit ?", r: "14 jours d'essai gratuit sur tous les plans, sans carte bancaire requise." },
]

export default function Subscription() {
  const [user, setUser] = useState(null)
  const [currentPlan, setCurrentPlan] = useState('Essentiel')
  const [success, setSuccess] = useState('')
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('renovexpert_user')
    if (storedUser) {
      const userData = JSON.parse(storedUser)
      setUser(userData)
      setCurrentPlan(userData.plan || 'Essentiel')
    }
  }, [])

  const handleSelectPlan = (planName) => {
    if (!user) {
      router.push('/register')
      return
    }
    const updatedUser = { ...user, plan: planName }
    localStorage.setItem('renovexpert_user', JSON.stringify(updatedUser))
    setUser(updatedUser)
    setCurrentPlan(planName)
    setSuccess(`Vous êtes maintenant abonné au plan ${planName} !`)
    setTimeout(() => setSuccess(''), 4000)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: '#1e3a5f',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      }}>
        <Link href="/" style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold' }}>
          Renov<span style={{ color: '#d97706' }}>Expert</span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          {user ? (
            <>
              <Link href="/dashboard" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Tableau de bord</Link>
              <button
                onClick={() => { localStorage.removeItem('renovexpert_user'); router.push('/') }}
                style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#cbd5e1', padding: '0.3rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <>
              <Link href="/login" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Connexion</Link>
              <Link href="/register" style={{ backgroundColor: '#d97706', color: 'white', padding: '0.4rem 1rem', borderRadius: '6px', fontSize: '0.9rem', fontWeight: '700' }}>
                S'inscrire
              </Link>
            </>
          )}
        </div>
      </nav>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' }}>
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{ fontSize: '2.5rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '1rem' }}>
            Choisissez votre abonnement
          </h1>
          <p style={{ color: '#64748b', fontSize: '1.1rem', maxWidth: '600px', margin: '0 auto' }}>
            Des tarifs transparents pour tous les artisans. Changez ou annulez à tout moment.
          </p>
          {user && (
            <div style={{
              display: 'inline-block',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '20px',
              padding: '0.4rem 1rem',
              marginTop: '1rem',
              fontSize: '0.9rem',
              color: '#1e3a5f',
            }}>
              Plan actuel : <strong>{currentPlan}</strong>
            </div>
          )}
        </div>

        {success && (
          <div style={{
            backgroundColor: '#f0fdf4',
            border: '1px solid #bbf7d0',
            borderRadius: '10px',
            padding: '1rem 1.5rem',
            color: '#16a34a',
            textAlign: 'center',
            marginBottom: '2rem',
            fontSize: '1rem',
            fontWeight: '600',
          }}>
            ✓ {success}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem',
          alignItems: 'center',
          marginBottom: '3rem',
        }}>
          {plans.map((plan) => {
            const isActive = currentPlan === plan.name
            return (
              <div key={plan.name} style={{
                backgroundColor: 'white',
                border: `2px solid ${plan.popular ? '#d97706' : isActive ? '#1e3a5f' : '#e2e8f0'}`,
                borderRadius: '16px',
                padding: '2rem',
                position: 'relative',
                boxShadow: plan.popular ? '0 8px 30px rgba(217,119,6,0.15)' : '0 2px 8px rgba(0,0,0,0.05)',
                transform: plan.popular ? 'scale(1.02)' : 'none',
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
                    ⭐ PLUS POPULAIRE
                  </div>
                )}
                {isActive && !plan.popular && (
                  <div style={{
                    position: 'absolute',
                    top: '-14px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    backgroundColor: '#1e3a5f',
                    color: 'white',
                    padding: '0.25rem 1rem',
                    borderRadius: '20px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    whiteSpace: 'nowrap',
                  }}>
                    ✓ PLAN ACTUEL
                  </div>
                )}

                <h2 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '0.3rem' }}>{plan.name}</h2>
                <p style={{ color: '#64748b', fontSize: '0.9rem', marginBottom: '1.5rem' }}>{plan.description}</p>

                <div style={{ marginBottom: '1.5rem' }}>
                  <span style={{ fontSize: '3rem', fontWeight: '800', color: plan.popular ? '#d97706' : '#1e3a5f' }}>
                    {plan.price}€
                  </span>
                  <span style={{ color: '#94a3b8', fontSize: '0.9rem' }}>/mois</span>
                </div>

                <ul style={{ listStyle: 'none', marginBottom: '1.5rem' }}>
                  {plan.features.map((f) => (
                    <li key={f} style={{ padding: '0.35rem 0', color: '#374151', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
                      <span style={{ color: '#22c55e', flexShrink: 0 }}>✓</span>
                      {f}
                    </li>
                  ))}
                  {plan.excluded.map((f) => (
                    <li key={f} style={{ padding: '0.35rem 0', color: '#cbd5e1', fontSize: '0.9rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem', textDecoration: 'line-through' }}>
                      <span style={{ flexShrink: 0 }}>✗</span>
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan.name)}
                  style={{
                    width: '100%',
                    backgroundColor: isActive ? '#e2e8f0' : (plan.popular ? '#d97706' : '#1e3a5f'),
                    color: isActive ? '#64748b' : 'white',
                    padding: '0.85rem',
                    borderRadius: '8px',
                    border: 'none',
                    fontWeight: '700',
                    fontSize: '0.95rem',
                    cursor: isActive ? 'default' : 'pointer',
                  }}
                >
                  {isActive ? '✓ Plan actuel' : `Choisir ${plan.name}`}
                </button>
              </div>
            )
          })}
        </div>

        {/* FAQ */}
        <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1.5rem', textAlign: 'center' }}>
            Questions fréquentes
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '1.5rem' }}>
            {faqs.map((faq) => (
              <div key={faq.q}>
                <p style={{ fontWeight: '700', color: '#1e3a5f', marginBottom: '0.4rem', fontSize: '0.95rem' }}>{faq.q}</p>
                <p style={{ color: '#64748b', fontSize: '0.875rem', lineHeight: '1.6' }}>{faq.r}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
