import { Customer, Product, CampaignRecord, User, WhatsAppConfig, GmailConfig } from '../types';
import { db } from './dbService'; 

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

export const api = {
  session: {
    get: () => db.getOne<User>('session', 'current'),
    save: (user: User) => db.put('session', { ...user, id: 'current' }),
    clear: () => db.delete('session', 'current')
  },
  settings: {
    getWhatsApp: () => db.getOne<{ value: WhatsAppConfig }>('settings', 'whatsapp'),
    saveWhatsApp: (config: WhatsAppConfig) => db.put('settings', { key: 'whatsapp', value: config }),
    getGmail: () => db.getOne<{ value: GmailConfig }>('settings', 'gmail'),
    saveGmail: (config: GmailConfig) => db.put('settings', { key: 'gmail', value: config })
  },
  customers: {
    list: async () => { const res = await fetch(`${API_URL}/customers`); return res.json(); },
    saveBatch: async (data: Customer[]) => { await fetch(`${API_URL}/customers/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); },
    delete: async (id: string) => { await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' }); },
    clear: async () => { await fetch(`${API_URL}/customers`, { method: 'DELETE' }); }
  },
  products: {
    list: async () => { const res = await fetch(`${API_URL}/products`); return res.json(); },
    saveBatch: async (data: Product[]) => { await fetch(`${API_URL}/products/batch`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); },
    delete: async (id: string) => { await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' }); },
    clear: async () => { await fetch(`${API_URL}/products`, { method: 'DELETE' }); }
  },
  campaigns: {
    list: async () => { const res = await fetch(`${API_URL}/campaigns`); return res.json(); },
    save: async (record: CampaignRecord) => { await fetch(`${API_URL}/campaigns`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }); },
    clear: () => Promise.resolve()
  }
};
