
import React, { useState } from 'react';
import { MessageSquare, Mail, Copy, Check, Send } from 'lucide-react';

const Feedback: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const email = "utkarsh.uk.singh@gmail.com";

  const copyToClipboard = () => {
    navigator.clipboard.writeText(email);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-100">
              <MessageSquare size={24} />
            </div>
            <div>
              <h3 className="text-xl font-black text-slate-800 tracking-tight">Support & Feedback</h3>
              <p className="text-xs text-slate-500 font-medium">We're here to help you optimize your operations.</p>
            </div>
          </div>
        </div>
        
        <div className="p-10 text-center space-y-8">
          <div className="space-y-4 max-w-md mx-auto">
            <p className="text-slate-600 leading-relaxed text-sm md:text-base">
              If you have any issue with this application, or if you want to give feedback regarding this application, please mail to this address:
            </p>
          </div>

          <div className="relative group max-w-sm mx-auto">
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center gap-4 p-5 bg-white border border-indigo-100 rounded-xl shadow-sm">
              <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                <Mail size={20} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Direct Contact</p>
                <p className="text-sm md:text-md font-bold text-slate-800 break-all">{email}</p>
              </div>
              <button 
                onClick={copyToClipboard}
                className={`p-2 rounded-lg transition-all ${copied ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-50 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50'}`}
                title="Copy email to clipboard"
              >
                {copied ? <Check size={18} /> : <Copy size={18} />}
              </button>
            </div>
          </div>

          <div className="pt-8 border-t border-slate-50">
            <a 
              href={`mailto:${email}`}
              className="inline-flex items-center gap-2 bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
            >
              <Send size={18} />
              Compose Email Now
            </a>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Check size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Response Time</h4>
            <p className="text-xs text-slate-500">I typically respond to operational feedback within 24-48 business hours.</p>
          </div>
        </div>
        <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-sm flex items-start gap-4">
          <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
            <Check size={16} />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-800 mb-1">Feature Requests</h4>
            <p className="text-xs text-slate-500">I'm always looking to expand AdGenius Pro. Send your ideas for new AI agents!</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Feedback;
