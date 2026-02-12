import React, { useEffect, useState, useRef } from 'react';
import { useNavigate, useLocation, Routes, Route } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { ViewState } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { SkeletonCard, SkeletonTable, SkeletonGraph, SkeletonList, SkeletonGrid, SkeletonText } from './Skeletons';
import { cachedFetch, getCached, invalidateDashboardCache } from '../utils/apiCache';
import DepositPage from './Wallet/DepositPage';
import DepositConfirmation from './Wallet/DepositConfirmation';
import WithdrawPage from './Wallet/WithdrawPage';
import WithdrawConfirmation from './Wallet/WithdrawConfirmation';

interface DashboardProps {
    onNavigate: (view: ViewState) => void;
}

type DashboardTab = 'overview' | 'wallet' | 'transactions' | 'settings';

const NotificationsDropdown: React.FC<{
    notifications: any[];
    onClose: () => void;
    onMarkRead: (id: string) => void;
}> = ({ notifications, onClose, onMarkRead }) => {
    const { dict } = useLanguage();

    return (
        <div
            className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 z-50 max-h-96 overflow-hidden"
            onClick={(e) => e.stopPropagation()}
        >
            <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <h3 className="font-bold text-gray-900 dark:text-white">Notifications</h3>
                <button
                    onClick={onClose}
                    className="text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                    <span className="material-icons-round text-lg">close</span>
                </button>
            </div>
            <div className="overflow-y-auto max-h-80">
                {notifications.length > 0 ? (
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                        {notifications.map((notification) => (
                            <div
                                key={notification.id}
                                className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors ${!notification.is_read ? 'bg-emerald-50/50 dark:bg-emerald-900/10' : ''
                                    }`}
                                onClick={() => {
                                    if (!notification.is_read) {
                                        onMarkRead(notification.id);
                                    }
                                }}
                            >
                                <div className="flex items-start gap-3">
                                    <div className={`size-2 rounded-full mt-2 flex-shrink-0 ${!notification.is_read ? 'bg-emerald-500' : 'bg-transparent'
                                        }`}></div>
                                    <div className="flex-1 min-w-0">
                                        <p className="font-bold text-gray-900 dark:text-white text-sm">
                                            {notification.title || 'Notification'}
                                        </p>
                                        <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                                            {notification.message || notification.description || ''}
                                        </p>
                                        <p className="text-[10px] text-gray-500 dark:text-gray-500 mt-2">
                                            {new Date(notification.created_at).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="p-8 text-center">
                        <p className="text-gray-500 dark:text-gray-400 text-sm">No notifications</p>
                    </div>
                )}
            </div>
        </div>
    );
};

const PerformanceGraph: React.FC<{ dataPoints: Array<{ date: string; value: number; invested: number }>; period: 'yearly' | 'monthly' | 'weekly' }> = ({ dataPoints, period }) => {
    if (dataPoints.length === 0) return null;

    const width = 800;
    const height = 200;
    const padding = 20;
    const graphWidth = width - padding * 2;
    const graphHeight = height - padding * 2;

    // Calculate min/max values
    const values = dataPoints.map(p => p.value);
    const minValue = Math.min(...values, 0);
    const maxValue = Math.max(...values);
    const range = maxValue - minValue || 1;

    // Generate path points
    const points = dataPoints.map((point, index) => {
        const x = padding + (index / (dataPoints.length - 1 || 1)) * graphWidth;
        const y = padding + graphHeight - ((point.value - minValue) / range) * graphHeight;
        return { x, y, value: point.value, date: point.date };
    });

    // Create smooth path using quadratic curves
    let pathData = '';
    if (points.length === 1) {
        pathData = `M ${points[0].x} ${points[0].y}`;
    } else if (points.length > 1) {
        pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            const prevPoint = points[i - 1];
            const currentPoint = points[i];
            const controlX = (prevPoint.x + currentPoint.x) / 2;
            pathData += ` Q ${prevPoint.x} ${prevPoint.y} ${controlX} ${currentPoint.y} T ${currentPoint.x} ${currentPoint.y}`;
        }
    }

    // Create area path (for gradient fill)
    const areaPath = points.length > 0
        ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`
        : '';

    // Format dates for labels
    const formatDate = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            if (period === 'yearly') {
                return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
            }
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        } catch {
            return dateStr;
        }
    };

    return (
        <>
            <svg className="w-full h-full relative z-10" preserveAspectRatio="none" viewBox={`0 0 ${width} ${height}`}>
                <defs>
                    <linearGradient id="emeraldGradient" x1="0" x2="0" y1="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" stopOpacity="0.15"></stop>
                        <stop offset="100%" stopColor="#10b981" stopOpacity="0"></stop>
                    </linearGradient>
                </defs>
                {areaPath && <path d={areaPath} fill="url(#emeraldGradient)"></path>}
                {pathData && <path d={pathData} fill="none" stroke="#10b981" strokeLinecap="round" strokeLinejoin="round" strokeWidth="4"></path>}
            </svg>
            <div className="flex justify-between mt-6 text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-[0.2em] px-2">
                {dataPoints.length > 0 && (
                    <>
                        <span>{formatDate(dataPoints[0].date)}</span>
                        {dataPoints.length > 2 && <span>{formatDate(dataPoints[Math.floor(dataPoints.length / 2)].date)}</span>}
                        <span>{formatDate(dataPoints[dataPoints.length - 1].date)}</span>
                    </>
                )}
            </div>
        </>
    );
};

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
    const { dict } = useLanguage();
    const { user, logout, loading: authLoading } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();
    const [notifications, setNotifications] = useState<any[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [showNotifications, setShowNotifications] = useState(false);
    const [authChecked, setAuthChecked] = useState(false);

    // Give auth a moment to initialize on page reload
    useEffect(() => {
        if (!authLoading) {
            // Small delay to ensure auth state is fully settled
            const timer = setTimeout(() => {
                setAuthChecked(true);
            }, 100);
            return () => clearTimeout(timer);
        }
    }, [authLoading]);

    // Debug: Log kycStatus changes
    useEffect(() => {
        if (user) {
            console.log('[Dashboard] User kycStatus:', user.kycStatus);
        }
    }, [user?.kycStatus]);

    // Use ref to track if initial notification fetch happened, avoid re-fetching on user object changes
    const notificationsFetchedRef = useRef(false);
    
    useEffect(() => {
        const token = localStorage.getItem('supabase.auth.token');
        
        const fetchUnreadCount = async () => {
            if (!user || !token) return;

            try {
                const response = await fetch('/api/notifications?unread_only=true', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setUnreadCount(data.data?.length || 0);
                }
            } catch (error) {
                console.error('Error fetching unread count:', error);
            }
        };

        const fetchAllNotifications = async () => {
            if (!user || !showNotifications || !token) return;

            try {
                const response = await fetch('/api/notifications', {
                    headers: {
                        'Authorization': `Bearer ${token}`,
                        'Content-Type': 'application/json'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    setNotifications(data.data || []);
                }
            } catch (error) {
                console.error('Error fetching notifications:', error);
            }
        };

        if (user && !notificationsFetchedRef.current) {
            fetchUnreadCount();
            notificationsFetchedRef.current = true;
        }
        if (showNotifications) {
            fetchAllNotifications();
        }
        // Refresh unread count every 30 seconds
        const interval = setInterval(fetchUnreadCount, 30000);
        return () => clearInterval(interval);
    }, [user?.id, showNotifications]);

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

    // Show loading state while checking authentication
    // Wait a bit longer to ensure session is fully restored
    if (authLoading || !authChecked) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center">
                    <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-500 dark:border-emerald-400 mb-4"></div>
                    <div className="space-y-2">
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
                        <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    // Show 401 screen or redirect to login if not authenticated
    // Only show 401 if we're sure auth has finished loading and user is null
    if (!authLoading && authChecked && !user) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="text-center max-w-md mx-auto px-4">
                    <div className="mb-8">
                        <div className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-red-100 dark:bg-red-900/20 mb-6">
                            <span className="material-icons-round text-5xl text-red-500 dark:text-red-400">lock</span>
                        </div>
                        <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white mb-2 font-display">{dict.dashboard.unauthorized.title}</h1>
                        <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-4">{dict.dashboard.unauthorized.heading}</h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-8">
                            {dict.dashboard.unauthorized.message}
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <button
                            onClick={() => navigate('/login')}
                            className="px-6 py-3 bg-emerald-500 dark:bg-emerald-600 text-white rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-all"
                        >
                            {dict.dashboard.unauthorized.signIn}
                        </button>
                        <button
                            onClick={() => navigate('/')}
                            className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-xl font-bold hover:bg-gray-300 dark:hover:bg-gray-600 transition-all"
                        >
                            {dict.dashboard.unauthorized.goHome}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

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
                        <p className="text-gray-600 dark:text-gray-400 mt-2 font-medium">{dict.dashboard.wealthDashboard} • 2026</p>
                    </div>
                    <div className="flex items-center gap-6">
                        <div className="flex gap-2">
                            <button className="size-11 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors">
                                <span className="material-icons-round">search</span>
                            </button>
                            <div className="relative">
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setShowNotifications(!showNotifications);
                                    }}
                                    className="size-11 flex items-center justify-center text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 hover:text-emerald-500 dark:hover:text-emerald-400 transition-colors relative"
                                >
                                    <span className="material-icons-round">notifications</span>
                                    {unreadCount > 0 && (
                                        <span className="absolute top-3 right-3 size-2 bg-emerald-500 dark:bg-emerald-400 rounded-full border-2 border-white dark:border-gray-800"></span>
                                    )}
                                </button>
                                {showNotifications && (
                                    <>
                                        <div
                                            className="fixed inset-0 z-40"
                                            onClick={() => setShowNotifications(false)}
                                        ></div>
                                        <NotificationsDropdown
                                            notifications={notifications}
                                            onClose={() => setShowNotifications(false)}
                                            onMarkRead={async (id: string) => {
                                                const token = localStorage.getItem('supabase.auth.token');
                                                await fetch(`/api/notifications/${id}/read`, {
                                                    method: 'PATCH',
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`,
                                                        'Content-Type': 'application/json'
                                                    }
                                                });
                                                setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: true } : n));
                                                setUnreadCount(Math.max(0, unreadCount - 1));
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                        </div>
                        <div className="h-10 w-px bg-gray-300 dark:bg-gray-600"></div>
                        {/* Only show KYC button if KYC hasn't been started (no status) or was rejected */}
                        {(!user.kycStatus || user.kycStatus === 'rejected') && (
                            <button
                                onClick={() => onNavigate('kyc')}
                                className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-emerald-600 text-white rounded-xl font-bold text-sm shadow-lg shadow-primary/20 transition-all active:scale-95">
                                <span className="material-icons-round text-base">verified_user</span>
                                {dict.kyc.buttonText || 'KYC'}
                            </button>
                        )}
                        {/* Show pending badge if KYC is pending */}
                        {user.kycStatus === 'pending' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded-xl font-bold text-sm">
                                <span className="material-icons-round text-base animate-pulse">hourglass_empty</span>
                                Pending
                            </div>
                        )}
                        {/* Show verified badge if KYC is verified */}
                        {user.kycStatus === 'verified' && (
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 rounded-xl font-bold text-sm">
                                <span className="material-icons-round text-base">verified</span>
                                {dict.dashboard.kycVerified || 'Verified'}
                            </div>
                        )}
                        <div className="flex items-center gap-4">
                            <div className="text-right">
                                <p className="text-sm font-bold text-gray-900 dark:text-white leading-tight">{user.name}</p>
                                <div className={`text-[11px] font-bold uppercase tracking-wider ${
                                    user.kycStatus === 'verified'
                                        ? 'text-emerald-500 dark:text-emerald-400' 
                                        : user.kycStatus === 'pending'
                                        ? 'text-yellow-500 dark:text-yellow-400'
                                        : user.kycStatus === 'rejected'
                                        ? 'text-red-500 dark:text-red-400'
                                        : 'text-gray-500 dark:text-gray-400'
                                }`}>
                                    {user.kycStatus === 'verified' 
                                        ? (dict.dashboard.kycVerified || 'Verified')
                                        : user.kycStatus === 'pending'
                                        ? 'Pending'
                                        : user.kycStatus === 'rejected'
                                        ? 'Rejected'
                                        : 'Not Started'}
                                </div>
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
                    <Route path="/wallet/deposit" element={<DepositPage />} />
                    <Route path="/wallet/deposit/confirm" element={<DepositConfirmation />} />
                    <Route path="/wallet/withdraw" element={<WithdrawPage />} />
                    <Route path="/wallet/withdraw/confirm" element={<WithdrawConfirmation />} />
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
    
    // Initialize from cache to avoid loading flash on revisit
    const [stats, setStats] = useState<any>(() => getCached('dashboard:stats'));
    const [graphData, setGraphData] = useState<any[]>(() => getCached('dashboard:graph:yearly') || []);
    const [graphPeriod, setGraphPeriod] = useState<'yearly' | 'monthly' | 'weekly'>('yearly');
    const [assetBreakdown, setAssetBreakdown] = useState<any>(() => getCached('dashboard:asset-breakdown'));
    const [assetBreakdownLoading, setAssetBreakdownLoading] = useState(!getCached('dashboard:asset-breakdown'));
    const [loading, setLoading] = useState(!getCached('dashboard:stats'));

    useEffect(() => {
        const fetchStats = async () => {
            if (!user) return;

            try {
                const data = await cachedFetch('dashboard:stats', async () => {
                    const response = await fetch('/api/dashboard/stats', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) throw new Error('Failed to fetch stats');
                    return response.json();
                });
                setStats(data);
            } catch (error) {
                console.error('Error fetching dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStats();
    }, [user]);

    useEffect(() => {
        const fetchGraphData = async () => {
            if (!user) return;

            try {
                const data = await cachedFetch(`dashboard:graph:${graphPeriod}`, async () => {
                    const response = await fetch(`/api/dashboard/performance/graph?period=${graphPeriod}`, {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) throw new Error('Failed to fetch graph');
                    return response.json();
                });
                setGraphData(data.dataPoints || []);
            } catch (error) {
                console.error('Error fetching graph data:', error);
            }
        };

        fetchGraphData();
    }, [user, graphPeriod]);

    useEffect(() => {
        const fetchAssetBreakdown = async () => {
            if (!user) {
                setAssetBreakdownLoading(false);
                return;
            }

            try {
                if (!getCached('dashboard:asset-breakdown')) {
                    setAssetBreakdownLoading(true);
                }
                const data = await cachedFetch('dashboard:asset-breakdown', async () => {
                    const response = await fetch('/api/dashboard/asset-breakdown', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) {
                        return { assetTypes: [], totalInvested: 0, growthPercentage: 0 };
                    }
                    return response.json();
                });
                setAssetBreakdown(data);
            } catch (error) {
                console.error('Error fetching asset breakdown:', error);
                setAssetBreakdown({ assetTypes: [], totalInvested: 0, growthPercentage: 0 });
            } finally {
                setAssetBreakdownLoading(false);
            }
        };

        fetchAssetBreakdown();
    }, [user]);

    if (loading) {
        return (
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                    <SkeletonCard />
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
                    <SkeletonGraph />
                    <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700 animate-pulse">
                        <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-8"></div>
                        <div className="size-52 bg-gray-200 dark:bg-gray-700 rounded-full mx-auto mb-10"></div>
                        <div className="space-y-5">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
                <SkeletonTable />
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
                            <button
                                onClick={() => setGraphPeriod('yearly')}
                                className={`px-5 py-2 text-xs font-bold shadow-sm rounded-xl transition-colors ${graphPeriod === 'yearly'
                                    ? 'bg-white dark:bg-gray-800 text-emerald-500 dark:text-emerald-400'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {dict.dashboard.yearly}
                            </button>
                            <button
                                onClick={() => setGraphPeriod('monthly')}
                                className={`px-5 py-2 text-xs font-bold rounded-xl transition-colors ${graphPeriod === 'monthly'
                                    ? 'bg-white dark:bg-gray-800 text-emerald-500 dark:text-emerald-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {dict.dashboard.monthly}
                            </button>
                            <button
                                onClick={() => setGraphPeriod('weekly')}
                                className={`px-5 py-2 text-xs font-bold rounded-xl transition-colors ${graphPeriod === 'weekly'
                                    ? 'bg-white dark:bg-gray-800 text-emerald-500 dark:text-emerald-400 shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                                    }`}
                            >
                                {dict.dashboard.weekly}
                            </button>
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
                        {graphData.length > 0 ? (
                            <PerformanceGraph dataPoints={graphData} period={graphPeriod} />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center">
                                <p className="text-gray-500 dark:text-gray-400 text-sm">{dict.dashboard.noPerformanceData}</p>
                            </div>
                        )}
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 p-10 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col">
                    <h3 className="text-xl font-extrabold text-gray-900 dark:text-white tracking-tight font-display mb-8">{dict.dashboard.assetType}</h3>
                    <div className="flex-1 flex flex-col items-center justify-center">
                        {assetBreakdownLoading ? (
                            <div className="flex flex-col items-center justify-center py-8">
                                <div className="size-52 rounded-full border-[18px] border-gray-200 dark:border-gray-600 relative shadow-inner animate-pulse"></div>
                                <div className="mt-10 space-y-5 w-full">
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 animate-pulse"></div>
                                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3 animate-pulse"></div>
                                </div>
                            </div>
                        ) : assetBreakdown && assetBreakdown.assetTypes && assetBreakdown.assetTypes.length > 0 ? (
                            <>
                                <div className="relative flex justify-center items-center group">
                                    <div className="size-52 rounded-full relative shadow-inner border-[18px] border-gray-100 dark:border-gray-700" style={{
                                        background: (() => {
                                            const total = assetBreakdown.totalInvested || 1;
                                            const colors = ['#10b981', '#3b82f6', '#a855f7', '#f97316'];
                                            let cumulativePercent = 0;

                                            const gradients = assetBreakdown.assetTypes?.map((asset: any, index: number) => {
                                                const percent = (asset.total / total) * 100;
                                                const start = cumulativePercent;
                                                const end = cumulativePercent + percent;
                                                cumulativePercent += percent;

                                                return `${colors[index % colors.length]} ${start}% ${end}%`;
                                            }).join(', ') || 'transparent';

                                            return `conic-gradient(from 0deg, ${gradients})`;
                                        })()
                                    }}>
                                        <div className="absolute inset-[18px] rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center text-center">
                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{dict.dashboard.growth}</span>
                                            <p className="text-3xl font-black text-gray-900 dark:text-white font-display">
                                                {assetBreakdown.growthPercentage >= 0 ? '+' : ''}{assetBreakdown.growthPercentage?.toFixed(1) || '0.0'}%
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full space-y-5 mt-10">
                                    {assetBreakdown.assetTypes?.map((asset: any, index: number) => {
                                        const colors = [
                                            'bg-emerald-500 dark:bg-emerald-400',
                                            'bg-blue-500 dark:bg-blue-400',
                                            'bg-purple-500 dark:bg-purple-400',
                                            'bg-orange-500 dark:bg-orange-400'
                                        ];

                                        // Map property type to translation key
                                        const typeLabels: { [key: string]: string } = {
                                            'residential': dict.property.residential,
                                            'commercial': dict.property.commercial,
                                            'mixed': dict.property.mixed || 'Mixed Use'
                                        };

                                        const label = typeLabels[asset.type] || asset.type;
                                        const amount = asset.total >= 1000000
                                            ? `${(asset.total / 1000000).toFixed(1)}M`
                                            : asset.total >= 1000
                                                ? `${(asset.total / 1000).toFixed(1)}K`
                                                : asset.total.toFixed(0);

                                        return (
                                            <div key={asset.type} className="flex items-center justify-between group cursor-default">
                                                <div className="flex items-center gap-4">
                                                    <div className={`size-4 rounded-full ${colors[index % colors.length]} ${index === 0 ? 'shadow-sm shadow-emerald-500/30 dark:shadow-emerald-400/30' : ''}`}></div>
                                                    <span className="text-sm font-bold text-gray-700 dark:text-gray-300">{label}</span>
                                                </div>
                                                <span className="text-sm font-black text-gray-900 dark:text-white">{amount} ₮</span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="relative flex justify-center items-center group">
                                    <div className="size-52 rounded-full relative shadow-inner border-[18px] border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
                                        <div className="absolute inset-[18px] rounded-full bg-white dark:bg-gray-800 flex flex-col items-center justify-center text-center">
                                            <span className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest">{dict.dashboard.growth}</span>
                                            <p className="text-3xl font-black text-gray-900 dark:text-white font-display">0.0%</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full space-y-5 mt-10">
                                    <div className="text-center py-4">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">No investments yet</p>
                                    </div>
                                </div>
                            </>
                        )}
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
                            {stats?.investments && stats.investments.length > 0 ? (
                                stats.investments
                                    .filter((inv: any) => inv.properties?.status === 'active')
                                    .map((inv: any) => {
                                        const property = inv.properties;
                                        const ownershipPercent = property?.total_shares
                                            ? ((inv.shares_owned / property.total_shares) * 100).toFixed(2)
                                            : '0';
                                        const currentValue = inv.amount_invested || 0;
                                        const performance = inv.amount_invested > 0
                                            ? (((currentValue + (inv.dividends_earned || 0) - inv.amount_invested) / inv.amount_invested) * 100).toFixed(1)
                                            : '0.0';
                                        const isPositive = parseFloat(performance) >= 0;

                                        return (
                                            <tr key={inv.id} className="hover:bg-gray-50/40 dark:hover:bg-gray-700/40 transition-colors group">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-5">
                                                        <div
                                                            className="size-16 rounded-2xl bg-gray-200 dark:bg-gray-600 flex-shrink-0 bg-cover bg-center border border-white dark:border-gray-700 shadow-sm"
                                                            style={{ backgroundImage: property?.image ? `url('${property.image}')` : undefined }}
                                                        ></div>
                                                        <div>
                                                            <p className="text-base font-extrabold text-gray-900 dark:text-white font-display">{property?.title || property?.name || 'Unknown Property'}</p>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className="material-icons-round text-xs text-gray-500 dark:text-gray-400">location_on</span>
                                                                <p className="text-[11px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{property?.location || property?.address || 'Unknown Location'}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <p className="text-sm font-extrabold text-gray-900 dark:text-white">{ownershipPercent}%</p>
                                                            <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{inv.shares_owned || 0} {dict.dashboard.units}</p>
                                                        </div>
                                                        <div className="w-32 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                                            <div
                                                                className="bg-emerald-500 dark:bg-emerald-400 h-full"
                                                                style={{ width: `${Math.min(parseFloat(ownershipPercent), 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <p className="text-base font-black text-gray-900 dark:text-white">{currentValue.toLocaleString()} <span className="text-sm font-bold text-gray-600 dark:text-gray-300 tracking-normal">₮</span></p>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full ${isPositive ? 'bg-emerald-500/10 dark:bg-emerald-400/10 text-emerald-500 dark:text-emerald-400' : 'bg-red-500/10 dark:bg-red-400/10 text-red-500 dark:text-red-400'} text-xs font-black`}>
                                                        <span className={`material-icons-round text-[14px] font-black`}>{isPositive ? 'trending_up' : 'trending_down'}</span>
                                                        {isPositive ? '+' : ''}{performance}%
                                                    </span>
                                                </td>
                                                <td className="px-8 py-8">
                                                    <div className="bg-gray-100 dark:bg-gray-700 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
                                                        <p className="text-[10px] font-extrabold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">{dict.dashboard.totalDividends}</p>
                                                        <p className="text-xs font-bold text-gray-900 dark:text-white">{(inv.dividends_earned || 0).toLocaleString()} ₮</p>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <button
                                                        className="size-10 flex items-center justify-center text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all"
                                                        onClick={() => onNavigate(`property:${property?.id}`)}
                                                    >
                                                        <span className="material-icons-round">more_horiz</span>
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                            ) : (
                                <tr>
                                    <td colSpan={6} className="px-10 py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">{dict.dashboard.noActiveInvestments || 'No active investments'}</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    );
};

const WalletView: React.FC = () => {
    const { dict } = useLanguage();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [balance, setBalance] = useState<number>(user?.balance || 0);
    const [loading, setLoading] = useState(false);
    const [showAddCardModal, setShowAddCardModal] = useState(false);
    const [error, setError] = useState('');
    const [cards, setCards] = useState<any[]>(() => getCached('dashboard:cards') || []);
    const [cardsLoading, setCardsLoading] = useState(!getCached('dashboard:cards'));
    const [cardForm, setCardForm] = useState({
        bank_name: '',
        last_four_digits: '',
        card_holder_name: '',
        card_type: 'debit',
        expiry_month: '',
        expiry_year: '',
        is_default: false
    });

    useEffect(() => {
        if (user) {
            setBalance(user.balance);
        }
    }, [user]);

    useEffect(() => {
        const fetchCards = async () => {
            if (!user) return;

            try {
                const token = localStorage.getItem('supabase.auth.token');
                const data = await cachedFetch('dashboard:cards', async () => {
                    const response = await fetch('/api/cards', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) throw new Error('Failed to fetch cards');
                    return response.json();
                });
                setCards(data.data || []);
            } catch (error) {
                console.error('Error fetching cards:', error);
            } finally {
                setCardsLoading(false);
            }
        };

        fetchCards();
    }, [user]);

    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-charcoal to-gray-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-10">
                        <span className="material-icons-round text-9xl">account_balance_wallet</span>
                    </div>
                    <div className="relative z-10">
                        <p className="text-gray-400 font-bold uppercase tracking-widest text-sm mb-2">{dict.dashboard.wallet.balance}</p>
                        <p className="text-4xl font-display font-black mb-8">₮ {balance.toLocaleString()}</p>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">{dict.dashboard.wallet.available}</p>
                                <p className="text-xl font-bold">₮ {balance.toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase mb-1">{dict.dashboard.wallet.locked}</p>
                                <p className="text-xl font-bold">₮ 0</p>
                            </div>
                        </div>

                        <div className="mt-8 flex gap-4">
                            <button
                                onClick={() => navigate('/dashboard/wallet/deposit')}
                                className="flex-1 bg-emerald-green hover:bg-emerald-500 text-white py-3 rounded-xl font-bold shadow-lg shadow-emerald-green/20 transition-all active:scale-95"
                            >
                                {dict.dashboard.wallet.deposit}
                            </button>
                            <button
                                onClick={() => navigate('/dashboard/wallet/withdraw')}
                                className="flex-1 bg-white/10 hover:bg-white/20 text-white py-3 rounded-xl font-bold backdrop-blur-sm transition-all active:scale-95"
                            >
                                {dict.dashboard.wallet.withdraw}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dict.dashboard.wallet.cards}</h3>
                        <button
                            onClick={() => setShowAddCardModal(true)}
                            className="text-emerald-500 dark:text-emerald-400 font-bold text-sm hover:underline"
                        >
                            + Add New
                        </button>
                    </div>
                    {cardsLoading ? (
                        <div className="space-y-4">
                            {[1, 2].map((i) => (
                                <div key={i} className="p-4 rounded-2xl border border-gray-300 dark:border-gray-600 animate-pulse">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-gray-200 dark:bg-gray-600 rounded-lg"></div>
                                        <div className="flex-1">
                                            <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mb-2"></div>
                                            <div className="h-3 bg-gray-200 dark:bg-gray-600 rounded w-16"></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : cards.length > 0 ? (
                        <div className="space-y-4">
                            {cards.map((card) => (
                                <div
                                    key={card.id}
                                    className="p-4 rounded-2xl border border-gray-300 dark:border-gray-600 flex items-center justify-between hover:border-emerald-500 dark:hover:border-emerald-400 transition-colors cursor-pointer group"
                                    onClick={async () => {
                                        // Set as default
                                        const token = localStorage.getItem('supabase.auth.token');
                                        await fetch(`/api/cards/${card.id}`, {
                                            method: 'PATCH',
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            },
                                            body: JSON.stringify({ is_default: true })
                                        });
                                        // Refresh cards
                                        const response = await fetch('/api/cards', {
                                            headers: {
                                                'Authorization': `Bearer ${token}`,
                                                'Content-Type': 'application/json'
                                            }
                                        });
                                        if (response.ok) {
                                            const data = await response.json();
                                            setCards(data.data || []);
                                        }
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-8 bg-gray-800 dark:bg-gray-700 rounded-lg"></div>
                                        <div>
                                            <p className="font-bold text-gray-900 dark:text-white">{card.bank_name}</p>
                                            <p className="text-xs text-gray-600 dark:text-gray-400">**** {card.last_four_digits}</p>
                                        </div>
                                    </div>
                                    {card.is_default ? (
                                        <span className="material-icons-round text-emerald-500 dark:text-emerald-400">check_circle</span>
                                    ) : (
                                        <span className="material-icons-round text-gray-400 dark:text-gray-500 group-hover:text-emerald-500 dark:group-hover:text-emerald-400">radio_button_unchecked</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-8">
                            <p className="text-gray-500 dark:text-gray-400 text-sm">No saved cards</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Add Card Modal */}
            {showAddCardModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setShowAddCardModal(false)}>
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Add New Card</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Bank Name</label>
                                <input
                                    type="text"
                                    value={cardForm.bank_name}
                                    onChange={(e) => setCardForm({ ...cardForm, bank_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white"
                                    placeholder="e.g., Khan Bank"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Last 4 Digits</label>
                                <input
                                    type="text"
                                    value={cardForm.last_four_digits}
                                    onChange={(e) => setCardForm({ ...cardForm, last_four_digits: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white"
                                    placeholder="1234"
                                    maxLength={4}
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Card Holder Name (Optional)</label>
                                <input
                                    type="text"
                                    value={cardForm.card_holder_name}
                                    onChange={(e) => setCardForm({ ...cardForm, card_holder_name: e.target.value })}
                                    className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white"
                                    placeholder="John Doe"
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    id="is_default"
                                    checked={cardForm.is_default}
                                    onChange={(e) => setCardForm({ ...cardForm, is_default: e.target.checked })}
                                    className="w-4 h-4 text-emerald-500 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="is_default" className="text-sm text-gray-700 dark:text-gray-300">Set as default card</label>
                            </div>
                            {error && (
                                <p className="text-red-500 text-sm">{error}</p>
                            )}
                            <div className="flex gap-4">
                                <button
                                    onClick={() => {
                                        setShowAddCardModal(false);
                                        setCardForm({
                                            bank_name: '',
                                            last_four_digits: '',
                                            card_holder_name: '',
                                            card_type: 'debit',
                                            expiry_month: '',
                                            expiry_year: '',
                                            is_default: false
                                        });
                                        setError('');
                                    }}
                                    className="flex-1 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={async () => {
                                        if (!cardForm.bank_name || !cardForm.last_four_digits) {
                                            setError('Bank name and last 4 digits are required');
                                            return;
                                        }

                                        setLoading(true);
                                        setError('');

                                        try {
                                            const token = localStorage.getItem('supabase.auth.token');
                                            const response = await fetch('/api/cards', {
                                                method: 'POST',
                                                headers: {
                                                    'Authorization': `Bearer ${token}`,
                                                    'Content-Type': 'application/json'
                                                },
                                                body: JSON.stringify(cardForm)
                                            });

                                            const data = await response.json();

                                            if (response.ok && data.success) {
                                                // Refresh cards
                                                const cardsResponse = await fetch('/api/cards', {
                                                    headers: {
                                                        'Authorization': `Bearer ${token}`,
                                                        'Content-Type': 'application/json'
                                                    }
                                                });
                                                if (cardsResponse.ok) {
                                                    const cardsData = await cardsResponse.json();
                                                    setCards(cardsData.data || []);
                                                }
                                                setCardForm({
                                                    bank_name: '',
                                                    last_four_digits: '',
                                                    card_holder_name: '',
                                                    card_type: 'debit',
                                                    expiry_month: '',
                                                    expiry_year: '',
                                                    is_default: false
                                                });
                                                setShowAddCardModal(false);
                                            } else {
                                                setError(data.error || 'Failed to save card');
                                            }
                                        } catch (err) {
                                            setError('An error occurred. Please try again.');
                                            console.error('Add card error:', err);
                                        } finally {
                                            setLoading(false);
                                        }
                                    }}
                                    disabled={loading}
                                    className="flex-1 px-4 py-3 rounded-xl bg-emerald-500 dark:bg-emerald-600 text-white font-bold hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                >
                                    {loading ? 'Saving...' : 'Save Card'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

const TransactionsView: React.FC = () => {
    const { dict } = useLanguage();
    const { user } = useAuth();
    const [transactions, setTransactions] = useState<any[]>(() => getCached('dashboard:transactions') || []);
    const [loading, setLoading] = useState(!getCached('dashboard:transactions'));

    useEffect(() => {
        const fetchTransactions = async () => {
            if (!user) return;

            try {
                const token = localStorage.getItem('supabase.auth.token');
                const data = await cachedFetch('dashboard:transactions', async () => {
                    const response = await fetch('/api/user/transactions?limit=100', {
                        headers: {
                            'Authorization': `Bearer ${token}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) throw new Error('Failed to fetch transactions');
                    return response.json();
                });
                setTransactions(data.data || []);
            } catch (error) {
                console.error('Error fetching transactions:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchTransactions();
    }, [user]);

    const formatTransactionType = (type: string) => {
        const typeMap: { [key: string]: string } = {
            'deposit': 'Deposit',
            'withdrawal': 'Withdrawal',
            'investment': 'Investment',
            'dividend': 'Dividend',
            'refund': 'Refund'
        };
        return typeMap[type] || type;
    };

    const formatAmount = (type: string, amount: number) => {
        const isPositive = type === 'deposit' || type === 'dividend' || type === 'refund';
        return `${isPositive ? '+' : '-'} ₮ ${Math.abs(amount).toLocaleString()}`;
    };

    if (loading) {
        return <SkeletonTable />;
    }

    return (
        <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
            <div className="p-8 border-b border-gray-100 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">{dict.dashboard.transactions.title}</h3>
            </div>
            {transactions.length > 0 ? (
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
                        {transactions.map((tx) => {
                            // Handle both camelCase (Drizzle) and snake_case (legacy) field names
                            const transactionType = tx.transaction_type || tx.transactionType;
                            const amount = tx.amount;
                            const createdAt = tx.createdAt || tx.created_at;
                            const status = tx.status;
                            
                            const isPositive = transactionType === 'deposit' || transactionType === 'dividend' || transactionType === 'refund';
                            
                            // Format date safely
                            const formatDate = (dateValue: string | Date | null | undefined): string => {
                                if (!dateValue) return 'N/A';
                                try {
                                    const date = new Date(dateValue);
                                    if (isNaN(date.getTime())) return 'N/A';
                                    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                                } catch (error) {
                                    console.error('Error formatting date:', dateValue, error);
                                    return 'N/A';
                                }
                            };
                            
                            return (
                                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                                    <td className="px-8 py-4 font-bold text-gray-900 dark:text-white">{formatTransactionType(transactionType)}</td>
                                    <td className={`px-8 py-4 font-bold ${isPositive ? 'text-emerald-500 dark:text-emerald-400' : 'text-gray-900 dark:text-white'}`}>
                                        {formatAmount(transactionType, parseFloat(amount))}
                                    </td>
                                    <td className="px-8 py-4 text-gray-600 dark:text-gray-400 text-sm">
                                        {formatDate(createdAt)}
                                    </td>
                                    <td className="px-8 py-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${status === 'completed'
                                            ? 'bg-emerald-100 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300'
                                            : status === 'pending'
                                                ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300'
                                                : 'bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300'
                                            }`}>
                                            {status === 'completed'
                                                ? dict.dashboard.transactions.completed
                                                : status === 'pending'
                                                    ? dict.dashboard.transactions.pending
                                                    : 'Failed'}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            ) : (
                <div className="p-8 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
                </div>
            )}
        </div>
    );
};

const AssetsView: React.FC = () => {
    const { dict } = useLanguage();
    const { user } = useAuth();
    const [assets, setAssets] = useState<any[]>(() => getCached('dashboard:assets') || []);
    const [loading, setLoading] = useState(!getCached('dashboard:assets'));

    useEffect(() => {
        const fetchAssets = async () => {
            if (!user) return;

            try {
                const data = await cachedFetch('dashboard:assets', async () => {
                    const response = await fetch('/api/dashboard/assets', {
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('supabase.auth.token')}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    if (!response.ok) throw new Error('Failed to fetch assets');
                    return response.json();
                });
                setAssets(data.assets || []);
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
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
                    <div className="text-center py-8 mb-8">
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
                    </div>
                    <SkeletonList count={3} />
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
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-6 animate-pulse"></div>
                    <div className="text-center py-8 mb-8">
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-48 mx-auto mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
                    </div>
                    <SkeletonList count={3} />
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
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 mb-6 animate-pulse"></div>
                    <div className="text-center py-8 mb-8">
                        <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded w-24 mx-auto mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-32 mx-auto animate-pulse"></div>
                    </div>
                    <SkeletonGrid cols={3} />
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
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-6 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="bg-gray-50 dark:bg-gray-700 p-6 rounded-2xl text-center animate-pulse">
                                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-24 mx-auto mb-2"></div>
                                <div className="h-8 bg-gray-200 dark:bg-gray-600 rounded w-32 mx-auto"></div>
                            </div>
                        ))}
                    </div>
                    <SkeletonList count={3} />
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
    const { user } = useAuth();
    const [emailNotifications, setEmailNotifications] = useState(true);
    const [investmentAlerts, setInvestmentAlerts] = useState(true);
    const [saving, setSaving] = useState(false);

    // Load notification preferences (could be from API in the future)
    useEffect(() => {
        // For now, load from localStorage or default to true
        const savedEmail = localStorage.getItem('notification_email');
        const savedAlerts = localStorage.getItem('notification_alerts');
        if (savedEmail !== null) setEmailNotifications(savedEmail === 'true');
        if (savedAlerts !== null) setInvestmentAlerts(savedAlerts === 'true');
    }, []);

    const handleToggle = async (type: 'email' | 'alerts', value: boolean) => {
        if (type === 'email') {
            setEmailNotifications(value);
            localStorage.setItem('notification_email', value.toString());
        } else {
            setInvestmentAlerts(value);
            localStorage.setItem('notification_alerts', value.toString());
        }

        // In the future, save to backend API
        // try {
        //     const token = localStorage.getItem('supabase.auth.token');
        //     await fetch('/api/user/notification-preferences', {
        //         method: 'PATCH',
        //         headers: {
        //             'Authorization': `Bearer ${token}`,
        //             'Content-Type': 'application/json'
        //         },
        //         body: JSON.stringify({ [type]: value })
        //     });
        // } catch (error) {
        //     console.error('Error saving notification preferences:', error);
        // }
    };

    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-lg border border-gray-200 dark:border-gray-700">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6">{dict.dashboard.settings.personalInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">First Name</label>
                        <input
                            type="text"
                            defaultValue={user?.name?.split(' ')[0] || ''}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Last Name</label>
                        <input
                            type="text"
                            defaultValue={user?.name?.split(' ').slice(1).join(' ') || ''}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Email Address</label>
                        <input
                            type="email"
                            defaultValue={user?.email || ''}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 outline-none focus:ring-2 focus:ring-emerald-500 dark:focus:ring-emerald-400 text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button
                        onClick={() => {
                            // Save user info (could be API call in the future)
                            setSaving(true);
                            setTimeout(() => setSaving(false), 500);
                        }}
                        disabled={saving}
                        className="bg-emerald-500 dark:bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 dark:hover:bg-emerald-700 transition-colors disabled:opacity-50"
                    >
                        {saving ? 'Saving...' : dict.dashboard.settings.update}
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
                        <button
                            onClick={() => handleToggle('email', !emailNotifications)}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${emailNotifications
                                ? 'bg-emerald-500 dark:bg-emerald-600'
                                : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <div className={`absolute top-1 size-4 bg-white dark:bg-gray-800 rounded-full transition-transform ${emailNotifications ? 'right-1' : 'left-1'
                                }`}></div>
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">New Investment Alerts</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Get notified when new properties drop</p>
                        </div>
                        <button
                            onClick={() => handleToggle('alerts', !investmentAlerts)}
                            className={`w-12 h-6 rounded-full relative cursor-pointer transition-colors ${investmentAlerts
                                ? 'bg-emerald-500 dark:bg-emerald-600'
                                : 'bg-gray-300 dark:bg-gray-600'
                                }`}
                        >
                            <div className={`absolute top-1 size-4 bg-white dark:bg-gray-800 rounded-full transition-transform ${investmentAlerts ? 'right-1' : 'left-1'
                                }`}></div>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};