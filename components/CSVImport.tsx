
import React, { useState } from 'react';
import { Upload, AlertCircle, Loader2, Trash2, XCircle, CheckCircle2 } from 'lucide-react';
import { Customer, Product } from '../types';

interface CSVImportProps {
  onCustomerImport: (data: Customer[]) => void;
  onProductImport: (data: Product[]) => void;
  onClearCustomers: () => void;
  onClearProducts: () => void;
  currentCustomerCount: number;
  currentProductCount: number;
}

const CSVImport: React.FC<CSVImportProps> = ({ 
  onCustomerImport, 
  onProductImport, 
  onClearCustomers,
  onClearProducts,
  currentCustomerCount, 
  currentProductCount 
}) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const MAX_CUSTOMERS = 100000;
  const MAX_PRODUCTS = 1000;

  const parseCSV = (text: string): string[][] => {
    return text.split('\n')
      .map(row => row.split(',').map(cell => cell.trim()))
      .filter(row => row.length > 1);
  };

  const validateHeaders = (headers: string[], required: string[]): { valid: boolean; missing: string[] } => {
    const normalizedHeaders = headers.map(h => h.toLowerCase());
    const missing = required.filter(req => !normalizedHeaders.includes(req.toLowerCase()));
    return { valid: missing.length === 0, missing };
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'customer' | 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsProcessing(true);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        if (rows.length < 2) {
          throw new Error("The selected file appears to be empty or only contains headers.");
        }

        const headers = rows[0];
        const dataRows = rows.slice(1);
        const normalizedHeaders = headers.map(h => h.toLowerCase());

        if (type === 'customer') {
          const required = ['name', 'mobile_number', 'age', 'email'];
          const validation = validateHeaders(headers, required);
          
          if (!validation.valid) {
            const errorMsg = `Invalid Customer CSV. Missing mandatory columns: ${validation.missing.join(', ')}`;
            setError(errorMsg);
            alert(errorMsg);
            setIsProcessing(false);
            return;
          }

          const getIdx = (name: string) => normalizedHeaders.indexOf(name.toLowerCase());
          
          const customers: Customer[] = dataRows.map((row, idx) => ({
            id: `c-${idx}-${Date.now()}`,
            name: row[getIdx('name')] || '',
            mobile_number: row[getIdx('mobile_number')] || '',
            age: parseInt(row[getIdx('age')]) || 0,
            email: row[getIdx('email')] || '', 
            sex: (row[getIdx('sex')] as any) || 'Other',
            city: row[getIdx('city')] || '',
            state: row[getIdx('state')] || '',
            whatsapp_opt_in: row[getIdx('whatsapp_opt_in')] || 'N',
            gmail_opt_in: row[getIdx('gmail_opt_in')] || 'N',
          })).filter(c => c.name && c.mobile_number && c.email);

          onCustomerImport(customers);
        } else {
          const required = ['product_name', 'product_description', 'price', 'product_url'];
          const validation = validateHeaders(headers, required);

          if (!validation.valid) {
            const errorMsg = `Invalid Product CSV. Missing mandatory columns: ${validation.missing.join(', ')}`;
            setError(errorMsg);
            alert(errorMsg);
            setIsProcessing(false);
            return;
          }

          const getIdx = (name: string) => normalizedHeaders.indexOf(name.toLowerCase());

          const products: Product[] = dataRows.map((row, idx) => ({
            id: `p-${idx}-${Date.now()}`,
            name: row[getIdx('product_name')] || '',
            description: row[getIdx('product_description')] || '',
            price: row[getIdx('price')] || '',
            url: row[getIdx('product_url')] || '', 
          })).filter(p => p.name && p.description && p.price && p.url);

          onProductImport(products);
        }
      } catch (err: any) {
        console.error("Parse error:", err);
        setError(err.message || "Failed to parse CSV. Please use the provided template.");
      } finally {
        setIsProcessing(false);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; 
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Import Customers</h3>
          <div className="flex items-center gap-2">
            {currentCustomerCount > 0 && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearCustomers();
                }}
                className="group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100 z-10 relative"
                title="Deselect and clear current list"
              >
                <Trash2 size={12} />
                <span className="text-[10px] font-bold uppercase">Clear</span>
              </button>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentCustomerCount >= MAX_CUSTOMERS ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              {currentCustomerCount.toLocaleString()} / {MAX_CUSTOMERS.toLocaleString()}
            </span>
          </div>
        </div>
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isProcessing ? <Loader2 className="w-8 h-8 mb-3 text-indigo-500 animate-spin" /> : <Upload className="w-8 h-8 mb-3 text-slate-400" />}
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">{isProcessing ? 'Validating Columns...' : 'Upload Customer CSV'}</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter text-center px-4">Required: Name, Mobile_Number, Age, Email</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileChange(e, 'customer')} disabled={isProcessing} />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Import Products</h3>
          <div className="flex items-center gap-2">
            {currentProductCount > 0 && (
              <button 
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onClearProducts();
                }}
                className="group flex items-center gap-1.5 px-2 py-1 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 transition-all border border-rose-100 z-10 relative"
                title="Deselect and clear current list"
              >
                <Trash2 size={12} />
                <span className="text-[10px] font-bold uppercase">Clear</span>
              </button>
            )}
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentProductCount >= MAX_PRODUCTS ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
              {currentProductCount} / {MAX_PRODUCTS}
            </span>
          </div>
        </div>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Upload Product CSV</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter text-center px-4">Required: Product_Name, Product_Description, Price, Product_URL</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileChange(e, 'product')} />
        </label>
      </div>

      <div className="md:col-span-2">
        {error ? (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg flex gap-3 animate-in slide-in-from-top-2">
            <XCircle className="text-rose-500 flex-shrink-0" size={18} />
            <div className="flex-1">
              <p className="text-[11px] font-bold text-rose-700 uppercase">Schema Validation Failed</p>
              <p className="text-[11px] text-rose-600 leading-tight mt-0.5">{error}</p>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-3">
            <AlertCircle className="text-indigo-500 flex-shrink-0" size={18} />
            <p className="text-[11px] text-indigo-700 leading-tight">
              <strong>Security Protocol:</strong> Column headers must exactly match the template requirements. Unrecognized columns will be ignored. Large datasets (up to 100k) are supported.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CSVImport;
