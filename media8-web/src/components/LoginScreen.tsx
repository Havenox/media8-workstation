import React, { useState } from 'react';
import { Mail, Lock, Eye, EyeOff, Loader2, ArrowRight } from 'lucide-react';
import { AuthService } from '../services/api';
import { BrandLogo } from './BrandLogo';
import type { AuthResponse } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: AuthResponse) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
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
        setError('Verifique suas credenciais e tente novamente.');
      } else {
        setError('Erro ao se conectar com o servidor da API. Tente novamente em instantes.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex w-full">
      {/* Left Side - Brand/Visual (Vinho Profundo #400404) */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-3/5 bg-gradient-to-br from-[#400404] via-[#5C1212] to-[#7B0A0A] relative overflow-hidden">
        {/* Decorative ambient light */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute top-20 left-20 w-64 h-64 bg-white rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-white rounded-full blur-3xl" />
        </div>

        {/* Content Container */}
        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 text-[#FFFBED] w-full">
          {/* Logo & Subtitle */}
          <div>
            <BrandLogo variant="cream" size="lg" />
            <p className="mt-2 text-[#FFFBED]/80 text-lg font-medium">
              Gestão de Edição de Vídeos
            </p>
          </div>

          {/* Main Headline */}
          <div className="max-w-md">
            <h2 className="text-3xl xl:text-4xl font-semibold leading-tight text-[#FFFBED]">
              Transforme suas ideias em vídeos extraordinários
            </h2>
            <p className="mt-4 text-[#FFFBED]/70 text-lg">
              Gerencie seus projetos de edição de vídeo com elegância e eficiência.
            </p>
          </div>

          {/* Footer */}
          <div className="text-[#FFFBED]/50 text-sm">
            &copy; {new Date().getFullYear()} Media 8. Todos os direitos reservados.
          </div>
        </div>
      </div>

      {/* Right Side - Login Form (Creme Suave #FFFBED) */}
      <div className="w-full lg:w-1/2 xl:w-2/5 flex items-center justify-center p-8 lg:p-12 bg-[#FFFBED]">
        <div className="w-full max-w-md text-[#400404]">
          {/* Mobile Logo */}
          <div className="lg:hidden mb-8 text-center">
            <BrandLogo variant="wine" size="md" />
            <p className="mt-1 text-sm text-[#5C1212]/70 font-medium">
              Gestão de Edição de Vídeos
            </p>
          </div>

          {/* Form Header */}
          <div className="mb-8">
            <h2 className="text-2xl font-semibold text-[#400404]">
              Entrar na sua conta
            </h2>
            <p className="mt-2 text-sm text-[#5C1212]/70">
              Bem-vindo de volta! Por favor, insira suas credenciais.
            </p>
          </div>

          {/* Error Banner */}
          {error && (
            <div className="mb-6 p-3.5 bg-red-100 border border-red-300 rounded-lg text-xs text-red-900 font-medium">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-[#400404]">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5C1212]/50" />
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@media8.com"
                  disabled={loading}
                  className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-[#400404]/20 bg-white text-[#400404] text-sm placeholder-[#400404]/30 focus:outline-none focus:ring-2 focus:ring-[#400404]/40 transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label htmlFor="password" className="block text-sm font-medium text-[#400404]">
                Senha
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#5C1212]/50" />
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  disabled={loading}
                  className="w-full pl-12 pr-12 py-2.5 rounded-lg border border-[#400404]/20 bg-white text-[#400404] text-sm placeholder-[#400404]/30 focus:outline-none focus:ring-2 focus:ring-[#400404]/40 transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#5C1212]/50 hover:text-[#400404] transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Forgot Password Link */}
            <div className="flex justify-end">
              <button
                type="button"
                className="text-sm font-medium text-[#400404] hover:underline transition-colors cursor-pointer"
              >
                Esqueceu sua senha?
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#400404] hover:bg-[#5C1212] text-[#FFFBED] font-semibold text-sm py-3 px-4 rounded-lg shadow-md transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin text-[#FFFBED]" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <span>Entrar</span>
                  <ArrowRight className="h-5 w-5" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
