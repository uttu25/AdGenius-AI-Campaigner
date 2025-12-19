
export interface Customer {
  id: string;
  name: string;
  mobile_number: string;
  email?: string;
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  city: string;
  state: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: string;
  url: string; // Mandatory product link
  image_url?: string;
  ad_copy?: string;
}

export interface CampaignStep {
  agent: 'Manager' | 'Creative Agent' | 'Delivery Agent';
  message: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp: Date;
}

export interface FilterOptions {
  ageRange: [number, number];
  sex: string[];
  city: string;
  state: string;
}

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}

export interface CampaignRecord {
  id: string;
  timestamp: Date;
  productName: string;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  adCopy: string;
  imageUrl?: string;
  channel: 'WhatsApp';
}

export interface User {
  email: string;
  name: string;
  isLoggedIn: boolean;
  isGoogleLinked: boolean;
  autoScheduleDaily: boolean;
  logo?: string; // Company logo base64
  companyName?: string; // Company name field
}
