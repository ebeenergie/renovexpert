'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const quickActions = [
  { icon: '📋', label: 'Nouveau dossier MPR', prompt: "Je souhaite créer un nouveau dossier MaPrimeRénov' pour mon client. Quelles sont les étapes et les documents nécessaires ?" },
  { icon: '⚡', label: 'Simulation CEE', prompt: "Je voudrais faire une simulation de Certificats d'Économies d'Énergie pour des travaux d'isolation. Pouvez-vous m'aider ?" },
  { icon: '🏠', label: 'Dossier ANAH', prompt: 'Comment constituer un dossier ANAH pour mon client ? Quels sont les critères d\'éligibilité ?' },
  { icon: '💰', label: 'Calculer les aides', prompt: 'Pouvez-vous m\'aider à calculer toutes les aides disponibles pour des travaux de rénovation énergétique d\'une maison individuelle ?' },
  { icon: '📄', label: 'Générer un devis', prompt: 'Quels éléments dois-je inclure dans mon devis pour qu\'il soit conforme aux exigences MPR et CEE ?' },
  { icon: '✅', label: "Vérifier l'éligibilité", prompt: 'Comment vérifier si mon client est éligible aux aides MPR, CEE et ANAH ? Quels sont les critères principaux ?' },
]

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis votre assistant RenovExpert, spécialisé dans les aides à la rénovation énergétique. Je peux vous aider avec vos dossiers MaPrimeRénov' (MPR), Certificats d'Économies d'Énergie (CEE) et les aides ANAH.\n\nComment puis-je vous aider aujourd'hui ?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const messagesEndRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('renovexpert_user')
    if (!storedUser) {
      router.push('/login')
      return
    }
    setUser(JSON.parse(storedUser))
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text) => {
    if (!text.trim() || loading) return

    const userMessage = { role: 'user', content: text }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setLoading(true)

    try {
      const apiMessages = updatedMessages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .map((m) => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })

      const data = await res.json()

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.error
            ? `Désolé, une erreur s'est produite : ${data.error}`
            : data.content,
        },
      ])
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: "Désolé, une erreur de connexion s'est produite. Veuillez réessayer." },
      ])
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    sendMessage(input)
  }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Chargement...</p>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{
        backgroundColor: '#1e3a5f',
        padding: '0 2rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        height: '64px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        flexShrink: 0,
      }}>
        <Link href="/" style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold' }}>
          Renov<span style={{ color: '#d97706' }}>Expert</span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>
            👤 {user.name} · {user.company}
          </span>
          <Link href="/subscription" style={{
            border: '1px solid #d97706',
            color: '#d97706',
            padding: '0.3rem 0.8rem',
            borderRadius: '6px',
            fontSize: '0.8rem',
            fontWeight: '600',
          }}>
            Plan {user.plan || 'Essentiel'}
          </Link>
          <button
            onClick={() => { localStorage.removeItem('renovexpert_user'); router.push('/') }}
            style={{
              backgroundColor: 'transparent',
              border: '1px solid rgba(255,255,255,0.25)',
              color: '#cbd5e1',
              padding: '0.3rem 0.8rem',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '0.85rem',
            }}
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Main content */}
      <div style={{
        flex: 1,
        display: 'flex',
        maxWidth: '1200px',
        margin: '0 auto',
        width: '100%',
        padding: '1.5rem',
        gap: '1.5rem',
      }}>

        {/* Sidebar */}
        <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            backgroundColor: 'white',
            borderRadius: '12px',
            padding: '1.2rem',
            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          }}>
            <h3 style={{
              fontSize: '0.75rem',
              fontWeight: '700',
              color: '#94a3b8',
              textTransform: 'uppercase',
              letterSpacing: '0.07em',
              marginBottom: '0.8rem',
            }}>
              Actions rapides
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              {quickActions.map((action, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(action.prompt)}
                  disabled={loading}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.6rem',
                    padding: '0.6rem 0.8rem',
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    borderRadius: '8px',
                    cursor: loading ? 'not-allowed' : 'pointer',
                    fontSize: '0.85rem',
                    color: '#374151',
                    textAlign: 'left',
                    width: '100%',
                    opacity: loading ? 0.6 : 1,
                  }}
                >
                  <span style={{ fontSize: '1.1rem' }}>{action.icon}</span>
                  <span>{action.label}</span>
                </button>
              ))}
            </div>
          </div>

          <Link href="/dossiers" style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            padding: '0.75rem 1rem',
            backgroundColor: '#1e3a5f',
            border: 'none',
            borderRadius: '10px',
            cursor: 'pointer',
            fontSize: '0.9rem',
            color: 'white',
            fontWeight: '700',
            textDecoration: 'none',
          }}>
            <span style={{ fontSize: '1.2rem' }}>📁</span>
            <span>Mes Dossiers</span>
            <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#d97706' }}>→</span>
          </Link>

          <div style={{ backgroundColor: '#1e3a5f', borderRadius: '12px', padding: '1.2rem', color: 'white' }}>
            <div style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.3rem', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Plan actuel
            </div>
            <div style={{ fontSize: '1.2rem', fontWeight: '700', color: '#fbbf24', marginBottom: '1rem' }}>
              {user.plan || 'Essentiel'}
            </div>
            <Link href="/subscription" style={{
              display: 'block',
              backgroundColor: '#d97706',
              color: 'white',
              padding: '0.5rem',
              borderRadius: '6px',
              textAlign: 'center',
              fontSize: '0.85rem',
              fontWeight: '600',
            }}>
              Upgrader →
            </Link>
          </div>
        </div>

        {/* Chat */}
        <div style={{
          flex: 1,
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: '600px',
        }}>
          {/* Chat header */}
          <div style={{
            padding: '1rem 1.5rem',
            borderBottom: '1px solid #e2e8f0',
            display: 'flex',
            alignItems: 'center',
            gap: '0.8rem',
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              backgroundColor: '#1e3a5f',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.3rem',
              flexShrink: 0,
            }}>
              🤖
            </div>
            <div>
              <div style={{ fontWeight: '700', color: '#1e3a5f', fontSize: '0.95rem' }}>Assistant RenovExpert</div>
              <div style={{ fontSize: '0.8rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <span style={{ width: '7px', height: '7px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
                En ligne · Expert MPR, CEE, ANAH
              </div>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            padding: '1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem',
          }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{
                  maxWidth: '75%',
                  padding: '0.8rem 1.1rem',
                  borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  backgroundColor: msg.role === 'user' ? '#1e3a5f' : '#f1f5f9',
                  color: msg.role === 'user' ? 'white' : '#1e293b',
                  fontSize: '0.9rem',
                  lineHeight: '1.65',
                  whiteSpace: 'pre-wrap',
                }}>
                  {msg.content}
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                <div style={{
                  padding: '0.8rem 1.2rem',
                  borderRadius: '16px 16px 16px 4px',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  fontSize: '0.9rem',
                  display: 'flex',
                  gap: '4px',
                  alignItems: 'center',
                }}>
                  <span style={{ fontStyle: 'italic' }}>Analyse en cours</span>
                  <span>·</span>
                  <span>·</span>
                  <span>·</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.8rem' }}>
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Posez votre question sur MPR, CEE, ANAH..."
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  border: '1px solid #d1d5db',
                  fontSize: '0.95rem',
                  outline: 'none',
                  backgroundColor: 'white',
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                style={{
                  backgroundColor: loading || !input.trim() ? '#94a3b8' : '#d97706',
                  color: 'white',
                  border: 'none',
                  padding: '0.75rem 1.3rem',
                  borderRadius: '8px',
                  cursor: loading || !input.trim() ? 'not-allowed' : 'pointer',
                  fontWeight: '700',
                  fontSize: '0.9rem',
                  flexShrink: 0,
                }}
              >
                Envoyer →
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
