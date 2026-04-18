"use client";

import React, { useState } from "react";
import { Plus, Trash2, IndianRupee, Save, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createInvoiceAction } from "@/app/(dashboard)/billing/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LineItem {
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    tax: number;
}

interface BillingFormProps {
    leadId: string;
    department: "OPD" | "IPD" | "PHARMACY" | "ULTRASOUND" | "LAB";
    onSuccess: (invoice: any) => void;
}

export function BillingForm({ leadId, department, onSuccess }: BillingFormProps) {
    const [items, setItems] = useState<LineItem[]>([
        { id: Math.random().toString(), itemName: "", quantity: 1, unitPrice: 0, tax: 0 }
    ]);
    const [loading, setLoading] = useState(false);

    const addItem = () => {
        setItems([...items, { id: Math.random().toString(), itemName: "", quantity: 1, unitPrice: 0, tax: 0 }]);
    };

    const removeItem = (id: string) => {
        if (items.length === 1) return;
        setItems(items.filter(item => item.id !== id));
    };

    const updateItem = (id: string, field: keyof LineItem, value: any) => {
        setItems(items.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const subTotal = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity), 0);
    const totalTax = items.reduce((acc, item) => acc + (item.unitPrice * item.quantity * (item.tax / 100)), 0);
    const grandTotal = subTotal + totalTax;

    const handleSubmit = async () => {
        if (!leadId) {
            toast.error("Please select a patient first.");
            return;
        }

        const validItems = items.filter(i => i.itemName && i.unitPrice > 0);
        if (validItems.length === 0) {
            toast.error("Please add at least one line item.");
            return;
        }

        setLoading(true);
        try {
            const result = await createInvoiceAction({
                leadId,
                department,
                items: validItems.map(({ itemName, quantity, unitPrice, tax }) => ({
                    itemName, quantity, unitPrice, tax
                }))
            });

            if (result.success) {
                toast.success("Invoice Generated Successfully!");
                onSuccess(result.invoice);
            } else {
                toast.error(result.error || "Failed to generate invoice");
            }
        } catch (error) {
            toast.error("System connection failure during invoice commit.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="grid grid-cols-12 gap-3 px-4">
                    <div className="col-span-5 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Description / Service</div>
                    <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Qty</div>
                    <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">Price (₹)</div>
                    <div className="col-span-2 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 text-center">Tax (%)</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center group animate-in zoom-in-95 duration-200">
                            <div className="col-span-5 relative">
                                <Input
                                    placeholder="Enter Service..."
                                    value={item.itemName}
                                    onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                                    className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-[11px] focus-visible:ring-primary/30"
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                    className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-[11px] text-center focus-visible:ring-primary/30"
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                    className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-[11px] focus-visible:ring-primary/30"
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={item.tax}
                                    onChange={(e) => updateItem(item.id, "tax", parseFloat(e.target.value) || 0)}
                                    className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-[11px] text-center focus-visible:ring-primary/30"
                                />
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item.id)}
                                    className="h-9 w-9 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    onClick={addItem}
                    className="h-10 w-full rounded-xl border-dashed border-slate-200 text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary transition-all bg-slate-50/50"
                >
                    <Plus className="h-3.5 w-3.5 mr-2" />
                    Add New Line Item
                </Button>
            </div>

            {/* Calculations and Action */}
            <div className="pt-6 border-t border-slate-100 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8 w-full lg:w-auto">
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Subtotal</span>
                        <span className="text-xs font-black text-slate-600">₹{subTotal.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block">Total Tax</span>
                        <span className="text-xs font-black text-slate-600">₹{totalTax.toLocaleString()}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-100 mx-2" />
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary block underline decoration-primary/20 underline-offset-4">Grand Total</span>
                        <div className="flex items-center gap-1 text-primary">
                            <IndianRupee className="h-3.5 w-3.5 font-bold" />
                            <span className="text-xl font-black tracking-tighter">{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-auto flex flex-col gap-2">
                    {!leadId && (
                        <p className="text-[8px] font-black uppercase tracking-widest text-rose-500 text-center animate-pulse">
                            ⚠️ Select Patient Node to Proceed
                        </p>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || subTotal === 0 || !leadId}
                        className={cn(
                            "h-14 px-10 rounded-2xl transition-all font-black uppercase tracking-widest text-[10px] shadow-xl",
                            !leadId 
                                ? "bg-slate-100 text-slate-400" 
                                : "bg-primary text-white shadow-primary/20 hover:scale-[1.02] hover:shadow-primary/30 active:scale-[0.98]"
                        )}
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        ) : (
                            <Sparkles className="h-4 w-4 mr-2" />
                        )}
                        Finalize {department} Bill
                    </Button>
                </div>
            </div>
        </div>
    );
}
