import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Eye, Power, RefreshCw, Plus, ExternalLink, Inbox, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { getAllEventsForEo, updateEventStatus } from '../../services/apiEvents';
import { formatRupiah, formatDate } from '../../utils/formatters';

export const MyEventsTab = ({ onNavigateToCreate }) => {
  const { user } = useAuth();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  const eoUsername = user?.username || user?.name || 'eo_lokal';

  const fetchEvents = async () => {
    try {
      setLoading(true);
      setErrorMsg(null);
      const data = await getAllEventsForEo(eoUsername);
      setEvents(data);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memuat daftar event.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, [eoUsername]);

  const handleToggleStatus = async (eventId, currentStatus) => {
    const nextStatus = currentStatus === 'active' ? 'draft' : 'active';
    try {
      await updateEventStatus(eventId, nextStatus);
      setEvents((prev) =>
        prev.map((e) => (e.id === eventId ? { ...e, status: nextStatus } : e))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <Card variant="dark" className="p-6 space-y-6 text-left border-neutral-800">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center border-b border-neutral-800 pb-3 gap-3">
        <div>
          <h3 className="text-lg font-black uppercase text-white">DAFTAR EVENT SAYA (TERISOLASI AKUN)</h3>
          <p className="text-xs text-neutral-400">Kelola event khusus buatan akun {eoUsername}.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={fetchEvents} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 mr-1 ${loading ? 'animate-spin' : ''}`} /> REFRESH DB
          </Button>
          <Button variant="green" size="sm" onClick={onNavigateToCreate}>
            <Plus className="w-4 h-4 mr-1" /> BUAT EVENT BARU
          </Button>
        </div>
      </div>

      {errorMsg && (
        <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-3 rounded-md border border-brand-red/40">
          {errorMsg}
        </p>
      )}

      {loading ? (
        <div className="py-16 text-center space-y-3">
          <RefreshCw className="w-8 h-8 text-brand-green animate-spin mx-auto" />
          <p className="text-xs font-bold text-neutral-400 uppercase">MEMUAT DAFTAR EVENT DARI DB...</p>
        </div>
      ) : events.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <Inbox className="w-12 h-12 text-neutral-600 mx-auto" />
          <p className="font-extrabold text-sm text-neutral-400 uppercase">BELUM ADA EVENT YANG DIBUAT DENGAN AKUN INI</p>
          <p className="text-xs text-neutral-500 font-medium">Klik tombol "BUAT EVENT BARU" di atas untuk mempublikasikan event pertama Anda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {events.map((evt) => (
            <div key={evt.id} className="p-4 bg-neutral-900 rounded-md border border-neutral-800 space-y-3 flex flex-col justify-between">
              <div className="flex space-x-3">
                <div className="w-20 h-28 bg-black rounded overflow-hidden shrink-0 border border-neutral-700">
                  <img src={evt.poster_url} alt={evt.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1.5 overflow-hidden flex-1">
                  <div className="flex items-center space-x-2">
                    <Badge variant={evt.status === 'active' ? 'green' : 'red'}>
                      {evt.status === 'active' ? 'PUBLIK (AKTIF)' : 'DRAFT (NONAKTIF)'}
                    </Badge>
                  </div>
                  <h4 className="text-sm font-black uppercase text-white truncate">{evt.name}</h4>
                  <p className="text-xs text-neutral-400 font-mono flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5 text-brand-green" />
                    <span>{formatDate(evt.event_date)}</span>
                  </p>
                  <p className="text-[10px] text-neutral-500 font-mono truncate">SLUG: /event/{evt.slug}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-neutral-800 gap-2">
                <Link
                  to={`/event/${evt.slug}`}
                  target="_blank"
                  className="px-2.5 py-1.5 bg-neutral-950 hover:bg-neutral-800 text-brand-blue border border-brand-blue/30 text-xs font-bold rounded flex items-center space-x-1"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>WEBSITE</span>
                </Link>

                <Link
                  to={`/gate/${evt.slug}`}
                  target="_blank"
                  className="px-2.5 py-1.5 bg-brand-purple/20 hover:bg-brand-purple/30 text-brand-purple border border-brand-purple/40 text-xs font-black rounded flex items-center space-x-1"
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>GATE PORTAL (PIN: 1029)</span>
                </Link>

                <Button
                  variant={evt.status === 'active' ? 'red' : 'green'}
                  size="sm"
                  onClick={() => handleToggleStatus(evt.id, evt.status)}
                >
                  <Power className="w-3.5 h-3.5 mr-1" />
                  {evt.status === 'active' ? 'NONAKTIFKAN' : 'AKTIFKAN'}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
};
