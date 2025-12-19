
import React, { useState, useMemo, useEffect } from 'react';
import { LayoutDashboard, Users, Package, Settings, MessageSquarePlus, Megaphone, History, User, X } from 'lucide-react';
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

  const removeCustomer = (idx: number) => {
    const customer = filteredCustomers[idx];
    setCustomers(prev => prev.filter(c => c.id !== customer.id));
    setSelectedCustomerIds(prev => {
      const next = new Set(prev);
      next.delete(customer.id);
      return next;
    });
  };

  const removeProduct = (idx: number) => {
    const productToDelete = filteredProducts[idx];
    setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      next.delete(productToDelete.id);
      return next;
    });
  };

  const handleCampaignFinished = (record: CampaignRecord) => {
    setHistory(prev => [record, ...prev]);
  };

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
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllFilteredProducts = (selectAll: boolean) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      filteredProducts.forEach(p => {
        if (selectAll) next.add(p.id);
        else next.delete(p.id);
      });
      return next;
    });
  };

  const deselectAllGlobal = () => {
    setSelectedCustomerIds(new Set());
    setSelectedProductIds(new Set());
  };

  const handleLogin = (email: string, integrated: boolean) => {
    setCurrentUser({
      email,
      name: email.split('@')[0],
      isLoggedIn: true,
      isGmailIntegrated: integrated
    });
    setActiveTab('dashboard');
  };

  const handleLogout = () => {
    if (confirm("Logout from AdGenius? Stored API keys will be cleared.")) {
      setCurrentUser(null);
      setWhatsappConfig({ accessToken: '', phoneNumberId: '', businessAccountId: '' });
      setActiveTab('dashboard');
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("WARNING: This will permanently delete your account and all campaigns. Are you sure?")) {
      setCurrentUser(null);
      setCustomers([]);
      setProducts([]);
      setHistory([]);
      setWhatsappConfig({ accessToken: '', phoneNumberId: '', businessAccountId: '' });
    }
  };

  const handleDeleteUserId = () => {
    if (confirm("Delete the stored WhatsApp Business User ID?")) {
      setWhatsappConfig(prev => ({ ...prev, businessAccountId: '' }));
    }
  };

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  const hasAnySelection = selectedCustomerIds.size > 0 || selectedProductIds.size > 0;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-72 bg-white border-r border-slate-200 p-6 space-y-8 flex flex-col shadow-sm sticky top-0 h-screen">
        <div className="flex items-center gap-3 text-indigo-600 px-2">
          <Megaphone size={32} />
          <h1 className="text-xl font-black tracking-tighter uppercase italic">AdGenius <span className="text-slate-400 font-light not-italic">Pro</span></h1>
        </div>

        <nav className="flex-1 space-y-1">
          <NavItem icon={<LayoutDashboard size={20} />} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Users size={20} />} label="Customers" active={activeTab === 'customers'} onClick={() => setActiveTab('customers')} />
          <NavItem icon={<Package size={20} />} label="Products" active={activeTab === 'products'} onClick={() => setActiveTab('products')} />
          <NavItem icon={<MessageSquarePlus size={20} />} label="AI Campaign" active={activeTab === 'campaign'} onClick={() => setActiveTab('campaign')} />
          <NavItem icon={<History size={20} />} label="Past AI Campaigns" active={activeTab === 'history'} onClick={() => setActiveTab('history')} />
        </nav>

        {hasAnySelection && (
          <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-100 animate-in fade-in slide-in-from-bottom-2">
            <div className="flex justify-between items-start mb-2">
              <span className="text-[10px] font-bold text-indigo-700 uppercase">Selection Active</span>
              <button onClick={deselectAllGlobal} className="text-indigo-400 hover:text-indigo-600">
                <X size={14} />
              </button>
            </div>
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-indigo-600">
                <span>Customers:</span>
                <span className="font-bold">{selectedCustomerIds.size}</span>
              </div>
              <div className="flex justify-between text-xs text-indigo-600">
                <span>Products:</span>
                <span className="font-bold">{selectedProductIds.size}</span>
              </div>
            </div>
            <button 
              onClick={() => setActiveTab('campaign')}
              className="w-full mt-3 py-1.5 bg-indigo-600 text-white text-xs font-bold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Configure Campaign
            </button>
          </div>
        )}

        <div className="pt-6 border-t border-slate-100 space-y-1">
           <NavItem icon={<Settings size={20} />} label="WhatsApp API" active={activeTab === 'api-settings'} onClick={() => setActiveTab('api-settings')} />
           <NavItem icon={<User size={20} />} label="Account Settings" active={activeTab === 'general-settings'} onClick={() => setActiveTab('general-settings')} />
           <div className="px-4 py-4 mt-4 bg-indigo-600 rounded-2xl flex items-center gap-3 shadow-lg shadow-indigo-100 border border-indigo-500">
             <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-indigo-600 text-xs font-bold">
               {currentUser.email.charAt(0).toUpperCase()}
             </div>
             <div className="overflow-hidden">
               <p className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">Active Profile</p>
               <p className="text-xs font-bold text-white truncate">{currentUser.email}</p>
             </div>
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              {activeTab === 'dashboard' && 'Workspace Overview'}
              {activeTab === 'customers' && 'Customer Base'}
              {activeTab === 'products' && 'Product Catalog'}
              {activeTab === 'campaign' && 'Multi-Agent AI Hub'}
              {activeTab === 'history' && 'Operational History'}
              {activeTab === 'api-settings' && 'WhatsApp Cloud API'}
              {activeTab === 'general-settings' && 'Account & Security'}
            </h2>
            <p className="text-slate-500 text-sm">
              {activeTab === 'dashboard' && `Hello ${currentUser.name}. Your agents are ready.`}
              {activeTab === 'customers' && `Managing ${customers.length} target customers.`}
              {activeTab === 'products' && `Ready to promote ${products.length} products.`}
              {activeTab === 'campaign' && 'Coordinate Manager, Creative, and Delivery agents.'}
              {activeTab === 'history' && `${history.length} campaigns logged in system.`}
              {activeTab === 'api-settings' && 'Official Meta Business integration status.'}
              {activeTab === 'general-settings' && 'Manage your Google integration and privacy.'}
            </p>
          </div>
          <TemplateButtons />
        </header>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard icon={<Users className="text-blue-600" />} label="Customers" value={customers.length} color="blue" />
            <StatCard icon={<Package className="text-emerald-600" />} label="Products" value={products.length} color="emerald" />
            <StatCard icon={<History className="text-indigo-600" />} label="Total Campaigns" value={history.length} color="indigo" />
            <div className={`p-4 rounded-xl border flex flex-col justify-center gap-1 ${currentUser.isGmailIntegrated ? 'bg-blue-50 border-blue-100' : 'bg-slate-100 border-slate-200'}`}>
               <span className="text-[10px] font-bold text-slate-400 uppercase">Gmail Status</span>
               <div className="flex items-center gap-2">
                 <div className={`w-2 h-2 rounded-full ${currentUser.isGmailIntegrated ? 'bg-blue-500' : 'bg-slate-400'}`}></div>
                 <span className="text-xs font-bold text-slate-700">{currentUser.isGmailIntegrated ? 'API Integrated' : 'Not Connected'}</span>
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
            <DataGrid 
              data={filteredCustomers} 
              type="customer" 
              onDelete={removeCustomer} 
              selectedIds={selectedCustomerIds}
              onToggleSelection={toggleCustomerSelection}
              onToggleAll={toggleAllFilteredCustomers}
            />
          </div>
        )}

        {activeTab === 'products' && (
          <div className="space-y-6">
            <ProductFilter searchTerm={productSearch} onSearchChange={setProductSearch} />
            <DataGrid 
              data={filteredProducts} 
              type="product" 
              onDelete={removeProduct} 
              selectedIds={selectedProductIds}
              onToggleSelection={toggleProductSelection}
              onToggleAll={toggleAllFilteredProducts}
            />
          </div>
        )}

        {activeTab === 'campaign' && (
          <CampaignHub 
            customers={customers.filter(c => selectedCustomerIds.has(c.id))} 
            products={products.filter(p => selectedProductIds.has(p.id))} 
            whatsappConfig={whatsappConfig}
            currentUser={currentUser}
            onCampaignFinished={handleCampaignFinished}
          />
        )}

        {activeTab === 'history' && (
          <CampaignHistory history={history} />
        )}

        {activeTab === 'api-settings' && (
          <WhatsAppSettings 
            config={whatsappConfig} 
            setConfig={setWhatsappConfig} 
            onLogout={handleLogout}
            onDeleteUserId={handleDeleteUserId}
          />
        )}

        {activeTab === 'general-settings' && (
          <GeneralSettings 
            userEmail={currentUser.email} 
            onLogout={handleLogout} 
            onDeleteAccount={handleDeleteAccount} 
          />
        )}
      </main>
    </div>
  );
};

const NavItem: React.FC<{ icon: React.ReactNode, label: string, active: boolean, onClick: () => void }> = ({ icon, label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all ${
      active 
        ? 'bg-indigo-50 text-indigo-700 shadow-sm' 
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-700'
    }`}
  >
    {icon}
    {label}
  </button>
);

const StatCard: React.FC<{ icon: React.ReactNode, label: string, value: number, color: string }> = ({ icon, label, value, color }) => (
  <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
    <div className={`p-3 rounded-lg bg-${color}-50`}>
      {icon}
    </div>
    <div>
      <p className="text-xs font-medium text-slate-500 mb-0.5">{label}</p>
      <p className="text-2xl font-bold text-slate-800 leading-none">{value}</p>
    </div>
  </div>
);

export default App;
