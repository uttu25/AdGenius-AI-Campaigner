
import React, { useState, useEffect } from 'react';
import { Play, Loader2, ShieldAlert, Users, Package, AlertCircle, MessageCircle, ShieldCheck, Clock, Link as LinkIcon, Building2, Send, Mail, Image as ImageIcon, Key, XCircle } from 'lucide-react';
import { Customer, Product, CampaignStep, WhatsAppConfig, GmailConfig, CampaignRecord, User as UserType, DeliveryChannel } from '../types.ts';
import { generateAdCopy, generateProductImage, personalizeMessage } from '../services/geminiService.ts';
import { sendWhatsAppMessage } from '../services/whatsappService.ts';
import { sendEmailMessage } from '../services/gmailService.ts';

// Add global type for AI Studio
// Fix: All declarations of 'aistudio' must have identical modifiers.
// Simplified and made optional to align with guarded usage and environment-injected properties.
declare global {
  interface Window {
    aistudio?: {
      hasSelectedApiKey: () => Promise<boolean>;
      openSelectKey: () => Promise<void>;
    };
  }
}

interface CampaignHubProps {
  customers: Customer[];
  products: Product[];
  whatsappConfig: WhatsAppConfig;
  gmailConfig: GmailConfig;
  currentUser: UserType;
  onCampaignFinished: (record: CampaignRecord) => void;
}

