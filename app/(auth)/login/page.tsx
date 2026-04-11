"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Lock, Mail, Eye, EyeOff, Sparkles, ShieldCheck, ChevronRight } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useEffect } from "react";

export default function LoginPage() {
  const router = useRouter();
  const supabase = createClient();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Remember Me functionality
  useEffect(() => {
    const savedEmail = localStorage.getItem("scalerx_remembered_email");
    if (savedEmail) {
      setEmail(savedEmail);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (rememberMe) {
      localStorage.setItem("scalerx_remembered_email", email);
    } else {
      localStorage.removeItem("scalerx_remembered_email");
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        toast.error("Authentication Failed", {
          description: error.message,
        });
        return;
      }

      toast.success("Welcome Back", {
        description: "Accessing Command Center...",
      });
      
      router.push("/leads");
      router.refresh();
    } catch (err) {
      toast.error("System Error", {
        description: "An unexpected error occurred during tactical login.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen w-full flex items-center justify-center p-4 bg-slate-50 overflow-hidden">
      {/* Dynamic Background Elements - Lighter Variants */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/5 rounded-full blur-[120px]" />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03] mix-blend-overlay" />
      </div>

      <div className="relative z-10 w-full max-w-[440px] animate-in fade-in slide-in-from-bottom-4 duration-1000">
        {/* Logo Section */}
        <div className="flex flex-col items-center mb-10 space-y-4">
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary to-indigo-500 rounded-3xl blur opacity-10 group-hover:opacity-20 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative bg-white rounded-3xl p-5 shadow-sm border border-slate-200/60 ring-1 ring-slate-100">
                <Image
                    src="/scalerxlab-logo.png"
                    alt="ScalerX Lab"
                    width={180}
                    height={45}
                    className="object-contain"
                    priority
                />
            </div>
          </div>
          <div className="text-center">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-primary flex items-center justify-center gap-2">
              <Sparkles className="h-3 w-3" />
              Intelligence Node
            </h2>
            <p className="text-slate-400 text-[9px] font-bold uppercase tracking-[0.2em] mt-2">Active CRM Matrix</p>
          </div>
        </div>

        <Card className="surface-layered border-none rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] bg-white/80 backdrop-blur-xl overflow-hidden ring-1 ring-slate-200/50">
          <CardHeader className="space-y-1 pb-10 text-center pt-12">
            <CardTitle className="text-4xl font-black tracking-tighter italic lowercase text-slate-900 px-6 leading-tight">
              Welcome to Scaler.X Command Center
            </CardTitle>
            <CardDescription className="text-slate-400 text-[10px] font-bold uppercase tracking-widest pt-3">
              Identify yourself to access the engagement hub
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 px-12 pb-12">
            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2.5">
                <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Tactical Identifier</Label>
                <div className="relative group">
                  <Mail className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input
                    type="email"
                    placeholder="agent@scalerxlab.com"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-14 pl-14 rounded-2xl bg-slate-50/50 border-slate-200/60 ring-1 ring-slate-100 text-sm font-semibold focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
                  />
                </div>
              </div>
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Access Key</Label>
                  <Link
                    href="/forgot-password"
                    className="text-[10px] font-black uppercase tracking-widest text-primary/60 hover:text-primary transition-colors"
                  >
                    Key Recovery?
                  </Link>
                </div>
                <div className="relative group">
                  <Lock className="absolute left-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 pl-14 pr-14 rounded-2xl bg-slate-50/50 border-slate-200/60 ring-1 ring-slate-100 text-sm font-semibold focus:ring-primary/20 focus:border-primary/40 transition-all placeholder:text-slate-400 text-slate-900 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 hover:text-slate-500 transition-colors"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center space-x-3 pt-1 ml-1">
                <div 
                    className={cn(
                        "w-5 h-5 rounded-lg border flex items-center justify-center transition-all cursor-pointer shadow-sm",
                        rememberMe ? "bg-primary border-primary" : "border-slate-200 bg-white"
                    )}
                    onClick={() => setRememberMe(!rememberMe)}
                >
                    {rememberMe && <ShieldCheck className="h-3.5 w-3.5 text-white" />}
                </div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 cursor-pointer select-none" onClick={() => setRememberMe(!rememberMe)}>
                  Maintain Persistent Link
                </label>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-[1.25rem] bg-slate-900 hover:bg-black text-white text-[11px] font-black uppercase tracking-[0.2em] shadow-[0_12px_24px_-6px_rgba(0,0,0,0.15)] group transition-all"
              >
                {loading ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <span className="flex items-center justify-center">
                    Sign in
                    <ChevronRight className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
                  </span>
                )}
              </Button>
            </form>
          </CardContent>
          <CardFooter className="pb-12 pt-0 flex flex-col space-y-4">
             <div className="h-px w-20 bg-slate-100 mx-auto" />
              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center px-16 leading-relaxed flex items-center justify-center gap-2">
                 Protected by ScalerX Sovereign Security.
              </p>
              <div className="flex items-center justify-center gap-2 opacity-40 hover:opacity-100 transition-opacity pb-4">
                <div className="h-4 w-4 relative">
                  <Image src="/scalerxlab-logo.png" alt="ScalerX" fill className="object-contain grayscale" />
                </div>
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-slate-500">
                  Powered by <span className="text-slate-400">ScalerX Lab</span>
                </span>
              </div>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}
