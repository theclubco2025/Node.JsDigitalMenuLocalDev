"use client"

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

interface QuoteItem {
  id: string
  name: string
  quantity: number
  unitPriceCents: number
  totalCents: number
  note?: string
  addOns?: Array<{ name: string; priceDeltaCents: number }>
}

interface QuoteData {
  id: string
  quoteNumber: string
  status: string
  quoteStatus: string | null
  quoteExpiresAt: string | null
  quoteSentAt: string | null
  quoteAcceptedAt: string | null
  quoteNotes: string | null
  eventDate: string | null
  eventTime: string | null
  guestCount: number | null
  eventType: string | null
  deliveryAddress: string | null
  venueName: string | null
  dietaryNotes: string | null
  customerName: string | null
  customerEmail: string | null
  customerPhone: string | null
  companyName: string | null
  items: QuoteItem[]
  subtotalCents: number
  deliveryFeeCents: number
  serviceFeeCents: number
  totalCents: number
  depositPercent: number | null
  depositCents: number | null
  depositPaidAt: string | null
  balanceCents: number | null
  balancePaidAt: string | null
  paymentTerms: string | null
  cancellationPolicy: string | null
  tenant: {
    name: string
    slug: string
    contactPhone: string | null
    contactEmail: string | null
  }
  createdAt: string
}

