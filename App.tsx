import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FilterBar, FilterState } from './components/FilterBar';
import { PropertyCard } from './components/PropertyCard';
import { StatsSection } from './components/StatsSection';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { PropertyDetails } from './components/PropertyDetails';
import { Checkout } from './components/Checkout';
import { InvestmentConfirmation } from './components/InvestmentConfirmation';
import { Modal } from './components/Modal';
import { HowItWorks, Resources, About, Contact, Privacy, Terms } from './components/Pages';
import { Login, Signup, ForgotPassword, CheckEmail } from './components/AuthPages';
import { KYCEntry, KYCRDNumber, KYCDocumentUpload, KYCSelfie, KYCComplete } from './components/KYC';
import AdminPortal from './components/Admin/AdminPortal';
import { Property, ViewState, PropertyStatus } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SkeletonPropertyCard } from './components/Skeletons';
import { invalidateDashboardCache } from './utils/apiCache';

const MainContent: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dict } = useLanguage();
  const { user, isAuthenticated, loading, showTimeoutWarning, resetSessionTimeout, logout, getLastActivityTime } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);
  const [filters, setFilters] = useState<FilterState>({ searchQuery: '', propertyType: '', yieldRange: '' });

  // Debug logging
  React.useEffect(() => {
    console.log('Auth state in MainContent:', { user: user?.email, isAuthenticated, loading });
  }, [user, isAuthenticated, loading]);

  // Fetch properties from API
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setPropertiesLoading(true);
        const response = await fetch('/api/properties');

        // Check if response is actually JSON
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const text = await response.text();
          console.error('Expected JSON but got:', contentType, text.substring(0, 200));
          throw new Error(`Server returned ${response.status}: ${response.statusText}. Make sure the backend server is running on port 3000.`);
        }

        const data = await response.json();
        

        if (data.success && data.data) {
          // Map database properties to frontend Property type
          // Note: Drizzle ORM returns camelCase field names
          const mappedProperties: Property[] = data.data.map((prop: any) => {
            // Calculate progress percentage
            // Support both camelCase (Drizzle) and snake_case (legacy)
            const totalShares = prop.totalShares || prop.total_shares || 1;
            const availableShares = prop.availableShares || prop.available_shares || 0;
            const progress = totalShares > 0
              ? Math.round(((totalShares - availableShares) / totalShares) * 100)
              : 0;

            // Map status
            let status: PropertyStatus = 'funding';
            if (prop.status === 'fully_funded' || prop.status === 'closed') {
              status = 'sold';
            } else if (prop.status === 'active' && progress === 100) {
              status = 'renting';
            } else if (prop.status === 'active') {
              status = 'funding';
            }

            // Get image from images array or use first image
            // Get all images
            const allImages: string[] = Array.isArray(prop.images) ? prop.images.map((img: any) => typeof img === 'string' ? img : img?.url || img) : [];
            const image = allImages.length > 0 ? allImages[0] : prop.image || '';

            // Map property type - support both camelCase and snake_case
            const propertyType = prop.propertyType || prop.property_type || 'residential';
            let type: 'Residential' | 'Commercial' | 'Mixed Use' = 'Residential';
            if (propertyType === 'commercial') {
              type = 'Commercial';
            } else if (propertyType === 'mixed') {
              type = 'Mixed Use';
            }

            // Support both camelCase (Drizzle) and snake_case (legacy)
            const pricePerShare = prop.pricePerShare || prop.price_per_share || '0';
            const totalValuation = prop.totalValuation || prop.total_valuation || '0';
            const expectedAnnualYield = prop.expectedAnnualYield || prop.expected_annual_yield || '0';

            return {
              id: prop.id,
              title: prop.name || prop.title || 'Untitled Property',
              location: prop.address || prop.location || 'Unknown Location',
              type: type,
              status: status,
              image: image,
              images: allImages,
              progress: progress,
              targetReturn: parseFloat(String(expectedAnnualYield)) || 0,
              minInvest: `₮ ${parseFloat(String(pricePerShare)).toLocaleString()}`,
              isFavorite: false,
              description: prop.description || '',
              latitude: prop.latitude,
              longitude: prop.longitude,
              financials: {
                totalValue: `₮ ${parseFloat(String(totalValuation)).toLocaleString()}`,
                sharePrice: `₮ ${parseFloat(String(pricePerShare)).toLocaleString()}`,
                projectedYield: `${parseFloat(String(expectedAnnualYield)) || 0}%`,
                occupancyRate: prop.status === 'fully_funded' ? '100%' : 'Pre-lease'
              }
            };
          });

          setProperties(mappedProperties);
        }
      } catch (error) {
        console.error('Error fetching properties:', error);
        // Fallback to empty array on error
        setProperties([]);
      } finally {
        setPropertiesLoading(false);
      }
    };

    fetchProperties();
  }, []);

  // Filter properties based on active filters
  const filteredProperties = useMemo(() => {
    let result = properties;

    // Search filter - match title or location
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.title.toLowerCase().includes(query) ||
        p.location.toLowerCase().includes(query)
      );
    }

    // Property type filter
    if (filters.propertyType) {
      result = result.filter(p => p.type === filters.propertyType);
    }

    // Yield range filter
    if (filters.yieldRange) {
      result = result.filter(p => {
        const yield_ = p.targetReturn;
        if (filters.yieldRange === '5-8') return yield_ >= 5 && yield_ < 8;
        if (filters.yieldRange === '8-12') return yield_ >= 8 && yield_ < 12;
        if (filters.yieldRange === '12+') return yield_ >= 12;
        return true;
      });
    }

    return result;
  }, [properties, filters]);

  const handleFilterChange = useCallback((newFilters: FilterState) => {
    setFilters(newFilters);
    // Reset to page 1 when filters change, but only update URL if not already on page 1
    // to avoid unnecessary re-renders that cause input focus loss
    if (searchParams.get('page') && searchParams.get('page') !== '1') {
      setSearchParams({ page: '1' });
    }
  }, [searchParams, setSearchParams]);

  const itemsPerPage = 3;
  const totalPages = Math.ceil(filteredProperties.length / itemsPerPage);

  // Get current page from URL search params, default to 1
  const currentPage = parseInt(searchParams.get('page') || '1', 10);

  const handleNextPage = () => {
    const nextPage = Math.min(currentPage + 1, totalPages);
    setSearchParams({ page: nextPage.toString() });
  };

  const handlePrevPage = () => {
    const prevPage = Math.max(currentPage - 1, 1);
    setSearchParams({ page: prevPage.toString() });
  };

  const handlePageSelect = (page: number) => {
    setSearchParams({ page: page.toString() });
  };

  const displayedProperties = filteredProperties.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  useEffect(() => {
    // Check system preference on mount
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      // Optional: Auto set dark mode
      // setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    setIsDark(!isDark);
  };

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  const handleNavigate = (newView: ViewState) => {
    if (newView === 'marketplace') {
      navigate('/');
    } else if (newView === 'dashboard') {
      navigate('/dashboard');
    } else if (newView === 'login') {
      navigate('/login');
    } else if (newView === 'signup') {
      navigate('/signup');
    } else if (newView === 'forgot-password') {
      navigate('/forgot-password');
    } else if (newView === 'check-email') {
      navigate('/check-email');
    } else if (newView === 'kyc') {
      navigate('/kyc');
    } else if (newView === 'how-it-works') {
      navigate('/how-it-works');
    } else if (newView === 'resources') {
      navigate('/resources');
    } else if (newView === 'about') {
      navigate('/about');
    } else if (newView === 'contact') {
      navigate('/contact');
    } else if (newView === 'privacy') {
      navigate('/privacy');
    } else if (newView === 'terms') {
      navigate('/terms');
    }
  };

  const handlePropertySelect = (property: Property) => {
    navigate(`/property/${property.id}`);
  };

  // Marketplace component with pagination and filtering
  const Marketplace: React.FC = () => {
    const hasActiveFilters = filters.searchQuery || filters.propertyType || filters.yieldRange;

    return (
      <>
        <Hero />
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />

        {/* Featured Properties Section */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
            <div>
              <h2 className="text-3xl font-extrabold text-charcoal dark:text-white mb-2 font-display">
                {hasActiveFilters ? `Search Results (${filteredProperties.length})` : dict.sections.featured}
              </h2>
              <p className="text-gray-500 dark:text-gray-400">
                {hasActiveFilters
                  ? `Showing ${filteredProperties.length} of ${properties.length} properties`
                  : dict.sections.featuredSub}
              </p>
            </div>
            {filteredProperties.length > itemsPerPage && (
              <div className="flex gap-2">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-charcoal dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons-round">chevron_left</span>
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-full border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-charcoal dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons-round">chevron_right</span>
                </button>
              </div>
            )}
          </div>

          {propertiesLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <SkeletonPropertyCard key={i} />
              ))}
            </div>
          ) : displayedProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {displayedProperties.map((prop) => (
                <PropertyCard key={prop.id} property={prop} onSelect={handlePropertySelect} />
              ))}
            </div>
          ) : hasActiveFilters ? (
            <div className="text-center py-20">
              <span className="material-icons-round text-5xl text-gray-300 dark:text-gray-600 mb-4">search_off</span>
              <p className="text-gray-600 dark:text-gray-400 text-lg mb-2">No properties match your filters.</p>
              <button
                onClick={() => handleFilterChange({ searchQuery: '', propertyType: '', yieldRange: '' })}
                className="text-primary font-bold hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="text-gray-600 dark:text-gray-400 text-lg">No properties available at the moment.</p>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-16 flex justify-center">
              <nav className="flex items-center gap-1">
                <button
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons-round">keyboard_arrow_left</span>
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => handlePageSelect(page)}
                    className={`w-10 h-10 rounded-lg font-bold transition-colors ${currentPage === page
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'
                      }`}
                  >
                    {page}
                  </button>
                ))}

                <button
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <span className="material-icons-round">keyboard_arrow_right</span>
                </button>
              </nav>
            </div>
          )}
        </section>
      </>
    );
  };

  // Property Details component
  const PropertyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const [property, setProperty] = useState<Property | null>(null);
    const [loadingProperty, setLoadingProperty] = useState(true);

    // Try to find property in list first
    useEffect(() => {
      const foundProperty = properties.find(p => String(p.id) === String(id));
      if (foundProperty) {
        setProperty(foundProperty);
        setLoadingProperty(false);
        return;
      }

      // If not found in list, fetch directly from API
      const fetchProperty = async () => {
        try {
          setLoadingProperty(true);
          const response = await fetch(`/api/properties/${id}`);

          if (!response.ok) {
            setLoadingProperty(false);
            return;
          }

          const data = await response.json();
          if (data.success && data.data) {
            const prop = data.data;

            // Calculate progress percentage
            const totalShares = prop.totalShares || prop.total_shares || 1;
            const availableShares = prop.availableShares || prop.available_shares || 0;
            const progress = totalShares > 0
              ? Math.round(((totalShares - availableShares) / totalShares) * 100)
              : 0;

            // Map status
            let status: PropertyStatus = 'funding';
            if (prop.status === 'fully_funded' || prop.status === 'closed') {
              status = 'sold';
            } else if (prop.status === 'active' && progress === 100) {
              status = 'renting';
            } else if (prop.status === 'active') {
              status = 'funding';
            }

            // Get all images
            const allImages: string[] = Array.isArray(prop.images) ? prop.images.map((img: any) => typeof img === 'string' ? img : img?.url || img) : [];
            const image = allImages.length > 0 ? allImages[0] : prop.image || '';

            // Map property type
            const propertyType = prop.propertyType || prop.property_type || 'residential';
            let type: 'Residential' | 'Commercial' | 'Mixed Use' = 'Residential';
            if (propertyType === 'commercial') {
              type = 'Commercial';
            } else if (propertyType === 'mixed') {
              type = 'Mixed Use';
            }

            // Support both camelCase (Drizzle) and snake_case (legacy)
            const pricePerShare = prop.pricePerShare || prop.price_per_share || '0';
            const totalValuation = prop.totalValuation || prop.total_valuation || '0';
            const expectedAnnualYield = prop.expectedAnnualYield || prop.expected_annual_yield || '0';

            const mappedProperty: Property = {
              id: prop.id,
              title: prop.name || prop.title || 'Untitled Property',
              location: prop.address || prop.location || 'Unknown Location',
              type: type,
              status: status,
              image: image,
              images: allImages,
              progress: progress,
              targetReturn: parseFloat(String(expectedAnnualYield)) || 0,
              minInvest: `₮ ${parseFloat(String(pricePerShare)).toLocaleString()}`,
              isFavorite: false,
              description: prop.description || '',
              latitude: prop.latitude,
              longitude: prop.longitude,
              financials: {
                totalValue: `₮ ${parseFloat(String(totalValuation)).toLocaleString()}`,
                sharePrice: `₮ ${parseFloat(String(pricePerShare)).toLocaleString()}`,
                projectedYield: `${parseFloat(String(expectedAnnualYield)) || 0}%`,
                occupancyRate: prop.status === 'fully_funded' ? '100%' : 'Pre-lease'
              }
            };

            setProperty(mappedProperty);
          }
        } catch (error) {
          console.error('Error fetching property:', error);
        } finally {
          setLoadingProperty(false);
        }
      };

      fetchProperty();
    }, [id, properties]);

    if (loadingProperty) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="max-w-4xl w-full mx-auto px-4">
            <div className="bg-white dark:bg-charcoal rounded-2xl overflow-hidden shadow-sm border border-gray-100 dark:border-gray-800 animate-pulse">
              <div className="h-96 bg-gray-200 dark:bg-gray-700"></div>
              <div className="p-8 space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  <div className="h-20 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (!property) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Property not found</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-3 bg-emerald-500 dark:bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-all"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      );
    }

    return <PropertyDetails property={property} onNavigate={handleNavigate} />;
  };

  // Checkout Page component
  const CheckoutPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [property, setProperty] = useState<Property | null>(null);
    const [loadingProperty, setLoadingProperty] = useState(true);
    const [initialShares, setInitialShares] = useState<number>(0);
    const [showConfirmationModal, setShowConfirmationModal] = useState(false);
    const [investmentData, setInvestmentData] = useState<{
      transaction_id?: string;
      shares: number;
      price_per_share: string;
      total_cost: string;
      new_balance: string;
    } | null>(null);
    const { refreshUser } = useAuth();

    useEffect(() => {
      // Get shares from sessionStorage if available
      const storedShares = sessionStorage.getItem('checkout_shares');
      if (storedShares) {
        setInitialShares(parseInt(storedShares) || 0);
      }

      // Get property from sessionStorage or fetch from API
      const storedProperty = sessionStorage.getItem('checkout_property');
      if (storedProperty) {
        try {
          const parsed = JSON.parse(storedProperty);
          setProperty(parsed);
          setLoadingProperty(false);
          return;
        } catch (e) {
          console.error('Error parsing stored property:', e);
        }
      }

      // If not in sessionStorage, try to find in properties list or fetch from API
      if (id) {
        const foundProperty = properties.find(p => String(p.id) === String(id));
        if (foundProperty) {
          setProperty(foundProperty);
          setLoadingProperty(false);
          return;
        }

        // Fetch from API
        const fetchProperty = async () => {
          try {
            setLoadingProperty(true);
            const response = await fetch(`/api/properties/${id}`);

            if (!response.ok) {
              setLoadingProperty(false);
              return;
            }

            const data = await response.json();
            if (data.success && data.data) {
              const prop = data.data;

              const totalShares = prop.totalShares || prop.total_shares || 1;
              const availableShares = prop.availableShares || prop.available_shares || 0;
              const progress = totalShares > 0
                ? Math.round(((totalShares - availableShares) / totalShares) * 100)
                : 0;

              let status: PropertyStatus = 'funding';
              if (prop.status === 'fully_funded' || prop.status === 'closed') {
                status = 'sold';
              } else if (prop.status === 'active' && progress === 100) {
                status = 'renting';
              } else if (prop.status === 'active') {
                status = 'funding';
              }

              const allImages: string[] = Array.isArray(prop.images) ? prop.images.map((img: any) => typeof img === 'string' ? img : img?.url || img) : [];
              const image = allImages.length > 0 ? allImages[0] : prop.image || '';

              const propertyType = prop.propertyType || prop.property_type || 'residential';
              let type: 'Residential' | 'Commercial' | 'Mixed Use' = 'Residential';
              if (propertyType === 'commercial') {
                type = 'Commercial';
              } else if (propertyType === 'mixed') {
                type = 'Mixed Use';
              }

              const pricePerShare = prop.pricePerShare || prop.price_per_share || '0';
              const totalValuation = prop.totalValuation || prop.total_valuation || '0';
              const expectedAnnualYield = prop.expectedAnnualYield || prop.expected_annual_yield || '0';

              const mappedProperty: Property = {
                id: prop.id,
                title: prop.name || prop.title || 'Untitled Property',
                location: prop.address || prop.location || 'Unknown Location',
                type: type,
                status: status,
                image: image,
                images: allImages,
                progress: progress,
                targetReturn: parseFloat(String(expectedAnnualYield)) || 0,
                minInvest: `₮ ${parseFloat(String(pricePerShare)).toLocaleString()}`,
                isFavorite: false,
                description: prop.description || '',
                latitude: prop.latitude,
                longitude: prop.longitude,
                financials: {
                  totalValue: `₮ ${parseFloat(String(totalValuation)).toLocaleString()}`,
                  sharePrice: `₮ ${parseFloat(String(pricePerShare)).toLocaleString()}`,
                  projectedYield: `${parseFloat(String(expectedAnnualYield)) || 0}%`,
                  occupancyRate: prop.status === 'fully_funded' ? '100%' : 'Pre-lease'
                }
              };

              setProperty(mappedProperty);
            }
          } catch (error) {
            console.error('Error fetching property:', error);
          } finally {
            setLoadingProperty(false);
          }
        };

        fetchProperty();
      } else {
        setLoadingProperty(false);
      }
    }, [id, properties]);

    const handleComplete = async (shares: number, paymentMethod?: string) => {
      if (!property) return;

      try {
        const token = localStorage.getItem('supabase.auth.token');
        if (!token) {
          throw new Error('Authentication required');
        }

        // Validate payment method
        if (paymentMethod === 'bank') {
          // For now, bank transfer will use wallet balance
          // In the future, this should integrate with a payment gateway
          console.log('Bank transfer selected - using wallet balance for now');
        }

        const response = await fetch('/api/invest', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify({
            property_id: property.id,
            shares: shares,
            payment_method: paymentMethod || 'wallet'
          })
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Investment failed');
        }

        // Store investment data for confirmation modal
        const pricePerShare = parseFloat(property.financials?.sharePrice?.replace(/[₮,\s]/g, '') || property.minInvest.replace(/[₮,\s]/g, '') || '0');
        const transactionAmount = data.data?.transaction?.amount || (shares * pricePerShare).toString();
        const investmentDataToStore = data.data ? {
          transaction_id: data.data.transaction?.id || undefined,
          shares: shares,
          price_per_share: `₮ ${pricePerShare.toLocaleString()}`,
          total_cost: `₮ ${parseFloat(transactionAmount).toLocaleString()}`,
          new_balance: data.data.new_balance || '0.00'
        } : {
          shares: shares,
          price_per_share: `₮ ${pricePerShare.toLocaleString()}`,
          total_cost: `₮ ${(shares * pricePerShare).toLocaleString()}`,
          new_balance: '0.00'
        };

        setInvestmentData(investmentDataToStore);
        setShowConfirmationModal(true);

        // Clear sessionStorage
        sessionStorage.removeItem('checkout_property');
        sessionStorage.removeItem('checkout_shares');

        // Invalidate dashboard cache so fresh data loads after investment
        invalidateDashboardCache();

        // Don't refresh user data immediately - it causes re-renders that can close the modal
        // We'll refresh it when the modal closes instead
      } catch (error) {
        console.error('Investment error:', error);
        alert(error instanceof Error ? error.message : 'Investment failed. Please try again.');
      }
    };

    if (loadingProperty) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-gray-500">Loading checkout...</div>
        </div>
      );
    }

    if (!property) {
      return (
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Property not found</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-emerald-600 transition-all"
            >
              Back to Marketplace
            </button>
          </div>
        </div>
      );
    }

    return (
      <>
        <Checkout
          property={property}
          initialShares={initialShares}
          onNavigate={handleNavigate}
          onComplete={handleComplete}
        />
        {investmentData && (
          <InvestmentConfirmation
            isOpen={showConfirmationModal}
            onClose={() => {
              setShowConfirmationModal(false);
              setInvestmentData(null);
              if (refreshUser) {
                refreshUser().catch((err) => console.error('Error refreshing user:', err));
              }
            }}
            onViewPortfolio={() => {
              setShowConfirmationModal(false);
              setInvestmentData(null);
              if (refreshUser) {
                refreshUser().catch((err) => console.error('Error refreshing user:', err));
              }
              navigate('/dashboard');
            }}
            onBrowseProperties={() => {
              setShowConfirmationModal(false);
              setInvestmentData(null);
              if (refreshUser) {
                refreshUser().catch((err) => console.error('Error refreshing user:', err));
              }
              navigate('/');
            }}
            onNavigate={(view) => {
              if (view === 'dashboard') navigate('/dashboard');
              else if (view === 'marketplace') navigate('/');
              else handleNavigate(view);
            }}
            property={property}
            investmentData={investmentData}
          />
        )}
      </>
    );
  };

  // Helper function to determine current view for navbar
  const getCurrentView = (): ViewState => {
    const path = location.pathname;
    if (path === '/') return 'marketplace';
    if (path === '/dashboard') return 'dashboard';
    if (path.startsWith('/admin')) return 'admin';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path === '/forgot-password') return 'forgot-password';
    if (path === '/check-email') return 'check-email';
    if (path === '/kyc' || path.startsWith('/kyc/')) return 'kyc';
    if (path.startsWith('/property/')) return 'property-details';
    if (path === '/how-it-works') return 'how-it-works';
    if (path === '/resources') return 'resources';
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';
    if (path === '/privacy') return 'privacy';
    if (path === '/terms') return 'terms';
    return 'marketplace';
  };

  const currentView = getCurrentView();
  const isAuxiliaryPage = ['how-it-works', 'resources', 'about', 'contact', 'privacy', 'terms', 'kyc', 'login', 'signup', 'forgot-password', 'check-email'].includes(currentView);
  const isDashboard = location.pathname.startsWith('/dashboard');
  const isAdmin = location.pathname.startsWith('/admin');
  const shouldShowNavbar = !(user && isDashboard) && !isAdmin;

  return (
    <div className="min-h-screen flex flex-col">
      {shouldShowNavbar && <Navbar onNavigate={handleNavigate} currentView={currentView} />}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/dashboard/*" element={<Dashboard onNavigate={handleNavigate} />} />
          <Route path="/admin/*" element={<AdminPortal />} />
          <Route path="/login" element={<Login onNavigate={handleNavigate} />} />
          <Route path="/signup" element={<Signup onNavigate={handleNavigate} />} />
          <Route path="/forgot-password" element={<ForgotPassword onNavigate={handleNavigate} />} />
          <Route path="/check-email" element={<CheckEmail onNavigate={handleNavigate} />} />
          <Route path="/kyc" element={<KYCEntry onNavigate={handleNavigate} />} />
          <Route path="/kyc/rd-number" element={<KYCRDNumber onNavigate={handleNavigate} />} />
          <Route path="/kyc/verify" element={<KYCDocumentUpload onNavigate={handleNavigate} />} />
          <Route path="/kyc/selfie" element={<KYCSelfie onNavigate={handleNavigate} />} />
          <Route path="/kyc/complete" element={<KYCComplete onNavigate={handleNavigate} />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/checkout/:id?" element={<CheckoutPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
        </Routes>
        {currentView !== 'property-details' && !isAuxiliaryPage && !isAdmin && <StatsSection />}
      </main>

      {!isDashboard && !isAdmin && <Footer onNavigate={handleNavigate} />}

      {/* Session Timeout Warning Modal */}
      <Modal
        isOpen={showTimeoutWarning}
        onClose={async () => {
          // Logout when user clicks "Logout Now"
          await logout();
        }}
        onConfirm={() => {
          // Extend session when user clicks "Stay Logged In"
          resetSessionTimeout();
        }}
        title={dict.nav?.timeoutWarning?.title || 'Session Timeout Warning'}
        message={
          dict.nav?.timeoutWarning?.message || 
          `Your session will expire soon due to inactivity. Would you like to stay logged in?`
        }
        confirmText={dict.nav?.timeoutWarning?.stayLoggedIn || 'Stay Logged In'}
        cancelText={dict.nav?.timeoutWarning?.logout || 'Logout Now'}
        type="confirm"
      />

      {/* Dark Mode Toggle */}
      <button
        className="fixed bottom-20 right-6 z-50 bg-charcoal dark:bg-white text-white dark:text-charcoal p-4 rounded-full shadow-xl hover:scale-110 transition-transform focus:outline-none focus:ring-4 focus:ring-primary/50"
        onClick={toggleTheme}
        aria-label="Toggle Dark Mode"
      >
        <span className="material-icons-round">
          {isDark ? 'light_mode' : 'dark_mode'}
        </span>
      </button>
    </div>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <MainContent />
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;