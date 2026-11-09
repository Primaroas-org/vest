import React, { useState, useEffect } from 'react';

interface Property {
  id: string;
  name: string;
  address: string;
  totalShares: number;
  availableShares: number;
  totalValuation: string;
  status: string;
}

interface DistributionResult {
  property_name: string;
  total_rent: string;
  shareholders_count: number;
  transactions: any[];
}

const AdminDividends: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<string>('');
  const [totalRent, setTotalRent] = useState('');
  const [loading, setLoading] = useState(true);
  const [distributing, setDistributing] = useState(false);
  const [result, setResult] = useState<DistributionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [history, setHistory] = useState<any[]>([]);

  useEffect(() => {
    fetchProperties();
    fetchHistory();
  }, []);

  const fetchProperties = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/admin/properties', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          // Only show properties with sold shares
          setProperties(data.data.filter((p: any) => {
            const soldShares = (p.totalShares || p.total_shares || 0) - (p.availableShares || p.available_shares || 0);
            return soldShares > 0;
          }).map((p: any) => ({
            id: p.id,
            name: p.name,
            address: p.address || p.location || '',
            totalShares: p.totalShares || p.total_shares || 0,
            availableShares: p.availableShares || p.available_shares || 0,
            totalValuation: p.totalValuation || p.total_valuation || '0',
            status: p.status || 'active',
          })));
        }
      }
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/admin/transactions?type=dividend&limit=20', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.success && Array.isArray(data.data)) {
          setHistory(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching dividend history:', err);
    }
  };

  const handleDistribute = async () => {
    if (!selectedProperty || !totalRent) return;
    setDistributing(true);
    setError(null);
    setResult(null);

    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/admin/distribute-rent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          property_id: selectedProperty,
          total_rent: totalRent.replace(/,/g, '')
        })
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Distribution failed');
      }
      setResult(data.data);
      setTotalRent('');
      fetchHistory();
    } catch (err: any) {
      setError(err.message || 'Distribution failed');
    } finally {
      setDistributing(false);
    }
  };

  const selectedProp = properties.find(p => p.id === selectedProperty);
  const soldShares = selectedProp ? (selectedProp.totalShares - selectedProp.availableShares) : 0;

  const formatAmount = (val: string) => {
    const num = parseFloat(val.replace(/,/g, ''));
    if (isNaN(num)) return val;
    return num.toLocaleString();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-black text-charcoal dark:text-white">Dividend Distribution</h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
            Distribute rental income to property shareholders
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Distribution Form */}
        <div className="lg:col-span-2">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-charcoal dark:text-white mb-6 flex items-center gap-2">
              <span className="material-icons-round text-primary">payments</span>
              New Distribution
            </h2>

            <div className="space-y-5">
              {/* Property Selection */}
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Select Property</label>
                {loading ? (
                  <div className="animate-pulse h-12 bg-gray-100 dark:bg-gray-700 rounded-xl"></div>
                ) : properties.length === 0 ? (
                  <p className="text-sm text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-900 p-4 rounded-xl">
                    No properties with sold shares found. Investors need to purchase shares first.
                  </p>
                ) : (
                  <select
                    value={selectedProperty}
                    onChange={(e) => setSelectedProperty(e.target.value)}
                    className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white px-4 bg-white dark:bg-gray-900"
                  >
                    <option value="">-- Select a property --</option>
                    {properties.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.address})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Property Info */}
              {selectedProp && (
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-4 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Total Shares</p>
                    <p className="text-lg font-bold text-charcoal dark:text-white">{selectedProp.totalShares.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Shares Sold</p>
                    <p className="text-lg font-bold text-primary">{soldShares.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500 font-bold uppercase">Valuation</p>
                    <p className="text-lg font-bold text-charcoal dark:text-white">₮{parseFloat(selectedProp.totalValuation).toLocaleString()}</p>
                  </div>
                </div>
              )}

              {/* Amount */}
              <div>
                <label className="block text-sm font-bold text-gray-500 dark:text-gray-400 mb-2">Total Rental Income (₮)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₮</span>
                  <input
                    type="text"
                    value={totalRent}
                    onChange={(e) => {
                      const raw = e.target.value.replace(/[^\d]/g, '');
                      setTotalRent(raw ? formatAmount(raw) : '');
                    }}
                    placeholder="1,000,000"
                    className="w-full h-12 rounded-xl border-gray-200 dark:border-gray-700 focus:border-primary focus:ring-primary text-charcoal dark:text-white pl-10 pr-4 bg-white dark:bg-gray-900 text-lg font-bold"
                  />
                </div>
                {selectedProp && totalRent && (
                  <p className="text-xs text-gray-500 mt-1">
                    ≈ ₮{(parseFloat(totalRent.replace(/,/g, '')) / soldShares).toLocaleString(undefined, { maximumFractionDigits: 0 })} per share
                  </p>
                )}
              </div>

              {/* Distribute Button */}
              <button
                onClick={handleDistribute}
                disabled={distributing || !selectedProperty || !totalRent}
                className="w-full h-12 bg-primary text-white font-bold rounded-xl hover:bg-emerald-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
              >
                {distributing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                    Distributing...
                  </>
                ) : (
                  <>
                    <span className="material-icons-round text-xl">send</span>
                    Distribute Dividends
                  </>
                )}
              </button>

              {error && (
                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
                  <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
                </div>
              )}

              {result && (
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl">
                  <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">Distribution Successful!</p>
                  <p className="text-sm text-emerald-600 dark:text-emerald-400">
                    ₮{parseFloat(result.total_rent).toLocaleString()} distributed to {result.shareholders_count} shareholders for {result.property_name}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Distributions */}
        <div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h2 className="text-lg font-bold text-charcoal dark:text-white mb-4 flex items-center gap-2">
              <span className="material-icons-round text-primary text-xl">history</span>
              Recent Dividends
            </h2>
            {history.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-8">
                No dividend distributions yet
              </p>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {history.map((tx: any, i: number) => (
                  <div key={tx.id || i} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                    <div>
                      <p className="text-sm font-bold text-charcoal dark:text-white">
                        ₮{parseFloat(tx.amount || '0').toLocaleString()}
                      </p>
                      <p className="text-xs text-gray-500">{tx.description || 'Dividend'}</p>
                    </div>
                    <span className="text-xs text-gray-400">
                      {new Date(tx.created_at || tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDividends;
