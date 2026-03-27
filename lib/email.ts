import nodemailer from 'nodemailer'

type CateringOrderEmail = {
  to: string
  customerName: string
  customerEmail: string
  customerPhone: string
  companyName?: string
  eventDate: string
  eventTime?: string
  guestCount: number
  eventType?: string
  deliveryAddress?: string
  deliveryNotes?: string
  dietaryNotes?: string
  items: Array<{ name: string; quantity: number; unitPriceCents: number }>
  subtotalCents: number
  orderNote?: string
  orderId: string
  tenantName: string
}

function formatMoney(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`
}

function buildCateringOrderHtml(order: CateringOrderEmail): string {
  const itemRows = order.items
    .map(
      (it) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${it.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${it.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${formatMoney(it.unitPriceCents * it.quantity)}</td>
        </tr>`
    )
    .join('')

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #C4A76A 0%, #A68B4C 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">🍽️ New Catering Order</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Order #${order.orderId.slice(-8).toUpperCase()}</p>
  </div>
  
  <div style="background: #f9f9f9; padding: 24px; border: 1px solid #eee; border-top: none;">
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #222;">📅 Event Details</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; color: #666; width: 140px;">Date:</td>
        <td style="padding: 6px 0; font-weight: 600;">${order.eventDate}${order.eventTime ? ` at ${order.eventTime}` : ''}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #666;">Guest Count:</td>
        <td style="padding: 6px 0; font-weight: 600;">${order.guestCount} guests</td>
      </tr>
      ${order.eventType ? `<tr><td style="padding: 6px 0; color: #666;">Event Type:</td><td style="padding: 6px 0; font-weight: 600;">${order.eventType}</td></tr>` : ''}
      ${order.deliveryAddress ? `<tr><td style="padding: 6px 0; color: #666;">Delivery To:</td><td style="padding: 6px 0; font-weight: 600;">${order.deliveryAddress}</td></tr>` : ''}
      ${order.deliveryNotes ? `<tr><td style="padding: 6px 0; color: #666;">Delivery Notes:</td><td style="padding: 6px 0;">${order.deliveryNotes}</td></tr>` : ''}
    </table>
  </div>

  <div style="background: white; padding: 24px; border: 1px solid #eee; border-top: none;">
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #222;">👤 Customer Information</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 6px 0; color: #666; width: 140px;">Name:</td>
        <td style="padding: 6px 0; font-weight: 600;">${order.customerName}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #666;">Email:</td>
        <td style="padding: 6px 0;"><a href="mailto:${order.customerEmail}" style="color: #C4A76A;">${order.customerEmail}</a></td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #666;">Phone:</td>
        <td style="padding: 6px 0;"><a href="tel:${order.customerPhone}" style="color: #C4A76A;">${order.customerPhone}</a></td>
      </tr>
      ${order.companyName ? `<tr><td style="padding: 6px 0; color: #666;">Company:</td><td style="padding: 6px 0; font-weight: 600;">${order.companyName}</td></tr>` : ''}
    </table>
  </div>

  ${order.dietaryNotes ? `
  <div style="background: #fff8e6; padding: 16px 24px; border: 1px solid #eee; border-top: none;">
    <h3 style="margin: 0 0 8px; font-size: 14px; color: #222;">🥗 Dietary Requirements</h3>
    <p style="margin: 0; color: #666;">${order.dietaryNotes}</p>
  </div>
  ` : ''}

  <div style="background: white; padding: 24px; border: 1px solid #eee; border-top: none;">
    <h2 style="margin: 0 0 16px; font-size: 18px; color: #222;">📋 Order Items</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <thead>
        <tr style="background: #f5f5f5;">
          <th style="padding: 10px 8px; text-align: left; font-weight: 600;">Item</th>
          <th style="padding: 10px 8px; text-align: center; font-weight: 600;">Qty</th>
          <th style="padding: 10px 8px; text-align: right; font-weight: 600;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="2" style="padding: 12px 8px; text-align: right; font-weight: 600; border-top: 2px solid #ddd;">Estimated Total:</td>
          <td style="padding: 12px 8px; text-align: right; font-weight: 700; font-size: 18px; color: #C4A76A; border-top: 2px solid #ddd;">${formatMoney(order.subtotalCents)}</td>
        </tr>
      </tfoot>
    </table>
  </div>

  ${order.orderNote ? `
  <div style="background: #f0f0f0; padding: 16px 24px; border: 1px solid #eee; border-top: none;">
    <h3 style="margin: 0 0 8px; font-size: 14px; color: #222;">📝 Additional Notes</h3>
    <p style="margin: 0; color: #666;">${order.orderNote}</p>
  </div>
  ` : ''}

  <div style="background: #222; padding: 20px 24px; border-radius: 0 0 12px 12px; color: white; text-align: center;">
    <p style="margin: 0; font-size: 14px;">
      Please respond to the customer within 24 hours to confirm availability and finalize details.
    </p>
    <div style="margin-top: 16px;">
      <a href="mailto:${order.customerEmail}" style="display: inline-block; background: #C4A76A; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
        Reply to Customer
      </a>
    </div>
  </div>

  <p style="margin-top: 24px; font-size: 12px; color: #999; text-align: center;">
    This is an automated notification from ${order.tenantName} via PlateHaven.
  </p>
