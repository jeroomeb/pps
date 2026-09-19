'use server'

import { z } from 'zod'
import { revalidatePath } from 'next/cache'
import { requireRole } from '@/lib/auth/dal'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import type { PayoutStatus } from '@/lib/database.types'

const toggleSchema = z.object({
  tenant_id: z.string().uuid(),
  enable_payouts: z.coerce.boolean(),
})

const rateSchema = z.object({
  tenant_id: z.string().uuid(),
  default_rate: z.coerce.number().min(0, 'Rate must be 0 or greater'),
})

const tierRatesSchema = z.object({
  tenant_id: z.string().uuid(),
  tier_1_rate: z.coerce.number().min(0, 'Tier 1 rate must be 0 or greater'),
  tier_2_rate: z.coerce.number().min(0, 'Tier 2 rate must be 0 or greater'),
  tier_3_rate: z.coerce.number().min(0, 'Tier 3 rate must be 0 or greater'),
})

const matrixRatesSchema = z.object({
  tenant_id: z.string().uuid(),
  // Luxury Condominium
  luxury_tier_1: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  luxury_tier_2: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  luxury_tier_3: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  // 55+ Active Adult Community
  adult_tier_1: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  adult_tier_2: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  adult_tier_3: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  // Commercial Multi-Tenant
  commercial_tier_1: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  commercial_tier_2: z.coerce.number().min(0, 'Rate must be 0 or greater'),
  commercial_tier_3: z.coerce.number().min(0, 'Rate must be 0 or greater'),
})

const propertyRateSchema = z.object({
  property_id: z.string().uuid(),
  custom_rate: z.coerce.number().min(0, 'Rate must be 0 or greater').nullable(),
})

const markPaidSchema = z.object({
  payout_id: z.string().uuid(),
  payment_reference: z.string().trim().min(1, 'Payment reference is required (e.g. ACH-101, Check #, Stripe ID)'),
  notes: z.string().trim().optional(),
})

export type PayoutActionState = { error?: string; success?: boolean } | undefined

/**
 * Toggles whether the Payouts & Compensation module is active for a tenant organization.
 */
