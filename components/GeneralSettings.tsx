
import React, { useState, useRef } from 'react';
import { User, LogOut, Trash2, Key, ShieldCheck, CreditCard, Upload, Image as ImageIcon, CheckCircle2, Building2 } from 'lucide-react';

interface GeneralSettingsProps {
  userEmail: string;
  logo?: string;
  companyName?: string;
  onUpdateLogo: (logo: string) => void;
  onUpdateCompanyName: (name: string) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ 
  userEmail, 
  logo, 
  companyName, 
  onUpdateLogo, 
  onUpdateCompanyName,
  onLogout, 
  onDeleteAccount 
}) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo size must be under 2MB.");
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          onUpdateLogo(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Profile Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="text-indigo-600" size={20} />
            Enterprise Profile
          </h3>
        </div>
        <div className="p-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="relative group">
              <div className="w-24 h-24 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-4xl font-black shadow-lg shadow-indigo-100 overflow-hidden border-4 border-white">
                {logo ? (
                  <img src={logo} alt="Company Logo" className="w-full h-full object-cover" />
                ) : (
                  (companyName || userEmail).charAt(0).toUpperCase()
                )}
              </div>
              <button 
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-2 -right-2 p-2 bg-white rounded-full shadow-md border border-slate-100 text-indigo-600 hover:bg-indigo-50 transition-colors"
                title="Upload Company Logo"
              >
                <Upload size={14} />
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/jpeg,image/png,image/webp" 
                onChange={handleLogoUpload}
              />
            </div>
            
            <div className="text-center md:text-left flex-1 min-w-0">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated Entity</p>
              <h4 className="text-2xl font-black text-slate-800 mb-1 truncate">Profile Settings</h4>
              <p className="text-xs text-slate-500 font-medium mb-3 italic">{userEmail}</p>
              <div className="flex items-center justify-center md:justify-start gap-2">
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200 flex items-center gap-1">
                  <ShieldCheck size={10} />
                  Verified Business
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-1">
                  <CreditCard size={10} />
                  Active Enterprise
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Brand Identity Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="text-indigo-600" size={20} />
            Company Branding
          </h3>
        </div>
        <div className="p-8 space-y-8">
          {/* Company Name Field */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <Building2 size={12} className="text-indigo-600" />
              Official Company Name
            </label>
            <div className="relative">
              <input 
                type="text"
                value={companyName || ''}
                onChange={(e) => onUpdateCompanyName(e.target.value)}
                placeholder="e.g. Acme Corporation"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium text-slate-700 transition-all shadow-sm"
              />
              {companyName && (
                <div className="absolute right-3 top-3 text-emerald-500 animate-in fade-in duration-300">
                  <CheckCircle2 size={20} />
                </div>
              )}
            </div>
            <p className="text-[10px] text-slate-400 italic">This name is used by the AI Agent to personalize your campaign content.</p>
          </div>

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 border-2 border-dashed border-slate-200 rounded-2xl bg-slate-50/30">
            <div className="flex-1">
              <h5 className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                Company Logo 
                {logo && <CheckCircle2 size={14} className="text-emerald-500" />}
              </h5>
              <p className="text-sm text-slate-500">Upload your brand mark. The AI Creative Agent uses this to align the generated visuals with your business identity.</p>
            </div>
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-md whitespace-nowrap flex items-center gap-2"
              >
                <Upload size={18} />
                {logo ? 'Change Logo' : 'Upload Logo'}
              </button>
              {logo && (
                <button 
                  onClick={() => onUpdateLogo('')}
                  className="text-xs font-bold text-rose-500 hover:text-rose-700 underline"
                >
                  Remove Logo
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Security & Access */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <Key className="text-indigo-600" size={20} />
            Security & Access
          </h3>
        </div>
        <div className="p-8 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 border border-slate-100 rounded-xl bg-slate-50/30">
            <div>
              <h5 className="font-bold text-slate-800">Update Operational Password</h5>
              <p className="text-sm text-slate-500">Secure your mission control with a custom secondary password.</p>
            </div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-sm whitespace-nowrap"
            >
              Configure
            </button>
          </div>

          {showPasswordChange && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
              <input type="password" placeholder="Current Password" className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
              <input type="password" placeholder="New Password" className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
              <button className="bg-slate-800 text-white font-bold rounded-lg px-4 py-2 hover:bg-slate-900 transition-all">Confirm</button>
            </div>
          )}
        </div>
      </div>

      {/* Danger Zone */}
      <div className="bg-white rounded-2xl border border-rose-100 shadow-sm border-t-4 border-t-rose-500">
        <div className="p-6 border-b border-rose-50">
          <h3 className="text-lg font-bold text-rose-800 flex items-center gap-2">
            <Trash2 size={20} />
            Account Management
          </h3>
        </div>
        <div className="p-8 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              onClick={onLogout}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl border-2 border-slate-100 text-slate-600 hover:bg-slate-50 hover:border-slate-200 font-bold transition-all group"
            >
              <LogOut size={20} className="group-hover:translate-x-1 transition-transform" />
              End Session
            </button>
            <button
              onClick={onDeleteAccount}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold transition-all border-2 border-rose-100 group"
            >
              <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
              Delete Account
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
