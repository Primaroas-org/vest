import React, { useState, useEffect } from 'react';
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
import { Property, ViewState } from './types';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthProvider } from './contexts/AuthContext';

const mockProperties: Property[] = [
  {
    id: 1,
    title: 'Zaisan Premium Residence',
    location: 'Khan-Uul District, Ulaanbaatar',
    type: 'Residential',
    status: 'funding',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDGDXTIgpZbO9PCcx4nOHMuXctk4wPpqsXsywn0Do6SNJEk1ZpH9dM-GnaJz-EOfjkHkfO6bYOUCqnqZ9U87xGBXI6T9hFYpJxJBQXhAcTNtPg7buf48r_caJNwjfJZiQuvKpDgTdlepCfVBf1919StEpxJG_t4q6i6HaznJhw7tnmkFeZIfBB5yottuVdTDcYnhfwARP3rZNBhBTjxho1j6RKJHpMk8hmQQbkmHsEdi50a6XA-d4QuBcHWSD1hYXQLH9blyoSzOfg',
    progress: 63,
    targetReturn: 12.4,
    minInvest: '₮ 500k',
    isFavorite: false,
    description: "Located in the prestigious Zaisan area, this premium residential complex offers a unique blend of luxury living and high investment potential. Featuring smart home technology, 24/7 concierge service, and panoramic views of the Bogd Khan Mountain, it represents the pinnacle of modern Ulaanbaatar lifestyle. Tenants include diplomats and high-net-worth individuals, ensuring stable and high rental yields.",
    financials: {
      totalValue: "₮ 12.5B",
      sharePrice: "₮ 500,000",
      projectedYield: "12.4%",
      occupancyRate: "100%"
    }
  },
  {
    id: 2,
    title: 'Central Business Tower',
    location: 'Sukhbaatar District, Ulaanbaatar',
    type: 'Commercial',
    status: 'renting',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB83Lwj6p5MwaLLLpQ57SAx0iCya9QbcEL9aY4BM4NIDHra5-GRkB6v0SHFutKmVh089qUenA4jMwcAz-p9KxE980zCI_8ez842hz_eMW1IYt1meG_JJieu7jVthaI95e4WQx4cMYJUgGSR0hfdLV7lpumXqqCzgyqrfpJXEpddA5T5Hrmoox9fUZ9tYJY1higc5Wml9bcBCSuIeJSydPb6kcnwvrVbBYdZ6YNICT8m-oDBudY0t5wpHjgEpre2bxpFYzRJwzTVwn4',
    progress: 100,
    targetReturn: 10.2,
    minInvest: '₮ 1.2M',
    isFavorite: false,
    description: "A Grade-A office tower situated in the heart of Ulaanbaatar's financial district. This property hosts multinational corporations and top-tier law firms. With LEED Gold certification for sustainability and state-of-the-art facilities, it commands the highest rental rates in the city. A solid choice for investors seeking reliable, long-term commercial returns.",
    financials: {
       totalValue: "₮ 45.0B",
       sharePrice: "₮ 1,200,000",
       projectedYield: "10.2%",
       occupancyRate: "95%"
    }
  },
  {
    id: 3,
    title: 'Sky Garden Plaza',
    location: 'Bayanzurkh District, Ulaanbaatar',
    type: 'Mixed Use',
    status: 'funding',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDzs1nb3uxHLZ9l5ei0su57xnkH30VacrVuKT5fj3wigWeP2GJ5UzJmd_qypzqpOTi6vZQ_uNUNLVEWckduzvgkwOgavG8FG6ivL30QoPugkL2vVWc-FENVEwzR0yMNcs7qZkzBkk4_i5k9z7gvFJNlK4L6rmW9OCY3eUyXtYgZNESWEPoQNPOnL4tIdTbYzfDIRs4q9C-yL8hdMSbcUbAjBhmyHOXFHIeWocexdLWjoFA_LAxLY48fVKLLAkhBCDSMX3XGGLi8Yvc',
    progress: 21,
    targetReturn: 15.8,
    minInvest: '₮ 750k',
    isFavorite: false,
    description: "An innovative mixed-use development combining high-end retail, co-working spaces, and boutique apartments. Strategically located near the new transport hub, Sky Garden Plaza is poised for significant capital appreciation. The project targets the growing creative class and young professionals of Ulaanbaatar.",
    financials: {
       totalValue: "₮ 8.2B",
       sharePrice: "₮ 750,000",
       projectedYield: "15.8%",
       occupancyRate: "Pre-lease"
    }
  },
  {
    id: 4,
    title: 'River Garden Heights',
    location: 'Khan-Uul District, Ulaanbaatar',
    type: 'Residential',
    status: 'sold',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB3tH900o0_622e1JzI00LqW6qjH7LqJ1Y1lM3eW9K_X7G1v4s0B9xZ8C2D4F5H6J8K9L1M2N3P4Q5R6S7T8U9V0W1X2Y3Z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z',
    progress: 100,
    targetReturn: 11.5,
    minInvest: '₮ 2.0M',
    isFavorite: false,
    description: "Exclusive luxury apartments near the Tuul River. Fully funded and now generating consistent rental income for early investors.",
    financials: {
      totalValue: "₮ 18.0B",
      sharePrice: "₮ 2,000,000",
      projectedYield: "11.5%",
      occupancyRate: "100%"
    }
  },
  {
    id: 5,
    title: 'Naiman Sharga Center',
    location: 'Chingeltei District, Ulaanbaatar',
    type: 'Commercial',
    status: 'funding',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC1D2E3F4G5H6I7J8K9L0M1N2O3P4Q5R6S7T8U9V0W1X2Y3Z4a5b6c7d8e9f0g1h2i3j4k5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z0a1b2c3d4',
    progress: 45,
    targetReturn: 13.2,
    minInvest: '₮ 800k',
    isFavorite: true,
    description: "Located in the bustling currency exchange district, this commercial hub offers high foot traffic and excellent visibility for retail tenants.",
    financials: {
      totalValue: "₮ 5.6B",
      sharePrice: "₮ 800,000",
      projectedYield: "13.2%",
      occupancyRate: "80%"
    }
  },
  {
    id: 6,
    title: 'Olympic Residence',
    location: 'Sukhbaatar District, Ulaanbaatar',
    type: 'Residential',
    status: 'renting',
    image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5E6F7G8H9I0J1K2L3M4N5O6P7Q8R9S0T1U2V3W4X5Y6Z7a8b9c0d1e2f3g4h5i6j7k8l9m0n1o2p3q4r5s6t7u8v9w0x1y2z0a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z',
    progress: 100,
    targetReturn: 9.8,
    minInvest: '₮ 1.5M',
    isFavorite: false,
    description: "A landmark residential project facing the Central Park. Highly sought after by expatriates for its prime location and amenities.",
    financials: {
      totalValue: "₮ 22.0B",
      sharePrice: "₮ 1,500,000",
      projectedYield: "9.8%",
      occupancyRate: "100%"
    }
  }
];

