'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Navbar from '../components/Navbar'

const inputStyle = {
  width: '100%',
  padding: '0.75rem 1rem',
  borderRadius: '8px',
  border: '1px solid #d1d5db',
  fontSize: '0.95rem',
  outline: 'none',
  backgroundColor: 'white',
}

const labelStyle = {
  display: 'block',
  fontSize: '0.85rem',
  fontWeight: '600',
  color: '#374151',
  marginBottom: '0.4rem',
}

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', company: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')

    if (!form.name || !form.email || !form.password || !form.company) {
      setError('Veuillez remplir tous les champs.')
      return
    }
    if (form.password.length < 6) {
      setError('Le mot de passe doit contenir au moins 6 caractères.')
      return
    }

    setLoading(true)
    setTimeout(() => {
      const userData = {
        name: form.name,
        email: form.email,
        company: form.company,
        password: form.password,
        plan: 'Essentiel',
        createdAt: new Date().toISOString(),
      }
      localStorage.setItem('renovexpert_user', JSON.stringify(userData))
      router.push('/dashboard')
    }, 800)
  }

  const fields = [
    { name: 'name', label: 'Nom complet', type: 'text', placeholder: 'Jean Dupont' },
    { name: 'email', label: 'Adresse email', type: 'email', placeholder: 'jean@entreprise.fr' },
    { name: 'company', label: "Nom de l'entreprise", type: 'text', placeholder: 'Dupont Rénovation' },
    { name: 'password', label: 'Mot de passe', type: 'password', placeholder: '••••••••' },
  ]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '3rem 1rem' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '440px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e3a5f', display: 'inline-block' }}>
              Renov<span style={{ color: '#d97706' }}>Expert</span>
            </Link>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e3a5f', marginTop: '1rem' }}>
              Créer votre compte
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              14 jours d'essai gratuit, sans carte bancaire
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            {fields.map((field) => (
              <div key={field.name} style={{ marginBottom: '1.2rem' }}>
                <label style={labelStyle}>{field.label}</label>
                <input
                  type={field.type}
                  name={field.name}
                  value={form[field.name]}
                  onChange={handleChange}
                  placeholder={field.placeholder}
                  style={inputStyle}
                />
              </div>
            ))}

            {error && (
              <div style={{
                backgroundColor: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '0.7rem 1rem',
                color: '#dc2626',
                fontSize: '0.85rem',
                marginBottom: '1rem',
              }}>
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                backgroundColor: loading ? '#94a3b8' : '#d97706',
                color: 'white',
                padding: '0.85rem',
                borderRadius: '8px',
                border: 'none',
                fontWeight: '700',
                fontSize: '1rem',
                cursor: loading ? 'not-allowed' : 'pointer',
                marginBottom: '1rem',
              }}
            >
              {loading ? 'Création en cours...' : 'Créer mon compte'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
            Déjà un compte ?{' '}
            <Link href="/login" style={{ color: '#d97706', fontWeight: '600' }}>
              Se connecter
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
