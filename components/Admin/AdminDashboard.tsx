import React, { useEffect, useState } from 'react';
import { ArrowUpRight, Users, Building2, Wallet } from 'lucide-react';

interface AdminStats {
  totalAssetsValue: string;
  activeInvestors: number;
  totalCapitalRaised: string;
  avgAnnualYield: string;
}

const StatCard = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-gray-800 p-6 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
    <div className="flex justify-between items-start mb-4">
      <div className={`p-3 rounded-lg ${color}`}>
        <Icon className="size-6 text-charcoal dark:text-white" />
      </div>
      {change && (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-full">
          <ArrowUpRight className="size-3" />
          <span className="text-xs font-bold">{change}</span>
        </div>
      )}
    </div>
    <p className="text-gray-500 dark:text-gray-400 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
    <h3 className="text-2xl font-black text-charcoal dark:text-white">{value}</h3>
  </div>
);

const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
        const response = await fetch('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setStats(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching admin stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  useEffect(() => {
    const fetchRecentActivity = async () => {
      try {
        const token = localStorage.getItem('access_token') || localStorage.getItem('supabase.auth.token');
        const response = await fetch('/api/admin/transactions?limit=5', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            setRecentActivity(data.data);
          }
        }
      } catch (error) {
        console.error('Error fetching recent activity:', error);
      }
    };

    fetchRecentActivity();
  }, []);

  if (loading) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-xl"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-black text-charcoal dark:text-white">Dashboard Overview</h1>
        <p className="text-gray-500 dark:text-gray-400">Welcome back, here is what is happening with your portfolio today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total Assets Value" 
          value={stats?.totalAssetsValue || "₮0"} 
          change="" 
          icon={Building2}
          color="bg-primary/20"
        />
        <StatCard 
          title="Active Investors" 
          value={stats?.activeInvestors?.toLocaleString() || "0"} 
          change="" 
          icon={Users}
          color="bg-blue-100 dark:bg-blue-900/20"
        />
        <StatCard 
          title="Total Capital Raised" 
          value={stats?.totalCapitalRaised || "₮0"} 
          change="" 
          icon={Wallet}
          color="bg-yellow-100 dark:bg-yellow-900/20"
        />
        <StatCard 
          title="Avg. Annual Yield" 
          value={stats?.avgAnnualYield || "0%"} 
          change="" 
          icon={ArrowUpRight}
          color="bg-purple-100 dark:bg-purple-900/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Chart Area Placeholder */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6 min-h-[400px]">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-bold text-lg text-charcoal dark:text-white">Revenue Performance</h3>
            <select className="bg-gray-50 dark:bg-gray-700 border-none text-xs font-bold rounded-lg px-3 py-2 text-charcoal dark:text-white focus:ring-0">
              <option>This Year</option>
              <option>Last Year</option>
            </select>
          </div>
          <div className="h-[300px] flex items-end justify-between gap-2 px-4">
             {[40, 65, 45, 80, 55, 70, 40, 65, 85, 90, 75, 60].map((h, i) => (
               <div key={i} className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative group">
                  <div 
                    style={{ height: `${h}%` }} 
                    className="absolute bottom-0 left-0 right-0 bg-primary rounded-t-lg transition-all duration-500 hover:bg-emerald-600"
                  ></div>
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-charcoal dark:bg-gray-800 text-white text-xs font-bold px-2 py-1 rounded transition-opacity">
                    ₮{h}M
                  </div>
               </div>
             ))}
          </div>
          <div className="flex justify-between mt-4 text-xs font-bold text-gray-500 dark:text-gray-400 px-2">
            {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map(m => (
              <span key={m}>{m}</span>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
          <h3 className="font-bold text-lg text-charcoal dark:text-white mb-6">Recent Activity</h3>
          <div className="space-y-6">
            {recentActivity.length > 0 ? (
              recentActivity.map((activity, i) => (
                <div key={i} className="flex gap-4 items-start">
                  <div className="size-2 mt-2 rounded-full bg-primary shrink-0"></div>
                  <div>
                    <p className="text-sm font-bold text-charcoal dark:text-white">
                      {activity.transaction_type === 'investment' ? `Investment in ${activity.property?.name || 'Property'}` : activity.description}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      User invested ₮{parseFloat(activity.amount || '0').toLocaleString()}
                    </p>
                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
                      {new Date(activity.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <p className="text-sm text-gray-500 dark:text-gray-400">No recent activity</p>
              </div>
            )}
          </div>
          <button className="w-full mt-6 py-3 text-sm font-bold text-primary border border-primary/20 rounded-xl hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