const MainContent: React.FC = () => {
  const [isDark, setIsDark] = useState(false);
  const [view, setView] = useState<ViewState>('marketplace');
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { dict } = useLanguage();

  const itemsPerPage = 3;
  const totalPages = Math.ceil(mockProperties.length / itemsPerPage);

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handlePageSelect = (page: number) => {
    setCurrentPage(page);
  };

  const displayedProperties = mockProperties.slice(
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
  }, [view]);

  const handleNavigate = (newView: ViewState) => {
    setView(newView);
  };

  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    setView('property-details');
  };

  // If dashboard is requested, we pass control to the Dashboard component
  if (view === 'dashboard') {
    return <Dashboard onNavigate={handleNavigate} />;
  }
  
  // If auth pages are requested
  if (view === 'login') {
    return <Login onNavigate={handleNavigate} />;
  }

  if (view === 'signup') {
    return <Signup onNavigate={handleNavigate} />;
  }

  const renderContent = () => {
    switch (view) {
      case 'property-details':
        return selectedProperty ? (
          <PropertyDetails property={selectedProperty} onNavigate={handleNavigate} />
        ) : (
          <div className="min-h-screen flex items-center justify-center">Loading...</div>
        );
      case 'how-it-works':
        return <HowItWorks />;
      case 'resources':
        return <Resources />;
      case 'about':
        return <About />;
      case 'contact':
        return <Contact />;
      case 'privacy':
        return <Privacy />;
      case 'marketplace':
      default:
        return (
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
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {displayedProperties.map((prop) => (
                  <PropertyCard key={prop.id} property={prop} onSelect={handlePropertySelect} />
                ))}
              </div>

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
                      className={`w-10 h-10 rounded-lg font-bold transition-colors ${
                        currentPage === page 
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
    }
  };

  const isAuxiliaryPage = ['how-it-works', 'resources', 'about', 'contact', 'privacy', 'login', 'signup'].includes(view);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar onNavigate={handleNavigate} currentView={view} />
      
      <main className="flex-grow">
        {renderContent()}
        {view !== 'property-details' && !isAuxiliaryPage && <StatsSection />}
      </main>

      {!isAuxiliaryPage && <Footer onNavigate={handleNavigate} />}

      {/* Dark Mode Toggle */}
      <button
        className="fixed bottom-6 right-6 z-50 bg-charcoal dark:bg-white text-white dark:text-charcoal p-4 rounded-full shadow-xl hover:scale-110 transition-transform focus:outline-none focus:ring-4 focus:ring-primary/50"
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
    <AuthProvider>
      <LanguageProvider>
        <MainContent />
      </LanguageProvider>
    </AuthProvider>
  );
};

export default App;