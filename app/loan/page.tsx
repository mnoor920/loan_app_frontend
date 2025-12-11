"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Topbar from '@/components/ui/topbar';
import Sidebar from '@/components/ui/sidebar';
import { useAuth } from '@/contexts/AuthContext';
import { 
  LoanApplicationRequest, 
  LoanApplicationResponse,
  LOAN_CONSTANTS 
} from '@/types/loan';
import { 
  calculateLoanPayment, 
  validateLoanAmount, 
  validateLoanDuration,
  formatCurrency 
} from '@/lib/loan-calculations';

export default function LoanPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [loanAmount, setLoanAmount] = useState(25000);
  const [duration, setDuration] = useState(12);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [serviceReady, setServiceReady] = useState(true);

  const loanCalculation = calculateLoanPayment(
    loanAmount, 
    duration, 
    LOAN_CONSTANTS.DEFAULT_INTEREST_RATE
  );

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }

    const checkServiceStatus = async () => {
      try {
        const response = await fetch('/api/loans/apply');
        const data = await response.json();
        setServiceReady(data.serviceReady !== false);
      } catch (error) {
        console.error('Failed to check service status:', error);
        setServiceReady(false);
      }
    };

    if (user) {
      checkServiceStatus();
    }
  }, [user, authLoading, router]);

  const handleLoanAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value);
    setLoanAmount(value);
    if (errors.loanAmount) {
      setErrors({ ...errors, loanAmount: '' });
    }
  };

  const handleDurationChange = (months: number) => {
    setDuration(months);
    if (errors.duration) {
      setErrors({ ...errors, duration: '' });
    }
  };

  const handleTermsChange = (checked: boolean) => {
    setAgreedToTerms(checked);
    if (errors.terms) {
      setErrors({ ...errors, terms: '' });
    }
  };

  const validateForm = (): boolean => {
    const newErrors: {[key: string]: string} = {};
    
    const amountValidation = validateLoanAmount(loanAmount);
    if (!amountValidation.isValid) {
      newErrors.loanAmount = amountValidation.error || 'Invalid loan amount';
    }

    const durationValidation = validateLoanDuration(duration);
    if (!durationValidation.isValid) {
      newErrors.duration = durationValidation.error || 'Invalid loan duration';
    }

    if (!agreedToTerms) {
      newErrors.terms = 'You must agree to the Terms and Conditions';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleApplyNow = async () => {
    if (!validateForm()) {
      return;
    }

    if (!user) {
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const applicationData: LoanApplicationRequest = {
        loanAmount,
        durationMonths: duration,
        agreedToTerms
      };

      const response = await fetch('/api/loans/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(applicationData),
      });

      const result: LoanApplicationResponse = await response.json();

      if (result.success) {
        setSubmitSuccess(true);
        setTimeout(() => {
          router.push('/userdashboard');
        }, 2000);
      } else {
        setErrors({ general: result.message || 'Failed to submit loan application' });
      }
    } catch (error) {
      console.error('Loan application error:', error);
      setErrors({ 
        general: 'Network error. Please check your connection and try again.' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-slate-50 items-center justify-center">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 rounded-full border-4 border-emerald-200"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-600 animate-spin"></div>
          </div>
          <p className="text-slate-600 font-semibold text-lg">Loading your experience...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-slate-50">
      <Sidebar />
      <div className="flex flex-col flex-1 overflow-y-auto lg:pl-64">
        <Topbar />
        {/* Main Content Area */}
        {/* Main Content Area */}
        <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-4 sm:py-8 mt-16">
          {/* Header Section with Gradient */}
          <div className="text-center mb-6 sm:mb-8">
            <div className="inline-block mb-4">
              <span className="bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 text-transparent bg-clip-text text-sm font-bold tracking-wide uppercase">
                Personal Loan Application
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-4 text-slate-900 leading-tight">
              Get Funded in Minutes
            </h1>
            <p className="text-slate-600 text-base sm:text-lg max-w-2xl mx-auto px-2 leading-relaxed">
              Customize your loan with our interactive calculator. See real-time updates and get instant approval.
            </p>
          </div>

          {/* Service Status Warning */}
          {!serviceReady && (
            <div className="bg-amber-50 border-l-4 border-amber-500 rounded-xl p-5 mb-6 max-w-4xl mx-auto shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-2xl">⚠️</div>
                <div className="flex-1">
                  <p className="text-base font-bold text-amber-900">
                    Service Notice
                  </p>
                  <p className="text-sm text-amber-800 mt-1">
                    The loan service may be temporarily unavailable. Applications can still be submitted but may experience processing delays.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Success Message */}
          {submitSuccess && (
            <div className="bg-emerald-50 border-l-4 border-emerald-500 rounded-xl p-5 mb-6 max-w-4xl mx-auto shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-2xl">✅</div>
                <div className="flex-1">
                  <p className="text-base font-bold text-emerald-900">
                    Success! Application Submitted
                  </p>
                  <p className="text-sm text-emerald-800 mt-1">
                    Your loan application is being processed. Redirecting to your dashboard...
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Error Message */}
          {errors.general && (
            <div className="bg-red-50 border-l-4 border-red-500 rounded-xl p-5 mb-6 max-w-4xl mx-auto shadow-sm">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 text-2xl">❌</div>
                <div className="flex-1">
                  <p className="text-base font-bold text-red-900">
                    Application Error
                  </p>
                  <p className="text-sm text-red-800 mt-1">
                    {errors.general}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
            {/* Decorative Header Bar */}
            <div className="h-2 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500"></div>
            
            <div className="p-6 sm:p-8">
              <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
                {/* Left Section - Controls */}
                <div className="flex-1 space-y-10">
                  <div className="group">
                    <label className="text-slate-800 font-bold text-base block mb-2 flex items-center gap-2">
                      <span className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center text-white text-xs shadow-lg shadow-emerald-500/20">💰</span>
                      Loan Amount
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={formatCurrency(loanAmount)}
                        readOnly
                        className={`w-full border-2 rounded-xl px-6 py-4 text-slate-900 text-2xl font-bold focus:outline-none bg-slate-50 transition-all ${
                          errors.loanAmount ? 'border-red-400' : 'border-slate-200 group-hover:border-emerald-400'
                        }`}
                      />
                    </div>
                    <div className="mt-6">
                      <div className="relative">
                        <input 
                          type="range" 
                          min={LOAN_CONSTANTS.MIN_LOAN_AMOUNT} 
                          max={LOAN_CONSTANTS.MAX_LOAN_AMOUNT} 
                          step={1000}
                          value={loanAmount}
                          onChange={handleLoanAmountChange}
                          disabled={isSubmitting}
                          className="w-full h-3 rounded-full appearance-none cursor-pointer disabled:opacity-50 accent-emerald-600"
                          style={{
                            background: `linear-gradient(to right, 
                              rgb(16 185 129) 0%, 
                              rgb(13 148 136) ${((loanAmount - LOAN_CONSTANTS.MIN_LOAN_AMOUNT) / (LOAN_CONSTANTS.MAX_LOAN_AMOUNT - LOAN_CONSTANTS.MIN_LOAN_AMOUNT)) * 100}%, 
                              rgb(226 232 240) ${((loanAmount - LOAN_CONSTANTS.MIN_LOAN_AMOUNT) / (LOAN_CONSTANTS.MAX_LOAN_AMOUNT - LOAN_CONSTANTS.MIN_LOAN_AMOUNT)) * 100}%, 
                              rgb(226 232 240) 100%)`
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-xs sm:text-sm text-slate-500 mt-3 font-medium">
                        <span className="bg-slate-100 px-3 py-1 rounded-full">{formatCurrency(LOAN_CONSTANTS.MIN_LOAN_AMOUNT)}</span>
                        <span className="bg-slate-100 px-3 py-1 rounded-full">{formatCurrency(LOAN_CONSTANTS.MAX_LOAN_AMOUNT)}</span>
                      </div>
                    </div>
                    {errors.loanAmount && (
                      <p className="text-red-600 text-sm mt-3 flex items-center gap-2">
                        <span>⚠️</span> {errors.loanAmount}
                      </p>
                    )}
                  </div>

                  {/* Loan Duration */}
                  <div className="group">
                    <label className="text-slate-800 font-bold text-base block mb-2 flex items-center gap-2">
                      <span className="w-7 h-7 bg-gradient-to-br from-teal-500 to-cyan-600 rounded-lg flex items-center justify-center text-white text-xs shadow-lg shadow-teal-500/20">📅</span>
                      Loan Duration
                    </label>
                    <div className="grid grid-cols-5 gap-3">
                      {LOAN_CONSTANTS.AVAILABLE_DURATIONS.map((months) => (
                        <button
                          key={months}
                          onClick={() => handleDurationChange(months)}
                          disabled={isSubmitting}
                          className={`relative py-4 px-2 rounded-xl border-2 font-bold text-sm sm:text-base transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden ${
                            duration === months
                              ? 'bg-gradient-to-br from-emerald-500 to-teal-600 border-transparent text-white shadow-lg shadow-emerald-500/30 scale-105'
                              : 'bg-white border-slate-200 text-slate-700 hover:border-emerald-400 hover:shadow-md hover:scale-105'
                          } ${errors.duration ? 'border-red-400' : ''}`}
                        >
                          <div className="relative z-10">
                            <div className="text-lg sm:text-xl font-extrabold">{months}</div>
                            <div className="text-[10px] sm:text-xs opacity-90">months</div>
                          </div>
                        </button>
                      ))}
                    </div>
                    {errors.duration && (
                      <p className="text-red-600 text-sm mt-3 flex items-center gap-2">
                        <span>⚠️</span> {errors.duration}
                      </p>
                    )}
                  </div>

                  {/* Terms Checkbox */}
                  <div className="pt-4">
                    <div className="relative bg-slate-50 rounded-xl p-5 border-2 border-slate-200 hover:border-emerald-400 transition-all">
                      <div className="flex items-start gap-4">
                        <input 
                          type="checkbox" 
                          id="terms"
                          checked={agreedToTerms}
                          onChange={(e) => handleTermsChange(e.target.checked)}
                          disabled={isSubmitting}
                          className="w-5 h-5 mt-0.5 accent-emerald-600 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed rounded" 
                        />
                        <label htmlFor="terms" className="text-slate-700 text-sm sm:text-base cursor-pointer flex-1 leading-relaxed">
                          I agree to the{' '}
                          <a href="#" className="text-emerald-600 font-semibold underline hover:text-emerald-700 transition-colors">
                            Terms and Conditions
                          </a>
                          {' '}and acknowledge that I have read the loan agreement
                        </label>
                      </div>
                      {errors.terms && (
                        <p className="text-red-600 text-sm mt-3 ml-9 flex items-center gap-2">
                          <span>⚠️</span> {errors.terms}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Section - Loan Summary */}
                <div className="flex-1">
                  <div className="sticky top-28 bg-white rounded-2xl p-6 sm:p-8 border-2 border-slate-200 shadow-xl">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center text-white text-xl shadow-lg shadow-emerald-500/20">
                        📊
                      </div>
                      <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900">
                        Loan Summary
                      </h2>
                    </div>

                    <div className="space-y-4">
                      <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center shadow-sm border border-slate-200">
                        <span className="text-slate-600 font-medium">Interest Rate</span>
                        <span className="text-2xl font-extrabold text-emerald-600">
                          {loanCalculation.interestRate}%
                        </span>
                      </div>
                      
                      <div className="bg-slate-50 rounded-xl p-4 flex justify-between items-center shadow-sm border border-slate-200">
                        <span className="text-slate-600 font-medium">Interest Amount</span>
                        <span className="text-xl font-bold text-slate-900">
                          {formatCurrency(loanCalculation.totalInterest)}
                        </span>
                      </div>

                      <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                          <div className="w-full border-t-2 border-slate-200"></div>
                        </div>
                        <div className="relative flex justify-center">
                          <span className="bg-white px-4 text-sm text-slate-500 font-medium">
                            Monthly Breakdown
                          </span>
                        </div>
                      </div>

                      <div className="bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-600 rounded-2xl p-6 shadow-2xl shadow-emerald-500/30">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-white/95 font-semibold text-base">
                            Monthly Payment
                          </span>
                        </div>
                        <div className="text-white text-3xl sm:text-4xl font-extrabold mb-1">
                          {formatCurrency(loanCalculation.monthlyPayment)}
                        </div>
                        <div className="text-white/90 text-sm">
                          for {duration} months
                        </div>
                      </div>

                      <div className="bg-slate-50 rounded-xl p-4 shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center">
                          <span className="text-slate-600 font-medium">Total Repayment</span>
                          <span className="text-2xl font-extrabold text-slate-900">
                            {formatCurrency(loanCalculation.totalAmount)}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Apply Button */}
              <div className="mt-8 lg:mt-10">
                <div className="flex justify-center lg:justify-end">
                  <button 
                    onClick={handleApplyNow}
                    disabled={isSubmitting || submitSuccess}
                    className="group relative w-full sm:w-auto bg-gradient-to-r from-emerald-600 via-teal-600 to-cyan-600 hover:from-emerald-700 hover:via-teal-700 hover:to-cyan-700 disabled:from-gray-400 disabled:via-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed text-white px-12 sm:px-16 py-5 rounded-2xl font-bold text-lg sm:text-xl shadow-2xl shadow-emerald-500/40 hover:shadow-emerald-600/50 transition-all duration-300 flex items-center justify-center gap-3 overflow-hidden hover:scale-105 active:scale-95"
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                    {isSubmitting && (
                      <div className="relative w-6 h-6">
                        <div className="absolute inset-0 rounded-full border-3 border-white/30"></div>
                        <div className="absolute inset-0 rounded-full border-3 border-white border-t-transparent animate-spin"></div>
                      </div>
                    )}
                    <span className="relative z-10 flex items-center gap-2">
                      {isSubmitting ? 'Submitting Application...' : submitSuccess ? '✓ Application Submitted!' : (
                        <>
                          Apply for Loan
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                          </svg>
                        </>
                      )}
                    </span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Trust Indicators */}
          <div className="mt-10 flex flex-wrap justify-center gap-8 text-sm">
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
              <span className="text-lg">🔒</span>
              <span className="font-medium text-slate-700">Bank-level Security</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
              <span className="text-lg">⚡</span>
              <span className="font-medium text-slate-700">Instant Approval</span>
            </div>
            <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm px-4 py-2 rounded-full border border-slate-200">
              <span className="text-lg">💯</span>
              <span className="font-medium text-slate-700">No Hidden Fees</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}