'use client'

import { useState, useEffect, useRef } from 'react'
import { useParams } from 'next/navigation'
import SignaturePad from '../../components/SignaturePad'

export default function SignerPage() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [signerName, setSignerName] = useState('')
  const [done, setDone] = useState(null) // 'signed' | 'refused'
  const [submitting, setSubmitting] = useState(false)
  const [agreedCgu, setAgreedCgu] = useState(false)
  const padRef = useRef(null)

  useEffect(() => {
    fetch(`/api/document/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) setError(data.error)
        else {
          setDoc(data)
          if (data.signingStatus === 'signed') setDone('signed')
          if (data.signingStatus === 'refused') setDone('refused')
        }
        setLoading(false)
      })
      .catch(() => { setError('Impossible de charger le document.'); setLoading(false) })
  }, [id])

  async function handleAction(refused = false) {
    if (!signerName.trim()) { alert('Veuillez entrer votre nom complet.'); return }
    if (!refused && padRef.current?.isEmpty()) { alert('Veuillez apposer votre signature.'); return }
    if (!refused && !agreedCgu) { alert('Veuillez accepter les conditions générales.'); return }

    setSubmitting(true)
    const signature = refused ? null : padRef.current.toDataURL()

    const res = await fetch(`/api/sign/${id}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ signature, signerName, refused }),
    })
    const data = await res.json()
    if (data.success) setDone(refused ? 'refused' : 'signed')
    else alert('Erreur : ' + (data.error || 'Réessayez.'))
    setSubmitting(false)
  }

  const fmt = (n) => (parseFloat(n) || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>⏳</div>
        <p style={{ color: '#64748b', fontFamily: 'sans-serif' }}>Chargement du document...</p>
      </div>
    </div>
  )

  if (error) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', maxWidth: '400px', textAlign: 'center', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ color: '#1e3a5f', fontFamily: 'sans-serif', marginBottom: '0.5rem' }}>Document introuvable</h2>
        <p style={{ color: '#64748b', fontFamily: 'sans-serif', fontSize: '0.9rem' }}>{error}</p>
        <p style={{ color: '#94a3b8', fontFamily: 'sans-serif', fontSize: '0.82rem', marginTop: '1rem' }}>Ce lien est peut-être expiré ou invalide. Contactez votre artisan.</p>
      </div>
    </div>
  )

  if (done === 'signed') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2.5rem', maxWidth: '420px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>✅</div>
        <h2 style={{ color: '#15803d', fontFamily: 'sans-serif', fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>Document signé !</h2>
        <p style={{ color: '#475569', fontFamily: 'sans-serif', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Votre signature a bien été enregistrée. {doc?.artisan?.name || 'L\'artisan'} a été notifié par email.
        </p>
        <div style={{ marginTop: '1.5rem', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '12px', padding: '1rem', fontSize: '0.85rem', color: '#15803d' }}>
          Vous pouvez fermer cette page.
        </div>
      </div>
    </div>
  )

  if (done === 'refused') return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8', padding: '1rem' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '2.5rem', maxWidth: '420px', textAlign: 'center', boxShadow: '0 8px 32px rgba(0,0,0,0.12)' }}>
        <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>❌</div>
        <h2 style={{ color: '#dc2626', fontFamily: 'sans-serif', fontSize: '1.4rem', fontWeight: '800', marginBottom: '0.5rem' }}>Document refusé</h2>
        <p style={{ color: '#475569', fontFamily: 'sans-serif', fontSize: '0.95rem', lineHeight: 1.6 }}>
          Votre refus a été enregistré. {doc?.artisan?.name || 'L\'artisan'} a été notifié.
        </p>
      </div>
    </div>
  )

  if (!doc) return null

  const isDevis = doc.type === 'devis'
  const sub = isDevis
    ? (doc.items || []).reduce((s, it) => s + (it.quantity || 0) * (it.unitPrice || 0), 0) + (doc.laborCost || 0)
    : (parseFloat(doc.amount) || 0)
  const tvaRate = isDevis ? (doc.taxRate || 10) : (parseFloat(doc.tva) || 10)
  const tva = sub * tvaRate / 100
  const ttc = sub + tva
  const docNum = doc.numero || doc.number || ''
  const docDate = doc.createdAt || doc.dateEmission || ''

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif', paddingBottom: '2rem' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '1.2rem 1.5rem', textAlign: 'center' }}>
        <h1 style={{ color: 'white', margin: 0, fontSize: '1.4rem', fontWeight: '900' }}>
          Renov<span style={{ color: '#d97706' }}>Expert</span>
        </h1>
        <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: '0.82rem' }}>{doc.artisan?.company || doc.artisan?.name || ''}</p>
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>

        {/* Document card */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.2rem', paddingBottom: '1rem', borderBottom: '2px solid #1e3a5f' }}>
            <div>
              <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '2px' }}>{isDevis ? 'DEVIS' : 'FACTURE'}</div>
              <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f' }}>{docNum}</div>
              {docDate && <div style={{ fontSize: '0.82rem', color: '#64748b', marginTop: '2px' }}>Date : {docDate}</div>}
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#d97706' }}>{fmt(ttc)}</div>
              <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>TTC (TVA {tvaRate}%)</div>
            </div>
          </div>

          {/* Client + artisan */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.2rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Client</div>
              <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.92rem' }}>{doc.clientName}</div>
              {doc.clientAddress && <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>{doc.clientAddress}</div>}
            </div>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '4px' }}>Artisan</div>
              <div style={{ fontWeight: '700', color: '#1e293b', fontSize: '0.92rem' }}>{doc.artisan?.name || ''}</div>
              {doc.artisan?.company && <div style={{ color: '#64748b', fontSize: '0.8rem', marginTop: '2px' }}>{doc.artisan.company}</div>}
              {doc.artisan?.phone && <div style={{ color: '#64748b', fontSize: '0.8rem' }}>{doc.artisan.phone}</div>}
            </div>
          </div>

          {/* Work description */}
          {doc.workDescription && (
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem', fontSize: '0.88rem', color: '#374151' }}>
              <span style={{ fontWeight: '600', color: '#1e3a5f' }}>Objet : </span>{doc.workDescription}
            </div>
          )}

          {/* Items table (devis) */}
          {isDevis && doc.items && doc.items.length > 0 && (
            <div style={{ marginBottom: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 90px 90px', gap: '0.4rem', padding: '0.5rem 0.6rem', backgroundColor: '#1e3a5f', borderRadius: '6px 6px 0 0', fontSize: '0.72rem', fontWeight: '700', color: 'white' }}>
                <span>Description</span><span style={{ textAlign: 'center' }}>Qté</span><span style={{ textAlign: 'right' }}>P.U. HT</span><span style={{ textAlign: 'right' }}>Total HT</span>
              </div>
              {doc.items.map((it, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 50px 90px 90px', gap: '0.4rem', padding: '0.5rem 0.6rem', backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.82rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#374151' }}>{it.description || '-'}</span>
                  <span style={{ textAlign: 'center', color: '#64748b' }}>{it.quantity}</span>
                  <span style={{ textAlign: 'right', color: '#64748b' }}>{fmt(it.unitPrice)}</span>
                  <span style={{ textAlign: 'right', fontWeight: '600', color: '#1e3a5f' }}>{fmt((it.quantity || 0) * (it.unitPrice || 0))}</span>
                </div>
              ))}
              {doc.laborCost > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 50px 90px 90px', gap: '0.4rem', padding: '0.5rem 0.6rem', backgroundColor: '#f8fafc', fontSize: '0.82rem', borderBottom: '1px solid #f1f5f9' }}>
                  <span style={{ color: '#374151' }}>Main d'œuvre</span>
                  <span style={{ textAlign: 'center', color: '#64748b' }}>1</span>
                  <span style={{ textAlign: 'right', color: '#64748b' }}>{fmt(doc.laborCost)}</span>
                  <span style={{ textAlign: 'right', fontWeight: '600', color: '#1e3a5f' }}>{fmt(doc.laborCost)}</span>
                </div>
              )}
            </div>
          )}

          {/* Totals */}
          <div style={{ backgroundColor: '#1e3a5f', borderRadius: '10px', padding: '1rem 1.2rem', color: 'white' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>Total HT</span><span>{fmt(sub)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem', fontSize: '0.85rem' }}>
              <span style={{ color: '#94a3b8' }}>TVA ({tvaRate}%)</span><span>{fmt(tva)}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.6rem' }}>
              <span style={{ fontWeight: '700' }}>TOTAL TTC</span>
              <span style={{ fontWeight: '900', fontSize: '1.2rem', color: '#fbbf24' }}>{fmt(ttc)}</span>
            </div>
          </div>

          {/* Notes / facture ref */}
          {(doc.notes || doc.devisRef) && (
            <div style={{ marginTop: '1rem', padding: '0.75rem', backgroundColor: '#fef9c3', borderRadius: '8px', fontSize: '0.82rem', color: '#92400e' }}>
              {doc.devisRef && <div><strong>Réf. devis :</strong> {doc.devisRef}</div>}
              {doc.notes && <div style={{ marginTop: doc.devisRef ? '4px' : 0 }}><strong>Notes :</strong> {doc.notes}</div>}
            </div>
          )}
        </div>

        {/* CGU */}
        {doc.cgu && (
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', marginBottom: '1rem' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Conditions Générales de Vente</div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', whiteSpace: 'pre-line', lineHeight: 1.6, maxHeight: '150px', overflowY: 'auto' }}>{doc.cgu}</div>
          </div>
        )}

        {/* Signature section */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 12px rgba(0,0,0,0.08)' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.3rem' }}>✍️ Signature électronique</h2>
          <p style={{ color: '#64748b', fontSize: '0.85rem', marginBottom: '1.2rem', lineHeight: 1.5 }}>
            En signant, vous acceptez le {isDevis ? 'devis' : 'la facture'} et les conditions générales de vente.
          </p>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>Votre nom complet *</label>
            <input
              value={signerName}
              onChange={e => setSignerName(e.target.value)}
              placeholder="Jean Dupont"
              style={{ width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }}
            />
          </div>

          <SignaturePad ref={padRef} label="Votre signature (doigt ou souris)" height={160} />

          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
            <button onClick={() => padRef.current?.clear()}
              style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0', padding: '0.5rem 0.9rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600' }}>
              🗑 Effacer
            </button>
          </div>

          <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem', marginTop: '1rem', cursor: 'pointer' }}>
            <input type="checkbox" checked={agreedCgu} onChange={e => setAgreedCgu(e.target.checked)}
              style={{ marginTop: '2px', width: '18px', height: '18px', flexShrink: 0, cursor: 'pointer' }} />
            <span style={{ fontSize: '0.82rem', color: '#475569', lineHeight: 1.5 }}>
              J'ai lu et j'accepte les conditions générales de vente, et je reconnais que ma signature électronique a valeur légale.
            </span>
          </label>

          <button onClick={() => handleAction(false)} disabled={submitting}
            style={{ width: '100%', backgroundColor: submitting ? '#94a3b8' : '#16a34a', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', cursor: submitting ? 'not-allowed' : 'pointer', fontWeight: '800', fontSize: '1rem', marginTop: '1.2rem' }}>
            {submitting ? '⏳ Enregistrement...' : `✅ Je signe et accepte ce ${isDevis ? 'devis' : 'la facture'}`}
          </button>

          <button onClick={() => { if (confirm('Confirmer le refus de ce document ?')) handleAction(true) }} disabled={submitting}
            style={{ width: '100%', backgroundColor: 'white', color: '#dc2626', border: '1.5px solid #fca5a5', padding: '0.75rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '600', fontSize: '0.9rem', marginTop: '0.6rem' }}>
            ❌ Refuser le document
          </button>
        </div>

        <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.75rem', marginTop: '1.5rem' }}>
          Document envoyé par RenovExpert · {doc.artisan?.name || ''}{doc.artisan?.company ? ` — ${doc.artisan.company}` : ''}
        </p>
      </div>
    </div>
  )
}