</body>
</html>
`
}

function buildCateringOrderText(order: CateringOrderEmail): string {
  const items = order.items
    .map((it) => `  - ${it.name} x${it.quantity}: ${formatMoney(it.unitPriceCents * it.quantity)}`)
    .join('\n')

  return `
NEW CATERING ORDER
Order #${order.orderId.slice(-8).toUpperCase()}
${'='.repeat(50)}

EVENT DETAILS
  Date: ${order.eventDate}${order.eventTime ? ` at ${order.eventTime}` : ''}
  Guests: ${order.guestCount}
${order.eventType ? `  Event Type: ${order.eventType}` : ''}
${order.deliveryAddress ? `  Delivery: ${order.deliveryAddress}` : ''}
${order.deliveryNotes ? `  Notes: ${order.deliveryNotes}` : ''}

CUSTOMER
  Name: ${order.customerName}
  Email: ${order.customerEmail}
  Phone: ${order.customerPhone}
${order.companyName ? `  Company: ${order.companyName}` : ''}

${order.dietaryNotes ? `DIETARY REQUIREMENTS\n  ${order.dietaryNotes}\n` : ''}

ORDER ITEMS
${items}

ESTIMATED TOTAL: ${formatMoney(order.subtotalCents)}

${order.orderNote ? `ADDITIONAL NOTES\n  ${order.orderNote}\n` : ''}

Please respond to the customer within 24 hours.
`.trim()
}

// ═══════════════════════════════════════════════════════════════════════════
// QUOTE EMAIL
// ═══════════════════════════════════════════════════════════════════════════

type QuoteEmail = {
  to: string
  customerName: string
  tenantName: string
  quoteNumber: string
  quoteUrl: string
  eventDate?: string
  eventType?: string
  guestCount?: number
  totalCents: number
  depositCents: number
  expiresAt: string
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

function buildQuoteEmailHtml(quote: QuoteEmail): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.5; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
  <div style="background: linear-gradient(135deg, #C4A76A 0%, #A68B4C 100%); padding: 24px; border-radius: 12px 12px 0 0;">
    <h1 style="color: white; margin: 0; font-size: 24px;">Your Catering Quote is Ready</h1>
    <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Quote #${quote.quoteNumber}</p>
  </div>
  
  <div style="background: white; padding: 24px; border: 1px solid #eee; border-top: none;">
    <p style="font-size: 16px; margin: 0 0 16px;">Hi ${quote.customerName},</p>
    <p style="margin: 0 0 16px;">Thank you for your catering inquiry! ${quote.tenantName} has prepared a quote for your event.</p>
    
    <div style="background: #f9f9f9; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <table style="width: 100%; border-collapse: collapse;">
        ${quote.eventDate ? `<tr><td style="padding: 6px 0; color: #666;">Event Date:</td><td style="padding: 6px 0; font-weight: 600;">${formatDate(quote.eventDate)}</td></tr>` : ''}
        ${quote.eventType ? `<tr><td style="padding: 6px 0; color: #666;">Event Type:</td><td style="padding: 6px 0; font-weight: 600;">${quote.eventType}</td></tr>` : ''}
        ${quote.guestCount ? `<tr><td style="padding: 6px 0; color: #666;">Guests:</td><td style="padding: 6px 0; font-weight: 600;">${quote.guestCount} people</td></tr>` : ''}
        <tr><td style="padding: 6px 0; color: #666;">Total:</td><td style="padding: 6px 0; font-weight: 700; font-size: 18px; color: #C4A76A;">${formatMoney(quote.totalCents)}</td></tr>
        <tr><td style="padding: 6px 0; color: #666;">Deposit (50%):</td><td style="padding: 6px 0; font-weight: 600;">${formatMoney(quote.depositCents)}</td></tr>
      </table>
    </div>

    <div style="text-align: center; margin: 24px 0;">
      <a href="${quote.quoteUrl}" style="display: inline-block; background: #C4A76A; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">
        View Quote & Accept
      </a>
    </div>

    <p style="margin: 0; padding: 16px; background: #fff8e6; border-radius: 8px; font-size: 14px; text-align: center;">
      ⏰ This quote expires on <strong>${formatDate(quote.expiresAt)}</strong>
    </p>
  </div>

  <div style="background: #f5f5f5; padding: 20px 24px; border-radius: 0 0 12px 12px; text-align: center;">
    <p style="margin: 0; font-size: 14px; color: #666;">
      Questions? Reply to this email or contact ${quote.tenantName} directly.
    </p>
  </div>

  <p style="margin-top: 24px; font-size: 12px; color: #999; text-align: center;">
    This email was sent by ${quote.tenantName} via PlateHaven.
  </p>
</body>
</html>
`
}

