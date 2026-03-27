'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const { google } = require('googleapis');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ────────────────────────────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ─── Product Catalog ──────────────────────────────────────────────────────────
const PRODUCTS = [
  // Laptops
  { id: 'LT001', itemNumber: 1001, description: 'Apple MacBook Air 13" M3',          price: 229691, category: 'Laptops' },
  { id: 'LT002', itemNumber: 1002, description: 'Apple MacBook Pro 14" M4 Pro',      price: 417791, category: 'Laptops' },
  { id: 'LT003', itemNumber: 1003, description: 'Dell XPS 15 Intel Core Ultra 7',    price: 323741, category: 'Laptops' },
  { id: 'LT004', itemNumber: 1004, description: 'HP Spectre x360 14" OLED',          price: 271491, category: 'Laptops' },
  { id: 'LT005', itemNumber: 1005, description: 'Lenovo ThinkPad X1 Carbon Gen 12',  price: 302841, category: 'Laptops' },
  { id: 'LT006', itemNumber: 1006, description: 'ASUS ROG Zephyrus G16 RTX 4070',   price: 375991, category: 'Laptops' },

  // Smartphones
  { id: 'PH001', itemNumber: 2001, description: 'Apple iPhone 16 Pro 256GB',         price: 229691, category: 'Smartphones' },
  { id: 'PH002', itemNumber: 2002, description: 'Apple iPhone 16 128GB',             price: 166991, category: 'Smartphones' },
  { id: 'PH003', itemNumber: 2003, description: 'Samsung Galaxy S25 Ultra 256GB',    price: 271491, category: 'Smartphones' },
  { id: 'PH004', itemNumber: 2004, description: 'Samsung Galaxy S25 128GB',          price: 166991, category: 'Smartphones' },
  { id: 'PH005', itemNumber: 2005, description: 'Google Pixel 9 Pro 256GB',          price: 208791, category: 'Smartphones' },
  { id: 'PH006', itemNumber: 2006, description: 'OnePlus 13 512GB',                  price: 166991, category: 'Smartphones' },

  // Tablets
  { id: 'TB001', itemNumber: 3001, description: 'Apple iPad Pro 13" M4 Wi-Fi 256GB', price: 271491, category: 'Tablets' },
  { id: 'TB002', itemNumber: 3002, description: 'Apple iPad Air 11" M2 128GB',       price: 125191, category: 'Tablets' },
  { id: 'TB003', itemNumber: 3003, description: 'Samsung Galaxy Tab S10+ 256GB',     price: 187891, category: 'Tablets' },
  { id: 'TB004', itemNumber: 3004, description: 'Microsoft Surface Pro 11 Copilot+', price: 250591, category: 'Tablets' },

  // Accessories
  { id: 'AC001', itemNumber: 4001, description: 'Apple AirPods Pro 2nd Gen',         price:  52041, category: 'Accessories' },
  { id: 'AC002', itemNumber: 4002, description: 'Samsung Galaxy Buds3 Pro',          price:  41591, category: 'Accessories' },
  { id: 'AC003', itemNumber: 4003, description: 'Apple Watch Series 10 45mm GPS',    price:  89661, category: 'Accessories' },
  { id: 'AC004', itemNumber: 4004, description: 'Samsung Galaxy Watch 7 44mm',       price:  62491, category: 'Accessories' },
  { id: 'AC005', itemNumber: 4005, description: 'Logitech MX Master 3S Mouse',       price:  20898, category: 'Accessories' },
  { id: 'AC006', itemNumber: 4006, description: 'Apple Magic Keyboard with Touch ID', price: 26961, category: 'Accessories' },
  { id: 'AC007', itemNumber: 4007, description: 'Anker 65W USB-C Charger (3-port)',  price:   9612, category: 'Accessories' },
  { id: 'AC008', itemNumber: 4008, description: 'Samsung 45W USB-C Fast Charger',    price:   8358, category: 'Accessories' },
  { id: 'AC009', itemNumber: 4009, description: 'USB-C to Lightning Cable 2m',       price:   5223, category: 'Accessories' },
  { id: 'AC010', itemNumber: 4010, description: 'USB-C to USB-C Cable 2m (240W)',    price:   4178, category: 'Accessories' },

  // Storage
  { id: 'ST001', itemNumber: 5001, description: 'Samsung 990 Pro NVMe SSD 2TB',      price:  39708, category: 'Storage' },
  { id: 'ST002', itemNumber: 5002, description: 'WD Black SN850X NVMe SSD 1TB',      price:  22988, category: 'Storage' },
  { id: 'ST003', itemNumber: 5003, description: 'SanDisk Extreme Portable SSD 2TB',  price:  31348, category: 'Storage' },
  { id: 'ST004', itemNumber: 5004, description: 'Samsung T7 Shield Portable SSD 1TB', price: 20898, category: 'Storage' },
  { id: 'ST005', itemNumber: 5005, description: 'SanDisk Ultra USB-C 256GB Flash',   price:   6268, category: 'Storage' },

  // Monitors
  { id: 'MN001', itemNumber: 6001, description: 'LG UltraGear 27" 4K 144Hz OLED',   price: 166991, category: 'Monitors' },
  { id: 'MN002', itemNumber: 6002, description: 'Dell UltraSharp 27" 4K USB-C Hub', price: 135641, category: 'Monitors' },
  { id: 'MN003', itemNumber: 6003, description: 'Samsung 32" Odyssey G7 QHD 240Hz', price: 104291, category: 'Monitors' },
  { id: 'MN004', itemNumber: 6004, description: 'Apple Studio Display 27" 5K',      price: 334191, category: 'Monitors' },
];

