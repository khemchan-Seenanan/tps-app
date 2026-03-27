'use strict';

/**
 * Seed script — generates 1,000 simulated transactions spread over 7 days
 * and posts them to the TPS server's /api/transactions endpoint.
 *
 * Usage:
 *   node seed.js                        # targets http://localhost:3000
 *   node seed.js http://localhost:3001  # custom host
 */

const BASE_URL = process.argv[2] || 'http://localhost:3000';

// ─── Config ────────────────────────────────────────────────────────────────
const TOTAL_TRANSACTIONS = 1000;
const DAYS               = 7;

const CASHIERS        = ['Alice Mendez', 'Brian Okafor', 'Carla Singh', 'David Lee', 'Emma Tremblay'];
const PAYMENT_METHODS = ['Cash', 'Credit Card', 'Debit Card', 'Mobile Pay'];

// Weights: Cash 25%, Credit 40%, Debit 25%, Mobile 10%
const PAYMENT_WEIGHTS = [25, 40, 25, 10];

// Traffic shape per hour (index 0 = midnight).  Peak: 11-13h and 16-18h.
const HOURLY_WEIGHTS = [
  0, 0, 0, 0, 0, 0,   // 00–05  (closed)
  1, 3, 6, 9, 10, 13, // 06–11
  15, 14, 9, 8, 12,   // 12–16
  14, 10, 6, 2, 1,    // 17–21
  0, 0,               // 22–23
];

// Product catalog — must match server.js
const PRODUCTS = [
  { id: 'LT001', itemNumber: 1001, description: 'Apple MacBook Air 13" M3',           price: 229691, category: 'Laptops' },
  { id: 'LT002', itemNumber: 1002, description: 'Apple MacBook Pro 14" M4 Pro',       price: 417791, category: 'Laptops' },
  { id: 'LT003', itemNumber: 1003, description: 'Dell XPS 15 Intel Core Ultra 7',     price: 323741, category: 'Laptops' },
  { id: 'LT004', itemNumber: 1004, description: 'HP Spectre x360 14" OLED',           price: 271491, category: 'Laptops' },
  { id: 'LT005', itemNumber: 1005, description: 'Lenovo ThinkPad X1 Carbon Gen 12',   price: 302841, category: 'Laptops' },
  { id: 'LT006', itemNumber: 1006, description: 'ASUS ROG Zephyrus G16 RTX 4070',    price: 375991, category: 'Laptops' },
  { id: 'PH001', itemNumber: 2001, description: 'Apple iPhone 16 Pro 256GB',          price: 229691, category: 'Smartphones' },
  { id: 'PH002', itemNumber: 2002, description: 'Apple iPhone 16 128GB',              price: 166991, category: 'Smartphones' },
  { id: 'PH003', itemNumber: 2003, description: 'Samsung Galaxy S25 Ultra 256GB',     price: 271491, category: 'Smartphones' },
  { id: 'PH004', itemNumber: 2004, description: 'Samsung Galaxy S25 128GB',           price: 166991, category: 'Smartphones' },
  { id: 'PH005', itemNumber: 2005, description: 'Google Pixel 9 Pro 256GB',           price: 208791, category: 'Smartphones' },
  { id: 'PH006', itemNumber: 2006, description: 'OnePlus 13 512GB',                   price: 166991, category: 'Smartphones' },
  { id: 'TB001', itemNumber: 3001, description: 'Apple iPad Pro 13" M4 Wi-Fi 256GB',  price: 271491, category: 'Tablets' },
  { id: 'TB002', itemNumber: 3002, description: 'Apple iPad Air 11" M2 128GB',        price: 125191, category: 'Tablets' },
  { id: 'TB003', itemNumber: 3003, description: 'Samsung Galaxy Tab S10+ 256GB',      price: 187891, category: 'Tablets' },
  { id: 'TB004', itemNumber: 3004, description: 'Microsoft Surface Pro 11 Copilot+',  price: 250591, category: 'Tablets' },
  { id: 'AC001', itemNumber: 4001, description: 'Apple AirPods Pro 2nd Gen',          price:  52041, category: 'Accessories' },
  { id: 'AC002', itemNumber: 4002, description: 'Samsung Galaxy Buds3 Pro',           price:  41591, category: 'Accessories' },
  { id: 'AC003', itemNumber: 4003, description: 'Apple Watch Series 10 45mm GPS',     price:  89661, category: 'Accessories' },
  { id: 'AC004', itemNumber: 4004, description: 'Samsung Galaxy Watch 7 44mm',        price:  62491, category: 'Accessories' },
  { id: 'AC005', itemNumber: 4005, description: 'Logitech MX Master 3S Mouse',        price:  20898, category: 'Accessories' },
  { id: 'AC006', itemNumber: 4006, description: 'Apple Magic Keyboard with Touch ID', price:  26961, category: 'Accessories' },
  { id: 'AC007', itemNumber: 4007, description: 'Anker 65W USB-C Charger (3-port)',   price:   9612, category: 'Accessories' },
  { id: 'AC008', itemNumber: 4008, description: 'Samsung 45W USB-C Fast Charger',     price:   8358, category: 'Accessories' },
  { id: 'AC009', itemNumber: 4009, description: 'USB-C to Lightning Cable 2m',        price:   5223, category: 'Accessories' },
  { id: 'AC010', itemNumber: 4010, description: 'USB-C to USB-C Cable 2m (240W)',     price:   4178, category: 'Accessories' },
  { id: 'ST001', itemNumber: 5001, description: 'Samsung 990 Pro NVMe SSD 2TB',       price:  39708, category: 'Storage' },
  { id: 'ST002', itemNumber: 5002, description: 'WD Black SN850X NVMe SSD 1TB',       price:  22988, category: 'Storage' },
  { id: 'ST003', itemNumber: 5003, description: 'SanDisk Extreme Portable SSD 2TB',   price:  31348, category: 'Storage' },
  { id: 'ST004', itemNumber: 5004, description: 'Samsung T7 Shield Portable SSD 1TB', price:  20898, category: 'Storage' },
  { id: 'ST005', itemNumber: 5005, description: 'SanDisk Ultra USB-C 256GB Flash',    price:   6268, category: 'Storage' },
  { id: 'MN001', itemNumber: 6001, description: 'LG UltraGear 27" 4K 144Hz OLED',    price: 166991, category: 'Monitors' },
  { id: 'MN002', itemNumber: 6002, description: 'Dell UltraSharp 27" 4K USB-C Hub',  price: 135641, category: 'Monitors' },
  { id: 'MN003', itemNumber: 6003, description: 'Samsung 32" Odyssey G7 QHD 240Hz',  price: 104291, category: 'Monitors' },
  { id: 'MN004', itemNumber: 6004, description: 'Apple Studio Display 27" 5K',       price: 334191, category: 'Monitors' },
];

