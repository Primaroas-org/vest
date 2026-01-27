import React, { useEffect, useState } from 'react';
import { Search, Filter, MoreHorizontal, Mail, Phone } from 'lucide-react';

interface Investor {
  id: string;
  name: string;
  email: string;
  joined: string;
  invested: string;
  status: string;
}

const DownloadIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
    <polyline points="7 10 12 15 17 10"/>
    <line x1="12" y1="15" x2="12" y2="3"/>
  </svg>
);

const AdminInvestors: React.FC = () => {
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalInvestors, setTotalInvestors] = useState(0);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchInvestors = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
        const response = await fetch(`/api/admin/investors?page=${currentPage}&limit=${itemsPerPage}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const mappedInvestors: Investor[] = data.data.map((inv: any) => ({
              id: inv.id,
              name: inv.full_name || inv.email?.split('@')[0] || 'Unknown',
              email: inv.email,
              joined: new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
              invested: `₮${parseFloat(inv.total_invested || '0').toLocaleString()}`,
              status: inv.kyc_status === 'verified' ? 'Active' : inv.kyc_status === 'rejected' ? 'Inactive' : 'Pending'
            }));
            setInvestors(mappedInvestors);
            setTotalInvestors(data.pagination?.total || 0);
          }
        }
      } catch (error) {
        console.error('Error fetching investors:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchInvestors();
  }, [currentPage]);

  const filteredInvestors = investors.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
           <h1 className="text-3xl font-black text-charcoal dark:text-white mb-2">Investor Management</h1>
           <p className="text-gray-500 dark:text-gray-400">Manage KYC status and investment portfolios.</p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl text-sm font-bold text-charcoal dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
            <DownloadIcon /> Export CSV
          </button>
          <button className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl text-sm font-bold hover:shadow-lg hover:shadow-primary/20 transition-all">
            + Invite Investor
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row gap-4 justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
            <input 
              type="text" 
              placeholder="Search by name, email or phone..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary focus:border-primary text-charcoal dark:text-white"
            />
          </div>
          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-charcoal dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
              <Filter className="size-3" /> Status: All
            </button>
             <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-xs font-bold text-charcoal dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700">
              <Filter className="size-3" /> Sort: Newest
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
              <tr>
                <th className="px-6 py-4">Investor Name</th>
                <th className="px-6 py-4">Date Joined</th>
                <th className="px-6 py-4">Total Invested</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredInvestors.length > 0 ? (
                filteredInvestors.map((inv) => (
                  <tr key={inv.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="size-8 rounded-full bg-primary/20 flex items-center justify-center text-charcoal dark:text-white font-bold text-xs">
                          {inv.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-charcoal dark:text-white text-sm">{inv.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{inv.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-charcoal dark:text-white font-medium">{inv.joined}</td>
                    <td className="px-6 py-4 text-sm font-bold text-charcoal dark:text-white">{inv.invested}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold capitalize
                        ${inv.status === 'Active' ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300' : 
                          inv.status === 'Pending' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300' : 
                          'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'}`}>
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                         <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-charcoal dark:text-white" title="Email"><Mail size={16}/></button>
                         <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-charcoal dark:text-white" title="Call"><Phone size={16}/></button>
                         <button className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-charcoal dark:text-white"><MoreHorizontal size={16}/></button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                    No investors found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50/50 dark:bg-gray-900/50">
            <p className="text-xs font-bold text-gray-500 dark:text-gray-400">Showing {filteredInvestors.length} of {totalInvestors} investors</p>
            <div className="flex gap-2">
                <button 
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-bold text-gray-500 dark:text-gray-400 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Prev
                </button>
                <button 
                  onClick={() => setCurrentPage(p => p + 1)}
                  disabled={filteredInvestors.length < itemsPerPage}
                  className="px-3 py-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded text-xs font-bold text-charcoal dark:text-white hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Next
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default AdminInvestors;