const SHEET_HEADERS = [
  'Transaction ID',
  'Date',
  'Time',
  'Cashier',
  'Item Code',
  'Item Number',
  'Description',
  'Quantity',
  'Unit Price',
  'Total Price',
  'Payment Method',
  'Notes',
];

const SHEET_NAME = 'Transactions';

// ─── Google Sheets Auth ───────────────────────────────────────────────────────
function getAuthClient() {
  // Option A: path to a service account JSON file
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return new google.auth.GoogleAuth({
      keyFile: process.env.GOOGLE_APPLICATION_CREDENTIALS,
      scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
  }

  // Option B: individual env-var credentials
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const rawKey = process.env.GOOGLE_PRIVATE_KEY;

  if (!email || !rawKey) {
    throw new Error(
      'Google credentials not configured. Set GOOGLE_APPLICATION_CREDENTIALS ' +
      'or GOOGLE_SERVICE_ACCOUNT_EMAIL + GOOGLE_PRIVATE_KEY in your .env file.'
    );
  }

  // The private key stored in .env has literal \n — convert them to real newlines
  const privateKey = rawKey.replace(/\\n/g, '\n');

  return new google.auth.GoogleAuth({
    credentials: { client_email: email, private_key: privateKey },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
  });
}

async function getSheetsClient() {
  const auth = getAuthClient();
  const authClient = await auth.getClient();
  return google.sheets({ version: 'v4', auth: authClient });
}

// ─── Ensure header row exists ─────────────────────────────────────────────────
async function ensureHeaders() {
  let sheets;
  try {
    sheets = await getSheetsClient();
  } catch (err) {
    console.warn('[startup] Could not connect to Google Sheets:', err.message);
    return;
  }

  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId) {
    console.warn('[startup] SPREADSHEET_ID not set — skipping header check.');
    return;
  }

  try {
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A1:L1`,
    });

    const existingRow = (res.data.values || [])[0] || [];
    if (existingRow.length === 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId,
        range: `${SHEET_NAME}!A1`,
        valueInputOption: 'RAW',
        requestBody: { values: [SHEET_HEADERS] },
      });
      console.log('[startup] Header row written to Google Sheets.');
    } else {
      console.log('[startup] Header row already present.');
    }
  } catch (err) {
    console.warn('[startup] Failed to ensure headers:', err.message);
  }
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function todayString() {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

function timeString() {
  const d = new Date();
  return d.toTimeString().slice(0, 8); // HH:MM:SS
}

function roundTwo(n) {
  return Math.round(n * 100) / 100;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// Serve the frontend
app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Product catalog
app.get('/api/products', (_req, res) => {
  res.json({ success: true, products: PRODUCTS });
});

// Submit a transaction
app.post('/api/transactions', async (req, res) => {
  const { cashier, paymentMethod, notes, items } = req.body;

  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ success: false, error: 'Cart is empty.' });
  }

  const transactionId = uuidv4();
  const date = (req.body.date && /^\d{4}-\d{2}-\d{2}$/.test(req.body.date)) ? req.body.date : todayString();
  const time = (req.body.time && /^\d{2}:\d{2}:\d{2}$/.test(req.body.time)) ? req.body.time : timeString();
  const safeNotes = (notes || '').toString().trim();

  // Build rows — one row per cart item
  const rows = items.map((item) => {
    const qty = Number(item.quantity) || 1;
    const unitPrice = roundTwo(Number(item.unitPrice) || 0);
    const totalPrice = roundTwo(qty * unitPrice);
    return [
      transactionId,
      date,
      time,
      cashier || 'Unknown',
      item.id || '',
      item.itemNumber || '',
      item.description || '',
      qty,
      unitPrice,
      totalPrice,
      paymentMethod || 'Cash',
      safeNotes,
    ];
  });

  const spreadsheetId = process.env.SPREADSHEET_ID;
  if (!spreadsheetId) {
    // Offline mode — still return success with the data so the client can cache it
    return res.json({
      success: true,
      offline: true,
      transactionId,
      date,
      time,
      rows,
    });
  }

  try {
    const sheets = await getSheetsClient();
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${SHEET_NAME}!A1`,
      valueInputOption: 'RAW',
      insertDataOption: 'INSERT_ROWS',
      requestBody: { values: rows },
    });

    res.json({ success: true, transactionId, date, time, rowsWritten: rows.length });
  } catch (err) {
    console.error('[POST /api/transactions] Sheets error:', err.message);
    // Return offline success so the client can cache locally
    res.json({
      success: true,
      offline: true,
      transactionId,
      date,
      time,
      rows,
      error: err.message,
    });
  }
});

