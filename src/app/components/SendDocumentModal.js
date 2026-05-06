'use client'

import { useState } from 'react'

export default function SendDocumentModal({ type, document, artisan, settings, onClose, onSent }) {
  const isDevis = type === 'devis'
  const docNum = document.numero || document.number || ''
  const [fields, setFields] = useState({
    to: document.clientEmail || '',
    subject: `${isDevis ? 'Devis' : 'Facture'} ${docNum} — ${artisan.company || artisan.name || ''}`,
    message: buildDefaultMessage(type, document, artisan),
  })
  const [loading, setLoading] = useState(false)
  const [signingUrl, setSigningUrl] = useState(null)
  const [error, setError] = useState('')

  async function handleSend() {
    if (!fields.to.trim()) { setError('Adresse email requise.'); return }
    setLoading(true)
    setError('')
    try {
      const cgu = settings?.cgu || ''
      const res = await fetch('/api/send-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          document: { ...document, cgu },
          clientEmail: fields.to,
          subject: fields.subject,
          message: fields.message,
          artisan,
        }),
      })
      const data = await res.json()
      if (data.error) { setError(data.error); setLoading(false); return }
      setSigningUrl(data.signingUrl)
      onSent?.(data.signingUrl)
    } catch {
      setError('Erreur réseau. Vérifiez votre connexion.')
    }
    setLoading(false)
  }

  function copyUrl() {
    navigator.clipboard.writeText(signingUrl)
      .then(() => alert('Lien copié !'))
      .catch(() => prompt('Copiez ce lien :', signingUrl))
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: '620px', maxHeight: '92vh', overflowY: 'auto' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e3a5f' }}>📧 Envoyer pour signature</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        {signingUrl ? (
          <div>
            <div style={{ backgroundColor: '#f0fdf4', border: '2px solid #bbf7d0', borderRadius: '12px', padding: '1.2rem', marginBottom: '1rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>✅</div>
              <p style={{ fontWeight: '700', color: '#15803d', marginBottom: '0.3rem' }}>Email envoyé à {fields.to}</p>
              <p style={{ color: '#64748b', fontSize: '0.85rem' }}>Le client recevra un lien pour consulter et signer le document.</p>
            </div>
            <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '1rem', marginBottom: '1rem' }}>
              <p style={{ fontSize: '0.78rem', fontWeight: '600', color: '#475569', marginBottom: '0.5rem' }}>Lien de signature (à partager si besoin) :</p>
              <p style={{ fontSize: '0.78rem', color: '#1e3a5f', wordBreak: 'break-all', fontFamily: 'monospace', marginBottom: '0.75rem' }}>{signingUrl}</p>
              <button onClick={copyUrl}
                style={{ backgroundColor: '#1e3a5f', color: 'white', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                📋 Copier le lien
              </button>
            </div>
            <button onClick={onClose}
              style={{ width: '100%', backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
              Fermer
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            <div>
              <label style={lbl}>Email du client *</label>
              <input value={fields.to} onChange={e => setFields(f => ({ ...f, to: e.target.value }))}
                placeholder="client@email.fr" type="email" style={inp} />
            </div>
            <div>
              <label style={lbl}>Objet</label>
              <input value={fields.subject} onChange={e => setFields(f => ({ ...f, subject: e.target.value }))} style={inp} />
            </div>
            <div>
              <label style={lbl}>Message</label>
              <textarea value={fields.message} onChange={e => setFields(f => ({ ...f, message: e.target.value }))}
                rows={8} style={{ ...inp, resize: 'vertical', lineHeight: 1.6, fontSize: '0.85rem', fontFamily: 'inherit' }} />
            </div>

            <div style={{ backgroundColor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#1d4ed8' }}>
              ✍️ Un lien de signature électronique sera automatiquement ajouté à l'email. Le client pourra lire et signer en ligne.
            </div>

            {error && (
              <div style={{ backgroundColor: '#fee2e2', border: '1px solid #fca5a5', borderRadius: '8px', padding: '0.75rem', fontSize: '0.85rem', color: '#b91c1c' }}>
                ⚠️ {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button onClick={onClose}
                style={{ flex: 1, backgroundColor: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
                Annuler
              </button>
              <button onClick={handleSend} disabled={loading}
                style={{ flex: 2, backgroundColor: loading ? '#94a3b8' : '#1e3a5f', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '10px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
                {loading ? '⏳ Envoi...' : '📧 Envoyer pour signature'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function buildDefaultMessage(type, document, artisan) {
  const isDevis = type === 'devis'
  const docNum = document.numero || document.number || ''
  const docDate = document.createdAt || document.dateEmission || new Date().toLocaleDateString('fr-FR')
  return `Bonjour ${document.clientName},

Veuillez trouver ci-joint votre ${isDevis ? 'devis' : 'facture'} n° ${docNum} en date du ${docDate}.

Vous pouvez consulter le document et apposer votre signature électronique en cliquant sur le bouton ci-dessous.

${isDevis ? 'Ce devis est valable 30 jours. Pour l\'accepter, signez en ligne via le lien ci-dessous.' : 'Merci de procéder à la signature de cette facture.'}

Cordialement,
${artisan.name || ''}
${artisan.company || ''}${artisan.address ? '\n' + artisan.address : ''}${(artisan.postalCode || artisan.city) ? '\n' + (artisan.postalCode || '') + ' ' + (artisan.city || '') : ''}${artisan.phone ? '\n📞 ' + artisan.phone : ''}${artisan.email ? '\n✉️ ' + artisan.email : ''}${artisan.website ? '\n🌐 ' + artisan.website : ''}${artisan.siret ? '\n\nSIRET : ' + artisan.siret : ''}${artisan.tvaNumber ? '\nTVA : ' + artisan.tvaNumber : ''}${artisan.rge ? '\nRGE : ' + artisan.rge : ''}`
}

const lbl = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }
const inp = { width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }
