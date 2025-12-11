'use client';

import { useEffect, useState } from 'react';
import DashboardLayout from '../../components/ui/dashboardlayout';
import { useAuth } from '../../contexts/AuthContext';
import { Loan } from '../../types/loan';
import { formatCurrency } from '../../lib/loan-calculations';
import { Wallet, PlusCircle, AlertCircle, FileText, ChevronRight, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

const LoanPage = () => {
  const { user, loading: authLoading } = useAuth();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const fetchLoans = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/loans/user', {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        const rawText = await res.text();

        let data;
        try {
          data = JSON.parse(rawText);
        } catch (parseError) {
          console.error('JSON parse error:', parseError);
          throw new Error(`API error (Status: ${res.status}).`);
        }

        if (!res.ok) {
          throw new Error(data.error || `Failed to fetch loans: ${res.status}`);
        }

        const loansData = data.loans || data.data || data || [];
        setLoans(Array.isArray(loansData) ? loansData : []);
        setError(null);
      } catch (err) {
        console.error('Error fetching loans:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch loans');
      } finally {
        setLoading(false);
      }
    };

    fetchLoans();
  }, [user]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-slate-600 font-semibold text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center bg-white rounded-3xl shadow-xl border border-slate-100 p-12 max-w-md w-full">
          <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/20">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <p className="text-xl font-bold mb-2 text-slate-900">Authentication Required</p>
          <p className="text-slate-500 mb-8">Please login to view your loans.</p>
          <Link 
            href="/login" 
            className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 font-bold w-full justify-center"
          >
            Sign In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <DashboardLayout userName={user.firstName || user.email}>
      <div className="min-h-[calc(100vh-80px)]">
        <div className="max-w-6xl mx-auto space-y-8">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-sm border border-slate-200 text-emerald-600">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  My Loans
                </h1>
                <p className="text-sm text-slate-500">Manage your active and past applications</p>
              </div>
            </div>
            
            {loans.length > 0 && (
                <Link
                  href="/loan"
                  className="bg-emerald-600 text-white px-5 py-2.5 rounded-lg hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20 font-semibold flex items-center gap-2 text-sm"
                >
                  <PlusCircle className="w-4 h-4" />
                  New Application
                </Link>
            )}
          </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5" />
            <div className="flex-1">
                <p className="font-semibold text-sm">Error Loading Loans</p>
                <p className="text-xs">{error}</p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="text-sm underline hover:no-underline font-medium"
            >
              Retry
            </button>
          </div>
        )}

        {!loading && !error && loans.length === 0 && (
          <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Wallet className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">No Active Loans</h3>
            <p className="text-slate-500 mb-8 max-w-sm mx-auto">You haven't applied for any loans yet. Start your journey today.</p>
            <Link
              href="/loan"
              className="inline-flex items-center gap-2 bg-emerald-600 text-white px-8 py-3 rounded-xl hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-600/20 font-bold"
            >
              <PlusCircle className="w-5 h-5" />
              Apply for a Loan
            </Link>
          </div>
        )}

        {!loading && !error && loans.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loans.map((loan) => (
              <div
                key={loan.id}
                className="group bg-white rounded-2xl p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-200 transition-all duration-300 relative overflow-hidden"
              >
                 <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-bl-full -mr-8 -mt-8 opacity-50 group-hover:opacity-100 transition-opacity"></div>
                
                <div className="relative z-10">
                    <div className="flex items-start justify-between mb-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Personal Loan</h2>
                        <p className="text-xs text-slate-400 font-mono mt-1">ID: {loan.id.slice(0, 8)}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                        loan.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' :
                        loan.status === 'Pending Approval' ? 'bg-amber-50 text-amber-700 border-amber-100' :
                        loan.status === 'Rejected' ? 'bg-red-50 text-red-700 border-red-100' :
                        'bg-slate-100 text-slate-700 border-slate-200'
                        }`}>
                        {loan.status || 'Pending'}
                    </span>
                    </div>

                    <div className="grid grid-cols-2 gap-y-4 gap-x-8 mb-6">
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Amount</p>
                            <p className="text-xl font-bold text-slate-900">{formatCurrency(loan.loanAmount || 0)}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Interest</p>
                            <div className="flex items-center gap-1.5">
                                <span className="text-xl font-bold text-slate-900">{loan.interestRate}%</span>
                                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Fixed</span>
                            </div>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Duration</p>
                            <p className="font-semibold text-slate-700">{loan.durationMonths} months</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-500 uppercase tracking-wider font-semibold mb-1">Applied On</p>
                            <p className="font-semibold text-slate-700">
                                {loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A'}
                            </p>
                        </div>
                    </div>
                    

                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && !error && loans.length > 0 && (
            <div className="mt-8 bg-slate-900 rounded-2xl shadow-xl p-8 text-white relative overflow-hidden">
                <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-sm border border-white/20">
                            <TrendingUp className="w-6 h-6 text-emerald-400" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold">Total Active Applications</h3>
                            <p className="text-slate-400">You have {loans.length} active loan applications.</p>
                        </div>
                    </div>
                    <div className="text-3xl font-bold text-emerald-400">
                        {loans.length}
                    </div>
                </div>
            </div>
        )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default LoanPage;