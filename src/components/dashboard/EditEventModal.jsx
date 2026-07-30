import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Edit3, Trash2, Landmark, QrCode, CheckCircle2 } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { compressImageToWebP } from '../../utils/imageCompress';
import { uploadEventPoster, uploadQrisCode, updateEventData } from '../../services/apiEvents';
import { supabase } from '../../services/supabase';

export const EditEventModal = ({ event, onSaved, onCancel }) => {
  const payDetails = event.payment_details || {};

  const [formData, setFormData] = useState({
    name: event.name || '',
    location: event.location || '',
    eventDate: event.event_date ? new Date(event.event_date).toISOString().slice(0, 16) : '',
    openGate: event.open_gate ? new Date(event.open_gate).toISOString().slice(0, 16) : '',
    description: event.description || '',
    bankName: payDetails.bank_name || payDetails.bank || 'BCA',
    accountNumber: payDetails.account_no || payDetails.number || '',
    accountHolder: payDetails.account_name || payDetails.holder || '',
    gatePin: payDetails.gate_pin || '1029',
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(event.poster_url || null);
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(payDetails.qris_url || null);
  const [tiers, setTiers] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  useEffect(() => {
    const fetchTiers = async () => {
      try {
        const { data } = await supabase.from('ticket_categories').select('*').eq('event_id', event.id);
        if (data && data.length > 0) {
          setTiers(
            data.map((t) => ({
              name: t.name,
              price: t.price,
              quota: t.quota || '',
              description: t.description || '',
              startPo: t.start_po ? new Date(t.start_po).toISOString().slice(0, 16) : '',
              endPo: t.end_po ? new Date(t.end_po).toISOString().slice(0, 16) : '',
            }))
          );
        } else {
          setTiers([{ name: 'Tiket Presale 1', price: 35000, quota: 100, description: '' }]);
        }
      } catch (e) {
        setTiers([{ name: 'Tiket Presale 1', price: 35000, quota: 100, description: '' }]);
      }
    };
    fetchTiers();
  }, [event.id]);

  const handleAddTier = (name = 'Tiket VIP', price = 75000) => {
    setTiers([...tiers, { name, price, quota: '', startPo: '', endPo: '', description: '' }]);
  };

  const handleRemoveTier = (idx) => {
    if (tiers.length > 1) setTiers(tiers.filter((_, i) => i !== idx));
  };

  const handleTierChange = (idx, field, val) => {
    const updated = [...tiers];
    updated[idx][field] = val;
    setTiers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSubmitting(true);
      setErrorMsg(null);

      let posterUrl = event.poster_url;
      if (posterFile) {
        const compressedPoster = await compressImageToWebP(posterFile, 1000, 0.75);
        posterUrl = await uploadEventPoster(compressedPoster);
      }

      let qrisUrl = payDetails.qris_url || '';
      if (qrisFile) {
        const compressedQris = await compressImageToWebP(qrisFile, 800, 0.8);
        qrisUrl = await uploadQrisCode(compressedQris);
      }

      const eventPayload = {
        name: formData.name,
        location: formData.location,
        description: formData.description,
        poster_url: posterUrl,
        event_date: new Date(formData.eventDate).toISOString(),
        open_gate: new Date(formData.openGate || formData.eventDate).toISOString(),
        payment_details: {
          bank_name: formData.bankName,
          account_no: formData.accountNumber,
          account_name: formData.accountHolder,
          bank: formData.bankName,
          number: formData.accountNumber,
          holder: formData.accountHolder,
          qris_url: qrisUrl,
          gate_pin: formData.gatePin || '1029',
        },
      };

      const formattedTiers = tiers.map((t) => ({
        ...t,
        start_po: t.startPo ? new Date(t.startPo).toISOString() : null,
        end_po: t.endPo ? new Date(t.endPo).toISOString() : null,
      }));

      await updateEventData(event.id, eventPayload, formattedTiers);
      onSaved();
    } catch (err) {
      setErrorMsg(err.message || 'Gagal memperbarui event.');
    } finally {
      setSubmitting(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[99999] w-screen h-screen bg-black/85 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <Card variant="dark" className="w-full max-w-4xl p-5 sm:p-6 border border-brand-green/50 bg-[#121212] space-y-4 my-auto text-left shadow-[0_0_50px_rgba(0,0,0,0.9)]">
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3">
          <h3 className="text-base font-black uppercase text-brand-green flex items-center gap-2">
            <Edit3 className="w-5 h-5" /> EDIT DATA EVENT: {event.name.toUpperCase()}
          </h3>
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs">TUTUP</Button>
        </div>

        {errorMsg && <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-2.5 rounded border border-brand-red/40">{errorMsg}</p>}

        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <div className="space-y-3">
            <div className="p-4 bg-neutral-900 rounded border border-neutral-800 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">NAMA EVENT:</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">TANGGAL ACARA:</label>
                  <input type="datetime-local" required value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">OPEN GATE:</label>
                  <input type="datetime-local" value={formData.openGate} onChange={(e) => setFormData({ ...formData, openGate: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">LOKASI VENUE / GOOGLE MAPS LINK:</label>
                <input type="text" placeholder="Misal: JIEXPO Kemayoran, Jakarta" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none font-bold" />
              </div>

              <div className="flex gap-3 items-center pt-1">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">GANTI POSTER (OPSIONAL):</label>
                  <input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setPosterFile(e.target.files[0]); setPosterPreview(URL.createObjectURL(e.target.files[0])); } }} className="w-full text-xs text-neutral-300 bg-neutral-950 p-1.5 rounded border border-neutral-800 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:bg-brand-green file:text-black file:font-bold cursor-pointer" />
                </div>
                {posterPreview && <img src={posterPreview} alt="Poster" className="w-12 h-16 object-cover rounded border border-neutral-700 shrink-0" />}
              </div>

              <div className="pt-2.5 border-t border-neutral-800/80">
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">DESKRIPSI / LOKASI VENUE:</label>
                <textarea rows={2.5} placeholder="Lokasi venue, lineup, info penting..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none font-bold" />
              </div>
            </div>

            <div className="p-4 bg-neutral-900 rounded border border-neutral-800 space-y-3">
              <label className="text-[10px] font-black uppercase text-brand-purple block">METODE PEMBAYARAN (BANK &amp; REKENING):</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">BANK</span>
                  <input type="text" required placeholder="BCA" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-bold" />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">NO REKENING</span>
                  <input type="text" required placeholder="123456789" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-mono font-bold" />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">ATAS NAMA</span>
                  <input type="text" required placeholder="Holder" value={formData.accountHolder} onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })} className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-bold" />
                </div>
              </div>
              <div className="flex gap-3 items-center pt-2.5 border-t border-neutral-800/80">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">GANTI QRIS (OPSIONAL):</label>
                  <input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setQrisFile(e.target.files[0]); setQrisPreview(URL.createObjectURL(e.target.files[0])); } }} className="w-full text-xs text-neutral-300 bg-neutral-950 p-1.5 rounded border border-neutral-800 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-brand-purple file:text-white file:font-bold cursor-pointer" />
                </div>
                {qrisPreview && <img src={qrisPreview} alt="QRIS" className="w-12 h-12 object-contain bg-white p-0.5 rounded border border-neutral-700 shrink-0" />}
              </div>
              <div className="pt-2 border-t border-neutral-800/60">
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">PIN GATE VENUE (4 DIGIT):</label>
                <input type="text" maxLength={4} required placeholder="1029" value={formData.gatePin} onChange={(e) => setFormData({ ...formData, gatePin: e.target.value.replace(/[^0-9]/g, '') })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none font-bold font-mono" />
              </div>
            </div>
          </div>

          <div className="space-y-3 flex flex-col justify-between">
            <div className="p-4 bg-neutral-900 rounded border border-neutral-800 space-y-3">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black uppercase text-brand-blue block">KATEGORI &amp; TIER TIKET:</label>
                <button type="button" onClick={() => handleAddTier()} className="px-2.5 py-1 bg-neutral-950 text-brand-green border border-brand-green/40 text-[10px] font-black rounded hover:bg-brand-green/20 transition-colors">+ TAMBAH TIER</button>
              </div>
              <div className="space-y-2.5 max-h-64 overflow-y-auto no-scrollbar pr-1">
                {tiers.map((t, idx) => (
                  <div key={idx} className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-1.5">
                    <div className="flex justify-between items-center">
                      <span className="text-[9px] font-black text-neutral-400 uppercase">TIER TIKET #{idx + 1}</span>
                      {tiers.length > 1 && <button type="button" onClick={() => handleRemoveTier(idx)} className="text-brand-red text-xs p-1 hover:bg-brand-red/10 rounded"><Trash2 className="w-3.5 h-3.5" /></button>}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <span className="text-[8px] text-neutral-500 font-bold block mb-0.5">NAMA TIER</span>
                        <input type="text" required placeholder="Regular" value={t.name} onChange={(e) => handleTierChange(idx, 'name', e.target.value)} className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-bold" />
                      </div>
                      <div>
                        <span className="text-[8px] text-neutral-500 font-bold block mb-0.5">HARGA (RP)</span>
                        <input type="number" required placeholder="50000" value={t.price} onChange={(e) => handleTierChange(idx, 'price', e.target.value)} className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-mono font-bold" />
                      </div>
                      <div>
                        <span className="text-[8px] text-neutral-500 font-bold block mb-0.5">KUOTA</span>
                        <input type="number" placeholder="100" value={t.quota} onChange={(e) => handleTierChange(idx, 'quota', e.target.value)} className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-mono" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button type="button" variant="outline" onClick={onCancel} className="w-1/3 text-xs uppercase">BATAL</Button>
              <Button type="submit" variant="green" disabled={submitting} className="w-2/3 text-xs uppercase justify-center font-black py-3">
                {submitting ? 'MEMPROSES...' : 'SIMPAN PERUBAHAN EVENT'}
              </Button>
            </div>
          </div>
        </form>
      </Card>
    </div>,
    document.body
  );
};