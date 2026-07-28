import React, { useState } from 'react';
import { Film, Lock, Mail, AlertCircle, Loader2, ShieldCheck } from 'lucide-react';
import { AuthService } from '../services/api';
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
    if (!email.trim() || !password) {
      setError('Por favor, informe seu e-mail e senha.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await AuthService.login({
        Email: email.trim(),
        Password: password,
      });
      onLoginSuccess(response);
    } catch (err: any) {
      if (err.response?.data?.Message) {
        setError(err.response.data.Message);
      } else {
        setError('Falha ao autenticar. Verifique suas credenciais e a conexão com o servidor.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#200101] via-[#400404] to-[#120000] text-[#FFFBED] flex flex-col justify-center items-center p-4">
      {/* Container Principal */}
      <div className="w-full max-w-md bg-[#2D0303]/90 border border-[#7B0A0A] rounded-2xl p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
        {/* Glow de Fundo Elegante */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-[#7B0A0A]/30 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-[#9E0D0D]/20 rounded-full blur-3xl pointer-events-none"></div>

        {/* Branding Header */}
        <div className="flex flex-col items-center mb-8 text-center">
          <div className="w-16 h-16 bg-gradient-to-br from-[#7B0A0A] to-[#400404] border border-[#A81515] rounded-2xl flex items-center justify-center mb-3 shadow-lg transform hover:scale-105 transition-transform">
            <Film className="w-9 h-9 text-[#FFFBED]" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-[#FFFBED]">
            Media 8 <span className="font-light text-[#FFFBED]/70">| Workstation</span>
          </h1>
          <p className="text-xs text-[#FFFBED]/60 mt-1">
            Production Asset Management & MediaOps
          </p>
        </div>

        {/* Banner de Erro */}
        {error && (
          <div className="mb-6 p-3.5 bg-red-950/80 border border-red-800/80 rounded-xl flex items-start space-x-3 text-red-200 text-sm animate-fade-in">
            <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Formulário de Login */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-[#FFFBED]/80 uppercase tracking-wider mb-2">
              E-mail Corporativo
            </label>
            <div className="relative">
              <Mail className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FFFBED]/40" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                placeholder="seu.email@media8.com"
                className="w-full bg-[#180101] border border-[#5C1212] focus:border-[#A81515] focus:ring-1 focus:ring-[#A81515] text-[#FFFBED] placeholder-[#FFFBED]/30 rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#FFFBED]/80 uppercase tracking-wider mb-2">
              Senha de Acesso
            </label>
            <div className="relative">
              <Lock className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#FFFBED]/40" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                placeholder="••••••••••••"
                className="w-full bg-[#180101] border border-[#5C1212] focus:border-[#A81515] focus:ring-1 focus:ring-[#A81515] text-[#FFFBED] placeholder-[#FFFBED]/30 rounded-xl pl-11 pr-4 py-3 text-sm outline-none transition-all disabled:opacity-50"
                required
              />
            </div>
          </div>

          {/* Botão de Entrar (Defensive UI) */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-[#7B0A0A] via-[#9E0D0D] to-[#7B0A0A] hover:from-[#8C0C0C] hover:to-[#8C0C0C] text-[#FFFBED] font-semibold text-sm rounded-xl shadow-lg shadow-black/40 border border-[#B51A1A]/40 flex items-center justify-center space-x-2 transition-all transform active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-[#FFFBED]" />
                <span>Autenticando...</span>
              </>
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                <span>Entrar no Workstation</span>
              </>
            )}
          </button>
        </form>

        {/* Rodapé Informativo — Proibição Estrita de Cadastro Anônimo */}
        <div className="mt-8 pt-5 border-t border-[#4A0808] text-center">
          <p className="text-xs text-[#FFFBED]/50 leading-relaxed">
            <span className="font-semibold text-[#FFFBED]/70">Acesso Restrito:</span> O cadastramento de novos usuários é realizado exclusivamente por um Administrador do sistema.
          </p>
        </div>
      </div>
    </div>
  );
};
