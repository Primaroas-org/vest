import React from 'react';
import { Property, ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { downloadReceipt } from '../utils/receipt';

interface InvestmentConfirmationProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPortfolio: () => void;
  onBrowseProperties: () => void;
  onNavigate?: (view: ViewState) => void;
  property: Property;
  investmentData?: {
    transaction_id?: string;
    shares: number;
    price_per_share: string;
    total_cost: string;
    new_balance: string;
  };
}

export const InvestmentConfirmation: React.FC<InvestmentConfirmationProps> = ({
  isOpen,
  onClose,
  onViewPortfolio,
  onBrowseProperties,
  onNavigate,
  property,
  investmentData
}) => {
  const { dict } = useLanguage();
  const { user } = useAuth();

  // Handle escape key to close modal and prevent body scroll
  React.useEffect(() => {
    if (!isOpen) {
      document.body.style.overflow = 'unset';
      return;
    }

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  // Don't render if not open - but log for debugging
  if (!isOpen) {
    if (process.env.NODE_ENV === 'development') {
      console.log('[InvestmentConfirmation] Modal not rendering - isOpen:', isOpen);
    }
    return null;
  }

  const formatDate = (date?: Date | string): string => {
    if (!date) {
      const now = new Date();
      return now.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      }) + ' • ' + now.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      }) + ' GMT+8';
    }
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    }) + ' • ' + d.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false
    }) + ' GMT+8';
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      // You could show a toast notification here
    });
  };

  const transactionId = investmentData?.transaction_id || `#FR-${Date.now().toString().slice(-7)}`;
  const shares = investmentData?.shares || 0;
  const pricePerShare = investmentData?.price_per_share || property.financials?.sharePrice || property.minInvest;
  const totalPaid = investmentData?.total_cost || '0';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      ></div>

      {/* Modal Content */}
      <div
        className="relative bg-white dark:bg-charcoal rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 w-full max-w-lg overflow-hidden z-10 max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          aria-label="Close"
        >
          <span className="material-icons-round text-2xl">close</span>
        </button>

        {/* Decorative Top Gradient */}
        <div className="h-1.5 w-full bg-gradient-to-r from-emerald-400 to-primary"></div>

        <div className="p-6 overflow-y-auto flex-1">
          {/* Success Header Section */}
          <div className="flex flex-col items-center text-center mb-6">
            <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <span className="material-icons-round text-primary text-4xl">check_circle</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-charcoal dark:text-white mb-2 font-display">
              {dict.investmentConfirmation?.title || 'Investment Confirmed'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 text-sm max-w-sm mx-auto">
              {dict.investmentConfirmation?.subtitle?.replace('{property}', property.title) || 
               `You are now a shareholder in ${property.title}. Your transaction has been processed successfully.`}
            </p>
          </div>

          {/* Receipt Ticket */}
          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-4 mb-6">
            {/* Property Info */}
            <div className="flex items-center gap-3 pb-4 border-b border-gray-200 dark:border-gray-700">
              <div className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shadow-sm">
                <img
                  src={property.image}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col min-w-0 flex-1">
                <h3 className="text-base font-bold text-charcoal dark:text-white leading-tight truncate">
                  {property.title}
                </h3>
                <p className="text-primary font-medium text-xs mt-0.5 truncate">
                  {property.location}
                </p>
                <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-1">
                  <span className="material-icons-round text-[12px]">verified</span>
                  {dict.investmentConfirmation?.verifiedProperty || 'Verified Property'}
                </span>
              </div>
            </div>

            {/* Details List */}
            <div className="space-y-3 pt-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">{dict.investmentConfirmation?.transactionId || 'Transaction ID'}</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-charcoal dark:text-white text-xs truncate max-w-[150px]">{transactionId}</span>
                  <button
                    onClick={() => copyToClipboard(transactionId)}
                    className="text-gray-400 hover:text-primary transition-colors shrink-0"
                    title="Copy ID"
                  >
                    <span className="material-icons-round text-[14px]">content_copy</span>
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">{dict.investmentConfirmation?.dateTime || 'Date & Time'}</span>
                <span className="font-medium text-charcoal dark:text-white text-xs">{formatDate()}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">{dict.investmentConfirmation?.shareQuantity || 'Share Quantity'}</span>
                <span className="font-medium text-charcoal dark:text-white text-xs">{shares.toLocaleString()} {dict.investmentConfirmation?.units || 'Units'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">{dict.investmentConfirmation?.pricePerShare || 'Price per Share'}</span>
                <span className="font-medium text-charcoal dark:text-white text-xs">{pricePerShare}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-600 dark:text-gray-400">{dict.investmentConfirmation?.platformFees || 'Platform Fees'}</span>
                <span className="font-medium text-primary text-xs">0.00 ₮</span>
              </div>

              {/* Total Divider */}
              <div className="border-t border-gray-200 dark:border-gray-700 my-3"></div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">{dict.investmentConfirmation?.totalPaid || 'Total Paid'}</span>
                <span className="text-lg font-bold text-primary">
                  {typeof totalPaid === 'string' && totalPaid.includes('₮')
                    ? totalPaid
                    : `₮ ${parseFloat(totalPaid || '0').toLocaleString()}`}
                </span>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <button
              onClick={onViewPortfolio}
              className="w-full bg-primary hover:bg-emerald-600 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md shadow-emerald-200 dark:shadow-none flex items-center justify-center gap-2 group text-sm"
            >
              <span>{dict.investmentConfirmation?.viewPortfolio || 'View in Portfolio'}</span>
              <span className="material-icons-round group-hover:translate-x-1 transition-transform text-lg">arrow_forward</span>
            </button>
            <button
              onClick={onBrowseProperties}
              className="w-full bg-transparent hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300 font-medium py-3 px-4 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors flex items-center justify-center gap-2 text-sm"
            >
              <span>{dict.investmentConfirmation?.browseProperties || 'Browse More Properties'}</span>
              <span className="material-icons-round text-gray-400 text-lg">grid_view</span>
            </button>
          </div>

          {/* Footer Links */}
          <div className="mt-4 flex items-center justify-center gap-4">
            <button
              onClick={() => {
                if (investmentData) {
                  downloadReceipt({
                    transactionId: investmentData.transaction_id || `#FR-${Date.now().toString().slice(-7)}`,
                    propertyName: property.title,
                    propertyLocation: property.location,
                    date: formatDate(),
                    shares: investmentData.shares,
                    pricePerShare: investmentData.price_per_share,
                    totalPaid: investmentData.total_cost,
                    userEmail: user?.email,
                    userName: user?.name
                  });
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
            >
              <span className="material-icons-round text-[14px]">download</span>
              {dict.investmentConfirmation?.downloadReceipt || 'Download Receipt'}
            </button>
            <span className="text-gray-300 dark:text-gray-700">|</span>
            <button
              onClick={() => {
                if (onNavigate) {
                  onNavigate('contact');
                } else {
                  window.location.href = '/contact';
                }
              }}
              className="inline-flex items-center gap-1.5 text-xs text-gray-500 hover:text-primary transition-colors"
            >
              <span className="material-icons-round text-[14px]">help</span>
              {dict.investmentConfirmation?.needHelp || 'Need help?'}
            </button>
          </div>
        </div>

        {/* Trust Badge Below */}
        <div className="pb-4 pt-2 text-center border-t border-gray-100 dark:border-gray-800">
          <p className="text-xs text-gray-400 dark:text-gray-600 flex items-center justify-center gap-2">
            <span className="material-icons-round text-[12px]">lock</span>
            {dict.investmentConfirmation?.secureTransaction || 'Secure Transaction via Blockchain Ledger'}
          </p>
        </div>
      </div>
    </div>
  );
};
