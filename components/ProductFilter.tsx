
import React from 'react';
import { Search, PackageSearch, MessageCircle, Mail } from 'lucide-react';

interface ProductFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  whatsappOptIn: string;
  onWhatsappOptInChange: (value: string) => void;
  gmailOptIn: string;
  onGmailOptInChange: (value: string) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({ 
  searchTerm, 
  onSearchChange,
  whatsappOptIn,
  onWhatsappOptInChange,
  gmailOptIn,
  onGmailOptInChange
}) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col gap-4">
      <div className="flex flex-col md:flex-row md:items-center gap-4">
        <div className="flex items-center gap-2 text-indigo-600 shrink-0">
          <PackageSearch size={20} />
          <h3 className="font-bold text-slate-800">Product Filters</h3>
        </div>
        
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search size={16} />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search catalog by name..."
            className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
          />
        </div>

        <div className="flex items-center gap-2">
          {searchTerm || whatsappOptIn || gmailOptIn ? (
            <button 
              onClick={() => {
                onSearchChange('');
                onWhatsappOptInChange('');
                onGmailOptInChange('');
              }}
              className="text-xs font-medium text-slate-400 hover:text-slate-600 underline whitespace-nowrap"
            >
              Reset All
            </button>
          ) : null}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
            <MessageCircle size={14} className="text-emerald-500" />
            WhatsApp Opt-in
          </label>
          <select
            value={whatsappOptIn}
            onChange={(e) => onWhatsappOptInChange(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700"
          >
            <option value="">All Products</option>
            <option value="Y">Opt-in (Y)</option>
            <option value="N">No Opt-in (N)</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2 shrink-0">
            <Mail size={14} className="text-rose-500" />
            Gmail Opt-in
          </label>
          <select
            value={gmailOptIn}
            onChange={(e) => onGmailOptInChange(e.target.value)}
            className="flex-1 px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-700"
          >
            <option value="">All Products</option>
            <option value="Y">Opt-in (Y)</option>
            <option value="N">No Opt-in (N)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default ProductFilter;
