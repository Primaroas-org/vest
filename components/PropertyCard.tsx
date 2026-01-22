import React from 'react';
import { Property } from '../types';
import { useLanguage } from '../contexts/LanguageContext';

interface PropertyCardProps {
  property: Property;
  onSelect: (property: Property) => void;
}

export const PropertyCard: React.FC<PropertyCardProps> = ({ property, onSelect }) => {
  const { dict } = useLanguage();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'funding': return 'bg-primary text-white';
      case 'renting': return 'bg-blue-500 text-white';
      case 'sold': return 'bg-gray-500 text-white';
      default: return 'bg-primary text-white';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'funding': return dict.property.status.funding;
      case 'renting': return dict.property.status.renting;
      case 'sold': return dict.property.status.sold;
      default: return status;
    }
  };

  return (
    <div className="group bg-white dark:bg-charcoal rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-800 flex flex-col cursor-pointer" onClick={() => onSelect(property)}>
      <div className="relative h-64 overflow-hidden">
        <img
          src={property.image}
          alt={property.title}
          className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${property.status === 'sold' ? 'grayscale-[0.5]' : ''}`}
        />
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-charcoal/90 backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider text-charcoal dark:text-white">
          {property.type === 'Residential' ? dict.property.residential : 
           property.type === 'Commercial' ? dict.property.commercial : dict.property.mixed}
        </div>
        
        {/* Status Badge */}
        <div className={`absolute bottom-4 left-4 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider shadow-sm ${getStatusColor(property.status)}`}>
          {getStatusLabel(property.status)}
        </div>

        <button className="absolute top-4 right-4 bg-white/90 dark:bg-charcoal/90 p-2 rounded-full text-charcoal dark:text-white hover:text-red-500 transition-colors shadow-sm">
          <span className="material-icons-round text-sm">
            {property.isFavorite ? 'favorite' : 'favorite_border'}
          </span>
        </button>
      </div>
      
      <div className="p-6 flex-grow flex flex-col">
        <h3 className="text-xl font-bold mb-1 font-display group-hover:text-primary transition-colors text-charcoal dark:text-white">
          {property.title}
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 flex items-center">
          <span className="material-icons-round text-sm mr-1">location_on</span>{' '}
          {property.location}
        </p>

        <div className="space-y-4 mt-auto">
          {property.status !== 'sold' && (
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-500 dark:text-gray-400 font-medium">
                  {dict.property.progress}
                </span>
                <span className="font-bold text-charcoal dark:text-white">
                  {property.progress}% {dict.property.funded}
                </span>
              </div>
              <div className="w-full bg-gray-100 dark:bg-gray-800 h-2.5 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out ${property.status === 'renting' ? 'bg-blue-500' : 'bg-primary'}`}
                  style={{ width: `${property.progress}%` }}
                ></div>
              </div>
            </div>
          )}
          
          {property.status === 'sold' && (
             <div className="py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-center">
               <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">ROI Realized</span>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-100 dark:border-gray-800">
            <div>
              <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">
                {dict.property.targetReturn}
              </p>
              <p className={`text-lg font-bold ${property.status === 'renting' ? 'text-blue-500' : property.status === 'sold' ? 'text-gray-500' : 'text-primary'}`}>
                {property.targetReturn}%
              </p>
            </div>
            <div>
              <p className="text-[10px] uppercase text-gray-400 font-bold mb-1">
                {dict.property.minInvest}
              </p>
              <p className="text-lg font-bold text-charcoal dark:text-white">
                {property.minInvest}
              </p>
            </div>
          </div>
        </div>

        <button 
          onClick={(e) => {
            e.stopPropagation();
            onSelect(property);
          }}
          className={`w-full mt-6 py-3.5 rounded-xl font-bold transition-opacity active:scale-95 shadow-lg ${
            property.status === 'sold' 
             ? 'bg-gray-200 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400' 
             : 'bg-charcoal dark:bg-white dark:text-charcoal text-white hover:opacity-90 shadow-charcoal/10 dark:shadow-white/10'
          }`}
        >
          {property.status === 'sold' ? 'Sold Out' : dict.property.viewDetails}
        </button>
      </div>
    </div>
  );
};