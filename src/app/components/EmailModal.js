'use client'

import { useState } from 'react'

export default function EmailModal({ to = '', subject = '', body = '', onClose, onSend }) {
  const [fields, setFields] = useState({ to, subject, body })

  function handleSend() {
    const mailto = `mailto:${encodeURIComponent(fields.to)}?subject=${encodeURIComponent(fields.subject)}&body=${encodeURIComponent(fields.body)}`
    window.location.href = mailto
    onSend?.()
    onClose()
  }

  return (
    <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.55)', zIndex: 500, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
      <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '1.5rem', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: '800', color: '#1e3a5f' }}>📧 Envoyer par email</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '1.4rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {/* To */}
          <div>
            <label style={lbl}>À (destinataire)</label>
            <input
              value={fields.to}
              onChange={e => setFields(f => ({ ...f, to: e.target.value }))}
              placeholder="client@email.fr"
              type="email"
              style={inp}
            />
          </div>

          {/* Subject */}
          <div>
            <label style={lbl}>Objet</label>
            <input
              value={fields.subject}
              onChange={e => setFields(f => ({ ...f, subject: e.target.value }))}
              style={inp}
            />
          </div>

          {/* Body */}
          <div>
            <label style={lbl}>Message</label>
            <textarea
              value={fields.body}
              onChange={e => setFields(f => ({ ...f, body: e.target.value }))}
              rows={12}
              style={{ ...inp, resize: 'vertical', lineHeight: 1.6, fontSize: '0.85rem', fontFamily: 'inherit' }}
            />
          </div>

          <div style={{ backgroundColor: '#fef3c7', border: '1px solid #fde68a', borderRadius: '10px', padding: '0.75rem 1rem', fontSize: '0.82rem', color: '#92400e' }}>
            💡 En cliquant sur "Ouvrir dans ma messagerie", votre application email s'ouvrira avec ce message pré-rempli. Le document PDF doit être joint manuellement.
          </div>

          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button onClick={onClose}
              style={{ flex: 1, backgroundColor: 'white', color: '#64748b', border: '1.5px solid #e2e8f0', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600', fontSize: '0.95rem' }}>
              Annuler
            </button>
            <button onClick={handleSend}
              style={{ flex: 2, backgroundColor: '#1e3a5f', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
              📧 Ouvrir dans ma messagerie
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

const lbl = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }
const inp = { width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }
