import { NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

export async function GET(request, { params }) {
  try {
    const { id } = params
    const doc = await kv.get(`doc:${id}`)
    if (!doc) return NextResponse.json({ error: 'Document introuvable ou expiré' }, { status: 404 })

    // Mark as viewed
    if (doc.signingStatus === 'sent') {
      await kv.set(`doc:${id}`, { ...doc, signingStatus: 'viewed', viewedAt: new Date().toISOString() }, { keepTtl: true })
    }

    return NextResponse.json(doc)
  } catch (err) {
    console.error('get-document error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
