import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { invalidateDashboardCache } from '../../utils/apiCache';

const QUICK_AMOUNTS = [500000, 1000000, 5000000];

const DepositPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { dict } = useLanguage();
    const [amount, setAmount] = useState('');
    const [paymentMethod, setPaymentMethod] = useState<'qpay' | 'bank'>('qpay');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;

    const formatAmount = (val: string) => {
        const num = val.replace(/[^\d]/g, '');
        if (!num) return '';
        return parseInt(num).toLocaleString();
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(formatAmount(e.target.value));
        setError('');
    };

    const handleQuickAdd = (quickAmount: number) => {
        const current = numericAmount;
        setAmount((current + quickAmount).toLocaleString());
        setError('');
    };

    const handleConfirm = async () => {
        if (numericAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('supabase.auth.token');
            const response = await fetch('/api/wallet/deposit', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ amount: numericAmount })
            });

            const data = await response.json();

            if (response.ok && data.success) {
                invalidateDashboardCache();
                refreshUser().catch(console.error);
                // Navigate to confirmation with transaction data
                navigate('/dashboard/wallet/deposit/confirm', {
                    state: {
                        amount: numericAmount,
                        newBalance: data.data?.new_balance || '0',
                        method: paymentMethod,
                        transactionId: data.data?.transaction?.id || null
                    }
                });
            } else {
                setError(data.error || 'Failed to deposit funds');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Deposit error:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-5xl mx-auto w-full">
            {/* Page Header */}
            <div className="flex flex-wrap justify-between items-end gap-4 mb-8">
                <div>
                    <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                        Deposit Funds
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Enhance your portfolio with secure MNT deposits.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/transactions')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <span className="material-icons-round text-lg">history</span>
                    View History
                </button>
            </div>

            {/* Central Deposit Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden flex flex-col lg:flex-row">
                {/* Left: Amount Entry */}
                <div className="w-full lg:w-1/2 p-8 border-b lg:border-b-0 lg:border-r border-gray-100 dark:border-gray-700">
                    <div className="mb-8">
                        <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                            <span className="flex items-center justify-center size-6 bg-emerald-500 text-white rounded-full text-xs font-bold">1</span>
                            Enter Deposit Amount
                        </h3>
                        <div className="space-y-6">
                            <div className="flex flex-col gap-2">
                                <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount (MNT)</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={amount}
                                        onChange={handleAmountChange}
                                        className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl h-16 px-5 text-2xl font-bold text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                                        placeholder="0"
                                    />
                                    <span className="absolute right-5 top-1/2 -translate-y-1/2 font-bold text-gray-400">MNT</span>
                                </div>
                            </div>

                            {/* Quick-add buttons */}
                            <div className="grid grid-cols-3 gap-3">
                                {QUICK_AMOUNTS.map((qa) => (
                                    <button
                                        key={qa}
                                        onClick={() => handleQuickAdd(qa)}
                                        className="py-2.5 px-3 text-sm font-bold rounded-lg border border-gray-200 dark:border-gray-600 hover:border-emerald-500 hover:bg-emerald-500/5 text-gray-700 dark:text-gray-300 dark:hover:text-emerald-400 transition-all"
                                    >
                                        + {qa >= 1000000 ? `${qa / 1000000}M` : `${qa / 1000}k`}
                                    </button>
                                ))}
                            </div>

                            {/* Estimated growth */}
                            {numericAmount > 0 && (
                                <div className="p-4 bg-emerald-500/5 rounded-xl border border-emerald-500/20">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm text-gray-500 dark:text-gray-400">Estimated Portfolio Growth</span>
                                        <span className="text-sm font-bold text-emerald-500">+12.4% p.a.</span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                                        <div className="bg-emerald-500 h-full w-[70%] rounded-full"></div>
                                    </div>
                                </div>
                            )}

                            {/* Fee breakdown */}
                            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Platform Fee</span>
                                    <span className="font-medium text-gray-900 dark:text-white">0 MNT</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-500 dark:text-gray-400">Total to be Credited</span>
                                    <span className="font-bold text-gray-900 dark:text-white">{numericAmount > 0 ? `${numericAmount.toLocaleString()} MNT` : '—'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                            {error}
                        </div>
                    )}

                    <button
                        onClick={handleConfirm}
                        disabled={loading || numericAmount <= 0}
                        className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-500/20 transition-all flex items-center justify-center gap-2"
                    >
                        {loading ? (
                            <>
                                <span className="material-icons-round animate-spin text-lg">progress_activity</span>
                                Processing...
                            </>
                        ) : (
                            <>
                                Confirm Deposit
                                <span className="material-icons-round">arrow_forward</span>
                            </>
                        )}
                    </button>
                </div>

                {/* Right: Payment Methods */}
                <div className="w-full lg:w-1/2 bg-gray-50/50 dark:bg-gray-900/50 p-8">
                    <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-gray-900 dark:text-white">
                        <span className="flex items-center justify-center size-6 bg-emerald-500 text-white rounded-full text-xs font-bold">2</span>
                        Choose Payment Method
                    </h3>

                    {/* Tabs */}
                    <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
                        <button
                            onClick={() => setPaymentMethod('qpay')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-all ${paymentMethod === 'qpay' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <span className="material-icons-round text-lg">qr_code_2</span>
                            QPay
                        </button>
                        <button
                            onClick={() => setPaymentMethod('bank')}
                            className={`flex-1 py-3 text-sm font-bold border-b-2 flex items-center justify-center gap-2 transition-all ${paymentMethod === 'bank' ? 'border-emerald-500 text-emerald-500' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                        >
                            <span className="material-icons-round text-lg">account_balance</span>
                            Bank Transfer
                        </button>
                    </div>

                    {paymentMethod === 'qpay' ? (
                        <div className="flex flex-col items-center">
                            {/* QR Code placeholder */}
                            <div className="relative p-6 bg-white dark:bg-gray-800 rounded-2xl border-2 border-emerald-500/30 shadow-sm mb-6">
                                <div className="size-48 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-600">
                                    <div className="text-center">
                                        <span className="material-icons-round text-5xl text-gray-300 dark:text-gray-500">qr_code_2</span>
                                        <p className="text-xs text-gray-400 mt-2">QPay QR Code</p>
                                    </div>
                                </div>
                                <div className="absolute -top-3 -right-3 bg-emerald-500 text-white px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest animate-pulse">
                                    Active
                                </div>
                            </div>
                            <p className="text-center text-sm text-gray-500 dark:text-gray-400 mb-6 max-w-[280px]">
                                Scan the QR code with your <span className="text-gray-900 dark:text-white font-bold">Khan Bank, TDB, or Golomt</span> app to pay instantly.
                            </p>

                            {/* Bank logos */}
                            <div className="w-full p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <p className="text-[10px] uppercase font-bold text-gray-500 dark:text-gray-400 mb-3">Instant Banking Links</p>
                                <div className="flex justify-around items-center">
                                    {[
                                        { name: 'KHAN', color: 'bg-red-600' },
                                        { name: 'TDB', color: 'bg-blue-800' },
                                        { name: 'GOL', color: 'bg-orange-500' },
                                        { name: 'S.PAY', color: 'bg-gray-900 dark:bg-gray-700' },
                                    ].map(bank => (
                                        <div key={bank.name} className={`size-10 ${bank.color} rounded-lg flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-transform`}>
                                            <span className="text-white text-[10px] font-black">{bank.name}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase mb-3">Transfer to Account</p>
                                <div className="space-y-3">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Bank</span>
                                        <span className="font-bold text-gray-900 dark:text-white">Khan Bank</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Account Number</span>
                                        <span className="font-mono font-bold text-gray-900 dark:text-white">5001 2345 6789</span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-500 dark:text-gray-400">Account Name</span>
                                        <span className="font-bold text-gray-900 dark:text-white">Vest Capital LLC</span>
                                    </div>
                                </div>
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                Transfer the exact amount to the account above and your wallet will be credited within 5-10 minutes after verification.
                            </p>
                        </div>
                    )}

                    {/* Security note */}
                    <div className="mt-8 flex gap-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700">
                        <span className="material-icons-round text-emerald-500">verified_user</span>
                        <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                            Your transaction is protected by bank-grade SSL encryption. Funds usually arrive within minutes.
                        </p>
                    </div>
                </div>
            </div>

            {/* Trust badges */}
            <div className="mt-10 flex flex-wrap justify-center gap-8 opacity-50">
                {[
                    { icon: 'security', label: 'PCI DSS Compliant' },
                    { icon: 'verified', label: 'Bank Verified' },
                    { icon: 'account_balance_wallet', label: 'MNT Custody Protected' },
                ].map(badge => (
                    <div key={badge.label} className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:opacity-100 transition-opacity">
                        <span className="material-icons-round text-lg">{badge.icon}</span>
                        <span className="text-xs font-bold uppercase tracking-widest">{badge.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default DepositPage;
