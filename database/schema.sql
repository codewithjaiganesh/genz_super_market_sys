CREATE DATABASE IF NOT EXISTS marketflow_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE marketflow_db;

CREATE TABLE IF NOT EXISTS products (
  product_id VARCHAR(40) NOT NULL,
  name VARCHAR(90) NOT NULL,
  sku VARCHAR(30) NOT NULL,
  category VARCHAR(60) NOT NULL,
  price DECIMAL(12,2) NOT NULL,
  stock INT UNSIGNED NOT NULL DEFAULT 0,
  low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 10,
  status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
  emoji VARCHAR(12) NOT NULL DEFAULT '📦',
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (product_id),
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category (category),
  KEY idx_products_stock (stock)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sales (
  sale_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  bill_no VARCHAR(40) NOT NULL,
  customer VARCHAR(120) NOT NULL DEFAULT 'Walk-in customer',
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  tax DECIMAL(12,2) NOT NULL DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  payment_method ENUM('Cash', 'UPI', 'Card', 'Other') NOT NULL DEFAULT 'Cash',
  sale_date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (sale_id),
  UNIQUE KEY uq_sales_bill_no (bill_no),
  KEY idx_sales_date (sale_date),
  KEY idx_sales_customer (customer)
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS sale_items (
  sale_item_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  sale_id BIGINT UNSIGNED NOT NULL,
  product_id VARCHAR(40) NULL,
  product_name VARCHAR(90) NOT NULL,
  unit_price DECIMAL(12,2) NOT NULL,
  quantity INT UNSIGNED NOT NULL,
  line_total DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (sale_item_id),
  KEY idx_sale_items_sale (sale_id),
  KEY idx_sale_items_product (product_id),
  CONSTRAINT fk_sale_items_sale FOREIGN KEY (sale_id)
    REFERENCES sales (sale_id) ON DELETE CASCADE,
  CONSTRAINT fk_sale_items_product FOREIGN KEY (product_id)
    REFERENCES products (product_id) ON DELETE SET NULL
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS settings (
  id TINYINT UNSIGNED NOT NULL,
  store_name VARCHAR(80) NOT NULL DEFAULT 'MarketFlow Grocery',
  currency CHAR(3) NOT NULL DEFAULT 'INR',
  tax_rate DECIMAL(5,2) NOT NULL DEFAULT 0,
  low_stock_threshold INT UNSIGNED NOT NULL DEFAULT 10,
  show_tips TINYINT(1) NOT NULL DEFAULT 1,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id)
) ENGINE=InnoDB;

INSERT INTO settings (id, store_name, currency, tax_rate, low_stock_threshold, show_tips)
VALUES (1, 'MarketFlow Grocery', 'INR', 0, 10, 1)
ON DUPLICATE KEY UPDATE id = VALUES(id);
