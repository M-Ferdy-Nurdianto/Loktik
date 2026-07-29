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
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setIsLoggingIn(true);
    const result = await login(username, password);
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
    if (result.success) {
      navigate(result.redirectTo);
    }
  };

  const handleDirectLoginAdmin = async () => {
    setIsLoggingIn(true);
    const result = await login('BroFerADM', 'FerADM');
    setIsLoggingIn(false);
    if (result.success) {
      navigate(result.redirectTo);
    }
  };

  const handleDirectLoginStaff = async () => {
    setIsLoggingIn(true);
    const result = await login('staf_gate1', '1234');
    setIsLoggingIn(false);
    if (result.success) {
      navigate(result.redirectTo);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-left">
      <Card variant="dark" className="p-8 space-y-6 border-neutral-800 shadow-2xl">
        <div className="space-y-2 text-center">
          <Badge variant="blue">UNIFIED LOGIN AKUN LOKTIK</Badge>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">MASUK AKUN</h1>
          <p className="text-xs text-neutral-400 font-medium">Masuk sebagai Admin Platform, Panitia EO, atau Akun Staf Gate.</p>
        </div>

        {/* 1-TAP INSTANT LOGIN BUTTONS FOR MOBILE */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3">
          <p className="text-[11px] font-black text-brand-blue uppercase tracking-wider flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5" />
            <span>1-TAP INSTANT LOGIN HP:</span>
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={handleDirectLoginEO}
              className="p-2.5 bg-brand-blue/20 border border-brand-blue text-white rounded-md text-[11px] font-black uppercase hover:bg-brand-blue hover:text-black transition-all text-center space-y-0.5"
            >
              <div>LOGIN EO</div>
              <div className="text-[8px] font-mono font-normal opacity-80 text-brand-yellow truncate">eo_lokal / password123</div>
            </button>

            <button
              type="button"
              onClick={handleDirectLoginAdmin}
              className="p-2.5 bg-brand-blue/20 border border-brand-blue text-white rounded-md text-[11px] font-black uppercase hover:bg-brand-blue hover:text-black transition-all text-center space-y-0.5"
            >
              <div>LOGIN ADMIN</div>
              <div className="text-[8px] font-mono font-normal opacity-80 text-brand-yellow truncate">BroFerADM / FerADM</div>
            </button>

            <button
              type="button"
              onClick={handleDirectLoginStaff}
              className="p-2.5 bg-brand-purple/20 border border-brand-purple text-white rounded-md text-[11px] font-black uppercase hover:bg-brand-purple hover:text-white transition-all text-center space-y-0.5"
            >
              <div>STAF GATE</div>
              <div className="text-[8px] font-mono font-normal opacity-80 text-brand-purple truncate">staf_gate1 / 1234</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2 border-t border-neutral-800">
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

          {errorMsg && (
            <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-2.5 rounded-md border border-brand-red/40">
              {errorMsg}
            </p>
          )}

          <Button type="submit" variant="blue" fullWidth size="lg" disabled={isLoggingIn}>
            {isLoggingIn ? 'MEMPROSES...' : 'MASUK DASHBOARD'}
          </Button>
        </form>
      </Card>
    </div>
  );
};
