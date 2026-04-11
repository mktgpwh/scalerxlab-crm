"use client";

import { useState, useRef, useEffect } from "react";
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
import { 
  Upload, 
  FileType, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X, 
  ArrowRight, 
  Download,
  Settings2
} from "lucide-react";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { bulkImportLeadsAction } from "@/app/(dashboard)/leads/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import * as XLSX from "xlsx";
import { cn } from "@/lib/utils";
import { detectHeaders, generateCsvTemplate } from "@/lib/utils/import-utils";

interface BulkImportDialogProps {
  userRole: string;
}

export function BulkImportDialog({ userRole }: BulkImportDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [csvData, setCsvData] = useState<any[]>([]); // Raw parsed data
  const [headers, setHeaders] = useState<string[]>([]);
  const [mapping, setMapping] = useState<Record<string, string>>({
    name: "",
    phone: "",
    email: "",
    category: "",
  });
  const [step, setStep] = useState<"UPLOAD" | "MAP" | "PREVIEW">("UPLOAD");
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

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
                const detectedHeaders = results.meta.fields || [];
                setHeaders(detectedHeaders);
                setCsvData(results.data);
                
                const autoMapping = detectHeaders(detectedHeaders);
                setMapping(autoMapping);
                
                // If we found name and phone, go straight to preview
                if (autoMapping.name && autoMapping.phone) {
                    setStep("PREVIEW");
                } else {
                    setStep("MAP");
                }
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
            const json: any[] = XLSX.utils.sheet_to_json(sheet);
            
            if (json.length > 0) {
                const detectedHeaders = Object.keys(json[0]);
                setHeaders(detectedHeaders);
                setCsvData(json);
                const autoMapping = detectHeaders(detectedHeaders);
                setMapping(autoMapping);
                
                if (autoMapping.name && autoMapping.phone) {
                    setStep("PREVIEW");
                } else {
                    setStep("MAP");
                }
            } else {
                setError("Payload is empty.");
            }
        };
        reader.readAsBinaryString(file);
    } else {
        setError("Unsupported frequency. Please use CSV or XLSX.");
    }
  };

  const [finalData, setFinalData] = useState<any[]>([]);

  useEffect(() => {
    if (step === "PREVIEW" || step === "MAP") {
        const mapped = csvData.map((row: any) => ({
            name: row[mapping.name] || "",
            phone: String(row[mapping.phone] || "").replace(/[^0-9]/g, ""),
            email: row[mapping.email] || "",
            category: (row[mapping.category] || "OTHER").toUpperCase(),
            source: "BULK_IMPORT"
        })).filter(l => l.phone.length >= 10);

        setFinalData(mapped);
        if (mapped.length === 0 && csvData.length > 0 && mapping.phone) {
            setError("No valid lead signals detected with current mapping.");
        } else {
            setError(null);
        }
    }
  }, [mapping, csvData, step]);

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
    setCsvData([]);
    setHeaders([]);
    setMapping({ name: "", phone: "", email: "", category: "" });
    setStep("UPLOAD");
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
      <DialogContent className="sm:max-w-[700px] rounded-[3rem] border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
        <div className="p-8 pt-12 text-center bg-indigo-50/30 border-b border-indigo-100/50">
          <div className="h-14 w-14 rounded-[1.5rem] bg-indigo-500/10 flex items-center justify-center mx-auto mb-6 text-indigo-500">
            {step === "UPLOAD" && <FileType className="h-7 w-7" />}
            {step === "MAP" && <Settings2 className="h-7 w-7" />}
            {step === "PREVIEW" && <CheckCircle2 className="h-7 w-7 text-emerald-500" />}
          </div>
          <DialogHeader>
            <DialogTitle className="text-3xl font-black tracking-tighter italic lowercase text-slate-900 text-center">
              {step === "UPLOAD" && "Batch Ingestion"}
              {step === "MAP" && "Field Alignment"}
              {step === "PREVIEW" && "Final Synchronization"}
            </DialogTitle>
            <DialogDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest text-center pt-2">
              {step === "UPLOAD" && "Synchronize internal lead datasets with the Intelligence Matrix"}
              {step === "MAP" && "Align your spreadsheet columns with the Matrix field architecture"}
              {step === "PREVIEW" && "Reviewing the parsed signal payload before commit"}
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-8 min-h-[400px]">
          {step === "UPLOAD" && (
            <div className="space-y-6">
                <div 
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-200 rounded-[2rem] p-16 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/30 transition-all group"
                >
                <input type="file" ref={fileInputRef} onChange={handleFileChange} accept=".csv,.xlsx,.xls" className="hidden" />
                <div className="h-16 w-16 rounded-full bg-slate-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Upload className="h-6 w-6 text-slate-400 group-hover:text-indigo-500" />
                </div>
                <p className="text-sm font-black text-slate-900 italic tracking-tight">Drop signal payload here</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Supports CSV, XLSX up to 50MB</p>
                </div>
                
                <div className="flex items-center justify-center pt-4">
                    <Button 
                        variant="ghost" 
                        onClick={() => generateCsvTemplate()}
                        className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                        <Download className="h-3.5 w-3.5 mr-2" />
                        Download Lead Template
                    </Button>
                </div>
            </div>
          )}

          {step === "MAP" && (
            <div className="space-y-8 max-w-md mx-auto">
                <div className="grid grid-cols-1 gap-6">
                    {/* Mapper Fields */}
                    {[
                        { id: "name", label: "Full Identity Name", required: true },
                        { id: "phone", label: "Phone Node / Mobile", required: true },
                        { id: "email", label: "Email Identifier", required: false },
                        { id: "category", label: "Treatment Category", required: false },
                    ].map((field) => (
                        <div key={field.id} className="space-y-2">
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider ml-1">
                                {field.label} {field.required && <span className="text-rose-500">*</span>}
                            </label>
                                <Select 
                                    value={mapping[field.id] || ""} 
                                    onValueChange={(val) => setMapping(prev => ({ ...prev, [field.id]: val as string }))}
                                >
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs">
                                    <SelectValue placeholder={`Select ${field.id} column`} />
                                </SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    <SelectItem value="__none__" className="text-[10px] font-bold uppercase py-2.5">
                                        — Ignore —
                                    </SelectItem>
                                    {headers.map((h) => (
                                        <SelectItem key={h} value={h} className="text-[10px] font-bold uppercase py-2.5">
                                            {h}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ))}
                </div>

                <div className="pt-4">
                    <Button 
                        disabled={!mapping.name || !mapping.phone}
                        onClick={() => setStep("PREVIEW")}
                        className="w-full h-14 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-[0.2em] shadow-lg shadow-indigo-200 transition-all"
                    >
                        Align Matrix <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                    {!mapping.name || !mapping.phone && (
                        <p className="text-[9px] text-slate-400 text-center mt-3 font-bold uppercase italic">Assign Name & Phone columns to proceed</p>
                    )}
                </div>
            </div>
          )}

          {step === "PREVIEW" && (
            <div className="space-y-6">
                <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100 ring-1 ring-white">
                    <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-xs font-black text-slate-900 truncate max-w-[200px]">{file?.name}</p>
                            <p className="text-[9px] text-slate-400 font-bold uppercase">{csvData.length} Total Rows Detected</p>
                        </div>
                    </div>
                    <Button 
                        variant="link" 
                        onClick={() => setStep("MAP")}
                        className="text-[10px] font-black uppercase tracking-widest text-indigo-500"
                    >
                        Adjust Mapping
                    </Button>
                </div>

                {error ? (
                    <div className="p-4 rounded-2xl bg-rose-50 border border-rose-100 flex items-center gap-3 text-rose-600">
                        <AlertCircle className="h-5 w-5" />
                        <span className="text-[10px] font-black uppercase tracking-tight">{error}</span>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Payload Preview ({finalData.length} valid signals)</p>
                        <div className="max-h-[200px] overflow-y-auto rounded-2xl border border-slate-100 shadow-inner bg-slate-50/30">
                            <table className="w-full text-left border-collapse">
                                <thead className="sticky top-0 bg-white/80 backdrop-blur-sm shadow-sm">
                                    <tr className="border-b border-slate-100">
                                        <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400">Name</th>
                                        <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400">Phone</th>
                                        <th className="px-4 py-2 text-[9px] font-black uppercase text-slate-400">Category</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {finalData.slice(0, 10).map((row, i) => (
                                        <tr key={i} className="border-b border-white/50">
                                            <td className="px-4 py-2 text-[10px] font-bold text-slate-700 truncate">{row.name || "—"}</td>
                                            <td className="px-4 py-2 text-[10px] font-bold text-slate-500">{row.phone || "—"}</td>
                                            <td className="px-4 py-2 text-[10px] font-bold text-slate-400">{row.category || "OTHER"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {finalData.length > 10 && (
                            <p className="text-[9px] text-slate-400 text-center pt-2 font-bold italic uppercase">+ {finalData.length - 10} additional signals hidden</p>
                        )}
                    </div>
                )}
            </div>
          )}
        </div>

        <DialogFooter className="p-8 bg-slate-50/50 border-t border-slate-100">
            {step === "PREVIEW" ? (
                <Button 
                    onClick={handleImport} 
                    disabled={loading || finalData.length === 0 || !!error}
                    className={cn(
                        "w-full h-14 rounded-[2rem] text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-xl transition-all",
                        (!loading && finalData.length > 0 && !error) ? "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/20" : "bg-slate-200 text-slate-400 shadow-none pointer-events-none"
                    )}
                >
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Initiate Batch Transfer"}
                </Button>
            ) : (
                <div className="w-full flex justify-between items-center text-slate-400">
                    <p className="text-[10px] font-black uppercase tracking-widest">Insecure connections will be terminated</p>
                    {file && (
                        <Button variant="ghost" onClick={resetState} className="text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50">
                            Clear Payload
                        </Button>
                    )}
                </div>
            )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
