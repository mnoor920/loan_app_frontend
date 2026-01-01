// app/admin/dashboard/page.tsx
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/ui/dashboardlayout";
import {
  TrendingUp,
  TrendingDown,
  Users,
  CreditCard,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import UsersList from "@/components/admin/UsersList";
import LoansList from "@/components/admin/LoansList";
import ErrorBoundary from "@/components/error/ErrorBoundary";
import ErrorDisplay from "@/components/error/ErrorDisplay";
import useErrorHandler from "@/hooks/useErrorHandler";
import { adminApi } from "@/lib/api-client";
import {
  LoadingSpinner,
  SkeletonStats,
  SkeletonList,
  InlineLoading,
  RefreshIndicator,
} from "@/components/ui/LoadingStates";
import GenerateCodeModal from "@/components/admin/GenerateCodeModal";

interface StatCardProps {
  title: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon?: React.ReactNode;
  loading?: boolean;
}

function StatCard({
  title,
  value,
  change,
  isPositive,
  icon,
  loading,
}: StatCardProps) {
  if (loading) {
    return (
      <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="animate-pulse">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-slate-200 rounded w-24"></div>
            <div className="w-5 h-5 bg-slate-200 rounded"></div>
          </div>
          <div className="h-8 bg-slate-200 rounded mb-2"></div>
          <div className="h-3 bg-slate-200 rounded w-16"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-3 sm:p-4 lg:p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs sm:text-sm text-slate-500 font-semibold uppercase tracking-wide">
          {title}
        </div>
        {icon && <div className="text-emerald-600">{icon}</div>}
      </div>
      <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-slate-900 mb-1 sm:mb-2">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {change && (
        <div
          className={`text-xs sm:text-sm flex items-center gap-1 font-semibold ${isPositive ? "text-emerald-600" : "text-red-600"
            }`}
        >
          {isPositive ? (
            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
          ) : (
            <TrendingDown className="w-3 h-3 sm:w-4 sm:h-4" />
          )}
          {change}
        </div>
      )}
    </div>
  );
}

interface AdminDashboardStats {
  totalUsers: number;
  activatedUsers: number;
  pendingActivations: number;
  totalLoanApplications: number;
  pendingLoans: number;
  approvedLoans: number;
  rejectedLoans: number;
  totalLoanAmount: number;
  averageLoanAmount: number;
}

interface ActivatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  activationStatus: string;
  activatedAt: string;
  createdAt: string;
  profile?: {
    fullName: string;
    currentStep: number;
  };
}

interface LoanApplicationWithUser {
  id: string;
  userId: string;
  loanAmount: number;
  durationMonths: number;
  status: string;
  applicationDate: string;
  createdAt: string;
  applicant: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  hasActiveCode?: boolean;
}

type TabType = "overview" | "users" | "loans";

// Helper function to get initials from name
const getInitials = (name: string): string => {
  const parts = name.split(" ");
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return parts[0][0].toUpperCase();
};

