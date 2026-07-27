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

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    const result = login(username, password);
    if (result.success) {
      navigate(result.redirectTo);
    } else {
      setErrorMsg(result.message);
    }
  };

  const handleDirectLoginEO = () => {
    const result = login('eo_lokal', 'password123');
    if (result.success) {
      navigate(result.redirectTo);
    }
  };

  const handleDirectLoginAdmin = () => {
    const result = login('BroFerADM', 'FerADM');
    if (result.success) {
      navigate(result.redirectTo);
    }
  };

  return (
    <div className="max-w-md mx-auto px-4 py-12 text-left">
      <Card variant="dark" className="p-8 space-y-6 border-neutral-800 shadow-2xl">
        <div className="space-y-2 text-center">
          <Badge variant="purple">PORTAL LOGIN LOKTIK</Badge>
          <h1 className="text-2xl font-black uppercase text-white tracking-tight">MASUK KE PORTAL</h1>
          <p className="text-xs text-neutral-400 font-medium">Masuk sebagai Admin Platform Owner atau Panitia / EO.</p>
        </div>

        {/* 1-TAP INSTANT LOGIN BUTTONS FOR MOBILE */}
        <div className="p-4 bg-neutral-900 border border-neutral-800 rounded-lg space-y-3">
          <p className="text-[11px] font-black text-brand-green uppercase tracking-wider flex items-center space-x-1">
            <Zap className="w-3.5 h-3.5" />
            <span>1-TAP INSTANT LOGIN HP:</span>
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleDirectLoginEO}
              className="p-3 bg-brand-purple/20 border border-brand-purple text-white rounded-md text-xs font-black uppercase hover:bg-brand-purple transition-all text-center space-y-1 shadow-[0_0_10px_rgba(139,92,246,0.2)]"
            >
              <div>🎪 LOGIN EO</div>
              <div className="text-[9px] font-mono font-normal opacity-80 text-brand-yellow">eo_lokal / password123</div>
            </button>

            <button
              type="button"
              onClick={handleDirectLoginAdmin}
              className="p-3 bg-brand-green/20 border border-brand-green text-white rounded-md text-xs font-black uppercase hover:bg-brand-green hover:text-black transition-all text-center space-y-1 shadow-[0_0_10px_rgba(57,255,20,0.2)]"
            >
              <div>👑 LOGIN ADMIN</div>
              <div className="text-[9px] font-mono font-normal opacity-80 text-brand-yellow">BroFerADM / FerADM</div>
            </button>
          </div>
        </div>

        <form onSubmit={handleLoginSubmit} className="space-y-4 pt-2 border-t border-neutral-800">
          <Input
            label="USERNAME / NAMA EO"
            required
            placeholder="Contoh: eo_lokal atau abin"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <Input
            label="PASSWORD"
            type="password"
            required
            placeholder="Masukkan password Anda..."
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          {errorMsg && (
            <p className="text-xs text-brand-red font-bold uppercase bg-red-950/40 p-2.5 rounded-md border border-brand-red/40">
              ⚠️ {errorMsg}
            </p>
          )}

          <Button type="submit" variant="green" fullWidth size="lg">
            MASUK DASHBOARD
          </Button>
        </form>
      </Card>
    </div>
  );
};
