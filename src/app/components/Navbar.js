'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Navbar() {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [userName, setUserName] = useState('')
  const router = useRouter()

  useEffect(() => {
    const user = localStorage.getItem('renovexpert_user')
    if (user) {
      const userData = JSON.parse(user)
      setIsLoggedIn(true)
      setUserName(userData.name)
    }
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('renovexpert_user')
    setIsLoggedIn(false)
    router.push('/')
  }

  return (
    <nav style={{
      backgroundColor: '#1e3a5f',
      padding: '0 2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      height: '64px',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
    }}>
      <Link href="/" style={{ color: 'white', fontSize: '1.4rem', fontWeight: 'bold', display: 'flex', alignItems: 'center' }}>
        Renov<span style={{ color: '#d97706' }}>Expert</span>
      </Link>
      <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
        <Link href="/#features" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Fonctionnalités</Link>
        <Link href="/#pricing" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Tarifs</Link>
        {isLoggedIn ? (
          <>
            <Link href="/dashboard" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Tableau de bord</Link>
            <Link href="/dossiers" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Mes Dossiers</Link>
            <span style={{ color: '#94a3b8', fontSize: '0.85rem' }}>Bonjour, {userName}</span>
            <button
              onClick={handleLogout}
              style={{
                backgroundColor: 'transparent',
                border: '1px solid #d97706',
                color: '#d97706',
                padding: '0.4rem 1rem',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: '600',
              }}
            >
              Déconnexion
            </button>
          </>
        ) : (
          <>
            <Link href="/login" style={{ color: '#cbd5e1', fontSize: '0.9rem' }}>Connexion</Link>
            <Link href="/register" style={{
              backgroundColor: '#d97706',
              color: 'white',
              padding: '0.4rem 1.2rem',
              borderRadius: '6px',
              fontSize: '0.9rem',
              fontWeight: '700',
            }}>
              Commencer
            </Link>
          </>
        )}
      </div>
    </nav>
  )
}
