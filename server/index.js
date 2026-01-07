require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { google } = require('googleapis');
const { Customer, Product, Campaign } = require('./models/Schemas');

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for large batch imports

mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB Connection Error:', err));

const cleanData = (data) => {
  const { _id, id, ...rest } = data; // Remove _id and id fields to prevent collision
  return rest;
};

// --- AUTH ---
app.post('/api/auth/google/refresh', async (req, res) => {
  // SECURITY FIX: Do not accept clientSecret from body
  const { clientId, refreshToken } = req.body;
  
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    return res.status(500).json({ error: "Server misconfiguration: Missing GOOGLE_CLIENT_SECRET" });
  }

  const oauth2Client = new google.auth.OAuth2(
    clientId,
    process.env.GOOGLE_CLIENT_SECRET, // Use server-side secret
    'postmessage'
  );

  oauth2Client.setCredentials({ refresh_token: refreshToken });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    res.json({ access_token: credentials.access_token });
  } catch (error) {
    console.error("Token Refresh Error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to refresh token" });
  }
});

// --- CUSTOMERS ---
app.get('/api/customers', async (req, res) => {
  try {
    const customers = await Customer.find();
    res.json(customers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/customers/batch', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) throw new Error("Expected an array of customers");
    const safeData = req.body.map(item => cleanData(item));
    await Customer.insertMany(safeData);
    res.json({ success: true, count: safeData.length });
  } catch (error) {
    console.error("Batch Import Error:", error);
    res.status(500).json({ error: "Failed to save customers", details: error.message });
  }
});

app.delete('/api/customers/:id', async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/customers', async (req, res) => {
  try {
    await Customer.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- PRODUCTS ---
app.get('/api/products', async (req, res) => {
  try {
    const products = await Product.find();
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/products/batch', async (req, res) => {
  try {
    if (!Array.isArray(req.body)) throw new Error("Expected an array of products");
    const safeData = req.body.map(item => cleanData(item));
    await Product.insertMany(safeData);
    res.json({ success: true, count: safeData.length });
  } catch (error) {
    console.error("Product Import Error:", error);
    res.status(500).json({ error: "Failed to save products", details: error.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products', async (req, res) => {
  try {
    await Product.deleteMany({});
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// --- CAMPAIGNS ---
app.get('/api/campaigns', async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ timestamp: -1 });
    res.json(campaigns);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/campaigns', async (req, res) => {
  try {
    const newCampaign = new Campaign(cleanData(req.body));
    await newCampaign.save();
    res.json(newCampaign);
  } catch (error) {
    console.error("Campaign Save Error:", error);
    res.status(500).json({ error: "Failed to save campaign" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
