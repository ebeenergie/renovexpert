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

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    setTimeout(() => {
      const storedUser = localStorage.getItem('renovexpert_user')
      if (!storedUser) {
        setError('Aucun compte trouvé. Veuillez vous inscrire.')
        setLoading(false)
        return
      }
      const user = JSON.parse(storedUser)
      if (user.email !== form.email || user.password !== form.password) {
        setError('Email ou mot de passe incorrect.')
        setLoading(false)
        return
      }
      router.push('/dashboard')
    }, 600)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navbar />
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem' }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '2.5rem',
          width: '100%',
          maxWidth: '400px',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
            <Link href="/" style={{ fontSize: '1.5rem', fontWeight: '800', color: '#1e3a5f', display: 'inline-block' }}>
              Renov<span style={{ color: '#d97706' }}>Expert</span>
            </Link>
            <h1 style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1e3a5f', marginTop: '1rem' }}>
              Bon retour !
            </h1>
            <p style={{ color: '#64748b', fontSize: '0.9rem', marginTop: '0.4rem' }}>
              Connectez-vous à votre espace
            </p>
          </div>

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.2rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                Adresse email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="jean@entreprise.fr"
                required
                style={inputStyle}
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '600', color: '#374151', marginBottom: '0.4rem' }}>
                Mot de passe
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                style={inputStyle}
              />
            </div>

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
                backgroundColor: loading ? '#94a3b8' : '#1e3a5f',
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
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </form>

          <p style={{ textAlign: 'center', fontSize: '0.9rem', color: '#64748b' }}>
            Pas encore de compte ?{' '}
            <Link href="/register" style={{ color: '#d97706', fontWeight: '600' }}>
              S'inscrire gratuitement
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
