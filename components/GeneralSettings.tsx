
import React, { useState } from 'react';
import { User, LogOut, Trash2, Key, ShieldCheck, CreditCard } from 'lucide-react';

interface GeneralSettingsProps {
  userEmail: string;
  onLogout: () => void;
  onDeleteAccount: () => void;
}

const GeneralSettings: React.FC<GeneralSettingsProps> = ({ userEmail, onLogout, onDeleteAccount }) => {
  const [showPasswordChange, setShowPasswordChange] = useState(false);

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Profile Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
          <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
            <User className="text-indigo-600" size={20} />
            Your Profile
          </h3>
        </div>
        <div className="p-8">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 flex items-center justify-center text-white text-3xl font-black shadow-lg shadow-indigo-100">
              {userEmail.charAt(0).toUpperCase()}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Authenticated Account</p>
              <h4 className="text-xl font-bold text-slate-800">{userEmail}</h4>
              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold border border-green-200 flex items-center gap-1">
                  <ShieldCheck size={10} />
                  Verified via Google
                </span>
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold border border-blue-200 flex items-center gap-1">
                  <CreditCard size={10} />
                  Enterprise Plan
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Security Settings */}
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
              <h5 className="font-bold text-slate-800">Change Application Password</h5>
              <p className="text-sm text-slate-500">Update your secondary local credentials for extra security.</p>
            </div>
            <button
              onClick={() => setShowPasswordChange(!showPasswordChange)}
              className="px-6 py-2 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-all shadow-sm whitespace-nowrap"
            >
              Update Password
            </button>
          </div>

          {showPasswordChange && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-in slide-in-from-top-4 duration-300">
              <input type="password" placeholder="Current Password" className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
              <input type="password" placeholder="New Password" className="px-4 py-2 border border-slate-200 rounded-lg text-sm bg-white" />
              <button className="bg-slate-800 text-white font-bold rounded-lg px-4 py-2 hover:bg-slate-900 transition-all">Confirm Change</button>
            </div>
          )}
        </div>
      </div>

      {/* Account Actions */}
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
              Log Out Session
            </button>
            <button
              onClick={onDeleteAccount}
              className="flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold transition-all border-2 border-rose-100 group"
            >
              <Trash2 size={20} className="group-hover:scale-110 transition-transform" />
              Delete Account
            </button>
          </div>
          <p className="text-[11px] text-slate-400 text-center italic">
            Note: Deleting your account will permanently remove all campaign history and uploaded customer/product data.
          </p>
        </div>
      </div>
    </div>
  );
};

export default GeneralSettings;
