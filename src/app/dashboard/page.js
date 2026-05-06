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

function facHt(f) {
  const ht = parseFloat(f.amount) || 0
  const gd = f.globalDiscount && f.globalDiscount.value
    ? (f.globalDiscount.type === 'percent' ? ht * (parseFloat(f.globalDiscount.value) || 0) / 100 : (parseFloat(f.globalDiscount.value) || 0))
    : 0
  return Math.max(0, ht - gd)
}
function facTtc(f) {
  return facHt(f) * (1 + (parseFloat(f.tva) || 10) / 100)
}
function devisTtc(d) {
  const items = d.items || []
  const sub = items.reduce((s, it) => {
    const gross = (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0)
    let net = gross
    if (it.discount && it.discount.value) {
      const v = parseFloat(it.discount.value) || 0
      const da = it.discount.type === 'percent' ? gross * v / 100 : v
      net = Math.max(0, gross - da)
    }
    return s + net
  }, 0) + (parseFloat(d.laborCost) || 0)
  const gd = d.globalDiscount && d.globalDiscount.value
    ? (d.globalDiscount.type === 'percent' ? sub * (parseFloat(d.globalDiscount.value) || 0) / 100 : (parseFloat(d.globalDiscount.value) || 0))
    : 0
  const subAfter = Math.max(0, sub - gd)
  return subAfter * (1 + (parseFloat(d.taxRate) || 10) / 100)
}

function loadStats() {
  const empty = {
    activeDossiers: 0, missingDocs: 0, activeClients: 0, pendingCA: 0, nextEvent: null,
    caYearPaid: 0, caMonthPaid: 0, totalDevis: 0, acceptedDevis: 0, acceptanceRate: 0,
    invoicesPaid: 0, invoicesPending: 0, avgTicket: 0, aidesTotal: 0, nbDevisWithAides: 0,
    rgeExpiryDays: null,
  }
  if (typeof window === 'undefined') return empty
  try {
    const user = JSON.parse(localStorage.getItem('renovexpert_user') || '{}')
    const dossiers = JSON.parse(localStorage.getItem('renovexpert_dossiers') || '[]')
    const clients = JSON.parse(localStorage.getItem('renovexpert_clients') || '[]')
    const factures = JSON.parse(localStorage.getItem('renovexpert_factures') || '[]')
    const devisList = JSON.parse(localStorage.getItem('renovexpert_devis') || '[]')
    const agenda = JSON.parse(localStorage.getItem('renovexpert_agenda') || '[]')
    const today = new Date()
    const todayStr = today.toISOString().split('T')[0]
    const yearStr = String(today.getFullYear())
    const monthStr = todayStr.slice(0, 7)

    const activeDossiers = dossiers.filter(d => d.status !== 'Complété').length
    const missingDocs = dossiers.reduce((sum, d) =>
      sum + (d.checklist || []).filter(c => c.status === 'manquant' || (!c.status && !c.checked)).length, 0)
    const activeClients = clients.filter(c => c.status === 'actif').length

    const pendingCA = factures
      .filter(f => f.status === 'envoyee' || f.status === 'en_retard')
      .reduce((s, f) => s + facTtc(f), 0)

    const paidFactures = factures.filter(f => f.status === 'payee')
    const caYearPaid = paidFactures
      .filter(f => (f.datePaiement || f.dateEmission || '').startsWith(yearStr))
      .reduce((s, f) => s + facTtc(f), 0)
    const caMonthPaid = paidFactures
      .filter(f => (f.datePaiement || f.dateEmission || '').startsWith(monthStr))
      .reduce((s, f) => s + facTtc(f), 0)

    const totalDevis = devisList.length
    const acceptedDevis = devisList.filter(d => d.status === 'accepte' || d.locked).length
    const acceptanceRate = totalDevis > 0 ? Math.round((acceptedDevis / totalDevis) * 100) : 0

    const invoicesPaid = paidFactures.length
    const invoicesPending = factures.filter(f => f.status === 'envoyee' || f.status === 'en_retard').length
    const avgTicket = paidFactures.length > 0
      ? paidFactures.reduce((s, f) => s + facTtc(f), 0) / paidFactures.length
      : 0

    const devisWithAides = devisList.filter(d => (d.aides || []).some(a => parseFloat(a.amount) > 0))
    const aidesTotal = devisList.reduce((s, d) =>
      s + (d.aides || []).reduce((ss, a) => ss + (parseFloat(a.amount) || 0), 0), 0)
    const nbDevisWithAides = devisWithAides.length

    let rgeExpiryDays = null
    if (user.rgeExpiry) {
      const exp = new Date(user.rgeExpiry)
      if (!isNaN(exp.getTime())) {
        rgeExpiryDays = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      }
    }

    const nextEvent = agenda
      .filter(e => e.date >= todayStr)
      .sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure))[0] || null

    return {
      activeDossiers, missingDocs, activeClients, pendingCA, nextEvent,
      caYearPaid, caMonthPaid, totalDevis, acceptedDevis, acceptanceRate,
      invoicesPaid, invoicesPending, avgTicket, aidesTotal, nbDevisWithAides,
      rgeExpiryDays,
    }
  } catch { return empty }
}

