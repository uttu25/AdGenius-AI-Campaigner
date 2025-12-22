
import React from 'react';
import { CampaignRecord } from '../types';
import { History, CheckCircle2, XCircle, Calendar, Package, AlertCircle, Clock, Sparkles, Image as ImageIcon } from 'lucide-react';

interface CampaignHistoryProps {
  history: CampaignRecord[];
}

const CampaignHistory: React.FC<CampaignHistoryProps> = ({ history }) => {
  if (history.length === 0) {
    return (
      <div className="p-12 border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 flex flex-col items-center justify-center text-slate-400">
        <History size={48} className="mb-4 opacity-20" />
        <div className="mb-2 font-medium">No past missions found.</div>
        <div className="text-xs">Execute your first delegated campaign to see history here.</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((record) => {
        const isScheduled = record.totalRecords === 0 && record.successCount === 0;
        
        return (
          <div key={record.id} className={`bg-white border rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow ${isScheduled ? 'border-slate-100 opacity-80' : 'border-slate-200'}`}>
            <div className="flex flex-col md:flex-row justify-between gap-4">
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-slate-800 font-bold text-lg">
                  <Package size={18} className="text-indigo-600" />
                  {record.productName}
                  {isScheduled && (
                    <span className="ml-2 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[10px] rounded flex items-center gap-1">
                      <Clock size={10} /> Scheduled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-slate-500">
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    {record.timestamp.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 font-mono">
                    ID: {record.id.slice(0, 12)}...
                  </div>
                </div>
              </div>

              {!isScheduled && (
                <div className="flex items-center gap-6">
                  <div className="text-center">
                    <div className="text-xs font-semibold text-slate-400 uppercase">Processed</div>
                    <div className="text-xl font-bold text-slate-700">{record.totalRecords}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-emerald-500 uppercase flex items-center gap-1 justify-center">
                      <CheckCircle2 size={12} /> Success
                    </div>
                    <div className="text-xl font-bold text-emerald-600">{record.successCount}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-xs font-semibold text-rose-500 uppercase flex items-center gap-1 justify-center">
                      <XCircle size={12} /> Failed
                    </div>
                    <div className="text-xl font-bold text-rose-600">{record.failureCount}</div>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-4 border-t border-slate-50">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                      <ImageIcon size={12} className="text-indigo-500" /> Generated Product Visual
                    </h4>
                    {record.imageUrl ? (
                      <div className="relative group rounded-xl overflow-hidden border border-slate-100 bg-slate-50 aspect-square max-w-[300px]">
                        <img src={record.imageUrl} alt="Generated Asset" className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="p-3 bg-slate-50 rounded-lg border border-slate-100 border-dashed text-[10px] text-slate-400 italic">
                        No image generated for this mission.
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Campaign Ad Copy</h4>
                    <p className="text-xs text-slate-600 italic whitespace-pre-wrap leading-relaxed line-clamp-8 bg-slate-50 p-4 rounded-xl border border-slate-100">
                      {record.adCopy ? `"${record.adCopy}"` : "Assets pending generation."}
                    </p>
                  </div>

                  {!isScheduled && record.failureCount > 0 && record.failureReasons && record.failureReasons.length > 0 && (
                    <div className="bg-rose-50/50 p-4 rounded-lg border border-rose-100 h-fit">
                      <h4 className="text-[10px] font-bold text-rose-600 uppercase tracking-widest mb-2 flex items-center gap-1">
                        <AlertCircle size={12} /> Mission Incident Report
                      </h4>
                      <ul className="space-y-1.5">
                        {record.failureReasons.map((reason, idx) => (
                          <li key={idx} className="text-[11px] text-rose-800 leading-tight flex gap-2">
                            <span className="shrink-0">•</span>
                            <span>{reason}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default CampaignHistory;
