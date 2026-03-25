import Papa from "papaparse";

export type TradeRecord = Record<string, string | number | boolean | null>;

export function parseLedgerJSON(raw: string): TradeRecord[] {
  const parsed = JSON.parse(raw);
  const arr = Array.isArray(parsed) ? parsed : [parsed];
  for (const item of arr) {
    if (typeof item !== "object" || item === null || !("trade_id" in item)) {
      throw new Error(
        "Each entry in the Internal Ledger must be an object with a 'trade_id' field."
      );
    }
  }
  return arr;
}

export function parseSettlementCSV(raw: string): TradeRecord[] {
  const result = Papa.parse<TradeRecord>(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: true,
  });
  if (result.errors.length > 0) {
    const first = result.errors[0];
    throw new Error(`CSV parse error (row ${first.row}): ${first.message}`);
  }
  if (result.data.length === 0) {
    throw new Error("CSV file contains no data rows.");
  }
  if (!("trade_id" in result.data[0])) {
    throw new Error(
      "Bank Settlement CSV must contain a 'trade_id' column header."
    );
  }
  return result.data;
}
