import { runRetentionEmailCron } from '@/lib/notifications/resend-retention'
import { runRetentionSmsCron } from '@/lib/notifications/retention'
import { resendConfigured } from '@/lib/notifications/resend-client'
import { twilioConfigured } from '@/lib/notifications/twilio'

export async function runRetentionCron(now: Date = new Date()) {
  const sms = twilioConfigured()
    ? await runRetentionSmsCron(now)
    : { ok: true, skipped: 'twilio_not_configured', scanned: 0, queued: 0, sent: 0, failed: 0 }
  const email = resendConfigured()
    ? await runRetentionEmailCron(now)
    : { ok: true, skipped: 'resend_not_configured', scanned: 0, queued: 0, sent: 0, failed: 0 }
  return { ok: true, sms, email }
}
