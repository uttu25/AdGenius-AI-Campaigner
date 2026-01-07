import { Play, Loader2, ShieldAlert, Users, Package, MessageCircle, ShieldCheck, Mail, Image as ImageIcon, Key, Layout, CheckCircle2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { generateAdCopy, generateProductImage, personalizeMessage } from '../services/geminiService.ts';
import { sendEmailMessage } from '../services/gmailService.ts';
import { sendWhatsAppMessage } from '../services/whatsappService.ts';
import { CampaignRecord, CampaignStep, Customer, DeliveryChannel, GmailConfig, Product, User as UserType, WhatsAppConfig } from '../types.ts';

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
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [completedMessages, setCompletedMessages] = useState<number>(0);
  const [failedMessages, setFailedMessages] = useState<number>(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);
  const [deliveryChannel, setDeliveryChannel] = useState<DeliveryChannel>('WhatsApp');
  const [hasApiKey, setHasApiKey] = useState<boolean>(true);

  const PROTECTION_LIMIT = 1000;

  useEffect(() => {
    const checkKey = async () => {
      const aistudio = (window as any).aistudio;
      if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
        const hasKey = await aistudio.hasSelectedApiKey();
        setHasApiKey(hasKey);
      }
    };
    checkKey();
  }, []);

  const handleOpenSelectKey = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.openSelectKey === 'function') {
      await aistudio.openSelectKey();
      setHasApiKey(true);
    }
  };

  const addLog = (agent: CampaignStep['agent'], message: string, status: CampaignStep['status'] = 'completed') => {
    setLogs(prev => [{ agent, message, status, timestamp: new Date() }, ...prev]);
  };

  const startCampaign = async () => {
    const aistudio = (window as any).aistudio;
    if (aistudio && typeof aistudio.hasSelectedApiKey === 'function') {
      const isKeySelected = await aistudio.hasSelectedApiKey();
      if (!isKeySelected) await handleOpenSelectKey();
    }

    setLogs([]);
    setCompletedMessages(0);
    setFailedMessages(0);
    setIsCampaignRunning(true);

    try {
      addLog('Manager', `SYSTEM INITIALIZED. Strategy: ${deliveryChannel}.`, 'processing');
      await new Promise(r => setTimeout(r, 600));

      if (products.length === 0) throw new Error("Mission Queue empty. Select products from Portfolio.");
      if (customers.length === 0) throw new Error("Audience missing. Select recipients from Segments.");
      
      if (deliveryChannel === 'WhatsApp' && !whatsappConfig.accessToken) throw new Error("WhatsApp Gateway not configured.");
      if (deliveryChannel === 'Email' && !gmailConfig.refreshToken) throw new Error("Email Gateway not configured.");

      const targetList = customers.slice(0, PROTECTION_LIMIT);
      addLog('Manager', `Target Validation: ${targetList.length} recipients locked.`, 'completed');

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const productNum = i + 1;
        setCurrentProductIndex(productNum);

        addLog('Manager', `--- INITIATING PHASE ${productNum}: [${product.name}] ---`, 'processing');
        
        // 1. Creative Agent Delegation
        addLog('Creative Agent', `Generating professional product visual and marketing copy...`, 'processing');
        const [adCopy, adImage] = await Promise.all([
          generateAdCopy(product, currentUser.companyName),
          generateProductImage(product, currentUser.companyName)
        ]);
        
        setActiveProduct({ ...product, ad_copy: adCopy });
        setGeneratedImageUrl(adImage);
        addLog('Creative Agent', `Assets synchronized.`, 'completed');
        await new Promise(r => setTimeout(r, 400));

        // 2. Delivery Orchestration
        const targetAgent = deliveryChannel === 'WhatsApp' ? 'WhatsApp Agent' : 'Email Agent';
        
        let successCount = 0;
        let failureCount = 0;
        let skipCount = 0;
        const errorsEncountered = new Set<string>();

        addLog(targetAgent, `Starting batch processing for ${targetList.length} recipients...`, 'processing');

        for (const customer of targetList) {
          const optInField = deliveryChannel === 'WhatsApp' ? customer.whatsapp_opt_in : customer.gmail_opt_in;
          if (optInField !== 'Y') {
            skipCount++;
            continue; 
          }

          // Generate personalized message
          const personalizedMsg = await personalizeMessage(adCopy, customer);
          let result;
          
          if (deliveryChannel === 'WhatsApp') {
            // SAFETY FIX: Increased delay to 2 seconds to prevent ban
            await new Promise(r => setTimeout(r, 2000)); 
            
            // NOTE: We try to send as Template (True) for cold outreach feasibility
            result = await sendWhatsAppMessage(whatsappConfig, customer.mobile_number, personalizedMsg, true);
          } else {
            await new Promise(r => setTimeout(r, 500)); // Email can be faster
            result = await sendEmailMessage(gmailConfig, customer.email, `Exclusive: ${product.name}`, personalizedMsg);
          }

          if (result.success) {
            successCount++;
            setCompletedMessages(prev => prev + 1);
          } else {
            failureCount++;
            setFailedMessages(prev => prev + 1);
            if (result.error) errorsEncountered.add(result.error);
          }
        }

        if (skipCount > 0) addLog(targetAgent, `Skipped ${skipCount} (No Opt-in).`, 'completed');
        addLog(targetAgent, `Batch dispatch finalized. Success: ${successCount}, Failed: ${failureCount}.`, 'completed');

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
      }

      addLog('Manager', `ALL DELEGATED MISSIONS EXECUTED.`, 'completed');

    } catch (err: any) {
      if (err.message && err.message.includes("Requested entity was not found")) {
        setHasApiKey(false);
        await handleOpenSelectKey();
      }
      addLog('Manager', `SYSTEM ERROR: ${err.message}`, 'error');
    } finally {
      setIsCampaignRunning(false);
      setCurrentProductIndex(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        {!hasApiKey && (
          <div className="bg-indigo-600 p-4 rounded-xl border border-indigo-500 shadow-lg text-white">
            <div className="flex gap-3 items-start">
              <Key className="shrink-0 mt-0.5" size={18} />
              <div className="space-y-2">
                <p className="text-xs font-bold uppercase tracking-wider">Cloud Access Required</p>
                <button onClick={handleOpenSelectKey} className="w-full mt-2 py-1.5 bg-white text-indigo-600 rounded-lg text-[10px] font-black uppercase hover:bg-indigo-50 transition-colors">Select API Key</button>
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
                <button onClick={() => setDeliveryChannel('WhatsApp')} disabled={isCampaignRunning} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${deliveryChannel === 'WhatsApp' ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                  <MessageCircle size={14} /> WhatsApp
                </button>
                <button onClick={() => setDeliveryChannel('Email')} disabled={isCampaignRunning} className={`flex items-center justify-center gap-2 py-2.5 rounded-lg border text-xs font-bold transition-all ${deliveryChannel === 'Email' ? 'bg-rose-50 border-rose-200 text-rose-700' : 'bg-white border-slate-200 text-slate-400'}`}>
                  <Mail size={14} /> Email
                </button>
              </div>
            </div>
          </div>

          <button
            onClick={startCampaign}
            disabled={isCampaignRunning}
            className={`w-full py-4 rounded-xl font-bold flex items-center justify-center gap-3 transition-all shadow-lg ${isCampaignRunning ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
          >
            {isCampaignRunning ? <><Loader2 className="animate-spin" size={20} /> Phase {currentProductIndex} / {products.length}</> : <><Play size={20} fill="currentColor" /> Initiate Mission</>}
          </button>
        </div>

        {activeProduct && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-4">
             <div className="flex items-center gap-2 border-b pb-3">
               <Layout size={16} className="text-indigo-600" />
               <h3 className="text-sm font-bold text-slate-800 truncate">Live Output: {activeProduct.name}</h3>
             </div>
             {generatedImageUrl && (
               <div className="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square">
                 <img src={generatedImageUrl} alt="Generated Asset" className="w-full h-full object-cover" />
               </div>
             )}
             <div className="text-[11px] text-slate-700 font-medium bg-slate-50 p-3 rounded border border-slate-100 max-h-40 overflow-y-auto whitespace-pre-wrap">
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
              <div key={i} className={`p-3 rounded border flex gap-3 transition-all ${log.status === 'error' ? 'bg-rose-950/20 border-rose-900/40' : 'bg-slate-800/50 border-slate-700/50'}`}>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${log.agent === 'Manager' ? 'text-indigo-400' : log.agent === 'Creative Agent' ? 'text-emerald-400' : 'text-teal-400'}`}>{log.agent}</span>
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
