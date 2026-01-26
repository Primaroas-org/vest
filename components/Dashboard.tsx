import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

type DashboardTab = 'overview' | 'wallet' | 'transactions' | 'settings';

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { dict } = useLanguage();
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    if (!user) {
        onNavigate('login');
        return null;
    }

    // Get active tab from current path
    const getActiveTab = (): DashboardTab => {
        const path = location.pathname;
        if (path === '/dashboard/wallet') return 'wallet';
        if (path === '/dashboard/transactions') return 'transactions';
        if (path === '/dashboard/settings') return 'settings';
        return 'overview'; // default to overview
    };

    const activeTab = getActiveTab();

    const handleTabClick = (tab: DashboardTab) => {
        if (tab === 'overview') {
            navigate('/dashboard');
        } else {
            navigate(`/dashboard/${tab}`);
        }
    };

    return (
        <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900 text-slate-900 dark:text-slate-100 font-sans antialiased">
            {/* Sidebar */}
            <aside className="w-72 bg-gray-900 dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col fixed h-full z-20 overflow-y-auto">
                <div className="p-8 mb-4">
                    <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('marketplace')}>
                        <div className="size-10 bg-emerald-500 dark:bg-emerald-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                            <span className="material-icons-round font-bold">account_balance</span>
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-gray-900 dark:text-white tracking-tight font-display uppercase italic">
                                {dict.brandName} <span className="text-emerald-500 dark:text-emerald-400">Capital</span>
                            </h1>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-[0.2em]">
                                {dict.dashboard.privateWealth}
                            </p>
                        </div>
                    </div>
                </div>

                <nav className="flex-1 px-4 space-y-1.5">
                    <div className="px-4 py-3">
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{dict.dashboard.mainMenu}</p>
                    </div>
                    <button
                        onClick={() => handleTabClick('overview')}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group cursor-pointer ${activeTab === 'overview' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <span className="material-icons-round text-xl">grid_view</span>
                        <span className="text-sm font-semibold tracking-wide">{dict.dashboard.investorPortfolio}</span>
                    </button>
                    <button
                        className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all group cursor-pointer"
                        onClick={() => onNavigate('marketplace')}
                    >
                        <span className="material-icons-round text-xl group-hover:scale-110 transition-transform">apartment</span>
                        <span className="text-sm font-medium tracking-wide">{dict.nav.marketplace}</span>
                    </button>
                    <button
                        onClick={() => handleTabClick('transactions')}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group cursor-pointer ${activeTab === 'transactions' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <span className="material-icons-round text-xl">receipt_long</span>
                        <span className="text-sm font-medium tracking-wide">{dict.nav.transactions}</span>
                    </button>
                    <button
                        onClick={() => handleTabClick('wallet')}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group cursor-pointer ${activeTab === 'wallet' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <span className="material-icons-round text-xl">account_balance_wallet</span>
                        <span className="text-sm font-medium tracking-wide">{dict.nav.wallet}</span>
                    </button>

                    <div className="px-4 py-6">
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{dict.dashboard.reporting}</p>
                    </div>
                    <button className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all cursor-pointer">
                        <span className="material-icons-round text-xl">description</span>
                        <span className="text-sm font-medium tracking-wide">{dict.dashboard.taxStatements}</span>
                    </button>
                    <button
                        onClick={() => handleTabClick('settings')}
                        className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group cursor-pointer ${activeTab === 'settings' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'}`}
                    >
                        <span className="material-icons-round text-xl">settings</span>
                        <span className="text-sm font-medium tracking-wide">{dict.dashboard.accountSettings}</span>
                    </button>

                    <div className="mt-8 px-4">
                        <button
                            onClick={() => {
                                logout();
                                onNavigate('marketplace');
                            }}
                            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-red-500 dark:text-red-400 hover:bg-red-500/10 dark:hover:bg-red-400/10 transition-all cursor-pointer"
                        >
                            <span className="material-icons-round text-xl">logout</span>
                            <span className="text-sm font-medium tracking-wide">{dict.nav.logout}</span>
                        </button>
                    </div>
                </nav>
            </aside>

            <main className="flex-1 ml-72 p-10 bg-gray-50 dark:bg-gray-900">
                <header className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display">
                            {activeTab === 'overview' && dict.dashboard.investorPortfolio}
                            {activeTab === 'wallet' && dict.nav.wallet}
                            {activeTab === 'transactions' && dict.nav.transactions}
                            {activeTab === 'settings' && dict.nav.settings}
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">{dict.dashboard.wealthDashboard} • 2024</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-2">
                            <button className="size-11 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                                <span className="material-icons-round">search</span>
                            </button>
                            <button className="size-11 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors relative">
                                <span className="material-icons-round">notifications</span>
                                <span className="absolute top-3 right-3 size-2 bg-emerald-500 dark:bg-emerald-400 rounded-full border-2 border-white dark:border-gray-800"></span>
                            </button>
                        </div>
                        <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.name}</p>
                                <p className="text-[11px] text-emerald-500 dark:text-emerald-400 font-bold uppercase tracking-wider">{user.isVerified ? dict.dashboard.kycVerified : 'Pending'}</p>
                            </div>
                            <div className="size-12 rounded-2xl bg-gray-300 dark:bg-gray-600 overflow-hidden border-2 border-white dark:border-gray-700 shadow-lg" style={{ backgroundImage: `url('${user.avatar}')`, backgroundSize: "cover" }}></div>
                        </div>
                    </div>
                </header>

        <Routes>
          <Route path="/" element={<OverviewView onNavigate={onNavigate} />} />
          <Route path="/assets" element={<AssetsView />} />
          <Route path="/dividends" element={<DividendsView />} />
          <Route path="/holdings" element={<HoldingsView />} />
          <Route path="/performance" element={<PerformanceView />} />
          <Route path="/wallet" element={<WalletView />} />
          <Route path="/transactions" element={<TransactionsView />} />
          <Route path="/settings" element={<SettingsView />} />
        </Routes>
            </main>
        </div>
    );
};

const OverviewView: React.FC<{ onNavigate: (view: ViewState) => void }> = ({ onNavigate }) => {
    const { dict } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [stats, setStats] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            try {
                const response = await fetch('/api/dashboard/stats', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    if (loading) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">Loading dashboard...</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                {/* Stats Cards */}
                <div
                    className="bg-white dark:bg-gray-800 p-7 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group cursor-pointer"
                    onClick={() => navigate('/dashboard/assets')}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            <span className="material-icons-round">account_balance_wallet</span>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-1 rounded-full">
                            <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-bold">+8.2%</span>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{dict.dashboard.totalAssets}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white font-display">{(stats?.totalAssets || 0).toLocaleString()} <span className="text-lg font-bold text-gray-600 dark:text-gray-300 tracking-normal">₮</span></p>
                </div>

                <div
                    className="bg-white dark:bg-gray-800 p-7 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group cursor-pointer"
                    onClick={() => navigate('/dashboard/dividends')}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            <span className="material-icons-round">payments</span>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-1 rounded-full">
                            <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-bold">+12.5%</span>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{dict.dashboard.totalDividends}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white font-display">{(stats?.totalDividends || 0).toLocaleString()} <span className="text-lg font-bold text-gray-600 dark:text-gray-300 tracking-normal">₮</span></p>
                </div>

                <div
                    className="bg-white dark:bg-gray-800 p-7 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group cursor-pointer"
                    onClick={() => navigate('/dashboard/performance')}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            <span className="material-icons-round">show_chart</span>
                        </div>
                        <div className="flex items-center gap-1 bg-emerald-500/10 dark:bg-emerald-400/10 px-2 py-1 rounded-full">
                            <span className="text-emerald-500 dark:text-emerald-400 text-[10px] font-bold">{dict.dashboard.stable}</span>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{dict.dashboard.appreciation}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white font-display">+{stats?.performance || '0.00'}<span className="text-lg font-bold text-gray-600 dark:text-gray-300 tracking-normal">%</span></p>
                </div>

                <div
                    className="bg-white dark:bg-gray-800 p-7 rounded-[2rem] shadow-lg border border-gray-200 dark:border-gray-700 hover:shadow-xl transition-all group cursor-pointer"
                    onClick={() => navigate('/dashboard/holdings')}
                >
                    <div className="flex justify-between items-start mb-6">
                        <div className="size-12 bg-gray-100 dark:bg-gray-700 rounded-2xl flex items-center justify-center shadow-sm text-gray-500 dark:text-gray-400 group-hover:text-emerald-500 dark:group-hover:text-emerald-400 transition-colors">
                            <span className="material-icons-round">corporate_fare</span>
                        </div>
                    </div>
                    <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">{dict.dashboard.activeHoldings}</p>
                    <p className="text-2xl font-black text-gray-900 dark:text-white font-display">{stats?.activeHoldings || 0} <span className="text-lg font-bold text-gray-600 dark:text-gray-300 tracking-normal">{dict.dashboard.properties}</span></p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
                <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display">{dict.dashboard.portfolioPerformance}</h3>
                            <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{dict.dashboard.netEquityGrowth}</p>
                        </div>
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1.5 rounded-2xl border border-gray-200 dark:border-gray-600">
                            <button className="px-5 py-2 text-xs font-bold bg-white dark:bg-gray-800 text-emerald-500 dark:text-emerald-400 shadow-sm rounded-xl">{dict.dashboard.yearly}</button>
                            <button className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{dict.dashboard.monthly}</button>
                            <button className="px-5 py-2 text-xs font-bold text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">{dict.dashboard.weekly}</button>
                        </div>
                    </div>
                    <div className="h-72 relative">
                        <div className="absolute inset-0 flex flex-col justify-between opacity-30">
                            <div className="border-b border-dashed border-gray-400 dark:border-gray-600 w-full h-0"></div>
                            <div className="border-b border-dashed border-gray-400 dark:border-gray-600 w-full h-0"></div>
                            <div className="border-b border-dashed border-gray-400 dark:border-gray-600 w-full h-0"></div>
                            <div className="border-b border-dashed border-gray-400 dark:border-gray-600 w-full h-0"></div>
                            <div className="border-b border-dashed border-gray-400 dark:border-gray-600 w-full h-0"></div>
                        </div>
                        <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox="0 0 800 200">
                            <defs>
                                <linearGradient id="emeraldGradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.15"></stop>
                                    <stop offset="100%" stopColor="#10b981" stopOpacity="0"></stop>
                                </linearGradient>
                            </defs>
                            <path d="M0,180 C50,165 100,175 150,135 C200,95 250,115 300,75 C350,35 400,55 450,25 C500,0 550,45 600,25 C650,5 700,35 800,15 L800,200 L0,200 Z" fill="url(#emeraldGradient)"></path>
                            <path d="M0,180 C50,165 100,175 150,135 C200,95 250,115 300,75 C350,35 400,55 450,25 C500,0 550,45 600,25 C650,5 700,35 800,15" fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path>
                        </svg>
                        <div className="flex justify-between mt-6 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] px-2">
                            <span>Q1 2023</span><span>Q2 2023</span><span>Q3 2023</span><span>Q4 2023</span><span>Q1 2024</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display mb-8">{dict.dashboard.assetType}</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="relative flex justify-center items-center group">
                            <div className="size-52 rounded-full border-[18px] border-gray-100 dark:border-gray-700 relative shadow-inner">
                                <div className="absolute inset-[-18px] rounded-full border-[18px] border-emerald-500 dark:border-emerald-400" style={{ clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)" }}></div>
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                                    <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{dict.dashboard.growth}</span>
                                    <p className="text-3xl font-black text-gray-900 dark:text-white font-display">65%</p>
                                </div>
                            </div>
                        </div>
                        <div className="w-full space-y-5 mt-10">
                            <div className="flex items-center justify-between group cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="size-4 rounded-full bg-emerald-500 dark:bg-emerald-400 shadow-sm shadow-emerald-500/30 dark:shadow-emerald-400/30"></div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{dict.property.residential}</span>
                                </div>
                                <span className="text-sm font-black text-gray-900 dark:text-white">162.5M ₮</span>
                            </div>
                            <div className="flex items-center justify-between group cursor-default">
                                <div className="flex items-center gap-4">
                                    <div className="size-4 rounded-full bg-gray-300 dark:bg-gray-600"></div>
                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{dict.property.commercial}</span>
                                </div>
                                <span className="text-sm font-black text-gray-900 dark:text-white">87.5M ₮</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="p-10 border-b border-gray-100 dark:border-gray-700 flex justify-between items-center">
                    <div>
                        <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight font-display">{dict.dashboard.activeInvestments}</h3>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400 mt-1">{dict.dashboard.liveTracking}</p>
                    </div>
                    <button className="flex items-center gap-2 px-6 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl text-sm font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-all border border-gray-200 dark:border-gray-600">
                        {dict.dashboard.generateReport}
                        <span className="material-icons-round text-lg">download</span>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/50 dark:bg-gray-700/50">
                                <th className="px-10 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{dict.dashboard.propertyAsset}</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{dict.dashboard.ownership}</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{dict.dashboard.marketValue}</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{dict.dashboard.performance}</th>
                                <th className="px-8 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em]">{dict.dashboard.incomeStatus}</th>
                                <th className="px-10 py-5 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] text-right">{dict.nav.settings}</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                            <tr className="hover:bg-gray-50/40 dark:hover:bg-gray-700/40 transition-colors group">
                                <td className="px-10 py-8">
                                    <div className="flex items-center gap-5">
                                        <div className="size-16 rounded-2xl bg-gray-200 dark:bg-gray-600 flex-shrink-0 bg-cover bg-center border border-white dark:border-gray-700 shadow-sm" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzVMurs54HjXYQcY-EAo4hwc1SHeF3ypsFOHAikcLpOeVmLBIXILJAxxYRnFgqbn9FtGJXUh_krdUKUcfZiz2VzdA7tWteXLGjiILUrvxgbn3CJjmDyaPWjli7QUrYMeBL-HnmAmr2oAk1Ko-HHiRk8uJVdA_fOV0bYuT2D6_tECMvIkyakQOV3DKMahRi-Vi1V-tcFVmsO4Cp1XfnTBYAXB4I-WwsYYtU8pYCBht8qSifqoDGcNYFu6cPk30_QZ4wR0qMYa1sBnQ')" }}></div>
                                        <div>
                                            <p className="text-base font-extrabold text-gray-900 dark:text-white font-display">Sky Garden Residence</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className="material-icons-round text-xs text-gray-500 dark:text-gray-400">location_on</span>
                                                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Ulaanbaatar • Khan-Uul</p>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-end">
                                            <p className="text-sm font-extrabold text-gray-900 dark:text-white">2.5%</p>
                                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">450 {dict.dashboard.units}</p>
                                        </div>
                                        <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div className="bg-emerald-500 dark:bg-emerald-400 h-full w-[25%]" style={{ width: "25%" }}></div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-8">
                                    <p className="text-base font-black text-gray-900 dark:text-white">85,200,000 <span className="text-sm font-bold text-gray-600 dark:text-gray-300 tracking-normal">₮</span></p>
                                </td>
                                <td className="px-8 py-8">
                                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-500 dark:text-emerald-400 text-xs font-black">
                                        <span className="material-icons-round text-[14px] font-black">trending_up</span>
                                        +12.4%
                                    </span>
                                </td>
                                <td className="px-8 py-8">
                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                                        <p className="text-[10px] font-extrabold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">{dict.dashboard.nextPayout}</p>
                                        <p className="text-xs font-bold text-gray-900 dark:text-white">Dec 15, 2023</p>
                                    </div>
                                </td>
                                <td className="px-10 py-8 text-right">
                                    <button className="size-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all">
                                        <span className="material-icons-round">more_horiz</span>
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const WalletView: React.FC = () => {
    const { dict } = useLanguage();
    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-charcoal to-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <span className="material-icons-round text-9xl">account_balance_wallet</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">{dict.dashboard.wallet.balance}</p>
                        <p className="text-4xl font-display font-black mb-8">₮ 5,400,000</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">{dict.dashboard.wallet.available}</p>
                                <p className="text-xl font-bold">₮ 5,200,000</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">{dict.dashboard.wallet.locked}</p>
                                <p className="text-xl font-bold">₮ 200,000</p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button className="flex-1 bg-emerald-green hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-green/20 transition-all active:scale-95">
                                {dict.dashboard.wallet.deposit}
                            </button>
                            <button className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold backdrop-blur-sm transition-all active:scale-95">
                                {dict.dashboard.wallet.withdraw}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dict.dashboard.wallet.cards}</h3>
                        <button className="text-emerald-500 dark:text-emerald-400 font-bold text-sm hover:underline">+ Add New</button>
                    </div>
                    <div className="space-y-4">
                        <div className="p-4 rounded-2xl border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-gray-800 dark:bg-gray-700 rounded-lg"></div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">Khan Bank</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">**** 4589</p>
                                </div>
                            </div>
                            <span className="material-icons-round text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400">check_circle</span>
                        </div>
                        <div className="p-4 rounded-2xl border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors cursor-pointer group">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-8 bg-blue-800 dark:bg-blue-700 rounded-lg"></div>
                                <div>
                                    <p className="font-bold text-gray-900 dark:text-white">Golomt Bank</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-400">**** 1234</p>
                                </div>
                            </div>
                            <span className="material-icons-round text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400">radio_button_unchecked</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

const TransactionsView: React.FC = () => {
    const { dict } = useLanguage();
    return (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dict.dashboard.transactions.title}</h3>
            </div>
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-gray-50/50 dark:bg-gray-700/50">
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{dict.dashboard.transactions.type}</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{dict.dashboard.transactions.amount}</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{dict.dashboard.transactions.date}</th>
                        <th className="px-8 py-4 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{dict.dashboard.transactions.status}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                    {[
                        { type: 'Deposit', amount: '+ ₮ 1,000,000', date: 'Oct 24, 2023', status: 'completed' },
                        { type: 'Investment', amount: '- ₮ 500,000', date: 'Oct 22, 2023', status: 'completed' },
                        { type: 'Dividend', amount: '+ ₮ 25,000', date: 'Oct 15, 2023', status: 'completed' },
                        { type: 'Withdrawal', amount: '- ₮ 100,000', date: 'Oct 10, 2023', status: 'pending' },
                    ].map((tx, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            <td className="px-8 py-4 font-bold text-gray-900 dark:text-white">{tx.type}</td>
                            <td className={`px-8 py-4 font-bold ${tx.amount.startsWith('+') ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>{tx.amount}</td>
                            <td className="px-8 py-4 text-gray-600 dark:text-gray-400 text-sm">{tx.date}</td>
                            <td className="px-8 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${tx.status === 'completed' ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300' : 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                                    }`}>
                                    {tx.status === 'completed' ? dict.dashboard.transactions.completed : dict.dashboard.transactions.pending}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};

const AssetsView: React.FC = () => {
    const { dict } = useLanguage();
    const { user } = useAuth();
    const [assets, setAssets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAssets = async () => {
            if (!user) return;

            try {
                const response = await fetch('/api/dashboard/assets', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setAssets(data.assets || []);
                }
            } catch (error) {
                console.error('Error fetching assets:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchAssets();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading assets...</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalValue = assets.reduce((sum, asset) => sum + (asset.amount_invested || 0), 0);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Total Assets</h3>
                <div className="text-center py-8 mb-8">
                    <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                        {totalValue.toLocaleString()} ₮
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Across {assets.length} investments</p>
                </div>

                {assets.length > 0 ? (
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Investment Breakdown</h4>
                        {assets.map((asset, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {asset.properties?.title || 'Unknown Property'}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {asset.properties?.location || 'Unknown Location'}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {asset.amount_invested?.toLocaleString() || 0} ₮
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {asset.shares_owned || 0} shares
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">No assets found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const DividendsView: React.FC = () => {
    const { dict } = useLanguage();
    const { user } = useAuth();
    const [dividends, setDividends] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDividends = async () => {
            if (!user) return;

            try {
                const response = await fetch('/api/dashboard/dividends', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setDividends(data.dividends || []);
                }
            } catch (error) {
                console.error('Error fetching dividends:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDividends();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading dividends...</p>
                    </div>
                </div>
            </div>
        );
    }

    const totalDividends = dividends.reduce((sum, dividend) => sum + (dividend.amount || 0), 0);

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Total Dividends</h3>
                <div className="text-center py-8 mb-8">
                    <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                        {totalDividends.toLocaleString()} ₮
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">From {dividends.length} payments</p>
                </div>

                {dividends.length > 0 ? (
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Payment History</h4>
                        {dividends.map((dividend, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            Dividend Payment
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {new Date(dividend.payment_date).toLocaleDateString()}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-bold text-green-600 dark:text-green-400">
                                            +{dividend.amount?.toLocaleString() || 0} ₮
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400">
                                            {dividend.status || 'Paid'}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">No dividend payments yet</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const HoldingsView: React.FC = () => {
    const { dict } = useLanguage();
    const { user } = useAuth();
    const [holdings, setHoldings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHoldings = async () => {
            if (!user) return;

            try {
                const response = await fetch('/api/dashboard/holdings', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setHoldings(data.holdings || []);
                }
            } catch (error) {
                console.error('Error fetching holdings:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchHoldings();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading holdings...</p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Active Holdings</h3>
                <div className="text-center py-8 mb-8">
                    <p className="text-4xl font-black text-gray-900 dark:text-white mb-2">
                        {holdings.length}
                    </p>
                    <p className="text-gray-600 dark:text-gray-400">Active Properties</p>
                </div>

                {holdings.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {holdings.map((holding, index) => (
                            <div key={index} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl">
                                <div className="aspect-video bg-gray-200 dark:bg-gray-600 rounded-xl mb-4 overflow-hidden">
                                    <img
                                        src={holding.properties?.image || '/placeholder-property.jpg'}
                                        alt={holding.properties?.title || 'Property'}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-900 dark:text-white mb-2">
                                        {holding.properties?.title || 'Unknown Property'}
                                    </h4>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                                        {holding.properties?.location || 'Unknown Location'}
                                    </p>
                                    <div className="flex justify-between items-center text-sm">
                                        <span className="text-gray-600 dark:text-gray-400">
                                            {holding.shares_owned || 0} shares
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {holding.amount_invested?.toLocaleString() || 0} ₮
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-600 dark:text-gray-400">No active holdings found</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PerformanceView: React.FC = () => {
    const { dict } = useLanguage();
    const { user } = useAuth();
    const [performanceData, setPerformanceData] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPerformance = async () => {
            if (!user) return;

            try {
                const response = await fetch('/api/dashboard/performance', {
                    headers: {
                        'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setPerformanceData(data);
                }
            } catch (error) {
                console.error('Error fetching performance:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchPerformance();
    }, [user]);

    if (loading) {
        return (
            <div className="space-y-8">
                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="text-center py-12">
                        <p className="text-gray-600 dark:text-gray-400">Loading performance...</p>
                    </div>
                </div>
            </div>
        );
    }

    const performancePercentage = performanceData?.currentValue && performanceData?.totalInvested
        ? ((performanceData.currentValue - performanceData.totalInvested) / performanceData.totalInvested * 100).toFixed(2)
        : '0.00';

    return (
        <div className="space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Portfolio Performance</h3>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Invested</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {(performanceData?.totalInvested || 0).toLocaleString()} ₮
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Current Value</p>
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {(performanceData?.currentValue || 0).toLocaleString()} ₮
                        </p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl text-center">
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Total Return</p>
                        <p className={`text-2xl font-black ${parseFloat(performancePercentage) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                            {parseFloat(performancePercentage) >= 0 ? '+' : ''}{performancePercentage}%
                        </p>
                    </div>
                </div>

                {performanceData?.investments && performanceData.investments.length > 0 && (
                    <div className="space-y-4">
                        <h4 className="text-lg font-bold text-gray-900 dark:text-white">Investment Performance</h4>
                        {performanceData.investments.map((investment: any, index: number) => {
                            const investmentReturn = investment.current_value && investment.amount_invested
                                ? ((investment.current_value - investment.amount_invested) / investment.amount_invested * 100).toFixed(2)
                                : '0.00';

                            return (
                                <div key={index} className="bg-gray-50 dark:bg-gray-700 p-4 rounded-xl">
                                    <div className="flex justify-between items-center">
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">
                                                {investment.properties?.title || 'Unknown Property'}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {investment.amount_invested?.toLocaleString() || 0} ₮ invested
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-bold ${parseFloat(investmentReturn) >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                                                {parseFloat(investmentReturn) >= 0 ? '+' : ''}{investmentReturn}%
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-400">
                                                {investment.current_value?.toLocaleString() || 0} ₮ current
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

const SettingsView: React.FC = () => {
    const { dict } = useLanguage();
    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{dict.dashboard.settings.personalInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                        <input type="text" defaultValue="Battulga" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                        <input type="text" defaultValue="Erden" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                        <input type="email" defaultValue="battulga@example.com" className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white" />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button className="bg-emerald-500 dark:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors">
                        {dict.dashboard.settings.update}
                    </button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{dict.dashboard.settings.notifications}</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">Email Notifications</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Receive updates about your portfolio</p>
                        </div>
                        <div className="w-12 h-6 bg-emerald-500 dark:bg-emerald-600 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 size-4 bg-white dark:bg-gray-800 rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">New Investment Alerts</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Get notified when new properties drop</p>
                        </div>
                        <div className="w-12 h-6 bg-emerald-500 dark:bg-emerald-600 rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 size-4 bg-white dark:bg-gray-800 rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};