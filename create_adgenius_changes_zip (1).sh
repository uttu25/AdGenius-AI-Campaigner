#!/usr/bin/env bash
set -euo pipefail

OUTDIR="adgenius-changes"
ZIPNAME="adgenius-changes.zip"

rm -rf "$OUTDIR" "$ZIPNAME"
mkdir -p "$OUTDIR/services" "$OUTDIR/components"

cat > "$OUTDIR/services/api.ts" <<'EOF'
/* Client-side API wrapper to talk with the backend.
   Set VITE_API_BASE in .env (e.g. VITE_API_BASE=http://localhost:4000)
*/

const API_BASE = (import.meta.env.VITE_API_BASE as string) || "http://localhost:4000";

function getAuthHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(path: string, options: RequestInit = {}) {
  const url = `${API_BASE}${path}`;
  options.headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
    ...getAuthHeaders()
  };
  const resp = await fetch(url, options);
  const text = await resp.text();
  let payload;
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }
  if (!resp.ok) {
    const message = payload?.error || payload?.message || `Request failed: ${resp.status}`;
    throw new Error(message);
  }
  return payload;
}

export async function getCustomers() {
  return request("/api/customers");
}

export async function getProducts() {
  return request("/api/products");
}

export async function getCampaigns() {
  return request("/api/campaigns");
}

export async function getSettings() {
  return request("/api/settings");
}

export async function updateSettings(payload: any) {
  return request("/api/settings", { method: "PUT", body: JSON.stringify(payload) });
}

export async function startCampaign(params: { productIds: string[]; channel: "WhatsApp" | "Email"; customerIds?: string[] }) {
  return request("/api/campaigns/start", { method: "POST", body: JSON.stringify(params) });
}

// CSV import using multipart/form-data
export async function importCustomersCsv(file: File) {
  const API = `${API_BASE}/api/customers/import`;
  const form = new FormData();
  form.append("file", file);
  const token = localStorage.getItem("token");
  const resp = await fetch(API, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form
  });
  const data = await resp.json();
  if (!resp.ok) throw new Error(data?.error || `Import failed: ${resp.status}`);
  return data;
}

// Basic auth helpers (register/login)
export async function authRegister(email: string, password: string, name?: string, companyName?: string) {
  const resp = await request("/api/auth/register", { method: "POST", body: JSON.stringify({ email, password, name, companyName }) });
  if (resp.token) localStorage.setItem("token", resp.token);
  return resp;
}

export async function authLogin(email: string, password: string) {
  const resp = await request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
  if (resp.token) localStorage.setItem("token", resp.token);
  return resp;
}

export function authLogout() {
  localStorage.removeItem("token");
}
EOF

cat > "$OUTDIR/components/CampaignHub.tsx" <<'EOF'
import React, { useState, useEffect } from "react";
import { Play, Loader2, ShieldAlert, Users, Package, MessageCircle, Mail, Image as ImageIcon, Key, Layout, CheckCircle2, ShieldCheck } from "lucide-react";
import { Customer, Product, CampaignStep, WhatsAppConfig, GmailConfig, CampaignRecord, User as UserType, DeliveryChannel } from "../types.ts";
import { startCampaign as apiStartCampaign } from "../services/api.ts";

/* Note: This file no longer calls Gemini/Gmail/WhatsApp directly from the browser.
   Campaign execution is delegated to the backend via /api/campaigns/start.
*/

interface AIStudio {
  hasSelectedApiKey: () => Promise<boolean>;
  openSelectKey: () => Promise<void>;
}

declare global {
  interface Window {
    aistudio: AIStudio;
  }
}

interface CampaignHubProps {
  customers: Customer[];
  products: Product[];
  whatsappConfig: WhatsAppConfig;
  gmailConfig: GmailConfig;
  currentUser: UserType | null;
  onCampaignFinished: (record: CampaignRecord) => void;
}

