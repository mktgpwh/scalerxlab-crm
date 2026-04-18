"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, User, Phone, Check } from "lucide-react";
import { Input } from "@/components/ui/input";
import { searchPatients } from "@/app/(dashboard)/billing/actions";
import { cn } from "@/lib/utils";

interface Patient {
    id: string;
    name: string;
    phone: string | null;
    whatsappNumber: string | null;
    category: string;
}

interface PatientLookupProps {
    onSelect: (patient: Patient) => void;
    selectedId?: string;
}

export function PatientLookup({ onSelect, selectedId }: PatientLookupProps) {
    const [query, setQuery] = useState("");
    const [results, setResults] = useState<Patient[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    useEffect(() => {
        const fetchResults = async () => {
            if (query.trim().length < 2) {
                setResults([]);
                return;
            }
            setLoading(true);
            const data = await searchPatients(query);
            setResults(data as Patient[]);
            setLoading(false);
            setIsOpen(data.length > 0);
        };

        const timer = setTimeout(fetchResults, 300);
        return () => clearTimeout(timer);
    }, [query]);

    return (
        <div className="relative w-full" ref={containerRef}>
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                    placeholder="Search Patient by Name or Phone..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => query.length >= 2 && setIsOpen(true)}
                    className="h-14 pl-12 pr-4 rounded-2xl bg-white border-none ring-1 ring-slate-200/60 font-medium text-slate-900 focus:ring-primary/20 transition-all shadow-sm"
                />
            </div>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-3xl shadow-2xl border border-slate-100 p-2 z-[50] overflow-hidden animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar">
                        {results.length > 0 ? (
                            results.map((patient) => (
                                <button
                                    key={patient.id}
                                    onClick={() => {
                                        onSelect(patient);
                                        setQuery(patient.name);
                                        setIsOpen(false);
                                    }}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl hover:bg-slate-50 transition-colors text-left group",
                                        selectedId === patient.id && "bg-primary/5"
                                    )}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="h-10 w-10 rounded-xl bg-slate-100 flex items-center justify-center text-primary group-hover:bg-primary group-hover:text-white transition-colors">
                                            <User className="h-5 w-5" />
                                        </div>
                                        <div>
                                            <p className="font-bold text-slate-900 group-hover:text-primary transition-colors">
                                                {patient.name}
                                            </p>
                                            <div className="flex items-center gap-3 mt-0.5">
                                                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                                    <Phone className="h-3 w-3" />
                                                    {patient.whatsappNumber || patient.phone || "No Number"}
                                                </div>
                                                <span className="text-[10px] bg-slate-100 px-2 py-0.5 rounded-full font-black text-slate-400 uppercase tracking-widest">
                                                    {patient.category}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    {selectedId === patient.id && (
                                        <Check className="h-5 w-5 text-primary" />
                                    )}
                                </button>
                            ))
                        ) : (
                            <div className="p-8 text-center">
                                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">No Patients Found</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