const CampaignHub: React.FC<CampaignHubProps> = ({ customers, products, whatsappConfig, gmailConfig, currentUser, onCampaignFinished }) => {
  const [logs, setLogs] = useState<CampaignStep[]>([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [completedMessages, setCompletedMessages] = useState<number>(0);
  const [failedMessages, setFailedMessages] = useState<number>(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>('WhatsApp');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);
  const [generationError, setGenerationError] = useState<string | null>(null);

  const PROTECTION_LIMIT = 1000;

  useEffect(() => {
    const checkKey = async () => {
      if (window.aistudio) {
        const hasKey = await window.aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    if (window.aistudio) {
      await window.aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const addLog = (agent: CampaignStep['agent'], message: string, status: CampaignStep['status'] = 'completed') => {
    setLogs(prev => [{ agent, message, status, timestamp: new Date() }, ...prev]);
  };

  const startCampaign = async () => {
    if (window.aistudio) {
      const isKeySelected = await window.aistudio.hasSelectedApiKey();
      if (!isKeySelected) {
        await handleOpenSelectKey();
      }
    }

    setLogs([]);
    setCompletedMessages(0);
    setFailedMessages(0);
    setGenerationError(null);
    setIsCampaignRunning(true);

    try {
      addLog('Manager', `SYSTEM INITIALIZED. Identity: ${currentUser.companyName || 'Enterprise'}. Channel Strategy: ${deliveryChannel}.`, 'processing');
      await new Promise(r => setTimeout(r, 800));

      if (products.length === 0) throw new Error("Mission Queue empty. Select products from Portfolio.");
      if (customers.length === 0) throw new Error("Audience missing. Select recipients from Segments.");
      
      if (deliveryChannel === 'WhatsApp' && !whatsappConfig.accessToken) {
        throw new Error("WhatsApp Gateway not configured.");
      }
      if (deliveryChannel === 'Email' && !gmailConfig.refreshToken) {
        throw new Error("Email (Gmail) Gateway not configured.");
      }

      const targetList = customers.slice(0, PROTECTION_LIMIT);
      addLog('Manager', `Target Validation: ${targetList.length} recipients locked.`, 'completed');

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const productNum = i + 1;
        setCurrentProductIndex(productNum);

        if (currentUser.autoScheduleDaily && i > 0) {
          addLog('Manager', `SCHEDULING: Sequence [${product.name}] queued for T+${i} days automation.`, 'pending');
          onCampaignFinished({
            id: `c-sched-${Date.now()}-${i}`,
            timestamp: new Date(),
            productName: product.name,
            totalRecords: 0,
            successCount: 0,
            failureCount: 0,
            adCopy: "",
            channel: deliveryChannel,
            imageUrl: undefined
          });
          continue; 
        }

        addLog('Manager', `--- INITIATING PHASE ${productNum}: [${product.name}] ---`, 'processing');
        await new Promise(r => setTimeout(r, 400));

        // 1. Creative Agent Delegation
        addLog('Manager', `[DELEGATION] -> Creative Agent: Synthesize ad copy and visual assets for "${product.name}".`, 'processing');
        await new Promise(r => setTimeout(r, 600));

        addLog('Creative Agent', `Formulating visual identity and high-conversion copy...`, 'processing');
        
        let adCopy = "";
        let adImage = undefined;
        
        try {
          adCopy = await generateAdCopy(product, currentUser.companyName);
          adImage = await generateProductImage(product, currentUser.companyName);
          setActiveProduct({ ...product, ad_copy: adCopy, image_url: adImage });
          addLog('Creative Agent', `Campaign assets finalized. Reporting success to Manager.`, 'completed');
        } catch (creativeErr: any) {
          const errMsg = creativeErr.message || "Creative synthesis failed.";
          setGenerationError(errMsg);
          addLog('Creative Agent', `Error: ${errMsg}`, 'error');
          // Don't throw, allow campaign to attempt copy-only if possible or stop
          if (!adCopy) throw creativeErr;
        }

        await new Promise(r => setTimeout(r, 600));

        // 2. Delivery Orchestration
        const targetAgent = deliveryChannel === 'WhatsApp' ? 'WhatsApp Agent' : 'Email Agent';
        addLog('Manager', `Assets approved. [DELEGATION] -> ${targetAgent}: Execute dispatch sequence via ${deliveryChannel} API.`, 'processing');
        await new Promise(r => setTimeout(r, 600));

        let successCount = 0;
        let failureCount = 0;
        const errorsEncountered = new Set<string>();

        addLog(targetAgent, `Connection to ${deliveryChannel} Cloud Gateway established. Starting batch processing...`, 'processing');

        for (const customer of targetList) {
          const personalizedMsg = await personalizeMessage(adCopy, customer);
          let result;
          
          if (deliveryChannel === 'WhatsApp') {
            result = await sendWhatsAppMessage(whatsappConfig, customer.mobile_number, personalizedMsg);
          } else {
            result = await sendEmailMessage(gmailConfig, customer.email, `Exclusive: ${product.name}`, personalizedMsg);
          }

          if (result.success) {
            successCount++;
            setCompletedMessages(prev => prev + 1);
          } else {
            failureCount++;
            setFailedMessages(prev => prev + 1);
            if (result.error) {
              errorsEncountered.add(result.error);
              if (result.error.toLowerCase().includes("permission denied") || result.error.includes("Requested entity was not found")) {
                setHasApiKey(false);
              }
            }
          }
          await new Promise(r => setTimeout(r, 250)); 
        }

        addLog(targetAgent, `Batch dispatch finalized. Success: ${successCount}, Failed: ${failureCount}. Reporting to Manager.`, 'completed');
        await new Promise(r => setTimeout(r, 600));

        onCampaignFinished({
          id: `c-${Date.now()}-${i}`,
          timestamp: new Date(),
          productName: product.name,
          totalRecords: targetList.length,
          successCount,
          failureCount,
          adCopy,
          imageUrl: adImage,
          channel: deliveryChannel,
          failureReasons: Array.from(errorsEncountered)
        });

        if (i < products.length - 1 && !currentUser.autoScheduleDaily) {
          addLog('Manager', 'Phase locked. System cooling down for next phase...', 'processing');
          await new Promise(r => setTimeout(r, 1200));
        }
      }

      addLog('Manager', `ALL DELEGATED MISSIONS EXECUTED SUCCESSFULLY. Standing by.`, 'completed');

    } catch (err: any) {
      addLog('Manager', `FATAL SYSTEM ERROR: ${err.message}`, 'error');
    } finally {
      setIsCampaignRunning(false);
      setCurrentProductIndex(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        {/* API Key Banner */}
        {!hasApiKey && (
          <div className="bg-indigo-600 p-4 rounded-xl border border-indigo-500 shadow-lg text-white animate-in slide-in-from-top-4">
            <div className="flex gap-3 items-start">
              <Key className="shrink-0 mt-0.5" size={18} />
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider">Cloud Access Required</p>
                <p className="text-[10px] text-indigo-100 leading-tight">
                  The selected API key may have expired or lacks permissions for high-performance generative models.
                </p>
                <div className="flex flex-col gap-2 pt-1">
                  <button 
                    onClick={handleOpenSelectKey}
                    className="w-full py-1.5 bg-white text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-50 transition-colors"
                  >
                    Refresh API Key
                  </button>
                  <a 
                    href="https://ai.google.dev/gemini-api/docs/billing" 
                    target="_blank" 
                    rel="noreferrer" 
                    className="text-[9px] text-indigo-200 underline text-center"
                  >
                    Billing & Quotas
                  </a>
                </div>
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
               <span className="text-[10px] font-bold text-emerald-600 uppercase">Agents Online</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block">Deployment Channel</label>
              <div className="grid grid-cols-2 gap-2">
                <button 
                  onClick={() => setDeliveryChannel('WhatsApp')}
                  disabled={isCampaignRunning}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                    deliveryChannel === 'WhatsApp' 
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-700 ring-2 ring-emerald-500/10' 
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button 
                  onClick={() => setDeliveryChannel('Email')}
                  disabled={isCampaignRunning}
                  className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${
                    deliveryChannel === 'Email' 
                      ? 'bg-rose-50 border-rose-200 text-rose-700 ring-2 ring-rose-500/10' 
                      : 'bg-white border-slate-200 text-slate-400 hover:bg-slate-50'
                  }`}
                >
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
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${
              isCampaignRunning 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none'
                : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100 active:scale-95'
            }`}
          >
            {isCampaignRunning ? (
              <><Loader2 className="animate-spin" size={20} /> Phase {currentProductIndex} / {products.length}</>
            ) : (
              <><Play size={20} fill="currentColor" /> Initiate Mission</>
            )}
          </button>
        </div>

        {activeProduct && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in slide-in-from-bottom-4">
             <div className="flex items-center gap-2 mb-4 border-b pb-3">
               <ImageIcon size={16} className="text-emerald-600" />
               <h3 className="text-sm font-bold text-slate-800 truncate">Agent Output: {activeProduct.name}</h3>
             </div>
             {activeProduct.image_url ? (
               <img src={activeProduct.image_url} alt="Ad" className="w-full h-32 object-cover rounded-md mb-3 border border-slate-100 shadow-sm" />
             ) : (
               <div className={`w-full h-32 rounded-md mb-3 border border-dashed flex items-center justify-center flex-col gap-2 p-4 text-center ${generationError ? 'bg-rose-50 border-rose-200' : 'bg-slate-50 border-slate-200'}`}>
                  {generationError ? (
                    <>
                      <XCircle className="text-rose-400" size={24} />
                      <span className="text-[10px] text-rose-600 uppercase font-black tracking-tight leading-tight">
                        {generationError}
                      </span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="text-slate-300" size={24} />
                      <span className="text-[10px] text-slate-400 uppercase font-bold tracking-tighter">Visual Generation Restricted</span>
                    </>
                  )}
               </div>
             )}
             <div className="text-[11px] text-slate-600 font-medium italic bg-slate-50 p-3 rounded border border-slate-100 max-h-40 overflow-y-auto leading-relaxed">
               {activeProduct.ad_copy}
             </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="bg-slate-900 rounded-xl p-6 h-[600px] shadow-2xl flex flex-col border border-slate-800">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
             <h2 className="text-slate-500 font-mono text-[10px] tracking-widest uppercase flex items-center gap-2">
               <div className={`w-1.5 h-1.5 rounded-full ${isCampaignRunning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`}></div>
               MULTI_AGENT_ORCHESTRATOR_CONSOLE
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
               <div className="h-full flex flex-col items-center justify-center text-slate-700 font-mono text-xs italic text-center px-8">
                 <ShieldCheck className="opacity-10 mb-2" size={32} />
                 MANAGER: Standing by for operation launch. Ensure API Gateways are linked for live dispatch.
               </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`p-3 rounded border flex gap-3 transition-all animate-in slide-in-from-left-2 ${
                log.status === 'error' ? 'bg-rose-950/20 border-rose-900/40' :
                log.agent === 'Manager' ? 'bg-indigo-950/20 border-indigo-900/40' : 
                log.agent === 'Creative Agent' ? 'bg-emerald-950/20 border-emerald-900/40' :
                log.agent === 'WhatsApp Agent' ? 'bg-teal-950/20 border-teal-900/40' :
                'bg-rose-950/20 border-rose-900/40' // Email Agent
              }`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      log.agent === 'Manager' ? 'text-indigo-400' : 
                      log.agent === 'Creative Agent' ? 'text-emerald-400' :
                      log.agent === 'WhatsApp Agent' ? 'text-teal-400' : 'text-rose-400'
                    }`}>{log.agent}</span>
                    <span className="text-[8px] text-slate-600 font-mono italic">[{log.timestamp.toLocaleTimeString()}]</span>
                  </div>
                  <p className={`text-[11px] font-mono leading-relaxed ${log.status === 'error' ? 'text-rose-300' : 'text-slate-300'}`}>
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
