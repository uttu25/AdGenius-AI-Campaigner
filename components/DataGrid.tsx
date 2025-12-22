
import React, { useState, useEffect } from 'react';
import { Customer, Product } from '../types';
import { Trash2, User, Package, CheckSquare, Square, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight, AlertCircle, Link as LinkIcon, Mail, MessageCircle } from 'lucide-react';

interface DataGridProps {
  data: Customer[] | Product[];
  type: 'customer' | 'product';
  onDelete?: (id: string) => void;
  selectedIds: Set<string>;
  onToggleSelection: (id: string) => void;
  onToggleAll: (selectAll: boolean) => void;
  isDailyMode?: boolean; 
}

const DataGrid: React.FC<DataGridProps> = ({ 
  data, 
  type, 
  onDelete, 
  selectedIds, 
  onToggleSelection, 
  onToggleAll,
  isDailyMode = false
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    setCurrentPage(1);
  }, [data.length]);

  if (data.length === 0) {
    return (
      <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <div className="mb-2 text-sm font-medium">No {type}s found in your database.</div>
        <div className="text-[10px] uppercase tracking-widest opacity-60">Import data via CSV to begin</div>
      </div>
    );
  }

  const totalPages = Math.ceil(data.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

  const allFilteredSelected = data.length > 0 && data.every(item => selectedIds.has(item.id));

  const handleSelection = (id: string) => {
    if (type === 'product' && !isDailyMode && !selectedIds.has(id) && selectedIds.size >= 5) {
      alert("Standard Campaign Limit: You can select a maximum of 5 products. Enable 'Daily Batch Mode' to select more.");
      return;
    }
    onToggleSelection(id);
  };

  const showSelectAll = type === 'customer' || (type === 'product' && isDailyMode);

  return (
    <div className="space-y-4">
      <div className="overflow-hidden border border-slate-200 rounded-xl shadow-sm bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
              <tr>
                <th className="px-4 py-3 w-10 text-center">
                  {showSelectAll ? (
                    <button 
                      type="button"
                      onClick={() => onToggleAll(!allFilteredSelected)}
                      className="text-slate-400 hover:text-indigo-600 transition-colors mx-auto block"
                    >
                      {allFilteredSelected ? <CheckSquare size={18} className="text-indigo-600" /> : <Square size={18} />}
                    </button>
                  ) : (
                    <div className="w-[18px]" />
                  )}
                </th>
                {type === 'customer' ? (
                  <>
                    <th className="px-4 py-3">Recipient Name</th>
                    <th className="px-4 py-3">Contact Channels</th>
                    <th className="px-4 py-3">Demographics</th>
                    <th className="px-4 py-3">Location</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Campaign Product</th>
                    <th className="px-4 py-3">Description</th>
                    <th className="px-4 py-3">Opt-in Status</th>
                    <th className="px-4 py-3">Pricing</th>
                    <th className="px-4 py-3">Target URL</th>
                  </>
                )}
                <th className="px-4 py-3 w-10 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedData.map((item) => {
                const isSelected = selectedIds.has(item.id);
                return (
                  <tr key={item.id} className={`transition-all duration-200 ${isSelected ? 'bg-indigo-50/40' : 'hover:bg-slate-50/30'}`}>
                    <td className="px-4 py-3 text-center">
                      <button 
                        type="button"
                        onClick={() => handleSelection(item.id)}
                        className={`transition-colors mx-auto block ${isSelected ? 'text-indigo-600' : 'text-slate-300 hover:text-slate-400'}`}
                      >
                        {isSelected ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    {type === 'customer' ? (
                      <>
                        <td className="px-4 py-3 font-semibold text-slate-700">{(item as Customer).name}</td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col gap-0.5">
                             <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                               <MessageCircle size={10} className="text-emerald-500" />
                               {(item as Customer).mobile_number}
                             </span>
                             <span className="font-mono text-[10px] text-slate-500 flex items-center gap-1">
                               <Mail size={10} className="text-red-400" />
                               {(item as Customer).email}
                             </span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-slate-100 text-[9px] font-bold text-slate-600 uppercase mr-2">
                            {(item as Customer).sex}
                          </span>
                          <span className="text-xs">{(item as Customer).age} yrs</span>
                        </td>
                        <td className="px-4 py-3 text-slate-500">{(item as Customer).city}, {(item as Customer).state}</td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-semibold text-slate-700 flex items-center gap-2">
                          <Package size={14} className="text-slate-400" />
                          {(item as Product).name}
                        </td>
                        <td className="px-4 py-3 text-slate-500 truncate max-w-[150px] text-xs">{(item as Product).description}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${(item as Product).whatsapp_opt_in === 'Y' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>WA: {(item as Product).whatsapp_opt_in || 'N'}</span>
                            <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold uppercase ${(item as Product).gmail_opt_in === 'Y' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 'bg-slate-100 text-slate-400 border border-slate-200'}`}>GM: {(item as Product).gmail_opt_in || 'N'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 font-bold text-indigo-600">{(item as Product).price}</td>
                        <td className="px-4 py-3">
                           <a href={(item as Product).url} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-xs text-indigo-500 hover:text-indigo-700 font-medium">
                             <LinkIcon size={12} />
                             Link
                           </a>
                        </td>
                      </>
                    )}
                    <td className="px-4 py-3 text-right">
                      {onDelete && (
                        <button 
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onDelete(item.id);
                          }} 
                          className="p-1 hover:bg-rose-50 rounded text-slate-300 hover:text-rose-500 transition-all hover:scale-110"
                        >
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

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 py-2">
          <div className="flex items-center gap-3">
            <p className="text-xs font-medium text-slate-400 italic">
              Record pool: <span className="text-slate-700 font-bold">{data.length.toLocaleString()}</span> entries
            </p>
          </div>
          
          <div className="flex items-center gap-1 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
            <PaginationButton onClick={() => setCurrentPage(1)} disabled={currentPage === 1} icon={<ChevronsLeft size={14} />} />
            <PaginationButton onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} icon={<ChevronLeft size={14} />} />
            
            <div className="px-3 flex items-center gap-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Page</span>
              <input 
                type="number"
                min={1}
                max={totalPages}
                value={currentPage}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (val >= 1 && val <= totalPages) setCurrentPage(val);
                }}
                className="w-10 h-6 text-center bg-slate-50 border-none text-[10px] font-bold text-slate-700 rounded focus:ring-1 focus:ring-indigo-500 outline-none"
              />
              <span className="text-[10px] font-bold text-slate-400">/ {totalPages.toLocaleString()}</span>
            </div>

            <PaginationButton onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} icon={<ChevronRight size={14} />} />
            <PaginationButton onClick={() => setCurrentPage(totalPages)} disabled={currentPage === totalPages} icon={<ChevronsRight size={14} />} />
          </div>
        </div>
      )}
    </div>
  );
};

const PaginationButton: React.FC<{ onClick: () => void, disabled: boolean, icon: React.ReactNode }> = ({ onClick, disabled, icon }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className={`p-1 rounded-md transition-all ${
      disabled 
        ? 'text-slate-200 cursor-not-allowed' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-indigo-600'
    }`}
  >
    {icon}
  </button>
);

export default DataGrid;
