
export interface Customer {
  id: string;
  name: string;
  mobile_number: string;
  email: string; // Now mandatory
  age: number;
  sex: 'Male' | 'Female' | 'Other';
  city: string;
  state: string;
  whatsapp_opt_in?: string; // Moved from Product
  gmail_opt_in?: string;    // Moved from Product
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
  agent: 'Manager' | 'Creative Agent' | 'WhatsApp Agent' | 'Email Agent';
  message: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  timestamp: Date;
}

export interface FilterOptions {
  ageRange: [number, number];
  sex: string[];
  city: string;
  state: string;
  whatsappOptIn: string; // Added here
  gmailOptIn: string;    // Added here
}

export interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  businessAccountId: string;
}

export interface GmailConfig {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  userEmail: string;
}

export type DeliveryChannel = 'WhatsApp' | 'Email';

export interface CampaignRecord {
  id: string;
  timestamp: Date;
  productName: string;
  totalRecords: number;
  successCount: number;
  failureCount: number;
  adCopy: string;
  imageUrl?: string;
  channel: DeliveryChannel;
  failureReasons?: string[];
}

export interface User {
  email: string;
  name: string;
  isLoggedIn: boolean;
  isGoogleLinked: boolean;
  autoScheduleDaily: boolean;
  logo?: string;
  companyName?: string;
}
