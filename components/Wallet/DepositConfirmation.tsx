import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

interface LocationState {
    amount: number;
    newBalance: string;
    method: string;
    transactionId: string | null;
}

const DepositConfirmation: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const state = location.state as LocationState | null;

    const amount = state?.amount || 0;
    const newBalance = state?.newBalance || '0';
    const method = state?.method === 'bank' ? 'Bank Transfer' : 'QPay';
    const txId = state?.transactionId ? `#RE-${state.transactionId.slice(-6).toUpperCase()}` : '#RE-000000';

    return (
        <div className="max-w-2xl mx-auto w-full">
            {/* Status Icon & Headline */}
            <div className="flex flex-col items-center mb-8">
                <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mb-6">
                    <span className="material-icons-round text-emerald-500 text-5xl">check_circle</span>
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white text-center tracking-tight">
                    Deposit Successful
                </h1>
                <p className="text-gray-500 dark:text-gray-400 text-center mt-2 max-w-md">
                    Your funds have been credited to your wallet and are ready to invest.
                </p>
            </div>

            {/* Amount Display */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-6">
                <div className="p-8 flex flex-col items-center justify-center bg-gray-50/50 dark:bg-gray-900/50 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest font-bold mb-2">Deposited Amount</p>
                    <div className="flex items-baseline gap-2">
                        <span className="text-gray-900 dark:text-white text-5xl font-extrabold tracking-tighter">
                            ₮{amount.toLocaleString()}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400 text-xl font-medium">MNT</span>
                    </div>
                </div>

                {/* Transaction Details */}
                <div className="p-6">
                    <h3 className="text-gray-900 dark:text-white text-sm font-bold uppercase tracking-wider mb-5 flex items-center gap-3">
                        Transaction Summary
                        <div className="h-px flex-1 bg-gray-100 dark:bg-gray-700"></div>
                    </h3>
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Payment Method</p>
                            <p className="text-gray-900 dark:text-white text-sm font-bold">{method}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Reference ID</p>
                            <p className="text-gray-900 dark:text-white text-sm font-mono bg-gray-50 dark:bg-gray-900 px-2 py-0.5 rounded">{txId}</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">Network Fee</p>
                            <p className="text-emerald-500 text-sm font-bold">0 ₮ (Free)</p>
                        </div>
                        <div className="flex justify-between items-center">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">New Wallet Balance</p>
                            <p className="text-gray-900 dark:text-white text-sm font-bold">
                                ₮{parseFloat(newBalance).toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                >
                    Go to Marketplace
                    <span className="material-icons-round text-lg">arrow_forward</span>
                </button>
                <button
                    onClick={() => navigate('/dashboard/wallet')}
                    className="w-full bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white py-4 rounded-xl font-bold transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                    View Wallet
                </button>
            </div>

            {/* Support */}
            <div className="mt-8 flex justify-center items-center gap-2">
                <p className="text-gray-500 dark:text-gray-400 text-sm">Need help with your deposit?</p>
                <button
                    onClick={() => navigate('/contact')}
                    className="text-emerald-500 text-sm font-semibold hover:underline"
                >
                    Contact Support
                </button>
            </div>

            {/* Trust indicators */}
            <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700 flex justify-center gap-8 opacity-50">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="material-icons-round text-sm">lock</span>
                    <span className="text-xs font-medium">Secured by QPay</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <span className="material-icons-round text-sm">security</span>
                    <span className="text-xs font-medium">Bank Level Security</span>
                </div>
            </div>
        </div>
    );
};

export default DepositConfirmation;
