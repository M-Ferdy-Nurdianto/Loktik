import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, UserCheck, KeyRound, Zap } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';

export const EOLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [loginMode, setLoginMode] = useState('credentials'); // 'credentials' | 'pin'
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [staffPin, setStaffPin] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoggingIn(true);
    let result;
    if (loginMode === 'pin') {
      if (!staffPin || staffPin.length < 4) {
        setIsLoggingIn(false);
        setErrorMsg('Masukkan 4-digit Kode PIN Staf!');
        return;
      }
      result = await login(staffPin, staffPin);
    } else {
      result = await login(username, password);
    }
    setIsLoggingIn(false);
    if (result.success) {
      navigate(result.redirectTo);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleDirectLoginEO = async () => {
    setIsLoggingIn(true);
    const result = await login('eo_lokal', 'password123');
    setIsLoggingIn(false);
    if (result.success) navigate(result.redirectTo);
  };

  const handleDirectLoginAdmin = async () => {
    setIsLoggingIn(true);
    const result = await login('BroFerADM', 'FerADM');
    setIsLoggingIn(false);
    if (result.success) navigate(result.redirectTo);
  };

  const handleDirectLoginStaff = async () => {
    setIsLoggingIn(true);
    const result = await login('staf_gate1', '1234');
    setIsLoggingIn(false);
    if (result.success) navigate(result.redirectTo);
  };

  return (
    <div className="max-w-md mx-auto px-4 py-10 text-left">
      <Card variant="dark" className="p-6 space-y-5 border-neutral-800 shadow-2xl">
        <div className="space-y-1.5 text-center">
          <Badge variant="blue">UNIFIED LOGIN AKUN LOKTIK</Badge>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">MASUK AKUN</h1>
          <p className="text-xs text-neutral-400 font-medium">Masuk sebagai Admin Platform, Panitia EO, atau Akun Staf Gate.</p>
        </div>

        {/* 1-TAP INSTANT LOGIN BUTTONS FOR MOBILE */}
        <div className="p-3 bg-neutral-900 border border-neutral-800 rounded-lg space-y-2">
          <p className="text-[10px] font-black text-brand-blue uppercase tracking-wider flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5" />
            <span>1-TAP INSTANT LOGIN HP:</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleDirectLoginEO}
              className="p-2 bg-brand-blue/20 border border-brand-blue text-white rounded text-[10px] font-black uppercase hover:bg-brand-blue hover:text-black transition-all text-center space-y-0.5"
            >
              <div>LOGIN EO</div>
              <div className="text-[8px] font-mono font-normal opacity-80 text-brand-yellow truncate">eo_lokal / pass</div>
            </button>

            <button
              type="button"
              onClick={handleDirectLoginAdmin}
              className="p-2 bg-brand-blue/20 border border-brand-blue text-white rounded text-[10px] font-black uppercase hover:bg-brand-blue hover:text-black transition-all text-center space-y-0.5"
            >
              <div>LOGIN ADMIN</div>
              <div className="text-[8px] font-mono font-normal opacity-80 text-brand-yellow truncate">BroFerADM</div>
            </button>

            <button
              type="button"
              onClick={handleDirectLoginStaff}
              className="p-2 bg-brand-purple/20 border border-brand-purple text-white rounded text-[10px] font-black uppercase hover:bg-brand-purple hover:text-white transition-all text-center space-y-0.5"
            >
              <div>STAF GATE</div>
              <div className="text-[8px] font-mono font-normal opacity-80 text-brand-purple truncate">staf_gate1 / 1234</div>
            </button>
          </div>
        </div>

        {/* LOGIN MODE TAB SELECTOR */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-neutral-900 rounded border border-neutral-800">
          <button
            type="button"
            onClick={() => { setLoginMode('credentials'); setErrorMsg(''); }}
            className={`py-2 px-3 rounded text-xs font-black uppercase transition-all ${
              loginMode === 'credentials' ? 'bg-brand-blue text-black shadow' : 'text-neutral-400 hover:text-white'
            }`}
          >
            USERNAME &amp; PASS
          </button>
          <button
            type="button"
            onClick={() => { setLoginMode('pin'); setErrorMsg(''); }}
            className={`py-2 px-3 rounded text-xs font-black uppercase transition-all ${
              loginMode === 'pin' ? 'bg-brand-purple text-white shadow-[0_0_15px_rgba(139,92,246,0.3)]' : 'text-neutral-400 hover:text-white'
            }`}
          >
            PIN 4-DIGIT STAF
          </button>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-1">
          {loginMode === 'credentials' ? (
            <>
              <Input
                label="USERNAME / NAMA EO"
                required
                placeholder="Masukkan Username / Nama EO..."
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
              <Input
                label="PASSWORD"
                type="password"
                required
                placeholder="Masukkan Password..."
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </>
          ) : (
            <div className="space-y-2">
              <label className="text-[11px] font-black uppercase text-brand-purple block text-center">
                MASUKKAN KODE PIN 4-DIGIT STAF:
              </label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={4}
                autoFocus
                value={staffPin}
                onChange={(e) => setStaffPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                placeholder="1 3 1 2"
                className="w-full text-center text-2xl font-mono font-black py-3 px-4 bg-neutral-950 border-2 border-brand-purple text-brand-purple rounded-lg outline-none tracking-[0.4em] placeholder:text-neutral-700 focus:shadow-[0_0_15px_rgba(139,92,246,0.4)] transition-all"
              />
              <p className="text-[10px] text-neutral-400 text-center font-mono">
                Pin 4-digit diberikan oleh Panitia EO saat membuat akun staf.
              </p>
            </div>
          )}

          {errorMsg && (
            <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-2.5 rounded-md border border-brand-red/40 text-center">
              {errorMsg}
            </p>
          )}

          <Button
            type="submit"
            variant={loginMode === 'pin' ? 'purple' : 'blue'}
            fullWidth
            size="lg"
            disabled={isLoggingIn}
            className="font-black text-xs py-3 uppercase"
          >
            {isLoggingIn ? 'MEMPROSES...' : loginMode === 'pin' ? 'MASUK DENGAN PIN STAF' : 'MASUK DASHBOARD'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
