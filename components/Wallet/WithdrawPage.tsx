import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { invalidateDashboardCache, cachedFetch, getCached } from '../../utils/apiCache';

const WithdrawPage: React.FC = () => {
    const navigate = useNavigate();
    const { user, refreshUser } = useAuth();
    const { dict } = useLanguage();
    const [amount, setAmount] = useState('');
    const [transferMethod, setTransferMethod] = useState<'bank' | 'qpay'>('bank');
    const [selectedCardId, setSelectedCardId] = useState<string | null>(null);
    const [cards, setCards] = useState<any[]>(() => getCached<{ data?: any[] }>('dashboard:cards')?.data || []);
    const [cardsLoading, setCardsLoading] = useState(!getCached('dashboard:cards'));
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const balance = user?.balance || 0;
    const numericAmount = parseFloat(amount.replace(/,/g, '')) || 0;
    const fee = numericAmount > 0 ? Math.round(numericAmount * 0.001) : 0; // 0.1% fee
    const netAmount = numericAmount - fee;

    useEffect(() => {
        const fetchCards = async () => {
            try {
                const token = localStorage.getItem('supabase.auth.token');
                const data = await cachedFetch('dashboard:cards', async () => {
                    const response = await fetch('/api/cards', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) throw new Error('Failed to fetch cards');
                    return response.json();
                });
                const cardsList = data.data || [];
                setCards(cardsList);
                // Auto-select default card
                const defaultCard = cardsList.find((c: any) => c.is_default);
                if (defaultCard) setSelectedCardId(defaultCard.id);
                else if (cardsList.length > 0) setSelectedCardId(cardsList[0].id);
            } catch (err) {
                console.error('Error fetching cards:', err);
            } finally {
                setCardsLoading(false);
            }
        };
        fetchCards();
    }, []);

    const formatAmount = (val: string) => {
        const num = val.replace(/[^\d]/g, '');
        if (!num) return '';
        return parseInt(num).toLocaleString();
    };

    const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setAmount(formatAmount(e.target.value));
        setError('');
    };

    const handleMaxAmount = () => {
        setAmount(Math.floor(balance).toLocaleString());
        setError('');
    };

    const handleConfirm = async () => {
        if (numericAmount <= 0) {
            setError('Please enter a valid amount');
            return;
        }
        if (numericAmount > balance) {
            setError('Insufficient balance');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const token = localStorage.getItem('supabase.auth.token');
            const response = await fetch('/api/wallet/withdraw', {
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
                const selectedCard = cards.find(c => c.id === selectedCardId);
                navigate('/dashboard/wallet/withdraw/confirm', {
                    state: {
                        amount: numericAmount,
                        fee,
                        newBalance: data.data?.new_balance || '0',
                        method: transferMethod,
                        transactionId: data.data?.transaction?.id || null,
                        bank: selectedCard?.bank_name || 'N/A',
                        lastFour: selectedCard?.last_four_digits || '****',
                        holderName: selectedCard?.card_holder_name || user?.name || 'N/A'
                    }
                });
            } else {
                setError(data.error || 'Failed to withdraw funds');
            }
        } catch (err) {
            setError('An error occurred. Please try again.');
            console.error('Withdraw error:', err);
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
                        Withdraw Funds
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">
                        Secure assets liquidation to your registered bank account.
                    </p>
                </div>
                <button
                    onClick={() => navigate('/dashboard/transactions')}
                    className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-gray-700 dark:text-gray-300 text-sm font-bold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    <span className="material-icons-round text-lg">history</span>
                    Recent Activity
                </button>
            </div>

            {/* Main Card */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl overflow-hidden">
                {/* Balance Header */}
                <div className="p-8 flex items-center justify-between border-b border-gray-100 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-900/50">
                    <div className="flex items-center gap-5">
                        <div className="bg-emerald-500/10 p-3.5 rounded-xl border border-emerald-500/20">
                            <span className="material-icons-round text-emerald-500 text-2xl">account_balance_wallet</span>
                        </div>
                        <div>
                            <p className="text-gray-500 dark:text-gray-400 text-xs uppercase tracking-widest font-bold mb-0.5">Available Balance</p>
                            <p className="text-gray-900 dark:text-white text-3xl font-black">₮ {balance.toLocaleString()}</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col lg:flex-row divide-y lg:divide-y-0 lg:divide-x divide-gray-100 dark:divide-gray-700">
                    {/* Left: Amount & Method */}
                    <div className="flex-1 p-8 space-y-8">
                        <div>
                            <div className="flex justify-between items-center mb-3">
                                <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider">Withdrawal Amount</label>
                                <button
                                    onClick={handleMaxAmount}
                                    className="text-emerald-500 text-xs font-bold hover:underline"
                                >
                                    MAX AMOUNT
                                </button>
                            </div>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={amount}
                                    onChange={handleAmountChange}
                                    className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl h-20 px-6 text-3xl font-black text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none placeholder-gray-300"
                                    placeholder="0"
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">MNT</div>
                            </div>
                            {numericAmount > 0 && (
                                <div className="flex items-center gap-2 mt-3 px-1">
                                    <span className="material-icons-round text-emerald-500 text-lg">info</span>
                                    <p className="text-gray-500 dark:text-gray-400 text-xs font-medium">
                                        Processing fee: ₮{fee.toLocaleString()} (0.1%) • Net: ₮{netAmount.toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        <div>
                            <label className="text-sm font-bold text-gray-900 dark:text-white uppercase tracking-wider block mb-4">Transfer Method</label>
                            <div className="flex gap-1 bg-gray-100 dark:bg-gray-900 p-1 rounded-xl">
                                <button
                                    onClick={() => setTransferMethod('bank')}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${transferMethod === 'bank' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Bank Transfer
                                </button>
                                <button
                                    onClick={() => setTransferMethod('qpay')}
                                    className={`flex-1 py-3 px-4 rounded-lg text-sm font-bold transition-all ${transferMethod === 'qpay' ? 'bg-white dark:bg-gray-800 shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'}`}
                                >
                                    Instant QPay
                                </button>
                            </div>
                        </div>

                        {error && (
                            <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm">
                                {error}
                            </div>
                        )}

                        <button
                            onClick={handleConfirm}
                            disabled={loading || numericAmount <= 0 || numericAmount > balance}
                            className="w-full bg-gray-900 dark:bg-white hover:bg-black dark:hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed text-white dark:text-gray-900 py-5 rounded-xl text-lg font-black uppercase tracking-wide transition-all shadow-lg active:scale-[0.99]"
                        >
                            {loading ? 'Processing...' : 'Confirm Withdrawal'}
                        </button>
                        <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                            <span className="material-icons-round text-sm">lock</span>
                            <span className="text-[11px] font-bold uppercase tracking-widest">Secured by Vest Vault</span>
                        </div>
                    </div>

                    {/* Right: Bank Selection */}
                    <div className="flex-1 p-8 bg-gray-50/30 dark:bg-gray-900/30">
                        <h3 className="text-gray-900 dark:text-white text-xl font-bold mb-6">Select Recipient Bank</h3>

                        {cardsLoading ? (
                            <div className="space-y-4">
                                {[1, 2].map(i => (
                                    <div key={i} className="h-20 bg-gray-100 dark:bg-gray-700 rounded-xl animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
                                {cards.map(card => (
                                    <div
                                        key={card.id}
                                        onClick={() => setSelectedCardId(card.id)}
                                        className={`relative bg-white dark:bg-gray-800 rounded-xl p-5 cursor-pointer transition-all ${selectedCardId === card.id ? 'border-2 border-emerald-500 shadow-sm' : 'border border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="size-12 rounded-lg bg-gray-900 dark:bg-gray-700 flex items-center justify-center">
                                                <span className="text-white font-black text-[10px]">{card.bank_name?.slice(0, 4).toUpperCase()}</span>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-gray-900 dark:text-white font-bold">{card.bank_name}</p>
                                                <p className="text-gray-500 dark:text-gray-400 text-sm font-mono">**** **** **** {card.last_four_digits}</p>
                                            </div>
                                            <span className={`material-icons-round ${selectedCardId === card.id ? 'text-emerald-500' : 'text-gray-200 dark:text-gray-600'}`}>
                                                {selectedCardId === card.id ? 'check_circle' : 'radio_button_unchecked'}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={() => navigate('/dashboard/wallet')}
                                    className="w-full border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-xl p-5 flex items-center justify-center gap-3 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:border-gray-400 dark:hover:border-gray-500 transition-all"
                                >
                                    <span className="material-icons-round">add_circle</span>
                                    <span className="font-bold text-sm">Register New Account</span>
                                </button>
                            </div>
                        )}

                        {/* QPay section */}
                        {transferMethod === 'qpay' && (
                            <div className="mt-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-sm">
                                <div className="flex justify-between items-center mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-red-600 px-2 py-1 rounded">
                                            <span className="text-white font-black text-[9px]">QPAY</span>
                                        </div>
                                        <p className="text-gray-900 dark:text-white font-bold text-sm">Instant Payout</p>
                                    </div>
                                    <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-2.5 py-1 rounded-full uppercase font-black">Ultra Fast</span>
                                </div>
                                <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">
                                    Receive funds immediately via the QPay settlement network.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Feature badges */}
            <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-8">
                {[
                    { icon: 'shield_locked', title: 'Institutional Security', desc: 'Multi-signature authorization for high-value transactions.' },
                    { icon: 'bolt', title: 'Direct Settlement', desc: 'Real-time integration with Mongolian interbank clearing systems.' },
                    { icon: 'support_agent', title: 'Elite Concierge', desc: '24/7 dedicated support desk for private equity clients.' },
                ].map(f => (
                    <div key={f.title} className="flex flex-col gap-3 p-2">
                        <span className="material-icons-round text-emerald-500 text-3xl">{f.icon}</span>
                        <p className="text-gray-900 dark:text-white font-extrabold text-sm">{f.title}</p>
                        <p className="text-gray-500 dark:text-gray-400 text-xs leading-relaxed">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default WithdrawPage;
