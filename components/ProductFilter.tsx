
import React from 'react';
import { Search, PackageSearch } from 'lucide-react';

interface ProductFilterProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

const ProductFilter: React.FC<ProductFilterProps> = ({ searchTerm, onSearchChange }) => {
  return (
    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 flex flex-col md:flex-row md:items-center gap-4">
      <div className="flex items-center gap-2 text-indigo-600 shrink-0">
        <PackageSearch size={20} />
        <h3 className="font-bold text-slate-800">Search Catalog</h3>
      </div>
      
      <div className="relative flex-1">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
          <Search size={16} />
        </div>
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Filter products by name..."
          className="block w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
        />
      </div>
      
      {searchTerm && (
        <button 
          onClick={() => onSearchChange('')}
          className="text-xs font-medium text-slate-400 hover:text-slate-600 underline"
        >
          Clear Filter
        </button>
      )}
    </div>
  );
};

export default ProductFilter;
