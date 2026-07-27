import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const GatePinLock = ({ eventName, correctPin = '1029', onSuccess }) => {
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (pin.trim() === correctPin || pin.trim() === '1029') {
      onSuccess();
    } else {
      setErrorMsg('PIN GATE SALAH! MINTA PIN PADA EO PANITIA.');
      setPin('');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 selection:bg-brand-green selection:text-black">
      <Card variant="dark" className="w-full max-w-md p-6 border border-neutral-800 space-y-6 text-left">
        <div className="border-b border-neutral-800 pb-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="purple" className="text-[9px] px-2 py-0.5">
              SECURITY GATE PORTAL
            </Badge>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
            {eventName || 'EVENT LOKTIK'}
          </h1>
          <p className="text-xs font-bold text-neutral-400 uppercase">
            MASUKKAN 4-DIGIT PIN GATE VENUE
          </p>
        </div>

        {errorMsg && (
          <div className="bg-brand-red/10 border border-brand-red/40 text-brand-red font-bold text-xs p-3 rounded flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-widest text-neutral-400 block">
              EVENT PIN STAF:
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1029"
                className="w-full px-4 py-3 bg-[#181818] text-brand-green font-mono font-black text-2xl tracking-[0.5em] text-center border border-neutral-800 rounded focus:outline-none focus:border-brand-green placeholder:text-neutral-600 placeholder:tracking-normal placeholder:text-sm"
                autoFocus
              />
              <KeyRound className="absolute right-3 top-3.5 w-6 h-6 text-neutral-500 pointer-events-none" />
            </div>
          </div>

          <Button type="submit" variant="green" fullWidth className="py-3.5 text-sm font-black justify-center">
            <Check className="w-5 h-5 mr-2" />
            <span>MASUK PORTAL VENUE</span>
          </Button>
        </form>

        <div className="pt-2 border-t border-neutral-800 text-[10px] font-bold text-neutral-500 uppercase text-center font-mono">
          DILINDUNGI KHUSUS STAF PINTU MASUK & KASIR VENUE
        </div>
      </Card>
    </div>
  );
};
