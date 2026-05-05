import './globals.css'

export const metadata = {
  title: 'RenovExpert - Expert en aides à la rénovation',
  description: "Simplifiez vos dossiers MaPrimeRénov', CEE et ANAH",
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  )
}
