import { supabase } from './supabase';

/**
 * Staff Accounts API Service
 * Handles staff creation, role-based permission scoping, and authentication using Supabase.
 */

export const getAllStaffForEo = async (eoUsername) => {
  if (!eoUsername) return [];
  const cleanEo = eoUsername.trim().toLowerCase();
  
  const { data, error } = await supabase
    .from('staff_accounts')
    .select('*')
    .eq('eo_username', cleanEo)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching staff:', error);
    return [];
  }
  return data || [];
};

export const createStaffAccount = async (staffData) => {
  const cleanUsername = staffData.username.trim().toLowerCase();

  // Check unique username
  const { data: existing } = await supabase
    .from('staff_accounts')
    .select('id')
    .eq('username', cleanUsername)
    .maybeSingle();

  if (existing) {
    throw new Error('Username staf sudah digunakan! Pilih username lain.');
  }

  const newStaff = {
    name: staffData.name.trim(),
    username: cleanUsername,
    password: staffData.password.trim(),
    eo_username: (staffData.eo_username || 'eo_lokal').trim().toLowerCase(),
    event_id: staffData.event_id || 'all',
    event_slug: staffData.event_slug || '',
    permissions: {
      canScan: Boolean(staffData.permissions?.canScan),
      canOts: Boolean(staffData.permissions?.canOts),
      canViewOrders: Boolean(staffData.permissions?.canViewOrders),
    },
    status: 'active',
  };

  const { data, error } = await supabase
    .from('staff_accounts')
    .insert([newStaff])
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Gagal membuat akun staf.');
  }

  return data;
};

export const updateStaffAccount = async (id, updatedData) => {
  const { data, error } = await supabase
    .from('staff_accounts')
    .update({
      ...updatedData,
      permissions: updatedData.permissions, // Assuming frontend passes the merged permissions object
    })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw new Error(error.message || 'Gagal memperbarui akun staf.');
  }

  return data;
};

export const deleteStaffAccount = async (id) => {
  const { error } = await supabase
    .from('staff_accounts')
    .delete()
    .eq('id', id);

  if (error) {
    throw new Error(error.message || 'Gagal menghapus akun staf.');
  }
  
  return true;
};

export const authenticateStaff = async (username, password) => {
  const cleanUsername = (username || '').trim().toLowerCase();
  const cleanPassword = (password || '').trim();

  // Use an OR query to match username OR name
  const { data: matchedStaff, error } = await supabase
    .from('staff_accounts')
    .select('*')
    .or(`username.eq.${cleanUsername},name.ilike.%${cleanUsername}%`);

  if (error || !matchedStaff || matchedStaff.length === 0) {
    return {
      success: false,
      message: 'Username / Password staf salah!',
    };
  }

  // Find exact match for password (since we might have multiple matches for name)
  const staff = matchedStaff.find(
    (s) => s.password.trim() === cleanPassword || s.password.trim().toLowerCase() === cleanPassword.toLowerCase()
  );

  if (staff) {
    if (staff.status === 'suspended') {
      return {
        success: false,
        message: 'Akun staf Anda telah dinonaktifkan oleh EO.',
      };
    }
    return {
      success: true,
      staff: staff,
    };
  }

  return {
    success: false,
    message: 'Username / Password staf salah!',
  };
};
