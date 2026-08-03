/**
 * LOKTIK SUBSCRIPTION PLAN LIMITS
 * Single source of truth — wajib sesuai dengan ForEoPricing.jsx
 *
 * Paket       | Max Event Aktif | Max Staf
 * ------------|-----------------|----------
 * test        | 1               | 1
 * event_pass  | 1               | 2
 * 1_month     | 1               | 2
 * 3_months    | Unlimited       | 5
 * 6_months    | Unlimited       | Unlimited
 */

export const PLAN_LIMITS = {
  test:      { maxEvents: 1,        maxStaff: 1        },
  event_pass:{ maxEvents: 1,        maxStaff: 2        },
  '1_month': { maxEvents: 1,        maxStaff: 2        },
  '3_months':{ maxEvents: Infinity, maxStaff: 5        },
  '6_months':{ maxEvents: Infinity, maxStaff: Infinity },
};

/**
 * Kembalikan batas event aktif berdasarkan subscriptionPlan EO.
 * @param {string} plan - subscriptionPlan dari user session
 * @returns {{ maxEvents: number, maxStaff: number }}
 */
export const getPlanLimits = (plan) => {
  return PLAN_LIMITS[plan] || PLAN_LIMITS['1_month'];
};

/**
 * Label nama paket untuk ditampilkan ke user.
 */
export const PLAN_LABELS = {
  test:      'TEST (1 HARI)',
  event_pass:'EVENT PASS',
  '1_month': 'PAKET 1 BULAN',
  '3_months':'PAKET 3 BULAN',
  '6_months':'PAKET 6 BULAN PRO',
};
