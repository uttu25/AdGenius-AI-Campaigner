import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Users, Package, Settings, MessageSquarePlus, Megaphone, History, User, CheckCircle2, AlertCircle, Shield, Loader2, MessageSquare } from 'lucide-react';
import { Customer, Product, FilterOptions, WhatsAppConfig, GmailConfig, CampaignRecord, User as UserType } from './types.ts';
import TemplateButtons from './components/TemplateButtons.tsx';
import CSVImport from './components/CSVImport.tsx';
import DataGrid from './components/DataGrid.tsx';
import CampaignHub from './components/CampaignHub.tsx';
import SegmentationFilter from './components/SegmentationFilter.tsx';
import ProductFilter from './components/ProductFilter.tsx';
import WhatsAppSettings from './components/WhatsAppSettings.tsx';
import GmailSettings from './components/GmailSettings.tsx';
import CampaignHistory from './components/CampaignHistory.tsx';
import AuthPage from './components/AuthPage.tsx';
import GeneralSettings from './components/GeneralSettings.tsx';
import Feedback from './components/Feedback.tsx';
import { api } from './services/apiService.ts';

type AppTab = 'dashboard' | 'customers' | 'products' | 'campaign' | 'history' | 'api-settings' | 'general-settings' | 'feedback';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<CampaignRecord[]>([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: ''
  });
  const [gmailConfig, setGmailConfig] = useState<GmailConfig>({
    clientId: '',
    clientSecret: '',
    refreshToken: '',
    userEmail: ''
  });
  
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: [0, 100],
    sex: [],
    city: '',
    state: '',
    whatsappOptIn: '',
    gmailOptIn: ''
  });

  const [productSearch, setProductSearch] = useState('');

  // Selection States
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Comprehensive System Hydration
  useEffect(() => {
    const bootSystem = async () => {
      try {
        const [
          dbSession,
          dbWa,
          dbGm,
          dbCustomers,
          dbProducts,
          dbCampaigns
        ] = await Promise.all([
          api.session.get(),
          api.settings.getWhatsApp(),
          api.settings.getGmail(),
          api.customers.list(),
          api.products.list(),
          api.campaigns.list()
        ]);

        if (dbSession) setCurrentUser(dbSession);
        if (dbWa) setWhatsappConfig(dbWa.value);
        if (dbGm) setGmailConfig(dbGm.value);
        
        setCustomers(dbCustomers);
        setProducts(dbProducts);
        setHistory(dbCampaigns.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));
      } catch (err) {
        console.error("CRITICAL: System Hydration Failure", err);
      } finally {
        setIsDataLoaded(true);
      }
    };
    bootSystem();
  }, []);

  // Real-time Settings Sync
  useEffect(() => {
    if (isDataLoaded && whatsappConfig.accessToken) {
      api.settings.saveWhatsApp(whatsappConfig);
    }
  }, [whatsappConfig, isDataLoaded]);

  useEffect(() => {
    if (isDataLoaded && gmailConfig.refreshToken) {
      api.settings.saveGmail(gmailConfig);
    }
  }, [gmailConfig, isDataLoaded]);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const ageMatch = c.age >= filters.ageRange[0] && c.age <= filters.ageRange[1];
      const sexMatch = filters.sex.length === 0 || filters.sex.includes(c.sex);
      const cityMatch = !filters.city || c.city === filters.city;
      const stateMatch = !filters.state || c.state === filters.state;
      const whatsappMatch = !filters.whatsappOptIn || c.whatsapp_opt_in === filters.whatsappOptIn;
      const gmailMatch = !filters.gmailOptIn || c.gmail_opt_in === filters.gmailOptIn;
      return ageMatch && sexMatch && cityMatch && stateMatch && whatsappMatch && gmailMatch;
    });
  }, [customers, filters]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchMatch = !productSearch.trim() || p.name.toLowerCase().includes(productSearch.toLowerCase());
      return searchMatch;
    });
  }, [products, productSearch]);

  const uniqueCities = Array.from(new Set(customers.map(c => c.city))).filter(Boolean);
  const uniqueStates = Array.from(new Set(customers.map(c => c.state))).filter(Boolean);

  const handleImportCustomers = async (data: Customer[]) => {
    setIsSyncing(true);
    await api.customers.saveBatch(data);
    setCustomers(prev => [...prev, ...data]);
    setIsSyncing(false);
  };

  const handleImportProducts = async (data: Product[]) => {
    setIsSyncing(true);
    await api.products.saveBatch(data);
    setProducts(prev => [...prev, ...data]);
    setIsSyncing(false);
  };

  const handleClearCustomers = async () => {
    setIsSyncing(true);
    await api.customers.clear();
    setCustomers([]);
    setSelectedCustomerIds(new Set());
    setIsSyncing(false);
  };

  const handleClearProducts = async () => {
    setIsSyncing(true);
    await api.products.clear();
    setProducts([]);
    setSelectedProductIds(new Set());
    setIsSyncing(false);
  };

  const handleDeleteCustomer = async (id: string) => {
    await api.customers.delete(id);
    setCustomers(prev => prev.filter(c => c.id !== id));
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleDeleteProduct = async (id: string) => {
    await api.products.delete(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const handleUpdateLogo = (logo: string) => {
    setCurrentUser(prev => {
      const next = prev ? { ...prev, logo } : null;
      if (next) api.session.save(next);
      return next;
    });
  };

  const handleUpdateCompanyName = (companyName: string) => {
    setCurrentUser(prev => {
      const next = prev ? { ...prev, companyName } : null;
      if (next) api.session.save(next);
      return next;
    });
  };

  const handleLogin = async (email: string) => {
    const newUser = {
      email,
      name: email.split('@')[0],
      isLoggedIn: true,
      isGoogleLinked: true,
      autoScheduleDaily: false,
      companyName: '' 
    };
    await api.session.save(newUser);
    setCurrentUser(newUser);
    setActiveTab('dashboard');
  };

  const handleLogout = async () => {
    await api.session.clear();
    setCurrentUser(null);
  };

  const isWhatsAppConfigured = !!(whatsappConfig.accessToken && whatsappConfig.phoneNumberId);
  const isGmailConfigured = !!(gmailConfig.refreshToken && gmailConfig.userEmail);

  if (!isDataLoaded) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white p-10">
        <Loader2 className="animate-spin text-indigo-500 mb-6" size={48} />
        <h2 className="text-xl font-black uppercase tracking-widest italic">Encrypted Boot Sequence...</h2>
        <p className="text-slate-500 text-xs mt-2 uppercase tracking-tighter">Syncing Local Vault v2.1</p>
      </div>
    );
  }

  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  const hasAnySelection = selectedCustomerIds.size > 0 || selectedProductIds.size > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-6 space-y-8 flex flex-col shadow-sm sticky top-0 h-screen">
        <div className="flex items-center gap-3 text-indigo-600 px-2 overflow-hidden">
          <Megaphone size={32} className="shrink-0" />
          <div className="min-w-0">
             <h1 className="text-xl font-black tracking-tighter uppercase italic">AdGenius <span className="text-red-600 font-light not-italic">Pro</span></h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={20} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <NavItem icon={<Package size={20} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <NavItem icon={<MessageSquarePlus size={20} />} label="AI Campaign" active={activeTab === 'campaign'} onClick={() => setActiveTab('campaign')} />
          <NavItem icon={<History size={20} />} label="Past Missions" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
          <NavItem icon={<MessageSquare size={20} />} label="Feedback" active={activeTab === 'feedback'} onClick={() => setActiveTab('feedback')} />
        </nav>

        <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 flex items-center gap-3">
          <div className="relative">
            <Shield size={16} className="text-emerald-500" />
            <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
          </div>
          <div className="min-w-0">
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Security Status</p>
            <p className="text-[10px] font-bold text-slate-700 truncate">VAULT SECURED & SYNCED</p>
          </div>
        </div>

        {hasAnySelection && (
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Selection Queue</span>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-indigo-600">
                <span>Target:</span>
                <span className="font-bold">{selectedCustomerIds.size.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs text-indigo-600">
                <span>Products:</span>
                <span className="font-bold">
                  {currentUser.autoScheduleDaily ? selectedProductIds.size.toLocaleString() : `${selectedProductIds.size} / 5`}
                </span>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('campaign')}
              className="w-full mt-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-100"
            >
              Start Mission
            </button>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 space-y-1">
           <NavItem icon={<Settings size={20} />} label="API Gateways" active={activeTab === 'api-settings'} onClick={() => setActiveTab('api-settings')} />
           <NavItem icon={<User size={20} />} label="Profile" active={activeTab === 'general-settings'} onClick={() => setActiveTab('general-settings')} />
           
           <div className="px-4 py-4 mt-4 bg-indigo-600 rounded-2xl flex items-center gap-3 shadow-lg border border-indigo-500 relative overflow-hidden group">
             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0 overflow-hidden text-center">
               {currentUser.logo ? (
                 <img src={currentUser.logo} alt="Logo" className="w-full h-full object-cover" />
               ) : (
                 (currentUser.companyName || currentUser.email).charAt(0).toUpperCase()
               )}
             </div>
             <div className="overflow-hidden z-10">
               <p className="text-[9px] font-bold text-indigo-200 uppercase tracking-widest truncate">{currentUser.companyName || 'Enterprise Access'}</p>
               <p className="text-xs font-bold text-white truncate max-w-[140px]">{currentUser.email}</p>
             </div>
           </div>
        </div>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Operations Hub'}
              {activeTab === 'customers' && 'Customer Segments'}
              {activeTab === 'products' && 'Product Portfolio'}
              {activeTab === 'campaign' && 'AI Mission Command'}
              {activeTab === 'history' && 'Operational History'}
              {activeTab === 'api-settings' && 'Cloud Gateways Configuration'}
              {activeTab === 'general-settings' && 'Enterprise Account'}
              {activeTab === 'feedback' && 'Support & Feedback'}
            </h2>
            {isSyncing && (
              <div className="flex items-center gap-2 bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full border border-indigo-100 animate-pulse">
                <Loader2 size={12} className="animate-spin" />
                <span className="text-[10px] font-bold uppercase">Cloud Syncing</span>
              </div>
            )}
          </div>
          {(activeTab === 'dashboard' || activeTab === 'history') && <TemplateButtons />}
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              icon={<Users className="text-blue-600" />} 
              label="Secure Customer Records" 
              value={customers.length} 
              color="blue" 
            />
            <StatCard 
              icon={<Package className="text-emerald-600" />} 
              label="Catalog Inventory" 
              value={products.length} 
              color="emerald" 
            />
            <StatCard 
              icon={<History className="text-indigo-600" />} 
              label="Mission Logs" 
              value={history.length} 
              color="indigo" 
            />
            
            <div className="flex flex-col gap-2">
              <div className={`px-4 py-2 rounded-xl border flex flex-col justify-center gap-0.5 ${isWhatsAppConfigured ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">WhatsApp Gateway</span>
                 <div className="flex items-center gap-1">
                   {isWhatsAppConfigured ? (
                     <><CheckCircle2 size={10} className="text-emerald-600" /><span className="text-[10px] font-bold text-emerald-700">Online</span></>
                   ) : (
                     <><AlertCircle size={10} className="text-rose-600" /><span className="text-[10px] font-bold text-rose-700">Offline</span></>
                   )}
                 </div>
              </div>
              <div className={`px-4 py-2 rounded-xl border flex flex-col justify-center gap-0.5 ${isGmailConfigured ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
                 <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tight">Gmail Gateway</span>
                 <div className="flex items-center gap-1">
                   {isGmailConfigured ? (
                     <><CheckCircle2 size={10} className="text-emerald-600" /><span className="text-[10px] font-bold text-emerald-700">Online</span></>
                   ) : (
                     <><AlertCircle size={10} className="text-rose-600" /><span className="text-[10px] font-bold text-rose-700">Offline</span></>
                   )}
                 </div>
              </div>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
              <CSVImport 
                onCustomerImport={handleImportCustomers} 
                onProductImport={handleImportProducts} 
                onClearCustomers={handleClearCustomers}
                onClearProducts={handleClearProducts}
                currentCustomerCount={customers.length}
                currentProductCount={products.length}
              />
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6">
            <SegmentationFilter filters={filters} setFilters={setFilters} cities={uniqueCities} states={uniqueStates} />
            <DataGrid 
              data={filteredCustomers} 
              type="customer" 
              selectedIds={selectedCustomerIds} 
              onToggleSelection={(id) => setSelectedCustomerIds(p => {
                 const n = new Set(p);
                 if (n.has(id)) n.delete(id); else n.add(id);
                 return n;
              })} 
              onToggleAll={(selectAll) => {
                 const n = new Set(selectedCustomerIds);
                 filteredCustomers.forEach(c => selectAll ? n.add(c.id) : n.delete(c.id));
                 setSelectedCustomerIds(n);
              }} 
              onDelete={handleDeleteCustomer}
            />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <ProductFilter 
              searchTerm={productSearch} 
              onSearchChange={setProductSearch}
            />
            <DataGrid 
              data={filteredProducts} 
              type="product" 
              selectedIds={selectedProductIds} 
              onToggleSelection={(id) => setSelectedProductIds(p => {
                 const n = new Set(p);
                 if (n.has(id)) n.delete(id); else n.add(id);
                 return n;
              })} 
              onToggleAll={() => {}}
              onDelete={handleDeleteProduct}
            />
          </div>
        )}

        {activeTab === 'campaign' && (
          <CampaignHub 
            customers={customers.filter(c => selectedCustomerIds.has(c.id))} 
            products={products.filter(p => selectedProductIds.has(p.id))} 
            whatsappConfig={whatsappConfig}
            gmailConfig={gmailConfig}
            currentUser={currentUser}
            onCampaignFinished={async (rec) => {
              setIsSyncing(true);
              await api.campaigns.save(rec);
              setHistory(prev => [rec, ...prev]);
              setIsSyncing(false);
            }}
          />
        )}

        {activeTab === 'history' && <CampaignHistory history={history} />}
        
        {activeTab === 'api-settings' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            <WhatsAppSettings 
              config={whatsappConfig} 
              setConfig={setWhatsappConfig} 
            />
            <GmailSettings 
              config={gmailConfig}
              setConfig={setGmailConfig}
            />
          </div>
        )}

        {activeTab === 'general-settings' && (
          <GeneralSettings 
            userEmail={currentUser.email} 
            logo={currentUser.logo}
            companyName={currentUser.companyName}
            onUpdateLogo={handleUpdateLogo}
            onUpdateCompanyName={handleUpdateCompanyName}
            onLogout={handleLogout} 
            onDeleteAccount={handleLogout} 
          />
        )}

        {activeTab === 'feedback' && <Feedback />}
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button onClick={onClick} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${active ? 'bg-indigo-50 text-indigo-700 shadow-sm' : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'}`}>
    {icon}{label}
  </button>
);

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-lg bg-${color}-50`}>{icon}</div>
    <div className="min-w-0 flex-1">
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{label}</p>
      <p className="text-xl font-bold text-slate-800 leading-none">{value.toLocaleString()}</p>
    </div>
  </div>
);

export default App;
