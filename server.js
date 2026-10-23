require('dotenv').config();

const express = require('express');
const mysql = require('mysql2/promise');
const cors = require('cors');
const { randomUUID } = require('node:crypto');

const app = express();
const PORT = Number(process.env.PORT || process.env.API_PORT || 3000);

const pool = mysql.createPool({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'marketflow_db',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  timezone: 'Z'
});

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim()).filter(Boolean)
  : true;
app.use(cors({ origin: allowedOrigins }));
app.use(express.json({ limit: '1mb' }));

const DEFAULT_PRODUCTS = [
  { id: 'PRD-1001', name: 'Basmati Rice 1 kg', sku: 'STP-001', category: 'Staples', price: 78, stock: 54, threshold: 10, status: 'active', emoji: '🌾' },
  { id: 'PRD-1002', name: 'Whole Wheat Flour 1 kg', sku: 'STP-002', category: 'Staples', price: 46, stock: 32, threshold: 10, status: 'active', emoji: '🌾' },
  { id: 'PRD-1003', name: 'Full Cream Milk 1 L', sku: 'DAI-001', category: 'Dairy', price: 68, stock: 8, threshold: 12, status: 'active', emoji: '🥛' },
  { id: 'PRD-1004', name: 'Farm Fresh Eggs (6)', sku: 'DAI-002', category: 'Dairy', price: 48, stock: 21, threshold: 8, status: 'active', emoji: '🥚' },
  { id: 'PRD-1005', name: 'Classic Potato Chips', sku: 'SNK-001', category: 'Snacks', price: 20, stock: 7, threshold: 12, status: 'active', emoji: '🥔' },
  { id: 'PRD-1006', name: 'Orange Juice 1 L', sku: 'BEV-001', category: 'Beverages', price: 110, stock: 18, threshold: 8, status: 'active', emoji: '🧃' },
  { id: 'PRD-1007', name: 'Dark Chocolate Bar', sku: 'SNK-002', category: 'Snacks', price: 55, stock: 26, threshold: 10, status: 'active', emoji: '🍫' },
  { id: 'PRD-1008', name: 'Dishwashing Liquid', sku: 'HOM-001', category: 'Household', price: 95, stock: 4, threshold: 8, status: 'active', emoji: '🧴' },
  { id: 'PRD-1009', name: 'Green Tea (25 bags)', sku: 'BEV-002', category: 'Beverages', price: 145, stock: 15, threshold: 6, status: 'active', emoji: '🍵' },
  { id: 'PRD-1010', name: 'Bath Soap (Pack of 4)', sku: 'PER-001', category: 'Personal care', price: 120, stock: 23, threshold: 8, status: 'active', emoji: '🧼' },
  { id: 'PRD-1011', name: 'Fresh Apples 1 kg', sku: 'PRO-001', category: 'Produce', price: 160, stock: 13, threshold: 10, status: 'active', emoji: '🍎' },
  { id: 'PRD-1012', name: 'Instant Noodles (Pack)', sku: 'STP-003', category: 'Staples', price: 15, stock: 0, threshold: 15, status: 'active', emoji: '🍜' }
];

const DEFAULT_SALES = [
  { id: 'MF-1048', minutesAgo: 42, customer: 'Walk-in customer', items: [{ productId: 'PRD-1001', name: 'Basmati Rice 1 kg', price: 78, qty: 2 }, { productId: 'PRD-1003', name: 'Full Cream Milk 1 L', price: 68, qty: 1 }], subtotal: 224, tax: 0, total: 224, payment: 'Cash' },
  { id: 'MF-1047', minutesAgo: 130, customer: 'Priya S.', items: [{ productId: 'PRD-1007', name: 'Dark Chocolate Bar', price: 55, qty: 2 }, { productId: 'PRD-1004', name: 'Farm Fresh Eggs (6)', price: 48, qty: 1 }], subtotal: 158, tax: 0, total: 158, payment: 'UPI' },
  { id: 'MF-1046', minutesAgo: 280, customer: 'Walk-in customer', items: [{ productId: 'PRD-1002', name: 'Whole Wheat Flour 1 kg', price: 46, qty: 2 }, { productId: 'PRD-1009', name: 'Green Tea (25 bags)', price: 145, qty: 1 }], subtotal: 237, tax: 0, total: 237, payment: 'Card' },
  { id: 'MF-1045', minutesAgo: 520, customer: 'Rahul K.', items: [{ productId: 'PRD-1010', name: 'Bath Soap (Pack of 4)', price: 120, qty: 1 }, { productId: 'PRD-1006', name: 'Orange Juice 1 L', price: 110, qty: 1 }], subtotal: 230, tax: 0, total: 230, payment: 'UPI' },
  { id: 'MF-1044', minutesAgo: 900, customer: 'Walk-in customer', items: [{ productId: 'PRD-1005', name: 'Classic Potato Chips', price: 20, qty: 3 }, { productId: 'PRD-1003', name: 'Full Cream Milk 1 L', price: 68, qty: 2 }], subtotal: 196, tax: 0, total: 196, payment: 'Cash' }
];

