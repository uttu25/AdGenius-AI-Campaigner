
import React from 'react';
import { Upload, AlertCircle } from 'lucide-react';
import { Customer, Product } from '../types';

interface CSVImportProps {
  onCustomerImport: (data: Customer[]) => void;
  onProductImport: (data: Product[]) => void;
  currentCustomerCount: number;
  currentProductCount: number;
}

const CSVImport: React.FC<CSVImportProps> = ({ onCustomerImport, onProductImport, currentCustomerCount, currentProductCount }) => {
  const MAX_CUSTOMERS = 1000;
  const MAX_PRODUCTS = 300;

  const parseCSV = (text: string): string[][] => {
    return text.split('\n').map(row => row.split(',').map(cell => cell.trim())).filter(row => row.length > 1);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'customer' | 'product') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCSV(text);
      const dataRows = rows.slice(1);

      if (type === 'customer') {
        const availableSlots = MAX_CUSTOMERS - currentCustomerCount;
        if (availableSlots <= 0) {
          alert(`Limit reached. You can only have up to ${MAX_CUSTOMERS} customers in your workspace.`);
          return;
        }

        let customers: Customer[] = dataRows.map((row, idx) => ({
          id: `c-${idx}-${Date.now()}`,
          name: row[0] || '',
          mobile_number: row[1] || '',
          age: parseInt(row[2]) || 0,
          sex: (row[3] as any) || 'Other',
          city: row[4] || '',
          state: row[5] || '',
        })).filter(c => c.name && c.mobile_number);

        if (customers.length > availableSlots) {
          alert(`Import truncated: Only ${availableSlots} customers added to stay within the ${MAX_CUSTOMERS} limit.`);
          customers = customers.slice(0, availableSlots);
        }
        onCustomerImport(customers);
      } else {
        const availableSlots = MAX_PRODUCTS - currentProductCount;
        if (availableSlots <= 0) {
          alert(`Limit reached. You can only have up to ${MAX_PRODUCTS} products in your catalog.`);
          return;
        }

        let products: Product[] = dataRows.map((row, idx) => ({
          id: `p-${idx}-${Date.now()}`,
          name: row[0] || '',
          description: row[1] || '',
          price: row[2] || '',
        })).filter(p => p.name && p.description && p.price);

        if (products.length > availableSlots) {
          alert(`Import truncated: Only ${availableSlots} products added to stay within the ${MAX_PRODUCTS} limit.`);
          products = products.slice(0, availableSlots);
        }
        onProductImport(products);
      }
    };
    reader.readAsText(file);
    e.target.value = ''; // Reset input
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-white rounded-xl border border-slate-200 shadow-sm">
      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Import Customers</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentCustomerCount >= MAX_CUSTOMERS ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {currentCustomerCount} / {MAX_CUSTOMERS} MAX
          </span>
        </div>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Upload Customer CSV</span></p>
            <p className="text-[10px] text-slate-400">Batch Limit: 1,000 customers</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileChange(e, 'customer')} />
        </label>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-end">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider">Import Products</h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${currentProductCount >= MAX_PRODUCTS ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-500'}`}>
            {currentProductCount} / {MAX_PRODUCTS} MAX
          </span>
        </div>
        <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-lg cursor-pointer bg-slate-50 hover:bg-slate-100 transition-colors">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <Upload className="w-8 h-8 mb-3 text-slate-400" />
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold">Upload Product CSV</span></p>
            <p className="text-[10px] text-slate-400">Batch Limit: 300 products</p>
          </div>
          <input type="file" className="hidden" accept=".csv" onChange={(e) => handleFileChange(e, 'product')} />
        </label>
      </div>

      <div className="md:col-span-2 p-3 bg-blue-50 border border-blue-100 rounded-lg flex gap-3">
        <AlertCircle className="text-blue-500 flex-shrink-0" size={18} />
        <p className="text-[11px] text-blue-700 leading-tight">
          <strong>Efficiency Standards:</strong> AdGenius supports high-volume management of up to 1,000 customers and 300 products simultaneously for seamless AI-driven campaign orchestration.
        </p>
      </div>
    </div>
  );
};

export default CSVImport;
