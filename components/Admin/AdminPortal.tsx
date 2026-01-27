import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Routes, Route } from 'react-router-dom';
import AdminHeader from './AdminHeader';
import AdminDashboard from './AdminDashboard';
import AdminProperties from './AdminProperties';
import AdminInvestors from './AdminInvestors';
import AdminTransactions from './AdminTransactions';
import AdminKYC from './AdminKYC';
import PropertyForm from './PropertyForm';

const AdminPortal: React.FC = () => {
  const { user, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  
  // Determine current view from URL
  const getCurrentView = () => {
    const path = location.pathname;
    if (path.includes('/properties')) return 'properties';
    if (path.includes('/investors')) return 'investors';
    if (path.includes('/transactions')) return 'transactions';
    if (path.includes('/kyc')) return 'kyc';
    return 'dashboard';
  };
  
  const [currentView, setCurrentView] = useState(getCurrentView());

  useEffect(() => {
    // Check if user is authenticated and is admin
    if (!loading) {
      if (!isAuthenticated || !user) {
        navigate('/login');
        return;
      }

      // Check admin status - we'll need to fetch this from the API
      const checkAdminStatus = async () => {
        try {
          setIsCheckingAdmin(true);
          const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
          
          if (!token) {
            console.error('No access token found');
            navigate('/login');
            return;
          }

          const response = await fetch('/api/user/me', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('Admin check response:', data);
            if (data.success && data.data) {
              if (data.data.is_admin) {
                setIsAdmin(true);
                setIsCheckingAdmin(false);
              } else {
                console.log('User is not an admin, redirecting...');
                navigate('/');
                return;
              }
            } else {
              console.error('Invalid response format:', data);
              navigate('/');
              return;
            }
          } else {
            const errorData = await response.json().catch(() => ({}));
            console.error('Admin check failed:', response.status, errorData);
            navigate('/');
            return;
          }
        } catch (error) {
          console.error('Error checking admin status:', error);
          navigate('/');
          return;
        }
      };

      checkAdminStatus();
    }
  }, [isAuthenticated, user, loading, navigate]);

  // Update current view when location changes
  useEffect(() => {
    setCurrentView(getCurrentView());
  }, [location.pathname]);

  const handleNavigate = (view: string) => {
    setCurrentView(view);
    navigate(`/admin/${view === 'dashboard' ? '' : view}`);
  };

  if (loading || isCheckingAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            {loading ? 'Loading...' : 'Verifying admin access...'}
          </p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user || !isAdmin) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <AdminHeader currentView={currentView} onNavigate={handleNavigate} />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Routes>
          <Route index element={<AdminDashboard />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="properties" element={<AdminProperties />} />
          <Route path="properties/new" element={<PropertyForm />} />
          <Route path="properties/:id/edit" element={<PropertyForm />} />
          <Route path="investors" element={<AdminInvestors />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="kyc" element={<AdminKYC />} />
        </Routes>
      </main>
    </div>
  );
};

export default AdminPortal;
