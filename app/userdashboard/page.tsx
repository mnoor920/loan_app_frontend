'use client'
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import DashboardLayout from '../../components/ui/dashboardlayout';
import { Shield, CheckCircle, Lock, PlusCircle, CreditCard, FileUp, TrendingUp, Clock, FileText, Plus, Wallet } from 'lucide-react';
import { ToastProvider } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';

import Step1 from '../../components/activation/step1';
import Step2 from '../../components/activation/step2';
import Step3 from '../../components/activation/step3';
import Step4 from '../../components/activation/step4';
import Step5 from '../../components/activation/step5';
import Step6 from '../../components/activation/step6';

// Import types from context
import type { Step1Data, Step2Data, Step3Data, Step4Data, Step5Data, Step6Data } from '../../contexts/ActivationContext';

import FastDashboardContent from '../../components/dashboard/FastDashboardContent';
import NotificationBanner from '../../components/notifications/NotificationBanner';
import WithdrawModal from '../../components/dashboard/WithdrawModal';
import { useActivationStatus } from '../../hooks/useActivationStatus';

const Dashboard = () => {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [showActivationFlow, setShowActivationFlow] = useState(false);
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawLoanId, setWithdrawLoanId] = useState<string | null>(null);
  const [localCurrentStep, setLocalCurrentStep] = useState(1);

  // Use the new activation status hook with caching
  const {
    isAccountActivated,
    activationProgress,
    loadingActivation,
    activationApiError,
    refreshActivationStatus
  } = useActivationStatus(user?.id || null);

  // Handle client-side mounting to prevent hydration errors
  useEffect(() => {
    setMounted(true);
  }, []);

  // Show loading state only while checking authentication (not activation)
  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    window.location.href = '/login';
    return null;
  }

  // Get user's display name
  const displayName = user.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user.email.split('@')[0];

  const handleActivateClick = () => {
    setShowActivationFlow(true);
    setLocalCurrentStep(1);
  };

  const handleStep1Next = (data: Step1Data) => setLocalCurrentStep(2);
  const handleStep2Next = (data: Step2Data) => setLocalCurrentStep(3);
  const handleStep3Next = (data: Step3Data) => setLocalCurrentStep(4);
  const handleStep4Next = (data: Step4Data) => setLocalCurrentStep(5);
  const handleStep5Next = (data: Step5Data) => setLocalCurrentStep(6);

  const handleStep6Next = async () => {
    // All steps complete - activate account
    await refreshActivationStatus();
    setShowActivationFlow(false);
    // Force reload to ensure all states sync
    window.location.reload();
  };

  const handleStep2Back = () => setLocalCurrentStep(1);
  const handleStep3Back = () => setLocalCurrentStep(2);
  const handleStep4Back = () => setLocalCurrentStep(3);
  const handleStep5Back = () => setLocalCurrentStep(4);
  const handleStep6Back = () => setLocalCurrentStep(5);

  const handleCloseActivation = () => {
    setShowActivationFlow(false);
    setLocalCurrentStep(1);
  };

  const handleApplyForLoan = () => {
    router.push('/loan');
  };

  const handleWithdraw = (loanId: string) => {
    setWithdrawLoanId(loanId);
    setShowWithdrawModal(true);
  };

  const handleViewLoanDetails = (loanId: string) => {
    router.push(`/loan/${loanId}`);
  };

  return (
    <ToastProvider>
      <DashboardLayout userName={displayName}>
        {/* Main Content Area with Gradient Background */}
        <div className="min-h-[calc(100vh-80px)]">
           <div className="max-w-7xl mx-auto space-y-8">
             
            {/* Welcome Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-8 shadow-xl text-white relative overflow-hidden">
               {/* Background Pattern */}
               <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
               <div className="relative z-10">
                 <h1 className="text-3xl font-bold mb-2">
                   {isAccountActivated ? `Welcome back, ${displayName}!` : `Welcome, ${displayName}!`}
                 </h1>
                 <p className="text-emerald-100/80 max-w-xl">
                   {isAccountActivated
                     ? "Here's your financial overview. You are fully verified and ready to grow."
                     : "Let's get your account activated. Complete the verification steps below to unlock full access."}
                 </p>
               </div>

              {isAccountActivated && (
                <div className="relative z-10 flex-shrink-0">
                  <button
                    onClick={handleApplyForLoan}
                    className="bg-emerald-500 hover:bg-emerald-400 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-900/20 transition-all flex items-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0 border border-emerald-400/50"
                  >
                    <PlusCircle className="w-5 h-5" />
                    Apply for New Loan
                  </button>
                </div>
              )}
            </div>

            {/* API Error Notice */}
            {activationApiError && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3">
                <div className="w-5 h-5 text-amber-600">⚠️</div>
                <div>
                  <p className="text-sm font-bold text-amber-800">
                    System Notice
                  </p>
                  <p className="text-xs text-amber-700 mt-1">
                    We are experiencing some connection issues. Some features might be limited.
                  </p>
                </div>
              </div>
            )}

            {/* Non-Activated State - Account Activation Card */}
            {!isAccountActivated && (
              <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-8 relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-teal-500"></div>
                {/* Small loading indicator */}
                {loadingActivation && (
                  <div className="absolute top-6 right-6">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-emerald-600"></div>
                  </div>
                )}

                <div className="flex flex-col lg:flex-row gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-4 mb-6">
                       <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                         <Shield className="w-6 h-6 text-emerald-600" />
                       </div>
                       <div>
                          <h2 className="text-xl font-bold text-slate-900">Activate Your Account</h2>
                          <p className="text-slate-500 text-sm">Complete these steps to unlock funding.</p>
                       </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-8">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Verification Progress</span>
                        <span className="text-sm font-bold text-emerald-600">{activationProgress}%</span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-emerald-500 to-teal-500 h-full rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${activationProgress}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* Steps Grid */}
                    <div className="grid sm:grid-cols-2 gap-4">
                      {[
                        "Personal Information",
                        "Character References", 
                        "Upload Identification",
                        "Employment Information",
                        "Bank Details",
                        "Review & Signature"
                      ].map((step, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 rounded-lg border border-slate-100 bg-slate-50/50">
                          <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                            idx + 1 < localCurrentStep ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                          }`}>
                             {idx + 1 < localCurrentStep ? '✓' : idx + 1}
                          </div>
                          <span className={`text-sm font-medium ${idx + 1 < localCurrentStep ? 'text-slate-700' : 'text-slate-400'}`}>
                            {step}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex flex-col justify-center items-center lg:border-l border-slate-100 lg:pl-8">
                     <p className="text-center text-slate-500 text-sm mb-6 max-w-xs">
                        Ready to start your financial journey? It only takes a few minutes.
                     </p>
                    <button
                      onClick={handleActivateClick}
                      className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-emerald-600/20 transition-all transform hover:-translate-y-0.5"
                    >
                      Continue Activation
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Activated State - Stats & Actions */}
            {isAccountActivated && (
              <>
                {/* Notifications */}
                <NotificationBanner />

                {/* Dashboard Stats & Charts (FastDashboardContent) */}
                <div className="bg-transparent">
                  <FastDashboardContent 
                    onLoanDetailsClick={handleViewLoanDetails}
                    onWithdraw={handleWithdraw}
                  />
                </div>

                {/* Quick Action Cards */}
                <div>
                   <h3 className="text-lg font-bold text-slate-800 mb-4">Quick Actions</h3>
                   <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Link
                      href="/loan"
                      className="group p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-emerald-900/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                      <div className="relative z-10">
                        <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                          <PlusCircle className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">New Application</h4>
                        <p className="text-slate-500 text-sm">Start a new loan request instantly.</p>
                      </div>
                    </Link>

                    <div className="group p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-blue-900/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer">
                       <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                       <div className="relative z-10">
                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                          <Wallet className="w-6 h-6" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900 mb-1">Make Payment</h4>
                        <p className="text-slate-500 text-sm">Pay installments or settle early.</p>
                      </div>
                    </div>

                    <div className="group p-6 bg-white rounded-2xl shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-purple-900/5 hover:-translate-y-1 transition-all duration-300 relative overflow-hidden cursor-pointer">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-50 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                          <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4 shadow-sm">
                            <FileUp className="w-6 h-6" />
                          </div>
                          <h4 className="text-lg font-bold text-slate-900 mb-1">Documents</h4>
                          <p className="text-slate-500 text-sm">Upload or view your files.</p>
                        </div>
                    </div>
                   </div>
                </div>
              </>
            )}

            {/* Locked Content Overlay (if needed) */}
            {!isAccountActivated && (
              <div className="flex flex-col items-center justify-center py-20 opacity-50 select-none pointer-events-none">
                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                  <Lock className="w-8 h-8 text-slate-400" />
                </div>
                <p className="text-slate-500 font-medium">Additional features locked until activation.</p>
              </div>
            )}

            {/* Modals */}
            {showActivationFlow && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                  {localCurrentStep === 1 && <Step1 onNext={handleStep1Next} onClose={handleCloseActivation} />}
                  {localCurrentStep === 2 && <Step2 onNext={handleStep2Next} onBack={handleStep2Back} onClose={handleCloseActivation} />}
                  {localCurrentStep === 3 && <Step3 onNext={handleStep3Next} onBack={handleStep3Back} onClose={handleCloseActivation} />}
                  {localCurrentStep === 4 && <Step4 onNext={handleStep4Next} onBack={handleStep4Back} onClose={handleCloseActivation} />}
                  {localCurrentStep === 5 && <Step5 onNext={handleStep5Next} onBack={handleStep5Back} onClose={handleCloseActivation} />}
                  {localCurrentStep === 6 && <Step6 onFinish={handleStep6Next} onBack={handleStep6Back} onClose={handleCloseActivation} />}
              </div>
            )}

            <WithdrawModal
              isOpen={showWithdrawModal}
              onClose={() => setShowWithdrawModal(false)}
              loanId={withdrawLoanId}
              onSuccess={() => {}}
            />
           </div>
        </div>
      </DashboardLayout>
    </ToastProvider>
  );
};

export default Dashboard;