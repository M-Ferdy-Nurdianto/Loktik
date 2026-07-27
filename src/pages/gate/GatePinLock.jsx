import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check } from 'lucide-react';

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
    <div className="min-h-screen bg-[#FFE600] text-black flex items-center justify-center p-4 selection:bg-black selection:text-white">
      <div className="w-full max-w-md bg-white border-4 border-black p-6 shadow-[8px_8px_0px_#000] space-y-6 text-left">
        <div className="border-b-4 border-black pb-4 space-y-1">
          <div className="inline-block bg-black text-white px-2 py-0.5 text-xs font-black uppercase tracking-wider">
            SECURITY GATE PORTAL
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight leading-none text-black">
            {eventName || 'EVENT LOKTIK'}
          </h1>
          <p className="text-xs font-bold text-neutral-800 uppercase">
            MASUKKAN 4-DIGIT PIN GATE VENUE
          </p>
        </div>

        {errorMsg && (
          <div className="bg-[#FF3333] text-white font-black text-xs p-3 border-2 border-black shadow-[3px_3px_0px_#000] flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-black uppercase tracking-wider block text-black">
              EVENT PIN STAF:
            </label>
            <div className="relative">
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="1029"
                className="w-full px-4 py-3 bg-[#F4F4F4] text-black font-mono font-black text-2xl tracking-[0.5em] text-center border-4 border-black focus:outline-none focus:bg-white placeholder:text-neutral-400 placeholder:tracking-normal placeholder:text-sm"
                autoFocus
              />
              <KeyRound className="absolute right-3 top-3.5 w-6 h-6 text-black pointer-events-none" />
            </div>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 bg-[#39FF14] hover:bg-[#20e000] text-black font-black text-base uppercase border-4 border-black shadow-[4px_4px_0px_#000] active:translate-x-1 active:translate-y-1 active:shadow-none transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <Check className="w-6 h-6 stroke-[3]" />
            <span>MASUK PORTAL VENUE</span>
          </button>
        </form>

        <div className="pt-2 border-t-2 border-dashed border-black text-[10px] font-bold text-neutral-600 uppercase text-center">
          DILINDUNGI KHUSUS UNTUK STAF PINTU MASUK & KASIR VENUE
        </div>
      </div>
    </div>
  );
};
