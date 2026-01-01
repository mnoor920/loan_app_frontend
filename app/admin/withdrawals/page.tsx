'use client';
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { apiFetchJson } from '@/lib/api-client';
import { formatCurrency } from '@/lib/loan-calculations';
import DashboardLayout from '@/components/ui/dashboardlayout';
import NotificationModal from '@/components/admin/NotificationModal';
import ConfirmationModal from '@/components/admin/ConfirmationModal';
import {
    CheckCircle,
    XCircle,
    Clock,
    Eye,
    AlertCircle,
    RefreshCw,
    Search,
    Filter,
    CreditCard
} from 'lucide-react';

interface WithdrawalRequest {
    id: string;
    userId: string;
    amount: number;
    status: 'pending' | 'review' | 'approved' | 'rejected';
    bankDetails: {
        bankName: string;
        accountNumber: string;
        accountHolderName: string;
        accountType: string;
    };
    adminNote?: string;
    transactionId?: string;
    reviewedBy?: string;
    reviewedAt?: string;
    previousBalance?: number;
    newBalance?: number;
    createdAt: string;
    updatedAt: string;
    user?: {
        id: string;
        email: string;
        firstName: string;
        lastName: string;
    };
}

export default function AdminWithdrawalsPage() {
    const { user } = useAuth();
    const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedStatus, setSelectedStatus] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRequest | null>(null);
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [actionLoading, setActionLoading] = useState<string | null>(null);
    const [adminNote, setAdminNote] = useState('');
    const [transactionId, setTransactionId] = useState('');
    const [notification, setNotification] = useState<{
        isOpen: boolean;
        type: 'success' | 'error' | 'info';
        title: string;
        message: string;
    }>({
        isOpen: false,
        type: 'info',
        title: '',
        message: ''
    });
    const [confirmation, setConfirmation] = useState<{
        isOpen: boolean;
        title: string;
        message: string;
        type?: 'warning' | 'danger' | 'info';
        onConfirm: () => void;
    }>({
        isOpen: false,
        title: '',
        message: '',
        type: 'warning',
        onConfirm: () => { }
    });

    useEffect(() => {
        fetchWithdrawals();
    }, [selectedStatus]);

    const fetchWithdrawals = async () => {
        try {
            setLoading(true);
            setError(null);
            const params = new URLSearchParams();
            if (selectedStatus !== 'all') {
                params.append('status', selectedStatus);
            }
            const response = await apiFetchJson(`/api/admin/withdrawals?${params.toString()}`);
            if (response.success) {
                setWithdrawals(response.withdrawals || []);
            } else {
                setError(response.error || 'Failed to fetch withdrawals');
            }
        } catch (err: any) {
            console.error('Error fetching withdrawals:', err);
            setError(err.message || 'Failed to fetch withdrawals');
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = (withdrawalId: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Approve Withdrawal',
            message: 'Are you sure you want to approve this withdrawal? This will deduct the amount from the user\'s wallet.',
            type: 'warning',
            onConfirm: () => {
                setConfirmation(prev => ({ ...prev, isOpen: false }));
                executeApprove(withdrawalId);
            }
        });
    };

    const executeApprove = async (withdrawalId: string) => {
        try {
            setActionLoading(withdrawalId);
            const requestBody: any = {};
            if (adminNote && adminNote.trim()) {
                requestBody.adminNote = adminNote.trim();
            }
            if (transactionId && transactionId.trim()) {
                requestBody.transactionId = transactionId.trim();
            }

            console.log('Sending approve request:', { withdrawalId, requestBody });

            const response = await apiFetchJson(`/api/admin/withdrawals/${withdrawalId}/approve`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (response.success) {
                await fetchWithdrawals();
                setShowDetailModal(false);
                setSelectedWithdrawal(null);
                setAdminNote('');
                setTransactionId('');
                setNotification({
                    isOpen: true,
                    type: 'success',
                    title: 'Withdrawal Approved',
                    message: 'The withdrawal request has been approved successfully. The amount has been deducted from the user\'s wallet.'
                });
            } else {
                setNotification({
                    isOpen: true,
                    type: 'error',
                    title: 'Approval Failed',
                    message: response.error || 'Failed to approve withdrawal. Please try again.'
                });
            }
        } catch (err: any) {
            console.error('Error approving withdrawal:', err);
            setNotification({
                isOpen: true,
                type: 'error',
                title: 'Approval Failed',
                message: err.error || err.message || 'An error occurred while approving the withdrawal. Please try again.'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleReject = (withdrawalId: string) => {
        setConfirmation({
            isOpen: true,
            title: 'Reject Withdrawal',
            message: 'Are you sure you want to reject this withdrawal? The user\'s wallet balance will remain unchanged.',
            type: 'warning',
            onConfirm: () => {
                setConfirmation(prev => ({ ...prev, isOpen: false }));
                executeReject(withdrawalId);
            }
        });
    };

    const executeReject = async (withdrawalId: string) => {
        try {
            setActionLoading(withdrawalId);
            const requestBody: any = {};
            if (adminNote && adminNote.trim()) {
                requestBody.adminNote = adminNote.trim();
            }

            console.log('Sending reject request:', { withdrawalId, requestBody });

            const response = await apiFetchJson(`/api/admin/withdrawals/${withdrawalId}/reject`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (response.success) {
                await fetchWithdrawals();
                setShowDetailModal(false);
                setSelectedWithdrawal(null);
                setAdminNote('');
                setNotification({
                    isOpen: true,
                    type: 'success',
                    title: 'Withdrawal Rejected',
                    message: 'The withdrawal request has been rejected. The user\'s wallet balance remains unchanged.'
                });
            } else {
                setNotification({
                    isOpen: true,
                    type: 'error',
                    title: 'Rejection Failed',
                    message: response.error || 'Failed to reject withdrawal. Please try again.'
                });
            }
        } catch (err: any) {
            console.error('Error rejecting withdrawal:', err);
            setNotification({
                isOpen: true,
                type: 'error',
                title: 'Rejection Failed',
                message: err.error || err.message || 'An error occurred while rejecting the withdrawal. Please try again.'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const handleMoveToReview = async (withdrawalId: string) => {
        try {
            setActionLoading(withdrawalId);
            const response = await apiFetchJson(`/api/admin/withdrawals/${withdrawalId}/review`, {
                method: 'POST'
            });

            if (response.success) {
                await fetchWithdrawals();
                setNotification({
                    isOpen: true,
                    type: 'success',
                    title: 'Moved to Review',
                    message: 'The withdrawal request has been moved to review status successfully.'
                });
            } else {
                setNotification({
                    isOpen: true,
                    type: 'error',
                    title: 'Action Failed',
                    message: response.error || 'Failed to move to review. Please try again.'
                });
            }
        } catch (err: any) {
            console.error('Error moving to review:', err);
            setNotification({
                isOpen: true,
                type: 'error',
                title: 'Action Failed',
                message: err.error || err.message || 'An error occurred. Please try again.'
            });
        } finally {
            setActionLoading(null);
        }
    };

    const getStatusBadge = (status: string) => {
        const baseClasses = "px-3 py-1 text-xs font-semibold rounded-full";
        switch (status) {
            case 'approved':
                return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
            case 'rejected':
                return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
            case 'review':
                return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
            case 'pending':
                return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
            default:
                return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300`;
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'approved':
                return <CheckCircle className="w-4 h-4 text-green-500" />;
            case 'rejected':
                return <XCircle className="w-4 h-4 text-red-500" />;
            case 'review':
                return <Eye className="w-4 h-4 text-blue-500" />;
            case 'pending':
                return <Clock className="w-4 h-4 text-yellow-500" />;
            default:
                return <AlertCircle className="w-4 h-4 text-gray-500" />;
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const filteredWithdrawals = withdrawals.filter(w => {
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            return (
                w.user?.email?.toLowerCase().includes(searchLower) ||
                w.user?.firstName?.toLowerCase().includes(searchLower) ||
                w.user?.lastName?.toLowerCase().includes(searchLower) ||
                w.bankDetails.bankName?.toLowerCase().includes(searchLower) ||
                w.id.toLowerCase().includes(searchLower)
            );
        }
        return true;
    });

    const isSuperAdmin = user?.role === 'superadmin';

    return (
        <DashboardLayout userName={user?.firstName || 'Admin'}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                        Withdrawal Requests
                    </h1>
                    <p className="text-gray-600 dark:text-gray-400">
                        Manage and review user withdrawal requests
                    </p>
                </div>

                {/* Filters */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6 mb-6">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                placeholder="Search by user email, name, or withdrawal ID..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-400" />
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                            >
                                <option value="all">All Status</option>
                                <option value="pending">Pending</option>
                                <option value="review">Review</option>
                                <option value="approved">Approved</option>
                                <option value="rejected">Rejected</option>
                            </select>
                        </div>
                        <button
                            onClick={fetchWithdrawals}
                            disabled={loading}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
                        <div className="flex items-center gap-2 text-red-800 dark:text-red-200">
                            <AlertCircle className="w-5 h-5" />
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                {/* Withdrawals Table */}
                <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                    {loading ? (
                        <div className="p-12 text-center">
                            <RefreshCw className="w-8 h-8 text-emerald-600 mx-auto mb-4 animate-spin" />
                            <p className="text-gray-600 dark:text-gray-400">Loading withdrawals...</p>
                        </div>
                    ) : filteredWithdrawals.length === 0 ? (
                        <div className="p-12 text-center">
                            <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No withdrawal requests found</p>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 dark:bg-gray-700">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            User
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Amount
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Bank Details
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Date
                                        </th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                                    {filteredWithdrawals.map((withdrawal) => (
                                        <tr key={withdrawal.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                        {withdrawal.user?.firstName && withdrawal.user?.lastName
                                                            ? `${withdrawal.user.firstName} ${withdrawal.user.lastName}`
                                                            : withdrawal.user?.email
                                                                ? withdrawal.user.email.split('@')[0]
                                                                : 'Unknown User'}
                                                    </p>
                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                        {withdrawal.user?.email || 'No email available'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                                    {formatCurrency(withdrawal.amount)}
                                                </p>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {getStatusIcon(withdrawal.status)}
                                                    <span className={getStatusBadge(withdrawal.status)}>
                                                        {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-sm text-gray-900 dark:text-gray-100">
                                                    <p className="font-medium">{withdrawal.bankDetails.bankName}</p>
                                                    <p className="text-xs text-gray-500">
                                                        {withdrawal.bankDetails.accountType} • {withdrawal.bankDetails.accountNumber.slice(-4)}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                                {formatDate(withdrawal.createdAt)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <button
                                                    onClick={() => {
                                                        setSelectedWithdrawal(withdrawal);
                                                        setShowDetailModal(true);
                                                        setAdminNote(withdrawal.adminNote || '');
                                                        setTransactionId(withdrawal.transactionId || '');
                                                    }}
                                                    className="text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 dark:hover:text-emerald-300 font-medium"
                                                >
                                                    View Details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Detail Modal */}
            {showDetailModal && selectedWithdrawal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
                    <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-2xl shadow-xl border border-gray-200 dark:border-gray-700 max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center justify-between">
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                                    Withdrawal Request Details
                                </h2>
                                <button
                                    onClick={() => {
                                        setShowDetailModal(false);
                                        setSelectedWithdrawal(null);
                                        setAdminNote('');
                                        setTransactionId('');
                                    }}
                                    className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                >
                                    <XCircle className="w-6 h-6" />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-6">
                            {/* User Info */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">User Information</h3>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                        <span className="font-medium">Name:</span> {selectedWithdrawal.user?.firstName} {selectedWithdrawal.user?.lastName}
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100 mt-1">
                                        <span className="font-medium">Email:</span> {selectedWithdrawal.user?.email}
                                    </p>
                                </div>
                            </div>

                            {/* Amount */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Withdrawal Amount</h3>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                                        {formatCurrency(selectedWithdrawal.amount)}
                                    </p>
                                    {selectedWithdrawal.previousBalance !== undefined && selectedWithdrawal.newBalance !== undefined && (
                                        <div className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                                            <p>Previous Balance: {formatCurrency(selectedWithdrawal.previousBalance)}</p>
                                            <p>New Balance: {formatCurrency(selectedWithdrawal.newBalance)}</p>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bank Details */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Bank Details</h3>
                                <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2">
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                        <span className="font-medium">Bank:</span> {selectedWithdrawal.bankDetails.bankName}
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                        <span className="font-medium">Account Type:</span> {selectedWithdrawal.bankDetails.accountType}
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                        <span className="font-medium">Account Number:</span> {selectedWithdrawal.bankDetails.accountNumber}
                                    </p>
                                    <p className="text-sm text-gray-900 dark:text-gray-100">
                                        <span className="font-medium">Account Holder:</span> {selectedWithdrawal.bankDetails.accountHolderName}
                                    </p>
                                </div>
                            </div>

                            {/* Status */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Status</h3>
                                <div className="flex items-center gap-2">
                                    {getStatusIcon(selectedWithdrawal.status)}
                                    <span className={getStatusBadge(selectedWithdrawal.status)}>
                                        {selectedWithdrawal.status.charAt(0).toUpperCase() + selectedWithdrawal.status.slice(1)}
                                    </span>
                                </div>
                                {selectedWithdrawal.reviewedAt && (
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                                        Reviewed: {formatDate(selectedWithdrawal.reviewedAt)}
                                    </p>
                                )}
                            </div>

                            {/* Admin Note */}
                            {(selectedWithdrawal.status === 'pending' || selectedWithdrawal.status === 'review') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Admin Note (Optional)
                                    </label>
                                    <textarea
                                        value={adminNote}
                                        onChange={(e) => setAdminNote(e.target.value)}
                                        rows={3}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="Add a note for this withdrawal request..."
                                    />
                                </div>
                            )}

                            {/* Transaction ID (for approval) */}
                            {isSuperAdmin && (selectedWithdrawal.status === 'pending' || selectedWithdrawal.status === 'review') && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Transaction ID (Optional)
                                    </label>
                                    <input
                                        type="text"
                                        value={transactionId}
                                        onChange={(e) => setTransactionId(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                                        placeholder="Enter transaction ID..."
                                    />
                                </div>
                            )}

                            {/* Existing Admin Note */}
                            {selectedWithdrawal.adminNote && (
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">Existing Admin Note</h3>
                                    <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                                        <p className="text-sm text-gray-900 dark:text-gray-100">{selectedWithdrawal.adminNote}</p>
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            {isSuperAdmin && (selectedWithdrawal.status === 'pending' || selectedWithdrawal.status === 'review') && (
                                <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => handleReject(selectedWithdrawal.id)}
                                        disabled={actionLoading === selectedWithdrawal.id}
                                        className="flex-1 px-4 py-3 bg-red-600 hover:bg-red-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {actionLoading === selectedWithdrawal.id ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <XCircle className="w-4 h-4" />
                                                Reject
                                            </>
                                        )}
                                    </button>
                                    <button
                                        onClick={() => handleApprove(selectedWithdrawal.id)}
                                        disabled={actionLoading === selectedWithdrawal.id}
                                        className="flex-1 px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {actionLoading === selectedWithdrawal.id ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <CheckCircle className="w-4 h-4" />
                                                Approve
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}

                            {/* Move to Review (for regular admins) */}
                            {!isSuperAdmin && selectedWithdrawal.status === 'pending' && (
                                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                                    <button
                                        onClick={() => handleMoveToReview(selectedWithdrawal.id)}
                                        disabled={actionLoading === selectedWithdrawal.id}
                                        className="w-full px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {actionLoading === selectedWithdrawal.id ? (
                                            <>
                                                <RefreshCw className="w-4 h-4 animate-spin" />
                                                Processing...
                                            </>
                                        ) : (
                                            <>
                                                <Eye className="w-4 h-4" />
                                                Move to Review
                                            </>
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Notification Modal */}
            <NotificationModal
                isOpen={notification.isOpen}
                type={notification.type}
                title={notification.title}
                message={notification.message}
                onClose={() => setNotification({ ...notification, isOpen: false })}
            />

            {/* Confirmation Modal */}
            <ConfirmationModal
                isOpen={confirmation.isOpen}
                title={confirmation.title}
                message={confirmation.message}
                type={confirmation.type}
                confirmText="Confirm"
                cancelText="Cancel"
                onConfirm={confirmation.onConfirm}
                onCancel={() => setConfirmation({ ...confirmation, isOpen: false })}
                loading={actionLoading !== null}
            />
        </DashboardLayout>
    );
}

