
import React from 'react';
import { Settings, Key, Phone, Info, LogOut, UserMinus, AlertTriangle } from 'lucide-react';
import { WhatsAppConfig } from '../types';

interface WhatsAppSettingsProps {
  config: WhatsAppConfig;
  setConfig: React.Dispatch<React.SetStateAction<WhatsAppConfig>>;
  onLogout: () => void;
  onDeleteUserId: () => void;
}

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ config, setConfig, onLogout, onDeleteUserId }) => {
  const handleChange = (field: keyof WhatsAppConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-2 mb-6">
          <Settings size={20} className="text-indigo-600" />
          <h2 className="text-lg font-bold text-slate-800">WhatsApp API Configuration</h2>
        </div>

        <div className="space-y-6">
          <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100 flex gap-3">
            <Info className="text-indigo-600 flex-shrink-0" size={20} />
            <div className="text-xs text-indigo-700 leading-relaxed">
              To integrate your application with WhatsApp, you need a <strong>Meta Developer Account</strong>. 
              Get these details from the <a href="https://developers.facebook.com" target="_blank" rel="noreferrer" className="underline font-bold">Meta App Dashboard</a>.
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Key size={12} />
                Permanent Access Token
              </label>
              <input
                type="password"
                value={config.accessToken}
                onChange={(e) => handleChange('accessToken', e.target.value)}
                placeholder="EAAG..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  <Phone size={12} />
                  Phone Number ID
                </label>
                <input
                  type="text"
                  value={config.phoneNumberId}
                  onChange={(e) => handleChange('phoneNumberId', e.target.value)}
                  placeholder="1029384..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                  WhatsApp Business Account ID
                </label>
                <input
                  type="text"
                  value={config.businessAccountId}
                  onChange={(e) => handleChange('businessAccountId', e.target.value)}
                  placeholder="0987654..."
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono text-sm"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border border-rose-100 shadow-sm border-t-4 border-t-rose-500">
        <h3 className="text-lg font-bold text-rose-800 mb-2 flex items-center gap-2">
          <AlertTriangle size={20} />
          Danger Zone
        </h3>
        <p className="text-sm text-slate-500 mb-6">These actions are destructive and will reset your current session configuration.</p>
        
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={onLogout}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold transition-all"
          >
            <LogOut size={18} />
            Logout from Session
          </button>
          <button
            onClick={onDeleteUserId}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 font-semibold transition-all border border-rose-200"
          >
            <UserMinus size={18} />
            Delete Business User ID
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSettings;
