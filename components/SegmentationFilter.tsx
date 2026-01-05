
import React from 'react';
import { FilterOptions } from '../types';
import { Filter, MessageCircle, Mail } from 'lucide-react';

interface SegmentationFilterProps {
  filters: FilterOptions;
  setFilters: React.Dispatch<React.SetStateAction<FilterOptions>>;
  cities: string[];
  states: string[];
}

const SegmentationFilter: React.FC<SegmentationFilterProps> = ({ filters, setFilters, cities, states }) => {
  const toggleSex = (sex: string) => {
    setFilters(prev => ({
      ...prev,
      sex: prev.sex.includes(sex) 
        ? prev.sex.filter(s => s !== sex)
        : [...prev.sex, sex]
    }));
  };

  return (
    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Filter size={18} className="text-indigo-600" />
        <h2 className="text-md font-bold text-slate-800">Target Segmentation</h2>
        {(filters.city || filters.state || filters.sex.length > 0 || filters.whatsappOptIn || filters.gmailOptIn) && (
          <button 
            onClick={() => setFilters({
              ageRange: [0, 100],
              sex: [],
              city: '',
              state: '',
              whatsappOptIn: '',
              gmailOptIn: ''
            })}
            className="ml-auto text-xs font-bold text-indigo-500 hover:text-indigo-700 underline"
          >
            Reset Filters
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Age Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Age Range</label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={filters.ageRange[0]}
              onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [parseInt(e.target.value) || 0, prev.ageRange[1]] }))}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Min"
            />
            <span className="text-slate-400">-</span>
            <input
              type="number"
              value={filters.ageRange[1]}
              onChange={(e) => setFilters(prev => ({ ...prev, ageRange: [prev.ageRange[0], parseInt(e.target.value) || 100] }))}
              className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Max"
            />
          </div>
        </div>

        {/* Sex Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Gender</label>
          <div className="flex gap-2">
            {['Male', 'Female', 'Other'].map(sex => (
              <button
                key={sex}
                onClick={() => toggleSex(sex)}
                className={`px-3 py-1.5 text-xs rounded border transition-all ${
                  filters.sex.includes(sex)
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-white text-slate-500 border-slate-200 hover:border-slate-300'
                }`}
              >
                {sex}
              </button>
            ))}
          </div>
        </div>

        {/* City Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">City</label>
          <select
            value={filters.city}
            onChange={(e) => setFilters(prev => ({ ...prev, city: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All Cities</option>
            {cities.map(city => <option key={city} value={city}>{city}</option>)}
          </select>
        </div>

        {/* State Filter */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-slate-500 uppercase tracking-wider">State</label>
          <select
            value={filters.state}
            onChange={(e) => setFilters(prev => ({ ...prev, state: e.target.value }))}
            className="w-full px-3 py-1.5 text-sm border border-slate-200 rounded bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          >
            <option value="">All States</option>
            {states.map(state => <option key={state} value={state}>{state}</option>)}
          </select>
        </div>

        {/* Opt-in Filters */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <MessageCircle size={14} className="text-emerald-500" />
            WhatsApp Opt-in
          </label>
          <select
            value={filters.whatsappOptIn}
            onChange={(e) => setFilters(prev => ({ ...prev, whatsappOptIn: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold text-slate-700"
          >
            <option value="">All Recipient Status</option>
            <option value="Y">Opt-in Only (Y)</option>
            <option value="N">Non Opt-in (N)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            <Mail size={14} className="text-rose-500" />
            Gmail Opt-in
          </label>
          <select
            value={filters.gmailOptIn}
            onChange={(e) => setFilters(prev => ({ ...prev, gmailOptIn: e.target.value }))}
            className="w-full px-3 py-1.5 text-xs border border-slate-200 rounded-lg bg-slate-50 focus:outline-none focus:ring-2 focus:ring-rose-500/20 font-bold text-slate-700"
          >
            <option value="">All Recipient Status</option>
            <option value="Y">Opt-in Only (Y)</option>
            <option value="N">Non Opt-in (N)</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default SegmentationFilter;
