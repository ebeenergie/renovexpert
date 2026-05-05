export interface User {
  id: string
  name: string
  email: string
  company?: string
  plan: 'free' | 'essentiel' | 'pro' | 'premium'
  createdAt: Date
}

export interface Message {
  id: string
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}

export interface DossierSubvention {
  id: string
  type: 'MPR' | 'CEE' | 'ANAH'
  status: 'brouillon' | 'en_cours' | 'soumis' | 'approuve' | 'refuse'
  clientName: string
  address: string
  montantEstime: number
  dateCreation: Date
  dateMiseAJour: Date
}

export interface PricingPlan {
  id: string
  name: string
  price: number
  description: string
  features: string[]
  stripePriceId: string
  highlighted?: boolean
}
