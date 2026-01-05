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

const cleanData = (data) => {
  const { _id, id, ...rest } = data; // Remove _id and id fields
  return rest;
};

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
app.post('/api/customers/batch', async (req, res) => { 
  // 1. Clean the Customer data
  const safeData = req.body.map(item => cleanData(item));
  await Customer.insertMany(safeData); 
  res.json({ success: true }); 
});
app.delete('/api/customers/:id', async (req, res) => { await Customer.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.delete('/api/customers', async (req, res) => { await Customer.deleteMany({}); res.json({ success: true }); });

// Products
app.get('/api/products', async (req, res) => { const products = await Product.find(); res.json(products); });
app.post('/api/products/batch', async (req, res) => { 
  // 2. Clean the Product data
  const safeData = req.body.map(item => cleanData(item));
  await Product.insertMany(safeData); 
  res.json({ success: true }); 
});
app.delete('/api/products/:id', async (req, res) => { await Product.findByIdAndDelete(req.params.id); res.json({ success: true }); });
app.delete('/api/products', async (req, res) => { await Product.deleteMany({}); res.json({ success: true }); });

// Campaigns
app.get('/api/campaigns', async (req, res) => { const campaigns = await Campaign.find().sort({ timestamp: -1 }); res.json(campaigns); });
app.post('/api/campaigns', async (req, res) => { 
  // 3. Clean the Campaign data (Single object, not an array)
  const newCampaign = new Campaign(cleanData(req.body)); 
  await newCampaign.save(); 
  res.json(newCampaign); 
});
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
