export type PropertyStatus = 'funding' | 'renting' | 'sold';

export interface Property {
  id: string | number;
  title: string;
  location: string;
  type: 'Residential' | 'Commercial' | 'Mixed Use';
  status: PropertyStatus;
  image: string;
  progress: number;
  targetReturn: number;
  minInvest: string;
  isFavorite: boolean;
  description?: string;
  latitude?: string | number;
  longitude?: string | number;
  financials?: {
    totalValue: string;
    sharePrice: string;
    projectedYield: string;
    occupancyRate: string;
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string;
  isVerified: boolean;
  balance: number;
}

export interface NavLink {
  label: string;
  id: string;
  isActive?: boolean;
}

export interface StatItem {
  value: string;
  label: string;
}

export type ViewState = 
  | 'marketplace' 
  | 'dashboard' 
  | 'admin'
  | 'property-details' 
  | 'how-it-works' 
  | 'resources' 
  | 'about' 
  | 'contact' 
  | 'privacy'
  | 'terms'
  | 'kyc'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'check-email';