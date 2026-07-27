import { supabase } from './supabase';

/**
 * Step 1: Check ticket validity without burning it yet.
 */
export const checkTicketValidity = async (barcodeUuid) => {
  const { data, error } = await supabase.rpc('check_ticket_validity', {
    target_barcode: barcodeUuid,
  });

  if (error) throw new Error('Terjadi kesalahan pada koneksi server gate.');

  if (data && data.length > 0) {
    return data[0]; // Returns { success, message, ticket_id, guest_name, category_name, is_scanned }
  }

  return { success: false, message: 'Respon server gate tidak valid.' };
};

/**
 * Step 2: Staff confirms & burns ticket when handing over wristband.
 */
export const redeemTicket = async (ticketId, gateStaffName = 'Gate Utama 1') => {
  const { data, error } = await supabase.rpc('redeem_ticket_atomic', {
    target_ticket_id: ticketId,
    gate_staff_name: gateStaffName,
  });

  if (error) throw new Error('Gagal memproses pemakaian tiket.');

  if (data && data.length > 0) {
    return data[0]; // Returns { success, message }
  }

  return { success: false, message: 'Gagal memperbarui status tiket.' };
};

/**
 * Legacy scanTicket atomic function.
 */
export const scanTicket = async (barcodeUuid, gateStaffName = 'Gate Main') => {
  return checkTicketValidity(barcodeUuid);
};
