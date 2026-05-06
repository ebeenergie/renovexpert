import { NextResponse } from 'next/server'
import { Resend } from 'resend'
import { kv } from '@vercel/kv'

export async function POST(req) {
  try {
    const { type, document, clientEmail, subject, message, artisan } = await req.json()

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json({ error: 'RESEND_API_KEY non configurée' }, { status: 500 })
    }

    const resend = new Resend(process.env.RESEND_API_KEY)
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://renovexpert.fr'
    const signingUrl = `${baseUrl}/signer/${document.id}`

    // Store document in KV (90 day TTL)
    await kv.set(`doc:${document.id}`, {
      ...document,
      type,
      signingStatus: 'sent',
      sentAt: new Date().toISOString(),
      artisan,
      clientEmail,
    }, { ex: 60 * 60 * 24 * 90 })

    const docLabel = type === 'devis' ? 'devis' : 'facture'
    const DocLabel = type === 'devis' ? 'Devis' : 'Facture'
    const sub = type === 'devis'
      ? (document.items || []).reduce((s, it) => s + (it.quantity || 0) * (it.unitPrice || 0), 0) + (document.laborCost || 0)
      : (parseFloat(document.amount) || 0)
    const tvaRate = type === 'devis' ? (document.taxRate || 10) : (parseFloat(document.tva) || 10)
    const ttc = sub * (1 + tvaRate / 100)

    const from = process.env.RESEND_FROM_EMAIL || 'RenovExpert <onboarding@resend.dev>'

    const { error } = await resend.emails.send({
      from,
      to: clientEmail,
      subject,
      html: buildEmailHtml({ type, document, docLabel, DocLabel, message, artisan, signingUrl, ttc, tvaRate }),
    })

    if (error) throw new Error(error.message)

    // Notify artisan of sending
    if (artisan.email && artisan.email !== clientEmail) {
      await resend.emails.send({
        from,
        to: artisan.email,
        subject: `📤 ${DocLabel} ${document.numero || document.number} envoyé à ${document.clientName}`,
        html: `<div style="font-family:sans-serif;max-width:500px;margin:0 auto;padding:20px"><h2 style="color:#1e3a5f">Document envoyé ✅</h2><p>Votre ${docLabel} <strong>${document.numero || document.number}</strong> a été envoyé à <strong>${document.clientName}</strong> (${clientEmail}) pour signature.</p><p>Le client recevra une notification dès qu'il aura consulté et signé le document.</p></div>`,
      })
    }

    return NextResponse.json({ success: true, signingUrl })
  } catch (err) {
    console.error('send-document error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

function buildEmailHtml({ type, document, docLabel, DocLabel, message, artisan, signingUrl, ttc, tvaRate }) {
  const docNum = document.numero || document.number || ''
  const docDate = document.createdAt || document.dateEmission || ''
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f0f4f8;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
<div style="max-width:600px;margin:0 auto;padding:20px">
  <div style="background:white;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.10)">
    <div style="background:#1e3a5f;padding:28px 32px;text-align:center">
      <h1 style="color:white;margin:0;font-size:26px;font-weight:900">Renov<span style="color:#d97706">Expert</span></h1>
      <p style="color:#94a3b8;margin:6px 0 0;font-size:14px">${artisan.company || artisan.name || ''}</p>
    </div>
    <div style="padding:32px">
      <p style="color:#374151;font-size:15px;line-height:1.7;margin:0 0 24px">${message.replace(/\n/g, '<br>')}</p>
      <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;padding:20px;margin-bottom:28px">
        <div style="font-size:11px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px">${DocLabel}</div>
        <div style="font-size:18px;font-weight:800;color:#1e3a5f;margin-bottom:4px">${docNum}</div>
        <div style="font-size:13px;color:#64748b">Client : ${document.clientName}</div>
        ${docDate ? `<div style="font-size:13px;color:#64748b">Date : ${docDate}</div>` : ''}
        <div style="font-size:22px;font-weight:900;color:#d97706;margin-top:12px">${ttc.toFixed(2)} € TTC</div>
        <div style="font-size:11px;color:#94a3b8">TVA ${tvaRate}%</div>
      </div>
      <div style="text-align:center;margin-bottom:28px">
        <a href="${signingUrl}" style="display:inline-block;background:#d97706;color:white;text-decoration:none;padding:16px 36px;border-radius:12px;font-weight:700;font-size:16px">
          ✍️ Voir et signer le ${docLabel}
        </a>
      </div>
      <p style="color:#94a3b8;font-size:12px;text-align:center;line-height:1.6">
        Ce lien est valable 90 jours.<br>
        ${artisan.phone ? `Des questions ? Contactez ${artisan.name || ''} au ${artisan.phone}` : ''}
      </p>
    </div>
    <div style="background:#f8fafc;padding:16px 32px;border-top:1px solid #e2e8f0;text-align:center">
      <p style="color:#94a3b8;font-size:11px;margin:0">RenovExpert — Gestion simplifiée pour les artisans du bâtiment</p>
    </div>
  </div>
</div>
</body>
</html>`
}
