"use client";

import React, { useState } from 'react';
import { Bot, Lock, User, ArrowRight, Building, Mail, Eye, EyeOff } from 'lucide-react';
import { loginUser, registerUser, User as AuthUser } from '@/lib/auth';

interface LoginProps {
  onLogin: (user: AuthUser) => void;
}

export default function Login({ onLogin }: LoginProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      if (mode === 'register') {
        if (password !== confirmPassword) {
          setError('Le password non coincidono');
          setLoading(false);
          return;
        }
        const result = await registerUser(companyName, email, password);
        if (result.success) {
          // Dopo la registrazione, facciamo il login automatico
          const loginResult = await loginUser(email, password);
          if (loginResult.success && loginResult.user) {
            onLogin(loginResult.user);
          } else {
            setError('Registrazione effettuata, ma il login automatico è fallito. Riprova ad accedere.');
          }
        } else {
          setError(result.message);
        }
      } else {
        const result = await loginUser(email, password);
        if (result.success && result.user) {
          onLogin(result.user);
        } else {
          setError(result.message);
        }
      }
    } catch (err) {
      setError('Si è verificato un errore improvviso');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
      <div className="w-full max-w-md">
        {/* Logo & Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-2xl bg-[#707E3D]/10 border border-[#707E3D]/20 mb-4 shadow-sm">
            <img
              src="/images/logo_ortuso.png"
              alt="Ortuso Logo"
              className="w-20 h-20 object-contain"
            />
          </div>

          <p className="text-slate-500 mt-2 font-medium">B2B Smart Portal - {mode === 'login' ? 'Accesso Riservato' : 'Registrazione Azienda'}</p>
        </div>

        {/* Login/Register Card */}
        <div className="bg-white border border-slate-200 p-8 rounded-3xl shadow-xl shadow-slate-200/50 transition-all duration-300">
          {error && (
            <div className="mb-6 p-3 bg-rose-50 border border-rose-200 text-rose-600 text-sm font-semibold rounded-xl text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 p-3 bg-emerald-50 border border-emerald-200 text-emerald-600 text-sm font-semibold rounded-xl text-center">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {mode === 'register' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Nome Azienda</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Building className="w-5 h-5" />
                  </div>
                  <input
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#707E3D] focus:border-transparent transition-all"
                    placeholder="Ristorante Il Ponte"
                    required
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Email Aziendale</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-5 h-5" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="block w-full pl-10 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#707E3D] focus:border-transparent transition-all"
                  placeholder="admin@azienda.it"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Password</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-5 h-5" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#707E3D] focus:border-transparent transition-all"
                  placeholder="••••••••"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {mode === 'register' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-sm font-semibold text-slate-700 mb-2">Conferma Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-5 h-5" />
                  </div>
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="block w-full pl-10 pr-10 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#707E3D] focus:border-transparent transition-all"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'login' && (
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center text-slate-600 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 bg-white text-[#707E3D] focus:ring-[#707E3D] mr-2 cursor-pointer"
                  />
                  Ricordami
                </label>
                <a href="#" className="text-[#707E3D] hover:text-[#5A6531] font-bold">Password dimenticata?</a>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-[#707E3D] hover:bg-[#5A6531] text-white font-bold py-3.5 rounded-xl shadow-lg shadow-[#707E3D]/20 transition-all active:scale-[0.98] disabled:opacity-70"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              ) : (
                <>
                  {mode === 'login' ? 'Accedi al Portale' : 'Crea Account Aziendale'} <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-slate-100 text-center">
            <button
              onClick={() => {
                setMode(mode === 'login' ? 'register' : 'login');
                setError('');
                setSuccess('');
              }}
              className="text-sm font-medium text-slate-500 hover:text-[#707E3D] transition-colors"
            >
              {mode === 'login' ? (
                <>Non hai un account? <span className="font-bold text-[#707E3D]">Registrati ora</span></>
              ) : (
                <>Hai già un account? <span className="font-bold text-[#707E3D]">Accedi</span></>
              )}
            </button>
          </div>
        </div>

        {/* Footer Info */}
        <p className="text-center text-slate-400 text-xs mt-8 font-medium">
          © 2026 AgriOrder AI by Ortuso. Tutti i diritti riservati.<br />
          Sistema di gestione B2B intelligente.
        </p>
      </div>
    </div>
  );
}