// Product popularity weights — accessories & storage sell more often than monitors
const PRODUCT_WEIGHTS = PRODUCTS.map(p => {
  if (p.category === 'Accessories') return 18;
  if (p.category === 'Storage')     return 14;
  if (p.category === 'Smartphones') return 12;
  if (p.category === 'Laptops')     return 10;
  if (p.category === 'Tablets')     return 8;
  if (p.category === 'Monitors')    return 5;
  return 10;
});

// ─── Helpers ───────────────────────────────────────────────────────────────
function weightedRandom(items, weights) {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

function randInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pad(n) { return String(n).padStart(2, '0'); }

/** Returns a date string YYYY-MM-DD for day offset (0 = today - 6, 6 = today) */
function dateForDay(dayIndex) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - (DAYS - 1 - dayIndex));
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

/** Pick a random hour weighted by HOURLY_WEIGHTS */
function randomHour() {
  return parseInt(weightedRandom(
    HOURLY_WEIGHTS.map((_, i) => i),
    HOURLY_WEIGHTS
  ), 10);
}

function randomTime() {
  const h = randomHour();
  const m = randInt(0, 59);
  const s = randInt(0, 59);
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
}

/** Build a cart: 1–4 line items, mostly 1 unit each (occasionally 2) */
function buildCart() {
  const lineCount = weightedRandom([1, 2, 3, 4], [55, 28, 12, 5]);
  const seen = new Set();
  const items = [];
  for (let i = 0; i < lineCount; i++) {
    let product;
    let tries = 0;
    do {
      product = weightedRandom(PRODUCTS, PRODUCT_WEIGHTS);
      tries++;
    } while (seen.has(product.id) && tries < 20);
    seen.add(product.id);
    const qty = weightedRandom([1, 2, 3], [75, 20, 5]);
    items.push({ ...product, quantity: qty, unitPrice: product.price });
  }
  return items;
}

