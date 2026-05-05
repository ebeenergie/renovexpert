import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RenovExpert - Gestion de chantiers pour artisans",
  description: "Plateforme SaaS pour artisans du bâtiment. Gérez vos chantiers, aides MPR, CEE et ANAH facilement.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
