
import React, { useState } from 'react';
import { Upload, AlertCircle, Loader2 } from 'lucide-react';
import { Customer, Product } from '../types';

interface CSVImportProps {
  onCustomerImport: (data: Customer[]) => void;
  onProductImport: (data: Product[]) => void;
  currentCustomerCount: number;
  currentProductCount: number;
}

const CSVImport: React.FC<CSVImportProps> = ({ onCustomerImport, onProductImport, currentCustomerCount, currentProductCount }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const MAX_CUSTOMERS = 100000;
  const MAX_PRODUCTS = 1000;

  const parseCSV = (text: string): string[][] => {
    return text.split('\n').map(row => row.split(',').map(cell => cell.trim())).filter(row => row.length > 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'customer' | 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const rows = parseCSV(text);
        const dataRows = rows.slice(1);

        if (type === 'customer') {
          const availableSlots = MAX_CUSTOMERS - currentCustomerCount;
          if (availableSlots <= 0) {
            alert(`Capacity reached. The system limit is ${MAX_CUSTOMERS.toLocaleString()} customers.`);
            return;
          }

          let customers: Customer[] = dataRows.map((row, idx) => ({
            id: `c-${idx}-${Date.now()}`,
            name: row[0] || '',
            mobile_number: row[1] || '',
            age: parseInt(row[2]) || 0,
            email: row[3] || '', 
            sex: (row[4] as any) || 'Other',
            city: row[5] || '',
            state: row[6] || '',
          })).filter(c => c.name && c.mobile_number && c.email);

          if (customers.length > availableSlots) {
            alert(`Import truncated: Added ${availableSlots.toLocaleString()} records to stay within the ${MAX_CUSTOMERS.toLocaleString()} system limit.`);
            customers = customers.slice(0, availableSlots);
          }
          onCustomerImport(customers);
        } else {
          const availableSlots = MAX_PRODUCTS - currentProductCount;
          if (availableSlots <= 0) {
            alert(`Product limit reached (${MAX_PRODUCTS}).`);
            return;
          }

          let products: Product[] = dataRows.map((row, idx) => ({
            id: `p-${idx}-${Date.now()}`,
            name: row[0] || '',
            description: row[1] || '',
            price: row[2] || '',
            url: row[3] || '', 
            whatsapp_opt_in: row[4] || 'N',
            gmail_opt_in: row[5] || 'N',
          })).filter(p => p.name && p.description && p.price && p.url);

          if (products.length > availableSlots) {
            products = products.slice(0, availableSlots);
          }
          onProductImport(products);
        }
      } catch (err) {
        console.error("Parse error:", err);
        alert("Failed to parse CSV. Please ensure the format matches the template.");
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
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Import Customers</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentCustomerCount >= MAX_CUSTOMERS ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {currentCustomerCount.toLocaleString()} / {MAX_CUSTOMERS.toLocaleString()}
          </span>
        </div>
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            {isProcessing ? <Loader2 className="w-8 h-8 mb-3 text-indigo-500 animate-spin" /> : <Upload className="w-8 h-8 mb-3 text-slate-400" />}
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">{isProcessing ? 'Processing Large Dataset...' : 'Upload Customer CSV'}</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Required: Name, Mobile, Age, Email...</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileChange(e, 'customer')} disabled={isProcessing} />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Import Products</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentProductCount >= MAX_PRODUCTS ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {currentProductCount} / {MAX_PRODUCTS}
          </span>
        </div>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Upload Product CSV</span></p>
            <p className="text-[10px] text-slate-400 uppercase tracking-tighter">Required: Name, Desc, Price, URL | Opt-ins (Optional)</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileChange(e, 'product')} />
        </label>
      </div>

      <div className="md:col-span-2 p-3 bg-indigo-50 border border-indigo-100 rounded-lg flex gap-3">
        <AlertCircle className="text-indigo-500 flex-shrink-0" size={18} />
        <p className="text-[11px] text-indigo-700 leading-tight">
          <strong>Data Requirements:</strong> Customer CSV requires email in the 4th column. Product CSV can <span className="font-bold underline">optionally</span> include WhatsApp and Gmail opt-in flags (Y/N) in columns 5 and 6.
        </p>
      </div>
    </div>
  );
};

export default CSVImport;
