
import React, { useState } from 'react';
import { Play, Loader2, ShieldAlert, Users, Package, AlertCircle, MessageCircle, ShieldCheck } from 'lucide-react';
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

  const PROTECTION_LIMIT = 300;

  const addLog = (agent: CampaignStep['agent'], message: string, status: CampaignStep['status'] = 'completed') => {
    setLogs(prev => [{ agent, message, status, timestamp: new Date() }, ...prev]);
  };

  const startCampaign = async () => {
    // Clear previous logs
    setLogs([]);
    setCompletedMessages(0);
    setFailedMessages(0);

    // Initial Manager Validation
    if (products.length === 0) {
      addLog('Manager', 'ABORTED: No products selected. Please go to the "Products" tab and use the checkboxes to select at least one item.', 'error');
      return;
    }

    if (customers.length === 0) {
      addLog('Manager', 'ABORTED: No customers selected. Please go to the "Customers" tab and use the checkboxes or filters to select target recipients.', 'error');
      return;
    }

    if (!whatsappConfig.accessToken || !whatsappConfig.phoneNumberId) {
      addLog('Manager', 'ABORTED: WhatsApp API credentials missing. Please configure them in "WhatsApp API" settings.', 'error');
      return;
    }

    // Protection Logic
    const targetCustomers = customers.slice(0, PROTECTION_LIMIT);
    const isTruncated = customers.length > PROTECTION_LIMIT;

    if (isTruncated && !confirm(`Account Protection: You have ${customers.length} selected customers. To maintain account health, this batch is capped at ${PROTECTION_LIMIT}. Proceed?`)) {
      addLog('Manager', 'Operation cancelled by user due to protection limit.', 'error');
      return;
    }

    setIsCampaignRunning(true);
    const productToPromote = products[0]; 
    setActiveProduct(productToPromote);

    try {
      addLog('Manager', `Orchestration started. Product: ${productToPromote.name}. Target Count: ${targetCustomers.length}.`, 'processing');
      await new Promise(r => setTimeout(r, 800));

      addLog('Creative Agent', `Accessing Gemini 3 Flash. Generating ad copy for ${productToPromote.name}...`, 'processing');
      const adCopy = await generateAdCopy(productToPromote);
      
      addLog('Creative Agent', `Rendering visual assets with Gemini Flash Image...`, 'processing');
      const adImage = await generateProductImage(productToPromote);
      
      const updatedProduct = { ...productToPromote, ad_copy: adCopy, image_url: adImage };
      setActiveProduct(updatedProduct);

      addLog('Creative Agent', `Creative pack finalized. Transferring to Delivery Agent.`);
      await new Promise(r => setTimeout(r, 1000));

      addLog('Delivery Agent', `Establishing secure connection to WhatsApp Cloud API...`, 'processing');
      await new Promise(r => setTimeout(r, 800));

      addLog('Delivery Agent', `Beginning sequential dispatch to ${targetCustomers.length} mobile numbers.`, 'processing');
      
      let localSuccess = 0;
      let localFailed = 0;

      for (let i = 0; i < targetCustomers.length; i++) {
        const customer = targetCustomers[i];
        const personalizedMsg = await personalizeMessage(adCopy, customer);
        
        const result = await sendWhatsAppMessage(whatsappConfig, customer.mobile_number, personalizedMsg);

        if (result.success) {
          localSuccess++;
          setCompletedMessages(localSuccess);
        } else {
          localFailed++;
          setFailedMessages(localFailed);
          addLog('Delivery Agent', `Failed [${customer.name}]: ${result.error}`, 'error');
        }
        
        // Artificial delay to prevent API rate limiting
        await new Promise(r => setTimeout(r, 400));
      }

      addLog('Delivery Agent', `Dispatch cycle complete. Successfully delivered ${localSuccess} messages.`);
      await new Promise(r => setTimeout(r, 500));

      addLog('Manager', `Campaign operational cycle finished. Logging results.`, 'completed');

      onCampaignFinished({
        id: `campaign-${Date.now()}`,
        timestamp: new Date(),
        productName: productToPromote.name,
        totalRecords: targetCustomers.length,
        successCount: localSuccess,
        failureCount: localFailed,
        adCopy: adCopy,
        imageUrl: adImage,
        channel: 'WhatsApp'
      });

    } catch (error: any) {
      addLog('Manager', `SYSTEM FAILURE: ${error.message || 'Unknown error during AI generation'}`, 'error');
      console.error(error);
    } finally {
      setIsCampaignRunning(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <ShieldAlert className="text-indigo-600" size={20} />
              Command Center
            </h2>
            <div className="flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-100">
               <ShieldCheck size={12} className="text-emerald-600" />
               <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-tight">System Ready</span>
            </div>
          </div>

          <div className="mb-6 p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
            <label className="text-xs font-bold text-indigo-700 uppercase mb-3 block">Channel Strategy</label>
            <div className="flex items-center gap-3 text-indigo-900">
               <div className="p-2 bg-white rounded-lg shadow-sm border border-indigo-200">
                  <MessageCircle size={20} className="text-emerald-500" />
               </div>
               <div>
                 <p className="text-sm font-bold">WhatsApp Direct</p>
                 <p className="text-[10px] text-indigo-600 opacity-70 italic font-medium">Meta Cloud API Priority</p>
               </div>
            </div>
          </div>

          <div className="mb-6 p-3 bg-amber-50 border border-amber-100 rounded-lg">
             <div className="flex items-center gap-2 mb-1">
                <AlertCircle size={14} className="text-amber-500" />
                <span className="text-[10px] font-bold text-amber-700 uppercase">Protection Threshold</span>
             </div>
             <p className="text-[11px] text-amber-600 leading-tight">
               Spam protection is active. Batches are limited to <strong>{PROTECTION_LIMIT}</strong> targets per operation.
             </p>
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
                AI Agents Working...
              </>
            ) : (
              <>
                <Play size={20} fill="currentColor" />
                Launch AI Campaign
              </>
            )}
          </button>
        </div>

        {activeProduct && activeProduct.ad_copy && (
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
             <h3 className="text-sm font-semibold text-slate-500 mb-4 uppercase tracking-wider">Ad Creative Pack</h3>
             <div className="border border-slate-100 rounded-lg p-4 bg-slate-50">
               {activeProduct.image_url && (
                 <img src={activeProduct.image_url} alt="Generated Ad" className="w-full h-48 object-cover rounded-md mb-4 shadow-sm border border-white" />
               )}
               <div className="whitespace-pre-wrap text-sm text-slate-700 font-medium leading-relaxed bg-white p-3 rounded-lg border border-slate-100">
                 {activeProduct.ad_copy}
               </div>
             </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 rounded-xl p-6 min-h-[600px] shadow-xl flex flex-col border border-slate-800">
          <div className="flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
             <h2 className="text-white font-mono flex items-center gap-2 text-sm">
               <div className={`w-2 h-2 rounded-full ${isCampaignRunning ? 'bg-green-500 animate-pulse' : 'bg-slate-600'}`}></div>
               MULTI_AGENT_ORCHESTRATOR_V3
             </h2>
             {isCampaignRunning && (
                <div className="flex gap-4">
                  <div className="text-emerald-400 text-xs font-mono">SENT: {completedMessages}</div>
                  <div className="text-rose-400 text-xs font-mono">ERR: {failedMessages}</div>
                </div>
             )}
          </div>
          
          <div className="flex-1 overflow-y-auto space-y-4 max-h-[500px] pr-2 custom-scrollbar">
            {logs.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-slate-500 font-mono italic text-sm text-center">
                 <ShieldCheck size={40} className="mb-4 opacity-20" />
                 Awaiting deployment command.<br/>
                 <span className="text-[10px] opacity-60 mt-2 block uppercase tracking-widest font-normal">Secure Multi-Channel Protocol Active</span>
               </div>
            )}
            {logs.map((log, i) => (
              <div key={i} className={`p-4 rounded-lg border flex gap-4 transition-all duration-300 animate-in slide-in-from-left-2 ${
                log.status === 'error' ? 'bg-rose-950/20 border-rose-900/50' :
                log.agent === 'Manager' ? 'bg-indigo-950/30 border-indigo-900/50' : 
                log.agent === 'Creative Agent' ? 'bg-emerald-950/30 border-emerald-900/50' :
                'bg-slate-800 border-slate-700'
              }`}>
                <div className="flex-shrink-0">
                  {log.status === 'error' ? <AlertCircle className="text-rose-400" /> :
                   log.agent === 'Manager' ? <ShieldAlert className="text-indigo-400" /> : 
                   log.agent === 'Creative Agent' ? <Package className="text-emerald-400" /> :
                   <Users className="text-amber-400" />}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className={`text-xs font-bold uppercase tracking-tighter ${
                      log.status === 'error' ? 'text-rose-400' :
                      log.agent === 'Manager' ? 'text-indigo-400' : 
                      log.agent === 'Creative Agent' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {log.agent}
                    </span>
                    <span className="text-[10px] text-slate-500">{log.timestamp.toLocaleTimeString()}</span>
                  </div>
                  <p className={`text-sm leading-relaxed font-mono ${log.status === 'error' ? 'text-rose-200' : 'text-slate-300'}`}>
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
