'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'
import { CATEGORIES, UNITS, PRESET_CATALOGUE } from './data'

const blank = { id: '', type: 'service', category: 'isolation', name: '', description: '', reference: '', supplier: '', unitPrice: '', unit: 'forfait' }

export default function CataloguePage() {
  const [user, setUser] = useState(null)
  const [items, setItems] = useState([])
  const [typeFilter, setTypeFilter] = useState('tous')
  const [catFilter, setCatFilter] = useState('tous')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(blank)
  const [toast, setToast] = useState('')
  const router = useRouter()

  useEffect(() => {
    const u = localStorage.getItem('renovexpert_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    const stored = localStorage.getItem('renovexpert_catalogue')
    if (!stored) {
      localStorage.setItem('renovexpert_catalogue', JSON.stringify(PRESET_CATALOGUE))
      setItems(PRESET_CATALOGUE)
    } else {
      setItems(JSON.parse(stored))
    }
  }, [router])

  function save(list) { setItems(list); localStorage.setItem('renovexpert_catalogue', JSON.stringify(list)) }
  function toast3(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function openNew(type = 'service') {
    setForm({ ...blank, id: Date.now().toString(), type })
    setEditId(null)
    setShowForm(true)
  }

  function openEdit(item) { setForm({ ...item }); setEditId(item.id); setShowForm(true) }

  function submit() {
    if (!form.name.trim()) { alert('Le nom est obligatoire'); return }
    if (!form.unitPrice) { alert('Le prix unitaire est obligatoire'); return }
    if (editId) {
      save(items.map(i => i.id === editId ? { ...form, unitPrice: parseFloat(form.unitPrice) } : i))
      toast3('✅ Élément modifié !')
    } else {
      save([...items, { ...form, unitPrice: parseFloat(form.unitPrice) }])
      toast3('🎉 Élément ajouté au catalogue !')
    }
    setShowForm(false)
  }

  function deleteItem(id) {
    if (!confirm('Supprimer cet élément du catalogue ?')) return
    save(items.filter(i => i.id !== id))
    toast3('Élément supprimé')
  }

  const filtered = items.filter(item => {
    if (typeFilter !== 'tous' && item.type !== typeFilter) return false
    if (catFilter !== 'tous' && item.category !== catFilter) return false
    if (search) {
      const q = search.toLowerCase()
      return item.name.toLowerCase().includes(q) ||
        (item.description || '').toLowerCase().includes(q) ||
        (item.supplier || '').toLowerCase().includes(q)
    }
    return true
  })

  const counts = {
    tous: items.length,
    service: items.filter(i => i.type === 'service').length,
    product: items.filter(i => i.type === 'product').length,
  }

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '1.5rem', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1rem' }}>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>📖 Mon Catalogue</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{items.length} prestation{items.length !== 1 ? 's' : ''} & matériaux</p>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher une prestation, un matériau..."
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none', fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      {/* Big action buttons */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', padding: '1rem 1.5rem' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button onClick={() => openNew('service')}
            style={{ flex: 1, minWidth: '200px', backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '1rem 1.5rem', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}>
            🔧 Ajouter une prestation
          </button>
          <button onClick={() => openNew('product')}
            style={{ flex: 1, minWidth: '200px', backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '1rem 1.5rem', borderRadius: '14px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 4px 12px rgba(124,58,237,0.3)' }}>
            📦 Ajouter un matériau
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Type filter */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', flexWrap: 'wrap' }}>
          {[
            { key: 'tous',    label: 'Tout',        color: '#1e3a5f' },
            { key: 'service', label: '🔧 Prestations', color: '#2563eb' },
            { key: 'product', label: '📦 Matériaux',   color: '#7c3aed' },
          ].map(t => (
            <button key={t.key} onClick={() => setTypeFilter(t.key)}
              style={{ padding: '0.5rem 1.1rem', borderRadius: '20px', border: '2px solid', borderColor: typeFilter === t.key ? t.color : '#e2e8f0', backgroundColor: typeFilter === t.key ? t.color : 'white', color: typeFilter === t.key ? 'white' : '#64748b', fontWeight: '700', fontSize: '0.85rem', cursor: 'pointer' }}>
              {t.label} ({counts[t.key]})
            </button>
          ))}
        </div>

        {/* Category filter */}
        <div style={{ display: 'flex', gap: '0.4rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          <button onClick={() => setCatFilter('tous')}
            style={{ padding: '0.35rem 0.8rem', borderRadius: '20px', border: '2px solid', borderColor: catFilter === 'tous' ? '#475569' : '#e2e8f0', backgroundColor: catFilter === 'tous' ? '#475569' : 'white', color: catFilter === 'tous' ? 'white' : '#64748b', fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer' }}>
            Toutes catégories
          </button>
          {Object.entries(CATEGORIES).map(([key, cat]) => {
            const count = items.filter(i => i.category === key && (typeFilter === 'tous' || i.type === typeFilter)).length
            if (count === 0) return null
            return (
              <button key={key} onClick={() => setCatFilter(key)}
                style={{ padding: '0.35rem 0.8rem', borderRadius: '20px', border: '2px solid', borderColor: catFilter === key ? cat.color : '#e2e8f0', backgroundColor: catFilter === key ? cat.bg : 'white', color: catFilter === key ? cat.color : '#64748b', fontWeight: '600', fontSize: '0.78rem', cursor: 'pointer' }}>
                {cat.icon} {cat.label} ({count})
              </button>
            )
          })}
        </div>

        {/* Cards grid */}
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '16px', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📖</div>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Aucun élément trouvé</h3>
            <p style={{ marginBottom: '1.5rem' }}>Ajoutez vos prestations et matériaux habituels.</p>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => openNew('service')} style={{ backgroundColor: '#2563eb', color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' }}>
                🔧 Ajouter une prestation
              </button>
              <button onClick={() => openNew('product')} style={{ backgroundColor: '#7c3aed', color: 'white', border: 'none', padding: '0.85rem 1.5rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' }}>
                📦 Ajouter un matériau
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {filtered.map(item => {
              const cat = CATEGORIES[item.category] || CATEGORIES.autre
              return (
                <div key={item.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', borderTop: `4px solid ${cat.color}`, display: 'flex', flexDirection: 'column' }}>
                  <div style={{ padding: '1.2rem', flex: 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, minWidth: 0 }}>
                        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>{cat.icon}</span>
                        <span style={{ fontWeight: '700', fontSize: '0.95rem', color: '#1e293b', lineHeight: 1.3 }}>{item.name}</span>
                      </div>
                      <span style={{ backgroundColor: cat.bg, color: cat.color, padding: '0.15rem 0.5rem', borderRadius: '20px', fontSize: '0.68rem', fontWeight: '700', flexShrink: 0, marginLeft: '0.5rem' }}>
                        {cat.label}
                      </span>
                    </div>
                    {item.description && (
                      <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '0.6rem', lineHeight: 1.5 }}>
                        {item.description}
                      </p>
                    )}
                    {item.type === 'product' && (item.reference || item.supplier) && (
                      <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.5rem' }}>
                        {item.reference && <span>Réf: {item.reference}</span>}
                        {item.reference && item.supplier && ' · '}
                        {item.supplier && <span>{item.supplier}</span>}
                      </p>
                    )}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
                      <span style={{ fontSize: '1.3rem', fontWeight: '800', color: cat.color }}>{item.unitPrice} €</span>
                      <span style={{ fontSize: '0.8rem', color: '#94a3b8', fontWeight: '500' }}>/ {item.unit}</span>
                      <span style={{ marginLeft: 'auto', backgroundColor: item.type === 'service' ? '#dbeafe' : '#ede9fe', color: item.type === 'service' ? '#2563eb' : '#7c3aed', padding: '0.15rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600' }}>
                        {item.type === 'service' ? 'Prestation' : 'Matériau'}
                      </span>
                    </div>
                  </div>
                  <div style={{ padding: '0.75rem 1.2rem', borderTop: '1px solid #f1f5f9', display: 'flex', gap: '0.5rem' }}>
                    <button onClick={() => openEdit(item)}
                      style={{ flex: 1, backgroundColor: '#f8fafc', color: '#475569', border: '1.5px solid #e2e8f0', padding: '0.45rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                      ✏️ Modifier
                    </button>
                    <button onClick={() => deleteItem(item.id)}
                      style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.45rem 0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.82rem' }}>
                      🗑️
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Add/edit modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '2rem', width: '100%', maxWidth: '620px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f' }}>
                {editId ? '✏️ Modifier' : form.type === 'service' ? '🔧 Nouvelle prestation' : '📦 Nouveau matériau'}
              </h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

              {/* Type toggle */}
              <div>
                <label style={lbl}>Type</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {[{ key: 'service', label: '🔧 Prestation' }, { key: 'product', label: '📦 Matériau' }].map(t => (
                    <button key={t.key} onClick={() => setForm(f => ({ ...f, type: t.key }))}
                      style={{ flex: 1, padding: '0.7rem', borderRadius: '10px', border: '2px solid', borderColor: form.type === t.key ? '#1e3a5f' : '#e2e8f0', backgroundColor: form.type === t.key ? '#1e3a5f' : 'white', color: form.type === t.key ? 'white' : '#64748b', fontWeight: '700', cursor: 'pointer' }}>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Category */}
              <div>
                <label style={lbl}>Catégorie</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.4rem' }}>
                  {Object.entries(CATEGORIES).map(([key, cat]) => (
                    <button key={key} onClick={() => setForm(f => ({ ...f, category: key }))}
                      style={{ padding: '0.55rem 0.4rem', borderRadius: '8px', border: '2px solid', borderColor: form.category === key ? cat.color : '#e2e8f0', backgroundColor: form.category === key ? cat.bg : 'white', color: form.category === key ? cat.color : '#64748b', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {cat.icon} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label style={lbl}>Nom *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex : Isolation combles perdus"
                  style={inp} />
              </div>

              <div>
                <label style={lbl}>Description</label>
                <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Détails de la prestation ou du matériau..." rows={2}
                  style={{ ...inp, resize: 'vertical' }} />
              </div>

              {form.type === 'product' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                  <div>
                    <label style={lbl}>Référence</label>
                    <input value={form.reference} onChange={e => setForm(f => ({ ...f, reference: e.target.value }))} placeholder="Ex : LV-200" style={inp} />
                  </div>
                  <div>
                    <label style={lbl}>Fournisseur</label>
                    <input value={form.supplier} onChange={e => setForm(f => ({ ...f, supplier: e.target.value }))} placeholder="Ex : Isover" style={inp} />
                  </div>
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div>
                  <label style={lbl}>Prix unitaire HT (€) *</label>
                  <input type="number" min="0" step="0.01" value={form.unitPrice} onChange={e => setForm(f => ({ ...f, unitPrice: e.target.value }))} placeholder="0.00"
                    style={inp} />
                </div>
                <div>
                  <label style={lbl}>Unité</label>
                  <select value={form.unit} onChange={e => setForm(f => ({ ...f, unit: e.target.value }))} style={{ ...inp, backgroundColor: 'white' }}>
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <button onClick={submit}
                style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                {editId ? '✅ Enregistrer' : '🎉 Ajouter au catalogue'}
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

const lbl = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }
const inp = { width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }
