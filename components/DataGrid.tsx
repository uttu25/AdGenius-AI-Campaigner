
import React, { useState, useEffect } from 'react';
import { Customer, Product } from '../types';
import { Trash2, User, Package, CheckSquare, Square, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface DataGridProps {
  data: Customer[] | Product[];
  type: 'customer' | 'product';
  onDelete?: (idx: number) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
}

const DataGrid: React.FC<DataGridProps> = ({ data, type, onDelete, selectedIds, onToggleSelection, onToggleAll }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  // Reset page when data changes (e.g., when a filter is applied)
  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  if (data.length === 0) {
    return (
      <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <div className="mb-2">No {type}s found with current filters.</div>
        <div className="text-xs">Try adjusting your search or import more data.</div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const allFilteredSelected = data.every(item => selectedIds.has(item.id));

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10">
                  <button 
                    onClick={() => onToggleAll(!allFilteredSelected)}
                    className="text-slate-400 hover:text-indigo-600 transition-colors"
                    title="Select/Deselect All in Filter"
                  >
                    {allFilteredSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
                  </button>
                </th>
                {type === 'customer' ? (
                  <>
                    <th className="px-4 py-3">Name</th>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Age/Sex</th>
                    <th className="px-4 py-3">Location</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Product Name</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Price</th>
                  </>
                )}
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item, idx) => {
                const isSelected = selectedIds.has(item.id);
                const actualIdx = startIndex + idx;
                return (
                  <tr key={item.id} className={`transition-colors ${isSelected ? 'bg-indigo-50/30' : 'hover:bg-slate-50/50'}`}>
                    <td className="px-4 py-3">
                      <button 
                        onClick={() => onToggleSelection(item.id)}
                        className="text-slate-400 hover:text-indigo-600 transition-colors"
                      >
                        {isSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
                      </button>
                    </td>
                    {type === 'customer' ? (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                          <User size={14} className="text-indigo-400" />
                          {(item as Customer).name}
                        </td>
                        <td className="px-4 py-3 text-slate-600">{(item as Customer).mobile_number}</td>
                        <td className="px-4 py-3 text-slate-600">
                          <span className="px-2 py-0.5 rounded-full bg-slate-100 text-[10px] uppercase font-bold mr-1">
                            {(item as Customer).sex}
                          </span>
                          {(item as Customer).age} yrs
                        </td>
                        <td className="px-4 py-3 text-slate-600">{(item as Customer).city}, {(item as Customer).state}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-medium text-slate-700 flex items-center gap-2">
                          <Package size={14} className="text-emerald-400" />
                          {(item as Product).name}
                        </td>
                        <td className="px-4 py-3 text-slate-600 truncate max-w-xs">{(item as Product).description}</td>
                        <td className="px-4 py-3 font-bold text-emerald-600">{(item as Product).price}</td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right">
                      {onDelete && (
                        <button onClick={() => onDelete(actualIdx)} className="text-slate-300 hover:text-red-500 transition-colors">
                          <Trash2 size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-2">
          <p className="text-xs text-slate-500 font-medium">
            Showing <span className="text-slate-900">{(startIndex + 1).toLocaleString()}</span> to <span className="text-slate-900">{Math.min(startIndex + itemsPerPage, data.length).toLocaleString()}</span> of <span className="text-slate-900 font-bold">{data.length.toLocaleString()}</span> entries
          </p>
          
          <div className="flex items-center gap-1">
            <PaginationButton onClick={() => setCurrentPage(1)} disabled={currentPage === 1} icon={<ChevronsLeft size={16} />} />
            <PaginationButton onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} icon={<ChevronLeft size={16} />} />
            
            <div className="flex items-center gap-1 mx-2">
              <span className="text-xs font-bold text-slate-400">Page</span>
              <input 
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                }}
                className="w-12 h-8 text-center border border-slate-200 rounded text-xs font-bold focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              />
              <span className="text-xs font-bold text-slate-400 text-nowrap">of {totalPages.toLocaleString()}</span>
            </div>

            <PaginationButton onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} icon={<ChevronRight size={16} />} />
            <PaginationButton onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} icon={<ChevronsRight size={16} />} />
          </div>
        </div>
      )}
    </div>
  );
};

const PaginationButton: React.FC<{ onClick: () => void, disabled: boolean, icon: React.ReactNode }> = ({ onClick, disabled, icon }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`p-1.5 rounded-lg border transition-all ${
      disabled 
        ? 'bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed' 
        : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:text-indigo-600'
    }`}
  >
    {icon}
  </button>
);

export default DataGrid;
