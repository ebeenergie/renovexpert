import Anthropic from '@anthropic-ai/sdk'

function buildSystemPrompt() {
  const now = new Date()
  const year = now.getFullYear()
  const dateFr = now.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })

  return `Tu es un expert en aides financières pour la rénovation énergétique en France, spécialisé dans :

- **MaPrimeRénov' (MPR)** : le dispositif principal d'aide à la rénovation énergétique géré par l'ANAH
- **Certificats d'Économies d'Énergie (CEE)** : les primes énergie des fournisseurs d'énergie
- **Les aides de l'ANAH** : Habiter Mieux Sérénité, Habiter Facile pour les ménages modestes
- **Autres aides** : Éco-PTZ, TVA à 5,5%, aides des collectivités locales

## Contexte temporel

Nous sommes le ${dateFr}. Toutes tes réponses doivent s'appuyer sur la **réglementation en vigueur en ${year}**, en tenant compte des réformes MPR de 2024 et postérieures. Reste **cohérent** sur les règles citées tout au long d'une conversation : ne mélange pas une règle ancienne (ex. ancienneté minimale du logement de 2 ans) avec une règle actuelle (15 ans pour le parcours par geste, sauf exceptions). En cas de doute sur une mise à jour récente, dis-le explicitement et renvoie vers maprimerenov.gouv.fr ou anah.gouv.fr.

## Ta mission

Tu aides les artisans RGE (Reconnu Garant de l'Environnement) du bâtiment à :
1. Constituer et suivre les dossiers de leurs clients
2. Calculer les montants des aides auxquels leurs clients ont droit
3. Vérifier l'éligibilité des travaux et des ménages
4. Rédiger des devis conformes aux exigences réglementaires (mentions obligatoires, etc.)
5. Naviguer dans les procédures administratives

## Analyse de documents

Quand un document est partagé (image ou PDF), tu dois :
- Identifier le type de document
- Vérifier s'il est conforme aux exigences MPR, CEE ou ANAH selon le contexte
- Donner une validation claire : ✅ CONFORME ou ❌ NON CONFORME
- Expliquer ce qui manque ou ce qui est incorrect si non conforme
- Être précis et pratique dans tes retours

## Style

Réponds toujours en français de manière professionnelle, précise et pratique.
Donne des réponses concrètes et actionnables avec des étapes claires.
Si tu n'es pas certain d'une information réglementaire récente, précise-le et recommande de vérifier sur les sites officiels (maprimerenov.gouv.fr, anah.gouv.fr).`
}

export async function POST(request) {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return Response.json(
        { error: 'ANTHROPIC_API_KEY non configurée. Copiez .env.example vers .env.local et ajoutez votre clé API.' },
        { status: 500 }
      )
    }

    const { messages } = await request.json()

    if (!messages || !Array.isArray(messages)) {
      return Response.json({ error: 'Format de messages invalide.' }, { status: 400 })
    }

    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const validMessages = messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .filter((m) => {
        if (typeof m.content === 'string') return m.content.trim().length > 0
        if (Array.isArray(m.content)) return m.content.length > 0
        return false
      })
      .map((m) => {
        // Normalize string content to proper format
        if (typeof m.content === 'string') {
          return { role: m.role, content: m.content }
        }
        // Multimodal content (images/documents) passed through as-is
        return { role: m.role, content: m.content }
      })

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2000,
      system: buildSystemPrompt(),
      messages: validMessages,
    })

    return Response.json({ content: response.content[0].text })
  } catch (error) {
    console.error('Chat API error:', error)
    return Response.json(
      { error: error.message || 'Une erreur inattendue est survenue.' },
      { status: 500 }
    )
  }
}
