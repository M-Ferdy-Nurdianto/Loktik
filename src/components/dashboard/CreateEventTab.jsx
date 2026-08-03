import React, { useState } from 'react';
import { Plus, Trash2, Landmark, CheckCircle2, QrCode, ImageIcon, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { compressImageToWebP } from '../../utils/imageCompress';
import { uploadEventPoster, uploadQrisCode, createEventWithTiers, getAllEventsForEo } from '../../services/apiEvents';
import { useToast } from '../../context/ToastContext';
import { getPlanLimits, PLAN_LABELS } from '../../utils/planLimits';

export const CreateEventTab = ({ onEventCreated }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const eoUsername = user?.username || user?.name || 'eo_lokal';

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    location: '',
    description: '',
    eventDate: '',
    openGate: '',
    bankName: 'BCA',
    accountNumber: '',
    accountHolder: '',
    gatePin: '',
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const [tiers, setTiers] = useState([
    { name: 'Tiket Presale 1', price: 35000, isOtsEnabled: false, priceOts: '', quota: 100, startPo: '', endPo: '', description: '' },
  ]);

  const handleAddTier = (name = 'Tiket VIP', price = 75000) => {
    setTiers([...tiers, { name, price, isOtsEnabled: false, priceOts: '', quota: '', startPo: '', endPo: '', description: '' }]);
  };

  const handleRemoveTier = (idx) => {
    if (tiers.length > 1) setTiers(tiers.filter((_, i) => i !== idx));
  };

  const handleTierChange = (idx, field, value) => {
    const updated = [...tiers];
    updated[idx][field] = value;
    setTiers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.eventDate || !posterFile) {
      showToast('Nama Event, Tanggal Acara & File Poster wajib diisi.', 'eo');
      return;
    }
    if (!formData.gatePin || formData.gatePin.length !== 4) {
      showToast('PIN Gate Venue harus 4 digit angka.', 'eo');
      return;
    }

    const hasBank = formData.bankName && formData.accountNumber && formData.accountHolder;
    if (!hasBank && !qrisFile) {
      showToast('Wajib mengisi Rekening Bank atau mengunggah QRIS.', 'eo');
      return;
    }

    const eventTime = new Date(formData.eventDate).getTime();

    for (let idx = 0; idx < tiers.length; idx++) {
      const t = tiers[idx];
      if (t.startPo && t.endPo) {
        const startTime = new Date(t.startPo).getTime();
        const endTime = new Date(t.endPo).getTime();
        if (startTime > endTime) {
          showToast(`Tier #${idx + 1}: Waktu Mulai PO tidak boleh setelah Waktu Berakhir PO.`, 'eo');
          return;
        }
      }
      if (t.endPo) {
        const endTime = new Date(t.endPo).getTime();
        if (endTime > eventTime) {
          showToast(`Tier #${idx + 1}: Penjualan PO tidak boleh berakhir setelah acara dimulai.`, 'eo');
          return;
        }
      }
    }

    try {
      setSubmitting(true);

      // --- LIMIT CHECK: max event aktif per paket ---
      const userPlan = user?.subscriptionPlan || '1_month';
      const { maxEvents } = getPlanLimits(userPlan);
      if (maxEvents !== Infinity) {
        const existingEvents = await getAllEventsForEo(eoUsername);
        const activeCount = existingEvents.filter((e) => e.status === 'active').length;
        if (activeCount >= maxEvents) {
          showToast(
            `${PLAN_LABELS[userPlan] || 'Paket Anda'} maksimal ${maxEvents} event aktif. Hapus event lama atau upgrade.`,
            'eo'
          );
          setSubmitting(false);
          return;
        }
      }
      // --- END LIMIT CHECK ---

      const compressedPoster = await compressImageToWebP(posterFile, 1000, 0.75);
      const uploadedPosterUrl = await uploadEventPoster(compressedPoster);

      let uploadedQrisUrl = '';
      if (qrisFile) {
        const compressedQris = await compressImageToWebP(qrisFile, 800, 0.8);
        uploadedQrisUrl = await uploadQrisCode(compressedQris);
      }

      const generatedSlug = formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const eventPayload = {
        name: formData.name,
        slug: generatedSlug,
        created_by: eoUsername,
        location: formData.location,
        description: formData.description,
        poster_url: uploadedPosterUrl,
        event_date: new Date(formData.eventDate).toISOString(),
        open_gate: new Date(formData.openGate || formData.eventDate).toISOString(),
        payment_details: { bank: formData.bankName, number: formData.accountNumber, holder: formData.accountHolder, qris_url: uploadedQrisUrl, gate_pin: formData.gatePin || '1312' },
        status: 'active',
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

      const newEvt = await createEventWithTiers(eventPayload, formattedTiers);
      showToast(`EVENT '${formData.name.toUpperCase()}' BERHASIL DIPUBLIKASIKAN!`, 'eo');
      if (onEventCreated) onEventCreated(newEvt);
    } catch (err) {
      let msg = err.message || 'Gagal menyimpan event.';
      if (msg.includes('EVENTS_SLUG_KEY')) {
        msg = 'Nama event ini sudah pernah digunakan. Silakan tambahkan angka atau kata lain agar unik.';
      }
      showToast(`Gagal Membuat Event: ${msg}`, 'eo');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="dark" className="p-4 sm:p-5 space-y-4 text-left border-neutral-800">
      <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-base font-black uppercase text-white">BUAT EVENT BARU (EO: {eoUsername})</h3>
          <p className="text-xs text-neutral-400">Form ringkas 2-kolom bebas scroll panjang.</p>
        </div>
        <div className="flex items-center gap-2">
          {(() => {
            const userPlan = user?.subscriptionPlan || '1_month';
            const { maxEvents } = getPlanLimits(userPlan);
            if (maxEvents === Infinity) return <Badge variant="blue">UNLIMITED EVENT</Badge>;
            return (
              <Badge variant={maxEvents === 1 ? 'yellow' : 'purple'} className="text-[9px]">
                MAX {maxEvents} EVENT AKTIF ({PLAN_LABELS[userPlan] || userPlan})
              </Badge>
            );
          })()}
          <Badge variant="green">0% FEES</Badge>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* LEFT COLUMN: INFORMASI ACARA & METODE BAYAR */}
        <div className="space-y-4">
          <div className="p-3.5 bg-neutral-900 rounded border border-neutral-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-brand-green tracking-wider">1. INFORMASI ACARA &amp; POSTER</h4>
            <div>
              <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">NAMA EVENT *</label>
              <input type="text" required placeholder="Misal: Concert Music Fest 2026" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none font-bold" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">TANGGAL ACARA & OPEN GATE *</label>
              <input type="datetime-local" required value={formData.eventDate} onChange={(e) => {
                setFormData({ ...formData, eventDate: e.target.value, openGate: e.target.value });
              }} className="w-full px-3.5 py-2 bg-neutral-950 border border-neutral-800 rounded text-[11px] text-white focus:border-brand-green outline-none font-bold" />
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">LOKASI VENUE / GOOGLE MAPS LINK *</label>
              <input type="text" required placeholder="Misal: JIEXPO Kemayoran, Jakarta" value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none font-bold" />
            </div>

            <div className="flex gap-3 items-center">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">UNGGAH POSTER (IMAGE) *</label>
                <input type="file" accept="image/*" required onChange={(e) => { if (e.target.files[0]) { setPosterFile(e.target.files[0]); setPosterPreview(URL.createObjectURL(e.target.files[0])); } }} className="w-full text-xs text-neutral-300 bg-neutral-950 p-1.5 rounded border border-neutral-800 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-brand-green file:text-black file:font-bold" />
              </div>
              {posterPreview && <img src={posterPreview} alt="Preview" className="w-12 h-16 object-cover rounded border border-neutral-700" />}
            </div>

            <div>
              <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">DESKRIPSI RINGKAS</label>
              <input type="text" placeholder="Lokasi venue, lineup, info penting..." value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none" />
            </div>
          </div>

          <div className="p-3.5 bg-neutral-900 rounded border border-neutral-800 space-y-3">
            <h4 className="text-xs font-black uppercase text-brand-purple tracking-wider flex items-center gap-1"><Landmark className="w-3.5 h-3.5" /> 2. REKENING &amp; QRIS PANITIA</h4>
            <div className="grid grid-cols-3 gap-2">
              <input type="text" required={!qrisFile} placeholder="BANK (BCA)" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-purple font-bold" />
              <input type="text" required={!qrisFile} inputMode="numeric" placeholder="NO REK" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/[^0-9]/g, '') })} className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-purple font-mono font-bold" />
              <input type="text" required={!qrisFile} placeholder="ATAS NAMA" value={formData.accountHolder} onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })} className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-purple font-bold" />
            </div>
            <div className="flex gap-3 items-center pt-1 border-t border-neutral-800">
              <div className="flex-1">
                <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">UPLOAD QRIS (OPSIONAL)</label>
                <input type="file" accept="image/*" onChange={(e) => { if (e.target.files[0]) { setQrisFile(e.target.files[0]); setQrisPreview(URL.createObjectURL(e.target.files[0])); } }} className="w-full text-xs text-neutral-300 bg-neutral-950 p-1 rounded border border-neutral-800 file:mr-2 file:py-0.5 file:px-2 file:rounded file:border-0 file:bg-brand-purple file:text-white file:font-bold" />
              </div>
              {qrisPreview && <img src={qrisPreview} alt="QRIS" className="w-12 h-12 object-contain bg-white p-0.5 rounded border border-neutral-700" />}
            </div>
            <div className="pt-2 border-t border-neutral-800/60">
              <label className="text-[10px] font-black uppercase text-brand-purple block mb-1">PIN GATE VENUE (4 DIGIT) *</label>
              <input type="text" inputMode="numeric" maxLength={4} required placeholder="Contoh: 1234" value={formData.gatePin} onChange={(e) => setFormData({ ...formData, gatePin: e.target.value.replace(/[^0-9]/g, '').slice(0, 4) })} className="w-full px-3 py-1.5 bg-neutral-950 border border-brand-purple/40 rounded text-xs text-brand-purple focus:border-brand-purple outline-none font-bold font-mono" />
              <p className="text-[10px] text-neutral-500 mt-1">Kode ini dipakai staf untuk masuk ke Gate Scanner event ini.</p>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: KATEGORI TIKET & SUBMIT */}
        <div className="flex flex-col gap-4 h-full">
          <div className="p-3.5 bg-neutral-900 rounded border border-neutral-800 flex flex-col flex-1 min-h-0">
            <div className="flex justify-between items-center mb-3 shrink-0">
              <h4 className="text-xs font-black uppercase text-brand-blue tracking-wider">3. TIER KATEGORI TIKET</h4>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => handleAddTier('Presale 2', 45000)} className="px-2 py-0.5 bg-neutral-950 text-brand-green border border-brand-green/30 text-[10px] font-bold rounded">+ Presale</button>
                <button type="button" onClick={() => handleAddTier('VIP Pass', 75000)} className="px-2 py-0.5 bg-neutral-950 text-brand-purple border border-brand-purple/30 text-[10px] font-bold rounded">+ VIP</button>
              </div>
            </div>

            <div className="space-y-2.5 overflow-y-auto no-scrollbar pr-1 flex-1 min-h-0">
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

          <Button type="submit" variant="green" size="lg" fullWidth disabled={submitting} className="font-black uppercase text-xs py-3 shrink-0 mt-auto">
            {submitting ? 'MEMPROSES...' : 'PUBLIKASIKAN EVENT SEKARANG'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
