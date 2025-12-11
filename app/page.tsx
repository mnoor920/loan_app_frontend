'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) {
      const redirectTo = user?.role === 'superadmin' ? '/admin/dashboard' : '/user/dashboard';
      window.location.href = redirectTo;
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(email, password);
    
    if (result.success) {
      setTimeout(() => {
        window.location.href = result.redirectTo || '/user/dashboard';
      }, 100);
    } else {
      setError(result.error || 'Login failed');
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl bg-white overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Branding */}
          <div className="bg-gray-100 p-6 sm:p-8 md:p-6 lg:p-10 flex flex-col justify-between order-2 md:order-1">
            {/* Logo and Title */}
            <div>
              <div className="flex items-center gap-2.5 mb-4 sm:mb-6">
                <div className="w-8 h-8 sm:w-9 sm:h-9 flex items-center justify-center">
                    <Image 
                        src="/banklogo.png" 
                        alt="Bank Logo" 
                        width={36}
                        height={36}
                        className="object-contain"
                    />
                </div>
                <span className="text-base sm:text-lg font-bold text-gray-900">BrightLend</span>
              </div>

              <h1 className="text-xl sm:text-2xl md:text-2xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 leading-tight">
                Smarter Lending for a Brighter Future
              </h1>
              
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                Access flexible and reliable financial solutions designed to help you achieve your goals. Secure, fast, and transparent.
              </p>
            </div>

            {/* Decorative Image */}
            <div className="mt-6 sm:mt-6 md:mt-8 rounded-xl overflow-hidden aspect-video relative">
                <Image
                    src="/login.jpg"
                    alt="Login Illustration"
                    fill
                    className="object-cover"
                />
            </div>
          </div>

          {/* Right Side - Login Form */}
          <div className="p-6 sm:p-8 md:p-6 lg:p-10 flex flex-col justify-center order-1 md:order-2">
            <div className="w-full max-w-md mx-auto">
              <h2 className="text-xl sm:text-2xl md:text-2xl lg:text-3xl font-bold text-gray-900 mb-1 sm:mb-1.5">
                Welcome Back
              </h2>
              <p className="text-gray-600 text-xs sm:text-sm mb-4 sm:mb-6">
                Please enter your details to sign in.
              </p>

              <form onSubmit={handleSubmit} className="space-y-3 sm:space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                    {error}
                  </div>
                )}
                
                {/* Email Input */}
                <div>
                  <label 
                    htmlFor="email" 
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5"
                  >
                    Email or Phone Number
                  </label>
                  <input
                    id="email"
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email or phone number"
                    className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all text-gray-900 placeholder-gray-400"
                    required
                  />
                </div>

                {/* Password Input */}
                <div>
                  <label 
                    htmlFor="password" 
                    className="block text-xs sm:text-sm font-medium text-gray-700 mb-1 sm:mb-1.5"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Enter your password"
                      className="w-full px-3 py-2 sm:py-2.5 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-10 text-gray-900 placeholder-gray-400"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 transition-colors"
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

                {/* Forgot Password */}
                <div className="text-right">
                  <a 
                    href="#" 
                    className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
                  >
                    Forgot Password?
                  </a>
                </div>

                {/* Sign In Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 text-white py-2 sm:py-2.5 text-xs sm:text-sm rounded-lg font-semibold hover:bg-blue-700 transition-colors shadow-lg shadow-blue-600/30 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Signing In...' : 'Sign In'}
                </button>

                {/* Sign Up Link */}
                <p className="text-center text-xs text-gray-600">
                  Don't have an account?{' '}
                  <a 
                    href="/signup" 
                    className="text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                  >
                    Sign Up
                  </a>
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
