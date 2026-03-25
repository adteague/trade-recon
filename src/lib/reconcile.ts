import { TradeRecord } from "./parse";

export interface ReconcileResult {
  onlyInLedger: TradeRecord[];
  onlyInSettlement: TradeRecord[];
  matched: { ledger: TradeRecord; settlement: TradeRecord }[];
}

export function reconcile(
  ledger: TradeRecord[],
  settlement: TradeRecord[]
): ReconcileResult {
  const ledgerMap = new Map<string, TradeRecord>();
  for (const entry of ledger) {
    ledgerMap.set(String(entry.trade_id), entry);
  }

  const settlementMap = new Map<string, TradeRecord>();
  for (const entry of settlement) {
    settlementMap.set(String(entry.trade_id), entry);
  }

  const onlyInLedger: TradeRecord[] = [];
  const matched: { ledger: TradeRecord; settlement: TradeRecord }[] = [];

  for (const [tradeId, entry] of ledgerMap) {
    const settlementEntry = settlementMap.get(tradeId);
    if (settlementEntry) {
      matched.push({ ledger: entry, settlement: settlementEntry });
    } else {
      onlyInLedger.push(entry);
    }
  }

  const onlyInSettlement: TradeRecord[] = [];
  for (const [tradeId, entry] of settlementMap) {
    if (!ledgerMap.has(tradeId)) {
      onlyInSettlement.push(entry);
    }
  }

  return { onlyInLedger, onlyInSettlement, matched };
}