export async function toggleTenantPayouts(
  tenantId: string,
  enablePayouts: boolean
): Promise<PayoutActionState> {
  const profile = await requireRole('admin')

  // Multi-tenant check
  if (!profile.is_global_admin && profile.tenant_id !== tenantId) {
    return { error: 'Unauthorized: cannot modify another organization.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tenants')
    .update({ enable_payouts: enablePayouts })
    .eq('id', tenantId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/payouts')
  revalidatePath('/admin')
  revalidatePath('/inspector')
  revalidatePath('/inspector/payouts')
  return { success: true }
}

/**
 * Updates the default baseline per-audit payout rate for the tenant.
 */
export async function updateTenantDefaultRate(
  _prevState: PayoutActionState,
  formData: FormData
): Promise<PayoutActionState> {
  const profile = await requireRole('admin')

  const parsed = rateSchema.safeParse({
    tenant_id: formData.get('tenant_id'),
    default_rate: formData.get('default_rate'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid rate.' }
  }

  if (!profile.is_global_admin && profile.tenant_id !== parsed.data.tenant_id) {
    return { error: 'Unauthorized.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tenants')
    .update({ default_payout_rate: parsed.data.default_rate })
    .eq('id', parsed.data.tenant_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/payouts')
  return { success: true }
}

/**
 * Updates the 3-Tier Compensation Matrix (Tier 1, Tier 2, Tier 3) rates for the tenant.
 */
export async function updateTenantTierRates(
  _prevState: PayoutActionState,
  formData: FormData
): Promise<PayoutActionState> {
  const profile = await requireRole('admin')

  const parsed = tierRatesSchema.safeParse({
    tenant_id: formData.get('tenant_id'),
    tier_1_rate: formData.get('tier_1_rate'),
    tier_2_rate: formData.get('tier_2_rate'),
    tier_3_rate: formData.get('tier_3_rate'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid tier rates.' }
  }

  if (!profile.is_global_admin && profile.tenant_id !== parsed.data.tenant_id) {
    return { error: 'Unauthorized.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tenants')
    .update({
      payout_tier_1_rate: parsed.data.tier_1_rate,
      payout_tier_2_rate: parsed.data.tier_2_rate,
      payout_tier_3_rate: parsed.data.tier_3_rate,
    })
    .eq('id', parsed.data.tenant_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/payouts')
  return { success: true }
}

/**
 * Updates the full 3x3 Property Category x Service Tier Matrix.
 */
export async function updateTenantPayoutMatrix(
  _prevState: PayoutActionState,
  formData: FormData
): Promise<PayoutActionState> {
  const profile = await requireRole('admin')

  const parsed = matrixRatesSchema.safeParse({
    tenant_id: formData.get('tenant_id'),
    luxury_tier_1: formData.get('luxury_tier_1'),
    luxury_tier_2: formData.get('luxury_tier_2'),
    luxury_tier_3: formData.get('luxury_tier_3'),
    adult_tier_1: formData.get('adult_tier_1'),
    adult_tier_2: formData.get('adult_tier_2'),
    adult_tier_3: formData.get('adult_tier_3'),
    commercial_tier_1: formData.get('commercial_tier_1'),
    commercial_tier_2: formData.get('commercial_tier_2'),
    commercial_tier_3: formData.get('commercial_tier_3'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid matrix rates.' }
  }

  if (!profile.is_global_admin && profile.tenant_id !== parsed.data.tenant_id) {
    return { error: 'Unauthorized.' }
  }

  const matrix = {
    luxury_condo: {
      tier_1: parsed.data.luxury_tier_1,
      tier_2: parsed.data.luxury_tier_2,
      tier_3: parsed.data.luxury_tier_3,
    },
    adult_community: {
      tier_1: parsed.data.adult_tier_1,
      tier_2: parsed.data.adult_tier_2,
      tier_3: parsed.data.adult_tier_3,
    },
    commercial_multi: {
      tier_1: parsed.data.commercial_tier_1,
      tier_2: parsed.data.commercial_tier_2,
      tier_3: parsed.data.commercial_tier_3,
    },
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('tenants')
    .update({
      payout_matrix: matrix,
      payout_tier_1_rate: parsed.data.luxury_tier_1,
      payout_tier_2_rate: parsed.data.luxury_tier_2,
      payout_tier_3_rate: parsed.data.luxury_tier_3,
    })
    .eq('id', parsed.data.tenant_id)

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/payouts')
  return { success: true }
}

/**
 * Sets or clears a property-specific custom audit compensation rate override.
 */
export async function updatePropertyPayoutRate(
  propertyId: string,
  customRate: number | null
): Promise<PayoutActionState> {
  await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('properties')
    .update({ custom_payout_rate: customRate })
    .eq('id', propertyId)

  if (error) {
    return { error: error.message }
  }

  revalidatePath(`/admin/properties/${propertyId}`)
  revalidatePath('/admin/payouts')
  return { success: true }
}

/**
 * Approves a single pending payout item.
 */
export async function approvePayout(payoutId: string): Promise<PayoutActionState> {
  const profile = await requireRole('admin')
  const supabase = await createClient()

  const { error } = await supabase
    .from('specialist_payouts')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: profile.id,
    })
    .eq('id', payoutId)
    .eq('status', 'pending')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/payouts')
  revalidatePath('/inspector/payouts')
  return { success: true }
}

/**
 * Batch approves multiple pending payout items simultaneously.
 */
export async function batchApprovePayouts(payoutIds: string[]): Promise<PayoutActionState> {
  const profile = await requireRole('admin')
  if (!payoutIds.length) {
    return { error: 'No payout items selected.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('specialist_payouts')
    .update({
      status: 'approved',
      approved_at: new Date().toISOString(),
      approved_by: profile.id,
    })
    .in('id', payoutIds)
    .eq('status', 'pending')

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/payouts')
  revalidatePath('/inspector/payouts')
  return { success: true }
}

/**
 * Marks an approved payout as paid, capturing disbursement reference code and optional notes.
 */
export async function markPayoutPaid(
  _prevState: PayoutActionState,
  formData: FormData
): Promise<PayoutActionState> {
  const profile = await requireRole('admin')

  const parsed = markPaidSchema.safeParse({
    payout_id: formData.get('payout_id'),
    payment_reference: formData.get('payment_reference'),
    notes: formData.get('notes'),
  })

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? 'Invalid payment reference.' }
  }

  const supabase = await createClient()
  const { error } = await supabase
    .from('specialist_payouts')
    .update({
      status: 'paid',
      paid_at: new Date().toISOString(),
      payment_reference: parsed.data.payment_reference,
      notes: parsed.data.notes || null,
    })
    .eq('id', parsed.data.payout_id)
    .in('status', ['pending', 'approved'])

  if (error) {
    return { error: error.message }
  }

  revalidatePath('/admin/payouts')
  revalidatePath('/inspector/payouts')
  return { success: true }
}
