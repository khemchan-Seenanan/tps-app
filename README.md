# TPS Point of Sale

A Transactional Processing System (TPS) Point-of-Sale web application built with Node.js, Express, and Google Sheets as the database backend.

---

## Features

- Full POS interface with product catalog, shopping cart, and transaction submission
- Transactions are recorded to Google Sheets (one row per line item)
- Daily productivity report with revenue summary, top items, hourly chart, and transaction log
- Offline fallback — if Sheets is unreachable, transactions are saved to localStorage
- Live clock, receipt modal, and toast notifications

---

## Prerequisites

- Node.js 16 or later
- A Google account with access to Google Sheets and Google Cloud Console

---

## Setup

### 1. Install dependencies

```bash
cd tps-app
npm install
```

### 2. Create a Google Sheet

1. Go to [Google Sheets](https://sheets.google.com) and create a new spreadsheet.
2. Rename the default **Sheet1** tab to **Transactions** (right-click the tab → Rename).
3. Copy the spreadsheet ID from the URL:
   ```
   https://docs.google.com/spreadsheets/d/<SPREADSHEET_ID>/edit
   ```

### 3. Create a Google Cloud service account

1. Go to the [Google Cloud Console](https://console.cloud.google.com/).
2. Create a new project (or select an existing one).
3. Enable the **Google Sheets API**:
   - Navigate to **APIs & Services → Library**
   - Search for "Google Sheets API" and click **Enable**
4. Create a service account:
   - Navigate to **APIs & Services → Credentials**
   - Click **Create Credentials → Service Account**
   - Give it a name (e.g., `tps-pos-service`) and click **Done**
5. Generate a JSON key:
   - Click on the service account you just created
   - Go to the **Keys** tab → **Add Key → Create new key → JSON**
   - Download the JSON file and keep it safe

### 4. Share the Google Sheet with the service account

1. Open the JSON key file and find the `client_email` field (looks like `name@project.iam.gserviceaccount.com`).
2. In your Google Sheet, click **Share**.
3. Paste the service account email and grant it **Editor** access.
4. Click **Send** (you can uncheck "Notify people").

### 5. Configure environment variables

```bash
cp .env.example .env
```

Open `.env` and fill in the values:

```env
# The spreadsheet ID from the Google Sheets URL
SPREADSHEET_ID=your_spreadsheet_id_here

# From the service account JSON key file
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@project.iam.gserviceaccount.com

# The private_key field from the JSON — keep the quotes and \n sequences intact
GOOGLE_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\nMIIEo...\n-----END RSA PRIVATE KEY-----\n"

# Optional: port (defaults to 3000)
PORT=3000
```

> **Tip:** Alternatively, you can set `GOOGLE_APPLICATION_CREDENTIALS` to the path of the downloaded JSON key file instead of using the individual email/key variables.

### 6. Start the server

```bash
npm start
```

For development with auto-reload:

```bash
npm install -g nodemon   # only needed once
npm run dev
```

### 7. Open the application

Navigate to [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

### POS Screen

- Use the **category sidebar** on the left to filter products.
- Use the **search bar** to find products by name, code, or item number.
- Click any **product card** to add it to the cart. Click again to increment quantity.
- Adjust quantities with the **+/−** buttons in the cart, or remove items with **✕**.
- Fill in the **Cashier**, **Payment Method**, and optional **Notes** fields.
- Click **SUBMIT TRANSACTION** to post the sale to Google Sheets and display a receipt.

### Daily Report

- Click the **Daily Report** tab at the bottom.
- Select a date (defaults to today) and click **↻ Refresh**.
- View summary stats, hourly revenue breakdown, top items, and the full transaction log.

---

## Google Sheets Column Layout

The `Transactions` sheet uses these columns (auto-created on first startup):

| A | B | C | D | E | F | G | H | I | J | K | L |
|---|---|---|---|---|---|---|---|---|---|---|---|
| Transaction ID | Date | Time | Cashier | Item Code | Item Number | Description | Quantity | Unit Price | Total Price | Payment Method | Notes |

Each transaction generates **one row per line item**. Multiple rows with the same Transaction ID belong to the same sale.

---

## Project Structure

```
tps-app/
├── package.json        — dependencies and npm scripts
├── server.js           — Express server, API routes, Google Sheets integration
├── .env.example        — environment variable template
├── public/
│   └── index.html      — complete single-page POS frontend
└── README.md           — this file
```

---

## Troubleshooting

| Symptom | Fix |
|---------|-----|
| `GOOGLE_APPLICATION_CREDENTIALS` / credential errors at startup | Check that `.env` is populated correctly and the private key includes the full header/footer and uses `\n` for newlines. |
| "The caller does not have permission" | Make sure the service account email has **Editor** access to the sheet. |
| Sheet tab not found | Confirm the tab is named exactly `Transactions` (case-sensitive). |
| Port already in use | Change `PORT=3001` (or any free port) in `.env`. |
| Transactions saved locally / offline mode | The server cannot reach Google Sheets. Check credentials, spreadsheet ID, and network connectivity. Offline transactions are stored in the browser's `localStorage` under the key `tps_offline_transactions`. |
