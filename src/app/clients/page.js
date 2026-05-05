'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

const STATUS = {
  prospect: { label: 'Prospect', color: '#2563eb', bg: '#dbeafe' },
  actif: { label: 'Client actif', color: '#16a34a', bg: '#dcfce7' },
  termine: { label: 'Terminé', color: '#64748b', bg: '#f1f5f9' },
}

const AVATAR_COLORS = ['#1e3a5f', '#7c3aed', '#dc2626', '#d97706', '#059669', '#0891b2', '#be185d']

function initials(name) {
  return (name || '').split(' ').filter(Boolean).map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
}
function avatarColor(name) {
  return AVATAR_COLORS[(name || 'A').charCodeAt(0) % AVATAR_COLORS.length]
}

const emptyClient = { id: '', nom: '', entreprise: '', telephone: '', email: '', adresse: '', siret: '', status: 'prospect', notes: '' }

export default function ClientsPage() {
  const [user, setUser] = useState(null)
  const [clients, setClients] = useState([])
  const [filter, setFilter] = useState('tous')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(emptyClient)
  const [selectedId, setSelectedId] = useState(null)
  const [toast, setToast] = useState('')
  const router = useRouter()

  useEffect(() => {
    const u = localStorage.getItem('renovexpert_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    setClients(JSON.parse(localStorage.getItem('renovexpert_clients') || '[]'))
  }, [router])

  function save(list) {
    setClients(list)
    localStorage.setItem('renovexpert_clients', JSON.stringify(list))
  }
  function toast3(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function openNew() {
    setForm({ ...emptyClient, id: Date.now().toString() })
    setEditId(null)
    setShowForm(true)
  }
  function openEdit(c) { setForm({ ...c }); setEditId(c.id); setShowForm(true) }

  function submitForm() {
    if (!form.nom.trim()) { alert('Le nom est obligatoire'); return }
    if (editId) {
      save(clients.map(c => c.id === editId ? form : c))
      toast3('✅ Client modifié !')
    } else {
      save([...clients, form])
      toast3('🎉 Nouveau client ajouté !')
    }
    setShowForm(false)
  }

  function deleteClient(id) {
    if (!confirm('Supprimer ce client ?')) return
    save(clients.filter(c => c.id !== id))
    if (selectedId === id) setSelectedId(null)
    toast3('Client supprimé')
  }

  function getHistory(clientId) {
    const dossiers = JSON.parse(localStorage.getItem('renovexpert_dossiers') || '[]')
    const devis = JSON.parse(localStorage.getItem('renovexpert_devis') || '[]')
    const factures = JSON.parse(localStorage.getItem('renovexpert_factures') || '[]')
    return {
      dossiers: dossiers.filter(d => d.clientId === clientId),
      devis: devis.filter(d => d.clientId === clientId),
      factures: factures.filter(f => f.clientId === clientId),
    }
  }

  const filtered = clients.filter(c => {
    if (filter !== 'tous' && c.status !== filter) return false
    const q = search.toLowerCase()
    return !q || c.nom.toLowerCase().includes(q) || (c.entreprise || '').toLowerCase().includes(q)
  })

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '1.5rem', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>👥 Mes Clients</h1>
              <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{clients.length} client{clients.length > 1 ? 's' : ''}</p>
            </div>
            <button onClick={openNew}
              style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' }}>
              + Nouveau client
            </button>
          </div>
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="🔍 Rechercher un client..."
            style={{ width: '100%', padding: '0.75rem 1rem', borderRadius: '10px', border: 'none', fontSize: '0.9rem', backgroundColor: 'rgba(255,255,255,0.1)', color: 'white', outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {[
            { key: 'tous', label: 'Tous', color: '#1e3a5f', bg: '#dbeafe' },
            { key: 'prospect', label: 'Prospects', color: '#2563eb', bg: '#dbeafe' },
            { key: 'actif', label: 'Actifs', color: '#16a34a', bg: '#dcfce7' },
            { key: 'termine', label: 'Terminés', color: '#64748b', bg: '#f1f5f9' },
          ].map(tab => (
            <button key={tab.key} onClick={() => setFilter(tab.key)}
              style={{ padding: '0.5rem 1rem', borderRadius: '20px', border: '2px solid', borderColor: filter === tab.key ? tab.color : '#e2e8f0', backgroundColor: filter === tab.key ? tab.color : 'white', color: filter === tab.key ? 'white' : '#64748b', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
              {tab.label} ({tab.key === 'tous' ? clients.length : clients.filter(c => c.status === tab.key).length})
            </button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '4rem 2rem', backgroundColor: 'white', borderRadius: '16px', color: '#64748b' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
            <h3 style={{ fontWeight: '700', marginBottom: '0.5rem' }}>Aucun client trouvé</h3>
            <p style={{ marginBottom: '1.5rem' }}>Ajoutez votre premier client pour commencer !</p>
            <button onClick={openNew} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.85rem 2rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
              + Ajouter un client
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {filtered.map(client => {
              const st = STATUS[client.status] || STATUS.prospect
              const history = getHistory(client.id)
              const isOpen = selectedId === client.id
              return (
                <div key={client.id} style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: isOpen ? '0 4px 20px rgba(30,58,95,0.12)' : '0 2px 8px rgba(0,0,0,0.06)', border: isOpen ? '2px solid #1e3a5f' : '2px solid transparent', transition: 'all 0.2s' }}>
                  <div style={{ padding: '1.2rem', display: 'flex', gap: '1rem', alignItems: 'center', cursor: 'pointer' }}
                    onClick={() => setSelectedId(isOpen ? null : client.id)}>
                    <div style={{ width: '54px', height: '54px', borderRadius: '14px', backgroundColor: avatarColor(client.nom), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: '800', fontSize: '1.2rem', flexShrink: 0 }}>
                      {initials(client.nom)}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: '700', fontSize: '1.05rem', color: '#1e293b' }}>{client.nom}</span>
                        <span style={{ backgroundColor: st.bg, color: st.color, padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.75rem', fontWeight: '600' }}>{st.label}</span>
                      </div>
                      {client.entreprise && <p style={{ color: '#64748b', fontSize: '0.85rem', marginTop: '0.15rem' }}>🏢 {client.entreprise}</p>}
                      <div style={{ display: 'flex', gap: '1rem', marginTop: '0.2rem', flexWrap: 'wrap' }}>
                        {client.telephone && <span style={{ color: '#475569', fontSize: '0.8rem' }}>📞 {client.telephone}</span>}
                        {client.email && <span style={{ color: '#475569', fontSize: '0.8rem' }}>✉️ {client.email}</span>}
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                      {history.dossiers.length > 0 && <span style={{ backgroundColor: '#dbeafe', color: '#1d4ed8', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>📁 {history.dossiers.length}</span>}
                      {history.devis.length > 0 && <span style={{ backgroundColor: '#dcfce7', color: '#15803d', padding: '0.2rem 0.5rem', borderRadius: '8px', fontSize: '0.75rem', fontWeight: '700' }}>📄 {history.devis.length}</span>}
                    </div>
                    <span style={{ color: '#94a3b8', fontSize: '1rem', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: '1px solid #f1f5f9', padding: '1.2rem' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.8rem', marginBottom: '1rem' }}>
                        {client.adresse && <div><p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Adresse</p><p style={{ fontSize: '0.9rem', color: '#374151' }}>{client.adresse}</p></div>}
                        {client.siret && <div><p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>SIRET</p><p style={{ fontSize: '0.9rem', color: '#374151' }}>{client.siret}</p></div>}
                        {client.notes && <div style={{ gridColumn: '1/-1' }}><p style={{ fontSize: '0.7rem', color: '#94a3b8', fontWeight: '700', textTransform: 'uppercase', marginBottom: '0.2rem' }}>Notes</p><p style={{ fontSize: '0.9rem', color: '#374151' }}>{client.notes}</p></div>}
                      </div>

                      {(history.dossiers.length > 0 || history.devis.length > 0 || history.factures.length > 0) && (
                        <div style={{ marginBottom: '1rem' }}>
                          <p style={{ fontSize: '0.7rem', fontWeight: '700', color: '#64748b', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Historique</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem' }}>
                            {history.dossiers.map(d => <div key={d.id} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.45rem 0.8rem', fontSize: '0.83rem', color: '#475569' }}>📁 Dossier {d.type} — {d.status}</div>)}
                            {history.devis.map(d => <div key={d.id} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.45rem 0.8rem', fontSize: '0.83rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}><span>📄 {d.number}</span><span style={{ color: '#94a3b8' }}>{d.totalTTC ? d.totalTTC.toFixed(0) + ' €' : ''}</span></div>)}
                            {history.factures.map(f => <div key={f.id} style={{ backgroundColor: '#f8fafc', borderRadius: '8px', padding: '0.45rem 0.8rem', fontSize: '0.83rem', color: '#475569', display: 'flex', justifyContent: 'space-between' }}><span>💰 {f.number}</span><span style={{ color: '#94a3b8' }}>{f.status}</span></div>)}
                          </div>
                        </div>
                      )}

                      <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        <select value={client.status}
                          onChange={e => { const upd = clients.map(c => c.id === client.id ? { ...c, status: e.target.value } : c); save(upd); toast3('Statut mis à jour') }}
                          style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1.5px solid #e2e8f0', fontSize: '0.85rem', fontWeight: '600', cursor: 'pointer', backgroundColor: 'white' }}>
                          <option value="prospect">Prospect</option>
                          <option value="actif">Client actif</option>
                          <option value="termine">Terminé</option>
                        </select>
                        <button
                          onClick={() => router.push(`/devis?clientId=${client.id}&clientName=${encodeURIComponent(client.nom)}&clientAddress=${encodeURIComponent(client.adresse || '')}&clientEmail=${encodeURIComponent(client.email || '')}&clientPhone=${encodeURIComponent(client.telephone || '')}`)}
                          style={{ backgroundColor: '#dbeafe', color: '#2563eb', border: '1.5px solid #bfdbfe', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                          📄 Nouveau devis
                        </button>
                        <button
                          onClick={() => router.push(`/factures?clientId=${client.id}&clientName=${encodeURIComponent(client.nom)}&clientAddress=${encodeURIComponent(client.adresse || '')}`)}
                          style={{ backgroundColor: '#dcfce7', color: '#16a34a', border: '1.5px solid #bbf7d0', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                          💰 Nouvelle facture
                        </button>
                        <button onClick={() => openEdit(client)} style={{ backgroundColor: '#f1f5f9', color: '#374151', border: '1.5px solid #e2e8f0', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>✏️ Modifier</button>
                        <button onClick={() => deleteClient(client.id)} style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>🗑️ Supprimer</button>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Modal form */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f' }}>{editId ? '✏️ Modifier le client' : '➕ Nouveau client'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { key: 'nom', label: 'Nom complet *', placeholder: 'Jean Dupont' },
                { key: 'entreprise', label: 'Entreprise', placeholder: 'SARL Dupont' },
                { key: 'telephone', label: 'Téléphone', placeholder: '06 12 34 56 78' },
                { key: 'email', label: 'Email', placeholder: 'jean@example.com' },
                { key: 'adresse', label: 'Adresse', placeholder: '12 rue de la Paix, 75001 Paris' },
                { key: 'siret', label: 'SIRET', placeholder: '12345678901234' },
              ].map(f => (
                <div key={f.key}>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>{f.label}</label>
                  <input value={form[f.key]} onChange={e => setForm({ ...form, [f.key]: e.target.value })} placeholder={f.placeholder}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              ))}
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Statut</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {Object.entries(STATUS).map(([key, val]) => (
                    <button key={key} onClick={() => setForm({ ...form, status: key })}
                      style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '2px solid', borderColor: form.status === key ? val.color : '#e2e8f0', backgroundColor: form.status === key ? val.bg : 'white', color: form.status === key ? val.color : '#64748b', fontWeight: '600', fontSize: '0.8rem', cursor: 'pointer' }}>
                      {val.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Notes internes..." rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button onClick={submitForm}
                style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer', marginTop: '0.5rem' }}>
                {editId ? '✅ Enregistrer' : '🎉 Ajouter le client'}
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
