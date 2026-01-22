import React from 'react';
import { Property, ViewState } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertyDetailsProps {
  property: Property;
  onNavigate: (view: ViewState) => void;
}

export const PropertyDetails: React.FC<PropertyDetailsProps> = ({ property, onNavigate }) => {
  const { dict } = useLanguage();

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

             {/* Location Placeholder */}
             <div className="bg-white dark:bg-charcoal p-8 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 h-64 flex items-center justify-center relative overflow-hidden group cursor-pointer">
                <div className="absolute inset-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                   <span className="material-icons-round text-6xl text-gray-300 dark:text-gray-600">map</span>
                </div>
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-white font-bold">{dict.details.location}</span>
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
                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300">
                  {dict.details.enterAmount} (₮)
                </label>
                <input 
                  type="number" 
                  defaultValue={1000000}
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-lg focus:ring-2 focus:ring-primary outline-none"
                />
                
                <div className="flex justify-between items-center text-sm p-3 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-800 dark:text-emerald-200 rounded-lg">
                  <span>{dict.details.estReturn}</span>
                  <span className="font-bold">+ ₮ 620,000</span>
                </div>

                <button className="w-full bg-primary hover:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg shadow-primary/25 transition-all active:scale-95">
                  {dict.details.investNow}
                </button>
                <p className="text-xs text-center text-gray-400 mt-4">
                  *Returns are projected and not guaranteed.
                </p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};