'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STORAGE_KEY = 'renovexpert_dossiers'

const MPR_CHECKLIST: string[] = [
  "Devis signé de l'entreprise RGE",
  "Avis d'imposition N-1 du client",
  'Justificatif de propriété (titre de propriété)',
  'Relevé d\'identité bancaire (RIB)',
  'Pièce d\'identité du client',
  'Photo avant travaux',
  'Facture définitive des travaux',
  "Attestation sur l'honneur signée",
  "Certificat RGE de l'entreprise",
]

const CEE_CHECKLIST: string[] = [
  "Devis signé de l'entreprise RGE",
  'Attestation de fin de travaux (AFTD)',
  'Photo avant travaux',
  'Photo après travaux',
  'Facture définitive des travaux',
  'Fiche technique du matériel installé',
  "Attestation sur l'honneur (éligibilité)",
  'Bordereau de dépôt CEE signé',
  'Pièce d\'identité du client',
]

const WORK_TYPES: string[] = [
  'Isolation des combles',
  'Isolation des murs',
  'Isolation du plancher bas',
  'Pompe à chaleur air/eau',
  'Pompe à chaleur géothermique',
  'Chaudière à granulés (biomasse)',
  'Chauffe-eau thermodynamique',
  'Ventilation VMC double flux',
  'Fenêtres / double vitrage',
  'Autre',
]

interface ChecklistItem {
  item: string
  checked: boolean
}

interface UploadedFile {
  id: string
  name: string
  mimeType: string
  data: string
  uploadedAt: string
}

interface Dossier {
  id: string
  clientName: string
  address: string
  workType: string
  type: 'MPR' | 'CEE'
  status: 'En cours' | 'Complété'
  createdAt: string
  checklist: ChecklistItem[]
  files: UploadedFile[]
}

interface DossierForm {
  clientName: string
  address: string
  workType: string
  type: 'MPR' | 'CEE'
}

interface StoredUser {
  name: string
  company: string
  plan?: string
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2)
}

function loadDossiers(): Dossier[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Dossier[]
  } catch {
    return []
  }
}

function saveDossiers(list: Dossier[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

type View = 'list' | 'create' | 'detail'

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '0.4rem',
}

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  outline: 'none',
  boxSizing: 'border-box',
}

