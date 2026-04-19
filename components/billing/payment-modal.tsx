"use client";

import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogDescription 
} from "@/components/ui/dialog";
import { CheckCircle2, QrCode, Smartphone, X, Download, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQRUrl } from "@/lib/payments/upi";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface PaymentModalProps {
    invoice: any;
    onClose: () => void;
}

export function PaymentModal({ invoice, onClose }: PaymentModalProps) {
    if (!invoice) return null;

    const qrUrl = generateQRUrl({
        amount: invoice.totalAmount,
        invoiceNumber: invoice.invoiceNumber,
        patientName: invoice.lead.name
    });

    return (
        <Dialog open={!!invoice} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[480px] rounded-xl border-none shadow-2xl p-0 overflow-hidden bg-white/95 backdrop-blur-xl">
                <div className="p-8 pt-10 text-center bg-emerald-500/5 border-b border-emerald-500/10">
                    <div className="h-16 w-16 rounded-[1.8rem] bg-emerald-500/10 flex items-center justify-center mx-auto mb-6 text-emerald-500">
                        <CheckCircle2 className="h-8 w-8" />
                    </div>
                    <DialogHeader>
                        <DialogTitle className="text-3xl font-semibold tracking-tight tracking-tighter  lowercase text-slate-900 text-center">
                            Invoiced Successfully
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 text-[10px] font-semibold uppercase tracking-widest text-center pt-2">
                            Digital receipt generated and sent via AgentX WhatsApp
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-8 space-y-8">
                    {/* QR Code Section */}
                    <div className="relative group">
                        <div className="absolute -inset-4 bg-primary/5 rounded-xl blur-xl group-hover:bg-primary/10 transition-all duration-500" />
                        <div className="relative bg-white p-6 rounded-xl border border-border/50 shadow-xl overflow-hidden aspect-square flex flex-col items-center justify-center">
                            <img 
                                src={qrUrl} 
                                alt="UPI QR Code" 
                                className="w-full h-full object-contain mb-4"
                            />
                            <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-full ring-1 ring-slate-100">
                                <QrCode className="h-3 w-3 text-primary" />
                                <span className="text-[10px] font-semibold tracking-tight uppercase tracking-widest text-primary">Scan with Any UPI App</span>
                            </div>
                        </div>
                    </div>

                    {/* Invoice Details */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-border/50">
                            <div>
                                <p className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400">Invoice Number</p>
                                <p className="text-sm font-semibold text-slate-900 mt-0.5">{invoice.invoiceNumber}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400">Grand Total</p>
                                <p className="text-xl font-semibold tracking-tight text-primary mt-0.5">₹{invoice.totalAmount.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <Button 
                                variant="outline" 
                                className="flex-1 h-14 rounded-xl border-border/50 text-xs font-semibold uppercase tracking-widest text-slate-500 hover:bg-slate-50"
                            >
                                <Download className="h-4 w-4 mr-2" /> Download
                            </Button>
                            <a 
                                href={invoice.paymentLinkUrl}
                                className={cn(
                                    "flex-1 h-14 rounded-xl bg-[#243467] hover:bg-[#1a2850] text-white shadow-lg shadow-[#243467]/20 font-semibold tracking-tight uppercase tracking-widest text-[10px] flex items-center justify-center"
                                )}
                            >
                                <Smartphone className="h-4 w-4 mr-2 text-white" />
                                Pay on App
                            </a>
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-slate-50/50 border-t border-border/50">
                    <Button 
                        onClick={onClose}
                        className="w-full h-12 rounded-xl text-xs font-semibold uppercase tracking-widest text-slate-400 hover:text-slate-900 transition-all hover:bg-white"
                        variant="ghost"
                    >
                        Close Terminal
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
