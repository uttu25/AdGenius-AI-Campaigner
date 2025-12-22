
import React from 'react';
import { Mail, Key, User, Info, LogOut, ShieldAlert } from 'lucide-react';
import { GmailConfig } from '../types';

interface GmailSettingsProps {
  config: GmailConfig;
  setConfig: React.Dispatch<React.SetStateAction<GmailConfig>>;
}

const GmailSettings: React.FC<GmailSettingsProps> = ({ config, setConfig }) => {
  const handleChange = (field: keyof GmailConfig, value: string) => {
    setConfig(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
      <div className="flex items-center gap-2 mb-6">
        <Mail size={20} className="text-red-600" />
        <h2 className="text-lg font-bold text-slate-800">Gmail API Configuration</h2>
      </div>

      <div className="space-y-6">
        <div className="p-4 bg-red-50 rounded-lg border border-red-100 flex gap-3">
          <Info className="text-red-600 flex-shrink-0" size={20} />
          <div className="text-xs text-red-700 leading-relaxed">
            Configure your <strong>Google Cloud Project</strong> with Gmail API enabled. 
            Download your OAuth 2.0 Client credentials from the <a href="https://console.cloud.google.com" target="_blank" rel="noreferrer" className="underline font-bold">GCP Console</a>.
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              <User size={12} />
              Sender Email Address
            </label>
            <input
              type="email"
              value={config.userEmail}
              onChange={(e) => handleChange('userEmail', e.target.value)}
              placeholder="marketing@yourcompany.com"
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <Key size={12} />
                Client ID
              </label>
              <input
                type="text"
                value={config.clientId}
                onChange={(e) => handleChange('clientId', e.target.value)}
                placeholder="0123456789-abc..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono text-sm"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
                <ShieldAlert size={12} />
                Client Secret
              </label>
              <input
                type="password"
                value={config.clientSecret}
                onChange={(e) => handleChange('clientSecret', e.target.value)}
                placeholder="GOCSPX-..."
                className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono text-sm"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-2">
              Refresh Token
            </label>
            <textarea
              rows={2}
              value={config.refreshToken}
              onChange={(e) => handleChange('refreshToken', e.target.value)}
              placeholder="1//0abcde..."
              className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-red-500/20 font-mono text-sm"
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default GmailSettings;
