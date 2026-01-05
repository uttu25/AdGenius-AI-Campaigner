#!/bin/bash

echo "🚀 Starting Full Stack Upgrade..."

# --- 1. Create Backend Structure ---
echo "📂 Creating server directory..."
mkdir -p server/models

# Create server/package.json
echo "📝 Creating server/package.json..."
cat > server/package.json <<EOL
{
  "name": "adgenius-backend",
  "version": "1.0.0",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "dev": "nodemon index.js"
  },
  "dependencies": {
    "cors": "^2.8.5",
    "dotenv": "^16.3.1",
    "express": "^4.18.2",
    "googleapis": "^126.0.1",
    "mongoose": "^7.5.0",
    "nodemailer": "^6.9.4"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
EOL

# Create server/models/Schemas.js
echo "📝 Creating Database Models..."
cat > server/models/Schemas.js <<EOL
const mongoose = require('mongoose');

const CustomerSchema = new mongoose.Schema({
  name: String,
  mobile_number: String,
  email: String,
  age: Number,
  sex: String,
  city: String,
  state: String,
  whatsapp_opt_in: String,
  gmail_opt_in: String
});

const ProductSchema = new mongoose.Schema({
  name: String,
  description: String,
  price: String,
  url: String,
  image_url: String,
  ad_copy: String
});

const CampaignSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  productName: String,
  totalRecords: Number,
  successCount: Number,
  failureCount: Number,
  adCopy: String,
  imageUrl: String,
  channel: String,
  failureReasons: [String]
});

module.exports = {
  Customer: mongoose.model('Customer', CustomerSchema),
  Product: mongoose.model('Product', ProductSchema),
  Campaign: mongoose.model('Campaign', CampaignSchema)
};
EOL

# Create server/index.js
echo "📝 Creating Server Entry Point..."
cat > server/index.js <<EOL
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { google } = require('googleapis');
const { Customer, Product, Campaign } = require('./models/Schemas');

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB Connection Error:', err));

app.post('/api/auth/google/refresh', async (req, res) => {
  const { clientId, clientSecret, refreshToken } = req.body;
  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({ refresh_token: refreshToken });
  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    res.json({ access_token: credentials.access_token });
  } catch (error) {
    console.error("Token Refresh Error:", error);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

// Customers
app.get('/api/customers', async (req, res) => { const customers = await Customer.find(); res.json(customers); });
app.post('/api/customers/batch', async (req, res) => { await Customer.insertMany(req.body); res.json({ success: true }); });
app.delete('/api/customers/:id', async (req, res) => { await Customer.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.delete('/api/customers', async (req, res) => { await Customer.deleteMany({}); res.json({ success: true }); });

// Products
app.get('/api/products', async (req, res) => { const products = await Product.find(); res.json(products); });
app.post('/api/products/batch', async (req, res) => { await Product.insertMany(req.body); res.json({ success: true }); });
app.delete('/api/products/:id', async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.delete('/api/products', async (req, res) => { await Product.deleteMany({}); res.json({ success: true }); });

// Campaigns
app.get('/api/campaigns', async (req, res) => { const campaigns = await Campaign.find().sort({ timestamp: -1 }); res.json(campaigns); });
app.post('/api/campaigns', async (req, res) => { const newCampaign = new Campaign(req.body); await newCampaign.save(); res.json(newCampaign); });

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(\`Server running on port \${PORT}\`));
EOL

# --- 2. Update Frontend Files ---

echo "🔄 Updating services/gmailService.ts..."
cat > services/gmailService.ts <<EOL
import { GmailConfig } from "../types";

const base64UrlEncode = (str: string): string => {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
};

const getAccessToken = async (config: GmailConfig): Promise<string> => {
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';
  const response = await fetch(\`\${API_URL}/api/auth/google/refresh\`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      clientId: config.clientId,
      clientSecret: config.clientSecret,
      refreshToken: config.refreshToken,
    }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || "Token Refresh Failed");
  return data.access_token;
};

export const sendEmailMessage = async (
  config: GmailConfig,
  to: string,
  subject: string,
  body: string
): Promise<{ success: boolean; error?: string }> => {
  if (!config.clientId || !config.refreshToken) return { success: false, error: "Gateway credentials missing." };
  try {
    const accessToken = await getAccessToken(config);
    const emailLines = [
      \`From: \${config.userEmail}\`,
      \`To: \${to}\`,
      \`Subject: \${subject}\`,
      'Content-Type: text/plain; charset="UTF-8"',
      '',
      body,
    ];
    const rawMessage = base64UrlEncode(emailLines.join('\r\n'));
    const response = await fetch(
      'https://gmail.googleapis.com/gmail/v1/users/me/messages/send',
      {
        method: 'POST',
        headers: { 'Authorization': \`Bearer \${accessToken}\`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ raw: rawMessage }),
      }
    );
    if (!response.ok) return { success: false, error: "Gmail Dispatch Failed" };
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};
EOL

echo "🔄 Updating services/apiService.ts..."
cat > services/apiService.ts <<EOL
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
    list: async () => { const res = await fetch(\`\${API_URL}/customers\`); return res.json(); },
    saveBatch: async (data: Customer[]) => { await fetch(\`\${API_URL}/customers/batch\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); },
    delete: async (id: string) => { await fetch(\`\${API_URL}/customers/\${id}\`, { method: 'DELETE' }); },
    clear: async () => { await fetch(\`\${API_URL}/customers\`, { method: 'DELETE' }); }
  },
  products: {
    list: async () => { const res = await fetch(\`\${API_URL}/products\`); return res.json(); },
    saveBatch: async (data: Product[]) => { await fetch(\`\${API_URL}/products/batch\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) }); },
    delete: async (id: string) => { await fetch(\`\${API_URL}/products/\${id}\`, { method: 'DELETE' }); },
    clear: async () => { await fetch(\`\${API_URL}/products\`, { method: 'DELETE' }); }
  },
  campaigns: {
    list: async () => { const res = await fetch(\`\${API_URL}/campaigns\`); return res.json(); },
    save: async (record: CampaignRecord) => { await fetch(\`\${API_URL}/campaigns\`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(record) }); },
    clear: () => Promise.resolve()
  }
};
EOL

echo "🧹 Removing conflicting config..."
rm -f vite.config.js

echo "✅ Upgrade Complete! Run 'cd server && npm install' to set up the backend."