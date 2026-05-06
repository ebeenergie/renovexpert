'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import BottomNav from '../components/BottomNav'
import SignaturePad from '../components/SignaturePad'

const SETTINGS_KEY = 'renovexpert_settings'

const DEFAULT_CGU = `CONDITIONS GÉNÉRALES DE VENTE — TRAVAUX DE RÉNOVATION

Article 1 – Objet
Les présentes conditions générales régissent l'ensemble des prestations de travaux réalisées par l'artisan. Toute commande implique l'acceptation sans réserve de ces conditions.

Article 2 – Devis et commande
Le devis est valable 30 jours à compter de sa date d'émission. Sa signature par le client vaut bon de commande et accord sur le prix et les modalités d'exécution.

Article 3 – Prix et TVA
Les prix sont indiqués hors taxes. La TVA applicable est calculée au taux en vigueur à la date de la facture, conformément à la réglementation fiscale en vigueur.

Article 4 – Paiement
Un acompte de 30% est demandé à la commande. Le solde est exigible à réception des travaux. Tout retard de paiement entraîne des pénalités au taux légal majoré de 5 points, ainsi qu'une indemnité forfaitaire de 40 € pour frais de recouvrement.

Article 5 – Délais d'exécution
Les délais communiqués sont donnés à titre indicatif. L'artisan ne saurait être tenu responsable des retards dus à des cas de force majeure ou à des causes extérieures à sa volonté.

Article 6 – Garanties légales
Les travaux sont soumis à la garantie de parfait achèvement (1 an), la garantie biennale (2 ans) et la garantie décennale (10 ans), conformément aux articles 1792 et suivants du Code civil.

Article 7 – Assurance
L'artisan est couvert par une assurance responsabilité civile professionnelle et une garantie décennale. Une attestation d'assurance peut être fournie sur simple demande.

Article 8 – Règlement des litiges
En cas de litige, les parties rechercheront en priorité une solution amiable. À défaut d'accord, le tribunal compétent sera celui du lieu d'exécution des travaux.`

