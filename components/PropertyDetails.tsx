import React, { useState } from 'react';
import { Property, ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { Modal } from './Modal';

interface PropertyDetailsProps {
  property: Property;
  onNavigate: (view: ViewState) => void;
}

// Detect if device is iOS
const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
};

// Open map based on device
const openMap = (latitude: string | number | undefined, longitude: string | number | undefined, address: string) => {
  if (!latitude || !longitude) {
    // If no coordinates, try to open with address search
    const encodedAddress = encodeURIComponent(address);
    if (isIOS()) {
      window.open(`https://maps.apple.com/?q=${encodedAddress}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
    return;
  }

  const lat = parseFloat(String(latitude));
  const lng = parseFloat(String(longitude));

  if (isNaN(lat) || isNaN(lng)) {
    // Fallback to address search if coordinates are invalid
    const encodedAddress = encodeURIComponent(address);
    if (isIOS()) {
      window.open(`https://maps.apple.com/?q=${encodedAddress}`, '_blank');
    } else {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
    return;
  }

  if (isIOS()) {
    // Apple Maps URL scheme
    window.open(`https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(address)}`, '_blank');
  } else {
    // Google Maps URL
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
  }
};

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onNavigate }) => {
  const { dict } = useLanguage();
  const { user, isAuthenticated } = useAuth();
  const [investmentAmount, setInvestmentAmount] = useState<string>(property.minInvest);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showKYCModal, setShowKYCModal] = useState(false);

  // Extract price per share from financials or minInvest
  const getPricePerShare = (): number => {
    // Try financials.sharePrice first (format: "₮ 500,000")
    if (property.financials?.sharePrice) {
      const numericStr = property.financials.sharePrice.replace(/[₮,\s]/g, '');
      const price = parseFloat(numericStr);
      if (!isNaN(price) && price > 0) return price;
    }
    // Fallback to minInvest (format: "₮ 500,000")
    if (property.minInvest) {
      const numericStr = property.minInvest.replace(/[₮,\s]/g, '');
      const price = parseFloat(numericStr);
      if (!isNaN(price) && price > 0) return price;
    }
    return 0;
  };

  // Handle input change with formatting
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove all non-digit characters
    const numericValue = value.replace(/\D/g, '');
    // Format with thousand separators
    const formatted = numericValue.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    setInvestmentAmount(formatted);
    setError(null);
  };

  // Calculate shares from amount
  const calculateShares = (amount: number): number => {
    const pricePerShare = getPricePerShare();
    if (pricePerShare === 0) return 0;
    return Math.floor(amount / pricePerShare);
  };

  // Calculate estimated return
  const calculateEstimatedReturn = (): number => {
    const amount = parseFloat(investmentAmount.replace(/,/g, '')) || 0;
    const shares = calculateShares(amount);
    const pricePerShare = getPricePerShare();
    const totalInvested = shares * pricePerShare;
    // 5 year return estimate
    return totalInvested * (property.targetReturn / 100) * 5;
  };

  // Handle investment
  const handleInvest = async () => {
    if (!isAuthenticated || !user) {
      setError('Please log in to invest');
      setTimeout(() => {
        onNavigate('login');
      }, 2000);
      return;
    }

    if (!user.isVerified) {
      // Show KYC prompt modal
      setShowKYCModal(true);
      return;
    }

    const amount = parseFloat(investmentAmount.replace(/,/g, '')) || 0;
    if (amount <= 0) {
      setError('Please enter a valid investment amount');
      return;
    }

    const pricePerShare = getPricePerShare();
    if (pricePerShare === 0) {
      setError('Invalid property price information');
      return;
    }

    const shares = calculateShares(amount);
    if (shares <= 0) {
      setError(`Minimum investment is ${pricePerShare.toLocaleString()} ₮`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        setError('Authentication required. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await fetch('/api/invest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          property_id: property.id,
          shares: shares
        })
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Investment failed');
        setLoading(false);
        return;
      }

      setSuccess(data.message || 'Investment successful!');
      setLoading(false);

      // Refresh page after 2 seconds to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      console.error('Investment error:', err);
      setError('An error occurred. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-light dark:bg-background-dark pb-20">
      {/* Back Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <button
          onClick={() => onNavigate('marketplace')}
          className="flex items-center gap-2 text-gray-600 dark:text-gray-300 hover:text-primary transition-colors font-medium"
        >
          <span className="material-icons-round">arrow_back</span>
          {dict.details.backToMarket}
        </button>
      </div>

      {/* Hero Image */}
      <div className="h-[400px] md:h-[500px] w-full relative">
        <img src={property.image} alt={property.title} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 md:p-12">
          <div className="max-w-7xl mx-auto">
            <span className="bg-primary px-3 py-1 text-white text-xs font-bold uppercase rounded-md mb-4 inline-block tracking-wider">
              {property.type}
            </span>
            <h1 className="text-4xl md:text-5xl font-extrabold text-white font-display mb-2">
              {property.title}
            </h1>
            <div className="flex items-center text-gray-300">
              <span className="material-icons-round mr-2">location_on</span>
              {property.location}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-20 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Description Card */}
            <div className="bg-white dark:bg-charcoal p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800">
              <h2 className="text-2xl font-bold mb-6 text-charcoal dark:text-white font-display">
                {dict.details.description}
              </h2>
              <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                {property.description || "Experience luxury living in the heart of Ulaanbaatar. This premium development offers state-of-the-art amenities, breathtaking city views, and unparalleled access to the business district. A perfect blend of modern architecture and traditional comfort, designed for the discerning investor."}
              </p>

              <h3 className="text-lg font-bold mb-4 text-charcoal dark:text-white font-display mt-8">
                {dict.details.financials}
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">{dict.details.sharePrice}</p>
                  <p className="font-bold text-charcoal dark:text-white">{property.financials?.sharePrice || "₮ 500,000"}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">{dict.details.totalValue}</p>
                  <p className="font-bold text-charcoal dark:text-white">{property.financials?.totalValue || "₮ 2.5B"}</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">{dict.property.targetReturn}</p>
                  <p className="font-bold text-primary">{property.targetReturn}%</p>
                </div>
                <div className="p-4 bg-gray-50 dark:bg-white/5 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase font-bold mb-1">{dict.details.occupancy}</p>
                  <p className="font-bold text-charcoal dark:text-white">{property.financials?.occupancyRate || "98%"}</p>
                </div>
              </div>
            </div>

            {/* Location Map */}
            <div className="bg-white dark:bg-charcoal rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden">
              <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                <h2 className="text-2xl font-bold text-charcoal dark:text-white font-display flex items-center gap-2">
                  <span className="material-icons-round text-primary">location_on</span>
                  {dict.details.location}
                </h2>
              </div>
              <div
                className="h-64 md:h-96 bg-gray-200 dark:bg-gray-700 flex items-center justify-center relative overflow-hidden group cursor-pointer"
                onClick={() => openMap(property.latitude, property.longitude, property.location)}
              >
                {property.latitude && property.longitude ? (
                  <>
                    {/* Static map preview using OpenStreetMap (free, no API key required) */}
                    <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700">
                      <img
                        src={`https://staticmap.openstreetmap.de/staticmap.php?center=${property.latitude},${property.longitude}&zoom=14&size=800x600&markers=${property.latitude},${property.longitude},red-pushpin`}
                        alt={property.location}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          // Fallback if image fails to load
                          const target = e.target as HTMLImageElement;
                          target.style.display = 'none';
                        }}
                      />
                      {/* Custom marker overlay for better visibility */}
                      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                        <div className="w-8 h-8 bg-primary rounded-full border-4 border-white shadow-xl flex items-center justify-center">
                          <div className="w-3 h-3 bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center pointer-events-none">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-charcoal/90 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 pointer-events-auto">
                        <span className="material-icons-round text-primary">
                          {isIOS() ? 'map' : 'explore'}
                        </span>
                        <span className="font-bold text-charcoal dark:text-white">
                          {isIOS() ? 'Open in Apple Maps' : 'Open in Google Maps'}
                        </span>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-icons-round text-6xl text-gray-300 dark:text-gray-600">map</span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white/90 dark:bg-charcoal/90 px-6 py-3 rounded-xl shadow-lg flex items-center gap-3">
                        <span className="material-icons-round text-primary">search</span>
                        <span className="font-bold text-charcoal dark:text-white">
                          Search for {property.location}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <span className="material-icons-round text-base">info</span>
                  Click the map to view location in {isIOS() ? 'Apple Maps' : 'Google Maps'}
                </p>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white dark:bg-charcoal p-6 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 sticky top-24">
              <div className="mb-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-gray-500 dark:text-gray-400 font-medium">{dict.property.progress}</span>
                  <span className="font-bold text-charcoal dark:text-white">{property.progress}% {dict.property.funded}</span>
                </div>
                <div className="w-full bg-gray-100 dark:bg-gray-800 h-3 rounded-full overflow-hidden">
                  <div className="bg-primary h-full rounded-full" style={{ width: `${property.progress}%` }}></div>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6 pb-6 border-b border-gray-100 dark:border-gray-700">
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-bold uppercase">{dict.property.targetReturn}</p>
                  <p className="text-2xl font-bold text-primary">{property.targetReturn}%</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-gray-400 font-bold uppercase">{dict.property.minInvest}</p>
                  <p className="text-2xl font-bold text-charcoal dark:text-white">{property.minInvest}</p>
                </div>
              </div>

              <div className="space-y-4">
                {error && (
                  <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-xl text-sm">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-xl text-sm">
                    {success}
                  </div>
                )}
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  {dict.details.enterAmount} (₮)
                </label>
                <div className="relative">
                  <input
                    type="text"
                    value={investmentAmount}
                    onChange={handleAmountChange}
                    placeholder="1,000,000"
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg focus:ring-2 focus:ring-primary outline-none dark:text-white"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 font-bold">₮</span>
                </div>
                {investmentAmount && (
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    Shares: {calculateShares(parseFloat(investmentAmount.replace(/,/g, '')) || 0).toLocaleString()} shares
                  </div>
                )}

                <div className="flex justify-between items-center text-sm p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 rounded-lg">
                  <span>{dict.details.estReturn}</span>
                  <span className="font-bold">+ ₮ {calculateEstimatedReturn().toLocaleString()}</span>
                </div>

                <button
                  onClick={handleInvest}
                  disabled={loading || !isAuthenticated}
                  className="w-full bg-primary hover:bg-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95">
                  {loading ? 'Processing...' : !isAuthenticated ? 'Login to Invest' : !user?.isVerified ? dict.kyc.completeKYCToInvest : dict.details.investNow}
                </button>
                <p className="text-xs text-center text-gray-400 mt-4">
                  *Returns are projected and not guaranteed.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>

      {/* KYC Prompt Modal */}
      <Modal
        isOpen={showKYCModal}
        onClose={() => setShowKYCModal(false)}
        onConfirm={() => {
          setShowKYCModal(false);
          onNavigate('kyc');
        }}
        title={dict.kyc.modalTitle || 'KYC Verification Required'}
        message={dict.kyc.investPrompt || 'KYC verification is required to invest. Would you like to complete verification now?'}
        confirmText={dict.kyc.modalConfirm || 'Complete KYC'}
        cancelText={dict.kyc.modalCancel || 'Cancel'}
        type="confirm"
      />
    </div>
  );
};