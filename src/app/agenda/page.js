'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'

const TYPES = {
  visite: { label: 'Visite chantier', color: '#2563eb', bg: '#dbeafe', icon: '🔧' },
  reunion: { label: 'Réunion', color: '#d97706', bg: '#fef3c7', icon: '👥' },
  echeance: { label: 'Échéance dossier', color: '#dc2626', bg: '#fee2e2', icon: '⚠️' },
  appel: { label: 'Appel client', color: '#7c3aed', bg: '#ede9fe', icon: '📞' },
}

const MONTHS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']
const DAYS = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

const blank = { id: '', titre: '', type: 'visite', date: new Date().toISOString().split('T')[0], heure: '09:00', client: '', notes: '' }

export default function AgendaPage() {
  const [user, setUser] = useState(null)
  const [events, setEvents] = useState([])
  const [viewDate, setViewDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState(blank)
  const [toast, setToast] = useState('')
  const router = useRouter()

  const today = new Date()
  const todayStr = today.toISOString().split('T')[0]
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()

  useEffect(() => {
    const u = localStorage.getItem('renovexpert_user')
    if (!u) { router.push('/login'); return }
    setUser(JSON.parse(u))
    setEvents(JSON.parse(localStorage.getItem('renovexpert_agenda') || '[]'))
  }, [router])

  function save(list) { setEvents(list); localStorage.setItem('renovexpert_agenda', JSON.stringify(list)) }
  function toast3(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function openNew(date = null) {
    setForm({ ...blank, id: Date.now().toString(), date: date || todayStr })
    setEditId(null)
    setShowForm(true)
  }

  function submit() {
    if (!form.titre.trim()) { alert('Le titre est obligatoire'); return }
    if (editId) { save(events.map(e => e.id === editId ? form : e)); toast3('✅ Événement modifié !') }
    else { save([...events, form]); toast3('🎉 Événement ajouté !') }
    setShowForm(false)
  }

  function deleteEvent(id) {
    if (!confirm('Supprimer cet événement ?')) return
    save(events.filter(e => e.id !== id))
    toast3('Événement supprimé')
  }

  // Calendar helpers
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDow = (() => { const d = new Date(year, month, 1).getDay(); return d === 0 ? 6 : d - 1 })()

  function ds(d) {
    return `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  }

  function eventsOn(d) {
    return events.filter(e => e.date === ds(d)).sort((a, b) => a.heure.localeCompare(b.heure))
  }

  const upcoming = events
    .filter(e => e.date >= todayStr)
    .sort((a, b) => a.date.localeCompare(b.date) || a.heure.localeCompare(b.heure))
    .slice(0, 10)

  const selectedEvents = selectedDay ? eventsOn(selectedDay) : []

  function dateLabel(dateStr) {
    if (dateStr === todayStr) return "Aujourd'hui"
    const tom = new Date(today.getTime() + 86400000).toISOString().split('T')[0]
    if (dateStr === tom) return 'Demain'
    return dateStr
  }

  if (!user) return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><p>Chargement...</p></div>

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', paddingBottom: '80px' }}>
      {/* Header */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '1.5rem', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>🗓 Mon Agenda</h1>
            <p style={{ color: '#94a3b8', fontSize: '0.85rem' }}>{upcoming.length} événement{upcoming.length !== 1 ? 's' : ''} à venir</p>
          </div>
          <button onClick={() => openNew()}
            style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.75rem 1.2rem', borderRadius: '12px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer' }}>
            + Ajouter
          </button>
        </div>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Calendar */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.2rem' }}>
            <button onClick={() => setViewDate(new Date(year, month - 1, 1))}
              style={{ backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer', fontWeight: '700', fontSize: '1.1rem', color: '#374151' }}>‹</button>
            <h2 style={{ fontWeight: '800', color: '#1e3a5f', fontSize: '1.1rem' }}>{MONTHS[month]} {year}</h2>
            <button onClick={() => setViewDate(new Date(year, month + 1, 1))}
              style={{ backgroundColor: '#f1f5f9', border: 'none', borderRadius: '8px', padding: '0.5rem 0.9rem', cursor: 'pointer', fontWeight: '700', fontSize: '1.1rem', color: '#374151' }}>›</button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '0.3rem' }}>
            {DAYS.map(d => <div key={d} style={{ textAlign: 'center', fontSize: '0.68rem', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', padding: '0.25rem 0' }}>{d}</div>)}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
            {Array(firstDow).fill(null).map((_, i) => <div key={'e' + i} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(day => {
              const dayEvents = eventsOn(day)
              const isToday = ds(day) === todayStr
              const isSel = selectedDay === day
              return (
                <div key={day} onClick={() => setSelectedDay(isSel ? null : day)}
                  style={{ minHeight: '50px', borderRadius: '10px', padding: '0.3rem 0.25rem', cursor: 'pointer', backgroundColor: isSel ? '#1e3a5f' : isToday ? '#eff6ff' : 'transparent', border: isToday && !isSel ? '2px solid #3b82f6' : '2px solid transparent', transition: 'all 0.15s' }}>
                  <div style={{ fontSize: '0.82rem', fontWeight: isToday || isSel ? '700' : '500', color: isSel ? 'white' : isToday ? '#1d4ed8' : '#374151', textAlign: 'center', marginBottom: '0.2rem' }}>{day}</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                    {dayEvents.slice(0, 2).map((ev, i) => {
                      const t = TYPES[ev.type] || TYPES.visite
                      return <div key={i} style={{ height: '4px', borderRadius: '2px', backgroundColor: isSel ? 'rgba(255,255,255,0.4)' : t.bg, border: '1px solid ' + (isSel ? 'rgba(255,255,255,0.2)' : t.color) }} />
                    })}
                    {dayEvents.length > 2 && <div style={{ fontSize: '0.58rem', color: isSel ? 'rgba(255,255,255,0.6)' : '#94a3b8', textAlign: 'center' }}>+{dayEvents.length - 2}</div>}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Selected day */}
        {selectedDay && (
          <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ fontWeight: '700', color: '#1e3a5f' }}>
                📅 {ds(selectedDay) === todayStr ? "Aujourd'hui" : `${selectedDay} ${MONTHS[month]}`} · {selectedEvents.length} événement{selectedEvents.length !== 1 ? 's' : ''}
              </h3>
              <button onClick={() => openNew(ds(selectedDay))}
                style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.5rem 0.9rem', borderRadius: '8px', fontWeight: '600', fontSize: '0.85rem', cursor: 'pointer' }}>
                + Ajouter
              </button>
            </div>
            {selectedEvents.length === 0 ? (
              <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>Aucun événement. Cliquez sur "+ Ajouter" pour en planifier un.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                {selectedEvents.map(ev => {
                  const t = TYPES[ev.type] || TYPES.visite
                  return (
                    <div key={ev.id} style={{ backgroundColor: t.bg, borderRadius: '10px', padding: '0.85rem 1rem', borderLeft: '4px solid ' + t.color, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.2rem' }}>
                          <span>{t.icon}</span>
                          <span style={{ fontWeight: '700', color: t.color }}>{ev.titre}</span>
                        </div>
                        <p style={{ fontSize: '0.8rem', color: '#475569' }}>🕐 {ev.heure}{ev.client ? ` · 👤 ${ev.client}` : ''}</p>
                        {ev.notes && <p style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.2rem' }}>{ev.notes}</p>}
                      </div>
                      <div style={{ display: 'flex', gap: '0.4rem' }}>
                        <button onClick={() => { setForm({ ...ev }); setEditId(ev.id); setShowForm(true) }}
                          style={{ backgroundColor: 'rgba(255,255,255,0.6)', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem' }}>✏️</button>
                        <button onClick={() => deleteEvent(ev.id)}
                          style={{ backgroundColor: 'rgba(220,38,38,0.1)', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', cursor: 'pointer', fontSize: '0.85rem', color: '#dc2626' }}>🗑️</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Upcoming events */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h3 style={{ fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>📌 Prochains événements</h3>
          {upcoming.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b' }}>
              <p style={{ marginBottom: '1rem' }}>Aucun événement à venir. Commencez à planifier !</p>
              <button onClick={() => openNew()} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', fontWeight: '700', cursor: 'pointer' }}>
                + Ajouter un événement
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {upcoming.map((ev, i) => {
                const t = TYPES[ev.type] || TYPES.visite
                const isLast = i === upcoming.length - 1
                return (
                  <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem 0', borderBottom: isLast ? 'none' : '1px solid #f1f5f9' }}>
                    <div style={{ width: '44px', height: '44px', backgroundColor: t.bg, borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem', flexShrink: 0 }}>{t.icon}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.92rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ev.titre}</p>
                      <p style={{ fontSize: '0.78rem', color: '#64748b' }}>
                        <span style={{ fontWeight: '600', color: ev.date === todayStr ? '#dc2626' : '#475569' }}>{dateLabel(ev.date)}</span>
                        {' · '}{ev.heure}{ev.client ? ` · ${ev.client}` : ''}
                      </p>
                    </div>
                    <span style={{ backgroundColor: t.bg, color: t.color, padding: '0.2rem 0.5rem', borderRadius: '6px', fontSize: '0.7rem', fontWeight: '600', flexShrink: 0 }}>{t.label}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Form modal */}
      {showForm && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 300, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px 20px 0 0', padding: '2rem', width: '100%', maxWidth: '600px', maxHeight: '88vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f' }}>{editId ? '✏️ Modifier' : '➕ Nouvel événement'}</h2>
              <button onClick={() => setShowForm(false)} style={{ background: 'none', border: 'none', fontSize: '1.5rem', cursor: 'pointer', color: '#64748b' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.4rem' }}>Type d'événement</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.4rem' }}>
                  {Object.entries(TYPES).map(([key, val]) => (
                    <button key={key} onClick={() => setForm({ ...form, type: key })}
                      style={{ padding: '0.65rem', borderRadius: '8px', border: '2px solid', borderColor: form.type === key ? val.color : '#e2e8f0', backgroundColor: form.type === key ? val.bg : 'white', color: form.type === key ? val.color : '#64748b', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                      {val.icon} {val.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Titre *</label>
                <input value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} placeholder="Ex: Visite chantier M. Dupont"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Date *</label>
                  <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Heure</label>
                  <input type="time" value={form.heure} onChange={e => setForm({ ...form, heure: e.target.value })}
                    style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
                </div>
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Client (optionnel)</label>
                <input value={form.client} onChange={e => setForm({ ...form, client: e.target.value })} placeholder="Nom du client"
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '0.85rem', fontWeight: '600', color: '#475569', display: 'block', marginBottom: '0.3rem' }}>Notes</label>
                <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} placeholder="Informations complémentaires..." rows={3}
                  style={{ width: '100%', padding: '0.75rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', resize: 'vertical', boxSizing: 'border-box', outline: 'none' }} />
              </div>
              <button onClick={submit} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem', borderRadius: '12px', fontWeight: '700', fontSize: '1rem', cursor: 'pointer' }}>
                {editId ? '✅ Enregistrer' : "🎉 Ajouter l'événement"}
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
