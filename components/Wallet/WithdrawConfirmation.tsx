import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
    amount: number;
    fee: number;
    newBalance: string;
    method: string;
    transactionId: string | null;
    bank: string;
    lastFour: string;
    holderName: string;
}

const WithdrawConfirmation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const amount = state?.amount || 0;
    const fee = state?.fee || 0;
    const newBalance = state?.newBalance || '0';
    const bank = state?.bank || 'N/A';
    const lastFour = state?.lastFour || '****';
    const holderName = state?.holderName || 'N/A';
    const txId = state?.transactionId ? `TXN-${state.transactionId.slice(-8).toUpperCase()}` : 'TXN-000000';

    return (
        <div className="max-w-xl mx-auto w-full">
            <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                {/* Success Header */}
                <div className="pt-12 pb-8 flex flex-col items-center text-center px-8">
                    <div className="relative flex items-center justify-center mb-8">
                        <div className="absolute inset-0 bg-emerald-500/10 blur-xl rounded-full scale-150"></div>
                        <div className="relative size-24 rounded-full bg-white dark:bg-gray-800 shadow-sm border border-emerald-500/20 flex items-center justify-center">
                            <div className="size-16 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                                <span className="material-icons-round text-white text-4xl">check</span>
                            </div>
                        </div>
                    </div>
                    <h1 className="text-gray-900 dark:text-white text-3xl font-bold tracking-tight mb-3">Withdrawal Initiated</h1>
                    <p className="text-gray-500 dark:text-gray-400 text-base max-w-sm">
                        Your withdrawal request has been received and is currently being processed.
                    </p>
                </div>

                {/* Amount */}
                <div className="px-10 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-2xl p-8 flex flex-col items-center justify-center border border-gray-100 dark:border-gray-700">
                        <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Transaction Amount</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-gray-900 dark:text-white text-5xl font-extrabold tracking-tighter">₮{amount.toLocaleString()}</span>
                            <span className="text-gray-500 dark:text-gray-400 text-xl font-medium">MNT</span>
                        </div>
                    </div>
                </div>

                {/* Transaction Summary */}
                <div className="px-10 py-2">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider">Transaction Summary</h3>
                        <div className="h-px flex-1 ml-4 bg-gray-100 dark:bg-gray-700"></div>
                    </div>
                    <div className="space-y-5">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Recipient Bank</p>
                            <div className="flex items-center gap-2.5">
                                <div className="w-6 h-6 bg-gray-900 dark:bg-gray-700 text-white rounded-md flex items-center justify-center text-[10px] font-black">
                                    {bank.charAt(0).toUpperCase()}
                                </div>
                                <p className="text-gray-900 dark:text-white text-sm font-bold">{bank}</p>
                            </div>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Account</p>
                            <p className="text-gray-900 dark:text-white text-sm font-mono">**** {lastFour}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Account Holder</p>
                            <p className="text-gray-900 dark:text-white text-sm font-bold">{holderName}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Processing Fee</p>
                            <p className="text-gray-900 dark:text-white text-sm font-mono">₮{fee.toLocaleString()}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Reference ID</p>
                            <p className="text-gray-900 dark:text-white text-sm font-mono bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded">{txId}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Estimated Arrival</p>
                            <p className="text-emerald-600 dark:text-emerald-400 text-sm font-bold">1-2 Business Days</p>
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="px-10 py-10 flex flex-col gap-4">
                    <button
                        onClick={() => navigate('/dashboard')}
                        className="w-full bg-gradient-to-r from-emerald-400 to-emerald-600 hover:shadow-lg hover:shadow-emerald-500/20 text-white py-4 rounded-2xl font-bold text-base transition-all flex items-center justify-center gap-2 group"
                    >
                        <span>Return to Dashboard</span>
                        <span className="material-icons-round transition-transform group-hover:translate-x-1">chevron_right</span>
                    </button>

                    <div className="flex flex-col items-center gap-5 mt-2">
                        <button
                            onClick={() => navigate('/dashboard/transactions')}
                            className="text-gray-600 dark:text-gray-400 text-sm font-semibold hover:text-gray-900 dark:hover:text-white transition-colors border-b border-gray-200 dark:border-gray-700 hover:border-gray-900 dark:hover:border-white pb-0.5"
                        >
                            View Transaction History
                        </button>

                        <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-gray-900 rounded-full border border-gray-100 dark:border-gray-700">
                            <span className="material-icons-round text-base text-gray-500 dark:text-gray-400">support_agent</span>
                            <p className="text-gray-500 dark:text-gray-400 text-[11px] font-medium">
                                Questions?{' '}
                                <button
                                    onClick={() => navigate('/contact')}
                                    className="text-emerald-600 dark:text-emerald-400 font-bold hover:underline ml-1"
                                >
                                    Contact Support
                                </button>
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default WithdrawConfirmation;
