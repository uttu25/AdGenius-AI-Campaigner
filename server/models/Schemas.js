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
