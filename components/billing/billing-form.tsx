"use client";

import React, { useState } from "react";
import { Plus, Trash2, IndianRupee, Save, Loader2, Sparkles, Layers } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { createInvoiceAction } from "@/app/(dashboard)/billing/actions";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface LineItem {
    id: string;
    itemName: string;
    quantity: number;
    unitPrice: number;
    originalPrice?: number;
    tax: number;
    isCustom?: boolean;
}

const BILLING_CATALOG: Record<string, Array<{ name: string; price: number; tax: number }>> = {
    OPD: [
        { name: "General Consultation", price: 500, tax: 0 },
        { name: "Follow-up Visit", price: 300, tax: 0 },
        { name: "Specialist Consultation", price: 1000, tax: 0 },
    ],
    PHARMACY: [
        { name: "Paracetamol 500mg (10 tabs)", price: 40, tax: 12 },
        { name: "Amoxicillin 250mg (10 caps)", price: 120, tax: 12 },
        { name: "Cough Syrup 100ml", price: 85, tax: 12 },
    ],
    ULTRASOUND: [
        { name: "Level 2 Anomaly Scan", price: 2500, tax: 0 },
        { name: "NT Scan", price: 1500, tax: 0 },
        { name: "Follicular Study (Single)", price: 500, tax: 0 },
    ],
    LAB: [
        { name: "CBC (Complete Blood Count)", price: 400, tax: 0 },
        { name: "Thyroid Profile (T3, T4, TSH)", price: 800, tax: 0 },
        { name: "HbA1c / Diabetes Test", price: 550, tax: 0 },
    ],
    IPD: [
        { name: "Private Room (Per Day)", price: 5000, tax: 0 },
        { name: "Nursing Charges", price: 1000, tax: 0 },
        { name: "Admission Charges", price: 1500, tax: 0 },
    ]
};

interface BillingFormProps {
    leadId: string;
    department: "OPD" | "IPD" | "PHARMACY" | "ULTRASOUND" | "LAB";
    onSuccess: (invoice: any) => void;
}

