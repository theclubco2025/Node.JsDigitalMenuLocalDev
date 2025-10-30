import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma'
import { SCOPE_NOTE } from '@/lib/ai/guardrails'

type UpdatePayload = {
  tenant: string
  itemId: string
  name?: string
  description?: string
  priceCents?: number
  price?: number
  available?: boolean
  imageUrl?: string | null
  kcal?: number | null
  tags?: string[]
}

const MAX_NAME = 120
const MAX_DESCRIPTION = 2000

function validationError(message: string, status = 400) {
  return NextResponse.json({ ok: false, error: message }, { status })
}

async function resolveSessionTenantSlug(session: Record<string, unknown>) {
  const tenantId = session.tenantId as string | undefined | null
  if (!tenantId) return null
  const tenant = await prisma.tenant.findUnique({ where: { id: tenantId }, select: { slug: true } })
  return tenant?.slug ?? null
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as UpdatePayload
  const tenantSlugRaw = (body.tenant || '').trim()
  const itemId = (body.itemId || '').trim()

  if (!tenantSlugRaw) return validationError('Missing tenant')
  if (!itemId) return validationError('Missing itemId')

  const tenantSlug = tenantSlugRaw.replace(/-draft$/, '')

  const adminToken = process.env.ADMIN_TOKEN?.trim()
  const headerToken = request.headers.get('x-admin-token') || request.headers.get('X-Admin-Token')

  let authorized = false
  let userId: string | null = null

  if (adminToken && headerToken && headerToken === adminToken) {
    authorized = true
  }

  let session: Record<string, unknown> | null = null
  if (!authorized) {
    const authSession = await getServerSession(authOptions)
    if (!authSession) return validationError('Unauthorized', 403)
    session = authSession as unknown as Record<string, unknown>
    const role = session.role as string | undefined
    userId = (session.userId as string | undefined) ?? null

    if (role === 'SUPER_ADMIN') {
      authorized = true
    } else if (role === 'RESTAURANT_OWNER') {
      const sessionTenantSlug = await resolveSessionTenantSlug(session)
      if (sessionTenantSlug && sessionTenantSlug === tenantSlug) {
        authorized = true
      }
    }
  }

  if (!authorized) return validationError('Forbidden', 403)

  const updates: Partial<UpdatePayload> = {}

  if (body.name !== undefined) {
    const name = body.name.trim()
    if (!name || name.length > MAX_NAME) return validationError('Invalid name')
    updates.name = name
  }

  if (body.description !== undefined) {
    const description = body.description.trim()
    if (description.length > MAX_DESCRIPTION) return validationError('Description too long')
    updates.description = description
  }

  if (body.priceCents !== undefined) {
    if (!Number.isInteger(body.priceCents) || body.priceCents < 0) return validationError('priceCents must be >= 0')
    updates.priceCents = body.priceCents
    updates.price = body.price !== undefined ? body.price : body.priceCents / 100
  } else if (body.price !== undefined) {
    if (Number.isNaN(body.price) || body.price < 0) return validationError('price must be >= 0')
    updates.price = body.price
    updates.priceCents = Math.round(body.price * 100)
  }

  if (body.available !== undefined) {
    updates.available = Boolean(body.available)
  }

  if (body.imageUrl !== undefined) {
    updates.imageUrl = body.imageUrl && body.imageUrl.trim().length > 0 ? body.imageUrl.trim() : null
  }

  if (body.kcal !== undefined) {
    if (body.kcal !== null && body.kcal < 0) return validationError('kcal must be >= 0')
    updates.kcal = body.kcal ?? null
  }

  if (body.tags !== undefined) {
    if (!Array.isArray(body.tags) || body.tags.some(tag => typeof tag !== 'string')) {
      return validationError('tags must be an array of strings')
    }
    updates.tags = body.tags.map(tag => tag.trim()).filter(Boolean)
  }

  if (Object.keys(updates).length === 0) {
    return validationError('No updates provided')
  }

  const item = await prisma.menuItem.findUnique({
    where: { id: itemId },
    include: {
      category: {
        include: {
          menu: {
            include: { tenant: true },
          },
        },
      },
      tags: true,
    },
  })

  if (!item || !item.category.menu.tenant) return validationError('Item not found', 404)
  if (item.category.menu.tenant.slug !== tenantSlug) return validationError('Forbidden', 403)

  const currentPriceCents = Math.round(item.price * 100)

  const beforeSnapshot = {
    name: item.name,
    description: item.description,
    price: item.price,
    priceCents: (item as unknown as { priceCents?: number }).priceCents ?? currentPriceCents,
    available: item.available,
    imageUrl: item.imageUrl,
    kcal: item.kcal,
    tagLabels: item.tagLabels,
  }

  const updated = await prisma.$transaction(async (tx) => {
    const itemUpdateData: Parameters<typeof tx.menuItem.update>[0]['data'] = {}

    if (updates.name !== undefined) itemUpdateData.name = updates.name
    if (updates.description !== undefined) itemUpdateData.description = updates.description
    if (updates.price !== undefined) itemUpdateData.price = updates.price
    if (updates.priceCents !== undefined) itemUpdateData.priceCents = updates.priceCents
    if (updates.available !== undefined) itemUpdateData.available = updates.available
    if (updates.imageUrl !== undefined) itemUpdateData.imageUrl = updates.imageUrl
    if (updates.kcal !== undefined) {
      itemUpdateData.kcal = updates.kcal
      itemUpdateData.calories = updates.kcal
    }
    if (updates.tags !== undefined) itemUpdateData.tagLabels = updates.tags

    const nextItem = await tx.menuItem.update({
      where: { id: itemId },
      data: itemUpdateData,
      include: { tags: true },
    })

    const nextPriceCents = (nextItem as unknown as { priceCents?: number }).priceCents ?? Math.round(nextItem.price * 100)

    if (updates.tags !== undefined) {
      await tx.menuItemTag.deleteMany({ where: { itemId } })
      for (const tag of updates.tags) {
        await tx.menuItemTag.create({ data: { itemId, tag } })
      }
    }

    await tx.editLog.create({
      data: {
        tenantId: item.category.menu.tenantId,
        userId,
        entity: 'MenuItem',
        entityId: itemId,
        action: 'update',
        diff: {
          before: beforeSnapshot,
          after: {
            name: nextItem.name,
            description: nextItem.description,
            price: nextItem.price,
            priceCents: nextPriceCents,
            available: nextItem.available,
            imageUrl: nextItem.imageUrl,
            kcal: nextItem.kcal,
            tagLabels: updates.tags !== undefined ? updates.tags : nextItem.tagLabels,
          },
        },
      },
    })

    return nextItem
  })

  return NextResponse.json({
    ok: true,
    item: {
      id: updated.id,
      name: updated.name,
      description: updated.description,
      price: updated.price,
      priceCents: (updated as unknown as { priceCents?: number }).priceCents ?? Math.round(updated.price * 100),
      available: updated.available,
      imageUrl: updated.imageUrl ?? undefined,
      kcal: updated.kcal ?? undefined,
      tags: updates.tags ?? updated.tagLabels ?? [],
    },
    scopeNote: SCOPE_NOTE,
  })
}


