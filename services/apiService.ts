import { Customer, Product, CampaignRecord, User, WhatsAppConfig, GmailConfig } from '../types';
import { db } from './dbService'; 

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const API_URL = `${BASE_URL}/api`;

// Helper to validate responses
const handleResponse = async (res: Response) => {
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`API Error ${res.status}: ${errorText || res.statusText}`);
  }
  return res.json();
};

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
    list: async () => {
      const res = await fetch(`${API_URL}/customers`);
      return handleResponse(res);
    },
    saveBatch: async (data: Customer[]) => {
      const res = await fetch(`${API_URL}/customers/batch`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/customers/${id}`, { method: 'DELETE' });
      return handleResponse(res);
    },
    clear: async () => {
      const res = await fetch(`${API_URL}/customers`, { method: 'DELETE' });
      return handleResponse(res);
    }
  },
  products: {
    list: async () => {
      const res = await fetch(`${API_URL}/products`);
      return handleResponse(res);
    },
    saveBatch: async (data: Product[]) => {
      const res = await fetch(`${API_URL}/products/batch`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(data) 
      });
      return handleResponse(res);
    },
    delete: async (id: string) => {
      const res = await fetch(`${API_URL}/products/${id}`, { method: 'DELETE' });
      return handleResponse(res);
    },
    clear: async () => {
      const res = await fetch(`${API_URL}/products`, { method: 'DELETE' });
      return handleResponse(res);
    }
  },
  campaigns: {
    list: async () => {
      const res = await fetch(`${API_URL}/campaigns`);
      return handleResponse(res);
    },
    save: async (record: CampaignRecord) => {
      const res = await fetch(`${API_URL}/campaigns`, { 
        method: 'POST', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify(record) 
      });
      return handleResponse(res);
    },
    clear: () => Promise.resolve()
  }
};
