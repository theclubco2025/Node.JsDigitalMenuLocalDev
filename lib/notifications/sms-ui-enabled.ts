/** Checkout SMS opt-in UI; set NEXT_PUBLIC_TWILIO_SMS_ENABLED=true when Twilio is live. */
export const smsCheckoutUiEnabled =
  process.env.NEXT_PUBLIC_TWILIO_SMS_ENABLED === 'true'
