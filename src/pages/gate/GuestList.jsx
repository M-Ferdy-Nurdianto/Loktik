import React, { useState, useEffect } from 'react';
import { Search, UserCheck, CheckCircle2, XCircle, RefreshCw, Phone } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { redeemTicket } from '../../services/apiTickets';

export const GuestList = ({ eventId }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [guests, setGuests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMsg, setActionMsg] = useState(null);

  const fetchGuests = async () => {
    if (!eventId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('id, guest_name, guest_wa, status, tickets(id, barcode_uuid, is_scanned, scanned_at, ticket_categories(name))')
        .eq('event_id', eventId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGuests(data || []);
    } catch (err) {
      console.warn('Gagal memuat data guest list:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGuests();
  }, [eventId]);

  const handleManualCheckIn = async (ticketId, guestName) => {
    if (!confirm(`Konfirmasi Manual Check-in untuk '${guestName}'?`)) return;

    try {
      const res = await redeemTicket(ticketId, 'Manual Gate Staff');
      if (res.success) {
        setActionMsg({ type: 'SUCCESS', text: `CHECK-IN BERHASIL: ${guestName}` });
        fetchGuests();
      } else {
        setActionMsg({ type: 'ERROR', text: res.message || 'Gagal check-in.' });
      }
    } catch (err) {
      setActionMsg({ type: 'ERROR', text: err.message });
    }
  };

  const filteredGuests = guests.filter((order) => {
    const q = searchQuery.toLowerCase();
    return (
      (order.guest_name || '').toLowerCase().includes(q) ||
      (order.guest_wa || '').includes(q)
    );
  });

  return (
    <div className="space-y-4 text-left font-sans">
      {/* Search Header */}
      <div className="bg-white p-4 border-4 border-black shadow-[4px_4px_0px_#000] space-y-3">
        <div className="flex items-center justify-between border-b-2 border-black pb-2">
          <span className="text-sm font-black uppercase text-black">PENCARIAN DATA PEMBELI (DARURAT)</span>
          <button onClick={fetchGuests} className="p-1.5 bg-[#FFE600] border-2 border-black text-black font-black text-xs uppercase cursor-pointer">
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Pembeli / Nomor WA..."
            className="w-full pl-10 pr-4 py-3 bg-[#F4F4F4] text-black font-black text-base border-4 border-black uppercase placeholder:text-neutral-500"
          />
          <Search className="absolute left-3 top-3.5 w-5 h-5 text-black pointer-events-none" />
        </div>
      </div>

      {/* Action Notification */}
      {actionMsg && (
        <div className={`p-3 border-4 border-black font-black text-xs text-white uppercase flex items-center justify-between ${actionMsg.type === 'SUCCESS' ? 'bg-[#00CC00]' : 'bg-[#FF0000]'}`}>
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="px-2 py-0.5 bg-black text-white text-xs border border-black cursor-pointer">OK</button>
        </div>
      )}

      {/* Table Container */}
      <div className="bg-white border-4 border-black shadow-[4px_4px_0px_#000] overflow-x-auto no-scrollbar">
        <table className="w-full text-left border-collapse font-mono text-xs">
          <thead>
            <tr className="bg-black text-white border-b-4 border-black text-xs font-black uppercase">
              <th className="p-3 border-r-2 border-white">NAMA PEMBELI</th>
              <th className="p-3 border-r-2 border-white">WHATSAPP</th>
              <th className="p-3 border-r-2 border-white">KATEGORI TIKET</th>
              <th className="p-3 border-r-2 border-white">STATUS SCAN</th>
              <th className="p-3 text-center">AKSI CHECK-IN</th>
            </tr>
          </thead>
          <tbody className="divide-y-2 divide-black text-black font-bold">
            {filteredGuests.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-6 text-center text-neutral-500 font-black uppercase">
                  {loading ? 'MEMUAT DATA PEMBELI...' : 'TIDAK ADA DATA PEMBELI DITEMUKAN'}
                </td>
              </tr>
            ) : (
              filteredGuests.map((order) =>
                (order.tickets || []).map((t, idx) => (
                  <tr key={`${order.id}-${t.id}-${idx}`} className="hover:bg-[#FFFBE6]">
                    <td className="p-3 font-black uppercase text-sm border-r-2 border-black">{order.guest_name}</td>
                    <td className="p-3 border-r-2 border-black">
                      <span className="flex items-center space-x-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{order.guest_wa || '-'}</span>
                      </span>
                    </td>
                    <td className="p-3 border-r-2 border-black">
                      <span className="bg-[#8B5CF6] text-white px-2 py-0.5 border border-black font-black uppercase text-[10px]">
                        {t.ticket_categories?.name || 'Tiket Regular'}
                      </span>
                    </td>
                    <td className="p-3 border-r-2 border-black">
                      {t.is_scanned ? (
                        <span className="bg-[#00CC00] text-black px-2 py-0.5 border border-black font-black uppercase text-[10px] inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> SUDAH DI-SCAN
                        </span>
                      ) : (
                        <span className="bg-[#FFE600] text-black px-2 py-0.5 border border-black font-black uppercase text-[10px] inline-flex items-center gap-1">
                          <XCircle className="w-3 h-3" /> BELUM DI-SCAN
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-center">
                      {t.is_scanned ? (
                        <span className="text-neutral-400 font-black uppercase text-[10px]">TERPAKAI</span>
                      ) : (
                        <button
                          onClick={() => handleManualCheckIn(t.id, order.guest_name)}
                          className="px-3 py-1.5 bg-[#39FF14] hover:bg-[#20e000] text-black font-black text-xs uppercase border-2 border-black shadow-[2px_2px_0px_#000] cursor-pointer"
                        >
                          <UserCheck className="w-4 h-4 inline mr-1 stroke-[3]" /> CHECK-IN
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
