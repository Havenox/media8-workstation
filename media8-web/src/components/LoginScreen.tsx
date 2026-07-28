import React, { useState } from 'react';
import { Lock, Mail, ShieldAlert, ArrowRight, Loader2, KeyRound } from 'lucide-react';
import { AuthService } from '../services/api';
import { BrandLogo } from './BrandLogo';
import type { AuthResponse } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthResponse) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Por favor, preencha o e-mail e a senha.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await AuthService.login({
        Email: email.trim(),
        Password: password,
      });

      onLoginSuccess(response);
    } catch (err: any) {
      if (err.response?.status === 401) {
        setError('E-mail ou senha incorretos.');
      } else {
        setError('Erro ao se conectar com a API. Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#140101] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-[#400404]/40 via-[#140101] to-[#0A0000] flex items-center justify-center p-4 selection:bg-wine-vibrant selection:text-cream-soft">
      <div className="w-full max-w-md animate-fade-in">
        {/* Main Glassmorphism Card */}
        <div className="glass-panel rounded-2xl p-8 border border-wine-vibrant/40 shadow-2xl relative overflow-hidden backdrop-blur-xl">
          {/* Subtle Ambient Light Effect */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-wine-vibrant/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-wine-deep/40 rounded-full blur-3xl pointer-events-none" />

          {/* Header & Logo */}
          <div className="flex flex-col items-center text-center mb-8 relative z-10">
            <BrandLogo size="lg" className="mb-4" />
            <p className="text-xs text-cream-soft/70 mt-1 max-w-xs leading-relaxed">
              Acesso exclusivo para profissionais autorizados da rede Media 8
            </p>
          </div>

          {/* Error Feedback Banner */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl text-xs text-red-200 flex items-center gap-3 animate-shake shadow-lg">
              <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
            <div>
              <label className="block text-xs font-semibold text-cream-soft/90 uppercase tracking-wider mb-2">
                E-mail Corporativo
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-cream-soft/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@media8.com"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0C0101] border border-wine-vibrant/40 rounded-xl text-xs text-cream-soft placeholder-cream-soft/30 focus:outline-none focus:border-wine-vibrant focus:ring-2 focus:ring-wine-vibrant/30 transition-all duration-200"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-cream-soft/90 uppercase tracking-wider mb-2">
                Senha de Acesso
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-cream-soft/40 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-10 pr-4 py-2.5 bg-[#0C0101] border border-wine-vibrant/40 rounded-xl text-xs text-cream-soft placeholder-cream-soft/30 focus:outline-none focus:border-wine-vibrant focus:ring-2 focus:ring-wine-vibrant/30 transition-all duration-200"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 bg-gradient-to-r from-wine-deep via-wine-warm to-wine-vibrant hover:from-wine-warm hover:to-wine-vibrant text-cream-soft font-semibold text-xs py-3 px-4 rounded-xl shadow-lg border border-wine-vibrant/50 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed group cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-cream-soft" />
                  <span>Autenticando...</span>
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4 text-cream-soft/80" />
                  <span>Entrar no Workstation</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" />
                </>
              )}
            </button>
          </form>

          {/* Footer Notice (Strict Zero Anonymous Sign-up Rule) */}
          <div className="mt-8 pt-5 border-t border-wine-vibrant/20 text-center relative z-10">
            <p className="text-[11px] text-cream-soft/50 leading-relaxed">
              Não possui credenciais? Solicite o seu cadastro diretamente ao{' '}
              <strong className="text-cream-soft/80 font-semibold">Administrador</strong> do sistema.
            </p>
          </div>
        </div>

        {/* Footer Brand Copyright */}
        <p className="text-center text-[10px] text-cream-soft/40 mt-6 uppercase tracking-widest font-mono">
          Media 8 | Enterprise PAM Platform &copy; 2026
        </p>
      </div>
    </div>
  );
};
