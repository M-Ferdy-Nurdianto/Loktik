import React, { useState } from 'react';
import { UserPlus, QrCode, Ticket, Users, Eye, EyeOff } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CustomSelect } from '../ui/CustomSelect';

export const StaffFormModal = ({ events = [], onSubmit, onCancel }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState(events[0]?.id || 'SEMUA_EVENT');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!username.trim() || !password.trim()) {
      setErrorMsg('Username dan Password wajib diisi!');
      return;
    }
    const assignedEvent = (events && events.length > 0)
      ? (events.find((ev) => ev.id === selectedEventId) || events[0])
      : { id: 'SEMUA_EVENT', name: 'Semua Event', slug: 'all-events' };

    const finalPin = pinCode.trim() || password.replace(/[^0-9]/g, '').slice(0, 4) || '1312';

    onSubmit({
      name: username.trim(),
      username: username.trim(),
      password,
      pinCode: finalPin,
      selectedEventId: assignedEvent.id,
      assignedEvent,
      permissions: { canScan: true, canOts: true, canViewOrders: true },
    });
  };

  const eventOptions = [
    { value: 'SEMUA_EVENT', label: 'SEMUA EVENT ACARA' },
    ...(events || []).map((ev) => ({
      value: ev.id,
      label: `${ev.name.toUpperCase()} (${ev.slug})`,
    })),
  ];

  return (
    <Card variant="dark" className="p-4 border border-brand-green/40 bg-[#121212] space-y-4">
      <h3 className="text-sm font-black uppercase text-brand-green tracking-wider flex items-center gap-2">
        <UserPlus className="w-4 h-4" /> FORM TAMBAH AKUN STAF
      </h3>

      {errorMsg && (
        <div className="p-2 bg-brand-red/10 border border-brand-red text-brand-red font-bold text-xs rounded">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">USERNAME STAF:</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan Username Staf (cth: staf_gate1)..."
              className="w-full px-3 py-2 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:border-brand-green outline-none font-mono font-bold"
              required
            />
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-brand-purple block mb-1">PASSWORD / KODE PIN 4-DIGIT:</label>
            <div className="relative flex items-center">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => {
                  const val = e.target.value;
                  setPassword(val);
                  const pinPart = val.replace(/[^0-9]/g, '').slice(0, 4);
                  setPinCode(pinPart || val.slice(0, 4) || '1312');
                }}
                placeholder="Password atau PIN 4-Digit (cth: 1312)..."
                className="w-full px-3 py-2 pr-9 bg-neutral-900 border border-brand-purple/50 rounded text-xs text-brand-purple focus:border-brand-purple outline-none font-mono font-black"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 text-neutral-400 hover:text-white p-1"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="text-[10px] font-black uppercase text-neutral-400 block mb-1">EVENT DITUGASKAN:</label>
          <CustomSelect
            options={eventOptions}
            value={selectedEventId}
            onChange={(val) => setSelectedEventId(val)}
            accentColor="green"
          />
        </div>

        <div className="flex gap-2 pt-2">
          <Button type="button" variant="outline" onClick={onCancel} className="w-1/3 text-xs uppercase">BATAL</Button>
          <Button type="submit" variant="green" className="w-2/3 text-xs uppercase justify-center font-black">SIMPAN AKUN STAF</Button>
        </div>
      </form>
    </Card>
  );
};