// Daily productivity report
app.get('/api/report/daily', async (req, res) => {
  const targetDate = req.query.date || todayString();
  const spreadsheetId = process.env.SPREADSHEET_ID;

  if (!spreadsheetId) {
    return res.json({
      success: true,
      offline: true,
      date: targetDate,
      totalTransactions: 0,
      totalRevenue: 0,
      itemsSold: [],
      hourlyBreakdown: [],
      transactionLog: [],
    });
  }

  try {
    const sheets = await getSheetsClient();
    const result = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range: `${SHEET_NAME}!A2:L`,
    });

    const allRows = result.data.values || [];

    // Filter rows matching targetDate (column index 1 = Date)
    const todayRows = allRows.filter((r) => r[1] === targetDate);

    // Unique transaction IDs
    const txIds = new Set(todayRows.map((r) => r[0]));

    // Total revenue (column 9 = Total Price)
    const totalRevenue = roundTwo(
      todayRows.reduce((sum, r) => sum + (parseFloat(r[9]) || 0), 0)
    );

    // Items sold grouped by description (column 6)
    const itemMap = {};
    todayRows.forEach((r) => {
      const desc = r[6] || 'Unknown';
      const qty = parseInt(r[7], 10) || 0;
      const revenue = parseFloat(r[9]) || 0;
      if (!itemMap[desc]) itemMap[desc] = { description: desc, qtySold: 0, revenue: 0 };
      itemMap[desc].qtySold += qty;
      itemMap[desc].revenue = roundTwo(itemMap[desc].revenue + revenue);
    });
    const itemsSold = Object.values(itemMap).sort((a, b) => b.qtySold - a.qtySold);

    // Hourly breakdown — group by hour extracted from Time (column 2 = HH:MM:SS)
    const hourMap = {};
    todayRows.forEach((r) => {
      const timeParts = (r[2] || '00:00:00').split(':');
      const hour = parseInt(timeParts[0], 10);
      const label = `${String(hour).padStart(2, '0')}:00`;
      if (!hourMap[label]) hourMap[label] = { hour: label, transactions: 0, revenue: 0 };
      // Only count new transactions
    });
    // Re-do hourly using unique txIds per hour
    const txHourMap = {};
    todayRows.forEach((r) => {
      const txId = r[0];
      const timeParts = (r[2] || '00:00:00').split(':');
      const hour = parseInt(timeParts[0], 10);
      const label = `${String(hour).padStart(2, '0')}:00`;
      const revenue = parseFloat(r[9]) || 0;
      if (!hourMap[label]) hourMap[label] = { hour: label, transactions: new Set(), revenue: 0 };
      hourMap[label].transactions.add(txId);
      hourMap[label].revenue = roundTwo(hourMap[label].revenue + revenue);
    });
    const hourlyBreakdown = Object.values(hourMap)
      .sort((a, b) => a.hour.localeCompare(b.hour))
      .map((h) => ({
        hour: h.hour,
        transactions: h.transactions.size,
        revenue: roundTwo(h.revenue),
      }));

    // Full transaction log — one entry per unique transaction
    const txLogMap = {};
    todayRows.forEach((r) => {
      const txId = r[0];
      const revenue = parseFloat(r[9]) || 0;
      if (!txLogMap[txId]) {
        txLogMap[txId] = {
          transactionId: txId,
          date: r[1],
          time: r[2],
          cashier: r[3],
          paymentMethod: r[10],
          items: [],
          total: 0,
        };
      }
      txLogMap[txId].items.push({
        itemCode: r[4],
        itemNumber: r[5],
        description: r[6],
        quantity: parseInt(r[7], 10) || 0,
        unitPrice: parseFloat(r[8]) || 0,
        totalPrice: revenue,
      });
      txLogMap[txId].total = roundTwo(txLogMap[txId].total + revenue);
    });
    const transactionLog = Object.values(txLogMap).sort((a, b) =>
      a.time.localeCompare(b.time)
    );

    res.json({
      success: true,
      date: targetDate,
      totalTransactions: txIds.size,
      totalRevenue,
      itemsSold,
      hourlyBreakdown,
      transactionLog,
    });
  } catch (err) {
    console.error('[GET /api/report/daily] Sheets error:', err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ─── Start server ─────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\nTPS Point-of-Sale server running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  await ensureHeaders();
});
