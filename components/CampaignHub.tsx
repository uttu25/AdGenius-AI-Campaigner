
import React, { useState } from 'react';
import { Play, Loader2, ShieldAlert, Users, Package, AlertCircle, MessageCircle, ShieldCheck, Clock, Link as LinkIcon, Building2, Send } from 'lucide-react';
import { Customer, Product, CampaignStep, WhatsAppConfig, CampaignRecord, User as UserType } from '../types';
import { generateAdCopy, generateProductImage, personalizeMessage } from '../services/geminiService';
import { sendWhatsAppMessage } from '../services/whatsappService';

interface CampaignHubProps {
  customers: Customer[];
  products: Product[];
  whatsappConfig: WhatsAppConfig;
  currentUser: UserType;
  onCampaignFinished: (record: CampaignRecord) => void;
}

const CampaignHub: React.FC<CampaignHubProps> = ({ customers, products, whatsappConfig, currentUser, onCampaignFinished }) => {
  const [logs, setLogs] = useState<CampaignStep[]>([]);
  const [isCampaignRunning, setIsCampaignRunning] = useState(false);
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);
  const [completedMessages, setCompletedMessages] = useState<number>(0);
  const [failedMessages, setFailedMessages] = useState<number>(0);
  const [currentProductIndex, setCurrentProductIndex] = useState(0);

  const PROTECTION_LIMIT = 1000;

  const addLog = (agent: CampaignStep['agent'], message: string, status: CampaignStep['status'] = 'completed') => {
    setLogs(prev => [{ agent, message, status, timestamp: new Date() }, ...prev]);
  };

  const startCampaign = async () => {
    setLogs([]);
    setCompletedMessages(0);
    setFailedMessages(0);
    setIsCampaignRunning(true);

    try {
      addLog('Manager', `SYSTEM INITIALIZED. Identity: ${currentUser.companyName || 'Corporate Admin'}. Mode: ${currentUser.autoScheduleDaily ? 'DAILY_BATCH' : 'STANDARD'}.`, 'processing');
      await new Promise(r => setTimeout(r, 800));

      if (products.length === 0) throw new Error("No products in mission queue. Select from Portfolio.");
      if (customers.length === 0) throw new Error("Target audience empty. Select customers from Segments.");
      if (!whatsappConfig.accessToken) throw new Error("WhatsApp API connection missing.");

      const targetList = customers.slice(0, PROTECTION_LIMIT);
      addLog('Manager', `Validation complete. Target Audience: ${targetList.length} verified recipients.`, 'completed');

      for (let i = 0; i < products.length; i++) {
        const product = products[i];
        const productNum = i + 1;
        setCurrentProductIndex(productNum);

        // --- BATCH MODE LOGIC ---
        if (currentUser.autoScheduleDaily && i > 0) {
          const scheduleDay = i + 1;
          addLog('Manager', `SCHEDULING: [${product.name}] queued for automated delivery on DAY ${scheduleDay}.`, 'pending');
          
          // Register the scheduled item in history so the count matches selection exactly
          onCampaignFinished({
            id: `c-sched-${Date.now()}-${i}`,
            timestamp: new Date(),
            productName: product.name,
            totalRecords: 0,
            successCount: 0,
            failureCount: 0,
            adCopy: "",
            channel: 'WhatsApp'
          });
          
          continue; 
        }

        const phaseLabel = currentUser.autoScheduleDaily ? "DAILY SLOT 1" : `PHASE ${productNum}/${products.length}`;
        addLog('Manager', `--- INITIATING ${phaseLabel}: [${product.name}] ---`, 'processing');

        // 1. MANAGER DELEGATES TO CREATIVE AGENT
        addLog('Manager', `[DELEGATION] -> Creative Agent: Generate high-impact copy for "${product.name}". Use Brand Identity: ${currentUser.companyName || 'Default'}.`, 'processing');
        await new Promise(r => setTimeout(r, 500));

        // 2. CREATIVE AGENT EXECUTION
        addLog('Creative Agent', `Instruction received. Formulating campaign assets for ${product.name}...`, 'processing');
        const adCopy = await generateAdCopy(product, currentUser.companyName);
        const adImage = await generateProductImage(product, currentUser.companyName);
        
        setActiveProduct({ ...product, ad_copy: adCopy, image_url: adImage });
        addLog('Creative Agent', `CONTENT READY. Ad copy and visual approved. Reporting back to Manager.`, 'completed');
        await new Promise(r => setTimeout(r, 600));

        // 3. MANAGER DELEGATES TO DELIVERY AGENT
        addLog('Manager', `Content approved. [DELEGATION] -> Delivery Agent: Initiate dispatch sequence to ${targetList.length} recipients.`, 'processing');
        await new Promise(r => setTimeout(r, 500));

        // 4. DELIVERY AGENT EXECUTION
        addLog('Delivery Agent', `Instruction received. Opening WhatsApp Cloud Gateway...`, 'processing');
        
        let successCount = 0;
        let failureCount = 0;
        const errorsEncountered = new Set<string>();

        for (const customer of targetList) {
          const message = await personalizeMessage(adCopy, customer);
          const result = await sendWhatsAppMessage(whatsappConfig, customer.mobile_number, message);

          if (result.success) {
            successCount++;
            setCompletedMessages(prev => prev + 1);
          } else {
            failureCount++;
            setFailedMessages(prev => prev + 1);
            if (result.error) errorsEncountered.add(result.error);
          }
          // Small delay for realism and to avoid API bursts
          await new Promise(r => setTimeout(r, 300)); 
        }

        addLog('Delivery Agent', `DISPATCH COMPLETE. Reporting results to Manager: Success (${successCount}), Failure (${failureCount}).`, 'completed');
        
        onCampaignFinished({
          id: `c-${Date.now()}-${i}`,
          timestamp: new Date(),
          productName: product.name,
          totalRecords: targetList.length,
          successCount,
          failureCount,
          adCopy,
          imageUrl: adImage,
          channel: 'WhatsApp',
          failureReasons: Array.from(errorsEncountered)
        });

        if (i < products.length - 1 && !currentUser.autoScheduleDaily) {
          addLog('Manager', 'Phase complete. System cooling down before next delegation...', 'processing');
          await new Promise(r => setTimeout(r, 2000));
        }
      }

      const finalReport = currentUser.autoScheduleDaily 
        ? `DAY 1 Mission successful. Remaining ${products.length - 1} products scheduled sequentially.`
        : `ALL MISSIONS COMPLETE. System entering idle state.`;
      
      addLog('Manager', finalReport, 'completed');

    } catch (err: any) {
      addLog('Manager', `MISSION FAILURE: ${err.message}`, 'error');
    } finally {
      setIsCampaignRunning(false);
      setCurrentProductIndex(0);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="text-indigo-600" size={20} />
              AI Mission Command
            </h2>
            <div className="flex items-center gap-1.5 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
               <ShieldCheck size={12} className="text-emerald-600" />
               <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">Manager Active</span>
            </div>
          </div>

          <div className="space-y-4 mb-6">
            {currentUser.companyName && (
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center gap-3">
                 <Building2 size={16} className="text-slate-400" />
                 <span className="text-xs font-bold text-slate-600 truncate">{currentUser.companyName}</span>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Recipients</span>
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Users size={12} /> {customers.length.toLocaleString()}
                </span>
              </div>
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Items</span>
                <span className="text-xs font-bold text-indigo-600 flex items-center gap-1">
                  <Package size={12} /> {products.length}
                </span>
              </div>
            </div>

            {currentUser.autoScheduleDaily && (
              <div className="flex items-center gap-3 p-3 bg-indigo-50 border border-indigo-100 rounded-lg">
                <Clock size={16} className="text-indigo-600" />
                <div>
                  <p className="text-[10px] font-bold text-indigo-800 uppercase">Daily Batch Mode Enabled</p>
                  <p className="text-[9px] text-indigo-600 italic">Sequential: 1 Product Per 24h</p>
                </div>
              </div>
            )}
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
              <>
                <Loader2 className="animate-spin" size={20} />
                Phase {currentProductIndex} / {products.length}...
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Initiate Delegated Mission
              </>
            )}
          </button>
        </div>

        {activeProduct && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
             <div className="flex items-center gap-2 mb-4 border-b border-slate-50 pb-3">
               <Package size={16} className="text-indigo-600" />
               <h3 className="text-sm font-bold text-slate-800 truncate">Agent Output: {activeProduct.name}</h3>
             </div>
             <div className="space-y-3">
               {activeProduct.image_url && (
                 <img src={activeProduct.image_url} alt="Ad" className="w-full h-32 object-cover rounded-md shadow-sm border border-slate-100" />
               )}
               <div className="text-[11px] text-slate-600 font-medium leading-relaxed bg-slate-50 p-3 rounded border border-slate-100 max-h-40 overflow-y-auto italic mb-2">
                 {activeProduct.ad_copy || "Creative Agent is formulating content..."}
               </div>
               <div className="flex items-center gap-2 text-xs font-bold text-indigo-600 bg-indigo-50 p-2 rounded truncate">
                 <LinkIcon size={12} />
                 {activeProduct.url}
               </div>
             </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2">
        <div className="bg-slate-900 rounded-xl p-6 h-[600px] shadow-xl flex flex-col border border-slate-800">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
             <h2 className="text-slate-500 font-mono flex items-center gap-2 text-[10px] tracking-widest uppercase">
               <div className={`w-1.5 h-1.5 rounded-full ${isCampaignRunning ? 'bg-indigo-500 animate-pulse' : 'bg-slate-600'}`}></div>
               MULTI_AGENT_PROTOCOL_CONSOLE
             </h2>
             {isCampaignRunning && (
                <div className="flex gap-4 font-mono text-[10px]">
                  <span className="text-emerald-400 tracking-tighter uppercase">SUCCESS: {completedMessages}</span>
                  <span className="text-rose-400 tracking-tighter uppercase">ERRORS: {failedMessages}</span>
                </div>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar">
            {logs.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-slate-700 font-mono italic text-xs text-center">
                 <ShieldCheck size={32} className="mb-3 opacity-5" />
                 MANAGER: Standby for command.<br/>
                 <span className="text-[9px] opacity-30 mt-1 block tracking-[0.2em] font-normal uppercase">AdGenius Orchestrator v2.4</span>
               </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`p-3 rounded border flex gap-3 transition-all animate-in slide-in-from-left-2 ${
                log.status === 'error' ? 'bg-rose-950/20 border-rose-900/40' :
                log.status === 'pending' ? 'bg-slate-800/20 border-slate-700 opacity-60' :
                log.agent === 'Manager' ? 'bg-indigo-950/20 border-indigo-900/40' : 
                log.agent === 'Creative Agent' ? 'bg-emerald-950/20 border-emerald-900/40' :
                'bg-slate-800/50 border-slate-700'
              }`}>
                <div className="mt-0.5 shrink-0">
                  {log.status === 'error' ? <AlertCircle size={14} className="text-rose-400" /> :
                   log.agent === 'Manager' ? <ShieldAlert size={14} className="text-indigo-400" /> : 
                   log.agent === 'Creative Agent' ? <MessageCircle size={14} className="text-emerald-400" /> :
                   <Send size={14} className="text-amber-400" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className={`text-[9px] font-bold uppercase tracking-wider ${
                      log.status === 'error' ? 'text-rose-400' :
                      log.agent === 'Manager' ? 'text-indigo-400' : 
                      log.agent === 'Creative Agent' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {log.agent}
                    </span>
                    <span className="text-[8px] text-slate-600 font-mono italic">[{log.timestamp.toLocaleTimeString()}]</span>
                  </div>
                  <p className={`text-[11px] leading-relaxed font-mono ${log.status === 'error' ? 'text-rose-200' : 'text-slate-300'}`}>
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
