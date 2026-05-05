'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const quickActions = [
  { icon: '📋', label: 'Dossier MPR', prompt: "Je souhaite créer un nouveau dossier MaPrimeRénov' pour mon client. Quelles sont les étapes et les documents nécessaires ?" },
  { icon: '⚡', label: 'Simulation CEE', prompt: "Je voudrais faire une simulation de Certificats d'Économies d'Énergie pour des travaux d'isolation. Pouvez-vous m'aider ?" },
  { icon: '🏛', label: 'Dossier ANAH', prompt: "Comment constituer un dossier ANAH pour mon client ? Quels sont les critères d'éligibilité ?" },
  { icon: '💰', label: 'Calculer les aides', prompt: "Pouvez-vous m'aider à calculer toutes les aides disponibles pour des travaux de rénovation énergétique ?" },
  { icon: '📄', label: 'Conformité devis', prompt: "Quels éléments dois-je inclure dans mon devis pour qu'il soit conforme aux exigences MPR et CEE ?" },
  { icon: '✅', label: "Vérifier éligibilité", prompt: "Comment vérifier si mon client est éligible aux aides MPR, CEE et ANAH ? Quels sont les critères principaux ?" },
]

function loadStats() {
  if (typeof window === 'undefined') return { activeDossiers: 0, missingDocs: 0, sentDevis: 0 }
  try {
    const dossiers = JSON.parse(localStorage.getItem('renovexpert_dossiers') || '[]')
    const devis = JSON.parse(localStorage.getItem('renovexpert_devis') || '[]')
    const activeDossiers = dossiers.filter(d => d.status !== 'Complété').length
    const missingDocs = dossiers.reduce((sum, d) => {
      return sum + (d.checklist || []).filter(c => c.status === 'manquant' || (!c.status && !c.checked)).length
    }, 0)
    const sentDevis = devis.filter(d => d.status === 'envoye' || d.status === 'accepte').length
    return { activeDossiers, missingDocs, sentDevis }
  } catch { return { activeDossiers: 0, missingDocs: 0, sentDevis: 0 } }
}

