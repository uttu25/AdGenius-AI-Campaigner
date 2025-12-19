
import React, { useState, useMemo } from 'react';
import { LayoutDashboard, Users, Package, Settings, MessageSquarePlus, Megaphone, History, User, X, CheckCircle2, AlertCircle, ShieldCheck, Clock } from 'lucide-react';
import { Customer, Product, FilterOptions, WhatsAppConfig, CampaignRecord, User as UserType } from './types';
import TemplateButtons from './components/TemplateButtons';
import CSVImport from './components/CSVImport';
import DataGrid from './components/DataGrid';
import CampaignHub from './components/CampaignHub';
import SegmentationFilter from './components/SegmentationFilter';
import ProductFilter from './components/ProductFilter';
import WhatsAppSettings from './components/WhatsAppSettings';
import CampaignHistory from './components/CampaignHistory';
import AuthPage from './components/AuthPage';
import GeneralSettings from './components/GeneralSettings';

type AppTab = 'dashboard' | 'customers' | 'products' | 'campaign' | 'history' | 'api-settings' | 'general-settings';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>('dashboard');
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<CampaignRecord[]>([]);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({
    accessToken: '',
    phoneNumberId: '',
    businessAccountId: ''
  });
  
  const [filters, setFilters] = useState<FilterOptions>({
    ageRange: [0, 100],
    sex: [],
    city: '',
    state: ''
  });

  const [productSearch, setProductSearch] = useState('');

  // Selection States
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<Set<string>>(new Set());
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const ageMatch = c.age >= filters.ageRange[0] && c.age <= filters.ageRange[1];
      const sexMatch = filters.sex.length === 0 || filters.sex.includes(c.sex);
      const cityMatch = !filters.city || c.city === filters.city;
      const stateMatch = !filters.state || c.state === filters.state;
      return ageMatch && sexMatch && cityMatch && stateMatch;
    });
  }, [customers, filters]);

  const filteredProducts = useMemo(() => {
    if (!productSearch.trim()) return products;
    const lowerSearch = productSearch.toLowerCase();
    return products.filter(p => p.name.toLowerCase().includes(lowerSearch));
  }, [products, productSearch]);

  const uniqueCities = Array.from(new Set(customers.map(c => c.city))).filter(Boolean);
  const uniqueStates = Array.from(new Set(customers.map(c => c.state))).filter(Boolean);

  const toggleCustomerSelection = (id: string) => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFilteredCustomers = (selectAll: boolean) => {
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      filteredCustomers.forEach(c => {
        if (selectAll) next.add(c.id);
        else next.delete(c.id);
      });
      return next;
    });
  };

  const toggleProductSelection = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        if (!currentUser?.autoScheduleDaily && next.size >= 5) {
          return prev; 
        }
        next.add(id);
      }
      return next;
    });
  };

  const toggleAllFilteredProducts = (selectAll: boolean) => {
    if (!currentUser?.autoScheduleDaily) return;

    setSelectedProductIds(prev => {
      const next = new Set(prev);
      filteredProducts.forEach(p => {
        if (selectAll) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const toggleDailyScheduling = () => {
    if (currentUser) {
      const newMode = !currentUser.autoScheduleDaily;
      if (!newMode && selectedProductIds.size > 5) {
        const truncated = Array.from(selectedProductIds).slice(0, 5);
        setSelectedProductIds(new Set(truncated));
      }
      setCurrentUser(prev => prev ? { ...prev, autoScheduleDaily: newMode } : null);
    }
  };

  const handleUpdateLogo = (logo: string) => {
    setCurrentUser(prev => prev ? { ...prev, logo } : null);
  };

  const handleUpdateCompanyName = (companyName: string) => {
    setCurrentUser(prev => prev ? { ...prev, companyName } : null);
  };

  const handleLogin = (email: string) => {
    setCurrentUser({
      email,
      name: email.split('@')[0],
      isLoggedIn: true,
      isGoogleLinked: true,
      autoScheduleDaily: false,
      companyName: '' 
    });
    setActiveTab('dashboard');
  };

  const isWhatsAppConfigured = !!(whatsappConfig.accessToken && whatsappConfig.phoneNumberId);

  if (!currentUser) return <AuthPage onLogin={handleLogin} />;

  const hasAnySelection = selectedCustomerIds.size > 0 || selectedProductIds.size > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-6 space-y-8 flex flex-col shadow-sm sticky top-0 h-screen">
        <div className="flex items-center gap-3 text-indigo-600 px-2 overflow-hidden">
          <Megaphone size={32} className="shrink-0" />
          <div className="min-w-0">
             <h1 className="text-xl font-black tracking-tighter uppercase italic">AdGenius <span className="text-slate-400 font-light not-italic">Pro</span></h1>
          </div>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={20} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <NavItem icon={<Package size={20} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <NavItem icon={<MessageSquarePlus size={20} />} label="AI Campaign" active={activeTab === 'campaign'} onClick={() => setActiveTab('campaign')} />
          <NavItem icon={<History size={20} />} label="Past Missions" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        </nav>

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
           <NavItem icon={<Settings size={20} />} label="WhatsApp API" active={activeTab === 'api-settings'} onClick={() => setActiveTab('api-settings')} />
           <NavItem icon={<User size={20} />} label="Profile" active={activeTab === 'general-settings'} onClick={() => setActiveTab('general-settings')} />
           
           <div className="px-4 py-4 mt-4 bg-indigo-600 rounded-2xl flex items-center gap-3 shadow-lg border border-indigo-500 relative overflow-hidden group">
             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0 overflow-hidden">
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
          <div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
              {activeTab === 'dashboard' && 'Operations Hub'}
              {activeTab === 'customers' && 'Customer Segments'}
              {activeTab === 'products' && 'Product Portfolio'}
              {activeTab === 'campaign' && 'AI Mission Command'}
              {activeTab === 'history' && 'Operational History'}
              {activeTab === 'api-settings' && 'WhatsApp Cloud Gateway'}
              {activeTab === 'general-settings' && 'Enterprise Account'}
            </h2>
          </div>
          <TemplateButtons />
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Users className="text-blue-600" />} label="Database Capacity" value={customers.length} color="blue" />
            <StatCard icon={<Package className="text-emerald-600" />} label="Portfolio Size" value={products.length} color="emerald" />
            <StatCard icon={<History className="text-indigo-600" />} label="Missions Run" value={history.length} color="indigo" />
            
            <div className={`p-4 rounded-xl border flex flex-col justify-center gap-1 ${isWhatsAppConfigured ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
               <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">WhatsApp API Link</span>
               <div className="flex items-center gap-2">
                 {isWhatsAppConfigured ? (
                   <><CheckCircle2 size={14} className="text-emerald-600" /><span className="text-xs font-bold text-emerald-700">Verified</span></>
                 ) : (
                   <><AlertCircle size={14} className="text-rose-600" /><span className="text-xs font-bold text-rose-700">Disconnected</span></>
                 )}
               </div>
            </div>

            <div className="col-span-1 md:col-span-2 lg:col-span-4 mt-4">
              <CSVImport 
                onCustomerImport={(data) => setCustomers(prev => [...prev, ...data])} 
                onProductImport={(data) => setProducts(prev => [...prev, ...data])} 
                currentCustomerCount={customers.length}
                currentProductCount={products.length}
              />
            </div>
          </div>
        )}

        {activeTab === 'customers' && (
          <div className="space-y-6">
            <SegmentationFilter filters={filters} setFilters={setFilters} cities={uniqueCities} states={uniqueStates} />
            <DataGrid data={filteredCustomers} type="customer" selectedIds={selectedCustomerIds} onToggleSelection={toggleCustomerSelection} onToggleAll={toggleAllFilteredCustomers} />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
              <ProductFilter searchTerm={productSearch} onSearchChange={setProductSearch} />
              <div className="flex items-center gap-3 p-4 bg-white border border-slate-200 rounded-xl shadow-sm h-full flex-shrink-0">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700">Daily Batch Mode</span>
                  <span className="text-[10px] text-slate-400 italic">Unlocks select-all</span>
                </div>
                <button 
                  onClick={toggleDailyScheduling}
                  className={`relative w-12 h-6 rounded-full transition-colors focus:outline-none ${currentUser.autoScheduleDaily ? 'bg-indigo-600' : 'bg-slate-200'}`}
                >
                  <div className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white transition-transform ${currentUser.autoScheduleDaily ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
            <DataGrid 
              data={filteredProducts} 
              type="product" 
              selectedIds={selectedProductIds} 
              onToggleSelection={toggleProductSelection} 
              onToggleAll={toggleAllFilteredProducts}
              isDailyMode={currentUser.autoScheduleDaily}
            />
          </div>
        )}

        {activeTab === 'campaign' && (
          <CampaignHub 
            customers={customers.filter(c => selectedCustomerIds.has(c.id))} 
            products={products.filter(p => selectedProductIds.has(p.id))} 
            whatsappConfig={whatsappConfig}
            currentUser={currentUser}
            onCampaignFinished={(rec) => setHistory(prev => [rec, ...prev])}
          />
        )}

        {activeTab === 'history' && <CampaignHistory history={history} />}
        {activeTab === 'api-settings' && <WhatsAppSettings config={whatsappConfig} setConfig={setWhatsappConfig} onLogout={() => setCurrentUser(null)} onDeleteUserId={() => setWhatsappConfig(p => ({ ...p, businessAccountId: '' }))} />}
        {activeTab === 'general-settings' && (
          <GeneralSettings 
            userEmail={currentUser.email} 
            logo={currentUser.logo}
            companyName={currentUser.companyName}
            onUpdateLogo={handleUpdateLogo}
            onUpdateCompanyName={handleUpdateCompanyName}
            onLogout={() => setCurrentUser(null)} 
            onDeleteAccount={() => setCurrentUser(null)} 
          />
        )}
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
    <div>
      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</p>
      <p className="text-xl font-bold text-slate-800 leading-none">{value.toLocaleString()}</p>
    </div>
  </div>
);

export default App;