// ─── Distribute 1000 transactions over 7 days ──────────────────────────────
// Add some day-of-week variance: weekends slightly busier
const DAY_WEIGHTS = [10, 12, 13, 13, 14, 16, 15]; // Mon-Sun (index 0 = oldest day)

function distributeCounts(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  let allocated = 0;
  const counts = weights.map((w, i) => {
    if (i === weights.length - 1) return total - allocated;
    const n = Math.round((w / sum) * total);
    allocated += n;
    return n;
  });
  return counts;
}

// ─── Build all transaction payloads ────────────────────────────────────────
function buildAllTransactions() {
  const dayCounts = distributeCounts(TOTAL_TRANSACTIONS, DAY_WEIGHTS);
  const transactions = [];

  for (let d = 0; d < DAYS; d++) {
    const date = dateForDay(d);
    const count = dayCounts[d];
    for (let t = 0; t < count; t++) {
      transactions.push({
        date,
        time: randomTime(),
        cashier: CASHIERS[randInt(0, CASHIERS.length - 1)],
        paymentMethod: weightedRandom(PAYMENT_METHODS, PAYMENT_WEIGHTS),
        notes: '',
        items: buildCart(),
      });
    }
  }

  // Sort by date+time so they're inserted in chronological order
  transactions.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  return transactions;
}

// ─── POST to server with a concurrency limit ───────────────────────────────
async function postTransaction(payload) {
  const res = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

async function runWithConcurrency(tasks, limit, onProgress) {
  let index = 0;
  let completed = 0;
  const results = [];

  async function worker() {
    while (index < tasks.length) {
      const i = index++;
      try {
        results[i] = await tasks[i]();
      } catch (err) {
        results[i] = { error: err.message };
      }
      completed++;
      onProgress(completed, tasks.length);
    }
  }

  const workers = Array.from({ length: limit }, () => worker());
  await Promise.all(workers);
  return results;
}

// ─── Progress bar ──────────────────────────────────────────────────────────
function renderProgress(done, total) {
  const pct   = Math.round((done / total) * 100);
  const filled = Math.round(pct / 2);
  const bar   = '█'.repeat(filled) + '░'.repeat(50 - filled);
  process.stdout.write(`\r  [${bar}] ${pct}%  ${done}/${total}`);
}

// ─── Main ──────────────────────────────────────────────────────────────────
(async () => {
  console.log(`\nTPS Seed Script`);
  console.log(`Target : ${BASE_URL}`);
  console.log(`Transactions to generate: ${TOTAL_TRANSACTIONS} over ${DAYS} days\n`);

  // Check server is up
  try {
    const ping = await fetch(`${BASE_URL}/api/products`);
    if (!ping.ok) throw new Error(`status ${ping.status}`);
    console.log('  Server is reachable.\n');
  } catch (err) {
    console.error(`  ERROR: Cannot reach server at ${BASE_URL}`);
    console.error(`  Make sure the server is running (npm start) then try again.\n`);
    process.exit(1);
  }

  const transactions = buildAllTransactions();

  // Show day distribution
  const dayMap = {};
  transactions.forEach(t => { dayMap[t.date] = (dayMap[t.date] || 0) + 1; });
  console.log('  Day distribution:');
  Object.entries(dayMap).sort().forEach(([date, count]) => {
    const bar = '▪'.repeat(Math.round(count / 5));
    console.log(`    ${date}  ${String(count).padStart(3)}  ${bar}`);
  });
  console.log();

  // Post all transactions with concurrency=5
  console.log('  Posting transactions...');
  const tasks = transactions.map(tx => () => postTransaction(tx));
  const results = await runWithConcurrency(tasks, 5, renderProgress);

  const errors  = results.filter(r => r && r.error);
  const offline = results.filter(r => r && r.offline);
  const ok      = results.filter(r => r && r.success && !r.offline);

  console.log('\n\n  ─────────────────────────────────');
  console.log(`  Done!`);
  console.log(`  Saved to Google Sheets : ${ok.length}`);
  console.log(`  Saved offline (no Sheet): ${offline.length}`);
  console.log(`  Errors                 : ${errors.length}`);
  if (errors.length > 0) {
    console.log('\n  First 5 errors:');
    errors.slice(0, 5).forEach(e => console.log('   ', e.error));
  }
  console.log('  ─────────────────────────────────\n');
})();
