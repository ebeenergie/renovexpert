'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const STORAGE_KEY = 'renovexpert_devis'
const TAX_RATES = [
  { label: 'TVA 5,5% (rénovation énergétique)', value: 5.5 },
  { label: 'TVA 10% (travaux de rénovation)', value: 10 },
  { label: 'TVA 20% (taux normal)', value: 20 },
]

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function generateNumero(list) {
  const year = new Date().getFullYear()
  const count = list.filter(d => d.numero?.startsWith(`DEV-${year}`)).length + 1
  return `DEV-${year}-${String(count).padStart(3, '0')}`
}

function loadDevis() {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') } catch { return [] }
}

function saveDevis(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const emptyForm = () => ({
  clientId: '',
  clientName: '',
  clientAddress: '',
  clientEmail: '',
  clientPhone: '',
  workDescription: '',
  items: [{ id: generateId(), description: '', quantity: 1, unitPrice: 0 }],
  laborCost: 0,
  taxRate: 10,
  notes: '',
  status: 'brouillon',
})

export default function DevisPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [devisList, setDevisList] = useState([])
  const [clients, setClients] = useState([])
  const [view, setView] = useState('list') // 'list' | 'create' | 'detail' | 'print'
  const [selected, setSelected] = useState(null)
  const [form, setForm] = useState(emptyForm())
  const [formError, setFormError] = useState('')

  useEffect(() => {
    const stored = localStorage.getItem('renovexpert_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored))
    setDevisList(loadDevis())
    setClients(JSON.parse(localStorage.getItem('renovexpert_clients') || '[]'))
  }, [router])

  const persistAndSet = (updated) => { saveDevis(updated); setDevisList(updated) }

  // Calculations
  const calcSubtotal = (items, laborCost) =>
    items.reduce((sum, it) => sum + (parseFloat(it.quantity) || 0) * (parseFloat(it.unitPrice) || 0), 0) + (parseFloat(laborCost) || 0)
  const calcTax = (subtotal, rate) => subtotal * rate / 100
  const calcTotal = (subtotal, tax) => subtotal + tax

  const subtotal = calcSubtotal(form.items, form.laborCost)
  const tax = calcTax(subtotal, form.taxRate)
  const total = calcTotal(subtotal, tax)

  const fmt = (n) => n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €'

  // Item management
  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { id: generateId(), description: '', quantity: 1, unitPrice: 0 }] }))
  const removeItem = (id) => setForm(f => ({ ...f, items: f.items.filter(it => it.id !== id) }))
  const updateItem = (id, field, value) => setForm(f => ({ ...f, items: f.items.map(it => it.id === id ? { ...it, [field]: value } : it) }))

  const handleCreate = () => {
    if (!form.clientName.trim()) { setFormError('Le nom du client est requis.'); return }
    if (!form.workDescription.trim()) { setFormError('La description des travaux est requise.'); return }
    const newDevis = {
      id: generateId(),
      numero: generateNumero(devisList),
      artisanName: user.name,
      artisanCompany: user.company,
      clientId: form.clientId || undefined,
      ...form,
      laborCost: parseFloat(form.laborCost) || 0,
      items: form.items.map(it => ({ ...it, quantity: parseFloat(it.quantity) || 0, unitPrice: parseFloat(it.unitPrice) || 0 })),
      createdAt: new Date().toLocaleDateString('fr-FR'),
    }
    const updated = [newDevis, ...devisList]
    persistAndSet(updated)
    setSelected(newDevis)
    setView('detail')
    setForm(emptyForm())
    setFormError('')
  }

  const handleDelete = (id) => {
    if (!confirm('Supprimer ce devis définitivement ?')) return
    const updated = devisList.filter(d => d.id !== id)
    persistAndSet(updated)
    if (selected?.id === id) { setSelected(null); setView('list') }
  }

  const handleStatusChange = (id, status) => {
    const updated = devisList.map(d => d.id === id ? { ...d, status } : d)
    persistAndSet(updated)
    if (selected?.id === id) setSelected(updated.find(d => d.id === id))
  }

  const handlePrint = () => window.print()

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p style={{ color: '#64748b' }}>Chargement...</p></div>

  const STATUS_COLORS = {
    brouillon: { bg: '#f1f5f9', color: '#475569' },
    envoye: { bg: '#dbeafe', color: '#1d4ed8' },
    accepte: { bg: '#dcfce7', color: '#15803d' },
    refuse: { bg: '#fee2e2', color: '#dc2626' },
  }
  const STATUS_LABELS = { brouillon: 'Brouillon', envoye: 'Envoyé', accepte: 'Accepté', refuse: 'Refusé' }

  // Print view
  if (view === 'print' && selected) {
    const sub = calcSubtotal(selected.items, selected.laborCost)
    const tx = calcTax(sub, selected.taxRate)
    const tot = calcTotal(sub, tx)
    return (
      <div style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto', padding: '2rem', backgroundColor: 'white' }}>
        <div className="no-print" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.8rem' }}>
          <button onClick={handlePrint} style={{ backgroundColor: '#1e3a5f', color: 'white', border: 'none', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700' }}>🖨 Imprimer / Sauvegarder PDF</button>
          <button onClick={() => setView('detail')} style={{ backgroundColor: 'white', border: '1px solid #e2e8f0', color: '#64748b', padding: '0.8rem 1.5rem', borderRadius: '8px', cursor: 'pointer' }}>← Retour</button>
        </div>
        <div className="print-page">
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2rem', paddingBottom: '1.5rem', borderBottom: '2px solid #1e3a5f' }}>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: '800', color: '#1e3a5f' }}>Renov<span style={{ color: '#d97706' }}>Expert</span></div>
              <div style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.5rem' }}>{selected.artisanName} · {selected.artisanCompany}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e3a5f' }}>DEVIS</div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selected.numero}</div>
              <div style={{ color: '#64748b', fontSize: '0.9rem' }}>Date : {selected.createdAt}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2rem' }}>
            <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontWeight: '700', color: '#1e3a5f', marginBottom: '0.5rem' }}>CLIENT</div>
              <div style={{ fontWeight: '700' }}>{selected.clientName}</div>
              {selected.clientAddress && <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selected.clientAddress}</div>}
              {selected.clientEmail && <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selected.clientEmail}</div>}
              {selected.clientPhone && <div style={{ color: '#64748b', fontSize: '0.9rem' }}>{selected.clientPhone}</div>}
            </div>
            <div style={{ flex: 1, backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px' }}>
              <div style={{ fontWeight: '700', color: '#1e3a5f', marginBottom: '0.5rem' }}>OBJET</div>
              <div style={{ fontSize: '0.95rem' }}>{selected.workDescription}</div>
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.5rem' }}>
            <thead>
              <tr style={{ backgroundColor: '#1e3a5f', color: 'white' }}>
                <th style={{ padding: '0.8rem', textAlign: 'left', fontSize: '0.85rem' }}>Description</th>
                <th style={{ padding: '0.8rem', textAlign: 'center', fontSize: '0.85rem', width: '80px' }}>Qté</th>
                <th style={{ padding: '0.8rem', textAlign: 'right', fontSize: '0.85rem', width: '120px' }}>P.U. HT</th>
                <th style={{ padding: '0.8rem', textAlign: 'right', fontSize: '0.85rem', width: '120px' }}>Total HT</th>
              </tr>
            </thead>
            <tbody>
              {selected.items.map((it, i) => (
                <tr key={it.id} style={{ backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc' }}>
                  <td style={{ padding: '0.7rem 0.8rem', fontSize: '0.9rem' }}>{it.description || '-'}</td>
                  <td style={{ padding: '0.7rem 0.8rem', textAlign: 'center', fontSize: '0.9rem' }}>{it.quantity}</td>
                  <td style={{ padding: '0.7rem 0.8rem', textAlign: 'right', fontSize: '0.9rem' }}>{fmt(it.unitPrice)}</td>
                  <td style={{ padding: '0.7rem 0.8rem', textAlign: 'right', fontSize: '0.9rem' }}>{fmt(it.quantity * it.unitPrice)}</td>
                </tr>
              ))}
              {selected.laborCost > 0 && (
                <tr style={{ backgroundColor: '#f8fafc' }}>
                  <td style={{ padding: '0.7rem 0.8rem', fontSize: '0.9rem' }}>Main d'œuvre</td>
                  <td style={{ padding: '0.7rem 0.8rem', textAlign: 'center', fontSize: '0.9rem' }}>1</td>
                  <td style={{ padding: '0.7rem 0.8rem', textAlign: 'right', fontSize: '0.9rem' }}>{fmt(selected.laborCost)}</td>
                  <td style={{ padding: '0.7rem 0.8rem', textAlign: 'right', fontSize: '0.9rem' }}>{fmt(selected.laborCost)}</td>
                </tr>
              )}
            </tbody>
          </table>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '1.5rem' }}>
            <div style={{ width: '280px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>Total HT</span><span style={{ fontWeight: '600' }}>{fmt(sub)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ color: '#64748b' }}>TVA ({selected.taxRate}%)</span><span style={{ fontWeight: '600' }}>{fmt(tx)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.7rem 0', backgroundColor: '#1e3a5f', color: 'white', marginTop: '0.5rem', borderRadius: '6px', padding: '0.8rem 1rem' }}>
                <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>TOTAL TTC</span><span style={{ fontWeight: '800', fontSize: '1.2rem' }}>{fmt(tot)}</span>
              </div>
            </div>
          </div>

          {selected.notes && (
            <div style={{ backgroundColor: '#f8fafc', padding: '1rem', borderRadius: '8px', marginBottom: '1.5rem' }}>
              <div style={{ fontWeight: '700', color: '#1e3a5f', marginBottom: '0.4rem' }}>Notes</div>
              <div style={{ fontSize: '0.9rem', color: '#374151' }}>{selected.notes}</div>
            </div>
          )}

          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '1rem', fontSize: '0.8rem', color: '#94a3b8', textAlign: 'center' }}>
            Devis valable 30 jours. Signature précédée de la mention "Bon pour accord".
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      {/* Navbar */}
      <nav className="no-print" style={{ backgroundColor: '#1e3a5f', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 100 }}>
        <Link href="/" style={{ color: 'white', fontSize: '1.3rem', fontWeight: 'bold' }}>
          Renov<span style={{ color: '#d97706' }}>Expert</span>
        </Link>
        <div style={{ display: 'flex', gap: '0.8rem', alignItems: 'center' }}>
          <span style={{ color: '#94a3b8', fontSize: '0.8rem' }}>👤 {user.name}</span>
          <button onClick={() => { localStorage.removeItem('renovexpert_user'); router.push('/') }}
            style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#cbd5e1', padding: '0.3rem 0.7rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.8rem' }}>
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="page-layout no-print">
        {/* Left panel */}
        <div className="sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.25rem' }}>📄 Mes Devis</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>{devisList.length} devis</p>
            <button onClick={() => { setView('create'); setFormError('') }}
              style={{ width: '100%', backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
              + Nouveau devis
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {devisList.length === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                Aucun devis.<br />Créez votre premier devis.
              </div>
            )}
            {devisList.map((d) => {
              const sub = calcSubtotal(d.items, d.laborCost)
              const tot = calcTotal(sub, calcTax(sub, d.taxRate))
              const isActive = selected?.id === d.id && (view === 'detail' || view === 'print')
              const sc = STATUS_COLORS[d.status] || STATUS_COLORS.brouillon
              return (
                <div key={d.id} onClick={() => { setSelected(d); setView('detail') }}
                  style={{ backgroundColor: isActive ? '#1e3a5f' : 'white', borderRadius: '12px', padding: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `2px solid ${isActive ? '#d97706' : 'transparent'}`, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: isActive ? 'white' : '#1e3a5f' }}>{d.clientName}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: sc.bg, color: sc.color }}>{STATUS_LABELS[d.status]}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: isActive ? '#94a3b8' : '#64748b', marginBottom: '0.3rem' }}>{d.numero} · {d.createdAt}</div>
                  <div style={{ fontSize: '0.88rem', fontWeight: '700', color: isActive ? '#fbbf24' : '#d97706' }}>{fmt(tot)}</div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Main panel */}
        <div className="main-panel">

          {/* CREATE FORM */}
          {view === 'create' && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '1.5rem' }}>📄 Nouveau devis</h2>
              {formError && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.8rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' }}>{formError}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                {/* Client info */}
                <div style={{ padding: '1.2rem', backgroundColor: '#f8fafc', borderRadius: '10px' }}>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>👤 Informations client</h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                  {clients.length > 0 && (
                    <div>
                      <label style={labelStyle}>Choisir un client existant</label>
                      <select
                        value={form.clientId}
                        onChange={e => {
                          const c = clients.find(cl => cl.id === e.target.value)
                          if (c) setForm(f => ({ ...f, clientId: c.id, clientName: c.nom, clientAddress: c.adresse || f.clientAddress, clientEmail: c.email || f.clientEmail, clientPhone: c.telephone || f.clientPhone }))
                          else setForm(f => ({ ...f, clientId: '', clientName: '', clientAddress: '', clientEmail: '', clientPhone: '' }))
                        }}
                        style={{ ...inputStyle, backgroundColor: 'white' }}
                      >
                        <option value="">— Nouveau client / saisie manuelle —</option>
                        {clients.map(c => (
                          <option key={c.id} value={c.id}>{c.nom}{c.entreprise ? ` (${c.entreprise})` : ''}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Nom du client *</label>
                      <input value={form.clientName} onChange={e => setForm(f => ({ ...f, clientName: e.target.value }))} placeholder="Jean Dupont" style={inputStyle} />
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={labelStyle}>Adresse</label>
                      <input value={form.clientAddress} onChange={e => setForm(f => ({ ...f, clientAddress: e.target.value }))} placeholder="12 rue des Lilas, 75011 Paris" style={inputStyle} />
                    </div>
                    <div>
                      <label style={labelStyle}>Email</label>
                      <input value={form.clientEmail} onChange={e => setForm(f => ({ ...f, clientEmail: e.target.value }))} placeholder="client@email.fr" style={inputStyle} type="email" />
                    </div>
                    <div>
                      <label style={labelStyle}>Téléphone</label>
                      <input value={form.clientPhone} onChange={e => setForm(f => ({ ...f, clientPhone: e.target.value }))} placeholder="06 00 00 00 00" style={inputStyle} type="tel" />
                    </div>
                  </div>
                  </div>
                </div>

                {/* Work description */}
                <div>
                  <label style={labelStyle}>Description des travaux *</label>
                  <textarea value={form.workDescription} onChange={e => setForm(f => ({ ...f, workDescription: e.target.value }))} placeholder="Ex : Installation d'une pompe à chaleur air/eau..." rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                {/* Line items */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.8rem' }}>
                    <label style={{ ...labelStyle, marginBottom: 0 }}>🔧 Fournitures & matériaux</label>
                    <button onClick={addItem} style={{ backgroundColor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' }}>+ Ajouter une ligne</button>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 40px', gap: '0.5rem' }}>
                      {['Description', 'Qté', 'Prix unitaire HT', ''].map((h, i) => (
                        <div key={i} style={{ fontSize: '0.78rem', fontWeight: '600', color: '#64748b', padding: '0 0.2rem' }}>{h}</div>
                      ))}
                    </div>
                    {form.items.map((it) => (
                      <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 110px 40px', gap: '0.5rem', alignItems: 'center' }}>
                        <input value={it.description} onChange={e => updateItem(it.id, 'description', e.target.value)} placeholder="Ex : Laine de verre 200mm" style={{ ...inputStyle, padding: '0.6rem 0.8rem' }} />
                        <input value={it.quantity} onChange={e => updateItem(it.id, 'quantity', e.target.value)} type="number" min="0" step="0.01" style={{ ...inputStyle, padding: '0.6rem 0.5rem', textAlign: 'center' }} />
                        <input value={it.unitPrice} onChange={e => updateItem(it.id, 'unitPrice', e.target.value)} type="number" min="0" step="0.01" placeholder="0.00" style={{ ...inputStyle, padding: '0.6rem 0.8rem', textAlign: 'right' }} />
                        <button onClick={() => removeItem(it.id)} disabled={form.items.length === 1}
                          style={{ backgroundColor: 'transparent', border: '1px solid #fca5a5', color: '#dc2626', borderRadius: '6px', cursor: form.items.length === 1 ? 'not-allowed' : 'pointer', fontSize: '1rem', height: '40px', opacity: form.items.length === 1 ? 0.4 : 1 }}>×</button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Labor & tax */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={labelStyle}>💪 Main d'œuvre (HT)</label>
                    <input value={form.laborCost} onChange={e => setForm(f => ({ ...f, laborCost: e.target.value }))} type="number" min="0" step="0.01" placeholder="0.00 €" style={inputStyle} />
                  </div>
                  <div>
                    <label style={labelStyle}>📊 Taux de TVA</label>
                    <select value={form.taxRate} onChange={e => setForm(f => ({ ...f, taxRate: parseFloat(e.target.value) }))} style={{ ...inputStyle, backgroundColor: 'white' }}>
                      {TAX_RATES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                  </div>
                </div>

                {/* Totals preview */}
                <div style={{ backgroundColor: '#1e3a5f', borderRadius: '12px', padding: '1.2rem', color: 'white' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ color: '#94a3b8' }}>Total HT</span>
                    <span style={{ fontWeight: '600' }}>{fmt(subtotal)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
                    <span style={{ color: '#94a3b8' }}>TVA ({form.taxRate}%)</span>
                    <span style={{ fontWeight: '600' }}>{fmt(tax)}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.8rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '1.1rem' }}>TOTAL TTC</span>
                    <span style={{ fontWeight: '800', fontSize: '1.3rem', color: '#fbbf24' }}>{fmt(total)}</span>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label style={labelStyle}>Notes (facultatif)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Conditions particulières, délai d'exécution..." rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                </div>

                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <button onClick={handleCreate} style={{ flex: 1, backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
                    Créer le devis →
                  </button>
                  <button onClick={() => setView('list')} style={{ padding: '1rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && selected && (() => {
            const sub = calcSubtotal(selected.items, selected.laborCost)
            const tx = calcTax(sub, selected.taxRate)
            const tot = calcTotal(sub, tx)
            const sc = STATUS_COLORS[selected.status] || STATUS_COLORS.brouillon
            return (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* Header */}
                <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a5f' }}>{selected.clientName}</h2>
                        <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.7rem', borderRadius: '999px', backgroundColor: sc.bg, color: sc.color }}>{STATUS_LABELS[selected.status]}</span>
                      </div>
                      <div style={{ fontSize: '0.88rem', color: '#64748b' }}>{selected.numero} · {selected.createdAt}</div>
                      {selected.clientAddress && <div style={{ fontSize: '0.88rem', color: '#64748b' }}>📍 {selected.clientAddress}</div>}
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      <button onClick={() => setView('print')} style={{ backgroundColor: '#1e3a5f', color: 'white', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.9rem', fontWeight: '600' }}>🖨 Imprimer</button>
                      <button onClick={() => handleDelete(selected.id)} style={{ backgroundColor: 'transparent', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>🗑</button>
                    </div>
                  </div>

                  {/* Status change */}
                  <div style={{ marginTop: '1rem' }}>
                    <div style={{ fontSize: '0.82rem', fontWeight: '600', color: '#64748b', marginBottom: '0.5rem' }}>Statut du devis :</div>
                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                      {Object.entries(STATUS_LABELS).map(([key, label]) => {
                        const c = STATUS_COLORS[key]
                        const isActive = selected.status === key
                        return (
                          <button key={key} onClick={() => handleStatusChange(selected.id, key)}
                            style={{ padding: '0.4rem 0.9rem', borderRadius: '6px', border: `1.5px solid ${isActive ? c.color : '#d1d5db'}`, backgroundColor: isActive ? c.bg : 'white', color: isActive ? c.color : '#64748b', cursor: 'pointer', fontSize: '0.82rem', fontWeight: '600', transition: 'all 0.1s' }}>
                            {label}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>

                {/* Items table */}
                <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                  <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>🔧 Détail des prestations</h3>
                  <div style={{ marginBottom: '0.5rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 120px 120px', gap: '0.5rem', padding: '0.5rem 0.8rem', backgroundColor: '#f1f5f9', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '700', color: '#64748b' }}>
                      <span>Description</span><span style={{ textAlign: 'center' }}>Qté</span><span style={{ textAlign: 'right' }}>P.U. HT</span><span style={{ textAlign: 'right' }}>Total HT</span>
                    </div>
                    {selected.items.map((it, i) => (
                      <div key={it.id} style={{ display: 'grid', gridTemplateColumns: '1fr 70px 120px 120px', gap: '0.5rem', padding: '0.6rem 0.8rem', backgroundColor: i % 2 === 0 ? 'white' : '#f8fafc', fontSize: '0.9rem' }}>
                        <span>{it.description || '-'}</span>
                        <span style={{ textAlign: 'center' }}>{it.quantity}</span>
                        <span style={{ textAlign: 'right' }}>{fmt(it.unitPrice)}</span>
                        <span style={{ textAlign: 'right', fontWeight: '600' }}>{fmt(it.quantity * it.unitPrice)}</span>
                      </div>
                    ))}
                    {selected.laborCost > 0 && (
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 70px 120px 120px', gap: '0.5rem', padding: '0.6rem 0.8rem', backgroundColor: '#fafafa', fontSize: '0.9rem' }}>
                        <span>Main d'œuvre</span><span style={{ textAlign: 'center' }}>1</span><span style={{ textAlign: 'right' }}>{fmt(selected.laborCost)}</span><span style={{ textAlign: 'right', fontWeight: '600' }}>{fmt(selected.laborCost)}</span>
                      </div>
                    )}
                  </div>

                  {/* Totals */}
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <div style={{ width: '260px', backgroundColor: '#1e3a5f', borderRadius: '10px', padding: '1rem', color: 'white' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                        <span style={{ color: '#94a3b8' }}>Total HT</span><span>{fmt(sub)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                        <span style={{ color: '#94a3b8' }}>TVA ({selected.taxRate}%)</span><span>{fmt(tx)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.2)', paddingTop: '0.6rem' }}>
                        <span style={{ fontWeight: '700' }}>TOTAL TTC</span><span style={{ fontWeight: '800', fontSize: '1.1rem', color: '#fbbf24' }}>{fmt(tot)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {selected.notes && (
                  <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '0.5rem' }}>Notes</h3>
                    <p style={{ fontSize: '0.9rem', color: '#374151' }}>{selected.notes}</p>
                  </div>
                )}
              </div>
            )
          })()}

          {/* EMPTY STATE */}
          {view === 'list' && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '4rem 2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📄</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '0.5rem' }}>Générez vos devis en 2 minutes</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '360px', margin: '0 auto 1.5rem' }}>
                Créez des devis professionnels conformes MPR et CEE. Calcul automatique de la TVA, impression PDF.
              </p>
              <button onClick={() => { setView('create'); setFormError('') }}
                style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1.05rem' }}>
                + Créer mon premier devis
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

const labelStyle = { display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }
const inputStyle = { width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }
