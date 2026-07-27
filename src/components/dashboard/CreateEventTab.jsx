import React, { useState } from 'react';
import { Plus, Trash2, Landmark, CheckCircle2, QrCode, Image as ImageIcon, Calendar } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../ui/Card';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Badge } from '../ui/Badge';
import { compressImageToWebP } from '../../utils/imageCompress';
import { uploadEventPoster, uploadQrisCode, createEventWithTiers } from '../../services/apiEvents';

export const CreateEventTab = ({ onEventCreated }) => {
  const { user } = useAuth();
  const eoUsername = user?.username || user?.name || 'eo_lokal';

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    eventDate: '',
    openGate: '',
    bankName: 'BCA',
    accountNumber: '',
    accountHolder: '',
  });

  const [posterFile, setPosterFile] = useState(null);
  const [posterPreview, setPosterPreview] = useState(null);
  const [qrisFile, setQrisFile] = useState(null);
  const [qrisPreview, setQrisPreview] = useState(null);

  const [tiers, setTiers] = useState([
    { name: 'Tiket Pre-sale 1', price: 35000, quota: 100, startPo: '', endPo: '', description: '' },
  ]);

  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);

  const handlePosterChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPosterFile(file);
      setPosterPreview(URL.createObjectURL(file));
    }
  };

  const handleQrisChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setQrisFile(file);
      setQrisPreview(URL.createObjectURL(file));
    }
  };

  const handleAddCustomTier = (presetName = 'Tiket VIP Pass', defaultPrice = 75000) => {
    setTiers([
      ...tiers,
      { name: presetName, price: defaultPrice, quota: '', startPo: '', endPo: '', description: '' },
    ]);
  };

  const handleRemoveTier = (idx) => {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const handleTierChange = (idx, field, value) => {
    const updated = [...tiers];
    updated[idx][field] = value;
    setTiers(updated);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.eventDate) {
      setErrorMsg('Nama Event dan Tanggal Acara wajib diisi.');
      return;
    }
    if (!posterFile) {
      setErrorMsg('Silakan pilih foto file poster event.');
      return;
    }

    try {
      setSubmitting(true);
      setErrorMsg(null);

      // 1. Compress & Upload Poster Image
      const compressedPoster = await compressImageToWebP(posterFile, 1000, 0.75);
      const uploadedPosterUrl = await uploadEventPoster(compressedPoster);

      // 2. Compress & Upload QRIS Image if provided
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
        description: formData.description,
        poster_url: uploadedPosterUrl,
        event_date: new Date(formData.eventDate).toISOString(),
        open_gate: new Date(formData.openGate || formData.eventDate).toISOString(),
        payment_details: {
          bank: formData.bankName,
          number: formData.accountNumber,
          holder: formData.accountHolder,
          qris_url: uploadedQrisUrl,
        },
        status: 'active',
      };

      const formattedTiers = tiers.map((t) => ({
        ...t,
        start_po: t.startPo ? new Date(t.startPo).toISOString() : null,
        end_po: t.endPo ? new Date(t.endPo).toISOString() : null,
      }));

      const newEvt = await createEventWithTiers(eventPayload, formattedTiers);

      setSuccessMsg(`EVENT '${formData.name.toUpperCase()}' BERHASIL DIPUBLIKASIKAN OLEH AKUN ${eoUsername}!`);
      if (onEventCreated) onEventCreated(newEvt);

      setFormData({
        name: '',
        slug: '',
        description: '',
        eventDate: '',
        openGate: '',
        bankName: 'BCA',
        accountNumber: '',
        accountHolder: '',
      });
      setPosterFile(null);
      setPosterPreview(null);
      setQrisFile(null);
      setQrisPreview(null);
    } catch (err) {
      setErrorMsg(err.message || 'Gagal menyimpan event. Coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card variant="dark" className="p-6 space-y-6 text-left border-neutral-800">
      <div className="border-b border-neutral-800 pb-3 flex justify-between items-center">
        <div>
          <h3 className="text-lg font-black uppercase text-white">BUAT &amp; PUBLIKASIKAN EVENT BARU (AKUN: {eoUsername})</h3>
          <p className="text-xs text-neutral-400">Isi rincian acara, poster &amp; QRIS panitia, serta jadwal Periode Jual (Start/End PO).</p>
        </div>
        <Badge variant="green">0% FEES</Badge>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="space-y-4">
          <h4 className="text-xs font-black uppercase text-brand-green tracking-widest">1. INFORMASI ACARA &amp; UNGGAH POSTER</h4>
          
          <Input
            label="NAMA EVENT *"
            required
            placeholder="Contoh: Festival Musik Lokal Bandung 2026"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          />

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase text-neutral-300">UNGGAH FILE POSTER EVENT *</label>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePosterChange}
              required
              className="w-full text-xs text-neutral-300 bg-neutral-900 p-2.5 rounded-md border border-neutral-800 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-brand-green file:text-black file:font-black"
            />
            {posterPreview && (
              <div className="flex items-center space-x-3 p-2 bg-neutral-900 border border-neutral-800 rounded-md mt-2">
                <div className="w-20 h-28 bg-black rounded overflow-hidden shrink-0 border border-neutral-700">
                  <img src={posterPreview} alt="Preview Poster" className="w-full h-full object-cover" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-brand-green uppercase flex items-center space-x-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    <span>PREVIEW POSTER READY</span>
                  </p>
                  <p className="text-[11px] text-neutral-400 font-mono">{posterFile?.name}</p>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="TANGGAL & WAKTU ACARA *"
              type="datetime-local"
              required
              value={formData.eventDate}
              onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
            />
            <Input
              label="WAKTU OPEN GATE"
              type="datetime-local"
              value={formData.openGate}
              onChange={(e) => setFormData({ ...formData, openGate: e.target.value })}
            />
          </div>

          <Input
            label="DESKRIPSI LENGKAP ACARA"
            placeholder="Jelaskan susunan acara, lokasi venue, bintang tamu, dll..."
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
        </div>

        <div className="space-y-4 pt-2 border-t border-neutral-800">
          <h4 className="text-xs font-black uppercase text-brand-purple tracking-widest flex items-center space-x-1">
            <Landmark className="w-4 h-4" />
            <span>2. METODE PEMBAYARAN PANITIA (TRANSFER BANK &amp; SCAN QRIS)</span>
          </h4>

          <div className="p-4 bg-neutral-900/80 rounded-md border border-neutral-800 space-y-3">
            <span className="text-[11px] font-black uppercase text-brand-green tracking-wider">OPSI A: REKENING TRANSFER BANK PANITIA</span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="NAMA BANK *"
                required
                placeholder="Contoh: BCA / Mandiri / BRI / Jago"
                value={formData.bankName}
                onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              />
              <Input
                label="NO. REKENING BANK *"
                required
                placeholder="Contoh: 8820192831"
                value={formData.accountNumber}
                onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
              />
              <Input
                label="ATAS NAMA (HOLDER) *"
                required
                placeholder="Contoh: Panitia Event"
                value={formData.accountHolder}
                onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
              />
            </div>
          </div>

          <div className="p-4 bg-neutral-900/80 rounded-md border border-neutral-800 space-y-3">
            <div className="flex items-center space-x-2">
              <QrCode className="w-4 h-4 text-brand-purple" />
              <span className="text-[11px] font-black uppercase text-brand-purple tracking-wider">OPSI B: UNGGAH BARCODE QRIS PANITIA (OPSIONAL)</span>
            </div>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleQrisChange}
              className="w-full text-xs text-neutral-300 bg-neutral-950 p-2.5 rounded-md border border-neutral-800 file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:bg-brand-purple file:text-white file:font-black"
            />
            {qrisPreview && (
              <div className="flex items-center space-x-3 p-2.5 bg-neutral-950 border border-neutral-800 rounded-md mt-2">
                <div className="w-24 h-24 bg-white p-1 rounded overflow-hidden shrink-0 border border-neutral-700">
                  <img src={qrisPreview} alt="Preview QRIS" className="w-full h-full object-contain" />
                </div>
                <div className="text-xs space-y-1">
                  <p className="font-bold text-brand-purple uppercase flex items-center space-x-1">
                    <QrCode className="w-3.5 h-3.5" />
                    <span>PREVIEW QRIS PANITIA READY</span>
                  </p>
                  <p className="text-[11px] text-neutral-400 font-mono">{qrisFile?.name}</p>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 pt-2 border-t border-neutral-800">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
            <div>
              <h4 className="text-xs font-black uppercase text-brand-blue tracking-widest">3. ATUR TIER TIKET &amp; JADWAL PERIODE JUAL (START/END PO)</h4>
              <p className="text-[11px] text-neutral-400 font-medium">Tentukan waktu buka &amp; batas penutupan penjualan per kategori tiket.</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => handleAddCustomTier('Tiket Pre-sale 2', 45000)}
                className="px-2.5 py-1 bg-neutral-900 text-brand-green border border-brand-green/30 text-[10px] font-black rounded hover:bg-brand-green hover:text-black"
              >
                + Presale Tier
              </button>
              <button
                type="button"
                onClick={() => handleAddCustomTier('Tiket VIP Pass', 75000)}
                className="px-2.5 py-1 bg-neutral-900 text-brand-purple border border-brand-purple/30 text-[10px] font-black rounded hover:bg-brand-purple hover:text-white"
              >
                + VIP Tier
              </button>
            </div>
          </div>

          <div className="space-y-4">
            {tiers.map((t, idx) => (
              <div key={idx} className="p-4 bg-neutral-900 rounded-md border border-neutral-800 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold text-neutral-300 uppercase">TIER TIKET #{idx + 1}</span>
                  {tiers.length > 1 && (
                    <button type="button" onClick={() => handleRemoveTier(idx)} className="text-brand-red hover:underline text-xs">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="NAMA KATEGORI TIKET *"
                    required
                    value={t.name}
                    onChange={(e) => handleTierChange(idx, 'name', e.target.value)}
                  />
                  <Input
                    label="HARGA TIKET (RP) *"
                    type="number"
                    required
                    value={t.price}
                    onChange={(e) => handleTierChange(idx, 'price', e.target.value)}
                  />
                  <Input
                    label="KUOTA TIKET (OPSIONAL)"
                    type="number"
                    placeholder="Kosongkan jika Unlimited"
                    helpText="*Kosongkan jika kuota tidak terbatas"
                    value={t.quota}
                    onChange={(e) => handleTierChange(idx, 'quota', e.target.value)}
                  />
                </div>

                <div className="p-3 bg-neutral-950 rounded border border-neutral-800 space-y-2">
                  <span className="text-[10px] font-black uppercase text-brand-yellow tracking-wider flex items-center space-x-1">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>JADWAL PERIODE JUAL TIKET (START PO &amp; BATAS PO)</span>
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="WAKTU MULAI JUAL (START PO / PRESALE)"
                      type="datetime-local"
                      value={t.startPo || ''}
                      onChange={(e) => handleTierChange(idx, 'startPo', e.target.value)}
                    />
                    <Input
                      label="BATAS AKHIR JUAL (END PO / CLOSING)"
                      type="datetime-local"
                      value={t.endPo || ''}
                      onChange={(e) => handleTierChange(idx, 'endPo', e.target.value)}
                    />
                  </div>
                </div>

                <Input
                  label="DESKRIPSI / FASILITAS TIKET (OPSIONAL)"
                  placeholder="Contoh: Akses masuk 1 hari festival + tempat duduk depan..."
                  value={t.description || ''}
                  onChange={(e) => handleTierChange(idx, 'description', e.target.value)}
                />
              </div>
            ))}
          </div>
        </div>

        {errorMsg && (
          <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-2.5 rounded-md border border-brand-red/40">
            ⚠️ {errorMsg}
          </p>
        )}

        {successMsg && (
          <div className="p-3 bg-brand-green/20 text-brand-green border border-brand-green/40 rounded-md text-xs font-bold uppercase flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMsg}</span>
          </div>
        )}

        <Button type="submit" variant="green" size="lg" fullWidth disabled={submitting}>
          {submitting ? 'MEMPROSES & MENGUNGGAH ACARA...' : 'SIMPAN & PUBLIKASIKAN EVENT'}
        </Button>
      </form>
    </Card>
  );
};
