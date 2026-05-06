import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { kv } from '@vercel/kv'

export async function POST(request, { params }) {
  try {
    const { id } = params
    const { signature, signerName, refused } = await request.json()

    const doc = await kv.get(`doc:${id}`)
    if (!doc) return NextResponse.json({ error: 'Document introuvable ou expiré' }, { status: 404 })
    if (doc.signingStatus === 'signed') return NextResponse.json({ error: 'Document déjà signé' }, { status: 400 })

    const signedAt = new Date().toLocaleString('fr-FR')
    const status = refused ? 'refused' : 'signed'

    const updated = { ...doc, signingStatus: status, signerName, signedAt, clientSignature: refused ? null : signature }
    await kv.set(`doc:${id}`, updated, { keepTtl: true })

    // Notify artisan
    if (process.env.RESEND_API_KEY && doc.artisan?.email) {
      const resend = new Resend(process.env.RESEND_API_KEY)
      const from = process.env.RESEND_FROM_EMAIL || 'RenovExpert <onboarding@resend.dev>'
      const docLabel = doc.type === 'devis' ? 'Devis' : 'Facture'
      const docNum = doc.numero || doc.number || ''

      if (refused) {
        await resend.emails.send({
          from,
          to: doc.artisan.email,
          subject: `❌ ${docLabel} ${docNum} refusé par ${doc.clientName}`,
          html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px"><h2 style="color:#dc2626">Document refusé</h2><p>${doc.clientName} a refusé de signer le ${docLabel.toLowerCase()} <strong>${docNum}</strong> le ${signedAt}.</p></div>`,
        })
      } else {
        await resend.emails.send({
          from,
          to: doc.artisan.email,
          subject: `✅ ${docLabel} ${docNum} signé par ${doc.clientName}`,
          html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px">
            <div style="background:#1e3a5f;padding:20px;border-radius:12px;text-align:center;margin-bottom:20px">
              <h1 style="color:white;margin:0;font-size:22px">Renov<span style="color:#d97706">Expert</span></h1>
            </div>
            <h2 style="color:#16a34a">✅ ${docLabel} signé !</h2>
            <p>${doc.clientName} a signé le ${docLabel.toLowerCase()} <strong>${docNum}</strong> le ${signedAt}.</p>
            ${signature ? `<div style="margin-top:16px"><p style="font-size:12px;color:#64748b;margin-bottom:8px">Signature de ${signerName} :</p><img src="${signature}" style="max-width:280px;height:80px;object-fit:contain;border:1px solid #e2e8f0;border-radius:8px;background:#f9fafb" /></div>` : ''}
            <p style="margin-top:20px;color:#64748b;font-size:13px">Connectez-vous à RenovExpert pour mettre à jour le statut de votre document.</p>
          </div>`,
        })
      }
    }

    return NextResponse.json({ success: true, signedAt, status })
  } catch (err) {
    console.error('sign error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// Poll status (GET)
export async function GET(request, { params }) {
  try {
    const { id } = params
    const doc = await kv.get(`doc:${id}`)
    if (!doc) return NextResponse.json({ signingStatus: 'none' })
    return NextResponse.json({
      signingStatus: doc.signingStatus,
      signedAt: doc.signedAt,
      signerName: doc.signerName,
      clientSignature: doc.clientSignature || null,
    })
  } catch (err) {
    return NextResponse.json({ signingStatus: 'none' })
  }
}
