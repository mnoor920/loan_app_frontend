'use client';
import Image from "next/image";
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SignUpPage() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [agreeToTerms, setAgreeToTerms] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationErrors, setValidationErrors] = useState<any>({});

  const { signup } = useAuth();
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    let newValue = value;
    let newErrors = { ...validationErrors };

    // For phone number, only allow numbers and limit to 11 digits
    if (name === 'phoneNumber') {
      const numbersOnly = value.replace(/\D/g, '');
      newValue = numbersOnly.slice(0, 11);

      // Real-time validation for phone number
      if (newValue.length > 0) {
        if (!newValue.startsWith('03')) {
          newErrors.phoneNumber = 'Phone number must start with 03';
        } else if (newValue.length < 11) {
          newErrors.phoneNumber = `Phone number must be 11 digits (${newValue.length}/11)`;
        } else if (newValue.length === 11 && validatePhoneNumber(newValue)) {
          delete newErrors.phoneNumber;
        }
      } else {
        delete newErrors.phoneNumber;
      }
    }

    // Real-time validation for password
    if (name === 'password') {
      if (value.length > 0 && !validatePassword(value)) {
        newErrors.password = 'Password must contain uppercase, lowercase, number and special character (min 8 chars)';
      } else if (value.length >= 8 && validatePassword(value)) {
        delete newErrors.password;
      }
    }

    // Real-time validation for email
    if (name === 'email') {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (value.length > 0 && !emailRegex.test(value)) {
        newErrors.email = 'Please enter a valid email address';
      } else if (value.length > 0 && emailRegex.test(value)) {
        delete newErrors.email;
      }
    }

    // Real-time validation for confirm password
    if (name === 'confirmPassword') {
      if (value.length > 0 && value !== formData.password) {
        newErrors.confirmPassword = 'Passwords do not match';
      } else if (value === formData.password && value.length > 0) {
        delete newErrors.confirmPassword;
      }
    }

    setFormData({
      ...formData,
      [name]: newValue,
    });

    setValidationErrors(newErrors);
  };

  const validatePhoneNumber = (phone: string) => {
    const pakistaniPhoneRegex = /^03\d{9}$/;
    return pakistaniPhoneRegex.test(phone);
  };

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;
    return passwordRegex.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setValidationErrors({});

    // Client-side validation
    const errors: any = {};

    if (!validatePhoneNumber(formData.phoneNumber)) {
      errors.phoneNumber = 'Please enter a valid Pakistani phone number (03XXXXXXXXX)';
    }

    if (!validatePassword(formData.password)) {
      errors.password = 'Password must contain at least 8 characters, including uppercase, lowercase, number and special character';
    }

    if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (!agreeToTerms) {
      errors.terms = 'Please agree to the terms and conditions';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      setLoading(false);
      return;
    }

    const result = await signup(formData);

    if (result.success) {
      if (result.requiresEmailVerification) {
        alert('Account created! Please check your email to verify your account before logging in.');
        router.push('/login');
      } else {
        router.push('/userdashboard');
      }
    } else {
      setError(result.error || 'Signup failed');
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 font-sans">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* Left Side - Branding */}
          <div className="bg-gradient-to-br from-emerald-900 via-teal-900 to-slate-900 p-8 md:p-12 flex flex-col justify-center order-2 md:order-1 relative overflow-hidden">
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

              <h1 className="text-3xl md:text-3xl lg:text-4xl font-bold text-white mb-6 leading-tight">
                Join Us Today for <br/>
                <span className="text-emerald-300">Better Financial Solutions.</span>
              </h1>

              <p className="text-emerald-100/80 text-sm leading-relaxed max-w-sm mb-8">
                Create your account and unlock access to flexible lending options tailored to your needs. Quick, secure, and hassle-free registration.
              </p>

              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3 text-emerald-100/70 text-sm">
                   <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <span>Instant Application Review</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100/70 text-sm">
                   <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <span>Secure & Encrypted Data</span>
                </div>
                <div className="flex items-center gap-3 text-emerald-100/70 text-sm">
                   <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                      <svg className="w-4 h-4 text-emerald-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                   </div>
                   <span>24/7 Customer Support</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Side - Sign Up Form */}
          <div className="p-8 md:p-12 flex flex-col justify-center order-1 md:order-2 bg-white">
            <div className="w-full max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                Create Account
              </h2>
              <p className="text-slate-500 text-sm mb-6">
                Fill in your details to get started with BrightLend.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 border border-red-100 text-red-600 px-4 py-3 rounded-lg text-sm flex items-center gap-2">
                     <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div>
                     {error}
                  </div>
                )}

                {/* Name Fields Row */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label
                      htmlFor="firstName"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
                    >
                      First Name
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={handleChange}
                      placeholder="e.g. John"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder-slate-400 bg-white hover:border-slate-300"
                      required
                    />
                  </div>
                  <div className="space-y-1">
                    <label
                      htmlFor="lastName"
                      className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
                    >
                      Last Name
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={handleChange}
                      placeholder="e.g. Doe"
                      className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder-slate-400 bg-white hover:border-slate-300"
                      required
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div className="space-y-1">
                  <label
                    htmlFor="email"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="name@example.com"
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder-slate-400 pr-10 ${validationErrors.email
                          ? 'border-red-300 bg-red-50'
                          : formData.email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {formData.email.length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) && (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {validationErrors.email && (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {validationErrors.email && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.email}</p>
                  )}
                </div>

                {/* Phone Number Input */}
                <div className="space-y-1">
                  <label
                    htmlFor="phoneNumber"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
                  >
                    Phone Number
                  </label>
                  <div className="relative">
                    <input
                      id="phoneNumber"
                      name="phoneNumber"
                      type="tel"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      placeholder="03XXXXXXXXX"
                      maxLength={11}
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-900 placeholder-slate-400 pr-10 ${validationErrors.phoneNumber
                          ? 'border-red-300 bg-red-50'
                          : formData.phoneNumber.length === 11 && validatePhoneNumber(formData.phoneNumber)
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      required
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                      {formData.phoneNumber.length === 11 && validatePhoneNumber(formData.phoneNumber) && (
                        <svg className="w-4 h-4 text-emerald-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                      {validationErrors.phoneNumber && (
                        <svg className="w-4 h-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                    </div>
                  </div>
                  {validationErrors.phoneNumber && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.phoneNumber}</p>
                  )}
                </div>

                {/* Password Input */}
                <div className="space-y-1">
                  <label
                    htmlFor="password"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
                  >
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Create a password"
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all pr-10 text-slate-900 placeholder-slate-400 ${validationErrors.password
                          ? 'border-red-300 bg-red-50'
                          : formData.password.length >= 8 && validatePassword(formData.password)
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
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
                  {validationErrors.password && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.password}</p>
                  )}
                </div>

                {/* Confirm Password Input */}
                <div className="space-y-1">
                  <label
                    htmlFor="confirmPassword"
                    className="block text-xs font-semibold text-slate-700 uppercase tracking-wide"
                  >
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirm your password"
                      className={`w-full px-3 py-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all pr-10 text-slate-900 placeholder-slate-400 ${validationErrors.confirmPassword
                          ? 'border-red-300 bg-red-50'
                          : formData.confirmPassword.length > 0 && formData.confirmPassword === formData.password
                            ? 'border-emerald-300 bg-emerald-50'
                            : 'border-slate-200 bg-white hover:border-slate-300'
                        }`}
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                    >
                      {showConfirmPassword ? (
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
                  {validationErrors.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">{validationErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Terms and Conditions Checkbox */}
                <div className="flex items-start gap-2 pt-2">
                  <input
                    id="terms"
                    type="checkbox"
                    checked={agreeToTerms}
                    onChange={(e) => setAgreeToTerms(e.target.checked)}
                    className="mt-0.5 w-4 h-4 text-emerald-600 border-slate-300 rounded focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <label htmlFor="terms" className="text-xs text-slate-600">
                    I agree to the{' '}
                    <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Terms and Conditions
                    </a>
                    {' '}and{' '}
                    <a href="#" className="text-emerald-600 hover:text-emerald-700 font-medium">
                      Privacy Policy
                    </a>
                  </label>
                </div>
                {validationErrors.terms && (
                  <p className="text-red-500 text-xs">{validationErrors.terms}</p>
                )}

                {/* Sign Up Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-emerald-600 text-white py-3 text-sm rounded-lg font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 active:scale-[0.99] disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? 'Creating Account...' : 'Sign Up'}
                </button>

                {/* Sign In Link */}
                <div className="pt-2 text-center">
                  <p className="text-slate-500 text-sm">
                    Already have an account?{' '}
                    <a
                      href="/login"
                      className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                    >
                      Sign In
                    </a>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}