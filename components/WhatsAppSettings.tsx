
import React from 'react';
import { Settings, Key, Phone, Info } from 'lucide-react';
import { WhatsAppConfig } from '../types';

interface WhatsAppSettingsProps {
  config: WhatsAppConfig;
  setConfig: React.Dispatch<React.SetStateAction<WhatsAppConfig>>;
}

const WhatsAppSettings: React.FC<WhatsAppSettingsProps> = ({ config, setConfig }) => {
  const handleChange = (field: keyof WhatsAppConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
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
  );
};

export default WhatsAppSettings;
