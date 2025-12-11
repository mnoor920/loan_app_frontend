import React, { useRef } from 'react';
import { formatCurrency } from '../../lib/loan-calculations';
import { Download, Printer, CheckCircle } from 'lucide-react';

interface ReceiptData {
    transactionId: string;
    loanId: string;
    applicationNumber: string;
    amount: number;
    disbursedAt: string;
    borrowerName: string;
    bankAccount: string;
}

interface WithdrawalReceiptProps {
    data: ReceiptData;
    onClose: () => void;
}

export default function WithdrawalReceipt({ data, onClose }: WithdrawalReceiptProps) {
    const receiptRef = useRef<HTMLDivElement>(null);

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
            <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-2xl shadow-xl border border-gray-200 dark:border-gray-700 my-8">
                
                {/* Print Styles */}
                <style dangerouslySetInnerHTML={{__html: `
                    @media print {
                        body * {
                            visibility: hidden;
                        }
                        #receipt-content, #receipt-content * {
                            visibility: visible;
                        }
                        #receipt-content {
                            position: absolute;
                            left: 0;
                            top: 0;
                            width: 100%;
                            border: none;
                            box-shadow: none;
                        }
                        .no-print {
                            display: none;
                        }
                    }
                `}} />

                <div id="receipt-content" ref={receiptRef} className="p-8 md:p-12 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
                    {/* Header */}
                    <div className="text-center mb-8 border-b-2 border-gray-100 dark:border-gray-800 pb-8">
                        <div className="flex items-center justify-center gap-3 mb-4">
                            <div className="w-12 h-12 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                                <span className="text-white dark:text-black font-bold text-xl">L</span>
                            </div>
                            <span className="text-2xl font-bold tracking-tight">LoanApp</span>
                        </div>
                        <h1 className="text-3xl font-bold mb-2">Withdrawal Receipt</h1>
                        <p className="text-gray-500 dark:text-gray-400">Transaction Completed Successfully</p>
                    </div>

                    {/* Transaction Details */}
                    <div className="grid grid-cols-2 gap-8 mb-8">
                        <div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Transaction ID</p>
                            <p className="font-mono text-sm">{data.transactionId}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Date</p>
                            <p className="font-medium">{new Date(data.disbursedAt).toLocaleDateString()} {new Date(data.disbursedAt).toLocaleTimeString()}</p>
                        </div>
                    </div>

                    {/* Amount Box */}
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-6 mb-8 text-center border border-gray-100 dark:border-gray-700">
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Total Amount Withdrawn</p>
                        <p className="text-4xl font-bold text-gray-900 dark:text-white">{formatCurrency(data.amount)}</p>
                    </div>

                    {/* Details Table */}
                    <div className="space-y-4 mb-8">
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <span className="text-gray-500 dark:text-gray-400">Application Number</span>
                            <span className="font-medium">{data.applicationNumber}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <span className="text-gray-500 dark:text-gray-400">Borrower Name</span>
                            <span className="font-medium">{data.borrowerName}</span>
                        </div>
                        <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <span className="text-gray-500 dark:text-gray-400">Disbursement Method</span>
                            <span className="font-medium">{data.bankAccount}</span>
                        </div>
                         <div className="flex justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
                            <span className="text-gray-500 dark:text-gray-400">Status</span>
                            <span className="font-medium text-green-600 dark:text-green-400 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Success
                            </span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="text-center text-sm text-gray-500 dark:text-gray-400 pt-8 border-t border-gray-100 dark:border-gray-800">
                        <p>Thank you for using our service.</p>
                        <p>For any queries, please contact support.</p>
                    </div>
                </div>

                {/* Actions (Hidden on Print) */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-6 flex gap-4 border-t border-gray-200 dark:border-gray-700 no-print">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-3 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                        Close
                    </button>
                    <button
                        onClick={handlePrint}
                        className="flex-1 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 transition-all flex items-center justify-center gap-2"
                    >
                        <Printer className="w-5 h-5" />
                        Print Receipt
                    </button>
                </div>
            </div>
        </div>
    );
}
