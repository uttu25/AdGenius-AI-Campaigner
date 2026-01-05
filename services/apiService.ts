
import { db } from './dbService';
import { Customer, Product, CampaignRecord } from '../types';

/**
 * Mock Backend API Service
 * In a production environment, these would be fetch('/api/...') calls.
 * This structure keeps the frontend "backend-ready".
 */
export const api = {
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
