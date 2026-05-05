'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const navItems = [
  { href: '/dashboard', icon: '🤖', label: 'Assistant' },
  { href: '/clients', icon: '👥', label: 'Clients' },
  { href: '/dossiers', icon: '📁', label: 'Dossiers' },
  { href: '/catalogue', icon: '📦', label: 'Catalogue' },
  { href: '/factures', icon: '💰', label: 'Factures' },
  { href: '/agenda', icon: '🗓', label: 'Agenda' },
  { href: '/settings', icon: '⚙️', label: 'Réglages' },
]

export default function BottomNav() {
  const pathname = usePathname()

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      height: '64px',
      backgroundColor: 'white',
      borderTop: '1px solid #e2e8f0',
      display: 'flex',
      alignItems: 'stretch',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.08)',
      zIndex: 200,
    }}>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href))
        return (
          <Link
            key={item.href}
            href={item.href}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '3px',
              textDecoration: 'none',
              backgroundColor: isActive ? '#eff6ff' : 'transparent',
              borderTop: isActive ? '3px solid #d97706' : '3px solid transparent',
              transition: 'all 0.15s',
            }}
          >
            <span style={{ fontSize: '1.4rem', lineHeight: 1 }}>{item.icon}</span>
            <span style={{
              fontSize: '0.68rem',
              fontWeight: isActive ? '700' : '500',
              color: isActive ? '#d97706' : '#64748b',
              letterSpacing: '0.02em',
            }}>
              {item.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
