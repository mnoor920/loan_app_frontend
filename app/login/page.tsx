'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);

    if (result.success) {
      window.location.href = result.redirectTo || '/userdashboard';
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Branding */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-8 md:p-12 flex flex-col justify-between order-2 md:order-1 relative overflow-hidden">
            {/* Background Pattern */}
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            
            {/* Logo and Title */}
            <div className="relative z-10">
              <Link href="/" className="flex items-center gap-3 mb-8 hover:opacity-90 transition-opacity">
                <div className="w-10 h-10 flex items-center justify-center bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 shadow-lg">
                   <span className="text-white font-bold text-xl">B</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xl font-bold tracking-tight text-white leading-none">BrightLend</span>
                  <span className="text-[10px] uppercase tracking-wider text-emerald-200 font-semibold">Financial Group</span>
                </div>
              </Link>

              <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">
                Welcome Back to <br/>
                <span className="text-emerald-300">Smart Lending.</span>
              </h1>
              
              <p className="text-emerald-100/80 text-sm leading-relaxed max-w-sm">
                Securely access your accounts, manage loans, and track your financial progress with our next-generation platform.
              </p>
            </div>

            {/* Decorative/Footer */}
            <div className="relative z-10 mt-12">
               <div className="flex items-center gap-3 text-emerald-200/60 text-xs uppercase tracking-widest">
                  <span>Secure</span>
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                  <span>Encrypted</span>
                  <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                  <span>Trusted</span>
               </div>
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center order-1 md:order-2 bg-white">
            <div className="w-full max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Sign In
              </h2>
              <p className="text-slate-500 text-sm mb-8">
                Enter your credentials to access your portal.
              </p>

              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                    {error}
                  </div>
                )}
                
                {/* Email Input */}
                <div className="space-y-1.5">
                  <label 
                    htmlFor="email" 
                    className="block text-sm font-semibold text-slate-700"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder-slate-400 bg-white hover:border-slate-300"
                    required
                  />
                </div>

                {/* Password Input */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label 
                      htmlFor="password" 
                      className="block text-sm font-semibold text-slate-700"
                    >
                      Password
                    </label>
                    <a 
                      href="#" 
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold transition-colors"
                    >
                      Forgot password?
                    </a>
                  </div>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full px-4 py-3 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all pr-12 text-slate-900 placeholder-slate-400 bg-white hover:border-slate-300"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-3 text-sm rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Authenticating...' : 'Sign In'}
                </button>

                {/* Sign Up Link */}
                <div className="pt-2 text-center">
                  <p className="text-slate-500 text-sm">
                    Don't have an account?{' '}
                    <a 
                      href="/signup" 
                      className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                    >
                      Create Account
                    </a>
                  </p>
                </div>
              </form>
            </div>
            
            <div className="mt-8 text-center">
               <p className="text-xs text-slate-400">© 2024 BrightLend Financial. All rights reserved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}