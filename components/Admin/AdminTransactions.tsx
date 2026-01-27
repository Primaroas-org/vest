import React, { useEffect, useState } from 'react';
import { Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_id: string;
  asset: string;
  user: string;
  amount: string;
  type: string;
  date: string;
  status: string;
}

const AdminTransactions: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
        const response = await fetch('/api/admin/transactions?limit=100', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const mappedTransactions: Transaction[] = data.data.map((tx: any) => ({
              id: tx.id,
              transaction_id: `#TRX-${tx.id.slice(-4).toUpperCase()}`,
              asset: tx.property?.name || tx.description || 'N/A',
              user: tx.user?.full_name || tx.user?.email || 'Unknown',
              amount: `₮${parseFloat(tx.amount || '0').toLocaleString()}`,
              type: tx.transaction_type === 'withdrawal' ? 'Withdrawal' : tx.transaction_type === 'investment' ? 'Investment' : tx.transaction_type === 'dividend' ? 'Dividend' : 'Deposit',
              date: new Date(tx.created_at).toLocaleString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                hour: '2-digit', 
                minute: '2-digit' 
              }),
              status: tx.status === 'completed' ? 'Completed' : tx.status === 'pending' ? 'Processing' : 'Failed'
            }));
            setTransactions(mappedTransactions);
          }
        }
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.transaction_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.asset.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.user.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type.toLowerCase() === filterType.toLowerCase();
    return matchesSearch && matchesType;
  });

  if (loading) {
    return (
      <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-8"></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-black text-charcoal dark:text-white mb-2">Transaction History</h1>
        <p className="text-gray-500 dark:text-gray-400">Real-time log of all platform financial activities.</p>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex gap-4 bg-gray-50/50 dark:bg-gray-900/50">
            <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 size-4" />
                <input 
                type="text" 
                placeholder="Search transaction ID..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-10 pl-10 pr-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-sm focus:ring-primary focus:border-primary text-charcoal dark:text-white"
                />
            </div>
            <select 
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="h-10 px-4 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-bold text-charcoal dark:text-white bg-white dark:bg-gray-800"
            >
                <option value="all">All Types</option>
                <option value="investment">Investment</option>
                <option value="deposit">Deposit</option>
                <option value="withdrawal">Withdrawal</option>
                <option value="dividend">Dividend</option>
            </select>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
              <thead className="bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">User</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredTransactions.length > 0 ? (
                    filteredTransactions.map((tx) => (
                        <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                            <td className="px-6 py-4">
                                <div className="flex flex-col">
                                    <span className="text-sm font-bold text-charcoal dark:text-white font-mono">{tx.transaction_id}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-400">{tx.asset}</span>
                                </div>
                            </td>
                             <td className="px-6 py-4 text-sm font-medium text-charcoal dark:text-white">{tx.user}</td>
                             <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    {tx.type === 'Withdrawal' ? (
                                        <div className="p-1 rounded bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400"><ArrowDownLeft size={14}/></div>
                                    ) : (
                                        <div className="p-1 rounded bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400"><ArrowUpRight size={14}/></div>
                                    )}
                                    <span className="text-sm text-charcoal dark:text-white">{tx.type}</span>
                                </div>
                             </td>
                             <td className="px-6 py-4 text-sm font-bold text-charcoal dark:text-white">{tx.amount}</td>
                             <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">{tx.date}</td>
                             <td className="px-6 py-4 text-right">
                                <span className={`text-xs font-bold px-2 py-1 rounded-full 
                                    ${tx.status === 'Completed' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 
                                      tx.status === 'Processing' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300' : 
                                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'}`}>
                                    {tx.status}
                                </span>
                             </td>
                        </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-8 text-center text-gray-500 dark:text-gray-400">
                        No transactions found
                      </td>
                    </tr>
                  )}
              </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AdminTransactions;