export default function Dashboard() {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: "Bonjour ! Je suis votre assistant RenovExpert 👋\n\nJe suis spécialisé dans les aides à la rénovation énergétique : MaPrimeRénov' (MPR), Certificats d'Économies d'Énergie (CEE) et les aides ANAH.\n\nVous pouvez aussi m'envoyer un document 📎 et je vérifierai s'il est conforme pour votre dossier.\n\nComment puis-je vous aider ?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({ activeDossiers: 0, missingDocs: 0, sentDevis: 0 })
  const [attachedFile, setAttachedFile] = useState(null)
  const messagesEndRef = useRef(null)
  const fileInputRef = useRef(null)
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem('renovexpert_user')
    if (!storedUser) { router.push('/login'); return }
    setUser(JSON.parse(storedUser))
    setStats(loadStats())
  }, [router])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const sendMessage = async (text, file = null) => {
    if ((!text.trim() && !file) || loading) return
    const userText = text.trim() || (file ? `Analyse ce document : ${file.name}` : '')

    let userContent
    if (file) {
      const contentBlocks = []
      if (file.mimeType.startsWith('image/')) {
        contentBlocks.push({ type: 'image', source: { type: 'base64', media_type: file.mimeType, data: file.data.split(',')[1] } })
      } else if (file.mimeType === 'application/pdf') {
        contentBlocks.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: file.data.split(',')[1] } })
      }
      contentBlocks.push({ type: 'text', text: userText + '\n\nVérifie si ce document est conforme pour un dossier MPR, CEE ou ANAH. Donne une réponse claire avec ✅ CONFORME ou ❌ NON CONFORME et explique ce qui va ou ce qui manque.' })
      userContent = contentBlocks
    } else {
      userContent = userText
    }

    const userMessage = { role: 'user', content: userContent, displayText: userText, hasFile: !!file, fileName: file?.name }
    const updatedMessages = [...messages, userMessage]
    setMessages(updatedMessages)
    setInput('')
    setAttachedFile(null)
    setLoading(true)

    try {
      const apiMessages = updatedMessages
        .filter(m => m.role === 'user' || m.role === 'assistant')
        .map(m => ({ role: m.role, content: m.content }))

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: apiMessages }),
      })
      const data = await res.json()
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: data.error ? `Désolé, une erreur s'est produite : ${data.error}` : data.content,
      }])
    } catch {
      setMessages(prev => [...prev, { role: 'assistant', content: "Désolé, une erreur de connexion s'est produite. Veuillez réessayer." }])
    } finally {
      setLoading(false)
      setStats(loadStats())
    }
  }

  const handleSubmit = (e) => { e.preventDefault(); sendMessage(input, attachedFile) }

  const handleFileAttach = (e) => {
    const file = e.target.files[0]
    if (!file) return
    if (file.size > 4 * 1024 * 1024) { alert('Fichier trop volumineux (max 4 Mo)'); return }
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowed.includes(file.type)) { alert('Format non supporté. Utilisez JPG, PNG, WEBP ou PDF.'); return }
    const reader = new FileReader()
    reader.onload = () => setAttachedFile({ name: file.name, mimeType: file.type, data: reader.result, preview: file.type.startsWith('image/') ? reader.result : null })
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  if (!user) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Chargement...</p>
    </div>
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', display: 'flex', flexDirection: 'column' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: '#1e3a5f', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0, position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold' }}>
          Renov<span style={{ color: '#d97706' }}>Expert</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <Link href="/subscription" style={{ border: '1px solid #d97706', color: '#d97706', padding: '0.3rem 0.7rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
            Plan {user.plan || 'Essentiel'}
          </Link>
          <button onClick={() => { localStorage.removeItem('renovexpert_user'); router.push('/') }}
            style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#cbd5e1', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>

        {/* Welcome banner */}
        <div style={{ backgroundColor: '#1e3a5f', borderRadius: '16px', padding: '1.5rem 2rem', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '800', marginBottom: '0.3rem' }}>Bonjour, {user.name} 👋</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>{user.company} · Plan {user.plan || 'Essentiel'}</p>
          </div>
          <div style={{ display: 'flex', gap: '0.8rem', flexWrap: 'wrap' }}>
            <Link href="/dossiers" style={{ backgroundColor: '#d97706', color: 'white', padding: '0.7rem 1.3rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem' }}>📁 Nouveau dossier</Link>
            <Link href="/devis" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', padding: '0.7rem 1.3rem', borderRadius: '10px', fontWeight: '600', fontSize: '0.9rem', border: '1px solid rgba(255,255,255,0.2)' }}>📄 Nouveau devis</Link>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          {[
            { icon: '📁', label: 'Dossiers actifs', value: stats.activeDossiers, color: '#1d4ed8', bg: '#dbeafe', href: '/dossiers' },
            { icon: '⚠️', label: 'Docs manquants', value: stats.missingDocs, color: '#d97706', bg: '#fef3c7', href: '/dossiers' },
            { icon: '📄', label: 'Devis envoyés', value: stats.sentDevis, color: '#15803d', bg: '#dcfce7', href: '/devis' },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '50px', height: '50px', backgroundColor: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '2rem', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.8rem', color: '#64748b', marginTop: '0.2rem' }}>{stat.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Chat area */}
        <div style={{ display: 'flex', gap: '1.2rem', flex: 1 }}>
          {/* Quick actions */}
          <div style={{ width: '200px', flexShrink: 0 }}>
            <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h3 style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.8rem' }}>Questions rapides</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                {quickActions.map((action, i) => (
                  <button key={i} onClick={() => sendMessage(action.prompt)} disabled={loading}
                    style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 0.7rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', cursor: loading ? 'not-allowed' : 'pointer', fontSize: '0.8rem', color: '#374151', textAlign: 'left', width: '100%', opacity: loading ? 0.6 : 1 }}>
                    <span style={{ fontSize: '0.95rem', flexShrink: 0 }}>{action.icon}</span>
                    <span>{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Chat */}
          <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '14px', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', overflow: 'hidden', minHeight: '480px' }}>
            <div style={{ padding: '1rem 1.5rem', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.8rem', backgroundColor: '#fafafa' }}>
              <div style={{ width: '40px', height: '40px', backgroundColor: '#1e3a5f', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>🤖</div>
              <div>
                <div style={{ fontWeight: '700', color: '#1e3a5f', fontSize: '0.92rem' }}>Assistant RenovExpert</div>
                <div style={{ fontSize: '0.76rem', color: '#22c55e', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ width: '6px', height: '6px', backgroundColor: '#22c55e', borderRadius: '50%', display: 'inline-block' }}></span>
                  En ligne · MPR · CEE · ANAH
                </div>
              </div>
              <div style={{ marginLeft: 'auto', fontSize: '0.75rem', color: '#64748b', backgroundColor: '#eff6ff', padding: '0.25rem 0.6rem', borderRadius: '6px', border: '1px solid #bfdbfe' }}>📎 Envoyez un doc à valider</div>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {messages.map((msg, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div style={{ maxWidth: '78%', padding: '0.85rem 1.1rem', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px', backgroundColor: msg.role === 'user' ? '#1e3a5f' : '#f1f5f9', color: msg.role === 'user' ? 'white' : '#1e293b', fontSize: '0.92rem', lineHeight: '1.65', whiteSpace: 'pre-wrap' }}>
                    {msg.hasFile && (
                      <div style={{ backgroundColor: 'rgba(255,255,255,0.15)', borderRadius: '6px', padding: '0.3rem 0.6rem', marginBottom: '0.5rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        📎 {msg.fileName}
                      </div>
                    )}
                    {msg.displayText || (typeof msg.content === 'string' ? msg.content : '')}
                  </div>
                </div>
              ))}
              {loading && (
                <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                  <div style={{ padding: '0.85rem 1.2rem', borderRadius: '16px 16px 16px 4px', backgroundColor: '#f1f5f9', color: '#64748b', fontSize: '0.92rem', display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <span style={{ fontStyle: 'italic' }}>Analyse en cours</span>
                    <span>·</span><span>·</span><span>·</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {attachedFile && (
              <div style={{ padding: '0.6rem 1.5rem', borderTop: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '0.8rem', backgroundColor: '#fffbeb' }}>
                {attachedFile.preview
                  ? <img src={attachedFile.preview} alt="" style={{ width: '38px', height: '38px', objectFit: 'cover', borderRadius: '6px' }} />
                  : <div style={{ width: '38px', height: '38px', backgroundColor: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem' }}>📄</div>
                }
                <span style={{ fontSize: '0.85rem', color: '#374151', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{attachedFile.name}</span>
                <button onClick={() => setAttachedFile(null)} style={{ backgroundColor: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.1rem' }}>×</button>
              </div>
            )}

            <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid #e2e8f0' }}>
              <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.6rem', alignItems: 'center' }}>
                <button type="button" onClick={() => fileInputRef.current?.click()}
                  title="Joindre un document"
                  style={{ backgroundColor: '#f1f5f9', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', cursor: 'pointer', fontSize: '1.1rem', flexShrink: 0, color: attachedFile ? '#d97706' : '#64748b' }}>
                  📎
                </button>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={handleFileAttach} style={{ display: 'none' }} />
                <input value={input} onChange={e => setInput(e.target.value)}
                  placeholder={attachedFile ? "Ajouter un message..." : "Posez votre question sur MPR, CEE, ANAH..."}
                  disabled={loading}
                  style={{ flex: 1, padding: '0.78rem 1rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.95rem', outline: 'none' }} />
                <button type="submit" disabled={loading || (!input.trim() && !attachedFile)}
                  style={{ backgroundColor: loading || (!input.trim() && !attachedFile) ? '#94a3b8' : '#d97706', color: 'white', border: 'none', padding: '0.78rem 1.2rem', borderRadius: '10px', cursor: loading || (!input.trim() && !attachedFile) ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.9rem', flexShrink: 0 }}>
                  Envoyer →
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  )
}
