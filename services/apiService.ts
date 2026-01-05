
import { db } from './dbService';
import { Customer, Product, CampaignRecord, User, WhatsAppConfig, GmailConfig } from '../types';

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
    list: () => db.getAll<Customer>('customers'),
    saveBatch: (data: Customer[]) => db.saveBatch('customers', data),
    delete: (id: string) => db.delete('customers', id),
    clear: () => db.clear('customers')
  },
  products: {
    list: () => db.getAll<Product>('products'),
    saveBatch: (data: Product[]) => db.saveBatch('products', data),
    delete: (id: string) => db.delete('products', id),
    clear: () => db.clear('products')
  },
  campaigns: {
    list: () => db.getAll<CampaignRecord>('campaigns'),
    save: (record: CampaignRecord) => db.saveBatch('campaigns', [record]),
    clear: () => db.clear('campaigns')
  }
};
