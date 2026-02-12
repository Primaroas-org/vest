import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Property, ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './Modal';

interface CheckoutProps {
  property: Property;
  initialShares?: number;
  onNavigate: (view: ViewState) => void;
  onComplete: (shares: number, paymentMethod?: string) => void;
}

export const Checkout: React.FC<CheckoutProps> = ({ 
  property, 
  initialShares = 0,
  onNavigate,
  onComplete 
}) => {
  const { dict } = useLanguage();
  const { user, resetSessionTimeout } = useAuth();
  const navigate = useNavigate();
  const [shares, setShares] = useState<number>(initialShares || 10);
  const [paymentMethod, setPaymentMethod] = useState<string>('wallet');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cards, setCards] = useState<any[]>([]);
  const [cardsLoading, setCardsLoading] = useState(true);
  const [showNoCardModal, setShowNoCardModal] = useState(false);

  // Extract price per share
  const getPricePerShare = (): number => {
    if (property.financials?.sharePrice) {
      const numericStr = property.financials.sharePrice.replace(/[₮,\s]/g, '');
      const price = parseFloat(numericStr);
      if (!isNaN(price) && price > 0) return price;
    }
    if (property.minInvest) {
      const numericStr = property.minInvest.replace(/[₮,\s]/g, '');
      const price = parseFloat(numericStr);
      if (!isNaN(price) && price > 0) return price;
    }
    return 0;
  };

  const pricePerShare = getPricePerShare();
  const subtotal = shares * pricePerShare;
  const platformFee = 0; // Platform fee is waived
  const total = subtotal + platformFee;
  const minShares = 1;

  // Fetch user's saved cards
  useEffect(() => {
    const fetchCards = async () => {
      if (!user) {
        setCardsLoading(false);
        return;
      }

      try {
        const token = localStorage.getItem('supabase.auth.token');
        const response = await fetch('/api/cards', {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          setCards(data.data || []);
        }
      } catch (error) {
        console.error('Error fetching cards:', error);
      } finally {
        setCardsLoading(false);
      }
    };

    fetchCards();
  }, [user]);

  const handleSharesChange = (delta: number) => {
    const newShares = Math.max(minShares, shares + delta);
    setShares(newShares);
    setError(null);
  };

  const handleSharesInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = parseInt(e.target.value) || minShares;
    setShares(Math.max(minShares, value));
    setError(null);
  };

  const handleConfirm = async () => {
    if (!user) {
      setError('Please log in to continue');
      setTimeout(() => {
        if (onNavigate) {
          onNavigate('login');
        } else {
          navigate('/login');
        }
      }, 2000);
      return;
    }

    if (shares < minShares) {
      setError(`Minimum purchase is ${minShares} share${minShares > 1 ? 's' : ''}`);
      return;
    }

    // Check if bank transfer is selected but user has no cards
    if (paymentMethod === 'bank') {
      if (cardsLoading) {
        setError('Loading payment methods...');
        setLoading(false);
        return;
      }
      
      if (cards.length === 0) {
        setShowNoCardModal(true);
        setLoading(false);
        return;
      }
    }

    // Check wallet balance if wallet payment is selected
    if (paymentMethod === 'wallet') {
      if (!user.balance || user.balance < total) {
        setError('Insufficient wallet balance. Please add funds or choose bank transfer.');
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    setError(null);

    try {
      // Call the onComplete callback with the shares and payment method
      await onComplete(shares, paymentMethod);
    } catch (err) {
      console.error('Checkout error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      {/* Header */}
      <header className="sticky top-0 z-40 w-full border-b border-gray-100 dark:border-gray-800 bg-white/90 dark:bg-charcoal/90 backdrop-blur-md px-4 sm:px-6 lg:px-8 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('marketplace');
                } else {
                  navigate('/');
                }
              }}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors"
            >
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="text-primary size-8">
                <svg fill="none" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                  <g clipPath="url(#clip0_6_543)">
                    <path d="M42.1739 20.1739L27.8261 5.82609C29.1366 7.13663 28.3989 10.1876 26.2002 13.7654C24.8538 15.9564 22.9595 18.3449 20.6522 20.6522C18.3449 22.9595 15.9564 24.8538 13.7654 26.2002C10.1876 28.3989 7.13663 29.1366 5.82609 27.8261L20.1739 42.1739C21.4845 43.4845 24.5355 42.7467 28.1133 40.548C30.3042 39.2016 32.6927 37.3073 35 35C37.3073 32.6927 39.2016 30.3042 40.548 28.1133C42.7467 24.5355 43.4845 21.4845 42.1739 20.1739Z" fill="currentColor"></path>
                    <path clipRule="evenodd" d="M7.24189 26.4066C7.31369 26.4411 7.64204 26.5637 8.52504 26.3738C9.59462 26.1438 11.0343 25.5311 12.7183 24.4963C14.7583 23.2426 17.0256 21.4503 19.238 19.238C21.4503 17.0256 23.2426 14.7583 24.4963 12.7183C25.5311 11.0343 26.1438 9.59463 26.3738 8.52504C26.5637 7.64204 26.4411 7.31369 26.4066 7.24189C26.345 7.21246 26.143 7.14535 25.6664 7.1918C24.9745 7.25925 23.9954 7.5498 22.7699 8.14278C20.3369 9.32007 17.3369 11.4915 14.4142 14.4142C11.4915 17.3369 9.32007 20.3369 8.14278 22.7699C7.5498 23.9954 7.25925 24.9745 7.1918 25.6664C7.14534 26.143 7.21246 26.345 7.24189 26.4066ZM29.9001 10.7285C29.4519 12.0322 28.7617 13.4172 27.9042 14.8126C26.465 17.1544 24.4686 19.6641 22.0664 22.0664C19.6641 24.4686 17.1544 26.465 14.8126 27.9042C13.4172 28.7617 12.0322 29.4519 10.7285 29.9001L21.5754 40.747C21.6001 40.7606 21.8995 40.931 22.8729 40.7217C23.9424 40.4916 25.3821 39.879 27.0661 38.8441C29.1062 37.5904 31.3734 35.7982 33.5858 33.5858C35.7982 31.3734 37.5904 29.1062 38.8441 27.0661C39.879 25.3821 40.4916 23.9425 40.7216 22.8729C40.931 21.8995 40.7606 21.6001 40.747 21.5754L29.9001 10.7285ZM29.2403 4.41187L43.5881 18.7597C44.9757 20.1473 44.9743 22.1235 44.6322 23.7139C44.2714 25.3919 43.4158 27.2666 42.252 29.1604C40.8128 31.5022 38.8165 34.012 36.4142 36.4142C34.012 38.8165 31.5022 40.8128 29.1604 42.252C27.2666 43.4158 25.3919 44.2714 23.7139 44.6322C22.1235 44.9743 20.1473 44.9757 18.7597 43.5881L4.41187 29.2403C3.29027 28.1187 3.08209 26.5973 3.21067 25.2783C3.34099 23.9415 3.8369 22.4852 4.54214 21.0277C5.96129 18.0948 8.43335 14.7382 11.5858 11.5858C14.7382 8.43335 18.0948 5.9613 21.0277 4.54214C22.4852 3.8369 23.9415 3.34099 25.2783 3.21067C26.5973 3.08209 28.1187 3.29028 29.2403 4.41187Z" fill="currentColor" fillRule="evenodd"></path>
                  </g>
                  <defs>
                    <clipPath id="clip0_6_543"><rect fill="white" height="48" width="48"></rect></clipPath>
                  </defs>
                </svg>
              </div>
              <h2 className="text-charcoal dark:text-white text-lg font-bold leading-tight tracking-tight">Vest</h2>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-gray-100 dark:bg-white/10 px-3 py-1.5 rounded-full">
            <span className="material-icons-round text-primary text-sm">lock</span>
            <span className="text-sm font-semibold text-charcoal dark:text-white">
              {dict.investmentConfirmation?.secureTransaction?.split(' ')[0] || 'Secure'} Checkout
            </span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl sm:text-4xl font-black text-charcoal dark:text-white leading-tight tracking-tight mb-2 font-display">
            {dict.details?.investNow || 'Complete Your Investment'} - {property.title}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 font-normal">
            {dict.details?.investNow || 'Finalize your share purchase securely'}.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Investment Configuration */}
          <div className="lg:col-span-7 xl:col-span-8 flex flex-col gap-6">
            {/* Property Card */}
            <section className="bg-white dark:bg-charcoal rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
              <h3 className="text-lg font-bold text-charcoal dark:text-white mb-4">
                {dict.details?.financials || 'Investment Target'}
              </h3>
              <div className="flex flex-col sm:flex-row gap-5">
                <div className="w-full sm:w-1/3 aspect-video rounded-lg bg-gray-200 dark:bg-gray-700 overflow-hidden relative">
                  <img
                    src={property.image}
                    alt={property.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex flex-col justify-center gap-2 flex-1">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-xl font-bold text-charcoal dark:text-white leading-tight">
                        {property.title}
                      </h4>
                      <p className="text-gray-500 dark:text-gray-400 text-sm mt-1 flex items-center gap-1">
                        <span className="material-icons-round text-[18px]">location_on</span>
                        {property.location}
                      </p>
                    </div>
                    <span className="bg-primary/10 text-primary text-xs font-bold px-2 py-1 rounded-md whitespace-nowrap">
                      {property.targetReturn}% {dict.property?.targetReturn || 'Yield'}
                    </span>
                  </div>
                  <div className="mt-2 grid grid-cols-2 gap-4 border-t border-dashed border-gray-200 dark:border-gray-700 pt-3">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dict.property?.targetReturn || 'Est. Annual Return'}
                      </p>
                      <p className="text-sm font-semibold text-primary">{property.targetReturn}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {dict.details?.sharePrice || 'Price per Share'}
                      </p>
                      <p className="text-sm font-semibold text-charcoal dark:text-white">
                        {property.financials?.sharePrice || property.minInvest}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Configuration & Payment */}
            <section className="bg-white dark:bg-charcoal rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6">
              <h3 className="text-lg font-bold text-charcoal dark:text-white mb-6">
                {dict.details?.calculator || 'Order Details'}
              </h3>

              {/* Share Input */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-charcoal dark:text-gray-200 mb-2">
                  {dict.investmentConfirmation?.shareQuantity || 'Number of Shares'}
                </label>
                <div className="relative max-w-md">
                  <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-primary focus-within:border-transparent transition-all bg-white dark:bg-gray-800">
                    <button
                      onClick={() => handleSharesChange(-1)}
                      disabled={shares <= minShares}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors border-r border-gray-100 dark:border-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <span className="material-icons-round text-sm">remove</span>
                    </button>
                    <input
                      className="w-full border-none focus:ring-0 text-center font-bold text-lg bg-transparent text-charcoal dark:text-white p-2"
                      min={minShares}
                      type="number"
                      value={shares}
                      onChange={handleSharesInput}
                    />
                    <button
                      onClick={() => handleSharesChange(1)}
                      className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 transition-colors border-l border-gray-100 dark:border-gray-700"
                    >
                      <span className="material-icons-round text-sm">add</span>
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                    {dict.details?.minInvest || 'Minimum purchase'}: {minShares} {dict.investmentConfirmation?.units?.toLowerCase() || 'share'}{minShares > 1 ? 's' : ''}
                  </p>
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-sm font-medium text-charcoal dark:text-gray-200 mb-4">
                  {dict.dashboard?.wallet?.balance || 'Payment Method'}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Wallet Payment */}
                  <label className="cursor-pointer group relative">
                    <input
                      checked={paymentMethod === 'wallet'}
                      onChange={() => setPaymentMethod('wallet')}
                      className="peer sr-only"
                      name="payment"
                      type="radio"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      paymentMethod === 'wallet' 
                        ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 bg-white dark:bg-gray-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                          paymentMethod === 'wallet'
                            ? 'bg-white dark:bg-gray-800 text-primary'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className="material-icons-round">account_balance_wallet</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-charcoal dark:text-white">
                            {dict.dashboard?.wallet?.balance || 'Wallet'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            {user?.balance ? `₮ ${user.balance.toLocaleString()}` : 'Balance available'}
                          </p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'wallet' ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {paymentMethod === 'wallet' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                  </label>

                  {/* Bank Transfer */}
                  <label className="cursor-pointer group relative">
                    <input
                      checked={paymentMethod === 'bank'}
                      onChange={() => setPaymentMethod('bank')}
                      className="peer sr-only"
                      name="payment"
                      type="radio"
                    />
                    <div className={`p-4 rounded-xl border-2 transition-all flex items-center justify-between ${
                      paymentMethod === 'bank' 
                        ? 'border-primary bg-primary/5 dark:bg-primary/10' 
                        : 'border-gray-200 dark:border-gray-700 hover:border-primary/50 dark:hover:border-primary/50 bg-white dark:bg-gray-800'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-sm ${
                          paymentMethod === 'bank'
                            ? 'bg-white dark:bg-gray-800 text-primary'
                            : 'bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                        }`}>
                          <span className="material-icons-round">account_balance</span>
                        </div>
                        <div>
                          <p className="font-bold text-sm text-charcoal dark:text-white">Bank Transfer</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Khan Bank, Golomt</p>
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        paymentMethod === 'bank' ? 'border-primary' : 'border-gray-300 dark:border-gray-600'
                      }`}>
                        {paymentMethod === 'bank' && (
                          <div className="w-2.5 h-2.5 rounded-full bg-primary"></div>
                        )}
                      </div>
                    </div>
                  </label>
                </div>
              </div>
            </section>

            {/* Personal Info Preview */}
            {user && (
              <section className="bg-white dark:bg-charcoal rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 p-4 sm:p-6 opacity-90">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-charcoal dark:text-white">
                    {dict.dashboard?.settings?.personalInfo || 'Investor Profile'}
                  </h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {dict.auth?.name || 'Full Name'}
                    </p>
                    <p className="font-medium text-charcoal dark:text-white">{user.name}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">
                      {dict.auth?.email || 'Email'}
                    </p>
                    <p className="font-medium text-charcoal dark:text-white">{user.email}</p>
                  </div>
                </div>
              </section>
            )}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                {error}
              </div>
            )}
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="lg:col-span-5 xl:col-span-4 relative">
            <div className="sticky top-24 space-y-6">
              <div className="bg-white dark:bg-charcoal rounded-xl shadow-lg border border-gray-100 dark:border-gray-800 overflow-hidden">
                {/* Header */}
                <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                  <h3 className="text-lg font-bold text-charcoal dark:text-white">
                    {dict.details?.financials || 'Order Summary'}
                  </h3>
                </div>

                {/* Line Items */}
                <div className="px-6 py-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {dict.details?.sharePrice || 'Share Price'}
                    </span>
                    <span className="text-charcoal dark:text-white font-medium text-sm">
                      {property.financials?.sharePrice || property.minInvest}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">
                      {dict.investmentConfirmation?.shareQuantity || 'Quantity'}
                    </span>
                    <span className="text-charcoal dark:text-white font-medium text-sm">x {shares.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-500 dark:text-gray-400 text-sm">Subtotal</span>
                    <span className="text-charcoal dark:text-white font-medium text-sm">
                      ₮ {subtotal.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <div className="flex items-center gap-1">
                      <span className="text-gray-500 dark:text-gray-400 text-sm">
                        {dict.investmentConfirmation?.platformFees || 'Platform Fee'}
                      </span>
                      <span className="material-icons-round text-gray-400 text-[16px] cursor-help" title="Fees cover platform maintenance">
                        help
                      </span>
                    </div>
                    <span className="text-primary font-medium text-sm">Waived (0%)</span>
                  </div>
                </div>

                {/* Divider */}
                <div className="border-t border-dashed border-gray-200 dark:border-gray-700 mx-6"></div>

                {/* Total */}
                <div className="px-6 py-6">
                  <div className="flex justify-between items-end mb-1">
                    <span className="text-charcoal dark:text-white font-bold text-lg">
                      {dict.investmentConfirmation?.totalPaid || 'Total Due'}
                    </span>
                    <span className="text-3xl font-black text-charcoal dark:text-white tracking-tight">
                      ₮ {total.toLocaleString()}
                    </span>
                  </div>
                  <p className="text-right text-xs text-gray-500 dark:text-gray-400">MNT (Mongolian Tugrik)</p>
                </div>

                {/* Action */}
                <div className="p-6 pt-0">
                  <button
                    onClick={handleConfirm}
                    disabled={loading || !user || shares < minShares || (paymentMethod === 'wallet' && user && user.balance < total) || (paymentMethod === 'bank' && cardsLoading)}
                    className="w-full group bg-gradient-to-r from-primary to-emerald-600 hover:to-emerald-700 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-500/20 transition-all transform active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <>
                        <span className="material-icons-round animate-spin">refresh</span>
                        <span>{dict.details?.investNow || 'Processing...'}</span>
                      </>
                    ) : (
                      <>
                        <span>{dict.details?.investNow || 'Confirm & Purchase'}</span>
                        <span className="material-icons-round group-hover:translate-x-1 transition-transform">arrow_forward</span>
                      </>
                    )}
                  </button>
                  {paymentMethod === 'wallet' && user && user.balance < total && (
                    <p className="text-center text-xs text-red-500 dark:text-red-400 mt-2">
                      {dict.dashboard?.wallet?.balance || 'Insufficient'} {dict.dashboard?.wallet?.balance || 'balance'}
                    </p>
                  )}
                  {paymentMethod === 'bank' && cards.length > 0 && (
                    <p className="text-center text-xs text-gray-500 dark:text-gray-400 mt-2">
                      {cards.find((c: any) => c.isDefault) 
                        ? `Using card: ${cards.find((c: any) => c.isDefault)?.bankName} ****${cards.find((c: any) => c.isDefault)?.lastFourDigits}`
                        : `Using card: ${cards[0]?.bankName} ****${cards[0]?.lastFourDigits}`
                      }
                    </p>
                  )}
                  <p className="text-center text-xs text-gray-500 dark:text-gray-500 mt-4 leading-relaxed px-4">
                    {dict.pages?.aboutDesc || 'By clicking Confirm, you agree to the'} <a className="underline hover:text-primary" href="/terms">{dict.footer?.terms || 'Terms of Service'}</a> {dict.pages?.aboutDesc?.includes('and') ? 'and' : ''} <a className="underline hover:text-primary" href="/terms">{dict.footer?.terms || 'Investment Agreement'}</a>.
                  </p>
                </div>
              </div>

              {/* Trust Signals */}
              <div className="flex justify-center items-center gap-6 py-2 opacity-80">
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span className="material-icons-round text-primary text-xl">verified_user</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">Bank-Level Security</span>
                </div>
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                  <span className="material-icons-round text-primary text-xl">lock</span>
                  <span className="text-xs font-semibold uppercase tracking-wider">256-bit SSL</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* No Card Modal */}
      <Modal
        isOpen={showNoCardModal}
        onClose={() => setShowNoCardModal(false)}
        onCancel={() => {
          // Reset session timeout to prevent premature logout during navigation
          if (resetSessionTimeout) {
            resetSessionTimeout();
          }
          // Navigate to dashboard wallet tab using React Router (no page reload)
          navigate('/dashboard/wallet');
          setShowNoCardModal(false);
        }}
        onConfirm={async () => {
          setShowNoCardModal(false);
          setPaymentMethod('wallet');
          // Check wallet balance before proceeding
          if (!user?.balance || user.balance < total) {
            setError('Insufficient wallet balance. Please add funds to your wallet.');
            return;
          }
          // Proceed with wallet payment
          setLoading(true);
          setError(null);
          try {
            await onComplete(shares, 'wallet');
          } catch (err) {
            console.error('Checkout error:', err);
            setError('An error occurred. Please try again.');
            setLoading(false);
          }
        }}
        title={dict.dashboard?.wallet?.cards ? 'No Payment Cards' : 'No Payment Cards'}
        message={
          dict.dashboard?.wallet?.cards
            ? 'You don\'t have any saved payment cards. Would you like to use your wallet balance instead, or add a card in your dashboard?'
            : 'You don\'t have any saved payment cards. Would you like to use your wallet balance instead, or add a card in your dashboard?'
        }
        confirmText={dict.dashboard?.wallet?.balance ? 'Use Wallet' : 'Use Wallet'}
        cancelText={dict.dashboard?.wallet?.cards ? 'Add Card' : 'Add Card'}
        type="confirm"
      />
    </div>
  );
};
