# MarketFlow — MySQL database + Express backend

This folder connects the uploaded MarketFlow HTML/CSS/JavaScript dashboard to a MySQL database. It keeps the existing dashboard design and adds an Express API. Product changes, restocking, checkout, bills, and store settings are saved to MySQL rather than `localStorage`.

> **Important:** This is a development/starter backend. It does not include user login, staff roles, audit trails, or real payment processing. Do not use it for real customer or payment data until the items in `PENDING_WORK.md` are completed.

## 1. Project files

- `index.html`, `style.css`, `script.js` — the MarketFlow frontend. `script.js` calls the API at `http://localhost:3000/api` by default.
- `server.js` — Express API and MySQL queries.
- `database/schema.sql` — creates the database and tables.
- `.env.example` — template for database connection details.
- `.gitignore` — prevents `.env` and `node_modules` from being committed.

## 2. Install the required software

1. Install **Node.js LTS** from <https://nodejs.org/>.
2. Install **MySQL Server** and optionally MySQL Workbench from <https://dev.mysql.com/downloads/>.
3. Open VS Code and use **File → Open Folder** to open this `marketflow-db-setup` folder.
4. In VS Code, open **Terminal → New Terminal**.

Confirm the tools are installed:

```powershell
node --version
npm --version
```

If either command is not recognized, close and reopen VS Code after installing Node.js. MySQL can be configured through Workbench even if the `mysql` terminal command is not available.

## 3. Create the database tables

### Option A — MySQL Workbench (recommended for beginners)

1. Open MySQL Workbench and connect to your local MySQL server.
2. In VS Code, open `database/schema.sql`.
3. Copy the entire file and paste it into a new SQL tab in Workbench, or use **File → Open SQL Script** to open it directly.
4. Click the lightning-bolt **Execute** button.
5. In Workbench, refresh the Schemas panel. You should see `marketflow_db` with `products`, `sales`, `sale_items`, and `settings` tables.

The schema script creates the database and tables; the API adds the sample products and five sample bills the first time the dashboard calls `/api/bootstrap`.

### Option B — terminal

In **Command Prompt** with the MySQL command available:

```cmd
mysql -u root -p < database/schema.sql
```

In **PowerShell**:

```powershell
Get-Content .\database\schema.sql | mysql -u root -p
```

Enter your MySQL password when prompted. If Windows says `mysql` is not recognized, use Workbench or add MySQL's `bin` directory to PATH.

## 4. Configure the backend

In the VS Code terminal, while the terminal is in the project folder, run:

```powershell
Copy-Item .env.example .env
```

Open `.env` in VS Code and set `DB_PASSWORD` to the password for your local MySQL account. For example:

```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_actual_mysql_password
DB_NAME=marketflow_db
API_PORT=3000
CORS_ORIGIN=http://127.0.0.1:5500,http://localhost:5500,http://127.0.0.1:5501,http://localhost:5501
NODE_ENV=development
```

If your MySQL `root` account has no password, use `DB_PASSWORD=`. Do not include quotes around the value. Keep `.env` private and never commit it to GitHub.

## 5. Install dependencies and start the API

Run these commands in the project folder:

```powershell
npm install
npm run check
npm run dev
```

Expected startup messages:

```text
✅ MySQL connection successful.
✅ MarketFlow API running at http://localhost:3000
```

Keep this terminal open while using the website. The development command restarts the server when `server.js` changes.

## 6. Start the frontend

1. Install the **Live Server** extension in VS Code if you do not already have it.
2. Right-click `index.html` and select **Open with Live Server**.
3. The dashboard should open at a local URL such as `http://127.0.0.1:5500`.
4. On its first successful load, the API creates starter data in MySQL if the product table is empty.

You can verify the API directly by opening <http://localhost:3000/api/health>. It should return JSON containing `"ok": true` and `"database": "connected"`.

### If the dashboard says it cannot connect

- Confirm the backend terminal is still running.
- Confirm the API health URL works.
- Confirm MySQL Server is running.
- Recheck `DB_PASSWORD` and the database name in `.env`.
- Ensure you executed `database/schema.sql` in the same MySQL server to which the `.env` file connects.
- Restart the backend after changing `.env` with `Ctrl+C`, then `npm run dev`.

## 7. What is stored in MySQL?

| Table | Purpose |
|---|---|
| `products` | Product catalogue, SKU, price, stock, category, and low-stock threshold |
| `sales` | Bill number, customer label, date, subtotal, tax, total, and payment method |
| `sale_items` | Product-name/price snapshots and quantities for each historical bill |
| `settings` | Store name, currency, tax rate, default low-stock threshold, and quick-guide preference |

Checkout prices and tax are recalculated on the server. A MySQL transaction locks the relevant stock rows, verifies quantities, writes the bill and bill items, and decrements stock together. This reduces the risk of overselling due to simultaneous checkouts. It is a demo implementation and still needs authentication and production security controls.

## 8. API routes included

- `GET /api/health` — checks the API and database connection.
- `GET /api/bootstrap` — returns dashboard data; inserts starter sample data if the product catalogue is empty.
- `GET /api/products` — lists products.
- `POST /api/products` — creates a product.
- `PUT /api/products/:id` — updates a product.
- `DELETE /api/products/:id` — removes a product while preserving historical bill item names.
- `POST /api/products/:id/restock` — increments stock.
- `PUT /api/settings` — saves store preferences.
- `POST /api/checkout` — creates a bill and updates inventory in a transaction.
- `POST /api/reset-demo` — deletes demo records and restores sample data. The dashboard prompts before doing this; it resets shared database data, not just one browser.

## 9. GitHub and deployment notes

Before pushing to GitHub, check that `.env` is not staged. `.gitignore` excludes it and `node_modules/`.

The frontend and API can be deployed separately, but the frontend must use a publicly reachable API URL and the backend must be able to connect to the hosted MySQL server. When deploying the frontend, add this small configuration block **before** the `script.js` tag in `index.html` and replace the example URL with your deployed API URL:

```html
<script>
  window.MARKETFLOW_API_URL = "https://YOUR-BACKEND-DOMAIN/api";
</script>
<script src="script.js"></script>
```

Also set `CORS_ORIGIN` on the backend to the exact frontend origin (for example, your Vercel domain). Never put MySQL credentials or other secrets in frontend JavaScript. A static website cannot safely connect directly to MySQL.

Do not deploy the backend with `DB_HOST=127.0.0.1` unless MySQL is running in the same deployment environment; for hosted deployment, configure the host, port, username, password, and database from your database provider.

## 10. Existing browser demo data

The old version stored changes in that browser's `localStorage`. This connected version starts from the sample dataset in MySQL; it does not automatically migrate any custom products or bills saved by the old version. Before switching, use the old dashboard's **Export data** option to save a JSON backup if you need to preserve those browser-only changes. The current backend does not yet include a JSON import screen.