export function BillingForm({ leadId, department, onSuccess }: BillingFormProps) {
    const [items, setItems] = useState<LineItem[]>([
        { id: Math.random().toString(), itemName: "", quantity: 1, unitPrice: 0, tax: 0, isCustom: false }
    ]);
    const [loading, setLoading] = useState(false);

    const catalog = BILLING_CATALOG[department] || [];

    const addItem = (isCustom = false) => {
        setItems([...items, { 
            id: Math.random().toString(), 
            itemName: isCustom ? "Miscellaneous Service" : "", 
            quantity: 1, 
            unitPrice: 0, 
            tax: 0, 
            isCustom 
        }]);
    };

    const selectFromCatalog = (id: string, serviceName: string) => {
        const service = catalog.find(s => s.name === serviceName);
        if (service) {
            setItems(items.map(item => item.id === id ? { 
                ...item, 
                itemName: service.name, 
                unitPrice: service.price, 
                originalPrice: service.price,
                tax: service.tax,
                isCustom: false
            } : item));
        }
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
                items: validItems.map(({ itemName, quantity, unitPrice, originalPrice, tax }) => ({
                    itemName, 
                    quantity, 
                    unitPrice, 
                    originalPrice: originalPrice || unitPrice,
                    tax
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
                <div className="grid grid-cols-12 gap-3 px-4 py-3 bg-muted/50 rounded-xl border-b border-dashed border-border/50">
                    <div className="col-span-5 text-[9px] font-semibold tracking-tight uppercase tracking-[0.2em] text-slate-500">Service Identifier</div>
                    <div className="col-span-2 text-[9px] font-semibold tracking-tight uppercase tracking-[0.2em] text-slate-500 text-center">Qty</div>
                    <div className="col-span-2 text-[9px] font-semibold tracking-tight uppercase tracking-[0.2em] text-slate-500 text-center">Unit Price (₹)</div>
                    <div className="col-span-2 text-[9px] font-semibold tracking-tight uppercase tracking-[0.2em] text-slate-500 text-center">Tax %</div>
                    <div className="col-span-1"></div>
                </div>

                <div className="space-y-2">
                    {items.map((item, index) => (
                        <div key={item.id} className="grid grid-cols-12 gap-3 items-center group animate-in zoom-in-95 duration-200">
                            <div className="col-span-5 flex gap-2">
                                {item.isCustom ? (
                                    <Input
                                        placeholder="Service Name..."
                                        value={item.itemName}
                                        onChange={(e) => updateItem(item.id, "itemName", e.target.value)}
                                        className="h-10 rounded-xl bg-orange-50/30 border-orange-200/50 ring-1 ring-orange-100/50 font-bold text-[11px] focus-visible:ring-orange-500/20"
                                    />
                                ) : (
                                    <select 
                                        value={item.itemName}
                                        onChange={(e) => selectFromCatalog(item.id, e.target.value)}
                                        className="h-10 w-full rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-semibold text-[11px] px-3 focus:outline-none focus:ring-primary/20 appearance-none bg-[url('data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%2364748b%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:10px] bg-[right_12px_center] bg-no-repeat transition-all"
                                    >
                                        <option value="">Select Service Catalog...</option>
                                        {catalog.map(s => (
                                            <option key={s.name} value={s.name}>{s.name} (₹{s.price})</option>
                                        ))}
                                    </select>
                                )}
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => updateItem(item.id, "quantity", parseInt(e.target.value) || 0)}
                                    className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-semibold text-[11px] text-center focus-visible:ring-primary/30"
                                />
                            </div>
                            <div className="col-span-2 relative">
                                <Input
                                    type="number"
                                    value={item.unitPrice}
                                    onChange={(e) => updateItem(item.id, "unitPrice", parseFloat(e.target.value) || 0)}
                                    className={cn(
                                        "h-10 rounded-xl bg-slate-50 border-none ring-1 font-semibold text-[11px] text-center focus-visible:ring-primary/30 transition-all",
                                        item.originalPrice && item.unitPrice !== item.originalPrice 
                                            ? "ring-orange-200 text-orange-600 bg-orange-50/50" 
                                            : "ring-slate-100"
                                    )}
                                />
                                {item.originalPrice && item.unitPrice !== item.originalPrice && (
                                    <div className="absolute -top-1 -right-1">
                                        <Badge className="h-4 px-1 text-[7px] bg-orange-500 border-none">Override</Badge>
                                    </div>
                                )}
                            </div>
                            <div className="col-span-2">
                                <Input
                                    type="number"
                                    value={item.tax}
                                    onChange={(e) => updateItem(item.id, "tax", parseFloat(e.target.value) || 0)}
                                    className="h-10 rounded-xl bg-slate-50 border-none ring-1 ring-slate-100 font-semibold text-[11px] text-center focus-visible:ring-primary/30"
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

                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => addItem(false)}
                        className="h-11 flex-1 rounded-xl border-dashed border-border/50 text-[9px] font-semibold tracking-tight uppercase tracking-widest text-slate-400 hover:text-primary hover:border-primary transition-all bg-slate-50/50"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add From Catalog
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => addItem(true)}
                        className="h-11 flex-1 rounded-xl border-dashed border-orange-200 text-[9px] font-semibold tracking-tight uppercase tracking-widest text-orange-400 hover:text-orange-600 hover:border-orange-500 transition-all bg-orange-50/10"
                    >
                        <Layers className="h-4 w-4 mr-2" />
                        Custom Line Item
                    </Button>
                </div>
            </div>

            {/* Calculations and Action */}
            <div className="pt-6 border-t border-border/50 flex flex-col lg:flex-row items-center justify-between gap-6">
                <div className="flex items-center gap-8 w-full lg:w-auto">
                    <div className="space-y-1">
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 block">Subtotal</span>
                        <span className="text-xs font-semibold tracking-tight text-slate-600">₹{subTotal.toLocaleString()}</span>
                    </div>
                    <div className="space-y-1">
                        <span className="text-[9px] font-semibold uppercase tracking-widest text-slate-400 block">Total Tax</span>
                        <span className="text-xs font-semibold tracking-tight text-slate-600">₹{totalTax.toLocaleString()}</span>
                    </div>
                    <div className="h-8 w-px bg-slate-100 mx-2" />
                    <div className="space-y-0.5">
                        <span className="text-[9px] font-semibold tracking-tight uppercase tracking-widest text-primary block underline decoration-primary/20 underline-offset-4">Grand Total</span>
                        <div className="flex items-center gap-1 text-primary">
                            <IndianRupee className="h-3.5 w-3.5 font-semibold" />
                            <span className="text-xl font-semibold tracking-tight tracking-tighter">{grandTotal.toLocaleString()}</span>
                        </div>
                    </div>
                </div>

                <div className="w-full lg:w-auto flex flex-col gap-2">
                    {!leadId && (
                        <p className="text-[8px] font-semibold tracking-tight uppercase tracking-widest text-rose-500 text-center animate-pulse">
                            ⚠️ Select Patient Node to Proceed
                        </p>
                    )}
                    <Button
                        onClick={handleSubmit}
                        disabled={loading || subTotal === 0 || !leadId}
                        className={cn(
                            "h-14 px-10 rounded-xl transition-all font-semibold tracking-tight uppercase tracking-widest text-[10px] shadow-xl",
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
