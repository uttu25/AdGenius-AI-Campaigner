
import React from 'react';
import { Download } from 'lucide-react';

const TemplateButtons: React.FC = () => {
  const downloadCSV = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleCustomerTemplate = () => {
    const csvContent = "name,mobile_number,age,email,sex,city,state,whatsapp_opt_in,gmail_opt_in\nAjay Verma,9123456789,28,ajay@example.com,Male,Mumbai,Maharashtra,Y,Y\nPriya Singh,9876543210,24,priya@example.com,Female,Delhi,Delhi,Y,N";
    downloadCSV('customer_template.csv', csvContent);
  };

  const handleProductTemplate = () => {
    const csvContent = "product_name,product_description,price,product_url\nWireless Headphones,Noise cancelling over-ear headphones,$199,https://example.com/headphones\nSmart Watch,Waterproof fitness tracker with GPS,$129,https://example.com/watch";
    downloadCSV('product_template.csv', csvContent);
  };

  return (
    <div className="flex flex-wrap gap-4 items-center">
      <button
        onClick={handleCustomerTemplate}
        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
      >
        <Download size={18} />
        Customer Template
      </button>
      <button
        onClick={handleProductTemplate}
        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-lg font-medium transition-colors shadow-sm"
      >
        <Download size={18} />
        Product Template
      </button>
    </div>
  );
};

export default TemplateButtons;
