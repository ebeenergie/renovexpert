'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'
import SignaturePad from '../components/SignaturePad'
import EmailModal from '../components/EmailModal'

const SETTINGS_KEY = 'renovexpert_settings'

const STATUS = {
  brouillon: { label: 'Brouillon', color: '#64748b', bg: '#f1f5f9' },
  envoyee: { label: 'Envoyée', color: '#2563eb', bg: '#dbeafe' },
  payee: { label: 'Payée ✓', color: '#16a34a', bg: '#dcfce7' },
  en_retard: { label: '🔴 En retard', color: '#dc2626', bg: '#fee2e2' },
}

const DEFAULT_CGU = `CONDITIONS GÉNÉRALES DE VENTE — TRAVAUX DE RÉNOVATION

Article 1 – Objet
Les présentes conditions générales régissent l'ensemble des prestations de travaux réalisées par l'artisan. Toute commande implique l'acceptation sans réserve de ces conditions.

Article 2 – Prix et TVA
Les prix sont indiqués hors taxes. La TVA applicable est calculée au taux en vigueur à la date de facturation.

Article 3 – Paiement
Payable à réception de la facture. Tout retard de paiement entraîne des pénalités au taux légal majoré de 5 points, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement.

Article 4 – Garanties légales
Les travaux sont soumis à la garantie de parfait achèvement (1 an), la garantie biennale (2 ans) et la garantie décennale (10 ans), conformément aux articles 1792 et suivants du Code civil.

Article 5 – Assurance
L'artisan est couvert par une assurance responsabilité civile professionnelle et une garantie décennale. Une attestation peut être fournie sur simple demande.

Article 6 – Règlement des litiges
En cas de litige, les parties rechercheront en priorité une solution amiable. À défaut d'accord, le tribunal compétent sera celui du lieu d'exécution des travaux.`

function nextNumber(factures) {
  const year = new Date().getFullYear()
  const max = factures
    .filter(f => f.number?.includes(String(year)))
    .reduce((m, f) => Math.max(m, parseInt(f.number?.split('-').pop() || '0')), 0)
  return `FAC-${year}-${String(max + 1).padStart(3, '0')}`
}

function loadSettings() {
  try {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    return { cgu: s.cgu || DEFAULT_CGU, artisanSignature: s.artisanSignature || null }
  } catch { return { cgu: DEFAULT_CGU, artisanSignature: null } }
}

const blank = {
  id: '', number: '', clientId: '', clientName: '', clientAddress: '', devisRef: '',
  amount: '', tva: '10', dateEmission: new Date().toISOString().split('T')[0],
  dateEcheance: '', status: 'brouillon', notes: '',
  locked: false, clientSignature: null, artisanSignature: null, signedAt: null,
}

