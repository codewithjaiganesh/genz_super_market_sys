# MarketFlow — pending work checklist

## Included in this setup

- [x] MySQL database and normalized tables for products, sales, sale items, and settings.
- [x] Express API with environment-based database credentials.
- [x] Load dashboard data from MySQL.
- [x] Create, edit, and delete products.
- [x] Restock inventory through the API.
- [x] Save store settings to MySQL.
- [x] Record bills with server-side price/tax calculation and stock updates in one transaction.
- [x] Keep historical product name and price snapshots on bill items.
- [x] Seed sample inventory and bills on the first dashboard load.
- [x] API health endpoint and beginner setup instructions.

## Required before using this with a real store

- [ ] **Authentication:** add secure login, password hashing, session/token expiry, and logout.
- [ ] **Authorization:** enforce Admin/Cashier/Inventory roles in the API, not only in the interface.
- [ ] **Production hosting:** deploy the API and database, configure secrets, HTTPS, CORS, and backups.
- [ ] **Audit trail:** record who changed product details, adjusted stock, or voided a bill.
- [ ] **Business rules:** confirm GST/tax calculations, bill numbering, refund/return handling, and discount permissions for the actual store. The sales trend charts are still illustrative, not computed from historical sales.
- [ ] **Input/security hardening:** rate limiting, request-size limits, secure headers, log sanitization, and operational error monitoring.
- [ ] **Data recovery:** implement verified backups and a restore test.
- [ ] **Migration:** build a validated JSON import flow if browser-only demo data must be transferred.
- [ ] **Testing:** integration tests for duplicate SKUs, negative quantities, low/out-of-stock checkout, concurrent checkout, settings updates, and database failures.
- [ ] **Payments:** connect a payment provider only if needed. The current Cash/UPI/Card fields record a selected method; they do not charge or verify payment.

## First local milestone

- [ ] Execute `database/schema.sql`.
- [ ] Set credentials in `.env`.
- [ ] Run `npm install`, then `npm run check`.
- [ ] Start the API with `npm run dev` and confirm `http://localhost:3000/api/health` returns `ok: true`.
- [ ] Open `index.html` through Live Server and confirm the sample products and sample bills appear.
- [ ] Add a test product, restock it, make a test bill, refresh the page, and confirm the changes remain.
