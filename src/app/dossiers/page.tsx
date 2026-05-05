'use client'

import { useState, useEffect, useRef, ChangeEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import BottomNav from '../components/BottomNav'

const STORAGE_KEY = 'renovexpert_dossiers'

const MPR_CHECKLIST: string[] = [
  "Devis signé de l'entreprise RGE",
  "Avis d'imposition N-1 du client",
  "Justificatif de propriété (titre de propriété)",
  "Relevé d'identité bancaire (RIB)",
  "Pièce d'identité du client",
  "Photo avant travaux",
  "Facture définitive des travaux",
  "Attestation sur l'honneur signée",
  "Certificat RGE de l'entreprise",
]

const CEE_CHECKLIST: string[] = [
  "Devis signé de l'entreprise RGE",
  "Attestation de fin de travaux (AFTD)",
  "Photo avant travaux",
  "Photo après travaux",
  "Facture définitive des travaux",
  "Fiche technique du matériel installé",
  "Attestation sur l'honneur (éligibilité)",
  "Bordereau de dépôt CEE signé",
  "Pièce d'identité du client",
]

const ANAH_CHECKLIST: string[] = [
  "Formulaire de demande ANAH (Cerfa n°13679*03)",
  "Avis d'imposition N-2 du client",
  "Justificatif de propriété (titre ou taxe foncière)",
  "Justificatif de domicile du client",
  "Devis signé de l'entreprise RGE",
  "Relevé d'identité bancaire (RIB)",
  "Pièce d'identité du client",
  "Photo avant travaux",
  "Rapport d'audit énergétique",
  "Facture définitive des travaux",
  "Attestation sur l'honneur de fin de travaux",
  "Certificat RGE de l'entreprise",
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
  'Rénovation globale',
  'Autre',
]

type DocStatus = 'manquant' | 'recu' | 'a_valider'
type DossierType = 'MPR' | 'CEE' | 'ANAH'

interface ChecklistItem {
  item: string
  status: DocStatus
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
  type: DossierType
  artisanName: string
  status: 'En cours' | 'Complété'
  createdAt: string
  checklist: ChecklistItem[]
  files: UploadedFile[]
}

interface DossierForm {
  clientName: string
  address: string
  workType: string
  type: DossierType
  artisanName: string
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
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]') as Dossier[]
    // Migrate old boolean checked to status
    return raw.map((d) => ({
      ...d,
      checklist: d.checklist.map((c: any) => ({
        item: c.item,
        status: c.status ?? (c.checked ? 'recu' : 'manquant'),
      })),
    }))
  } catch {
    return []
  }
}

