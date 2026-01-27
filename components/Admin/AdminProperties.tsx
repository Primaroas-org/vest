import React, { useState, useEffect } from 'react';
import { Plus, Edit, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Property {
  id: string;
  name: string;
  address: string;
  property_type: string;
  status: string;
  total_valuation?: string;
  totalValuation?: string;
  price_per_share?: string;
  pricePerShare?: string;
  available_shares?: number;
  availableShares?: number;
  total_shares?: number;
  totalShares?: number;
}

const AdminProperties: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchProperties = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/admin/properties', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.data) {
          setProperties(data.data);
        }
      }
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProperties();
  }, []);

  const handleStatusChange = async (propertyId: string, newStatus: string) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
      const response = await fetch(`/api/admin/properties/${propertyId}/status`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        await fetchProperties(); // Refresh the list
      }
    } catch (error) {
      console.error('Error updating property status:', error);
    }
  };


  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-black text-charcoal dark:text-white mb-2">Property Management</h1>
          <p className="text-gray-500 dark:text-gray-400">Create and manage property listings.</p>
        </div>
        <button
          onClick={() => navigate('/admin/properties/new')}
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all"
        >
          <Plus className="size-5" /> Create Property
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {properties.map((property) => {
          const totalShares = property.total_shares || (property as any).totalShares || 1;
          const availableShares = property.available_shares || (property as any).availableShares || 0;
          const progress = totalShares > 0
            ? Math.round(((totalShares - availableShares) / totalShares) * 100)
            : 0;

          return (
            <div
              key={property.id}
              className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-bold text-charcoal dark:text-white mb-1">{property.name}</h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{property.address}</p>
                  </div>
                  <span className={`text-xs font-bold px-2 py-1 rounded-full ${
                    property.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' :
                    property.status === 'draft' ? 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300' :
                    property.status === 'fully_funded' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300' :
                    'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300'
                  }`}>
                    {property.status}
                  </span>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Total Value</span>
                    <span className="font-bold text-charcoal dark:text-white">
                      ₮{parseFloat(String(property.total_valuation || property.totalValuation || '0')).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Share Price</span>
                    <span className="font-bold text-charcoal dark:text-white">
                      ₮{parseFloat(String(property.price_per_share || property.pricePerShare || '0')).toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Progress</span>
                    <span className="font-bold text-charcoal dark:text-white">{progress}%</span>
                  </div>
                </div>

                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full mb-4">
                  <div
                    className="h-2 bg-primary rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  ></div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 mb-1">
                    <select
                      value={property.status}
                      onChange={(e) => handleStatusChange(property.id, e.target.value)}
                      className="flex-1 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-charcoal dark:text-white rounded-lg text-xs font-bold border border-gray-200 dark:border-gray-600"
                    >
                      <option value="draft">Draft (Hidden from marketplace)</option>
                      <option value="active">Active (Visible on marketplace)</option>
                      <option value="fully_funded">Fully Funded (Visible on marketplace)</option>
                      <option value="closed">Closed (Hidden from marketplace)</option>
                    </select>
                  </div>
                  {property.status === 'draft' && (
                    <p className="text-xs text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 px-2 py-1 rounded">
                      ⚠️ Draft properties are not visible on the marketplace. Change to "Active" to make it visible.
                    </p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => navigate(`/property/${property.id}`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-gray-100 dark:bg-gray-700 text-charcoal dark:text-white rounded-lg text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      <Eye size={16} /> View
                    </button>
                    <button
                      onClick={() => navigate(`/admin/properties/${property.id}/edit`)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary text-white rounded-lg text-sm font-bold hover:bg-emerald-600 transition-colors"
                    >
                      <Edit size={16} /> Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {properties.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 dark:text-gray-400 text-lg mb-4">No properties found</p>
          <button
            onClick={() => navigate('/admin/properties/new')}
            className="px-6 py-3 bg-primary text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors"
          >
            Create Your First Property
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminProperties;
