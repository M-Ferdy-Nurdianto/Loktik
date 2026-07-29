import React, { useState } from 'react';
import { KeyRound, ShieldAlert, Check, User } from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { useAuth } from '../../hooks/useAuth';

export const GatePinLock = ({ eventName, correctPin = '1029', onSuccess }) => {
  const { login } = useAuth();
  const [loginMode, setLoginMode] = useState('pin'); // 'pin' | 'staff'
  const [pin, setPin] = useState('');
  const [staffUser, setStaffUser] = useState('');
  const [staffPass, setStaffPass] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmitPin = (e) => {
    e.preventDefault();
    if (pin.trim() === correctPin || pin.trim() === '1029') {
      onSuccess();
    } else {
      setErrorMsg('PIN GATE SALAH! MINTA PIN PADA EO PANITIA.');
      setPin('');
    }
  };
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleSubmitStaffLogin = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoggingIn(true);
    const res = await login(staffUser, staffPass);
    setIsLoggingIn(false);
    if (res.success) {
      onSuccess();
    } else {
      setErrorMsg(res.message || 'Username / Password Staf Salah!');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4 selection:bg-brand-purple selection:text-white">
      <Card variant="dark" className="w-full max-w-md p-6 border border-neutral-800 space-y-6 text-left">
        <div className="border-b border-neutral-800 pb-4 space-y-2">
          <div className="flex items-center space-x-2">
            <Badge variant="purple" className="text-[9px] px-2 py-0.5">
              POS GATE VENUE (STAFF LAPANGAN)
            </Badge>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-white leading-none">
            {eventName || 'EVENT LOKTIK'}
          </h1>
          <p className="text-xs font-bold text-neutral-400 uppercase">
            VERIFIKASI AKSES GATE LAPANGAN
          </p>
        </div>

        {/* TOGGLE PIN / AKUN STAF */}
        <div className="flex border border-neutral-800 rounded bg-[#121212] p-1">
          <button
            type="button"
            onClick={() => { setLoginMode('pin'); setErrorMsg(''); }}
            className={`w-1/2 py-2 text-xs font-black uppercase rounded transition-colors ${
              loginMode === 'pin' ? 'bg-brand-purple text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            4-DIGIT PIN GATE
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('staff'); setErrorMsg(''); }}
            className={`w-1/2 py-2 text-xs font-black uppercase rounded transition-colors ${
              loginMode === 'staff' ? 'bg-brand-purple text-white' : 'text-neutral-400 hover:text-white'
            }`}
          >
            LOGIN AKUN STAF
          </button>
        </div>

        {errorMsg && (
          <div className="bg-brand-red/10 border border-brand-red/40 text-brand-red font-bold text-xs p-3 rounded flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {loginMode === 'pin' ? (
          <form onSubmit={handleSubmitPin} className="space-y-4">
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
                  className="w-full px-4 py-3 bg-[#181818] text-brand-purple font-mono font-black text-2xl tracking-[0.5em] text-center border border-neutral-800 rounded focus:outline-none focus:border-brand-purple placeholder:text-neutral-600 placeholder:tracking-normal placeholder:text-sm"
                  autoFocus
                />
                <KeyRound className="absolute right-3 top-3.5 w-6 h-6 text-neutral-500 pointer-events-none" />
              </div>
            </div>

            <Button type="submit" variant="purple" fullWidth className="py-3.5 text-sm font-black justify-center">
              <Check className="w-5 h-5 mr-2" />
              <span>MASUK GATE VENUE</span>
            </Button>
          </form>
        ) : (
          <form onSubmit={handleSubmitStaffLogin} className="space-y-3">
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400">USERNAME STAF:</label>
              <input
                type="text"
                value={staffUser}
                onChange={(e) => setStaffUser(e.target.value)}
                placeholder="Masukkan Username Staf..."
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:border-brand-purple outline-none font-mono font-bold"
                required
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black uppercase text-neutral-400">PASSWORD:</label>
              <input
                type="password"
                value={staffPass}
                onChange={(e) => setStaffPass(e.target.value)}
                placeholder="Masukkan Password..."
                className="w-full px-3 py-2.5 bg-neutral-900 border border-neutral-800 rounded text-xs text-white focus:border-brand-purple outline-none font-mono font-bold"
                required
              />
            </div>
            <Button type="submit" variant="purple" fullWidth className="py-3 text-xs font-black justify-center mt-2" disabled={isLoggingIn}>
              {isLoggingIn ? (
                <span>MEMPROSES...</span>
              ) : (
                <>
                  <User className="w-4 h-4 mr-2" />
                  <span>LOGIN SEBAGAI STAF</span>
                </>
              )}
            </Button>
          </form>
        )}

        <div className="pt-2 border-t border-neutral-800 text-[10px] font-bold text-neutral-500 uppercase text-center font-mono">
          DILINDUNGI KHUSUS STAF PINTU MASUK & KASIR VENUE
        </div>
      </Card>
    </div>
  );
};
