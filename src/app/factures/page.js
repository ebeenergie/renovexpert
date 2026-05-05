'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

const STATUS = {
  brouillon: { label: 'Brouillon', color: '#64748b', bg: '#f1f5f9' },
  envoyee: { label: 'Envoyée', color: '#2563eb', bg: '#dbeafe' },
  payee: { label: 'Payée ✓', color: '#16a34a', bg: '#dcfce7' },
  en_retard: { label: '🔴 En retard', color: '#dc2626', bg: '#fee2e2' },
}

function nextNumber(factures) {
  const year = new Date().getFullYear()
  const max = factures
    .filter(f => f.number?.includes(String(year)))
    .reduce((m, f) => Math.max(m, parseInt(f.number?.split('-').pop() || '0')), 0)
  return `FAC-${year}-${String(max + 1).padStart(3, '0')}`
}

const blank = { id: '', number: '', clientName: '', devisRef: '', amount: '', tva: '10', dateEmission: new Date().toISOString().split('T')[0], dateEcheance: '', status: 'brouillon', notes: '' }

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

    const params = new URLSearchParams(window.location.search)
    const cId = params.get('clientId')
    const cName = params.get('clientName')
    const cAddr = params.get('clientAddress')
    if (cId && cName) {
      setForm({
        ...blank,
        id: Date.now().toString(),
        number: nextNumber(checked),
        clientId: cId,
        clientName: cName,
        clientAddress: cAddr || '',
      })
      setEditId(null)
      setShowForm(true)
    }
  }, [router])

  function save(list) { setFactures(list); localStorage.setItem('renovexpert_factures', JSON.stringify(list)) }
  function toast3(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

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
    save(factures.map(f => f.id === id ? { ...f, status: 'payee', datePaiement: new Date().toISOString().split('T')[0] } : f))
    toast3('💚 Facture marquée payée !')
  }

  function markSent(id) {
    save(factures.map(f => f.id === id ? { ...f, status: 'envoyee' } : f))
    toast3('📤 Facture marquée envoyée')
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

        {/* List */}
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
                <div key={fac.id} style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderLeft: '4px solid ' + st.color }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem' }}>
                        <span style={{ fontWeight: '700', fontSize: '1rem', color: '#1e293b' }}>{fac.number}</span>
                        <span style={{ backgroundColor: st.bg, color: st.color, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{st.label}</span>
                      </div>
                      <p style={{ color: '#475569', fontSize: '0.88rem' }}>👤 {fac.clientName}</p>
                      {fac.devisRef && <p style={{ color: '#94a3b8', fontSize: '0.78rem' }}>Devis: {fac.devisRef}</p>}
                      <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem' }}>
                        📅 {fac.dateEmission}{fac.dateEcheance ? ` · Échéance ${fac.dateEcheance}` : ''}{fac.datePaiement ? ` · Payée ${fac.datePaiement}` : ''}
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '1.4rem', fontWeight: '800', color: st.color }}>{montantTTC.toFixed(0)} €</div>
                      <div style={{ fontSize: '0.72rem', color: '#94a3b8' }}>TTC · TVA {fac.tva}%</div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem', flexWrap: 'wrap' }}>
                    {(fac.status === 'envoyee' || fac.status === 'en_retard') && (
                      <button onClick={() => markPaid(fac.id)} style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1.5px solid #bbf7d0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>✅ Marquer payée</button>
                    )}
                    {fac.status === 'brouillon' && (
                      <button onClick={() => markSent(fac.id)} style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: '1.5px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>📤 Marquer envoyée</button>
                    )}
                    <button onClick={() => setPrintFac(fac)} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>🖨️ Imprimer</button>
                    <button onClick={() => { setForm({ ...fac }); setEditId(fac.id); setShowForm(true) }} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', padding: '0.4rem 0.8rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>✏️ Modifier</button>
                    <button onClick={() => { if (confirm('Supprimer ?')) { save(factures.filter(f => f.id !== fac.id)); toast3('Facture supprimée') } }} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.4rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>🗑️</button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Print modal */}
      {printFac && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ borderBottom: '3px solid #1e3a5f', paddingBottom: '1rem', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: '900', color: '#1e3a5f' }}>Renov<span style={{ color: '#d97706' }}>Expert</span></h2>
                {user && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>{user.company}</p>}
              </div>
              <div style={{ textAlign: 'right' }}>
                <h3 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a5f' }}>FACTURE</h3>
                <p style={{ fontWeight: '600', color: '#475569' }}>{printFac.number}</p>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div><p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Client</p><p style={{ fontWeight: '600', color: '#1e293b' }}>{printFac.clientName}</p></div>
              <div>
                <p style={{ fontSize: '0.72rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '0.3rem' }}>Dates</p>
                <p style={{ color: '#475569', fontSize: '0.88rem' }}>Émise le {printFac.dateEmission}</p>
                {printFac.dateEcheance && <p style={{ color: '#475569', fontSize: '0.88rem' }}>Échéance : {printFac.dateEcheance}</p>}
              </div>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
              <thead><tr style={{ backgroundColor: '#f8fafc' }}>
                <th style={{ padding: '0.7rem', textAlign: 'left', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Description</th>
                <th style={{ padding: '0.7rem', textAlign: 'right', fontSize: '0.8rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Montant HT</th>
              </tr></thead>
              <tbody><tr style={{ borderBottom: '1px solid #f1f5f9' }}>
                <td style={{ padding: '0.75rem', fontSize: '0.9rem' }}>
                  Travaux de rénovation{printFac.devisRef ? ` (réf. ${printFac.devisRef})` : ''}
                  {printFac.notes && <p style={{ color: '#64748b', fontSize: '0.78rem', marginTop: '0.2rem' }}>{printFac.notes}</p>}
                </td>
                <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '600' }}>{parseFloat(printFac.amount || 0).toFixed(2)} €</td>
              </tr></tbody>
              <tfoot>
                <tr><td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.88rem', color: '#64748b' }}>TVA ({printFac.tva}%)</td><td style={{ padding: '0.6rem', textAlign: 'right', fontSize: '0.88rem', color: '#64748b' }}>{(parseFloat(printFac.amount || 0) * parseFloat(printFac.tva || 0) / 100).toFixed(2)} €</td></tr>
                <tr style={{ borderTop: '2px solid #1e3a5f' }}>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '700', fontSize: '1rem', color: '#1e3a5f' }}>TOTAL TTC</td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '800', fontSize: '1.2rem', color: '#1e3a5f' }}>{(parseFloat(printFac.amount || 0) * (1 + parseFloat(printFac.tva || 0) / 100)).toFixed(2)} €</td>
                </tr>
              </tfoot>
            </table>
            <div style={{ display: 'flex', gap: '0.8rem', justifyContent: 'flex-end' }}>
              <button onClick={() => setPrintFac(null)} style={{ backgroundColor: '#f1f5f9', color: '#475569', border: '1.5px solid #e2e8f0', padding: '0.7rem 1.2rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '600' }}>Fermer</button>
              <button onClick={() => window.print()} style={{ backgroundColor: '#1e3a5f', color: 'white', border: 'none', padding: '0.7rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700' }}>🖨️ Imprimer / PDF</button>
            </div>
          </div>
        </div>
      )}

      {/* Form modal */}
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
                  <input type={f.type} value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
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
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Description des travaux..." rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button onClick={submit} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
                {editId ? '✅ Enregistrer' : '🎉 Créer la facture'}
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e3a5f', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600', zIndex: 400, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}
