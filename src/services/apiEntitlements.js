import { supabase } from './supabase';

/**
 * Fetch EO entitlements and current active usage from Supabase RPC get_eo_entitlements
 */
export async function getEoEntitlements(eoId) {
  if (!eoId) return null;

  try {
    const { data, error } = await supabase.rpc('get_eo_entitlements', {
      target_eo_id: eoId,
    });

    if (error) {
      console.warn('RPC get_eo_entitlements error, using fallback:', error.message);
      return getFallbackEntitlements(eoId);
    }

    if (Array.isArray(data) && data.length > 0) {
      return data[0];
    }
    return data || getFallbackEntitlements(eoId);
  } catch (err) {
    console.warn('getEoEntitlements exception:', err);
    return getFallbackEntitlements(eoId);
  }
}

/**
 * Validate EO action against backend RPC validate_eo_action
 */
export async function validateEoAction(eoId, actionType) {
  if (!eoId) {
    return { allowed: false, message: 'ID EO TIDAK VALID' };
  }

  try {
    const { data, error } = await supabase.rpc('validate_eo_action', {
      target_eo_id: eoId,
      action_type: actionType,
    });

    if (error) {
      console.warn('RPC validate_eo_action error, passing through:', error.message);
      return { allowed: true, message: 'VALIDASI PASSTHROUGH (OFFLINE MODE)' };
    }

    const res = Array.isArray(data) ? data[0] : data;
    return {
      allowed: res?.allowed ?? true,
      message: res?.message || 'OK',
    };
  } catch (err) {
    console.warn('validateEoAction exception:', err);
    return { allowed: true, message: 'VALIDASI PASSTHROUGH (OFFLINE MODE)' };
  }
}

/**
 * Update EO package tier via RPC update_eo_package
 */
export async function updateEoPackageTier(eoId, newTier, addWaQuota = 0) {
  if (!eoId) return { success: false, message: 'EO ID required' };

  try {
    const { data, error } = await supabase.rpc('update_eo_package', {
      target_eo_id: eoId,
      new_tier: newTier,
      add_wa_quota: addWaQuota,
    });

    if (error) throw new Error(error.message);
    const res = Array.isArray(data) ? data[0] : data;
    return {
      success: res?.success ?? true,
      message: res?.message || 'Paket berhasil diperbarui',
    };
  } catch (err) {
    console.error('updateEoPackageTier error:', err);
    return { success: false, message: err.message };
  }
}

/**
 * Fallback entitlement object if Supabase RPC is unseeded or offline
 */
function getFallbackEntitlements(eoId) {
  return {
    eo_id: eoId,
    eo_username: 'eo_user',
    tier_code: 'starter',
    max_active_events: 1,
    current_active_events: 0,
    max_staff_accounts: 2,
    current_staff_accounts: 0,
    allow_event_pass: false,
    allow_custom_domain: false,
    wa_quota: 0,
    wa_messages_sent: 0,
    status: 'ACTIVE',
  };
}
