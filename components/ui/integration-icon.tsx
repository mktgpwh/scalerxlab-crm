"use client";

import React from "react";
import Image from "next/image";
import { 
    SiWhatsapp, 
    SiMeta, 
    SiInstagram, 
    SiGoogleads, 
    SiRazorpay 
} from "react-icons/si";
import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface IntegrationIconProps {
    slug: string;
    size?: number;
    className?: string;
}

/**
 * Hybrid Asset Component
 * Maps provider slugs to official brand logos (SVG) or local clinical assets.
 */
export function IntegrationIcon({ slug, size = 40, className }: IntegrationIconProps) {
    const iconProps = {
        size,
        className: cn("transition-all duration-300", className)
    };

    switch (slug) {
        case "whatsapp":
            return <SiWhatsapp {...iconProps} className={cn(iconProps.className, "text-[#25D366]")} />;
        
        case "meta_ads":
        case "meta":
            return <SiMeta {...iconProps} className={cn(iconProps.className, "text-[#0468FF]")} />;
        
        case "instagram":
            return <SiInstagram {...iconProps} className={cn(iconProps.className, "text-[#E1306C]")} />;
        
        case "google_ads":
            return <SiGoogleads {...iconProps} className={cn(iconProps.className, "text-[#4285F4]")} />;
        
        case "razorpay":
            return <SiRazorpay {...iconProps} className={cn(iconProps.className, "text-[#1C2C5E]")} />;

        case "tata":
        case "tata-smartflo":
            return (
                <div 
                    className="relative overflow-hidden rounded-xl bg-white"
                    style={{ width: size, height: size }}
                >
                    <Image 
                        src="/integrations/tata-smartflo.png" 
                        alt="Tata SmartFlo"
                        fill
                        className="object-contain p-1"
                        // Fallback handling in case of missing image
                        onError={(e) => {
                            (e.target as any).style.display = 'none';
                        }}
                    />
                </div>
            );

        case "knowlarity":
            return (
                <div 
                    className="relative overflow-hidden rounded-xl bg-white"
                    style={{ width: size, height: size }}
                >
                    <Image 
                        src="/integrations/knowlarity.png" 
                        alt="Knowlarity"
                        fill
                        className="object-contain p-1"
                        onError={(e) => {
                            (e.target as any).style.display = 'none';
                        }}
                    />
                </div>
            );

        default:
            return (
                <div 
                    className="flex items-center justify-center rounded-xl bg-primary/5"
                    style={{ width: size, height: size }}
                >
                    <Sparkles className={cn("text-primary/40", className)} size={size * 0.6} />
                </div>
            );
    }
}
