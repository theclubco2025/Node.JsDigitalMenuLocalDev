import { sendCateringOrderNotification as sendCateringSmtp } from '@/lib/email'
import { resendConfigured, safeErr, sendResendEmail } from '@/lib/notifications/resend-client'

export type CateringOrderEmail = {
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

function buildCateringOrderText(order: CateringOrderEmail): string {
  const items = order.items
    .map((it) => `  - ${it.name} x${it.quantity}: ${formatMoney(it.unitPriceCents * it.quantity)}`)
    .join('\n')
  return `
NEW CATERING ORDER
Order #${order.orderId.slice(-8).toUpperCase()}

EVENT: ${order.eventDate}${order.eventTime ? ` at ${order.eventTime}` : ''}
Guests: ${order.guestCount}
Customer: ${order.customerName} (${order.customerEmail}, ${order.customerPhone})
${order.companyName ? `Company: ${order.companyName}` : ''}

ITEMS
${items}

Estimated total: ${formatMoney(order.subtotalCents)}
${order.orderNote ? `\nNotes: ${order.orderNote}` : ''}
`.trim()
}

function buildCateringOrderHtml(order: CateringOrderEmail): string {
  const body = buildCateringOrderText(order)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br>')
  const open = '<div style="font-family:sans-serif;line-height:1.5">'
  const close = '</div>'
  return open + body + close
}

export async function sendCateringOrderNotification(
  order: CateringOrderEmail,
): Promise<{ sent: boolean; channel?: 'resend' | 'smtp'; error?: string }> {
  const subject = `New catering inquiry from ${order.customerName} - ${order.eventDate}`

  if (resendConfigured()) {
    try {
      await sendResendEmail({
        to: order.to,
        subject,
        text: buildCateringOrderText(order),
        html: buildCateringOrderHtml(order),
      })
      return { sent: true, channel: 'resend' }
    } catch (e) {
      console.error('[catering-email] Resend failed, trying SMTP:', safeErr(e))
    }
  }

  const smtp = await sendCateringSmtp(order)
  return { ...smtp, channel: smtp.sent ? 'smtp' : undefined }
}
