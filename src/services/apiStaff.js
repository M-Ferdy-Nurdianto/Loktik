import { supabase } from './supabase';
import { validateEoAction } from './apiEntitlements';

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
  if (staffData.eo_id) {
    const val = await validateEoAction(staffData.eo_id, 'ADD_STAFF');
    if (!val.allowed) {
      throw new Error(val.message);
    }
  }

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

  const rawPin = (staffData.password || '').toString().replace(/[^0-9]/g, '').slice(0, 4);
  const newStaff = {
    name: staffData.name.trim(),
    username: cleanUsername,
    password: staffData.password.trim(),
    pin_code: rawPin || null,
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
      permissions: updatedData.permissions,
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

export const authenticateStaff = async (usernameOrPin, password = '') => {
  const cleanId = (usernameOrPin || '').trim().toLowerCase();
  const cleanPass = (password || usernameOrPin || '').trim();

  // 1. Try matching custom staff_accounts table first
  const { data: matchedStaff } = await supabase
    .from('staff_accounts')
    .select('*')
    .or(`username.eq.${cleanId},pin_code.eq.${cleanId},password.eq.${cleanId},name.ilike.%${cleanId}%`);

  if (matchedStaff && matchedStaff.length > 0) {
    const staff = matchedStaff.find(
      (s) =>
        (s.pin_code && s.pin_code.trim() === cleanId) ||
        s.password.trim() === cleanPass ||
        s.password.trim().toLowerCase() === cleanPass.toLowerCase() ||
        s.username.trim().toLowerCase() === cleanId
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
  }

  // 2. Fallback: Search events table by 4-digit gate_pin in payment_details JSON
  if (cleanId.length === 4 && /^\d+$/.test(cleanId)) {
    const { data: allEvents } = await supabase
      .from('events')
      .select('id, name, slug, payment_details')
      .eq('status', 'active');

    if (allEvents && allEvents.length > 0) {
      const matchedEvent = allEvents.find((evt) => {
        const pin = (evt.payment_details?.gate_pin || evt.payment_details?.pin || '1312').toString().trim();
        return pin === cleanId;
      });

      if (matchedEvent) {
        const dynamicStaff = {
          id: `event-pin-${matchedEvent.id}`,
          username: `staf_${matchedEvent.slug}`,
          name: `Staf Gate — ${matchedEvent.name}`,
          role: 'staff',
          event_id: matchedEvent.id,
          event_slug: matchedEvent.slug,
          permissions: { canScan: true, canOts: true, canViewOrders: true },
        };
        return {
          success: true,
          staff: dynamicStaff,
        };
      }
    }
  }

  return {
    success: false,
    message: 'Username / Kode PIN 4-digit staf tidak ditemukan atau salah!',
  };
};