export default function DossiersPage() {
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<Dossier | null>(null)
  const [form, setForm] = useState<DossierForm>({ clientName: '', address: '', workType: WORK_TYPES[0], type: 'MPR' })
  const [formError, setFormError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('renovexpert_user')
    if (!stored) { router.push('/login'); return }
    setUser(JSON.parse(stored) as StoredUser)
    setDossiers(loadDossiers())
  }, [router])

  const persistAndSet = (updated: Dossier[]) => {
    saveDossiers(updated)
    setDossiers(updated)
  }

  const handleCreate = () => {
    if (!form.clientName.trim()) { setFormError('Le nom du client est requis.'); return }
    if (!form.address.trim()) { setFormError("L'adresse est requise."); return }
    const checklist = (form.type === 'MPR' ? MPR_CHECKLIST : CEE_CHECKLIST).map((item) => ({ item, checked: false }))
    const newDossier: Dossier = {
      id: generateId(),
      clientName: form.clientName.trim(),
      address: form.address.trim(),
      workType: form.workType,
      type: form.type,
      status: 'En cours',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      checklist,
      files: [],
    }
    const updated = [newDossier, ...dossiers]
    persistAndSet(updated)
    setSelected(newDossier)
    setView('detail')
    setForm({ clientName: '', address: '', workType: WORK_TYPES[0], type: 'MPR' })
    setFormError('')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce dossier définitivement ?')) return
    const updated = dossiers.filter((d) => d.id !== id)
    persistAndSet(updated)
    if (selected?.id === id) { setSelected(null); setView('list') }
  }

  const toggleCheck = (dossierId: string, idx: number) => {
    const updated = dossiers.map((d) => {
      if (d.id !== dossierId) return d
      const checklist = d.checklist.map((c, i) => i === idx ? { ...c, checked: !c.checked } : c)
      const allChecked = checklist.every((c) => c.checked)
      return { ...d, checklist, status: (allChecked ? 'Complété' : 'En cours') as Dossier['status'] }
    })
    persistAndSet(updated)
    setSelected(updated.find((d) => d.id === dossierId) ?? null)
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length) return
    setUploadError('')

    const readers = files.map(
      (file) =>
        new Promise<UploadedFile>((resolve, reject) => {
          if (file.size > 4 * 1024 * 1024) { reject(`"${file.name}" dépasse 4 Mo.`); return }
          const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
          if (!allowed.includes(file.type)) { reject(`"${file.name}" : format non supporté (JPG, PNG, WEBP, PDF uniquement).`); return }
          const reader = new FileReader()
          reader.onload = () => resolve({ id: generateId(), name: file.name, mimeType: file.type, data: reader.result as string, uploadedAt: new Date().toLocaleDateString('fr-FR') })
          reader.onerror = () => reject(`Erreur lors de la lecture de "${file.name}".`)
          reader.readAsDataURL(file)
        })
    )

    Promise.allSettled(readers).then((results) => {
      const successes = results.filter((r): r is PromiseFulfilledResult<UploadedFile> => r.status === 'fulfilled').map((r) => r.value)
      const errors = results.filter((r): r is PromiseRejectedResult => r.status === 'rejected').map((r) => r.reason as string)
      if (errors.length) setUploadError(errors.join(' '))
      if (!successes.length || !selected) return
      const updated = dossiers.map((d) => d.id !== selected.id ? d : { ...d, files: [...d.files, ...successes] })
      persistAndSet(updated)
      setSelected(updated.find((d) => d.id === selected.id) ?? null)
    })

    e.target.value = ''
  }

  const handleRemoveFile = (dossierId: string, fileId: string) => {
    const updated = dossiers.map((d) => d.id !== dossierId ? d : { ...d, files: d.files.filter((f) => f.id !== fileId) })
    persistAndSet(updated)
    setSelected(updated.find((d) => d.id === dossierId) ?? null)
  }

  const openSelected = (d: Dossier) => { setSelected(d); setView('detail'); setUploadError('') }

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Chargement...</p>
      </div>
    )
  }

  const checkedCount = selected ? selected.checklist.filter((c) => c.checked).length : 0
  const totalCount = selected ? selected.checklist.length : 0
  const progress = totalCount ? Math.round((checkedCount / totalCount) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* Navbar */}
      <nav style={{ backgroundColor: '#1e3a5f', padding: '0 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '64px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', flexShrink: 0 }}>
        <Link href="/" style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold' }}>
          Renov<span style={{ color: '#d97706' }}>Expert</span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <Link href="/dashboard" style={{ color: '#94a3b8', fontSize: '0.85rem' }}>← Tableau de bord</Link>
          <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>👤 {user.name}</span>
          <Link href="/subscription" style={{ border: '1px solid #d97706', color: '#d97706', padding: '0.3rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: '600' }}>
            Plan {user.plan ?? 'Essentiel'}
          </Link>
          <button
            onClick={() => { localStorage.removeItem('renovexpert_user'); router.push('/') }}
            style={{ backgroundColor: 'transparent', border: '1px solid rgba(255,255,255,0.25)', color: '#cbd5e1', padding: '0.3rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Déconnexion
          </button>
        </div>
      </nav>

      {/* Body */}
      <div style={{ flex: 1, maxWidth: '1200px', margin: '0 auto', width: '100%', padding: '2rem 1.5rem', display: 'flex', gap: '1.5rem' }}>

        {/* Left panel */}
        <div style={{ width: '300px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.4rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: '1.15rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.3rem' }}>📁 Mes Dossiers</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>{dossiers.length} dossier{dossiers.length !== 1 ? 's' : ''}</p>
            <button
              onClick={() => { setView('create'); setFormError('') }}
              style={{ width: '100%', backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.7rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.9rem' }}
            >
              + Nouveau dossier
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {dossiers.length === 0 && (
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                Aucun dossier.<br />Créez votre premier dossier client.
              </div>
            )}
            {dossiers.map((d) => {
              const done = d.checklist.filter((c) => c.checked).length
              const total = d.checklist.length
              const pct = total ? Math.round((done / total) * 100) : 0
              const isActive = selected?.id === d.id && view === 'detail'
              return (
                <div
                  key={d.id}
                  onClick={() => openSelected(d)}
                  style={{ backgroundColor: isActive ? '#1e3a5f' : 'white', borderRadius: '10px', padding: '0.9rem 1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `2px solid ${isActive ? '#d97706' : 'transparent'}`, transition: 'all 0.15s' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.4rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.9rem', color: isActive ? 'white' : '#1e3a5f' }}>{d.clientName}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: d.type === 'MPR' ? '#dbeafe' : '#dcfce7', color: d.type === 'MPR' ? '#1d4ed8' : '#15803d' }}>
                      {d.type}
                    </span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: isActive ? '#94a3b8' : '#64748b', marginBottom: '0.5rem' }}>{d.workType}</div>
                  <div style={{ height: '4px', backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct === 100 ? '#22c55e' : '#d97706', borderRadius: '2px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '0.72rem', color: isActive ? '#94a3b8' : '#64748b' }}>{done}/{total} docs</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '600', color: d.status === 'Complété' ? '#22c55e' : (isActive ? '#fbbf24' : '#d97706') }}>{d.status}</span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Right panel */}
        <div style={{ flex: 1 }}>

          {/* CREATE */}
          {view === 'create' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '1.5rem' }}>Nouveau dossier client</h2>
              {formError && (
                <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.88rem', marginBottom: '1rem' }}>{formError}</div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                <div>
                  <label style={labelStyle}>Type de dossier *</label>
                  <div style={{ display: 'flex', gap: '0.8rem' }}>
                    {(['MPR', 'CEE'] as const).map((t) => (
                      <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', fontWeight: '700', fontSize: '0.95rem', cursor: 'pointer', border: '2px solid', borderColor: form.type === t ? (t === 'MPR' ? '#1d4ed8' : '#15803d') : '#e2e8f0', backgroundColor: form.type === t ? (t === 'MPR' ? '#eff6ff' : '#f0fdf4') : 'white', color: form.type === t ? (t === 'MPR' ? '#1d4ed8' : '#15803d') : '#64748b' }}>
                        {t === 'MPR' ? "🏠 MaPrimeRénov'" : '⚡ CEE'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label style={labelStyle}>Nom du client *</label>
                  <input value={form.clientName} onChange={(e) => setForm((f) => ({ ...f, clientName: e.target.value }))} placeholder="Ex : Jean Dupont" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Adresse du chantier *</label>
                  <input value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} placeholder="Ex : 12 rue des Lilas, 75011 Paris" style={inputStyle} />
                </div>
                <div>
                  <label style={labelStyle}>Type de travaux *</label>
                  <select value={form.workType} onChange={(e) => setForm((f) => ({ ...f, workType: e.target.value }))} style={{ ...inputStyle, backgroundColor: 'white' }}>
                    {WORK_TYPES.map((w) => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', paddingTop: '0.5rem' }}>
                  <button onClick={handleCreate} style={{ flex: 1, backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
                    Créer le dossier →
                  </button>
                  <button onClick={() => setView('list')} style={{ padding: '0.85rem 1.5rem', borderRadius: '8px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', fontSize: '0.95rem' }}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL */}
          {view === 'detail' && selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem' }}>
                      <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e3a5f' }}>{selected.clientName}</h2>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: selected.type === 'MPR' ? '#dbeafe' : '#dcfce7', color: selected.type === 'MPR' ? '#1d4ed8' : '#15803d' }}>
                        {selected.type === 'MPR' ? "MaPrimeRénov'" : 'CEE'}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.6rem', borderRadius: '999px', backgroundColor: selected.status === 'Complété' ? '#dcfce7' : '#fef3c7', color: selected.status === 'Complété' ? '#15803d' : '#92400e' }}>
                        {selected.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#64748b' }}>📍 {selected.address}</div>
                    <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>🔧 {selected.workType} · Créé le {selected.createdAt}</div>
                  </div>
                  <button onClick={() => handleDelete(selected.id)} style={{ backgroundColor: 'transparent', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.4rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.82rem' }}>
                    🗑 Supprimer
                  </button>
                </div>
                <div style={{ marginTop: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                    <span style={{ fontSize: '0.82rem', color: '#64748b' }}>Avancement du dossier</span>
                    <span style={{ fontSize: '0.82rem', fontWeight: '700', color: progress === 100 ? '#22c55e' : '#d97706' }}>{checkedCount}/{totalCount} · {progress}%</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#e2e8f0', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, backgroundColor: progress === 100 ? '#22c55e' : '#d97706', borderRadius: '4px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>
                  ✅ Documents requis — {selected.type === 'MPR' ? "MaPrimeRénov'" : 'CEE'}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  {selected.checklist.map((item, idx) => (
                    <label key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', padding: '0.75rem 1rem', borderRadius: '8px', cursor: 'pointer', backgroundColor: item.checked ? '#f0fdf4' : '#f8fafc', border: `1px solid ${item.checked ? '#bbf7d0' : '#e2e8f0'}`, transition: 'all 0.15s' }}>
                      <input type="checkbox" checked={item.checked} onChange={() => toggleCheck(selected.id, idx)} style={{ width: '18px', height: '18px', accentColor: '#22c55e', cursor: 'pointer', flexShrink: 0 }} />
                      <span style={{ fontSize: '0.9rem', color: item.checked ? '#15803d' : '#374151', textDecoration: item.checked ? 'line-through' : 'none' }}>{item.item}</span>
                      {item.checked && <span style={{ marginLeft: 'auto', fontSize: '0.85rem' }}>✓</span>}
                    </label>
                  ))}
                </div>
              </div>

              {/* Files */}
              <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>📎 Photos & Documents PDF</h3>
                {uploadError && (
                  <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>{uploadError}</div>
                )}
                <div
                  onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed #d1d5db', borderRadius: '10px', padding: '2rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d97706' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d1d5db' }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>📤</div>
                  <div style={{ fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.3rem' }}>Cliquez pour ajouter des fichiers</div>
                  <div style={{ fontSize: '0.78rem', color: '#94a3b8' }}>JPG, PNG, WEBP, PDF · Max 4 Mo par fichier</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileUpload} style={{ display: 'none' }} />

                {selected.files.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selected.files.map((file) => {
                      const isImage = file.mimeType.startsWith('image/')
                      return (
                        <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.65rem 1rem', borderRadius: '8px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                          {isImage ? (
                            <img src={file.data} alt={file.name} style={{ width: '42px', height: '42px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                          ) : (
                            <div style={{ width: '42px', height: '42px', backgroundColor: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.3rem', flexShrink: 0 }}>📄</div>
                          )}
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                            <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{file.mimeType === 'application/pdf' ? 'PDF' : 'Image'} · {file.uploadedAt}</div>
                          </div>
                          <a href={file.data} download={file.name} style={{ color: '#1d4ed8', fontSize: '0.8rem', textDecoration: 'none', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', flexShrink: 0 }}>↓</a>
                          <button onClick={() => handleRemoveFile(selected.id, file.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1rem', padding: '0.2rem 0.4rem', flexShrink: 0 }}>×</button>
                        </div>
                      )
                    })}
                  </div>
                )}
                {selected.files.length === 0 && (
                  <p style={{ marginTop: '0.8rem', fontSize: '0.82rem', color: '#94a3b8', textAlign: 'center' }}>Aucun fichier joint à ce dossier.</p>
                )}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {view === 'list' && (
            <div style={{ backgroundColor: 'white', borderRadius: '12px', padding: '4rem 2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📁</div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '0.5rem' }}>Gérez vos dossiers clients</h2>
              <p style={{ color: '#64748b', fontSize: '0.9rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                Créez un dossier par chantier et suivez l'avancement des documents MPR ou CEE. Joignez photos et PDF directement depuis cet espace.
              </p>
              <button onClick={() => { setView('create'); setFormError('') }} style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.8rem 2rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
                + Créer mon premier dossier
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
