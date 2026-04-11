"use client";

import { useState, useRef } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger,
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Upload, FileType, CheckCircle2, AlertCircle, Loader2, X } from "lucide-react";
import { bulkImportLeadsAction } from "@/app/(dashboard)/leads/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";

interface BulkImportDialogProps {
  userRole: string;
}

export function BulkImportDialog({ userRole }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  const isAdmin = userRole === "ORG_ADMIN" || userRole === "SUPER_ADMIN";

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
        setFile(selectedFile);
        parseFile(selectedFile);
    }
  };

  const parseFile = (file: File) => {
    const extension = file.name.split(".").pop()?.toLowerCase();
    
    if (extension === "csv") {
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => {
                setPreviewData(results.data.slice(0, 10)); // Preview first 10
                processData(results.data);
            },
            error: (err) => setError("Failed to parse CSV signal."),
        });
    } else if (extension === "xlsx" || extension === "xls") {
        const reader = new FileReader();
        reader.onload = (e) => {
            const data = e.target?.result;
            const workbook = XLSX.read(data, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);
            setPreviewData(json.slice(0, 10));
            processData(json);
        };
        reader.readAsBinaryString(file);
    } else {
        setError("Unsupported frequency. Please use CSV or XLSX.");
    }
  };

  const [finalData, setFinalData] = useState<any[]>([]);

  const processData = (data: any[]) => {
    // Basic mapping check
    const mapped = data.map((row: any) => ({
        name: row.Name || row.name || row["Full Name"] || "",
        phone: String(row.Phone || row.phone || row["Mobile"] || "").replace(/[^0-9]/g, ""),
        email: row.Email || row.email || "",
        category: (row.Category || row.category || "OTHER").toUpperCase(),
        source: "BULK_IMPORT"
    })).filter(l => l.phone.length >= 10);

    setFinalData(mapped);
    if (mapped.length === 0) {
        setError("No valid lead signals detected in this cluster.");
    } else {
        setError(null);
    }
  };

  const handleImport = async () => {
    if (finalData.length === 0) return;
    setLoading(true);
    try {
      const result = await bulkImportLeadsAction(finalData);
      if (result.error) {
        toast.error("Cluster Ingestion Failed", { description: result.error });
      } else {
        toast.success("Matrix Synchronized", { 
          description: `Successfully imported ${result.count} new lead signals.` 
        });
        setOpen(false);
        resetState();
        router.refresh();
      }
    } catch (err) {
      toast.error("System Override", { description: "Matrix connectivity lost during batch transfer." });
    } finally {
      setLoading(false);
    }
  };

  const resetState = () => {
    setFile(null);
    setPreviewData([]);
    setFinalData([]);
    setError(null);
  };

  return (
    <Dialog open={open} onOpenChange={(val) => { setOpen(val); if (!val) resetState(); }}>
      <DialogTrigger 
        render={
          <Button variant="outline" className="h-10 px-4 rounded-xl border-slate-200/60 bg-white/50 text-slate-600 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 transition-all">
            <Upload className="h-3.5 w-3.5 mr-2" />
            Bulk Migration
          </Button>
        }
      />
      <DialogContent className="sm:max-w-[600px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
        <div className="p-8 pt-12 text-center bg-indigo-50/30 border-b border-indigo-100/50">
          <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 text-indigo-500">
            <FileType className="h-7 w-7" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter italic lowercase text-slate-900 text-center">
              Batch Ingestion
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center pt-2">
              Synchronize internal lead datasets with the Intelligence Matrix
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8">
          {!file ? (
            <div 
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-200 rounded-[2rem] p-12 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
            >
              <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.xlsx,.xls" className="hidden" />
              <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-500" />
              </div>
              <p className="text-sm font-black text-slate-900 italic tracking-tight">Drop signal payload here</p>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Supports CSV, XLSX up to 50MB</p>
            </div>
          ) : (
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 ring-1 ring-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 truncate max-w-[200px]">{file.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{Math.round(file.size / 1024)} KB Detected</p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={resetState} className="h-8 w-8 rounded-full hover:bg-rose-50 hover:text-rose-500 text-slate-400">
                        <X className="h-4 w-4" />
                    </Button>
                </div>

                {error ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-tight">{error}</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payload Preview ({finalData.length} valid)</p>
                        <div className="max-h-[200px] overflow-y-auto rounded-2xl border border-slate-100 shadow-inner bg-slate-50/30">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400">Name</th>
                                        <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400">Phone</th>
                                        <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400">Treatment</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.map((row, i) => (
                                        <tr key={i} className="border-b border-white/50">
                                            <td className="px-4 py-2 text-[10px] font-bold text-slate-700 truncate">{row.Name || row.name || row["Full Name"] || "—"}</td>
                                            <td className="px-4 py-2 text-[10px] font-bold text-slate-500">{row.Phone || row.phone || row["Mobile"] || "—"}</td>
                                            <td className="px-4 py-2 text-[10px] font-bold text-slate-400">{row.Category || row.category || "OTHER"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>
          )}

          <DialogFooter className="pt-8">
            <Button 
                onClick={handleImport} 
                disabled={loading || !file || !!error}
                className={cn(
                    "w-full h-14 rounded-[2rem] text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all",
                    (!loading && file && !error) ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20" : "bg-slate-200 text-slate-400 shadow-none pointer-events-none"
                )}
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initiate Batch Transfer"}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
