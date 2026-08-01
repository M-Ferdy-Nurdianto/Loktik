import React, { useState } from 'react';
import { Plus, Trash2, Landmark, CheckCircle2, QrCode, ImageIcon, Calendar, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { compressImageToWebP } from '../../utils/imageCompress';
import { uploadEventPoster, uploadQrisCode, createEventWithTiers, getAllEventsForEo } from '../../services/apiEvents';
import { getPlanLimits, PLAN_LABELS } from '../../utils/planLimits';

export const CreateEventTab = ({ onEventCreated }) => {
  const { user } = useAuth();
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
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const [tiers, setTiers] = useState([
    { name: 'Tiket Presale 1', price: 35000, priceOts: '', quota: 100, startPo: '', endPo: '', description: '' },
  ]);

  const handleAddTier = (name = 'Tiket VIP', price = 75000) => {
    setTiers([...tiers, { name, price, priceOts: '', quota: '', startPo: '', endPo: '', description: '' }]);
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
      return setErrorMsg('Nama Event, Tanggal Acara & File Poster wajib diisi.');
    }
    if (!formData.gatePin || formData.gatePin.length !== 4) {
      return setErrorMsg('PIN Gate Venue harus 4 digit angka.');
    }

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

      // --- LIMIT CHECK: max event aktif per paket ---
      const userPlan = user?.subscriptionPlan || '1_month';
      const { maxEvents } = getPlanLimits(userPlan);
      if (maxEvents !== Infinity) {
        const existingEvents = await getAllEventsForEo(eoUsername);
        const activeCount = existingEvents.filter((e) => e.status === 'active').length;
        if (activeCount >= maxEvents) {
          setErrorMsg(
            `${PLAN_LABELS[userPlan] || 'Paket Anda'} hanya mengizinkan maksimal ${maxEvents} event aktif bersamaan. ` +
            `Nonaktifkan atau hapus event lama terlebih dahulu, atau upgrade ke Paket 3/6 Bulan untuk event unlimited.`
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
        start_po: t.startPo ? new Date(t.startPo).toISOString() : null,
        end_po: t.endPo ? new Date(t.endPo).toISOString() : null,
      }));

      const newEvt = await createEventWithTiers(eventPayload, formattedTiers);
      setSuccessMsg(`EVENT '${formData.name.toUpperCase()}' BERHASIL DIPUBLIKASIKAN!`);
      if (onEventCreated) onEventCreated(newEvt);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan event.');
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

      {errorMsg && <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-2.5 rounded border border-brand-red/40">{errorMsg}</p>}
      {successMsg && <p className="text-xs text-brand-green font-bold uppercase bg-green-950/40 p-2.5 rounded border border-brand-green/40">{successMsg}</p>}

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
              <input type="text" required placeholder="BANK (BCA)" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-purple font-bold" />
              <input type="text" required inputMode="numeric" placeholder="NO REK" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value.replace(/[^0-9]/g, '') })} className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-purple font-mono font-bold" />
              <input type="text" required placeholder="ATAS NAMA" value={formData.accountHolder} onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })} className="px-2.5 py-1.5 bg-neutral-950 border border-neutral-800 rounded text-xs text-white focus:border-brand-purple font-bold" />
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
        <div className="space-y-4">
          <div className="p-3.5 bg-neutral-900 rounded border border-neutral-800 space-y-3">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-black uppercase text-brand-blue tracking-wider">3. TIER KATEGORI TIKET</h4>
              <div className="flex gap-1.5">
                <button type="button" onClick={() => handleAddTier('Presale 2', 45000)} className="px-2 py-0.5 bg-neutral-950 text-brand-green border border-brand-green/30 text-[10px] font-bold rounded">+ Presale</button>
                <button type="button" onClick={() => handleAddTier('VIP Pass', 75000)} className="px-2 py-0.5 bg-neutral-950 text-brand-purple border border-brand-purple/30 text-[10px] font-bold rounded">+ VIP</button>
              </div>
            </div>

            <div className="space-y-2.5 max-h-72 overflow-y-auto no-scrollbar pr-1">
              {tiers.map((t, idx) => (
                <div key={idx} className="p-2.5 bg-neutral-950 rounded border border-neutral-800 space-y-2 relative">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black uppercase text-neutral-400">TIER #{idx + 1}</span>
                    {tiers.length > 1 && <button type="button" onClick={() => handleRemoveTier(idx)} className="text-brand-red text-xs"><Trash2 className="w-3.5 h-3.5" /></button>}
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <input type="text" required placeholder="Nama Tiket" value={t.name} onChange={(e) => handleTierChange(idx, 'name', e.target.value)} className="col-span-3 sm:col-span-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-bold" />
                    <div className="flex gap-2">
  <input type="text" inputMode="numeric" required placeholder="Harga PO (Rp)" value={t.price} onChange={(e) => handleTierChange(idx, 'price', e.target.value.replace(/[^0-9]/g, ''))} className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-mono font-bold" />
  <input type="text" inputMode="numeric" placeholder="Harga OTS (Rp)" value={t.priceOts || ''} onChange={(e) => handleTierChange(idx, 'priceOts', e.target.value.replace(/[^0-9]/g, ''))} className="flex-1 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-mono" />
</div>
                  </div>
                  <div>
                    <input type="text" inputMode="numeric" placeholder="Kuota (Unlimited)" value={t.quota} onChange={(e) => handleTierChange(idx, 'quota', e.target.value.replace(/[^0-9]/g, ''))} className="w-1/2 px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-xs text-white font-mono" />
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px]">
                    <div>
                      <span className="text-neutral-500 block">START PO:</span>
                      <input type="datetime-local" value={t.startPo || ''} onChange={(e) => handleTierChange(idx, 'startPo', e.target.value)} className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-white" />
                    </div>
                    <div>
                      <span className="text-neutral-500 block">END PO:</span>
                      <input type="datetime-local" value={t.endPo || ''} onChange={(e) => handleTierChange(idx, 'endPo', e.target.value)} className="w-full px-2 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-white" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" variant="green" size="lg" fullWidth disabled={submitting} className="font-black uppercase text-xs py-3">
            {submitting ? 'MEMPROSES...' : 'PUBLIKASIKAN EVENT SEKARANG'}
          </Button>
        </div>
      </form>
    </Card>
  );
};
