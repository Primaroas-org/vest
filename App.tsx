import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useLocation, useSearchParams, useParams } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { FilterBar } from './components/FilterBar';
import { PropertyCard } from './components/PropertyCard';
import { StatsSection } from './components/StatsSection';
import { Footer } from './components/Footer';
import { Dashboard } from './components/Dashboard';
import { PropertyDetails } from './components/PropertyDetails';
import { HowItWorks, Resources, About, Contact, Privacy } from './components/Pages';
import { Login, Signup } from './components/AuthPages';
import { Property, ViewState, PropertyStatus } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { SkeletonPropertyCard } from './components/Skeletons';

const MainContent: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const { dict } = useLanguage();
  const { user, isAuthenticated, loading } = useAuth();
  const [properties, setProperties] = useState<Property[]>([]);
  const [propertiesLoading, setPropertiesLoading] = useState(true);

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
          const mappedProperties: Property[] = data.data.map((prop: any) => {
            // Calculate progress percentage
            const totalShares = prop.total_shares || 1;
            const availableShares = prop.available_shares || 0;
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
            const image = Array.isArray(prop.images) && prop.images.length > 0
              ? prop.images[0]
              : prop.image || '';

            // Map property type
            let type: 'Residential' | 'Commercial' | 'Mixed Use' = 'Residential';
            if (prop.property_type === 'commercial') {
              type = 'Commercial';
            } else if (prop.property_type === 'mixed') {
              type = 'Mixed Use';
            }

            return {
              id: prop.id,
              title: prop.name || prop.title || 'Untitled Property',
              location: prop.address || prop.location || 'Unknown Location',
              type: type,
              status: status,
              image: image,
              progress: progress,
              targetReturn: parseFloat(prop.expected_annual_yield || '0'),
              minInvest: `₮ ${parseFloat(prop.price_per_share || '0').toLocaleString()}`,
              isFavorite: false,
              description: prop.description || '',
              financials: {
                totalValue: `₮ ${parseFloat(prop.total_valuation || '0').toLocaleString()}`,
                sharePrice: `₮ ${parseFloat(prop.price_per_share || '0').toLocaleString()}`,
                projectedYield: `${prop.expected_annual_yield || '0'}%`,
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

  const itemsPerPage = 3;
  const totalPages = Math.ceil(properties.length / itemsPerPage);

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

  const displayedProperties = properties.slice(
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
    }
  };

  const handlePropertySelect = (property: Property) => {
    navigate(`/property/${property.id}`);
  };

  // Marketplace component with pagination
  const Marketplace: React.FC = () => (
    <>
      <Hero />
      <FilterBar />

      {/* Featured Properties Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex flex-col md:flex-row justify-between items-end mb-12 gap-4">
          <div>
            <h2 className="text-3xl font-extrabold text-charcoal dark:text-white mb-2 font-display">
              {dict.sections.featured}
            </h2>
            <p className="text-gray-500 dark:text-gray-400">
              {dict.sections.featuredSub}
            </p>
          </div>
          {properties.length > 0 && (
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
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600 dark:text-gray-400 text-lg">No properties available at the moment.</p>
          </div>
        )}

        {/* Pagination */}
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
      </section>
    </>
  );

  // Property Details component
  const PropertyDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const property = properties.find(p => String(p.id) === String(id));
    return property ? (
      <PropertyDetails property={property} onNavigate={handleNavigate} />
    ) : (
      <div className="min-h-screen flex items-center justify-center">
        {propertiesLoading ? (
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
        ) : (
          <div className="text-center">
            <p className="text-gray-600 dark:text-gray-400 text-lg">Property not found</p>
            <button
              onClick={() => navigate('/')}
              className="mt-4 px-6 py-3 bg-emerald-500 dark:bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-all"
            >
              Back to Marketplace
            </button>
          </div>
        )}
      </div>
    );
  };

  // Helper function to determine current view for navbar
  const getCurrentView = (): ViewState => {
    const path = location.pathname;
    if (path === '/') return 'marketplace';
    if (path === '/dashboard') return 'dashboard';
    if (path === '/login') return 'login';
    if (path === '/signup') return 'signup';
    if (path.startsWith('/property/')) return 'property-details';
    if (path === '/how-it-works') return 'how-it-works';
    if (path === '/resources') return 'resources';
    if (path === '/about') return 'about';
    if (path === '/contact') return 'contact';
    if (path === '/privacy') return 'privacy';
    return 'marketplace';
  };

  const currentView = getCurrentView();
  const isAuxiliaryPage = ['how-it-works', 'resources', 'about', 'contact', 'privacy', 'login', 'signup'].includes(currentView);
  const isDashboard = location.pathname.startsWith('/dashboard');
  const shouldShowNavbar = !(user && isDashboard);

  return (
    <div className="min-h-screen flex flex-col">
      {shouldShowNavbar && <Navbar onNavigate={handleNavigate} currentView={currentView} />}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Marketplace />} />
          <Route path="/dashboard/*" element={<Dashboard onNavigate={handleNavigate} />} />
          <Route path="/login" element={<Login onNavigate={handleNavigate} />} />
          <Route path="/signup" element={<Signup onNavigate={handleNavigate} />} />
          <Route path="/property/:id" element={<PropertyDetailPage />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/resources" element={<Resources />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/privacy" element={<Privacy />} />
        </Routes>
        {currentView !== 'property-details' && !isAuxiliaryPage && <StatsSection />}
      </main>

      {!isDashboard && <Footer onNavigate={handleNavigate} />}

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