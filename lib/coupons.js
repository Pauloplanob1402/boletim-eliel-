// Cupons de desconto (tabelas coupons / coupon_redemptions — ver
// supabase/migration_008_coupons.sql). Tudo aqui roda só no servidor: o preço
// final é SEMPRE calculado no backend, nunca vem do navegador.

export const COUPON_MESSAGES = {
  invalido: 'Cupom inválido ou expirado.',
  esgotado: 'Este cupom esgotou: as vagas com desconto já foram todas usadas.',
};

export function normalizeCouponCode(code) {
  return String(code || '').trim().toUpperCase().slice(0, 40);
}

/** Aplica o desconto e arredonda em centavos (27,40 com 10% → 24,66). */
export function applyDiscount(amount, percentOff) {
  const pct = Number(percentOff) || 0;
  return Math.round(Number(amount) * (100 - pct)) / 100;
}

/** Só confere se o cupom existe e ainda tem vaga — NÃO reserva nada. */
export async function previewCoupon(admin, code) {
  const normalized = normalizeCouponCode(code);
  if (!normalized) return { ok: false, reason: 'invalido' };

  const { data: coupon } = await admin
    .from('coupons')
    .select('code, percent_off, max_redemptions, active')
    .eq('code', normalized)
    .maybeSingle();
  if (!coupon || !coupon.active) return { ok: false, reason: 'invalido' };

  // Conta pagos + reservas das últimas 24h (as mais antigas já liberam a vaga).
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { count } = await admin
    .from('coupon_redemptions')
    .select('id', { count: 'exact', head: true })
    .eq('coupon_code', coupon.code)
    .or(`status.eq.redeemed,created_at.gte.${since}`);
  if ((count || 0) >= coupon.max_redemptions) return { ok: false, reason: 'esgotado' };

  return { ok: true, percentOff: coupon.percent_off };
}

/** Reserva a vaga do cupom para este usuário (atômico, no banco). */
export async function reserveCoupon(admin, code, userId) {
  const { data, error } = await admin.rpc('reserve_coupon', { p_code: normalizeCouponCode(code), p_user: userId });
  if (error) throw new Error('Erro ao reservar cupom: ' + error.message);
  const row = Array.isArray(data) ? data[0] : data;
  if (!row?.o_ok) {
    const reason = row?.o_reason === 'esgotado' ? 'esgotado' : 'invalido';
    return { ok: false, reason, message: COUPON_MESSAGES[reason] };
  }
  return { ok: true, percentOff: row.o_percent };
}

/** Desconto que o usuário já conquistou (cupom pago antes) — vale nas renovações. */
export async function getRedeemedDiscount(admin, userId) {
  const { data: rows } = await admin
    .from('coupon_redemptions')
    .select('coupon_code, coupons(percent_off, active)')
    .eq('user_id', userId)
    .eq('status', 'redeemed');
  let best = 0;
  for (const r of rows || []) {
    if (r.coupons?.active && r.coupons.percent_off > best) best = r.coupons.percent_off;
  }
  return best;
}

/** Chamado quando o pagamento é confirmado: a vaga reservada vira definitiva. */
export async function markCouponRedeemed(admin, userId) {
  try {
    await admin
      .from('coupon_redemptions')
      .update({ status: 'redeemed', redeemed_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('status', 'reserved');
  } catch (err) {
    console.error('Falha ao confirmar uso do cupom:', err.message);
  }
}

/**
 * Descobre o desconto de um checkout: se veio um código, reserva a vaga; se
 * não, usa o desconto que a pessoa já conquistou antes (renovação).
 * @returns {Promise<{ ok: true, percentOff: number } | { ok: false, message: string }>}
 */
export async function resolveCheckoutDiscount(admin, { cupom, userId }) {
  if (normalizeCouponCode(cupom)) {
    const r = await reserveCoupon(admin, cupom, userId);
    return r.ok ? { ok: true, percentOff: r.percentOff } : { ok: false, message: r.message };
  }
  return { ok: true, percentOff: await getRedeemedDiscount(admin, userId) };
}
