USE marketflow_db;

SELECT 'products' AS table_name, COUNT(*) AS rows_count FROM products
UNION ALL
SELECT 'sales', COUNT(*) FROM sales
UNION ALL
SELECT 'sale_items', COUNT(*) FROM sale_items
UNION ALL
SELECT 'settings', COUNT(*) FROM settings;

SELECT product_id, name, sku, price, stock, low_stock_threshold, status
FROM products
ORDER BY name;

SELECT bill_no, customer, sale_date, subtotal, tax, total, payment_method
FROM sales
ORDER BY sale_date DESC;
