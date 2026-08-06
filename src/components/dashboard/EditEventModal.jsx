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
    gatePin: payDetails.gate_pin || '1312',
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
        const { data } = await supabase.from('ticket_categories').select('*').eq('event_id', event.id).eq('is_active', true);
        if (data && data.length > 0) {
          const combinedTiers = [];
          data.forEach(t => {
            if (t.name.endsWith(' — OTS')) return; // skip OTS row, it is mapped below
            const otsTier = data.find(ots => ots.name === `${t.name} — OTS`);
            combinedTiers.push({
              name: t.name,
              price: t.price,
              isOtsEnabled: !!otsTier,
              priceOts: otsTier ? otsTier.price : '',
              quota: t.quota || '',
              description: t.description || '',
              startPo: t.start_po ? new Date(t.start_po).toISOString().slice(0, 16) : '',
              endPo: t.end_po ? new Date(t.end_po).toISOString().slice(0, 16) : '',
            });
          });
          setTiers(combinedTiers);
        } else {
          setTiers([{ name: 'Tiket Presale 1', price: 35000, isOtsEnabled: false, priceOts: '', quota: 100, description: '' }]);
        }
      } catch (e) {
        setTiers([{ name: 'Tiket Presale 1', price: 35000, isOtsEnabled: false, priceOts: '', quota: 100, description: '' }]);
      }
    };
    fetchTiers();
  }, [event.id]);

  const handleAddTier = (name = 'Tiket VIP', price = 75000) => {
    setTiers([...tiers, { name, price, isOtsEnabled: false, priceOts: '', quota: '', startPo: '', endPo: '', description: '' }]);
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
    const eventTime = new Date(formData.eventDate).getTime();

    for (let idx = 0; idx < tiers.length; idx++) {
      const t = tiers[idx];
      if (t.startPo && t.endPo) {
        const startTime = new Date(t.startPo).getTime();
        const endTime = new Date(t.endPo).getTime();
        if (startTime > endTime) {
          return setErrorMsg(`Tier #${idx + 1}: Waktu Mulai PO tidak boleh setelah Waktu Berakhir PO.`);
        }
      }
      if (t.endPo) {
        const endTime = new Date(t.endPo).getTime();
        if (endTime > eventTime) {
          return setErrorMsg(`Tier #${idx + 1}: Penjualan PO tidak boleh berakhir setelah acara dimulai.`);
        }
      }
    }

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
          gate_pin: formData.gatePin || '1312',
        },
      };

      const formattedTiers = tiers.map((t) => ({
        ...t,
        price: t.price ? parseInt(String(t.price).replace(/\./g, ''), 10) : 0,
        quota: t.quota ? parseInt(String(t.quota).replace(/\./g, ''), 10) : null,
        start_po: t.startPo ? new Date(t.startPo).toISOString() : null,
        end_po: t.endPo ? new Date(t.endPo).toISOString() : null,
        is_ots_enabled: t.isOtsEnabled || false,
        price_ots: t.isOtsEnabled && t.priceOts ? parseInt(String(t.priceOts).replace(/\./g, ''), 10) : null,
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
    <div className="fixed inset-0 z-[99999] w-screen h-screen bg-black/90 backdrop-blur-md flex items-center justify-center p-0 lg:p-4 overflow-hidden">
      <Card variant="dark" className="w-full h-full lg:h-[88vh] lg:max-w-5xl p-4 sm:p-6 border-0 lg:border border-brand-green/50 bg-[#121212] rounded-none lg:rounded-2xl flex flex-col justify-between text-left shadow-[0_0_50px_rgba(0,0,0,0.9)] overflow-hidden">
        {/* Modal Header (Fixed) */}
        <div className="flex justify-between items-center border-b border-neutral-800 pb-3 shrink-0 mb-3">
          <h3 className="text-sm sm:text-base font-black uppercase text-brand-green flex items-center gap-2 truncate">
            <Edit3 className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" /> EDIT DATA EVENT: {event.name.toUpperCase()}
          </h3>
          <Button variant="outline" size="sm" onClick={onCancel} className="text-xs shrink-0 py-1.5 px-3">
            ← KEMBALI
          </Button>
        </div>

        {errorMsg && <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-2.5 rounded border border-brand-red/40 shrink-0 mb-3">{errorMsg}</p>}

        {/* Scrollable Form Content Body */}
        <form onSubmit={handleSubmit} className="flex-1 min-h-0 grid grid-cols-1 lg:grid-cols-2 gap-4 overflow-hidden">
          <div className="space-y-3 overflow-y-auto no-scrollbar pr-1">
            <div className="p-3.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-3">
              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">NAMA EVENT:</label>
                <input type="text" required value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-bold" />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">TANGGAL ACARA:</label>
                  <input type="datetime-local" required value={formData.eventDate} onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })} className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-white" />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">OPEN GATE:</label>
                  <input type="datetime-local" value={formData.openGate} onChange={(e) => setFormData({ ...formData, openGate: e.target.value })} className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-white" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">LOKASI VENUE / GOOGLE MAPS LINK:</label>
                <input type="text" placeholder="Misal: JIEXPO Kemayoran, Jakarta" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none font-bold" />
              </div>

              <div className="flex gap-3 items-center pt-1">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">GANTI POSTER (OPSIONAL):</label>
                  <input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setPosterFile(e.target.files[0]); setPosterPreview(URL.createObjectURL(e.target.files[0])); } }} className="w-full text-[11px] text-neutral-300 bg-neutral-950 p-1.5 rounded border border-neutral-800 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-brand-green file:text-black file:font-bold cursor-pointer" />
                </div>
                {posterPreview && <img src={posterPreview} alt="Poster" className="w-10 h-14 object-cover rounded border border-neutral-700 shrink-0" />}
              </div>

              <div className="pt-2 border-t border-neutral-800/80">
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">DESKRIPSI / LOKASI VENUE:</label>
                <textarea rows={2} placeholder="Lokasi venue, lineup, info penting..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none font-bold" />
              </div>
            </div>

            <div className="p-3.5 bg-neutral-900 rounded-lg border border-neutral-800 space-y-2.5">
              <label className="text-[10px] font-black uppercase text-brand-purple block">METODE PEMBAYARAN (BANK &amp; REKENING):</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">BANK</span>
                  <input type="text" required placeholder="BCA" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-bold" />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">NO REKENING</span>
                  <input type="text" required inputMode="numeric" placeholder="123456789" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/[^0-9]/g, '') })} className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-mono font-bold" />
                </div>
                <div>
                  <span className="text-[9px] text-neutral-400 font-bold block mb-0.5">ATAS NAMA</span>
                  <input type="text" required placeholder="Holder" value={formData.accountHolder} onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })} className="w-full px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white font-bold" />
                </div>
              </div>
              <div className="flex gap-3 items-center pt-2 border-t border-neutral-800/80">
                <div className="flex-1">
                  <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">GANTI QRIS (OPSIONAL):</label>
                  <input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setQrisFile(e.target.files[0]); setQrisPreview(URL.createObjectURL(e.target.files[0])); } }} className="w-full text-[11px] text-neutral-300 bg-neutral-950 p-1 rounded border border-neutral-800 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-brand-purple file:text-white file:font-bold cursor-pointer" />
                </div>
                {qrisPreview && <img src={qrisPreview} alt="QRIS" className="w-10 h-10 object-contain bg-white p-0.5 rounded border border-neutral-700 shrink-0" />}
              </div>
              <div className="pt-2 border-t border-neutral-800/60">
                <label className="text-[10px] font-black uppercase text-brand-purple block mb-1">PIN GATE VENUE (4 DIGIT):</label>
                <input type="text" inputMode="numeric" maxLength={4} required placeholder="1312" value={formData.gatePin} onChange={(e) => setFormData({ ...formData, gatePin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })} className="w-full px-3 py-1.5 bg-neutral-950 border border-brand-purple/40 rounded text-xs text-brand-purple focus:border-brand-purple outline-none font-bold font-mono" />
              </div>
            </div>
          </div>

          <div className="flex flex-col h-full min-h-0">
            <div className="flex flex-col flex-1 min-h-0 overflow-hidden rounded-lg border border-neutral-800 bg-neutral-900 p-3.5">
              <div className="flex justify-between items-center mb-3 shrink-0">
                <label className="text-[10px] font-black uppercase text-brand-blue block">KATEGORI &amp; TIER TIKET:</label>
                <button type="button" onClick={() => handleAddTier()} className="px-2.5 py-1 bg-neutral-950 text-brand-green border border-brand-green/40 text-[10px] font-black rounded hover:bg-brand-green/20 transition-colors">+ TAMBAH TIER</button>
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar pr-1 space-y-2.5">
                {tiers.map((t, idx) => (
                  <div key={idx} className="p-3 sm:p-4 bg-neutral-950 rounded border border-neutral-800 space-y-4 relative">
                    {/* Bagian Umum */}
                    <div>
                      <div className="flex justify-between items-center mb-3">
                        <span className="text-[10px] font-black uppercase text-neutral-400">TIER #{idx + 1}</span>
                        {tiers.length > 1 && <button type="button" onClick={() => handleRemoveTier(idx)} className="text-brand-red text-xs"><Trash2 className="w-3.5 h-3.5" /></button>}
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[9px] text-neutral-400 font-bold block mb-1">NAMA TIKET</span>
                          <input type="text" required placeholder="Nama Tiket" value={t.name} onChange={(e) => handleTierChange(idx, 'name', e.target.value)} className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-bold" />
                        </div>
                        <div className="col-span-2 sm:col-span-1">
                          <span className="text-[9px] text-neutral-400 font-bold block mb-1">KUOTA (KOSONG = UNLIMITED)</span>
                          <input type="text" inputMode="numeric" placeholder="Contoh: 100" value={t.quota ? Number(t.quota).toLocaleString('id-ID') : ''} onChange={(e) => { const c = e.target.value.toLowerCase().replace(/k/g, '000').replace(/[^0-9]/g, ''); handleTierChange(idx, 'quota', c ? parseInt(c, 10) : ''); }} className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-mono" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 items-stretch">
                      {/* Section PO */}
                      <div className="p-3 bg-white/5 border border-brand-blue/30 rounded-lg flex flex-col justify-start space-y-3">
                        <h5 className="text-[10px] font-black uppercase text-brand-blue tracking-wide">HARGA &amp; JADWAL PRESALE (PO)</h5>
                        <div className="grid grid-cols-1 gap-3">
                          <div>
                            <span className="text-[9px] text-neutral-400 font-bold block mb-1">HARGA PRESALE (RP) *</span>
                            <input type="text" inputMode="numeric" required placeholder="Harga PO (Rp)" value={t.price ? Number(t.price).toLocaleString('id-ID') : ''} onChange={(e) => { const c = e.target.value.toLowerCase().replace(/k/g, '000').replace(/[^0-9]/g, ''); handleTierChange(idx, 'price', c ? parseInt(c, 10) : ''); }} className="w-full px-2 py-1.5 bg-neutral-900 border border-brand-blue/30 rounded text-xs text-white font-mono font-bold" />
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            <div>
                              <span className="text-[9px] text-neutral-400 font-bold block mb-1">START PO (TGL & JAM)</span>
                              <input type="datetime-local" value={t.startPo || ''} onChange={(e) => handleTierChange(idx, 'startPo', e.target.value)} className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-white" />
                            </div>
                            <div>
                              <span className="text-[9px] text-neutral-400 font-bold block mb-1">END PO (TGL & JAM)</span>
                              <input type="datetime-local" value={t.endPo || ''} onChange={(e) => handleTierChange(idx, 'endPo', e.target.value)} className="w-full px-2 py-1.5 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-white" />
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Section OTS */}
                      <div className="p-3 bg-white/5 border border-brand-yellow/30 rounded-lg flex flex-col justify-start space-y-3">
                        <div className="flex items-center justify-between">
                          <h5 className="text-[10px] font-black uppercase text-brand-yellow tracking-wide">HARGA OTS (ON THE SPOT)</h5>
                          <label className="flex items-center cursor-pointer space-x-2">
                            <span className="text-[9px] font-bold text-neutral-400">AKTIFKAN OTS?</span>
                            <input type="checkbox" className="hidden" checked={t.isOtsEnabled || false} onChange={(e) => handleTierChange(idx, 'isOtsEnabled', e.target.checked)} />
                            <div className={`w-8 h-4 rounded-full transition-colors ${t.isOtsEnabled ? 'bg-brand-yellow' : 'bg-neutral-700'} relative`}>
                              <div className={`absolute top-0.5 left-0.5 w-3 h-3 bg-white rounded-full transition-transform ${t.isOtsEnabled ? 'translate-x-4' : ''}`}></div>
                            </div>
                          </label>
                        </div>
                        {t.isOtsEnabled && (
                          <div className="space-y-3">
                            <div className="bg-brand-yellow/10 border border-brand-yellow/20 px-2 py-1.5 rounded">
                              <span className="text-[9px] text-brand-yellow/80 font-medium block">Tiket ini akan tersimpan sebagai:</span>
                              <span className="text-[10px] text-brand-yellow font-black">{t.name ? `${t.name} — OTS` : '— OTS'}</span>
                            </div>
                            <div>
                              <span className="text-[9px] text-neutral-400 font-bold block mb-1">HARGA OTS (RP) *</span>
                              <input type="text" inputMode="numeric" required={t.isOtsEnabled} placeholder="Harga OTS (Rp)" value={t.priceOts ? Number(t.priceOts).toLocaleString('id-ID') : ''} onChange={(e) => { const c = e.target.value.toLowerCase().replace(/k/g, '000').replace(/[^0-9]/g, ''); handleTierChange(idx, 'priceOts', c ? parseInt(c, 10) : ''); }} className="w-full px-2 py-1.5 bg-neutral-900 border border-brand-yellow/30 rounded text-xs text-white font-mono font-bold" />
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Action Buttons (Fixed Bottom) */}
            <div className="flex gap-3 pt-2 shrink-0 border-t border-neutral-800/80">
              <Button type="button" variant="outline" onClick={onCancel} className="w-1/3 text-xs uppercase py-3 justify-center">BATAL</Button>
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