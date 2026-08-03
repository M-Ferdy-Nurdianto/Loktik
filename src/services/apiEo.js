import { supabase } from '../supabase/client';

/**
 * Toggle the bot_access_bonus flag for an EO account.
 * @param {string|number} eoId - EO account ID.
 * @param {boolean} enable - Desired state (true = active).
 * @returns {Promise<Object>} Updated EO record.
 */
export const toggleBot = async (eoId, enable) => {
  const { data, error } = await supabase
    .from('eo_accounts')
    .update({ bot_access_bonus: enable })
    .eq('id', eoId)
    .single();

  if (error) throw error;
  return data;
};