function formatMoney(cents: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100)
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function QuotePage() {
  const params = useParams()
  const orderId = params?.orderId as string
  
  const [quote, setQuote] = useState<QuoteData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  useEffect(() => {
    if (!orderId) return

    async function loadQuote() {
      try {
        const res = await fetch(`/api/quote/${orderId}`)
        if (!res.ok) {
          const data = await res.json().catch(() => ({}))
          throw new Error(data.error || 'Failed to load quote')
        }
        const data = await res.json()
        setQuote(data)
      } catch (e) {
        setError((e as Error).message || 'Failed to load quote')
      } finally {
        setLoading(false)
      }
    }

    loadQuote()
  }, [orderId])

  const handleAcceptQuote = async () => {
    if (!quote) return
    setAccepting(true)
    
    try {
      const res = await fetch(`/api/quote/${orderId}/accept`, {
        method: 'POST',
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'Failed to accept quote')
      }
      
      const data = await res.json()
      
      // Handle demo mode
      if (data.demo) {
        alert('Demo Mode: ' + data.message)
        return
      }
      
      // Redirect to Stripe checkout for deposit
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl
      } else {
        // Reload to show updated status
        window.location.reload()
      }
    } catch (e) {
      alert((e as Error).message || 'Failed to accept quote')
    } finally {
      setAccepting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading quote...</div>
      </div>
    )
  }

  if (error || !quote) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Quote Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This quote may have expired or been removed.'}</p>
          <Link href="/" className="text-blue-600 hover:underline">
            Return Home
          </Link>
        </div>
      </div>
    )
  }

  const isExpired = quote.quoteExpiresAt && new Date(quote.quoteExpiresAt) < new Date()
  const isAccepted = quote.quoteStatus === 'ACCEPTED' || quote.depositPaidAt
  const isDeclined = quote.quoteStatus === 'DECLINED'
  const isPendingAcceptance = quote.quoteStatus === 'SENT' && !isExpired
  const depositAmount = quote.depositCents || (quote.depositPercent ? Math.round(quote.totalCents * quote.depositPercent / 100) : quote.totalCents)
  const balanceAmount = quote.balanceCents || (quote.totalCents - depositAmount)

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 py-6">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-gray-900">{quote.tenant.name}</h1>
            <p className="text-sm text-gray-500 mt-1">Catering Quote</p>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Quote Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Quote #{quote.quoteNumber}</h2>
              {quote.quoteSentAt && (
                <p className="text-sm text-gray-500 mt-1">
                  Sent {formatDate(quote.quoteSentAt)}
                </p>
              )}
            </div>
            <div className="text-right">
              {isAccepted && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                  ✓ Accepted
                </span>
              )}
              {isDeclined && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
                  Declined
                </span>
              )}
              {isExpired && !isAccepted && !isDeclined && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
                  Expired
                </span>
              )}
              {isPendingAcceptance && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-amber-100 text-amber-800">
                  Awaiting Response
                </span>
              )}
            </div>
          </div>

          {quote.quoteExpiresAt && !isExpired && !isAccepted && (
            <p className="text-sm text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              ⏰ This quote is valid until {formatDate(quote.quoteExpiresAt)}
            </p>
          )}
        </div>

        {/* Event Details */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Event Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {quote.eventType && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Event Type</p>
                <p className="font-medium text-gray-900">{quote.eventType}</p>
              </div>
            )}
            {quote.eventDate && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                <p className="font-medium text-gray-900">{formatDate(quote.eventDate)}</p>
              </div>
            )}
            {quote.eventTime && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Time</p>
                <p className="font-medium text-gray-900">{quote.eventTime}</p>
              </div>
            )}
            {quote.guestCount && (
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Guests</p>
                <p className="font-medium text-gray-900">{quote.guestCount} people</p>
              </div>
            )}
            {(quote.deliveryAddress || quote.venueName) && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Location</p>
                <p className="font-medium text-gray-900">
                  {quote.venueName && <span>{quote.venueName}<br /></span>}
                  {quote.deliveryAddress}
                </p>
              </div>
            )}
            {quote.dietaryNotes && (
              <div className="md:col-span-2">
                <p className="text-xs text-gray-500 uppercase tracking-wide">Dietary Notes</p>
                <p className="font-medium text-gray-900">{quote.dietaryNotes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h3 className="font-semibold text-gray-900 mb-4">Order Items</h3>
          <div className="space-y-4">
            {quote.items.map((item) => (
              <div key={item.id} className="flex justify-between items-start py-3 border-b border-gray-100 last:border-0">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-500">{item.quantity}x</span>
                    <span className="font-medium text-gray-900">{item.name}</span>
                  </div>
                  {item.note && (
                    <p className="text-sm text-gray-500 mt-1 ml-8">Note: {item.note}</p>
                  )}
                  {item.addOns && Array.isArray(item.addOns) && item.addOns.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1 ml-8">
                      + {(item.addOns as Array<{name: string}>).map(a => a.name).join(', ')}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="font-medium text-gray-900">{formatMoney(item.totalCents)}</p>
                  <p className="text-xs text-gray-500">{formatMoney(item.unitPriceCents)} each</p>
                </div>
              </div>
            ))}
          </div>

          {/* Totals */}
          <div className="mt-6 pt-4 border-t border-gray-200 space-y-2">
            <div className="flex justify-between text-gray-600">
              <span>Subtotal</span>
              <span>{formatMoney(quote.subtotalCents)}</span>
            </div>
            {quote.deliveryFeeCents > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Delivery Fee</span>
                <span>{formatMoney(quote.deliveryFeeCents)}</span>
              </div>
            )}
            {quote.serviceFeeCents > 0 && (
              <div className="flex justify-between text-gray-600">
                <span>Service Fee</span>
                <span>{formatMoney(quote.serviceFeeCents)}</span>
              </div>
            )}
            <div className="flex justify-between text-lg font-bold text-gray-900 pt-2 border-t border-gray-200">
              <span>Total</span>
              <span>{formatMoney(quote.totalCents)}</span>
            </div>
          </div>
        </div>

        {/* Payment Terms */}
        {(quote.depositPercent || quote.paymentTerms || quote.cancellationPolicy) && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
            <h3 className="font-semibold text-gray-900 mb-4">Payment Terms</h3>
            <div className="space-y-3 text-sm text-gray-600">
              {quote.depositPercent && (
                <div className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>
                    <strong>{quote.depositPercent}% deposit</strong> ({formatMoney(depositAmount)}) due upon acceptance
                  </span>
                </div>
              )}
              {quote.depositPercent && (
                <div className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>
                    Remaining balance ({formatMoney(balanceAmount)}) due 48 hours before event
                  </span>
                </div>
              )}
              {quote.paymentTerms && (
                <div className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>{quote.paymentTerms}</span>
                </div>
              )}
              {quote.cancellationPolicy && (
                <div className="flex items-start gap-2">
                  <span className="text-green-600">•</span>
                  <span>{quote.cancellationPolicy}</span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Quote Notes */}
        {quote.quoteNotes && (
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2">Note from {quote.tenant.name}</h3>
            <p className="text-blue-800 whitespace-pre-wrap">{quote.quoteNotes}</p>
          </div>
        )}

        {/* Payment Status */}
        {isAccepted && (
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-6">
            <h3 className="font-semibold text-green-900 mb-2">Payment Status</h3>
            <div className="space-y-2">
              {quote.depositPaidAt && (
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-green-600">✓</span>
                  <span>Deposit paid on {formatDate(quote.depositPaidAt)}</span>
                </div>
              )}
              {quote.balancePaidAt && (
                <div className="flex items-center gap-2 text-green-800">
                  <span className="text-green-600">✓</span>
                  <span>Balance paid on {formatDate(quote.balancePaidAt)}</span>
                </div>
              )}
              {quote.depositPaidAt && !quote.balancePaidAt && balanceAmount > 0 && (
                <div className="mt-4 pt-4 border-t border-green-200">
                  <p className="text-sm text-green-800 mb-3">
                    Remaining balance of {formatMoney(balanceAmount)} due before event.
                  </p>
                  <button
                    onClick={() => window.location.href = `/api/quote/${orderId}/pay-balance`}
                    className="bg-green-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    Pay Balance Now
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Accept Button */}
        {isPendingAcceptance && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center">
            <p className="text-gray-600 mb-4">
              Ready to confirm your order?
            </p>
            <button
              onClick={handleAcceptQuote}
              disabled={accepting}
              className="bg-[#C4A76A] text-white px-8 py-3 rounded-lg font-semibold text-lg hover:bg-[#B39659] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {accepting ? 'Processing...' : `Accept Quote & Pay ${formatMoney(depositAmount)} Deposit`}
            </button>
            <p className="text-xs text-gray-500 mt-3">
              You&apos;ll be redirected to our secure payment page
            </p>
          </div>
        )}

        {/* Contact Info */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p className="mb-2">Have questions about this quote?</p>
          <p>
            Contact {quote.tenant.name}
            {quote.tenant.contactPhone && (
              <> at <a href={`tel:${quote.tenant.contactPhone}`} className="text-blue-600 hover:underline">{quote.tenant.contactPhone}</a></>
            )}
            {quote.tenant.contactEmail && (
              <> or <a href={`mailto:${quote.tenant.contactEmail}`} className="text-blue-600 hover:underline">{quote.tenant.contactEmail}</a></>
            )}
          </p>
        </div>
      </main>
    </div>
  )
}
