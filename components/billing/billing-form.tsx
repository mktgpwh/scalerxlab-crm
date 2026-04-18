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
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="space-y-4">
                <div className="grid grid-cols-12 gap-4 px-4">
                    <div className="col-span-5 text-[10px] font-black uppercase tracking-widest text-slate-400">Description / Service</div>
                    <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Qty</div>
                    <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Price (₹)</div>
                    <div className="col-span-2 text-[10px] font-black uppercase tracking-widest text-slate-400">Tax (%)</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center group animate-in zoom-in-95 duration-200">
                            <div className="col-span-5">
                                <Input
                                    placeholder="Enter Service or Product..."
                                    value={item.itemName}
                                    onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                                    className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs"
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                    className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs text-center"
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                    className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs"
                                />
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={item.tax}
                                    onChange={(e) => updateItem(item.id, "tax", parseFloat(e.target.value) || 0)}
                                    className="h-12 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-bold text-xs"
                                />
                            </div>
                            <div className="col-span-1 flex justify-center">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => removeItem(item.id)}
                                    className="h-10 w-10 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>

                <Button
                    variant="outline"
                    onClick={addItem}
                    className="h-12 rounded-full border-dashed border-slate-300 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary transition-all"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Line Item
                </Button>
            </div>

            {/* Calculations and Action */}
            <div className="pt-8 border-t border-slate-100 flex flex-col md:flex-row items-end justify-between gap-8">
                <div className="space-y-4 w-full md:w-auto">
                    <div className="flex items-center gap-12 justify-between md:justify-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Subtotal</span>
                        <span className="text-sm font-black text-slate-600">₹{subTotal.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-12 justify-between md:justify-start">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Total Tax</span>
                        <span className="text-sm font-black text-slate-600">₹{totalTax.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-12 justify-between md:justify-start pt-2">
                        <span className="text-xs font-black uppercase tracking-widest text-primary">Grand Total</span>
                        <div className="flex items-center gap-1">
                            <IndianRupee className="h-4 w-4 text-primary" />
                            <span className="text-2xl font-black tracking-tighter text-primary">{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <Button
                    onClick={handleSubmit}
                    disabled={loading || subTotal === 0}
                    className="h-16 px-12 rounded-full bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/20 transition-all font-black uppercase tracking-widest text-[11px]"
                >
                    {loading ? (
                        <Loader2 className="h-5 w-5 animate-spin mr-3" />
                    ) : (
                        <Sparkles className="h-5 w-5 mr-3" />
                    )}
                    Generate {department} Bill
                </Button>
            </div>
        </div>
    );
}