// Helper function to generate consistent color based on name
const getAvatarColor = (name: string): string => {
  const colors = [
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-pink-400 to-pink-600",
    "from-green-400 to-green-600",
    "from-yellow-400 to-yellow-600",
    "from-red-400 to-red-600",
    "from-indigo-400 to-indigo-600",
    "from-teal-400 to-teal-600",
  ];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();


  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<TabType>("overview");

  // Data states
  const [stats, setStats] = useState<AdminDashboardStats | null>(null);
  const [recentUsers, setRecentUsers] = useState<ActivatedUser[]>([]);
  const [recentLoans, setRecentLoans] = useState<LoanApplicationWithUser[]>([]);

  // Loading states
  const [statsLoading, setStatsLoading] = useState(true);
  const [usersLoading, setUsersLoading] = useState(true);
  const [loansLoading, setLoansLoading] = useState(true);

  // Generate Code Modal State
  const [showCodeModal, setShowCodeModal] = useState(false);
  const [selectedLoanForCode, setSelectedLoanForCode] = useState<{ id: string, name: string } | null>(null);

  // Enhanced error handling
  const {
    error,
    hasError,
    isRetrying,
    canRetry,
    retryCount,
    handleError,
    clearError,
    retry,
    executeWithErrorHandling,
  } = useErrorHandler({
    maxRetries: 3,
    onError: (error) => {
      console.error("Dashboard error:", error);
    },
    onRetry: (attempt) => {
      console.log(`Retrying dashboard operation, attempt ${attempt}`);
    },
  });

  // Check authentication and admin role
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
      return;
    }

    if (
      !authLoading &&
      user &&
      user.role !== "admin" &&
      user.role !== "superadmin"
    ) {
      router.push("/userdashboard");
      return;
    }
  }, [user, authLoading, router]);

  // Fetch dashboard statistics with error handling
  const fetchStats = async () => {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) return;

    setStatsLoading(true);

    const result = await executeWithErrorHandling(
      () => adminApi.getDashboardStats(),
      "dashboard_stats"
    );

    if (result && result.success) {
      setStats(result.stats);
    }

    setStatsLoading(false);
  };

  useEffect(() => {
    fetchStats();
  }, [user]);

  // Fetch recent users with error handling
  const fetchRecentUsers = async () => {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) return;

    setUsersLoading(true);

    const result = await executeWithErrorHandling(
      () => adminApi.getActivatedUsers({ limit: 5, status: "completed" }),
      "recent_users"
    );

    if (result && result.success) {
      setRecentUsers(result.users || []);
    }

    setUsersLoading(false);
  };

  useEffect(() => {
    fetchRecentUsers();
  }, [user]);

  // Fetch recent loans with error handling
  const fetchRecentLoans = async () => {
    if (!user || (user.role !== "admin" && user.role !== "superadmin")) return;

    setLoansLoading(true);

    const result = await executeWithErrorHandling(
      () =>
        adminApi.getAllLoans({
          limit: 5,
          sortBy: "application_date",
          sortOrder: "desc",
        }),
      "recent_loans"
    );

    if (result && result.success) {
      setRecentLoans(result.loans || []);
    }

    setLoansLoading(false);
  };

  useEffect(() => {
    fetchRecentLoans();
  }, [user]);

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="flex min-h-screen w-full bg-slate-50 items-center justify-center">
        <div className="text-center">
          <LoadingSpinner
            size="lg"
            className="text-emerald-600 mx-auto mb-4"
          />
          <p className="text-slate-600">Authenticating...</p>
        </div>
      </div>
    );
  }

  // Don't render if user is not authenticated or not admin (will redirect)
  if (!user || (user.role !== "admin" && user.role !== "superadmin")) {
    return null;
  }

  const handleGenerateCode = (e: React.MouseEvent, loanId: string, applicantName: string) => {
    e.stopPropagation(); // Prevent row click
    setSelectedLoanForCode({ id: loanId, name: applicantName });
    setShowCodeModal(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "PKR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <ErrorBoundary showDetails={process.env.NODE_ENV === "development"}>
      <DashboardLayout userName={user?.firstName || "Admin"}>
        <div className="space-y-6">
          {/* Enhanced Error Display */}
          {hasError && error && (
            <ErrorDisplay
              error={error}
              onRetry={() =>
                retry(async () => {
                  await Promise.all([
                    fetchStats(),
                    fetchRecentUsers(),
                    fetchRecentLoans(),
                  ]);
                })
              }
              onDismiss={clearError}
              canRetry={canRetry}
              isRetrying={isRetrying}
              retryCount={retryCount}
              maxRetries={3}
              className="mb-6"
              variant="banner"
              showDetails={process.env.NODE_ENV === "development"}
            />
          )}

          {/* Welcome Banner */}
          <div className="bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            <div className="relative z-10">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">
                Welcome back, {user?.firstName || "Admin"}!
              </h1>
              <p className="text-emerald-100 text-sm sm:text-base">
                Here's your administrative overview. Manage users, loans, and system operations.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="mb-6">
            <div className="border-b border-slate-200">
              <nav className="-mb-px flex space-x-8">
                {[
                  { id: "overview", label: "Overview", icon: TrendingUp },
                  { id: "users", label: "All Users", icon: Users },
                  { id: "loans", label: "All Loans", icon: CreditCard },
                ].map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as TabType)}
                      className={`flex items-center gap-2 py-2 px-1 border-b-2 font-bold text-sm transition-colors ${activeTab === tab.id
                          ? "border-emerald-500 text-emerald-600"
                          : "border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300"
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      {tab.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Tab Content */}
          {activeTab === "overview" && (
            <>
              {/* Stats Cards */}
              {statsLoading ? (
                <SkeletonStats count={4} className="mb-4 sm:mb-6" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  <StatCard
                    title="Total Users"
                    value={stats?.totalUsers || 0}
                    icon={<Users className="w-5 h-5" />}
                    loading={false}
                  />
                  <StatCard
                    title="Activated Users"
                    value={stats?.activatedUsers || 0}
                    icon={<Users className="w-5 h-5" />}
                    loading={false}
                  />
                  <StatCard
                    title="Total Loan Applications"
                    value={stats?.totalLoanApplications || 0}
                    icon={<CreditCard className="w-5 h-5" />}
                    loading={false}
                  />
                  <StatCard
                    title="Pending Applications"
                    value={stats?.pendingLoans || 0}
                    icon={<AlertCircle className="w-5 h-5" />}
                    loading={false}
                  />
                </div>
              )}

              {/* Secondary Stats */}
              {statsLoading ? (
                <SkeletonStats count={3} className="mb-4 sm:mb-6" />
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 mb-4 sm:mb-6">
                  <StatCard
                    title="Approved Loans"
                    value={stats?.approvedLoans || 0}
                    loading={false}
                  />
                  <StatCard
                    title="Total Loan Amount"
                    value={stats ? formatCurrency(stats.totalLoanAmount) : "$0"}
                    loading={false}
                  />
                  <StatCard
                    title="Average Loan Amount"
                    value={
                      stats ? formatCurrency(stats.averageLoanAmount) : "$0"
                    }
                    loading={false}
                  />
                </div>
              )}
            </>
          )}

          {activeTab === "overview" && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Chart Section */}
              <div className="lg:col-span-2 bg-white p-6 lg:p-8 rounded-2xl border border-slate-100 shadow-lg">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900">
                      Loan Applications Overview
                    </h2>
                    <p className="text-sm text-slate-500 mt-1">
                      Current Statistics
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <RefreshIndicator
                      isRefreshing={statsLoading}
                      onRefresh={() => {
                        fetchStats();
                        fetchRecentUsers();
                        fetchRecentLoans();
                      }}
                    />
                    <button
                      onClick={() => setActiveTab("loans")}
                      className="px-4 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-700 hover:bg-slate-50 transition-colors"
                    >
                      View All Loans
                    </button>
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl border border-emerald-100">
                    <div className="text-3xl font-bold text-emerald-600">
                      {statsLoading ? "..." : stats?.pendingLoans || 0}
                    </div>
                    <div className="text-sm text-slate-600 font-semibold mt-1">
                      Pending
                    </div>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-100">
                    <div className="text-3xl font-bold text-green-600">
                      {statsLoading ? "..." : stats?.approvedLoans || 0}
                    </div>
                    <div className="text-sm text-slate-600 font-semibold mt-1">
                      Approved
                    </div>
                  </div>
                </div>

                <div className="text-center p-4 bg-slate-50 rounded-xl border border-slate-200">
                  <div className="text-lg font-bold text-slate-900">
                    Total Applications:{" "}
                    {statsLoading ? "..." : stats?.totalLoanApplications || 0}
                  </div>
                </div>
              </div>

              {/* Recently Verified Users */}
              <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-lg">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-bold text-slate-900">
                    Recently Activated Users
                  </h2>
                  <button
                    onClick={() => setActiveTab("users")}
                    className="text-sm text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                  >
                    View All
                  </button>
                </div>

                {usersLoading ? (
                  <SkeletonList count={4} showAvatar={true} />
                ) : recentUsers.length > 0 ? (
                  <div className="space-y-3 sm:space-y-4">
                    {recentUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-2 sm:gap-3"
                      >
                        <div
                          className={`w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br ${getAvatarColor(
                            user.profile?.fullName ||
                            `${user.firstName} ${user.lastName}`
                          )} rounded-full flex items-center justify-center text-white text-xs sm:text-sm font-semibold flex-shrink-0`}
                        >
                          {getInitials(
                            user.profile?.fullName ||
                            `${user.firstName} ${user.lastName}`
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-bold text-slate-900 truncate">
                            {user.profile?.fullName ||
                              `${user.firstName} ${user.lastName}`}
                          </div>
                          <div className="text-xs text-slate-500 font-medium">
                            Activated: {formatDate(user.activatedAt)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-slate-400">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-medium">No activated users yet</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === "overview" && (
            /* Recent Loan Applications Table */
            <div className="bg-white rounded-2xl border border-slate-100 shadow-lg overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
                <h2 className="text-lg font-bold text-slate-900">
                  Recent Loan Applications
                </h2>
                <button
                  onClick={() => setActiveTab("loans")}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors shadow-lg shadow-emerald-600/20"
                >
                  View All
                </button>
              </div>

              {loansLoading ? (
                <div className="p-6">
                  <SkeletonList count={5} showAvatar={true} />
                </div>
              ) : recentLoans.length > 0 ? (
                <>
                  {/* Mobile Card View */}
                  <div className="block md:hidden divide-y divide-slate-100">
                    {recentLoans.map((loan) => (
                      <div
                        key={loan.id}
                        className="p-4 hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <div className="text-sm font-bold text-slate-900">
                              {loan.applicant.firstName}{" "}
                              {loan.applicant.lastName}
                            </div>
                            <div className="text-xs text-slate-500 font-medium mt-1">
                              {formatDate(loan.applicationDate)}
                            </div>
                          </div>
                          <span
                            className={`px-2 py-1 inline-flex text-xs font-semibold rounded-full ${loan.status === "Approved"
                                ? "bg-green-50 text-green-700 border border-green-200"
                                : loan.status === "Pending Approval"
                                  ? "bg-amber-50 text-amber-700 border border-amber-200"
                                  : loan.status === "Rejected"
                                    ? "bg-red-50 text-red-700 border border-red-200"
                                    : "bg-blue-50 text-blue-700 border border-blue-200"
                              }`}
                          >
                            {loan.status}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <div className="text-sm font-bold text-slate-900">
                            {formatCurrency(loan.loanAmount)}
                          </div>
                          <button
                            onClick={() =>
                              router.push(`/adminloans/${loan.id}`)
                            }
                            className="text-xs text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                          >
                            View Details
                          </button>
                          {loan.status === "Approved" && (
                            <button
                              onClick={(e) => handleGenerateCode(e, loan.id, `${loan.applicant.firstName} ${loan.applicant.lastName}`)}
                              className={`ml-3 text-xs font-medium transition-colors ${loan.hasActiveCode
                                  ? "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                  : "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                }`}
                            >
                              {loan.hasActiveCode ? "Regenerate Code" : "Generate Code"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Applicant Name
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Loan Amount
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Date Applied
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-slate-100">
                        {recentLoans.map((loan) => (
                          <tr
                            key={loan.id}
                            className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                          >
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                              {loan.applicant.firstName}{" "}
                              {loan.applicant.lastName}
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-sm text-gray-800 dark:text-gray-200">
                              {formatCurrency(loan.loanAmount)}
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                              {formatDate(loan.applicationDate)}
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap">
                              <span
                                className={`px-2 sm:px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${loan.status === "Approved"
                                    ? "bg-green-50 text-green-700 border border-green-200"
                                    : loan.status === "Pending Approval"
                                      ? "bg-amber-50 text-amber-700 border border-amber-200"
                                      : loan.status === "Rejected"
                                        ? "bg-red-50 text-red-700 border border-red-200"
                                        : "bg-blue-50 text-blue-700 border border-blue-200"
                                  }`}
                              >
                                {loan.status}
                              </span>
                            </td>
                            <td className="px-4 lg:px-6 py-3 whitespace-nowrap text-sm">
                              <button
                                onClick={() =>
                                  router.push(`/adminloans/${loan.id}`)
                                }
                                className="text-emerald-600 hover:text-emerald-700 font-bold transition-colors"
                              >
                                View
                              </button>
                              {loan.status === "Approved" && (
                                <button
                                  onClick={(e) => handleGenerateCode(e, loan.id, `${loan.applicant.firstName} ${loan.applicant.lastName}`)}
                                  className={`ml-4 font-medium transition-colors ${loan.hasActiveCode
                                      ? "text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                                      : "text-green-600 dark:text-green-400 hover:text-green-700 dark:hover:text-green-300"
                                    }`}
                                >
                                  {loan.hasActiveCode ? "Regenerate Code" : "Generate Code"}
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              ) : (
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">No loan applications yet</p>
                </div>
              )}
            </div>
          )}

          {/* Users Tab */}
          {activeTab === "users" && <UsersList />}

          {/* Loans Tab */}
          {activeTab === "loans" && <LoansList />}
        </div>

        {/* Generate Code Modal */}
        <GenerateCodeModal
          isOpen={showCodeModal}
          onClose={() => setShowCodeModal(false)}
          loanId={selectedLoanForCode?.id || null}
          applicantName={selectedLoanForCode?.name || ''}
        />
      </DashboardLayout>
    </ErrorBoundary>
  );
}
