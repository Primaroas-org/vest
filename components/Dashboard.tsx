import React, { useState } from 'react';
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
  const [activeTab, setActiveTab] = useState<DashboardTab>('overview');

  if (!user) {
      onNavigate('login');
      return null;
  }

  const renderContent = () => {
    switch(activeTab) {
        case 'wallet':
            return <WalletView />;
        case 'transactions':
            return <TransactionsView />;
        case 'settings':
            return <SettingsView />;
        case 'overview':
        default:
            return <OverviewView onNavigate={onNavigate} />;
    }
  };

  return (
    <div className="flex min-h-screen bg-app-bg text-slate-900 font-sans antialiased">
      {/* Sidebar */}
      <aside className="w-72 bg-deep-charcoal border-r border-slate-800 flex flex-col fixed h-full z-20 overflow-y-auto">
        <div className="p-8 mb-4">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => onNavigate('marketplace')}>
            <div className="size-10 bg-emerald-green rounded-xl flex items-center justify-center text-white shadow-lg shadow-emerald-green/20">
              <span className="material-icons-round font-bold">account_balance</span>
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-white tracking-tight font-display uppercase italic">
                {dict.brandName} <span className="text-emerald-green">Capital</span>
              </h1>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                {dict.dashboard.privateWealth}
              </p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1.5">
          <div className="px-4 py-3">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{dict.dashboard.mainMenu}</p>
          </div>
          <button 
            onClick={() => setActiveTab('overview')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group cursor-pointer ${activeTab === 'overview' ? 'bg-emerald-green/10 text-emerald-green' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <span className="material-icons-round text-xl">grid_view</span>
            <span className="text-sm font-semibold tracking-wide">{dict.dashboard.investorPortfolio}</span>
          </button>
          <button 
            className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all group cursor-pointer"
            onClick={() => onNavigate('marketplace')}
          >
            <span className="material-icons-round text-xl group-hover:scale-110 transition-transform">apartment</span>
            <span className="text-sm font-medium tracking-wide">{dict.nav.marketplace}</span>
          </button>
          <button 
            onClick={() => setActiveTab('transactions')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group cursor-pointer ${activeTab === 'transactions' ? 'bg-emerald-green/10 text-emerald-green' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <span className="material-icons-round text-xl">receipt_long</span>
            <span className="text-sm font-medium tracking-wide">{dict.nav.transactions}</span>
          </button>
          <button 
            onClick={() => setActiveTab('wallet')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group cursor-pointer ${activeTab === 'wallet' ? 'bg-emerald-green/10 text-emerald-green' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
          >
            <span className="material-icons-round text-xl">account_balance_wallet</span>
            <span className="text-sm font-medium tracking-wide">{dict.nav.wallet}</span>
          </button>

          <div className="px-4 py-6">
            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{dict.dashboard.reporting}</p>
          </div>
          <button className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-slate-400 hover:bg-white/5 hover:text-white transition-all cursor-pointer">
            <span className="material-icons-round text-xl">description</span>
            <span className="text-sm font-medium tracking-wide">{dict.dashboard.taxStatements}</span>
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3.5 px-4 py-3 rounded-xl transition-all group cursor-pointer ${activeTab === 'settings' ? 'bg-emerald-green/10 text-emerald-green' : 'text-slate-400 hover:bg-white/5 hover:text-white'}`}
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
                className="w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-red-400 hover:bg-red-400/10 transition-all cursor-pointer"
              >
                  <span className="material-icons-round text-xl">logout</span>
                  <span className="text-sm font-medium tracking-wide">{dict.nav.logout}</span>
              </button>
          </div>
        </nav>
      </aside>

      <main className="flex-1 ml-72 p-10">
        <header className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-extrabold text-slate-900 tracking-tight font-display">
                {activeTab === 'overview' && dict.dashboard.investorPortfolio}
                {activeTab === 'wallet' && dict.nav.wallet}
                {activeTab === 'transactions' && dict.nav.transactions}
                {activeTab === 'settings' && dict.nav.settings}
            </h2>
            <p className="text-slate-500 mt-2 font-medium">{dict.dashboard.wealthDashboard} • 2024</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="flex gap-2">
              <button className="size-11 flex items-center justify-center text-slate-400 bg-white rounded-xl shadow-premium border border-slate-100 hover:text-emerald-green transition-colors">
                <span className="material-icons-round">search</span>
              </button>
              <button className="size-11 flex items-center justify-center text-slate-400 bg-white rounded-xl shadow-premium border border-slate-100 hover:text-emerald-green transition-colors relative">
                <span className="material-icons-round">notifications</span>
                <span className="absolute top-3 right-3 size-2 bg-emerald-green rounded-full border-2 border-white"></span>
              </button>
            </div>
            <div className="h-10 w-px bg-slate-200"></div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-bold text-slate-900 leading-tight">{user.name}</p>
                <p className="text-[11px] text-emerald-green font-bold uppercase tracking-wider">{user.isVerified ? dict.dashboard.kycVerified : 'Pending'}</p>
              </div>
              <div className="size-12 rounded-2xl bg-slate-200 overflow-hidden border-2 border-white shadow-premium" style={{ backgroundImage: `url('${user.avatar}')`, backgroundSize: "cover" }}></div>
            </div>
          </div>
        </header>

        {renderContent()}
      </main>
    </div>
  );
};

const OverviewView: React.FC<{onNavigate: (view: ViewState) => void}> = ({ onNavigate }) => {
    const { dict } = useLanguage();
    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Stats Cards */}
            <div className="card-gradient p-7 rounded-[2rem] shadow-premium border border-white hover:shadow-card-hover transition-all group">
                <div className="flex justify-between items-start mb-6">
                <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-emerald-green transition-colors">
                    <span className="material-icons-round">account_balance_wallet</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-green/10 px-2 py-1 rounded-full">
                    <span className="text-emerald-green text-[10px] font-bold">+8.2%</span>
                </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{dict.dashboard.totalAssets}</p>
                <p className="text-2xl font-black text-slate-900 font-display">250,000,000 <span className="text-lg font-bold text-slate-500 tracking-normal">₮</span></p>
            </div>

            <div className="card-gradient p-7 rounded-[2rem] shadow-premium border border-white hover:shadow-card-hover transition-all group">
                <div className="flex justify-between items-start mb-6">
                <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-emerald-green transition-colors">
                    <span className="material-icons-round">payments</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-green/10 px-2 py-1 rounded-full">
                    <span className="text-emerald-green text-[10px] font-bold">+12.5%</span>
                </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{dict.dashboard.totalDividends}</p>
                <p className="text-2xl font-black text-slate-900 font-display">12,500,000 <span className="text-lg font-bold text-slate-500 tracking-normal">₮</span></p>
            </div>

            <div className="card-gradient p-7 rounded-[2rem] shadow-premium border border-white hover:shadow-card-hover transition-all group">
                <div className="flex justify-between items-start mb-6">
                <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-emerald-green transition-colors">
                    <span className="material-icons-round">show_chart</span>
                </div>
                <div className="flex items-center gap-1 bg-emerald-green/10 px-2 py-1 rounded-full">
                    <span className="text-emerald-green text-[10px] font-bold">{dict.dashboard.stable}</span>
                </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{dict.dashboard.appreciation}</p>
                <p className="text-2xl font-black text-slate-900 font-display">+15.4<span className="text-lg font-bold text-slate-500 tracking-normal">%</span></p>
            </div>

            <div className="card-gradient p-7 rounded-[2rem] shadow-premium border border-white hover:shadow-card-hover transition-all group">
                <div className="flex justify-between items-start mb-6">
                <div className="size-12 bg-white rounded-2xl flex items-center justify-center shadow-sm text-slate-400 group-hover:text-emerald-green transition-colors">
                    <span className="material-icons-round">corporate_fare</span>
                </div>
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">{dict.dashboard.activeHoldings}</p>
                <p className="text-2xl font-black text-slate-900 font-display">8 <span className="text-lg font-bold text-slate-500 tracking-normal">{dict.dashboard.properties}</span></p>
            </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
            <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-100">
                <div className="flex justify-between items-center mb-10">
                <div>
                    <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display">{dict.dashboard.portfolioPerformance}</h3>
                    <p className="text-sm font-medium text-slate-400">{dict.dashboard.netEquityGrowth}</p>
                </div>
                <div className="flex bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                    <button className="px-5 py-2 text-xs font-bold bg-white text-emerald-green shadow-sm rounded-xl">{dict.dashboard.yearly}</button>
                    <button className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">{dict.dashboard.monthly}</button>
                    <button className="px-5 py-2 text-xs font-bold text-slate-400 hover:text-slate-600 transition-colors">{dict.dashboard.weekly}</button>
                </div>
                </div>
                <div className="h-72 relative">
                <div className="absolute inset-0 flex flex-col justify-between opacity-30">
                    <div className="border-b border-dashed border-slate-300 w-full h-0"></div>
                    <div className="border-b border-dashed border-slate-300 w-full h-0"></div>
                    <div className="border-b border-dashed border-slate-300 w-full h-0"></div>
                    <div className="border-b border-dashed border-slate-300 w-full h-0"></div>
                    <div className="border-b border-dashed border-slate-300 w-full h-0"></div>
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
                <div className="flex justify-between mt-6 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] px-2">
                    <span>Q1 2023</span><span>Q2 2023</span><span>Q3 2023</span><span>Q4 2023</span><span>Q1 2024</span>
                </div>
                </div>
            </div>
            
            <div className="bg-white p-10 rounded-[2.5rem] shadow-premium border border-slate-100 flex flex-col">
                <h3 className="text-xl font-extrabold text-slate-900 tracking-tight font-display mb-8">{dict.dashboard.assetType}</h3>
                <div className="flex-1 flex flex-col items-center justify-center">
                <div className="relative flex justify-center items-center group">
                    <div className="size-52 rounded-full border-[18px] border-slate-50 relative shadow-inner">
                    <div className="absolute inset-[-18px] rounded-full border-[18px] border-emerald-green" style={{ clipPath: "polygon(50% 50%, 50% 0%, 100% 0%, 100% 100%, 0% 100%, 0% 50%)" }}></div>
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                        <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{dict.dashboard.growth}</span>
                        <p className="text-3xl font-black text-slate-900 font-display">65%</p>
                    </div>
                    </div>
                </div>
                <div className="w-full space-y-5 mt-10">
                    <div className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                        <div className="size-4 rounded-full bg-emerald-green shadow-sm shadow-emerald-green/30"></div>
                        <span className="text-sm font-bold text-slate-600">{dict.property.residential}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">162.5M ₮</span>
                    </div>
                    <div className="flex items-center justify-between group cursor-default">
                    <div className="flex items-center gap-4">
                        <div className="size-4 rounded-full bg-slate-200"></div>
                        <span className="text-sm font-bold text-slate-600">{dict.property.commercial}</span>
                    </div>
                    <span className="text-sm font-black text-slate-900">87.5M ₮</span>
                    </div>
                </div>
                </div>
            </div>
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center">
                <div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight font-display">{dict.dashboard.activeInvestments}</h3>
                <p className="text-sm font-medium text-slate-400 mt-1">{dict.dashboard.liveTracking}</p>
                </div>
                <button className="flex items-center gap-2 px-6 py-3 bg-slate-50 text-slate-600 rounded-2xl text-sm font-bold hover:bg-slate-100 transition-all border border-slate-100">
                {dict.dashboard.generateReport}
                <span className="material-icons-round text-lg">download</span>
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/50">
                    <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dict.dashboard.propertyAsset}</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dict.dashboard.ownership}</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dict.dashboard.marketValue}</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dict.dashboard.performance}</th>
                    <th className="px-8 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">{dict.dashboard.incomeStatus}</th>
                    <th className="px-10 py-5 text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] text-right">{dict.nav.settings}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    <tr className="hover:bg-slate-50/40 transition-colors group">
                    <td className="px-10 py-8">
                        <div className="flex items-center gap-5">
                        <div className="size-16 rounded-2xl bg-slate-100 flex-shrink-0 bg-cover bg-center border border-white shadow-sm" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuAzVMurs54HjXYQcY-EAo4hwc1SHeF3ypsFOHAikcLpOeVmLBIXILJAxxYRnFgqbn9FtGJXUh_krdUKUcfZiz2VzdA7tWteXLGjiILUrvxgbn3CJjmDyaPWjli7QUrYMeBL-HnmAmr2oAk1Ko-HHiRk8uJVdA_fOV0bYuT2D6_tECMvIkyakQOV3DKMahRi-Vi1V-tcFVmsO4Cp1XfnTBYAXB4I-WwsYYtU8pYCBht8qSifqoDGcNYFu6cPk30_QZ4wR0qMYa1sBnQ')" }}></div>
                        <div>
                            <p className="text-base font-extrabold text-slate-900 font-display">Sky Garden Residence</p>
                            <div className="flex items-center gap-2 mt-1">
                            <span className="material-icons-round text-xs text-slate-400">location_on</span>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Ulaanbaatar • Khan-Uul</p>
                            </div>
                        </div>
                        </div>
                    </td>
                    <td className="px-8 py-8">
                        <div className="space-y-2">
                        <div className="flex justify-between items-end">
                            <p className="text-sm font-extrabold text-slate-900">2.5%</p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">450 {dict.dashboard.units}</p>
                        </div>
                        <div className="w-32 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div className="bg-emerald-green h-full w-[25%]" style={{ width: "25%" }}></div>
                        </div>
                        </div>
                    </td>
                    <td className="px-8 py-8">
                        <p className="text-base font-black text-slate-900">85,200,000 <span className="text-sm font-bold text-slate-400 tracking-normal">₮</span></p>
                    </td>
                    <td className="px-8 py-8">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-green/10 text-emerald-green text-xs font-black">
                        <span className="material-icons-round text-[14px] font-black">trending_up</span>
                        +12.4%
                        </span>
                    </td>
                    <td className="px-8 py-8">
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-100/50">
                        <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest mb-1">{dict.dashboard.nextPayout}</p>
                        <p className="text-xs font-bold text-slate-900">Dec 15, 2023</p>
                        </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                        <button className="size-10 flex items-center justify-center text-slate-300 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all">
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

                <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100">
                     <div className="flex justify-between items-center mb-6">
                        <h3 className="text-xl font-bold text-slate-900">{dict.dashboard.wallet.cards}</h3>
                        <button className="text-emerald-green font-bold text-sm hover:underline">+ Add New</button>
                     </div>
                     <div className="space-y-4">
                        <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-emerald-green transition-colors cursor-pointer group">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-8 bg-slate-800 rounded-lg"></div>
                                 <div>
                                     <p className="font-bold text-slate-900">Khan Bank</p>
                                     <p className="text-xs text-slate-500">**** 4589</p>
                                 </div>
                             </div>
                             <span className="material-icons-round text-slate-300 group-hover:text-emerald-green">check_circle</span>
                        </div>
                        <div className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:border-emerald-green transition-colors cursor-pointer group">
                             <div className="flex items-center gap-4">
                                 <div className="w-12 h-8 bg-blue-800 rounded-lg"></div>
                                 <div>
                                     <p className="font-bold text-slate-900">Golomt Bank</p>
                                     <p className="text-xs text-slate-500">**** 1234</p>
                                 </div>
                             </div>
                             <span className="material-icons-round text-slate-300 group-hover:text-emerald-green">radio_button_unchecked</span>
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
        <div className="bg-white rounded-[2.5rem] shadow-premium border border-slate-100 overflow-hidden">
            <div className="p-8 border-b border-slate-50">
                <h3 className="text-xl font-bold text-slate-900">{dict.dashboard.transactions.title}</h3>
            </div>
            <table className="w-full text-left">
                <thead>
                    <tr className="bg-slate-50/50">
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">{dict.dashboard.transactions.type}</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">{dict.dashboard.transactions.amount}</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">{dict.dashboard.transactions.date}</th>
                        <th className="px-8 py-4 text-xs font-bold text-slate-400 uppercase">{dict.dashboard.transactions.status}</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {[
                        { type: 'Deposit', amount: '+ ₮ 1,000,000', date: 'Oct 24, 2023', status: 'completed' },
                        { type: 'Investment', amount: '- ₮ 500,000', date: 'Oct 22, 2023', status: 'completed' },
                        { type: 'Dividend', amount: '+ ₮ 25,000', date: 'Oct 15, 2023', status: 'completed' },
                        { type: 'Withdrawal', amount: '- ₮ 100,000', date: 'Oct 10, 2023', status: 'pending' },
                    ].map((tx, i) => (
                        <tr key={i} className="hover:bg-slate-50 transition-colors">
                            <td className="px-8 py-4 font-bold text-slate-900">{tx.type}</td>
                            <td className={`px-8 py-4 font-bold ${tx.amount.startsWith('+') ? 'text-emerald-green' : 'text-slate-900'}`}>{tx.amount}</td>
                            <td className="px-8 py-4 text-slate-500 text-sm">{tx.date}</td>
                            <td className="px-8 py-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                                    tx.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'
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

const SettingsView: React.FC = () => {
    const { dict } = useLanguage();
    return (
        <div className="max-w-4xl space-y-8">
            <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">{dict.dashboard.settings.personalInfo}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">First Name</label>
                        <input type="text" defaultValue="Battulga" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-green" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-2">Last Name</label>
                        <input type="text" defaultValue="Erden" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-green" />
                    </div>
                    <div className="md:col-span-2">
                        <label className="block text-sm font-bold text-slate-700 mb-2">Email Address</label>
                        <input type="email" defaultValue="battulga@example.com" className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 outline-none focus:ring-2 focus:ring-emerald-green" />
                    </div>
                </div>
                <div className="mt-8 flex justify-end">
                    <button className="bg-emerald-green text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-emerald-green/20 hover:bg-emerald-600 transition-colors">
                        {dict.dashboard.settings.update}
                    </button>
                </div>
            </div>
            
             <div className="bg-white rounded-[2.5rem] p-8 shadow-premium border border-slate-100">
                <h3 className="text-xl font-bold text-slate-900 mb-6">{dict.dashboard.settings.notifications}</h3>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="font-bold text-slate-900">Email Notifications</p>
                            <p className="text-xs text-slate-500">Receive updates about your portfolio</p>
                        </div>
                        <div className="w-12 h-6 bg-emerald-green rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                        <div>
                            <p className="font-bold text-slate-900">New Investment Alerts</p>
                            <p className="text-xs text-slate-500">Get notified when new properties drop</p>
                        </div>
                        <div className="w-12 h-6 bg-emerald-green rounded-full relative cursor-pointer">
                            <div className="absolute right-1 top-1 size-4 bg-white rounded-full"></div>
                        </div>
                    </div>
                </div>
             </div>
        </div>
    );
};