const fmtEur = (n) => Math.round(n).toLocaleString('fr-FR') + ' €'

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
  const [stats, setStats] = useState({
    activeDossiers: 0, missingDocs: 0, activeClients: 0, pendingCA: 0, nextEvent: null,
    caYearPaid: 0, caMonthPaid: 0, totalDevis: 0, acceptedDevis: 0, acceptanceRate: 0,
    invoicesPaid: 0, invoicesPending: 0, avgTicket: 0, aidesTotal: 0, nbDevisWithAides: 0,
    rgeExpiryDays: null,
  })
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
          <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
            <Link href="/dossiers" style={{ backgroundColor: '#d97706', color: 'white', padding: '0.65rem 1.1rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.85rem', textDecoration: 'none' }}>📁 Dossier</Link>
            <Link href="/devis" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', padding: '0.65rem 1.1rem', borderRadius: '10px', fontWeight: '600', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>📄 Devis</Link>
            <Link href="/clients" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', padding: '0.65rem 1.1rem', borderRadius: '10px', fontWeight: '600', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>👥 Clients</Link>
            <Link href="/factures" style={{ backgroundColor: 'rgba(255,255,255,0.12)', color: 'white', padding: '0.65rem 1.1rem', borderRadius: '10px', fontWeight: '600', fontSize: '0.85rem', border: '1px solid rgba(255,255,255,0.2)', textDecoration: 'none' }}>💰 Factures</Link>
          </div>
        </div>

        {/* RGE expiry warning */}
        {stats.rgeExpiryDays !== null && stats.rgeExpiryDays <= 60 && (
          <Link href="/settings" style={{ textDecoration: 'none' }}>
            <div style={{ backgroundColor: stats.rgeExpiryDays < 0 ? '#fee2e2' : '#fef3c7', border: `1px solid ${stats.rgeExpiryDays < 0 ? '#fca5a5' : '#fde68a'}`, borderRadius: '12px', padding: '0.85rem 1.2rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span style={{ fontSize: '1.4rem' }}>{stats.rgeExpiryDays < 0 ? '🚨' : '⚠️'}</span>
              <div style={{ flex: 1 }}>
                <p style={{ fontWeight: '700', color: stats.rgeExpiryDays < 0 ? '#b91c1c' : '#92400e', fontSize: '0.92rem' }}>
                  {stats.rgeExpiryDays < 0 ? 'Certification RGE expirée' : `Certification RGE expire dans ${stats.rgeExpiryDays} jour${stats.rgeExpiryDays > 1 ? 's' : ''}`}
                </p>
                <p style={{ fontSize: '0.78rem', color: stats.rgeExpiryDays < 0 ? '#991b1b' : '#a16207' }}>
                  {stats.rgeExpiryDays < 0 ? 'Sans RGE valide, aucune aide MPR/CEE ne sera accordée à vos clients.' : 'Pensez à renouveler avant l\'expiration pour ne pas interrompre l\'accès aux aides.'}
                </p>
              </div>
              <span style={{ color: stats.rgeExpiryDays < 0 ? '#b91c1c' : '#92400e', fontSize: '1.2rem' }}>›</span>
            </div>
          </Link>
        )}

        {/* Aperçu activité */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '0.95rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            📊 Aperçu de votre activité
          </h2>

          {/* Top row — CA highlights */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.8rem', marginBottom: '1rem' }}>
            <Link href="/factures" style={{ textDecoration: 'none' }}>
              <div style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)', borderRadius: '14px', padding: '1.1rem 1.2rem', color: 'white', minHeight: '92px' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#bbf7d0', marginBottom: '0.3rem' }}>CA encaissé {new Date().getFullYear()}</p>
                <p style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: 1 }}>{fmtEur(stats.caYearPaid)}</p>
                <p style={{ fontSize: '0.75rem', color: '#bbf7d0', marginTop: '0.4rem' }}>{stats.invoicesPaid} facture{stats.invoicesPaid > 1 ? 's' : ''} payée{stats.invoicesPaid > 1 ? 's' : ''}</p>
              </div>
            </Link>
            <Link href="/factures" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#fef3c7', borderRadius: '14px', padding: '1.1rem 1.2rem', minHeight: '92px', border: '1px solid #fde68a' }}>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#92400e', marginBottom: '0.3rem' }}>En attente</p>
                <p style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: 1, color: '#92400e' }}>{fmtEur(stats.pendingCA)}</p>
                <p style={{ fontSize: '0.75rem', color: '#a16207', marginTop: '0.4rem' }}>{stats.invoicesPending} facture{stats.invoicesPending > 1 ? 's' : ''} non payée{stats.invoicesPending > 1 ? 's' : ''}</p>
              </div>
            </Link>
            <div style={{ backgroundColor: '#dbeafe', borderRadius: '14px', padding: '1.1rem 1.2rem', minHeight: '92px', border: '1px solid #bfdbfe' }}>
              <p style={{ fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.06em', color: '#1d4ed8', marginBottom: '0.3rem' }}>CA du mois</p>
              <p style={{ fontSize: '1.6rem', fontWeight: '900', lineHeight: 1, color: '#1d4ed8' }}>{fmtEur(stats.caMonthPaid)}</p>
              <p style={{ fontSize: '0.75rem', color: '#1e40af', marginTop: '0.4rem' }}>Panier moyen : {fmtEur(stats.avgTicket)}</p>
            </div>
          </div>

          {/* Bottom row — pipeline + aides */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.8rem' }}>
            <Link href="/devis" style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '12px', padding: '1rem 1.2rem', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>📄 Pipeline devis</p>
                  <span style={{ fontSize: '0.72rem', fontWeight: '700', color: '#16a34a', backgroundColor: '#dcfce7', padding: '0.15rem 0.5rem', borderRadius: '999px' }}>{stats.acceptanceRate}% acceptés</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                  <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#1e3a5f' }}>{stats.acceptedDevis}</span>
                  <span style={{ fontSize: '0.85rem', color: '#64748b' }}>/ {stats.totalDevis} devis</span>
                </div>
                <div style={{ height: '6px', backgroundColor: '#e2e8f0', borderRadius: '999px', marginTop: '0.5rem', overflow: 'hidden' }}>
                  <div style={{ width: `${stats.acceptanceRate}%`, height: '100%', backgroundColor: '#16a34a', transition: 'width 0.3s' }} />
                </div>
              </div>
            </Link>
            <div style={{ backgroundColor: '#ecfdf5', borderRadius: '12px', padding: '1rem 1.2rem', border: '1px solid #a7f3d0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#065f46', textTransform: 'uppercase', letterSpacing: '0.04em' }}>🏛️ Aides obtenues clients</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem' }}>
                <span style={{ fontSize: '1.5rem', fontWeight: '900', color: '#15803d' }}>{fmtEur(stats.aidesTotal)}</span>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#15803d', marginTop: '0.4rem' }}>sur {stats.nbDevisWithAides} devis avec aides déduites</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
          {[
            { icon: '📁', label: 'Dossiers actifs', value: stats.activeDossiers, color: '#1d4ed8', bg: '#dbeafe', href: '/dossiers' },
            { icon: '👥', label: 'Clients actifs', value: stats.activeClients, color: '#7c3aed', bg: '#ede9fe', href: '/clients' },
            { icon: '⚠️', label: 'Docs manquants', value: stats.missingDocs, color: '#d97706', bg: '#fef3c7', href: '/dossiers' },
            { icon: '💰', label: 'En attente paiement', value: stats.pendingCA > 0 ? Math.round(stats.pendingCA) + ' €' : '0 €', color: '#15803d', bg: '#dcfce7', href: '/factures' },
          ].map((stat) => (
            <Link key={stat.label} href={stat.href} style={{ textDecoration: 'none' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: '48px', height: '48px', backgroundColor: stat.bg, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>{stat.icon}</div>
                <div>
                  <div style={{ fontSize: '1.6rem', fontWeight: '800', color: stat.color, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>{stat.label}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Next appointment banner */}
        {stats.nextEvent && (
          <Link href="/agenda" style={{ textDecoration: 'none' }}>
            <div style={{ backgroundColor: '#1e3a5f', borderRadius: '14px', padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <div style={{ width: '44px', height: '44px', backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>🗓</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ color: '#94a3b8', fontSize: '0.72rem', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.15rem' }}>Prochain rendez-vous</p>
                <p style={{ color: 'white', fontWeight: '700', fontSize: '0.95rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{stats.nextEvent.titre}</p>
                <p style={{ color: '#94a3b8', fontSize: '0.8rem' }}>{stats.nextEvent.date === new Date().toISOString().split('T')[0] ? "Aujourd'hui" : stats.nextEvent.date} · {stats.nextEvent.heure}</p>
              </div>
              <span style={{ color: '#d97706', fontSize: '1.2rem', flexShrink: 0 }}>›</span>
            </div>
          </Link>
        )}

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