const CampaignHub: React.FC<CampaignHubProps> = ({ customers, products, whatsappConfig, gmailConfig, currentUser, onCampaignFinished }) => {
  const [logs, setLogs] = useState<CampaignStep[]>([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [completedMessages, setCompletedMessages] = useState<number>(0);
  const [failedMessages, setFailedMessages] = useState<number>(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>("WhatsApp");
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  const PROTECTION_LIMIT = 1000;

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio && typeof window.aistudio.hasSelectedApiKey === "function") {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if (window.aistudio && typeof window.aistudio.openSelectKey === "function") {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const addLog = (agent: CampaignStep["agent"], message: string, status: CampaignStep["status"] = "completed") => {
    setLogs((prev) => [{ agent, message, status, timestamp: new Date() }, ...prev]);
  };

  const startCampaign = async () => {
    try {
      setLogs([]);
      setCompletedMessages(0);
      setFailedMessages(0);
      setIsCampaignRunning(true);

      addLog("Manager", `SYSTEM INITIALIZED. Identity: ${currentUser?.companyName || "Enterprise"}. Strategy: ${deliveryChannel}.`, "processing");

      if (products.length === 0) throw new Error("Mission Queue empty. Select products from Portfolio.");
      if (customers.length === 0) throw new Error("Audience missing. Select recipients from Segments.");

      if (deliveryChannel === "WhatsApp" && !whatsappConfig.accessToken) {
        addLog("Manager", "WhatsApp Gateway not configured. Make sure settings are saved to backend.", "error");
        throw new Error("WhatsApp Gateway not configured.");
      }
      if (deliveryChannel === "Email" && !gmailConfig.refreshToken) {
        addLog("Manager", "Gmail Gateway not configured. Make sure settings are saved to backend.", "error");
        throw new Error("Email (Gmail) Gateway not configured.");
      }

      const targetList = customers.slice(0, PROTECTION_LIMIT);
      addLog("Manager", `Target Validation: ${targetList.length} recipients locked.`, "completed");

      addLog("Manager", "Delegating execution to backend orchestration service...", "processing");

      // Prepare payload
      const productIds = products.map((p) => p.id);
      const customerIds = targetList.map((c) => c.id);

      // Call backend to run the campaign
      addLog("Manager", "Calling backend to start campaign...", "processing");
      const resp = await apiStartCampaign({ productIds, channel: deliveryChannel, customerIds });

      // Backend should return the saved campaign record as resp.campaign (or resp)
      const campaign: CampaignRecord = resp.campaign || resp.campaignRecord || resp;

      if (campaign) {
        addLog("Manager", `Campaign finished. Product: ${campaign.productName}. Success: ${campaign.successCount}, Fail: ${campaign.failureCount}`, "completed");
        setCompletedMessages(campaign.successCount || 0);
        setFailedMessages(campaign.failureCount || 0);
        if (campaign.imageUrl) setGeneratedImageUrl(campaign.imageUrl);
        onCampaignFinished(campaign);
      } else {
        addLog("Manager", "Campaign completed but no record returned from backend.", "error");
      }
    } catch (err: any) {
      addLog("Manager", `SYSTEM ERROR: ${err.message || String(err)}`, "error");
    } finally {
      setIsCampaignRunning(false);
      setCurrentProductIndex(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        {!hasApiKey && (
          <div className="bg-indigo-600 p-4 rounded-xl border border-indigo-500 shadow-lg text-white animate-in slide-in-from-top-4">
            <div className="flex gap-3 items-start">
              <Key className="shrink-0 mt-0.5" size={18} />
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider">Cloud Access Required</p>
                <p className="text-[10px] text-indigo-100 leading-tight">
                  A valid API key is needed to power the Creative and Manager Agents.
                </p>
                <button onClick={handleOpenSelectKey} className="w-full mt-2 py-1.5 bg-white text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-50 transition-colors">
                  Select API Key
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="text-indigo-600" size={20} />
              AI Manager
            </h2>
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
              <span className="text-[10px] font-bold text-emerald-600 uppercase">System Ready</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Deployment Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDeliveryChannel("WhatsApp")} disabled={isCampaignRunning} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold`}>
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button onClick={() => setDeliveryChannel("Email")} disabled={isCampaignRunning} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold`}>
                  <Mail size={14} /> Email
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Recipients</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1"><Users size={12} /> {customers.length}</span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Products</span>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1"><Package size={12} /> {products.length}</span>
              </div>
            </div>
          </div>

          <button
            onClick={startCampaign}
            disabled={isCampaignRunning}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${isCampaignRunning ? "bg-slate-100 text-slate-400 cursor-not-allowed" : "bg-indigo-600 text-white"}`}
          >
            {isCampaignRunning ? <><Loader2 className="animate-spin" size={20} /> Running Campaign</> : <><Play size={20} fill="currentColor" /> Initiate Mission</>}
          </button>
        </div>

        {activeProduct && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4 space-y-4">
            <div className="flex items-center gap-2 border-b pb-3">
              <Layout size={16} className="text-indigo-600" />
              <h3 className="text-sm font-bold text-slate-800 truncate">Live Output: {activeProduct.name}</h3>
            </div>

            {generatedImageUrl && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ImageIcon size={14} className="text-indigo-600" />
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Synthesized Visual</span>
                </div>
                <div className="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square">
                  <img src={generatedImageUrl} alt="Generated Asset" className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                  <div className="absolute top-2 right-2">
                    <div className="bg-emerald-500 text-white p-1 rounded-full shadow-lg">
                      <CheckCircle2 size={12} />
                    </div>
                  </div>
                </div>
              </div>
            )}

          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="bg-slate-900 rounded-xl p-6 h-[600px] shadow-2xl flex flex-col border border-slate-800">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
            <h2 className="text-slate-500 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
              <div className={`w-1.5 h-1.5 rounded-full ${isCampaignRunning ? "bg-indigo-500 animate-pulse" : "bg-slate-600"}`}></div>
              ORCHESTRATOR_CONSOLE_v4.2
            </h2>
            {isCampaignRunning && (
              <div className="flex gap-4 font-mono text-[10px]">
                <span className="text-emerald-400 uppercase">SENT: {completedMessages}</span>
                <span className="text-rose-400 uppercase">FAIL: {failedMessages}</span>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {logs.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-slate-700 font-mono text-xs italic">
                <ShieldCheck className="opacity-10 mb-2" size={32} />
                MANAGER: System in standby. Waiting for mission command.
              </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`p-3 rounded border flex gap-3 transition-all ${log.status === "error" ? "bg-rose-950/20 border-rose-900/40" : "bg-slate-800/60 border-slate-700"}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${log.agent === "Manager" ? "text-indigo-400" : log.agent === "Creative Agent" ? "text-emerald-400" : "text-teal-400"}`}>{log.agent}</span>
                    <span className="text-[8px] text-slate-600 font-mono italic">[{log.timestamp.toLocaleTimeString()}]</span>
                  </div>
                  <p className={`text-[11px] font-mono leading-relaxed ${log.status === "error" ? "text-rose-300" : "text-slate-300"}`}>
                    {log.message}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignHub;
EOF

cat > "$OUTDIR/App.tsx" <<'EOF'
import React, { useState, useMemo, useEffect } from "react";
import { Customer, Product, FilterOptions, WhatsAppConfig, GmailConfig, CampaignRecord, User as UserType } from "./types.ts";
import TemplateButtons from "./components/TemplateButtons.tsx";
import CSVImport from "./components/CSVImport.tsx";
import DataGrid from "./components/DataGrid.tsx";
import CampaignHub from "./components/CampaignHub.tsx";
import SegmentationFilter from "./components/SegmentationFilter.tsx";
import ProductFilter from "./components/ProductFilter.tsx";
import WhatsAppSettings from "./components/WhatsAppSettings.tsx";
import GmailSettings from "./components/GmailSettings.tsx";
import CampaignHistory from "./components/CampaignHistory.tsx";
import AuthPage from "./components/AuthPage.tsx";
import GeneralSettings from "./components/GeneralSettings.tsx";
import Feedback from "./components/Feedback.tsx";
import * as api from "./services/api.ts";

type AppTab = "dashboard" | "customers" | "products" | "campaign" | "history" | "api-settings" | "general-settings" | "feedback";

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<UserType | null>(null);
  const [activeTab, setActiveTab] = useState<AppTab>("dashboard");
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [history, setHistory] = useState<CampaignRecord[]>([]);
  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppConfig>({ accessToken: "", phoneNumberId: "", businessAccountId: "" });
  const [gmailConfig, setGmailConfig] = useState<GmailConfig>({ clientId: "", clientSecret: "", refreshToken: "", userEmail: "" });

  const [filters, setFilters] = useState<FilterOptions>({ ageRange: [0, 100], sex: [], city: "", state: "" });

  useEffect(() => {
    // Load initial data from backend
    (async () => {
      try {
        const [c, p, h, s] = await Promise.all([api.getCustomers(), api.getProducts(), api.getCampaigns(), api.getSettings()]);
        setCustomers(c || []);
        setProducts(p || []);
        setHistory(h || []);
        // Settings shape may vary; map to local config shapes
        if (s?.whatsapp) setWhatsappConfig(s.whatsapp);
        if (s?.gmail) setGmailConfig(s.gmail);
      } catch (err) {
        console.error("Failed to load initial data from backend:", err);
      }
    })();
  }, []);

  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const ageMatch = c.age >= filters.ageRange[0] && c.age <= filters.ageRange[1];
      const sexMatch = filters.sex.length === 0 || filters.sex.includes(c.sex);
      const cityMatch = !filters.city || c.city === filters.city;
      const stateMatch = !filters.state || c.state === filters.state;
      return ageMatch && sexMatch && cityMatch && stateMatch;
    });
  }, [customers, filters]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // keep product search/filtering as before (trimmed for brevity)
      return true;
    });
  }, [products]);

  const onCampaignFinished = (record: CampaignRecord) => {
    setHistory(prev => [record, ...prev]);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* -- simplified top nav and tab switching omitted for brevity -- */}
      <main className="max-w-7xl mx-auto">
        {activeTab === "campaign" && (
          <CampaignHub
            customers={filteredCustomers}
            products={filteredProducts}
            whatsappConfig={whatsappConfig}
            gmailConfig={gmailConfig}
            currentUser={currentUser}
            onCampaignFinished={onCampaignFinished}
          />
        )}

        {/* Render other components as before, now backed by API-loaded state */}
      </main>
    </div>
  );
};

export default App;
EOF

cat > "$OUTDIR/components/AuthPage.tsx" <<'EOF'
import React, { useState } from "react";
import * as api from "../services/api.ts";
import { User } from "../types.ts";

type Props = {
  onAuth?: (user: Partial<User> | null) => void;
};

export default function AuthPage({ onAuth }: Props) {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      if (isRegister) {
        const resp = await api.authRegister(email, password, name || undefined, companyName || undefined);
        if (onAuth) onAuth(resp.user || { email: resp.email, name: resp.name });
      } else {
        const resp = await api.authLogin(email, password);
        if (onAuth) onAuth(resp.user || { email: resp.email, name: resp.name });
      }
    } catch (err: any) {
      setError(err.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: 480 }}>
      <h3 style={{ marginTop: 0, marginBottom: 8 }}>{isRegister ? "Register" : "Login"}</h3>
      <form onSubmit={handleSubmit} style={{ display: "grid", gap: 8 }}>
        {isRegister && (
          <>
            <input className="input" placeholder="Full name" value={name} onChange={(e) => setName(e.target.value)} />
            <input className="input" placeholder="Company name (optional)" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
          </>
        )}
        <input className="input" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <input className="input" placeholder="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />

        <div style={{ display: "flex", gap: 8 }}>
          <button className="button" type="submit" disabled={loading}>{loading ? "Working…" : (isRegister ? "Register" : "Login")}</button>
          <button
            type="button"
            className="button"
            onClick={() => setIsRegister((v) => !v)}
            style={{ background: "transparent", color: "var(--muted)", border: "1px solid rgba(255,255,255,0.04)" }}
            disabled={loading}
          >
            {isRegister ? "Switch to Login" : "Switch to Register"}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
      </form>
    </div>
  );
}
EOF

cat > "$OUTDIR/components/CSVImport.tsx" <<'EOF'
import React, { useRef, useState } from "react";
import * as api from "../services/api.ts";

type Props = {
  onImported?: (count: number) => void;
};

export default function CSVImport({ onImported }: Props) {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleUpload = async () => {
    setMessage(null);
    setError(null);
    const file = fileRef.current?.files?.[0];
    if (!file) {
      setError("Please choose a CSV file");
      return;
    }
    setLoading(true);
    try {
      const resp = await api.importCustomersCsv(file);
      const imported = resp.imported || resp.count || 0;
      setMessage(`Imported ${imported} records`);
      if (onImported) onImported(imported);
    } catch (err: any) {
      setError(err.message || "Import failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card">
      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <input ref={fileRef} type="file" accept=".csv,text/csv" />
        <button className="button" onClick={handleUpload} disabled={loading}>{loading ? "Uploading…" : "Upload CSV"}</button>
      </div>
      {message && <div style={{ marginTop: 8, color: "var(--success)" }}>{message}</div>}
      {error && <div style={{ marginTop: 8 }} className="error">{error}</div>}
      <div style={{ marginTop: 8 }} className="muted">CSV should have headers matching Customer fields (name, mobile_number, email, age, sex, city, state)</div>
    </div>
  );
}
EOF

# create zip
cd "$OUTDIR"
zip -r "../$ZIPNAME" . >/dev/null
cd ..
echo "Created $ZIPNAME with the files in the '$OUTDIR' folder."
echo "You can unzip it and copy files into your project as needed."
EOF