export default function FacturesPage() {
  const [user, setUser] = useState(null)
  const [factures, setFactures] = useState([])
  const [devis, setDevis] = useState([])
  const [filter, setFilter] = useState('tous')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(blank)
  const [printFac, setPrintFac] = useState(null)
  const [toast, setToast] = useState('')

  // Settings / CGU
  const [settings, setSettings] = useState({ cgu: DEFAULT_CGU, artisanSignature: null })
  const [cguEditing, setCguEditing] = useState(false)
  const [cguDraft, setCguDraft] = useState('')

  // Email
  const [showEmail, setShowEmail] = useState(false)
  const [emailData, setEmailData] = useState({ to: '', subject: '', body: '' })

  // Signing
  const [showSignModal, setShowSignModal] = useState(false)
  const [signStep, setSignStep] = useState(1)
  const [signingFac, setSigningFac] = useState(null)
  const artisanPadRef = useRef(null)
  const clientPadRef = useRef(null)

  const router = useRouter()

  useEffect(() => {
    const u = localStorage.getItem('renovexpert_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    const facs = JSON.parse(localStorage.getItem('renovexpert_factures') || '[]')
    const today = new Date().toISOString().split('T')[0]
    const checked = facs.map(f =>
      f.status === 'envoyee' && f.dateEcheance && f.dateEcheance < today ? { ...f, status: 'en_retard' } : f
    )
    setFactures(checked)
    localStorage.setItem('renovexpert_factures', JSON.stringify(checked))
    setDevis(JSON.parse(localStorage.getItem('renovexpert_devis') || '[]'))
    setSettings(loadSettings())

    const params = new URLSearchParams(window.location.search)
    const cId = params.get('clientId')
    const cName = params.get('clientName')
    const cAddr = params.get('clientAddress')
    if (cId && cName) {
      setForm({ ...blank, id: Date.now().toString(), number: nextNumber(checked), clientId: cId, clientName: cName, clientAddress: cAddr || '' })
      setEditId(null)
      setShowForm(true)
    }
  }, [router])

  function save(list) { setFactures(list); localStorage.setItem('renovexpert_factures', JSON.stringify(list)) }
  function toast3(msg) { setToast(msg); setTimeout(() => setToast(''), 3500) }

  function persistSettings(patch) {
    const updated = { ...settings, ...patch }
    setSettings(updated)
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated))
  }

  function openNew(fromDevis = null) {
    const f = { ...blank, id: Date.now().toString(), number: nextNumber(factures) }
    if (fromDevis) {
      const ht = fromDevis.totalHT || (fromDevis.items || []).reduce((s, i) => s + (i.qty || 0) * (i.unitPrice || 0), 0)
      f.clientName = fromDevis.clientName || ''
      f.devisRef = fromDevis.number || ''
      f.amount = ht.toFixed(2)
    }
    setForm(f); setEditId(null); setShowForm(true)
  }

  function submit() {
    if (!form.clientName.trim()) { alert('Nom du client obligatoire'); return }
    if (!form.amount) { alert('Montant obligatoire'); return }
    if (editId) { save(factures.map(f => f.id === editId ? form : f)); toast3('✅ Facture modifiée !') }
    else { save([...factures, form]); toast3('🎉 Facture créée !') }
    setShowForm(false)
  }

  function markPaid(id) {
    save(factures.map(f => f.id === id && !f.locked ? { ...f, status: 'payee', datePaiement: new Date().toISOString().split('T')[0] } : f))
    toast3('💚 Facture marquée payée !')
  }

  function markSent(id) {
    save(factures.map(f => f.id === id && !f.locked ? { ...f, status: 'envoyee' } : f))
    toast3('📤 Facture marquée envoyée')
  }

  function openEmail(fac) {
    const artisan = JSON.parse(localStorage.getItem('renovexpert_user') || '{}')
    const ht = parseFloat(fac.amount) || 0
    const tvaAmt = ht * (parseFloat(fac.tva) || 0) / 100
    const ttcAmt = ht + tvaAmt
    const clients = JSON.parse(localStorage.getItem('renovexpert_clients') || '[]')
    const client = clients.find(c => c.id === fac.clientId)
    const clientEmail = client?.email || ''
    setEmailData({
      _facId: fac.id,
      to: clientEmail,
      subject: `Facture ${fac.number} — ${artisan.company || ''}`,
      body: `Bonjour ${fac.clientName},

Veuillez trouver ci-dessous notre facture ${fac.number} en date du ${fac.dateEmission}.

──────────────────────────────────
FACTURE N° ${fac.number}
──────────────────────────────────
Client      : ${fac.clientName}
Date        : ${fac.dateEmission}${fac.dateEcheance ? '\nÉchéance    : ' + fac.dateEcheance : ''}${fac.devisRef ? '\nRéf. devis  : ' + fac.devisRef : ''}

Montant HT  : ${ht.toFixed(2)} €
TVA (${fac.tva}%)  : ${tvaAmt.toFixed(2)} €
Total TTC   : ${ttcAmt.toFixed(2)} €
──────────────────────────────────${fac.notes ? '\n\nObjet : ' + fac.notes : ''}

Règlement à effectuer à réception${fac.dateEcheance ? ' avant le ' + fac.dateEcheance : ''}.

Cordialement,
${artisan.name || ''}
${artisan.company || ''}${artisan.phone ? '\n' + artisan.phone : ''}${artisan.email ? '\n' + artisan.email : ''}`,
    })
    setShowEmail(true)
  }

  function openSignModal(fac) {
    setSigningFac(fac)
    setSignStep(1)
    setShowSignModal(true)
  }

  function handleArtisanSign() {
    if (artisanPadRef.current?.isEmpty()) { alert('Veuillez signer avant de continuer.'); return }
    const sig = artisanPadRef.current.toDataURL()
    persistSettings({ artisanSignature: sig })
    setSignStep(2)
  }

  function handleClientSign() {
    if (clientPadRef.current?.isEmpty()) { alert('Le client doit signer avant de valider.'); return }
    const clientSig = clientPadRef.current.toDataURL()
    const artisanSig = artisanPadRef.current ? artisanPadRef.current.toDataURL() : settings.artisanSignature
    const signedAt = new Date().toLocaleString('fr-FR')
    const updated = factures.map(f =>
      f.id === signingFac.id
        ? { ...f, locked: true, artisanSignature: artisanSig, clientSignature: clientSig, signedAt }
        : f
    )
    save(updated)
    setShowSignModal(false)
    setSigningFac(null)
    setSignStep(1)
    toast3('✅ Facture signée électroniquement et verrouillée !')
  }

  const filtered = filter === 'tous' ? factures : factures.filter(f => f.status === filter)
  const totalCA = factures.filter(f => f.status === 'payee').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)
  const totalAttente = factures.filter(f => f.status === 'envoyee' || f.status === 'en_retard').reduce((s, f) => s + (parseFloat(f.amount) || 0), 0)
  const acceptedDevis = devis.filter(d => d.status === 'accepte')

  const ht = parseFloat(form.amount) || 0
  const ttc = ht * (1 + parseFloat(form.tva || 0) / 100)

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', paddingBottom: '80px' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '1.5rem', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>💰 Mes Factures</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{factures.length} facture{factures.length !== 1 ? 's' : ''}</p>
          </div>
          <button onClick={() => openNew()}
            style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' }}>
            + Nouvelle facture
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          {[
            { label: "Chiffre d'affaires", value: totalCA.toFixed(0) + ' €', color: '#16a34a', bg: '#dcfce7', icon: '💚' },
            { label: 'En attente de paiement', value: totalAttente.toFixed(0) + ' €', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
            { label: 'En retard', value: factures.filter(f => f.status === 'en_retard').length, color: '#dc2626', bg: '#fee2e2', icon: '🚨' },
          ].map(s => (
            <div key={s.label} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <div style={{ width: '44px', height: '44px', backgroundColor: s.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{s.icon}</div>
              <div>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: s.color, lineHeight: 1 }}>{s.value}</div>
                <div style={{ fontSize: '0.72rem', color: '#64748b', marginTop: '0.2rem' }}>{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Import from accepted devis */}
        {acceptedDevis.length > 0 && (
          <div style={{ backgroundColor: '#fffbeb', border: '2px solid #fbbf24', borderRadius: '14px', padding: '1rem 1.2rem', marginBottom: '1.5rem' }}>
            <p style={{ fontSize: '0.85rem', fontWeight: '700', color: '#92400e', marginBottom: '0.6rem' }}>⚡ Devis acceptés prêts à facturer</p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {acceptedDevis.map(d => (
                <button key={d.id} onClick={() => openNew(d)}
                  style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                  📄 {d.number} — {d.clientName}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'tous', label: 'Toutes' },
            { key: 'brouillon', label: 'Brouillons' },
            { key: 'envoyee', label: 'Envoyées' },
            { key: 'payee', label: 'Payées' },
            { key: 'en_retard', label: 'En retard' },
          ].map(tab => {
            const st = STATUS[tab.key]
            return (
              <button key={tab.key} onClick={() => setFilter(tab.key)}
                style={{ padding: '0.45rem 0.9rem', borderRadius: '20px', border: '2px solid', borderColor: filter === tab.key ? (st?.color || '#1e3a5f') : '#e2e8f0', backgroundColor: filter === tab.key ? (st?.bg || '#dbeafe') : 'white', color: filter === tab.key ? (st?.color || '#1e3a5f') : '#64748b', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' }}>
                {tab.label} ({tab.key === 'tous' ? factures.length : factures.filter(f => f.status === tab.key).length})
              </button>
            )
          })}
        </div>

        {/* Facture list */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '16px', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>💰</div>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Aucune facture</h3>
            <button onClick={() => openNew()} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '1rem' }}>
              + Créer une facture
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
            {[...filtered].sort((a, b) => (b.dateEmission || '').localeCompare(a.dateEmission || '')).map(fac => {
              const st = STATUS[fac.status] || STATUS.brouillon
              const montantTTC = (parseFloat(fac.amount) || 0) * (1 + (parseFloat(fac.tva) || 10) / 100)
              return (
                <div key={fac.id} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: `4px solid ${fac.locked ? '#16a34a' : st.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{fac.number}</span>
                        <span style={{ backgroundColor: st.bg, color: st.color, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{st.label}</span>
                        {fac.locked && <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '700' }}>✅ Signée</span>}
                      </div>
                      <p style={{ color: '#475569', fontSize: '0.88rem' }}>👤 {fac.clientName}</p>
                      {fac.devisRef && <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Devis: {fac.devisRef}</p>}
                      <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                        📅 {fac.dateEmission}{fac.dateEcheance ? ` · Échéance ${fac.dateEcheance}` : ''}{fac.datePaiement ? ` · Payée ${fac.datePaiement}` : ''}
                      </p>
                      {fac.signedAt && <p style={{ color: '#16a34a', fontSize: '0.75rem', marginTop: '0.1rem' }}>🔒 Signée le {fac.signedAt}</p>}
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: fac.locked ? '#16a34a' : st.color }}>{montantTTC.toFixed(0)} €</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>TTC · TVA {fac.tva}%</div>
                    </div>
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap', alignItems: 'center' }}>
                    {!fac.locked && (fac.status === 'envoyee' || fac.status === 'en_retard') && (
                      <button onClick={() => markPaid(fac.id)} style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1.5px solid #bbf7d0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>✅ Marquer payée</button>
                    )}
                    {!fac.locked && fac.status === 'brouillon' && (
                      <button onClick={() => markSent(fac.id)} style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: '1.5px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>📤 Marquer envoyée</button>
                    )}
                    <button onClick={() => openEmail(fac)} style={{ backgroundColor: '#e0f2fe', color: '#0891b2', border: '1.5px solid #bae6fd', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>📧 Envoyer</button>
                    <button onClick={() => setPrintFac(fac)} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>🖨️ Imprimer</button>
                    {!fac.locked && (
                      <button onClick={() => openSignModal(fac)} style={{ backgroundColor: '#fef3c7', color: '#d97706', border: '1.5px solid #fde68a', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>✍️ Faire signer</button>
                    )}
                    {!fac.locked && (
                      <button onClick={() => { setForm({ ...fac }); setEditId(fac.id); setShowForm(true) }} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>✏️ Modifier</button>
                    )}
                    {!fac.locked && (
                      <button onClick={() => { if (confirm('Supprimer ?')) { save(factures.filter(f => f.id !== fac.id)); toast3('Facture supprimée') } }} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.4rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>🗑️</button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* CGU section */}
        <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginTop: '2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e3a5f' }}>📋 Conditions Générales de Vente</h3>
            {!cguEditing && (
              <button onClick={() => { setCguDraft(settings.cgu); setCguEditing(true) }}
                style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: '600' }}>
                ✏️ Modifier mes CGV
              </button>
            )}
          </div>
          {cguEditing ? (
            <div>
              <textarea value={cguDraft} onChange={e => setCguDraft(e.target.value)} rows={8}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.82rem', lineHeight: 1.6, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit' }} />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                <button onClick={() => { persistSettings({ cgu: cguDraft }); setCguEditing(false); toast3('✅ CGV mises à jour') }}
                  style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' }}>Enregistrer</button>
                <button onClick={() => setCguEditing(false)}
                  style={{ backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>Annuler</button>
              </div>
            </div>
          ) : (
            <div style={{ fontSize: '0.78rem', color: '#64748b', whiteSpace: 'pre-wrap', lineHeight: 1.6, maxHeight: '200px', overflowY: 'auto', backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.75rem' }}>
              {settings.cgu}
            </div>
          )}
        </div>
      </div>

      {/* ── Print modal ── */}
      {printFac && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            {/* Print header */}
            <div style={{ borderBottom: '3px solid #1e3a5f', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e3a5f' }}>Renov<span style={{ color: '#d97706' }}>Expert</span></h2>
                {user && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{user.company}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a5f' }}>FACTURE</h3>
                <p style={{ fontWeight: '600', color: '#475569' }}>{printFac.number}</p>
                {printFac.locked && <p style={{ color: '#16a34a', fontSize: '0.78rem', fontWeight: '700', marginTop: '0.2rem' }}>✅ Signée le {printFac.signedAt}</p>}
              </div>
            </div>

            {/* Client + Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Client</p>
                <p style={{ fontWeight: '600', color: '#1e293b' }}>{printFac.clientName}</p>
                {printFac.clientAddress && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{printFac.clientAddress}</p>}
              </div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Dates</p>
                <p style={{ color: '#475569', fontSize: '0.88rem' }}>Émise le {printFac.dateEmission}</p>
                {printFac.dateEcheance && <p style={{ color: '#475569', fontSize: '0.88rem' }}>Échéance : {printFac.dateEcheance}</p>}
              </div>
            </div>

            {/* Items table */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
              <thead>
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <th style={{ padding: '0.7rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                  <th style={{ padding: '0.7rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Montant HT</th>
                </tr>
              </thead>
              <tbody>
                <tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                    Travaux de rénovation{printFac.devisRef ? ` (réf. ${printFac.devisRef})` : ''}
                    {printFac.notes && <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem' }}>{printFac.notes}</p>}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{parseFloat(printFac.amount || 0).toFixed(2)} €</td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.88rem', color: '#64748b' }}>TVA ({printFac.tva}%)</td>
                  <td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.88rem', color: '#64748b' }}>{(parseFloat(printFac.amount || 0) * parseFloat(printFac.tva || 0) / 100).toFixed(2)} €</td>
                </tr>
                <tr style={{ borderTop: '2px solid #1e3a5f' }}>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', fontSize: '1rem', color: '#1e3a5f' }}>TOTAL TTC</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '1.2rem', color: '#1e3a5f' }}>{(parseFloat(printFac.amount || 0) * (1 + parseFloat(printFac.tva || 0) / 100)).toFixed(2)} €</td>
                </tr>
              </tfoot>
            </table>

            {/* Signatures in print */}
            {printFac.locked && printFac.artisanSignature && printFac.clientSignature && (
              <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '2px solid #e2e8f0' }}>
                <p style={{ fontSize: '0.78rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Signatures électroniques</p>
                <div style={{ display: 'flex', gap: '1.5rem' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem' }}>Artisan — {user?.name}</p>
                    <img src={printFac.artisanSignature} alt="Signature artisan" style={{ width: '100%', height: '70px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fafafa' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: '0.72rem', color: '#64748b', marginBottom: '0.3rem' }}>Client — {printFac.clientName}</p>
                    <img src={printFac.clientSignature} alt="Signature client" style={{ width: '100%', height: '70px', objectFit: 'contain', border: '1px solid #e2e8f0', borderRadius: '6px', backgroundColor: '#fafafa' }} />
                  </div>
                </div>
                {printFac.signedAt && <p style={{ fontSize: '0.7rem', color: '#94a3b8', marginTop: '0.4rem' }}>Signé le {printFac.signedAt}</p>}
              </div>
            )}

            {/* CGU in print */}
            <div style={{ marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#94a3b8', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Conditions Générales de Vente</p>
              <p style={{ fontSize: '0.68rem', color: '#94a3b8', whiteSpace: 'pre-line', lineHeight: 1.5 }}>{settings.cgu}</p>
            </div>

            {/* Print modal buttons */}
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end', marginTop: '1.5rem' }}>
              <button onClick={() => setPrintFac(null)} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', padding: '0.7rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Fermer</button>
              <button onClick={() => window.print()} style={{ backgroundColor: '#1e3a5f', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>🖨️ Imprimer / PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* ── Create/edit form modal ── */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f' }}>{editId ? '✏️ Modifier' : '➕ Nouvelle facture'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '0.75rem 1rem' }}>
                <p style={{ fontSize: '0.78rem', color: '#64748b' }}>Numéro</p>
                <p style={{ fontWeight: '700', color: '#1e3a5f' }}>{form.number}</p>
              </div>
              {[
                { key: 'clientName', label: 'Nom du client *', type: 'text', placeholder: 'Jean Dupont' },
                { key: 'devisRef', label: 'Référence devis', type: 'text', placeholder: 'DEV-2026-001' },
                { key: 'amount', label: 'Montant HT (€) *', type: 'number', placeholder: '2500' },
                { key: 'dateEmission', label: "Date d'émission", type: 'date', placeholder: '' },
                { key: 'dateEcheance', label: "Date d'échéance", type: 'date', placeholder: '' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                  <input type={f.type} value={form[f.key] || ''} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Taux TVA</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {['5.5', '10', '20'].map(rate => (
                    <button key={rate} onClick={() => setForm({ ...form, tva: rate })}
                      style={{ flex: 1, padding: '0.65rem', borderRadius: '8px', border: '2px solid', borderColor: form.tva === rate ? '#1e3a5f' : '#e2e8f0', backgroundColor: form.tva === rate ? '#1e3a5f' : 'white', color: form.tva === rate ? 'white' : '#374151', fontWeight: '700', cursor: 'pointer' }}>
                      {rate}%
                    </button>
                  ))}
                </div>
              </div>
              {ht > 0 && (
                <div style={{ backgroundColor: '#dbeafe', borderRadius: '10px', padding: '0.8rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ color: '#1d4ed8', fontWeight: '600' }}>Total TTC estimé</span>
                  <span style={{ color: '#1d4ed8', fontWeight: '800', fontSize: '1.1rem' }}>{ttc.toFixed(2)} €</span>
                </div>
              )}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Notes / objet</label>
                <textarea value={form.notes || ''} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Description des travaux..." rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button onClick={submit} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
                {editId ? '✅ Enregistrer' : '🎉 Créer la facture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Email modal ── */}
      {showEmail && (
        <EmailModal
          to={emailData.to}
          subject={emailData.subject}
          body={emailData.body}
          onClose={() => setShowEmail(false)}
          onSend={() => {
            markSent(emailData._facId)
            toast3('📧 Messagerie ouverte — pensez à joindre le PDF')
          }}
        />
      )}

      {/* ── Signature modal ── */}
      {showSignModal && signingFac && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 500, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2rem', width: '100%', maxWidth: '540px', maxHeight: '92vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
              <h2 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1e3a5f' }}>
                ✍️ {signStep === 1 ? 'Étape 1 — Signature artisan' : 'Étape 2 — Signature client'}
              </h2>
              <button onClick={() => { setShowSignModal(false); setSignStep(1); setSigningFac(null) }}
                style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>

            {/* Progress */}
            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
              {[1, 2].map(s => (
                <div key={s} style={{ flex: 1, height: '6px', borderRadius: '3px', backgroundColor: s <= signStep ? '#d97706' : '#e2e8f0', transition: 'background-color 0.3s' }} />
              ))}
            </div>

            {signStep === 1 && (
              <div>
                <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1rem' }}>
                  Signez dans le cadre ci-dessous. Votre signature sera mémorisée pour les prochains documents.
                </p>
                <SignaturePad ref={artisanPadRef} label="Votre signature (artisan)" height={160} />
                {settings.artisanSignature && (
                  <button onClick={() => artisanPadRef.current?.loadDataURL(settings.artisanSignature)}
                    style={{ marginTop: '0.5rem', background: 'none', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '0.35rem 0.8rem', fontSize: '0.8rem', color: '#64748b', cursor: 'pointer' }}>
                    ↩ Utiliser ma signature enregistrée
                  </button>
                )}
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
                  <button onClick={() => artisanPadRef.current?.clear()}
                    style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                    🗑 Effacer
                  </button>
                  <button onClick={handleArtisanSign}
                    style={{ flex: 1, backgroundColor: '#1e3a5f', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
                    Continuer → Signature client
                  </button>
                </div>
              </div>
            )}

            {signStep === 2 && (
              <div>
                <p style={{ fontSize: '0.88rem', color: '#475569', marginBottom: '1rem' }}>
                  Le client signe ci-dessous. La facture sera verrouillée définitivement.
                </p>
                <SignaturePad ref={clientPadRef} label={`Signature du client — ${signingFac?.clientName}`} height={160} />
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1.2rem' }}>
                  <button onClick={() => clientPadRef.current?.clear()}
                    style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.65rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem' }}>
                    🗑 Effacer
                  </button>
                  <button onClick={handleClientSign}
                    style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '0.75rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
                    🔒 Valider et verrouiller la facture
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e3a5f', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600', zIndex: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
