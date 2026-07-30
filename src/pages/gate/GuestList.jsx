import React, { useState, useEffect } from 'react';
import { Search, UserCheck, CheckCircle2, XCircle, RefreshCw, Phone } from 'lucide-react';
import { supabase } from '../../services/supabase';
import { redeemTicket } from '../../services/apiTickets';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

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
        .eq('status', 'paid')
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
    const guestTickets = order.tickets || [];
    const matchesTicketCode = guestTickets.some((t) =>
      (t.barcode_uuid || '').toLowerCase().includes(q) ||
      (t.id || '').toLowerCase().includes(q)
    );
    return (
      (order.guest_name || '').toLowerCase().includes(q) ||
      (order.guest_wa || '').includes(q) ||
      matchesTicketCode
    );
  });

  const formatScanTime = (isoString) => {
    if (!isoString) return '';
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="space-y-4 text-left font-sans">
      {/* Search Header Card */}
      <Card variant="dark" className="p-4 border-neutral-800 space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <span className="text-xs font-black uppercase text-neutral-300">PENCARIAN DATA PEMBELI &amp; KODE TIKET</span>
          <Button variant="outline" size="sm" onClick={fetchGuests}>
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari Nama Pembeli / Kode Tiket / WA..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#181818] text-white font-bold text-sm border border-neutral-800 rounded uppercase placeholder:text-neutral-600 focus:outline-none focus:border-brand-blue"
          />
          <Search className="absolute left-3 top-3 w-4 h-4 text-neutral-500 pointer-events-none" />
        </div>
      </Card>

      {/* Action Notification */}
      {actionMsg && (
        <div
          className={`p-3 rounded border font-bold text-xs flex items-center justify-between ${
            actionMsg.type === 'SUCCESS' ? 'bg-brand-green/10 border-brand-green text-brand-green' : 'bg-brand-red/10 border-brand-red text-brand-red'
          }`}
        >
          <span>{actionMsg.text}</span>
          <button onClick={() => setActionMsg(null)} className="text-xs underline cursor-pointer">OK</button>
        </div>
      )}

      {/* Table Container */}
      <Card variant="dark" className="p-0 border-neutral-800 overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full text-left border-collapse font-mono text-xs">
            <thead>
              <tr className="bg-neutral-900 text-neutral-400 border-b border-neutral-800 text-[10px] font-black uppercase tracking-wider">
                <th className="p-3 border-r border-neutral-800">NAMA PEMBELI</th>
                <th className="p-3 border-r border-neutral-800">KODE TIKET</th>
                <th className="p-3 border-r border-neutral-800">KATEGORI TIKET</th>
                <th className="p-3 border-r border-neutral-800">STATUS &amp; WAKTU SCAN</th>
                <th className="p-3 text-center">AKSI CHECK-IN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800 text-white">
              {filteredGuests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-6 text-center text-neutral-500 font-bold uppercase">
                    {loading ? 'MEMUAT DATA PEMBELI...' : 'TIDAK ADA DATA PEMBELI DITEMUKAN'}
                  </td>
                </tr>
              ) : (
                filteredGuests.map((order) =>
                  (order.tickets || []).map((t, idx) => {
                    const ticketCode = t.barcode_uuid
                      ? t.barcode_uuid.replace(/-/g, '').substring(0, 7).toUpperCase()
                      : `TK-${(t.id || '1029').toString().slice(-4).toUpperCase()}`;

                    const scanTimeStr = formatScanTime(t.scanned_at);

                    return (
                      <tr key={`${order.id}-${t.id}-${idx}`} className="hover:bg-neutral-900/60">
                        <td className="p-3 font-bold uppercase text-sm border-r border-neutral-800 text-white">{order.guest_name}</td>
                        <td className="p-3 border-r border-neutral-800 text-brand-yellow font-black font-mono tracking-wider">
                          <span className="bg-neutral-950 px-2 py-0.5 rounded border border-brand-yellow/40">
                            {ticketCode}
                          </span>
                        </td>
                        <td className="p-3 border-r border-neutral-800">
                          <Badge variant="purple" className="text-[9px] px-1.5 py-0">
                            {t.ticket_categories?.name || 'Tiket Regular'}
                          </Badge>
                        </td>
                        <td className="p-3 border-r border-neutral-800">
                          {t.is_scanned ? (
                            <div className="space-y-0.5">
                              <Badge variant="green" className="text-[9px] px-1.5 py-0">
                                <CheckCircle2 className="w-3 h-3 mr-1 inline" /> SUDAH DI-SCAN
                              </Badge>
                              {scanTimeStr && (
                                <p className="text-[10px] text-brand-green font-mono font-bold">
                                  {scanTimeStr}
                                </p>
                              )}
                            </div>
                          ) : (
                            <Badge variant="yellow" className="text-[9px] px-1.5 py-0">
                              <XCircle className="w-3 h-3 mr-1 inline" /> BELUM DI-SCAN
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-center">
                          {t.is_scanned ? (
                            <span className="text-neutral-600 font-bold uppercase text-[10px]">TERPAKAI</span>
                          ) : (
                            <Button
                              variant="green"
                              size="sm"
                              onClick={() => handleManualCheckIn(t.id, order.guest_name)}
                              className="px-2.5 py-1 text-xs"
                            >
                              <UserCheck className="w-3.5 h-3.5 mr-1" /> CHECK-IN
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
