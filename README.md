# Trade Reconciliation Tool

A tool for reconciling trade data between an **Internal Ledger** (JSON) and a **Bank Settlement** (CSV). It identifies discrepancies by comparing entries using `trade_id` as the shared identifier.

## Getting Started

### Prerequisites

- Node.js 18+
- npm

### Installation

```bash
git clone <repo-url>
cd trade-recon
npm install
```

### Running

```bash
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

## Usage

### 1. Input Data

The app presents two input panels side by side:

- **Internal Ledger** (left) — Upload a `.json` file or paste JSON directly. Expected format:
  ```json
  [
    { "trade_id": "T001", "amount": 100, "asset": "BTC", "status": "completed" },
    { "trade_id": "T002", "amount": 250, "asset": "ETH", "status": "pending" }
  ]
  ```

- **Bank Settlement** (right) — Upload a `.csv` file or paste CSV directly. Expected format:
  ```csv
  trade_id,amount,asset,status
  T001,100,BTC,settled
  T003,500,SOL,settled
  ```

Click **Reconcile** once both inputs have data.

### 2. Review Results

The results screen shows a table with three columns:

| Trade ID | Internal Ledger | Bank Settlement |
|----------|----------------|-----------------|
| T001     | amount: 100... | amount: 100...  |
| T002     | amount: 250... | **Missing**     |
| T003     | **Missing**    | amount: 500...  |

- Rows with discrepancies (trade exists in only one source) are highlighted in red
- Use the **Show all entries** toggle to include matched trades
- **Copy** copies the current view to your clipboard as CSV
- **Download CSV** saves a `reconciliation.csv` file
- **Reset** returns to the input screen (with confirmation)

### 3. Export

Both export options output CSV with columns: `trade_id`, `status`, `ledger_data`, `settlement_data`.

The `status` column values:
- `missing_settlement` — trade exists in the ledger but not in bank settlement
- `missing_ledger` — trade exists in bank settlement but not in the ledger
- `matched` — trade exists in both (only included when "Show all entries" is on)

## Tech Stack

- [Next.js](https://nextjs.org/) (App Router, TypeScript)
- [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- [PapaParse](https://www.papaparse.com/) for CSV parsing

## Project Structure

```
src/
  app/
    page.tsx        # Main page (input + results screens)
    layout.tsx      # Root layout, fonts, metadata
    globals.css     # Theme variables (dark palette)
  lib/
    parse.ts        # JSON and CSV parsing utilities
    reconcile.ts    # Reconciliation logic (compare by trade_id)
  components/ui/    # shadcn/ui components
```