function saveDossiers(list: Dossier[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
}

const STATUS_CONFIG: Record<DocStatus, { label: string; bg: string; color: string; border: string; icon: string }> = {
  manquant: { label: 'Manquant', bg: '#fff1f2', color: '#dc2626', border: '#fecaca', icon: '❌' },
  a_valider: { label: 'À valider', bg: '#fffbeb', color: '#d97706', border: '#fde68a', icon: '⏳' },
  recu: { label: 'Reçu', bg: '#f0fdf4', color: '#16a34a', border: '#bbf7d0', icon: '✅' },
}

const TYPE_CONFIG: Record<DossierType, { label: string; bg: string; color: string }> = {
  MPR: { label: "MaPrimeRénov'", bg: '#dbeafe', color: '#1d4ed8' },
  CEE: { label: 'CEE', bg: '#dcfce7', color: '#15803d' },
  ANAH: { label: 'ANAH', bg: '#ede9fe', color: '#7c3aed' },
}

type View = 'list' | 'create' | 'detail'

export default function DossiersPage() {
  const router = useRouter()
  const [user, setUser] = useState<StoredUser | null>(null)
  const [dossiers, setDossiers] = useState<Dossier[]>([])
  const [view, setView] = useState<View>('list')
  const [selected, setSelected] = useState<Dossier | null>(null)
  const [form, setForm] = useState<DossierForm>({ clientName: '', address: '', workType: WORK_TYPES[0], type: 'MPR', artisanName: '' })
  const [formError, setFormError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const stored = localStorage.getItem('renovexpert_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored) as StoredUser
    setUser(u)
    setForm(f => ({ ...f, artisanName: u.name }))
    setDossiers(loadDossiers())
  }, [router])

  const persistAndSet = (updated: Dossier[]) => {
    saveDossiers(updated)
    setDossiers(updated)
  }

  const getChecklist = (type: DossierType) =>
    (type === 'MPR' ? MPR_CHECKLIST : type === 'CEE' ? CEE_CHECKLIST : ANAH_CHECKLIST)
      .map((item) => ({ item, status: 'manquant' as DocStatus }))

  const handleCreate = () => {
    if (!form.clientName.trim()) { setFormError('Le nom du client est requis.'); return }
    if (!form.address.trim()) { setFormError("L'adresse est requise."); return }
    const newDossier: Dossier = {
      id: generateId(),
      clientName: form.clientName.trim(),
      address: form.address.trim(),
      workType: form.workType,
      type: form.type,
      artisanName: form.artisanName.trim() || (user?.name ?? ''),
      status: 'En cours',
      createdAt: new Date().toLocaleDateString('fr-FR'),
      checklist: getChecklist(form.type),
      files: [],
    }
    const updated = [newDossier, ...dossiers]
    persistAndSet(updated)
    setSelected(newDossier)
    setView('detail')
    setForm(f => ({ ...f, clientName: '', address: '' }))
    setFormError('')
  }

  const handleDelete = (id: string) => {
    if (!confirm('Supprimer ce dossier définitivement ?')) return
    const updated = dossiers.filter((d) => d.id !== id)
    persistAndSet(updated)
    if (selected?.id === id) { setSelected(null); setView('list') }
  }

  const cycleStatus = (dossierId: string, idx: number, newStatus: DocStatus) => {
    const updated = dossiers.map((d) => {
      if (d.id !== dossierId) return d
      const checklist = d.checklist.map((c, i) => i === idx ? { ...c, status: newStatus } : c)
      const allReceived = checklist.every((c) => c.status === 'recu')
      return { ...d, checklist, status: allReceived ? 'Complété' as const : 'En cours' as const }
    })
    persistAndSet(updated)
    setSelected(updated.find((d) => d.id === dossierId) ?? null)
  }

  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? [])
    if (!files.length || !selected) return
    setUploadError('')
    const readers = files.map((file) =>
      new Promise<UploadedFile>((resolve, reject) => {
        if (file.size > 4 * 1024 * 1024) { reject(`"${file.name}" dépasse 4 Mo.`); return }
        const allowed = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
        if (!allowed.includes(file.type)) { reject(`"${file.name}" : format non supporté.`); return }
        const reader = new FileReader()
        reader.onload = () => resolve({ id: generateId(), name: file.name, mimeType: file.type, data: reader.result as string, uploadedAt: new Date().toLocaleDateString('fr-FR') })
        reader.onerror = () => reject(`Erreur lecture "${file.name}".`)
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: '#64748b' }}>Chargement...</p>
      </div>
    )
  }

  const recuCount = selected ? selected.checklist.filter((c) => c.status === 'recu').length : 0
  const totalCount = selected ? selected.checklist.length : 0
  const progress = totalCount ? Math.round((recuCount / totalCount) * 100) : 0

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8' }}>
      {/* Navbar */}
      <nav style={{ backgroundColor: '#1e3a5f', padding: '0 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '60px', boxShadow: '0 2px 8px rgba(0,0,0,0.2)', position: 'sticky', top: 0, zIndex: 100 }}>
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

      <div className="page-layout">
        {/* Sidebar */}
        <div className="sidebar-panel" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.25rem' }}>📁 Mes Dossiers</h1>
            <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>{dossiers.length} dossier{dossiers.length !== 1 ? 's' : ''}</p>
            <button onClick={() => { setView('create'); setFormError('') }}
              style={{ width: '100%', backgroundColor: '#d97706', color: 'white', border: 'none', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
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
              const done = d.checklist.filter((c) => c.status === 'recu').length
              const total = d.checklist.length
              const pct = total ? Math.round((done / total) * 100) : 0
              const isActive = selected?.id === d.id && view === 'detail'
              const tc = TYPE_CONFIG[d.type]
              return (
                <div key={d.id} onClick={() => openSelected(d)} style={{ backgroundColor: isActive ? '#1e3a5f' : 'white', borderRadius: '12px', padding: '1rem', cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: `2px solid ${isActive ? '#d97706' : 'transparent'}`, transition: 'all 0.15s' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: '700', fontSize: '0.95rem', color: isActive ? 'white' : '#1e3a5f' }}>{d.clientName}</span>
                    <span style={{ fontSize: '0.7rem', fontWeight: '700', padding: '0.15rem 0.5rem', borderRadius: '999px', backgroundColor: tc.bg, color: tc.color }}>{d.type}</span>
                  </div>
                  <div style={{ fontSize: '0.78rem', color: isActive ? '#94a3b8' : '#64748b', marginBottom: '0.5rem' }}>{d.workType}</div>
                  <div style={{ height: '5px', backgroundColor: isActive ? 'rgba(255,255,255,0.2)' : '#e2e8f0', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, backgroundColor: pct === 100 ? '#16a34a' : '#d97706', borderRadius: '3px', transition: 'width 0.3s' }} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.3rem' }}>
                    <span style={{ fontSize: '0.72rem', color: isActive ? '#94a3b8' : '#64748b' }}>{done}/{total} reçus</span>
                    <span style={{ fontSize: '0.72rem', fontWeight: '600', color: d.status === 'Complété' ? '#16a34a' : (isActive ? '#fbbf24' : '#d97706') }}>{d.status}</span>
                  </div>
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
              <h2 style={{ fontSize: '1.3rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '1.5rem' }}>📋 Nouveau dossier client</h2>
              {formError && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.8rem 1rem', borderRadius: '8px', fontSize: '0.9rem', marginBottom: '1rem' }}>{formError}</div>}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                {/* Type selector */}
                <div>
                  <label style={labelStyle}>Type d'aide *</label>
                  <div style={{ display: 'flex', gap: '0.6rem' }}>
                    {(['MPR', 'CEE', 'ANAH'] as DossierType[]).map((t) => {
                      const tc = TYPE_CONFIG[t]
                      return (
                        <button key={t} type="button" onClick={() => setForm((f) => ({ ...f, type: t }))}
                          style={{ flex: 1, padding: '0.8rem 0.5rem', borderRadius: '10px', fontWeight: '700', fontSize: '0.9rem', cursor: 'pointer', border: '2px solid', borderColor: form.type === t ? tc.color : '#e2e8f0', backgroundColor: form.type === t ? tc.bg : 'white', color: form.type === t ? tc.color : '#64748b', transition: 'all 0.15s' }}>
                          {t === 'MPR' ? "🏠 MPR" : t === 'CEE' ? '⚡ CEE' : '🏛 ANAH'}
                        </button>
                      )
                    })}
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
                <div>
                  <label style={labelStyle}>Nom de l'artisan</label>
                  <input value={form.artisanName} onChange={(e) => setForm((f) => ({ ...f, artisanName: e.target.value }))} placeholder="Votre nom" style={inputStyle} />
                </div>
                <div style={{ display: 'flex', gap: '0.8rem', paddingTop: '0.5rem' }}>
                  <button onClick={handleCreate} style={{ flex: 1, backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1rem' }}>
                    Créer le dossier →
                  </button>
                  <button onClick={() => setView('list')} style={{ padding: '1rem 1.5rem', borderRadius: '10px', border: '1px solid #e2e8f0', backgroundColor: 'white', color: '#64748b', cursor: 'pointer', fontSize: '1rem' }}>
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* DETAIL VIEW */}
          {view === 'detail' && selected && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Header */}
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '0.8rem' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', marginBottom: '0.4rem', flexWrap: 'wrap' }}>
                      <h2 style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a5f' }}>{selected.clientName}</h2>
                      <span style={{ fontSize: '0.75rem', fontWeight: '700', padding: '0.2rem 0.7rem', borderRadius: '999px', backgroundColor: TYPE_CONFIG[selected.type].bg, color: TYPE_CONFIG[selected.type].color }}>
                        {TYPE_CONFIG[selected.type].label}
                      </span>
                      <span style={{ fontSize: '0.75rem', fontWeight: '600', padding: '0.2rem 0.7rem', borderRadius: '999px', backgroundColor: selected.status === 'Complété' ? '#dcfce7' : '#fef3c7', color: selected.status === 'Complété' ? '#15803d' : '#92400e' }}>
                        {selected.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '0.88rem', color: '#64748b' }}>📍 {selected.address}</div>
                    <div style={{ fontSize: '0.88rem', color: '#64748b', marginTop: '0.2rem' }}>🔧 {selected.workType} · 👷 {selected.artisanName} · {selected.createdAt}</div>
                  </div>
                  <button onClick={() => handleDelete(selected.id)} style={{ backgroundColor: 'transparent', border: '1px solid #fca5a5', color: '#dc2626', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem', whiteSpace: 'nowrap' }}>
                    🗑 Supprimer
                  </button>
                </div>
                <div style={{ marginTop: '1.2rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.85rem', color: '#64748b' }}>Avancement du dossier</span>
                    <span style={{ fontSize: '0.85rem', fontWeight: '700', color: progress === 100 ? '#16a34a' : '#d97706' }}>{recuCount}/{totalCount} reçus · {progress}%</span>
                  </div>
                  <div style={{ height: '10px', backgroundColor: '#e2e8f0', borderRadius: '5px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${progress}%`, backgroundColor: progress === 100 ? '#16a34a' : '#d97706', borderRadius: '5px', transition: 'width 0.4s ease' }} />
                  </div>
                </div>
              </div>

              {/* Checklist */}
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>
                  📋 Documents requis — {TYPE_CONFIG[selected.type].label}
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {selected.checklist.map((item, idx) => {
                    const sc = STATUS_CONFIG[item.status]
                    return (
                      <div key={idx} style={{ backgroundColor: sc.bg, border: `1px solid ${sc.border}`, borderRadius: '10px', padding: '0.8rem 1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.8rem', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.9rem', color: '#1e293b', flex: 1 }}>{item.item}</span>
                          <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                            {(['manquant', 'a_valider', 'recu'] as DocStatus[]).map((s) => {
                              const c = STATUS_CONFIG[s]
                              const isSelected = item.status === s
                              return (
                                <button key={s} onClick={() => cycleStatus(selected.id, idx, s)}
                                  style={{ padding: '0.3rem 0.6rem', borderRadius: '6px', border: `1.5px solid ${isSelected ? c.color : '#d1d5db'}`, backgroundColor: isSelected ? c.bg : 'white', color: isSelected ? c.color : '#94a3b8', cursor: 'pointer', fontSize: '0.72rem', fontWeight: '600', transition: 'all 0.1s', whiteSpace: 'nowrap' }}>
                                  {c.icon} {c.label}
                                </button>
                              )
                            })}
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* Files */}
              <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
                <h3 style={{ fontSize: '1.05rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '1rem' }}>📎 Photos & Documents</h3>
                {uploadError && <div style={{ backgroundColor: '#fee2e2', color: '#b91c1c', padding: '0.65rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>{uploadError}</div>}
                <div onClick={() => fileInputRef.current?.click()}
                  style={{ border: '2px dashed #d1d5db', borderRadius: '12px', padding: '2rem', textAlign: 'center', cursor: 'pointer', backgroundColor: '#f8fafc' }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d97706' }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.borderColor = '#d1d5db' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>📤</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: '600', color: '#374151' }}>Appuyez pour ajouter un fichier</div>
                  <div style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.3rem' }}>JPG, PNG, PDF · Max 4 Mo</div>
                </div>
                <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" multiple onChange={handleFileUpload} style={{ display: 'none' }} />
                {selected.files.length > 0 && (
                  <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {selected.files.map((file) => (
                      <div key={file.id} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', padding: '0.7rem 1rem', borderRadius: '10px', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0' }}>
                        {file.mimeType.startsWith('image/') ? (
                          <img src={file.data} alt={file.name} style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', flexShrink: 0 }} />
                        ) : (
                          <div style={{ width: '44px', height: '44px', backgroundColor: '#fee2e2', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>📄</div>
                        )}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.88rem', fontWeight: '600', color: '#1e3a5f', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>{file.uploadedAt}</div>
                        </div>
                        <a href={file.data} download={file.name} style={{ color: '#1d4ed8', fontSize: '0.8rem', padding: '0.3rem 0.6rem', borderRadius: '4px', border: '1px solid #bfdbfe', backgroundColor: '#eff6ff', flexShrink: 0 }}>↓</a>
                        <button onClick={() => handleRemoveFile(selected.id, file.id)} style={{ backgroundColor: 'transparent', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: '1.1rem', padding: '0.2rem 0.4rem', flexShrink: 0 }}>×</button>
                      </div>
                    ))}
                  </div>
                )}
                {selected.files.length === 0 && <p style={{ marginTop: '0.8rem', fontSize: '0.85rem', color: '#94a3b8', textAlign: 'center' }}>Aucun fichier joint.</p>}
              </div>
            </div>
          )}

          {/* EMPTY STATE */}
          {view === 'list' && (
            <div style={{ backgroundColor: 'white', borderRadius: '14px', padding: '4rem 2rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)', textAlign: 'center' }}>
              <div style={{ fontSize: '4rem', marginBottom: '1rem' }}>📁</div>
              <h2 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#1e3a5f', marginBottom: '0.5rem' }}>Gérez vos dossiers clients</h2>
              <p style={{ color: '#64748b', fontSize: '0.95rem', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
                Créez un dossier par chantier. Suivez les documents MPR, CEE ou ANAH et joignez vos photos et PDF.
              </p>
              <button onClick={() => { setView('create'); setFormError('') }}
                style={{ backgroundColor: '#d97706', color: 'white', border: 'none', padding: '1rem 2.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '1.05rem' }}>
                + Créer mon premier dossier
              </button>
            </div>
          )}
        </div>
      </div>

      <BottomNav />
    </div>
  )
}

const labelStyle: React.CSSProperties = { display: 'block', fontSize: '0.9rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }
const inputStyle: React.CSSProperties = { width: '100%', padding: '0.85rem 1rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '1rem', outline: 'none', boxSizing: 'border-box' }
