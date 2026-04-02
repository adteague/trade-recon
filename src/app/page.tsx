"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { parseLedgerJSON, parseSettlementCSV, TradeRecord } from "@/lib/parse";
import { reconcile, ReconcileResult } from "@/lib/reconcile";

// ---------------------------------------------------------------------------
// Input Screen
// ---------------------------------------------------------------------------

function InputScreen({
  onReconcile,
}: {
  onReconcile: (result: ReconcileResult) => void;
}) {
  const [ledgerRaw, setLedgerRaw] = useState("");
  const [settlementRaw, setSettlementRaw] = useState("");
  const [error, setError] = useState<string | null>(null);
  const ledgerFileRef = useRef<HTMLInputElement>(null);
  const settlementFileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    (
      setter: (v: string) => void,
      accept: string
    ) =>
      (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => setter(reader.result as string);
        reader.readAsText(file);
      },
    []
  );

  // Drag-and-drop
  const [isDragging, setIsDragging] = useState(false);
  const [dragMime, setDragMime] = useState<string | null>(null);
  const dragCounterRef = useRef(0);

  const dragFileType: "json" | "csv" | "unknown" =
    dragMime === "application/json"
      ? "json"
      : dragMime === "text/csv" || dragMime === "text/comma-separated-values"
        ? "csv"
        : "unknown";

  useEffect(() => {
    const onDragEnter = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current++;
      if (dragCounterRef.current === 1) {
        setIsDragging(true);
        const item = e.dataTransfer?.items?.[0];
        setDragMime(item?.type || null);
      }
    };
    const onDragLeave = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current--;
      if (dragCounterRef.current === 0) {
        setIsDragging(false);
        setDragMime(null);
      }
    };
    const onDragOver = (e: DragEvent) => {
      e.preventDefault();
    };
    const onDrop = (e: DragEvent) => {
      e.preventDefault();
      dragCounterRef.current = 0;
      setIsDragging(false);
      setDragMime(null);
    };

    window.addEventListener("dragenter", onDragEnter);
    window.addEventListener("dragleave", onDragLeave);
    window.addEventListener("dragover", onDragOver);
    window.addEventListener("drop", onDrop);
    return () => {
      window.removeEventListener("dragenter", onDragEnter);
      window.removeEventListener("dragleave", onDragLeave);
      window.removeEventListener("dragover", onDragOver);
      window.removeEventListener("drop", onDrop);
    };
  }, []);

  const handleZoneDrop = useCallback(
    (setter: (v: string) => void, zone: "json" | "csv") =>
      (e: React.DragEvent) => {
        e.preventDefault();
        const file = e.dataTransfer.files?.[0];
        if (!file) return;

        // Check MIME type — reject mismatches
        const mime = file.type;
        const isJson = mime === "application/json" || file.name.endsWith(".json");
        const isCsv =
          mime === "text/csv" ||
          mime === "text/comma-separated-values" ||
          file.name.endsWith(".csv");

        if (zone === "json" && !isJson && isCsv) {
          toast.error("Wrong file type", {
            description: "This zone accepts .json files — drop your .csv on the other card.",
          });
          return;
        }
        if (zone === "csv" && !isCsv && isJson) {
          toast.error("Wrong file type", {
            description: "This zone accepts .csv files — drop your .json on the other card.",
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = () => setter(reader.result as string);
        reader.readAsText(file);
      },
    []
  );

  const handleReconcile = () => {
    setError(null);
    try {
      const ledger = parseLedgerJSON(ledgerRaw);
      const settlement = parseSettlementCSV(settlementRaw);
      const result = reconcile(ledger, settlement);
      onReconcile(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : String(err));
    }
  };

  const canReconcile = ledgerRaw.trim().length > 0 && settlementRaw.trim().length > 0;

  return (
    <div className="flex flex-col gap-8 w-full max-w-6xl mx-auto">
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-semibold tracking-tight">Trade Reconciliation</h1>
        <p className="text-muted-foreground text-sm">
          Upload or paste your Internal Ledger (JSON) and Bank Settlement (CSV),
          then click Reconcile.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Internal Ledger */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-colors">
          <CardHeader>
            <CardTitle className="text-lg font-medium tracking-tight">Internal Ledger</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <input
              ref={ledgerFileRef}
              type="file"
              accept=".json,application/json"
              className="hidden"
              onChange={handleFile(setLedgerRaw, ".json")}
            />
            {isDragging ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed min-h-48 transition-colors",
                  dragFileType !== "csv"
                    ? "border-primary/60 bg-primary/5"
                    : "border-destructive/60 bg-destructive/5"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleZoneDrop(setLedgerRaw, "json")}
              >
                <span
                  className={cn(
                    "text-3xl font-bold",
                    dragFileType !== "csv" ? "text-primary" : "text-destructive"
                  )}
                >
                  .JSON
                </span>
                <span
                  className={cn(
                    "text-sm",
                    dragFileType !== "csv"
                      ? "text-primary/70"
                      : "text-destructive/70"
                  )}
                >
                  {dragFileType === "csv"
                    ? "Expects .json file"
                    : "Drop file here"}
                </span>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => ledgerFileRef.current?.click()}
                >
                  Upload JSON file
                </Button>
                <div className="text-xs text-muted-foreground text-center">or paste below</div>
                <Textarea
                  placeholder='[{"trade_id": "T001", "amount": 100, ...}]'
                  className="min-h-28 max-h-80 font-mono text-xs"
                  value={ledgerRaw}
                  onChange={(e) => setLedgerRaw(e.target.value)}
                />
              </>
            )}
          </CardContent>
        </Card>

        {/* Bank Settlement */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm transition-colors">
          <CardHeader>
            <CardTitle className="text-lg font-medium tracking-tight">Bank Settlement</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <input
              ref={settlementFileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={handleFile(setSettlementRaw, ".csv")}
            />
            {isDragging ? (
              <div
                className={cn(
                  "flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed min-h-48 transition-colors",
                  dragFileType !== "json"
                    ? "border-primary/60 bg-primary/5"
                    : "border-destructive/60 bg-destructive/5"
                )}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleZoneDrop(setSettlementRaw, "csv")}
              >
                <span
                  className={cn(
                    "text-3xl font-bold",
                    dragFileType !== "json" ? "text-primary" : "text-destructive"
                  )}
                >
                  .CSV
                </span>
                <span
                  className={cn(
                    "text-sm",
                    dragFileType !== "json"
                      ? "text-primary/70"
                      : "text-destructive/70"
                  )}
                >
                  {dragFileType === "json"
                    ? "Expects .csv file"
                    : "Drop file here"}
                </span>
              </div>
            ) : (
              <>
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => settlementFileRef.current?.click()}
                >
                  Upload CSV file
                </Button>
                <div className="text-xs text-muted-foreground text-center">or paste below</div>
                <Textarea
                  placeholder="trade_id,amount,status&#10;T001,100,settled"
                  className="min-h-28 max-h-80 font-mono text-xs"
                  value={settlementRaw}
                  onChange={(e) => setSettlementRaw(e.target.value)}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <Button
        size="lg"
        className="mx-auto px-12 rounded-full"
        disabled={!canReconcile}
        onClick={handleReconcile}
      >
        Reconcile
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Results Screen
// ---------------------------------------------------------------------------

function formatFields(record: TradeRecord): string {
  return Object.entries(record)
    .filter(([k]) => k !== "trade_id")
    .map(([k, v]) => `${k}: ${v}`)
    .join(", ");
}

function buildCsv(rows: { tradeId: string; ledger: TradeRecord | null; settlement: TradeRecord | null; status: string }[]): string {
  const lines = ["trade_id,status,ledger_data,settlement_data"];
  for (const row of rows) {
    const ledgerStr = row.ledger ? formatFields(row.ledger) : "";
    const settlementStr = row.settlement ? formatFields(row.settlement) : "";
    lines.push(
      `${row.tradeId},${row.status},"${ledgerStr.replace(/"/g, '""')}","${settlementStr.replace(/"/g, '""')}"`
    );
  }
  return lines.join("\n");
}

function ResultsScreen({
  result,
  onReset,
}: {
  result: ReconcileResult;
  onReset: () => void;
}) {
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const discrepancyCount =
    result.onlyInLedger.length + result.onlyInSettlement.length;

  type Row = {
    tradeId: string;
    ledger: TradeRecord | null;
    settlement: TradeRecord | null;
    status: "missing_settlement" | "missing_ledger" | "matched";
  };

  const rows: Row[] = [];

  for (const entry of result.onlyInLedger) {
    rows.push({
      tradeId: String(entry.trade_id),
      ledger: entry,
      settlement: null,
      status: "missing_settlement",
    });
  }

  for (const entry of result.onlyInSettlement) {
    rows.push({
      tradeId: String(entry.trade_id),
      ledger: null,
      settlement: entry,
      status: "missing_ledger",
    });
  }

  if (showAll) {
    for (const { ledger, settlement } of result.matched) {
      rows.push({
        tradeId: String(ledger.trade_id),
        ledger,
        settlement,
        status: "matched",
      });
    }
  }

  rows.sort((a, b) => a.tradeId.localeCompare(b.tradeId));

  return (
    <div className="flex flex-col gap-6 w-full max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Reconciliation Results</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {discrepancyCount === 0
              ? "All trades matched!"
              : `${discrepancyCount} discrepanc${discrepancyCount === 1 ? "y" : "ies"} found`}
            {" \u00B7 "}
            {result.matched.length} matched
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Switch
              id="show-all"
              checked={showAll}
              onCheckedChange={setShowAll}
            />
            <label htmlFor="show-all" className="text-sm cursor-pointer">
              Show all entries
            </label>
          </div>
          <Button
            variant="outline"
            onClick={() => {
              const csv = buildCsv(rows);
              navigator.clipboard.writeText(csv).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              });
            }}
          >
            {copied ? "Copied!" : "Copy"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              const csv = buildCsv(rows);
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "reconciliation.csv";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Download CSV
          </Button>
          <AlertDialog>
            <AlertDialogTrigger render={<Button variant="outline" />}>
              Reset
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Reset reconciliation?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will clear all data and return to the input screen.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={onReset}>Reset</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>

      {/* Summary badges */}
      <div className="flex gap-3 flex-wrap">
        <Badge variant="destructive">
          Only in Ledger: {result.onlyInLedger.length}
        </Badge>
        <Badge variant="destructive">
          Only in Settlement: {result.onlyInSettlement.length}
        </Badge>
        <Badge variant="secondary">Matched: {result.matched.length}</Badge>
      </div>

      {/* Results table */}
      <div className="rounded-lg border border-border/50 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-35">Trade ID</TableHead>
              <TableHead>Internal Ledger</TableHead>
              <TableHead>Bank Settlement</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                  No discrepancies found. Toggle &ldquo;Show all entries&rdquo; to
                  see matched trades.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow
                  key={row.tradeId}
                  className={
                    row.status === "matched"
                      ? ""
                      : "bg-destructive/15"
                  }
                >
                  <TableCell className="font-mono font-medium">
                    {row.tradeId}
                  </TableCell>
                  <TableCell>
                    {row.ledger ? (
                      <span className="text-xs font-mono">
                        {formatFields(row.ledger)}
                      </span>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Missing
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {row.settlement ? (
                      <span className="text-xs font-mono">
                        {formatFields(row.settlement)}
                      </span>
                    ) : (
                      <Badge variant="destructive" className="text-xs">
                        Missing
                      </Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function Home() {
  const [result, setResult] = useState<ReconcileResult | null>(null);

  return (
    <div className="min-h-screen py-12 px-6">
      {result ? (
        <ResultsScreen result={result} onReset={() => setResult(null)} />
      ) : (
        <InputScreen onReconcile={setResult} />
      )}
    </div>
  );
}