function asyncRoute(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function mapProduct(row) {
  return {
    id: row.product_id,
    name: row.name,
    sku: row.sku,
    category: row.category,
    price: Number(row.price),
    stock: Number(row.stock),
    threshold: Number(row.low_stock_threshold),
    status: row.status,
    emoji: row.emoji || '📦'
  };
}

function mapSettings(row) {
  return {
    storeName: row.store_name,
    currency: row.currency,
    taxRate: Number(row.tax_rate),
    lowStockThreshold: Number(row.low_stock_threshold),
    showTips: Boolean(row.show_tips)
  };
}

function parseProduct(input, current = null) {
  const name = String(input.name || '').trim();
  const sku = String(input.sku || '').trim();
  const category = String(input.category || '').trim();
  const price = Number(input.price);
  const stock = Number(input.stock);
  const threshold = Number(input.threshold ?? 10);
  const status = input.status === 'inactive' ? 'inactive' : 'active';
  const id = String(input.id || current?.id || `PRD-${Date.now()}`).trim();
  const emoji = String(input.emoji || current?.emoji || '📦').trim().slice(0, 12);

  if (!name || name.length > 90) throw httpError(400, 'Product name is required and must be 90 characters or fewer.');
  if (!sku || sku.length > 30) throw httpError(400, 'SKU is required and must be 30 characters or fewer.');
  if (!category || category.length > 60) throw httpError(400, 'Choose a valid product category.');
  if (!Number.isFinite(price) || price <= 0) throw httpError(400, 'Price must be a positive number.');
  if (!Number.isInteger(stock) || stock < 0) throw httpError(400, 'Stock must be a whole number of zero or more.');
  if (!Number.isInteger(threshold) || threshold < 0) throw httpError(400, 'Low-stock threshold must be a whole number of zero or more.');
  if (!/^[A-Za-z0-9_-]{1,40}$/.test(id)) throw httpError(400, 'Product ID may contain only letters, numbers, hyphens, and underscores.');

  return { id, name, sku, category, price, stock, threshold, status, emoji };
}

function httpError(status, message) {
  const error = new Error(message);
  error.status = status;
  return error;
}

async function insertProduct(connection, product) {
  await connection.execute(
    `INSERT INTO products
      (product_id, name, sku, category, price, stock, low_stock_threshold, status, emoji)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE
      name = VALUES(name), sku = VALUES(sku), category = VALUES(category), price = VALUES(price),
      stock = VALUES(stock), low_stock_threshold = VALUES(low_stock_threshold),
      status = VALUES(status), emoji = VALUES(emoji)`,
    [product.id, product.name, product.sku, product.category, product.price, product.stock,
      product.threshold, product.status, product.emoji]
  );
}

async function seedDemoData(connection, { reset = false } = {}) {
  if (reset) {
    await connection.execute('DELETE FROM sale_items');
    await connection.execute('DELETE FROM sales');
    await connection.execute('DELETE FROM products');
    await connection.execute(
      `UPDATE settings SET store_name = 'MarketFlow Grocery', currency = 'INR', tax_rate = 0,
       low_stock_threshold = 10, show_tips = 1 WHERE id = 1`
    );
  }

  await connection.execute(
    `INSERT INTO settings (id, store_name, currency, tax_rate, low_stock_threshold, show_tips)
     VALUES (1, 'MarketFlow Grocery', 'INR', 0, 10, 1)
     ON DUPLICATE KEY UPDATE id = VALUES(id)`
  );

  for (const product of DEFAULT_PRODUCTS) await insertProduct(connection, product);

  for (const sale of DEFAULT_SALES) {
    await connection.execute(
      `INSERT IGNORE INTO sales (bill_no, customer, subtotal, tax, total, payment_method, sale_date)
       VALUES (?, ?, ?, ?, ?, ?, ?)` ,
      [sale.id, sale.customer, sale.subtotal, sale.tax, sale.total, sale.payment,
        new Date(Date.now() - sale.minutesAgo * 60 * 1000)]
    );
    const [[saleRow]] = await connection.execute('SELECT sale_id FROM sales WHERE bill_no = ?', [sale.id]);
    if (!saleRow) continue;
    const [[existing]] = await connection.execute('SELECT COUNT(*) AS item_count FROM sale_items WHERE sale_id = ?', [saleRow.sale_id]);
    if (Number(existing.item_count) === 0) {
      for (const item of sale.items) {
        await connection.execute(
          `INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, quantity, line_total)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [saleRow.sale_id, item.productId, item.name, item.price, item.qty, item.price * item.qty]
        );
      }
    }
  }
}

async function ensureSeedData() {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const [[row]] = await connection.execute('SELECT COUNT(*) AS product_count FROM products');
    const [[settingsRow]] = await connection.execute('SELECT COUNT(*) AS settings_count FROM settings WHERE id = 1');
    if (Number(settingsRow.settings_count) === 0) {
      await connection.execute(
        `INSERT INTO settings (id, store_name, currency, tax_rate, low_stock_threshold, show_tips)
         VALUES (1, 'MarketFlow Grocery', 'INR', 0, 10, 1)`
      );
    }
    if (Number(row.product_count) === 0) await seedDemoData(connection);
    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

async function loadBootstrap() {
  const [productRows] = await pool.execute('SELECT * FROM products ORDER BY name ASC');
  const [saleRows] = await pool.execute(
    `SELECT sale_id, bill_no, customer, subtotal, tax, total, payment_method, sale_date
     FROM sales ORDER BY sale_date DESC, sale_id DESC`
  );
  const [itemRows] = await pool.execute(
    `SELECT si.sale_id, si.product_id, si.product_name, si.unit_price, si.quantity, si.line_total, p.emoji
     FROM sale_items si LEFT JOIN products p ON p.product_id = si.product_id
     ORDER BY si.sale_item_id ASC`
  );
  const [settingsRows] = await pool.execute('SELECT * FROM settings WHERE id = 1 LIMIT 1');

  const salesByPk = new Map();
  const sales = saleRows.map((row) => {
    const sale = {
      id: row.bill_no,
      date: new Date(row.sale_date).toISOString(),
      customer: row.customer || 'Walk-in customer',
      items: [],
      subtotal: Number(row.subtotal),
      tax: Number(row.tax),
      total: Number(row.total),
      payment: row.payment_method
    };
    salesByPk.set(row.sale_id, sale);
    return sale;
  });

  for (const item of itemRows) {
    const sale = salesByPk.get(item.sale_id);
    if (!sale) continue;
    sale.items.push({
      productId: item.product_id,
      name: item.product_name,
      price: Number(item.unit_price),
      qty: Number(item.quantity),
      emoji: item.emoji || '📦'
    });
  }

  const [[maxBillRow]] = await pool.execute(
    `SELECT MAX(CAST(SUBSTRING(bill_no, 4) AS UNSIGNED)) AS max_bill
     FROM sales WHERE bill_no REGEXP '^MF-[0-9]+$'`
  );

  return {
    products: productRows.map(mapProduct),
    sales,
    settings: settingsRows[0] ? mapSettings(settingsRows[0]) : {
      storeName: 'MarketFlow Grocery', currency: 'INR', taxRate: 0, lowStockThreshold: 10, showTips: true
    },
    nextSale: Math.max(1049, Number(maxBillRow.max_bill || 1048) + 1)
  };
}

app.get('/api/health', asyncRoute(async (_req, res) => {
  await pool.query('SELECT 1');
  res.json({ ok: true, database: 'connected', service: 'MarketFlow API' });
}));

app.get('/api/bootstrap', asyncRoute(async (_req, res) => {
  await ensureSeedData();
  res.json(await loadBootstrap());
}));

app.get('/api/products', asyncRoute(async (_req, res) => {
  const [rows] = await pool.execute('SELECT * FROM products ORDER BY name ASC');
  res.json(rows.map(mapProduct));
}));

app.post('/api/products', asyncRoute(async (req, res) => {
  const product = parseProduct(req.body || {});
  try {
    await pool.execute(
      `INSERT INTO products (product_id, name, sku, category, price, stock, low_stock_threshold, status, emoji)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [product.id, product.name, product.sku, product.category, product.price, product.stock, product.threshold, product.status, product.emoji]
    );
    const [[row]] = await pool.execute('SELECT * FROM products WHERE product_id = ?', [product.id]);
    res.status(201).json(mapProduct(row));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw httpError(409, 'That product ID or SKU is already in use.');
    throw error;
  }
}));

app.put('/api/products/:id', asyncRoute(async (req, res) => {
  const [[existingRow]] = await pool.execute('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
  if (!existingRow) throw httpError(404, 'Product not found.');
  const existing = mapProduct(existingRow);
  const product = parseProduct({ ...req.body, id: req.params.id }, existing);
  try {
    await pool.execute(
      `UPDATE products SET name = ?, sku = ?, category = ?, price = ?, stock = ?,
       low_stock_threshold = ?, status = ?, emoji = ? WHERE product_id = ?`,
      [product.name, product.sku, product.category, product.price, product.stock,
        product.threshold, product.status, product.emoji, product.id]
    );
    const [[row]] = await pool.execute('SELECT * FROM products WHERE product_id = ?', [product.id]);
    res.json(mapProduct(row));
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') throw httpError(409, 'That SKU is already being used.');
    throw error;
  }
}));

app.delete('/api/products/:id', asyncRoute(async (req, res) => {
  const [result] = await pool.execute('DELETE FROM products WHERE product_id = ?', [req.params.id]);
  if (result.affectedRows === 0) throw httpError(404, 'Product not found.');
  res.json({ ok: true });
}));

app.post('/api/products/:id/restock', asyncRoute(async (req, res) => {
  const quantity = Number(req.body?.quantity);
  if (!Number.isInteger(quantity) || quantity <= 0) throw httpError(400, 'Restock quantity must be a positive whole number.');
  const [result] = await pool.execute(
    'UPDATE products SET stock = stock + ? WHERE product_id = ?', [quantity, req.params.id]
  );
  if (result.affectedRows === 0) throw httpError(404, 'Product not found.');
  const [[row]] = await pool.execute('SELECT * FROM products WHERE product_id = ?', [req.params.id]);
  res.json(mapProduct(row));
}));

app.put('/api/settings', asyncRoute(async (req, res) => {
  const storeName = String(req.body?.storeName || '').trim();
  const currency = req.body?.currency === 'INR' ? 'INR' : 'INR';
  const taxRate = Number(req.body?.taxRate ?? 0);
  const lowStockThreshold = Number(req.body?.lowStockThreshold ?? 10);
  const showTips = req.body?.showTips ? 1 : 0;
  if (!storeName || storeName.length > 80) throw httpError(400, 'Store name is required and must be 80 characters or fewer.');
  if (!Number.isFinite(taxRate) || taxRate < 0 || taxRate > 100) throw httpError(400, 'Tax rate must be between 0 and 100.');
  if (!Number.isInteger(lowStockThreshold) || lowStockThreshold < 0) throw httpError(400, 'Low-stock threshold must be a whole number of zero or more.');

  await pool.execute(
    `INSERT INTO settings (id, store_name, currency, tax_rate, low_stock_threshold, show_tips)
     VALUES (1, ?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE store_name = VALUES(store_name), currency = VALUES(currency),
       tax_rate = VALUES(tax_rate), low_stock_threshold = VALUES(low_stock_threshold), show_tips = VALUES(show_tips)`,
    [storeName, currency, taxRate, lowStockThreshold, showTips]
  );
  const [[row]] = await pool.execute('SELECT * FROM settings WHERE id = 1');
  res.json(mapSettings(row));
}));

app.post('/api/checkout', asyncRoute(async (req, res) => {
  const customer = String(req.body?.customer || 'Walk-in customer').trim().slice(0, 120) || 'Walk-in customer';
  const payment = String(req.body?.payment || 'Cash');
  const allowedPayments = new Set(['Cash', 'UPI', 'Card', 'Other']);
  const items = req.body?.items;
  if (!allowedPayments.has(payment)) throw httpError(400, 'Choose a valid payment method.');
  if (!Array.isArray(items) || items.length === 0 || items.length > 100) throw httpError(400, 'Add at least one item to the bill.');

  const combined = new Map();
  for (const item of items) {
    const productId = String(item.productId || '').trim();
    const qty = Number(item.qty);
    if (!productId || !Number.isInteger(qty) || qty <= 0) throw httpError(400, 'Each sale item needs a product ID and a positive whole-number quantity.');
    combined.set(productId, (combined.get(productId) || 0) + qty);
  }

  const connection = await pool.getConnection();
  let billNo;
  try {
    await connection.beginTransaction();

    // The settings row serializes checkout number generation and keeps the tax setting consistent.
    const [[settingsRow]] = await connection.execute('SELECT * FROM settings WHERE id = 1 FOR UPDATE');
    if (!settingsRow) throw httpError(500, 'Store settings are missing. Refresh the dashboard to initialize the database.');

    const saleItems = [];
    let subtotal = 0;
    for (const [productId, qty] of combined.entries()) {
      const [[productRow]] = await connection.execute(
        'SELECT * FROM products WHERE product_id = ? FOR UPDATE', [productId]
      );
      if (!productRow || productRow.status !== 'active') throw httpError(400, `Product ${productId} is missing or inactive.`);
      if (Number(productRow.stock) < qty) throw httpError(409, `Not enough stock for ${productRow.name}. Available: ${productRow.stock}.`);
      const itemTotal = Number(productRow.price) * qty;
      subtotal += itemTotal;
      saleItems.push({ product: productRow, qty, itemTotal });
    }

    const tax = Math.round((subtotal * (Number(settingsRow.tax_rate) / 100) + Number.EPSILON) * 100) / 100;
    const total = Math.round((subtotal + tax + Number.EPSILON) * 100) / 100;
    const [billRows] = await connection.execute(
      `SELECT MAX(CAST(SUBSTRING(bill_no, 4) AS UNSIGNED)) AS max_bill
       FROM sales WHERE bill_no REGEXP '^MF-[0-9]+$'`
    );
    const nextBillNumber = Math.max(1048, Number(billRows[0]?.max_bill || 0)) + 1;
    billNo = `MF-${nextBillNumber}`;

    const [saleResult] = await connection.execute(
      `INSERT INTO sales (bill_no, customer, subtotal, tax, total, payment_method, sale_date)
       VALUES (?, ?, ?, ?, ?, ?, UTC_TIMESTAMP())`,
      [billNo, customer, subtotal, tax, total, payment]
    );

    for (const item of saleItems) {
      const product = item.product;
      await connection.execute(
        'UPDATE products SET stock = stock - ? WHERE product_id = ? AND stock >= ?',
        [item.qty, product.product_id, item.qty]
      );
      await connection.execute(
        `INSERT INTO sale_items (sale_id, product_id, product_name, unit_price, quantity, line_total)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [saleResult.insertId, product.product_id, product.name, Number(product.price), item.qty, item.itemTotal]
      );
    }

    await connection.commit();
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }

  const latest = await loadBootstrap();
  res.status(201).json({ sale: latest.sales.find((sale) => sale.id === billNo), products: latest.products });
}));

app.post('/api/reset-demo', asyncRoute(async (_req, res) => {
  if (process.env.NODE_ENV === 'production') throw httpError(403, 'Database reset is disabled in production.');
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await seedDemoData(connection, { reset: true });
    await connection.commit();
    res.json({ ok: true, message: 'Demo data restored.' });
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}));

app.use((req, res) => res.status(404).json({ error: `Route not found: ${req.method} ${req.path}` }));
app.use((error, _req, res, _next) => {
  console.error(error);
  const status = Number(error.status) || (error.code === 'ER_DUP_ENTRY' ? 409 : 500);
  const message = status === 500 && process.env.NODE_ENV === 'production'
    ? 'Unexpected server error.'
    : error.message || 'Unexpected server error.';
  res.status(status).json({ error: message });
});

async function start() {
  try {
    await pool.query('SELECT 1');
    console.log('✅ MySQL connection successful.');
    app.listen(PORT, () => console.log(`✅ MarketFlow API running at http://localhost:${PORT}`));
  } catch (error) {
    console.error('❌ Could not connect to MySQL. Check that MySQL is running and your .env values are correct.');
    console.error(error.message);
    process.exit(1);
  }
}

start();