export default function SettingsPage() {
  const router = useRouter()
  const [user, setUser] = useState(null)
  const [toast, setToast] = useState('')

  // Profile form
  const [profile, setProfile] = useState({
    name: '', email: '', company: '', phone: '',
    address: '', city: '', postalCode: '',
    website: '',
    siret: '', tvaNumber: '',
    rge: '', rgeExpiry: '',
    iban: '', bic: '',
  })
  const [profileSaved, setProfileSaved] = useState(false)

  // Logo
  const [logo, setLogo] = useState(null)
  const [logoError, setLogoError] = useState('')
  const logoInputRef = useRef(null)

  // Signature
  const [artisanSignature, setArtisanSignature] = useState(null)
  const [showSigPad, setShowSigPad] = useState(false)
  const sigPadRef = useRef(null)

  // CGV
  const [cgu, setCgu] = useState(DEFAULT_CGU)
  const [cguSaved, setCguSaved] = useState(false)

  useEffect(() => {
    const stored = localStorage.getItem('renovexpert_user')
    if (!stored) { router.push('/login'); return }
    const u = JSON.parse(stored)
    setUser(u)
    setProfile({
      name: u.name || '',
      email: u.email || '',
      company: u.company || '',
      phone: u.phone || '',
      address: u.address || '',
      city: u.city || '',
      postalCode: u.postalCode || '',
      website: u.website || '',
      siret: u.siret || '',
      tvaNumber: u.tvaNumber || '',
      rge: u.rge || '',
      rgeExpiry: u.rgeExpiry || '',
      iban: u.iban || '',
      bic: u.bic || '',
    })
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    setArtisanSignature(s.artisanSignature || null)
    setLogo(s.logo || null)
    setCgu(s.cgu || DEFAULT_CGU)
  }, [router])

  function toast3(msg) { setToast(msg); setTimeout(() => setToast(''), 3000) }

  function saveProfile() {
    const updated = { ...user, ...profile }
    localStorage.setItem('renovexpert_user', JSON.stringify(updated))
    setUser(updated)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2000)
    toast3('✅ Profil enregistré')
  }

  function saveSettings(patch) {
    const s = JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}')
    localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, ...patch }))
  }

  function handleSaveSig() {
    if (sigPadRef.current?.isEmpty()) { alert('Veuillez dessiner une signature.'); return }
    const sig = sigPadRef.current.toDataURL()
    setArtisanSignature(sig)
    saveSettings({ artisanSignature: sig })
    setShowSigPad(false)
    toast3('✅ Signature enregistrée')
  }

  function clearSig() {
    if (!confirm('Supprimer votre signature enregistrée ?')) return
    setArtisanSignature(null)
    saveSettings({ artisanSignature: null })
    toast3('Signature supprimée')
  }

  function handleLogoFile(file) {
    setLogoError('')
    if (!file) return
    if (!/^image\/(png|jpeg|jpg|svg\+xml|webp)$/.test(file.type)) {
      setLogoError('Format non supporté. Utilisez PNG, JPG, SVG ou WebP.')
      return
    }
    if (file.size > 1024 * 1024) {
      setLogoError('Logo trop lourd (max 1 Mo). Compressez l\'image et réessayez.')
      return
    }
    const reader = new FileReader()
    reader.onload = (e) => {
      const dataUrl = e.target.result
      setLogo(dataUrl)
      saveSettings({ logo: dataUrl })
      toast3('✅ Logo enregistré')
    }
    reader.onerror = () => setLogoError('Erreur de lecture du fichier.')
    reader.readAsDataURL(file)
  }

  function clearLogo() {
    if (!confirm('Supprimer le logo enregistré ?')) return
    setLogo(null)
    saveSettings({ logo: null })
    if (logoInputRef.current) logoInputRef.current.value = ''
    toast3('Logo supprimé')
  }

  function saveCgu() {
    saveSettings({ cgu })
    setCguSaved(true)
    setTimeout(() => setCguSaved(false), 2000)
    toast3('✅ CGV mises à jour')
  }

  function handleLogout() {
    if (!confirm('Se déconnecter ?')) return
    localStorage.removeItem('renovexpert_user')
    router.push('/')
  }

  if (!user) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#64748b' }}>Chargement...</p>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f4f8', paddingBottom: '90px' }}>

      {/* Header */}
      <div style={{ backgroundColor: '#1e3a5f', padding: '1.5rem', color: 'white', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ maxWidth: '700px', margin: '0 auto' }}>
          <h1 style={{ fontSize: '1.4rem', fontWeight: '800' }}>⚙️ Paramètres</h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', marginTop: '0.2rem' }}>{user.company} · {user.plan}</p>
        </div>
      </div>

      <div style={{ maxWidth: '700px', margin: '0 auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

        {/* ── Section 1: Société ── */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.4rem' }}>🏢 Informations société</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.2rem' }}>
            Ces informations apparaissent automatiquement en en-tête de vos devis, factures et signatures email.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>

            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Contact</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div><label style={lbl}>Nom complet *</label>
                  <input value={profile.name} onChange={e => setProfile(p => ({ ...p, name: e.target.value }))} placeholder="Jean Dupont" style={inp} /></div>
                <div><label style={lbl}>Email *</label>
                  <input value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} placeholder="jean@entreprise.fr" type="email" style={inp} /></div>
                <div><label style={lbl}>Téléphone</label>
                  <input value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} placeholder="06 00 00 00 00" type="tel" style={inp} /></div>
                <div><label style={lbl}>Site web</label>
                  <input value={profile.website} onChange={e => setProfile(p => ({ ...p, website: e.target.value }))} placeholder="www.dupont-renovation.fr" style={inp} /></div>
              </div>
            </fieldset>

            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Adresse</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.8rem' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Adresse</label>
                  <input value={profile.address} onChange={e => setProfile(p => ({ ...p, address: e.target.value }))} placeholder="12 rue des Artisans" style={inp} /></div>
                <div><label style={lbl}>Code postal</label>
                  <input value={profile.postalCode} onChange={e => setProfile(p => ({ ...p, postalCode: e.target.value }))} placeholder="75011" style={inp} /></div>
                <div style={{ gridColumn: '2 / span 2' }}><label style={lbl}>Ville</label>
                  <input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} placeholder="Paris" style={inp} /></div>
              </div>
            </fieldset>

            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Identification entreprise</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.8rem' }}>
                <div style={{ gridColumn: '1 / -1' }}><label style={lbl}>Raison sociale / Entreprise</label>
                  <input value={profile.company} onChange={e => setProfile(p => ({ ...p, company: e.target.value }))} placeholder="Dupont Rénovation SARL" style={inp} /></div>
                <div><label style={lbl}>Numéro SIRET</label>
                  <input value={profile.siret} onChange={e => setProfile(p => ({ ...p, siret: e.target.value }))} placeholder="123 456 789 00012" style={inp} /></div>
                <div><label style={lbl}>N° TVA intracommunautaire</label>
                  <input value={profile.tvaNumber} onChange={e => setProfile(p => ({ ...p, tvaNumber: e.target.value }))} placeholder="FR 12 345678901" style={inp} /></div>
                <div><label style={lbl}>Numéro RGE</label>
                  <input value={profile.rge} onChange={e => setProfile(p => ({ ...p, rge: e.target.value }))} placeholder="E-E190101" style={inp} /></div>
                <div><label style={lbl}>Validité RGE (date d&apos;expiration)</label>
                  <input value={profile.rgeExpiry} onChange={e => setProfile(p => ({ ...p, rgeExpiry: e.target.value }))} type="date" style={inp} /></div>
              </div>
            </fieldset>

            <fieldset style={fieldsetStyle}>
              <legend style={legendStyle}>Coordonnées bancaires (factures)</legend>
              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '0.8rem' }}>
                <div><label style={lbl}>IBAN</label>
                  <input value={profile.iban} onChange={e => setProfile(p => ({ ...p, iban: e.target.value }))} placeholder="FR76 1234 5678 9012 3456 7890 123" style={inp} /></div>
                <div><label style={lbl}>BIC / SWIFT</label>
                  <input value={profile.bic} onChange={e => setProfile(p => ({ ...p, bic: e.target.value }))} placeholder="BNPAFRPP" style={inp} /></div>
              </div>
            </fieldset>

            <button onClick={saveProfile}
              style={{ alignSelf: 'flex-start', backgroundColor: profileSaved ? '#16a34a' : '#d97706', color: 'white', border: 'none', padding: '0.85rem 1.6rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: 'background-color 0.2s' }}>
              {profileSaved ? '✅ Enregistré !' : '💾 Enregistrer les informations société'}
            </button>
          </div>
        </div>

        {/* ── Aperçu document ── */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.4rem' }}>👁️ Aperçu en-tête de document</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
            Voici comment vos informations apparaîtront en haut de chaque devis et facture.
          </p>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: '12px', padding: '1.5rem', backgroundColor: '#fafafa' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #1e3a5f', paddingBottom: '1rem', marginBottom: '0.8rem', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                {logo ? (
                  <img src={logo} alt="Logo" style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain', display: 'block', marginBottom: '0.5rem' }} />
                ) : (
                  <div style={{ fontSize: '1.4rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.4rem' }}>Renov<span style={{ color: '#d97706' }}>Expert</span></div>
                )}
                <div style={{ fontSize: '0.95rem', fontWeight: '700', color: '#1e293b' }}>{profile.company || '— Raison sociale —'}</div>
                {profile.name && <div style={{ fontSize: '0.85rem', color: '#475569' }}>{profile.name}</div>}
                <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.3rem', lineHeight: 1.5 }}>
                  {profile.address && <div>{profile.address}</div>}
                  {(profile.postalCode || profile.city) && <div>{profile.postalCode} {profile.city}</div>}
                  {profile.phone && <div>📞 {profile.phone}</div>}
                  {profile.email && <div>✉️ {profile.email}</div>}
                  {profile.website && <div>🌐 {profile.website}</div>}
                </div>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.78rem', color: '#64748b', lineHeight: 1.5 }}>
                <div style={{ fontSize: '1.2rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.4rem' }}>DEVIS</div>
                <div>N° DEV-2026-XXX</div>
                <div>Date : {new Date().toLocaleDateString('fr-FR')}</div>
              </div>
            </div>
            <div style={{ fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', lineHeight: 1.6, marginTop: '0.5rem' }}>
              {profile.siret && <span>SIRET : {profile.siret}</span>}
              {profile.tvaNumber && <span>{profile.siret ? ' · ' : ''}TVA : {profile.tvaNumber}</span>}
              {profile.rge && <span>{profile.siret || profile.tvaNumber ? ' · ' : ''}RGE : {profile.rge}{profile.rgeExpiry ? ` (valide jusqu'au ${new Date(profile.rgeExpiry).toLocaleDateString('fr-FR')})` : ''}</span>}
              {!profile.siret && !profile.tvaNumber && !profile.rge && <span>— SIRET · TVA · RGE apparaîtront ici —</span>}
            </div>
            {(profile.iban || profile.bic) && (
              <div style={{ marginTop: '1rem', padding: '0.6rem 0.8rem', backgroundColor: 'white', borderRadius: '8px', fontSize: '0.72rem', color: '#475569' }}>
                <strong style={{ color: '#1e3a5f' }}>Coordonnées bancaires (factures) :</strong>
                {profile.iban && <span style={{ marginLeft: '0.5rem' }}>IBAN {profile.iban}</span>}
                {profile.bic && <span style={{ marginLeft: '0.5rem' }}>· BIC {profile.bic}</span>}
              </div>
            )}
          </div>
        </div>

        {/* ── Section 2: Logo ── */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.4rem' }}>🖼️ Logo de mon entreprise</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.2rem' }}>
            Affiché sur vos devis et factures imprimés. PNG, JPG, SVG ou WebP — max 1 Mo.
          </p>

          <input ref={logoInputRef} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp"
            onChange={e => handleLogoFile(e.target.files?.[0])}
            style={{ display: 'none' }} />

          {logo ? (
            <div>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '1rem', display: 'inline-block', marginBottom: '0.8rem', border: '1px solid #e2e8f0' }}>
                <img src={logo} alt="Logo entreprise" style={{ height: '120px', maxWidth: '320px', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => logoInputRef.current?.click()}
                  style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                  🔄 Remplacer
                </button>
                <button onClick={clearLogo}
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                  🗑 Supprimer
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => logoInputRef.current?.click()}
              style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', width: '100%', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
              + Téléverser un logo
            </button>
          )}

          {logoError && (
            <p style={{ marginTop: '0.6rem', fontSize: '0.82rem', color: '#dc2626' }}>{logoError}</p>
          )}
        </div>

        {/* ── Section 3: Signature ── */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.4rem' }}>✍️ Ma signature électronique</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1.2rem' }}>
            Utilisée pour signer vos devis et factures. Dessinée une fois, réutilisée automatiquement.
          </p>

          {artisanSignature && !showSigPad ? (
            <div>
              <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '1rem', display: 'inline-block', marginBottom: '0.8rem', border: '1px solid #e2e8f0' }}>
                <img src={artisanSignature} alt="Ma signature" style={{ height: '80px', maxWidth: '300px', objectFit: 'contain', display: 'block' }} />
              </div>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button onClick={() => setShowSigPad(true)}
                  style={{ backgroundColor: '#eff6ff', color: '#2563eb', border: '1.5px solid #bfdbfe', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                  ✏️ Redessiner
                </button>
                <button onClick={clearSig}
                  style={{ backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600', fontSize: '0.85rem' }}>
                  🗑 Supprimer
                </button>
              </div>
            </div>
          ) : showSigPad ? (
            <div>
              <SignaturePad ref={sigPadRef} label="Dessinez votre signature" height={160} />
              <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.8rem' }}>
                <button onClick={() => sigPadRef.current?.clear()}
                  style={{ backgroundColor: '#f1f5f9', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  🗑 Effacer
                </button>
                <button onClick={() => { setShowSigPad(false) }}
                  style={{ backgroundColor: 'white', color: '#64748b', border: '1px solid #e2e8f0', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontSize: '0.85rem' }}>
                  Annuler
                </button>
                <button onClick={handleSaveSig}
                  style={{ flex: 1, backgroundColor: '#16a34a', color: 'white', border: 'none', padding: '0.6rem 1rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '700', fontSize: '0.88rem' }}>
                  ✅ Enregistrer la signature
                </button>
              </div>
            </div>
          ) : (
            <button onClick={() => setShowSigPad(true)}
              style={{ backgroundColor: '#f8fafc', border: '2px dashed #cbd5e1', borderRadius: '12px', padding: '2rem', width: '100%', cursor: 'pointer', color: '#64748b', fontSize: '0.9rem', fontWeight: '600' }}>
              + Dessiner ma signature
            </button>
          )}
        </div>

        {/* ── Section 3: CGV ── */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '0.4rem' }}>📋 Conditions Générales de Vente</h2>
          <p style={{ fontSize: '0.82rem', color: '#64748b', marginBottom: '1rem' }}>
            Apparaissent en bas de chaque devis et facture imprimé.
          </p>
          <textarea value={cgu} onChange={e => setCgu(e.target.value)} rows={12}
            style={{ width: '100%', padding: '0.85rem', borderRadius: '10px', border: '1.5px solid #d1d5db', fontSize: '0.82rem', lineHeight: 1.7, resize: 'vertical', boxSizing: 'border-box', outline: 'none', fontFamily: 'inherit', color: '#374151' }} />
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.8rem' }}>
            <button onClick={() => { if (confirm('Remettre le texte par défaut ?')) setCgu(DEFAULT_CGU) }}
              style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer', fontSize: '0.8rem', textDecoration: 'underline' }}>
              Remettre le texte par défaut
            </button>
            <button onClick={saveCgu}
              style={{ backgroundColor: cguSaved ? '#16a34a' : '#d97706', color: 'white', border: 'none', padding: '0.75rem 1.5rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem', transition: 'background-color 0.2s' }}>
              {cguSaved ? '✅ Enregistré !' : 'Enregistrer les CGV'}
            </button>
          </div>
        </div>

        {/* ── Section 4: Compte ── */}
        <div style={{ backgroundColor: 'white', borderRadius: '16px', padding: '1.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: '800', color: '#1e3a5f', marginBottom: '1rem' }}>🔐 Mon compte</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.1rem' }}>Email</p>
                <p style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{user.email}</p>
              </div>
            </div>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.1rem' }}>Forfait</p>
                <p style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>{user.plan}</p>
              </div>
              <span style={{ backgroundColor: '#fef3c7', color: '#d97706', padding: '0.2rem 0.6rem', borderRadius: '20px', fontSize: '0.72rem', fontWeight: '700' }}>Actif</span>
            </div>
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '10px', padding: '0.85rem 1rem' }}>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.1rem' }}>Membre depuis</p>
              <p style={{ fontWeight: '600', color: '#1e293b', fontSize: '0.9rem' }}>
                {user.createdAt ? new Date(user.createdAt).toLocaleDateString('fr-FR', { year: 'numeric', month: 'long', day: 'numeric' }) : '—'}
              </p>
            </div>
          </div>

          <div style={{ marginTop: '1.5rem', paddingTop: '1.2rem', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={handleLogout}
              style={{ width: '100%', backgroundColor: '#fee2e2', color: '#dc2626', border: '1.5px solid #fca5a5', padding: '0.85rem', borderRadius: '10px', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem' }}>
              Se déconnecter
            </button>
          </div>
        </div>

      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: 'fixed', top: '80px', left: '50%', transform: 'translateX(-50%)', backgroundColor: '#1e3a5f', color: 'white', padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: '600', zIndex: 600, boxShadow: '0 4px 20px rgba(0,0,0,0.2)', whiteSpace: 'nowrap' }}>
          {toast}
        </div>
      )}

      <BottomNav />
    </div>
  )
}

const lbl = { display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#475569', marginBottom: '0.3rem' }
const inp = { width: '100%', padding: '0.75rem 0.9rem', borderRadius: '10px', border: '1.5px solid #e2e8f0', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' }
const fieldsetStyle = { border: '1px solid #f1f5f9', borderRadius: '12px', padding: '1rem 1.1rem 1.1rem', margin: 0 }
const legendStyle = { fontSize: '0.78rem', fontWeight: '700', color: '#1e3a5f', textTransform: 'uppercase', letterSpacing: '0.05em', padding: '0 0.5rem' }