function buildQuoteEmailText(quote: QuoteEmail): string {
  return `
YOUR CATERING QUOTE IS READY
Quote #${quote.quoteNumber}
${'='.repeat(50)}

Hi ${quote.customerName},

Thank you for your catering inquiry! ${quote.tenantName} has prepared a quote for your event.

${quote.eventDate ? `Event Date: ${formatDate(quote.eventDate)}` : ''}
${quote.eventType ? `Event Type: ${quote.eventType}` : ''}
${quote.guestCount ? `Guests: ${quote.guestCount} people` : ''}

Total: ${formatMoney(quote.totalCents)}
Deposit (50%): ${formatMoney(quote.depositCents)}

View and accept your quote here:
${quote.quoteUrl}

This quote expires on ${formatDate(quote.expiresAt)}.

Questions? Reply to this email or contact ${quote.tenantName} directly.
`.trim()
}

export async function sendQuoteEmail(quote: QuoteEmail): Promise<{ sent: boolean; error?: string }> {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || smtpUser

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('[email] SMTP not configured, skipping quote email')
    return { sent: false, error: 'SMTP not configured' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort ? parseInt(smtpPort, 10) : 587,
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const subject = `Your Catering Quote from ${quote.tenantName} - ${quote.quoteNumber}`

    await transporter.sendMail({
      from: smtpFrom,
      to: quote.to,
      subject,
      text: buildQuoteEmailText(quote),
      html: buildQuoteEmailHtml(quote),
    })

    console.log(`[email] Quote email sent to ${quote.to}`)
    return { sent: true }
  } catch (e) {
    const msg = (e as Error)?.message || 'Email send failed'
    console.error('[email] Error sending quote email:', msg)
    return { sent: false, error: msg }
  }
}

export async function sendCateringOrderNotification(order: CateringOrderEmail): Promise<{ sent: boolean; error?: string }> {
  const smtpHost = process.env.SMTP_HOST
  const smtpPort = process.env.SMTP_PORT
  const smtpUser = process.env.SMTP_USER
  const smtpPass = process.env.SMTP_PASS
  const smtpFrom = process.env.SMTP_FROM || smtpUser

  if (!smtpHost || !smtpUser || !smtpPass) {
    console.log('[email] SMTP not configured, skipping notification')
    return { sent: false, error: 'SMTP not configured' }
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPort ? parseInt(smtpPort, 10) : 587,
      secure: smtpPort === '465',
      auth: {
        user: smtpUser,
        pass: smtpPass,
      },
    })

    const subject = `🍽️ New Catering Order from ${order.customerName} - ${order.eventDate}`

    await transporter.sendMail({
      from: smtpFrom,
      to: order.to,
      subject,
      text: buildCateringOrderText(order),
      html: buildCateringOrderHtml(order),
    })

    console.log(`[email] Catering order notification sent to ${order.to}`)
    return { sent: true }
  } catch (e) {
    const msg = (e as Error)?.message || 'Email send failed'
    console.error('[email] Error sending catering notification:', msg)
    return { sent: false, error: msg }
  }
}
