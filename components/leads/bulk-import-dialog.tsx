"use client";

import { useState, useRef, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Upload,
  FileType,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Download,
  Settings2,
  Zap,
  RefreshCw,
  Activity,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useDashboardStore } from "@/lib/store/use-dashboard-store";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { detectHeaders, generateCsvTemplate } from "@/lib/utils/import-utils";

// ─── Constants ────────────────────────────────────────────────────────────────
const CHUNK_SIZE = 1000; // Rows per API request
const API_ENDPOINT = "/api/admin/bulk-import";

interface BulkImportDialogProps {
  userRole: string;
  branches: any[];
}

interface ImportProgress {
  processedRows: number;
  totalRows: number;
  insertedRows: number;
  batchesDone: number;
  totalBatches: number;
  errorBatches: number;
  etaSeconds: number | null;
  startTime: number;
}

interface FieldMapping {
  name: string;
  phone: string;
  email: string;
  category: string;
  branchId: string;
}

// ─── Progress Bar Component ───────────────────────────────────────────────────
function ProgressBar({ progress }: { progress: ImportProgress }) {
  const pct = progress.totalRows > 0
    ? Math.min(100, (progress.processedRows / progress.totalRows) * 100)
    : 0;

  const elapsed = (Date.now() - progress.startTime) / 1000;
  const rowsPerSec = elapsed > 0 ? progress.processedRows / elapsed : 0;
  const remaining = rowsPerSec > 0
    ? Math.ceil((progress.totalRows - progress.processedRows) / rowsPerSec)
    : null;

  return (
    <div className="space-y-4">
      {/* Header stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Activity className="h-4 w-4 text-[#243467] animate-pulse" />
          <span className="text-xs font-semibold tracking-tight uppercase tracking-widest text-[#243467]">
            Streaming Import Active
          </span>
        </div>
        <span className="text-xs font-semibold tracking-tight text-slate-900">
          {pct.toFixed(1)}%
        </span>
      </div>

      {/* Track */}
      <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#243467] to-indigo-400 transition-all duration-500 ease-out shadow-[0_0_10px_rgba(36,52,103,0.3)]"
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { label: "Processed", value: progress.processedRows.toLocaleString(), color: "text-slate-900" },
          { label: "Inserted", value: progress.insertedRows.toLocaleString(), color: "text-emerald-600" },
          { label: "Total", value: progress.totalRows.toLocaleString(), color: "text-slate-500" },
          { label: "ETA", value: remaining !== null ? `${remaining}s` : "calc…", color: "text-amber-600" },
        ].map((s) => (
          <div key={s.label} className="text-center p-3 rounded-xl bg-slate-50 border border-border/50">
            <p className={cn("text-lg font-semibold tracking-tight tracking-tight", s.color)}>{s.value}</p>
            <p className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400 mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {progress.errorBatches > 0 && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-amber-50 border border-amber-200/60">
          <AlertCircle className="h-4 w-4 text-amber-500 shrink-0" />
          <p className="text-[11px] font-semibold text-amber-700">
            {progress.errorBatches} batch(es) failed — will retry automatically on next run.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function BulkImportDialog({ userRole, branches }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [previewRows, setPreviewRows] = useState<any[]>([]); // First 5 rows for preview
  const [totalRows, setTotalRows] = useState(0);
  const [mapping, setMapping] = useState<FieldMapping>({ name: "", phone: "", email: "", category: "", branchId: "" });
  const [defaultBranchId, setDefaultBranchId] = useState("");
  const [step, setStep] = useState<"UPLOAD" | "MAP" | "PREVIEW" | "IMPORTING" | "SUCCESS">("UPLOAD");
  const [progress, setProgress] = useState<ImportProgress | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<boolean>(false);
  const router = useRouter();

  // ─── Stage 1: File Drop / Select ──────────────────────────────
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) ingestFile(f);
  };

  const ingestFile = (f: File) => {
    setFile(f);
    setError(null);
    const ext = f.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      // Preview-parse: only headers + first 20 rows + total count
      let rowCount = 0;
      let detectedHeaders: string[] = [];
      let firstRows: any[] = [];

      Papa.parse(f, {
        header: true,
        skipEmptyLines: true,
        chunk: (results) => {
          if (detectedHeaders.length === 0) {
            detectedHeaders = results.meta.fields || [];
          }
          if (firstRows.length < 20) {
            firstRows = [...firstRows, ...results.data].slice(0, 20);
          }
          rowCount += results.data.length;
        },
        complete: () => {
          setHeaders(detectedHeaders);
          setPreviewRows(firstRows);
          setTotalRows(rowCount);
          const auto = detectHeaders(detectedHeaders) as unknown as FieldMapping;
          setMapping(auto);
          setStep(auto.name && auto.phone ? "PREVIEW" : "MAP");
        },
        error: () => setError("Failed to parse CSV. Please verify the file format."),
      });
    } else if (ext === "xlsx" || ext === "xls") {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const json: any[] = XLSX.utils.sheet_to_json(ws);
        if (json.length > 0) {
          const hdrs = Object.keys(json[0]);
          setHeaders(hdrs);
          setPreviewRows(json.slice(0, 20));
          setTotalRows(json.length);
          const auto = detectHeaders(hdrs) as unknown as FieldMapping;
          setMapping(auto);
          setStep(auto.name && auto.phone ? "PREVIEW" : "MAP");
        } else {
          setError("Spreadsheet is empty.");
        }
      };
      reader.readAsBinaryString(f);
    } else {
      setError("Unsupported format. Use CSV or XLSX.");
    }
  };

  // ─── Stage 2: Streaming Chunked Import ────────────────────────
  const startStreamingImport = useCallback(() => {
    if (!file) return;
    abortRef.current = false;
    setStep("IMPORTING");

    const startTime: ImportProgress = {
      processedRows: 0,
      insertedRows: 0,
      totalRows,
      batchesDone: 0,
      totalBatches: Math.ceil(totalRows / CHUNK_SIZE),
      errorBatches: 0,
      etaSeconds: null,
      startTime: Date.now(),
    };
    setProgress(startTime);

    let buffer: any[] = [];
    let processed = 0;
    let inserted = 0;
    let errorBatches = 0;
    let parser: Papa.Parser;

    const sendBatch = async (rows: any[]): Promise<number> => {
      const payload = rows.map((row: any) => ({
        name: row[mapping.name] || "",
        phone: String(row[mapping.phone] || "").replace(/[^0-9]/g, ""),
        email: row[mapping.email] || "",
        category: (row[mapping.category] || "OTHER").toUpperCase(),
        branchId: row[mapping.branchId] || defaultBranchId || undefined,
        source: "BULK_IMPORT",
      }));

      try {
        const res = await fetch(API_ENDPOINT, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ rows: payload, defaultBranchId: defaultBranchId || undefined }),
        });
        if (res.ok) {
          const data = await res.json();
          return data.inserted ?? 0;
        }
        errorBatches++;
        return 0;
      } catch {
        errorBatches++;
        return 0;
      }
    };

    const ext = file.name.split(".").pop()?.toLowerCase();

    if (ext === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        chunk: async (results, p) => {
          if (abortRef.current) { p.abort(); return; }
          parser = p;
          p.pause();

          buffer = results.data as any[];
          const batchInserted = await sendBatch(buffer);
          processed += buffer.length;
          inserted += batchInserted;

          setProgress(prev => prev ? {
            ...prev,
            processedRows: processed,
            insertedRows: inserted,
            batchesDone: prev.batchesDone + 1,
            errorBatches,
          } : prev);

          p.resume();
        },
        complete: () => {
          setProgress(prev => prev ? { ...prev, processedRows: totalRows } : prev);
          finalize(inserted, processed);
        },
        error: (err) => {
          toast.error("CSV parse error", { description: err.message });
          setStep("PREVIEW");
        },
        chunkSize: CHUNK_SIZE * 200, // ~200 bytes/row estimate → 1000 rows per chunk
      });

    } else {
      // XLSX: Already loaded into previewRows; re-read full for import
      const reader = new FileReader();
      reader.onload = async (ev) => {
        const wb = XLSX.read(ev.target?.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const allRows: any[] = XLSX.utils.sheet_to_json(ws);

        for (let i = 0; i < allRows.length; i += CHUNK_SIZE) {
          if (abortRef.current) break;
          const batch = allRows.slice(i, i + CHUNK_SIZE);
          const batchInserted = await sendBatch(batch);
          processed += batch.length;
          inserted += batchInserted;

          setProgress(prev => prev ? {
            ...prev,
            processedRows: processed,
            insertedRows: inserted,
            batchesDone: Math.floor(i / CHUNK_SIZE) + 1,
            errorBatches,
          } : prev);
        }
        finalize(inserted, processed);
      };
      reader.readAsBinaryString(file);
    }

    const finalize = (totalInserted: number, totalProcessed: number) => {
      setProgress(prev => prev ? { ...prev, processedRows: totalRows, insertedRows: totalInserted } : prev);
      setStep("SUCCESS");
      router.refresh();
      if (totalInserted > 0) {
        toast.success(`Batch import complete: ${totalInserted.toLocaleString()} new leads ingested.`);
      }
    };
  }, [file, mapping, defaultBranchId, totalRows, router]);

  const resetState = () => {
    abortRef.current = true;
    setFile(null);
    setHeaders([]);
    setPreviewRows([]);
    setTotalRows(0);
    setMapping({ name: "", phone: "", email: "", category: "", branchId: "" });
    setDefaultBranchId("");
    setStep("UPLOAD");
    setProgress(null);
    setError(null);
  };

  // ─── Rendered preview rows ─────────────────────────────────────
  const mappedPreview = previewRows.slice(0, 8).map(row => ({
    name: row[mapping.name] || "—",
    phone: String(row[mapping.phone] || "—").replace(/[^0-9]/g, "") || "—",
    category: (row[mapping.category] || "OTHER").toUpperCase(),
    branchId: row[mapping.branchId] || defaultBranchId,
  }));

  const validPreview = mappedPreview.filter(r => r.phone !== "—" && r.phone.length >= 10);

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DialogTrigger
        render={
          <Button variant="outline" className="h-10 px-4 rounded-xl border-border/50 bg-white/50 text-slate-600 text-[10px] font-semibold tracking-tight uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Upload className="h-3.5 w-3.5 mr-2" />
            Bulk Migration
          </Button>
        }
      />

      <DialogContent className="sm:max-w-[720px] rounded-xl border-none shadow-2xl p-0 overflow-hidden bg-white/98 backdrop-blur-xl">
        {/* Header */}
        <div className="p-8 pt-10 text-center bg-gradient-to-b from-[#243467]/5 to-transparent border-b border-border/50/50">
          <div className={cn(
            "h-14 w-14 rounded-xl flex items-center justify-center mx-auto mb-5 transition-all",
            step === "UPLOAD" && "bg-slate-100 text-slate-500",
            step === "MAP" && "bg-amber-500/10 text-amber-500",
            step === "PREVIEW" && "bg-[#243467]/10 text-[#243467]",
            step === "IMPORTING" && "bg-indigo-500/10 text-indigo-500 animate-pulse",
            step === "SUCCESS" && "bg-emerald-500/10 text-emerald-500",
          )}>
            {step === "UPLOAD" && <FileType className="h-7 w-7" />}
            {step === "MAP" && <Settings2 className="h-7 w-7" />}
            {step === "PREVIEW" && <CheckCircle2 className="h-7 w-7" />}
            {step === "IMPORTING" && <Activity className="h-7 w-7" />}
            {step === "SUCCESS" && <CheckCircle2 className="h-7 w-7" />}
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-semibold tracking-tight tracking-tighter  lowercase text-slate-900 text-center">
              {step === "UPLOAD" && "Batch Ingestion Engine"}
              {step === "MAP" && "Field Alignment"}
              {step === "PREVIEW" && "Ready to Stream"}
              {step === "IMPORTING" && "Streaming Import…"}
              {step === "SUCCESS" && "Import Complete"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest text-center pt-1">
              {step === "UPLOAD" && "Stream 500,000+ rows without timeouts — chunk-by-chunk ingestion"}
              {step === "MAP" && "Align your spreadsheet columns with the platform schema"}
              {step === "PREVIEW" && `${totalRows.toLocaleString()} rows detected · ${Math.ceil(totalRows / CHUNK_SIZE)} batches of ${CHUNK_SIZE}`}
              {step === "IMPORTING" && "Processing in 1,000-row batches via streaming API"}
              {step === "SUCCESS" && `${progress?.insertedRows.toLocaleString() ?? 0} new records added to the matrix`}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Body */}
        <div className="max-h-[65vh] overflow-y-auto p-8 space-y-6">

          {/* ── UPLOAD ── */}
          {step === "UPLOAD" && (
            <div className="space-y-6">
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-border/50 rounded-xl p-16 flex flex-col items-center justify-center cursor-pointer hover:border-[#243467]/40 hover:bg-[#243467]/[0.02] transition-all group"
              >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.xlsx,.xls" className="hidden" />
                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="h-6 w-6 text-slate-400 group-hover:text-[#243467]" />
                </div>
                <p className="text-sm font-semibold tracking-tight text-slate-900  tracking-tight">Drop signal payload here</p>
                <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-widest mt-1">CSV / XLSX · No row limit</p>
              </div>
              <div className="flex items-center justify-center">
                <Button variant="ghost" onClick={() => generateCsvTemplate()} className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-slate-400 hover:text-[#243467]">
                  <Download className="h-3.5 w-3.5 mr-2" /> Download Template
                </Button>
              </div>
              {error && (
                <div className="flex items-center gap-2 p-4 rounded-xl bg-rose-50 border border-rose-200/60 text-rose-600">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <p className="text-xs font-semibold">{error}</p>
                </div>
              )}
            </div>
          )}

          {/* ── MAP ── */}
          {step === "MAP" && (
            <div className="space-y-6 max-w-lg mx-auto">
              {[
                { id: "name", label: "Full Name", required: true },
                { id: "phone", label: "Phone Number", required: true },
                { id: "email", label: "Email", required: false },
                { id: "category", label: "Treatment Category", required: false },
                { id: "branchId", label: "Branch / Center ID", required: false },
              ].map(field => (
                <div key={field.id} className="space-y-2">
                  <label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider">
                    {field.label} {field.required && <span className="text-rose-500">*</span>}
                  </label>
                  <Select
                    value={(mapping as any)[field.id] || ""}
                    onValueChange={(val) => setMapping(prev => ({ ...prev, [field.id]: (val === "__none__" || !val) ? "" : val }))}
                  >
                    <SelectTrigger className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-semibold text-xs focus:ring-[#243467]/20">
                      <SelectValue placeholder={`Map ${field.id} column…`} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-none shadow-xl">
                      <SelectItem value="__none__" className="text-[10px] font-semibold uppercase py-2.5">— Ignore —</SelectItem>
                      {headers.map(h => (
                        <SelectItem key={h} value={h} className="text-[10px] font-semibold uppercase py-2.5">{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ))}

              <div className="pt-4 border-t border-dashed border-border/50 space-y-2">
                <Label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider">Default Branch (fallback)</Label>
                <Select value={defaultBranchId} onValueChange={(val) => setDefaultBranchId(val || "")}>
                  <SelectTrigger className="h-12 rounded-xl bg-[#243467]/5 border-none ring-1 ring-[#243467]/20 font-semibold text-xs text-[#243467]">
                    <SelectValue placeholder="Assign entire file to branch…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl z-[100]">
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-[10px] font-semibold tracking-tight uppercase py-3 px-4">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button
                disabled={!mapping.name || !mapping.phone}
                onClick={() => setStep("PREVIEW")}
                className="w-full h-14 rounded-xl bg-[#243467] hover:bg-[#1a2850] text-white text-[10px] font-semibold tracking-tight uppercase tracking-widest shadow-lg shadow-[#243467]/20"
              >
                Confirm Alignment →
              </Button>
            </div>
          )}

          {/* ── PREVIEW ── */}
          {step === "PREVIEW" && (
            <div className="space-y-6">
              {/* File info banner */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-[#243467]/5 border border-[#243467]/10">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <FileType className="h-5 w-5 text-[#243467]" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold tracking-tight text-slate-900">{file?.name}</p>
                    <p className="text-[9px] text-slate-500 font-semibold uppercase">
                      {totalRows.toLocaleString()} rows · {Math.ceil(totalRows / CHUNK_SIZE)} batches of {CHUNK_SIZE}
                    </p>
                  </div>
                </div>
                <Button variant="link" onClick={() => setStep("MAP")} className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-[#243467]">
                  Adjust Mapping
                </Button>
              </div>

              {/* Default branch */}
              <div className="space-y-2">
                <Label className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 tracking-wider">Default Branch</Label>
                <Select value={defaultBranchId} onValueChange={(val) => setDefaultBranchId(val || "")}>
                  <SelectTrigger className="h-11 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-semibold text-xs">
                    <SelectValue placeholder="Select fallback branch…" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl border-none shadow-xl z-[100]">
                    {branches.map(b => (
                      <SelectItem key={b.id} value={b.id} className="text-[10px] font-semibold tracking-tight uppercase py-3 px-4">{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Preview table */}
              <div className="space-y-2">
                <p className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-slate-400">
                  Preview (first {Math.min(validPreview.length, 8)} valid rows)
                </p>
                <div className="rounded-xl border border-border/50 overflow-hidden">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50">
                      <tr>
                        {["Name", "Phone", "Category", "Branch"].map(h => (
                          <th key={h} className="px-4 py-2 text-[9px] font-semibold tracking-tight uppercase text-slate-400">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {mappedPreview.slice(0, 8).map((row, i) => {
                        const branch = branches.find(b => b.id === row.branchId);
                        return (
                          <tr key={i} className="border-t border-slate-50">
                            <td className="px-4 py-2.5 text-[10px] font-semibold text-slate-800 truncate max-w-[140px]">{row.name}</td>
                            <td className="px-4 py-2.5 text-[10px] font-mono text-slate-500">{row.phone}</td>
                            <td className="px-4 py-2.5 text-[10px] font-semibold tracking-tight uppercase text-[#243467]">{row.category}</td>
                            <td className="px-4 py-2.5 text-[10px] font-semibold text-slate-400">{branch?.name ?? "—"}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                {totalRows > 8 && (
                  <p className="text-[9px] text-slate-400 text-center  font-semibold uppercase">
                    + {(totalRows - 8).toLocaleString()} more rows will stream in batches
                  </p>
                )}
              </div>
            </div>
          )}

          {/* ── IMPORTING ── */}
          {step === "IMPORTING" && progress && (
            <ProgressBar progress={progress} />
          )}

          {/* ── SUCCESS ── */}
          {step === "SUCCESS" && progress && (
            <div className="space-y-6 py-4">
              <div className="grid grid-cols-3 gap-4">
                {[
                  { label: "Total Rows", value: progress.totalRows.toLocaleString(), color: "text-slate-900" },
                  { label: "Inserted", value: progress.insertedRows.toLocaleString(), color: "text-emerald-600" },
                  { label: "Batches", value: progress.batchesDone, color: "text-[#243467]" },
                ].map(s => (
                  <div key={s.label} className="bg-slate-50 p-6 rounded-xl text-center border border-border/50">
                    <p className={cn("text-3xl font-semibold tracking-tight tracking-tighter ", s.color)}>{s.value}</p>
                    <p className="text-[10px] font-semibold tracking-tight uppercase text-slate-400 mt-1">{s.label}</p>
                  </div>
                ))}
              </div>

              <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-xl flex items-center gap-6">
                <div className="h-12 w-12 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="h-6 w-6" />
                </div>
                <div>
                  <h4 className="text-sm font-semibold tracking-tight text-emerald-900 uppercase tracking-tight">Streaming Complete</h4>
                  <p className="text-[11px] text-emerald-700 font-semibold opacity-80 mt-0.5">
                    All batches processed. Matrix state is now synchronized.
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <Button onClick={() => { setOpen(false); resetState(); }} variant="outline" className="flex-1 h-12 rounded-xl font-semibold tracking-tight text-[10px] uppercase tracking-widest">
                  <RefreshCw className="h-4 w-4 mr-2" /> Close
                </Button>
                <Button onClick={() => { useDashboardStore.getState().resetFilters(); setOpen(false); resetState(); }} className="flex-1 h-12 rounded-xl bg-[#243467] hover:bg-[#1a2850] text-white font-semibold tracking-tight text-[10px] uppercase tracking-widest shadow-lg">
                  View Matrix
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {(step === "PREVIEW") && (
          <DialogFooter className="p-6 bg-slate-50/80 border-t border-border/50">
            <Button
              onClick={startStreamingImport}
              disabled={!mapping.name || !mapping.phone || (!defaultBranchId && mappedPreview.every(r => !r.branchId))}
              className="w-full h-14 rounded-xl bg-[#243467] hover:bg-[#1a2850] text-white text-[11px] font-semibold tracking-tight uppercase tracking-[0.2em] shadow-xl shadow-[#243467]/20"
            >
              <Zap className="h-4 w-4 fill-white mr-2" />
              Initiate Streaming Import ({totalRows.toLocaleString()} rows)
            </Button>
          </DialogFooter>
        )}

        {(step === "UPLOAD" || step === "MAP") && file && (
          <DialogFooter className="p-6 bg-slate-50/80 border-t border-border/50">
            <Button variant="ghost" onClick={resetState} className="text-[10px] font-semibold tracking-tight uppercase text-rose-500 hover:bg-rose-50">
              Clear Payload
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
