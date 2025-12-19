
import React, { useState } from 'react';
import { Megaphone, Mail, Lock, Loader2, User, ShieldCheck, CheckCircle2 } from 'lucide-react';

interface AuthPageProps {
  onLogin: (email: string, integrated: boolean) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [view, setView] = useState<'landing' | 'google-choose' | 'google-form' | 'google-integrate'>('landing');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const mockAccounts = [
    { name: 'Utkarsh Singh', email: 'utkarshuksingh@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=utkarsh1' },
    { name: 'Utkarsh Singh', email: 'utkarshsinghaffiliatemarketing@gmail.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=utkarsh2' }
  ];

  const handleGoogleContinue = () => {
    setView('google-choose');
  };

  const selectAccount = (selectedEmail: string) => {
    setEmail(selectedEmail);
    setView('google-form');
  };

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      setView('google-integrate');
    }, 1200);
  };

  const handleFinalIntegration = () => {
    setIsVerifying(true);
    setTimeout(() => {
      setIsVerifying(false);
      onLogin(email, true);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-[450px] w-full bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden transition-all duration-500">
        
        {/* Google-style Header */}
        <div className="pt-10 pb-6 px-10 text-center">
          <div className="flex justify-center mb-4">
            <div className="flex items-center gap-1">
              <svg width="24" height="24" viewBox="0 0 24 24" className="mr-1">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span className="text-slate-600 font-medium">Sign in with Google</span>
            </div>
          </div>
          <div className="flex justify-center mb-4">
             <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
               <Megaphone size={28} />
             </div>
          </div>
        </div>

        <div className="px-10 pb-10">
          {view === 'landing' && (
            <div className="space-y-8">
              <div className="text-center">
                <h1 className="text-2xl font-normal text-slate-800 mb-2">Welcome to AdGenius</h1>
                <p className="text-slate-600 text-sm">Automate your outreach effortlessly</p>
              </div>
              <button
                onClick={handleGoogleContinue}
                className="w-full flex items-center justify-center gap-3 bg-white border border-slate-300 py-2.5 px-4 rounded font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-sm"
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                   <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                </svg>
                Continue with Google
              </button>
            </div>
          )}

          {view === 'google-choose' && (
            <div className="space-y-6 animate-in fade-in duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-medium text-slate-800 mb-1">Choose an account</h1>
                <p className="text-slate-700 text-sm">to continue to <span className="font-medium text-blue-600">AdGenius</span></p>
              </div>
              <div className="border-t border-slate-100 mt-6">
                {mockAccounts.map((acc, i) => (
                  <button
                    key={i}
                    onClick={() => selectAccount(acc.email)}
                    className="w-full flex items-center gap-4 py-4 px-2 border-b border-slate-100 hover:bg-slate-50 transition-colors text-left"
                  >
                    <img src={acc.avatar} alt={acc.name} className="w-8 h-8 rounded-full border border-slate-200" />
                    <div className="flex-1 overflow-hidden">
                      <p className="text-sm font-medium text-slate-900">{acc.name}</p>
                      <p className="text-xs text-slate-500 truncate">{acc.email}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {view === 'google-form' && (
            <form onSubmit={handlePasswordSubmit} className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h1 className="text-2xl font-medium text-slate-800 mb-1">Welcome</h1>
                <div className="inline-flex items-center gap-2 px-2 py-1 rounded-full border border-slate-200 bg-white text-xs mt-2">
                   <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`} className="w-4 h-4 rounded-full" />
                   {email}
                </div>
              </div>
              <div className="space-y-4">
                <input
                  type="password"
                  required
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3.5 rounded border border-slate-300 text-sm focus:border-blue-600 focus:ring-1 focus:ring-blue-600 outline-none"
                />
                <button type="button" className="text-blue-600 text-sm font-medium hover:underline">Forgot password?</button>
              </div>
              <div className="flex justify-between items-center pt-4">
                <button type="button" onClick={() => setView('google-choose')} className="text-blue-600 text-sm font-medium hover:bg-blue-50 px-3 py-2 rounded">Back</button>
                <button
                  type="submit"
                  disabled={isVerifying}
                  className="bg-blue-600 text-white px-8 py-2 rounded font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  {isVerifying ? <Loader2 className="animate-spin" size={16} /> : 'Next'}
                </button>
              </div>
            </form>
          )}

          {view === 'google-integrate' && (
            <div className="space-y-6 animate-in fade-in zoom-in-95 duration-500">
              <div className="text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-4 text-blue-600">
                   <ShieldCheck size={32} />
                </div>
                <h1 className="text-xl font-medium text-slate-800">Integrate with Google</h1>
                <p className="text-sm text-slate-500 mt-2">AdGenius wants to access your Gmail account to send advertisements on your behalf.</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-lg space-y-3">
                 <div className="flex items-start gap-3 text-xs text-slate-600">
                    <CheckCircle2 size={14} className="text-blue-600 mt-0.5" />
                    <span>View and send emails from your Gmail account</span>
                 </div>
                 <div className="flex items-start gap-3 text-xs text-slate-600">
                    <CheckCircle2 size={14} className="text-blue-600 mt-0.5" />
                    <span>Manage your Google Contacts for campaign targeting</span>
                 </div>
              </div>
              <div className="flex justify-between items-center pt-4">
                <button onClick={() => onLogin(email, false)} className="text-slate-500 text-sm font-medium hover:underline">Deny Access</button>
                <button
                  onClick={handleFinalIntegration}
                  disabled={isVerifying}
                  className="bg-blue-600 text-white px-8 py-2 rounded font-medium hover:bg-blue-700 transition-all flex items-center gap-2"
                >
                  {isVerifying ? <Loader2 className="animate-spin" size={16} /> : 'Allow & Integrate'}
                </button>
              </div>
            </div>
          )}
        </div>
        
        <div className="px-10 py-4 flex justify-between text-[11px] text-slate-500 border-t border-slate-100 bg-slate-50/50">
          <span className="hover:underline cursor-pointer">English (United Kingdom)</span>
          <div className="flex gap-4">
            <span className="hover:underline cursor-pointer">Help</span>
            <span className="hover:underline cursor-pointer">Privacy</span>
            <span className="hover:underline cursor-pointer">Terms</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
