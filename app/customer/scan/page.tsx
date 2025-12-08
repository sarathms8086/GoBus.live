"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ScanLine } from "lucide-react";
import Link from "next/link";

export default function ScanPage() {
    const router = useRouter();
    const [scanned, setScanned] = useState(false);

    useEffect(() => {
        const timer = setTimeout(() => {
            setScanned(true);
            setTimeout(() => {
                router.push("/customer/bus/402");
            }, 500);
        }, 2000);

        return () => clearTimeout(timer);
    }, [router]);

    return (
        <div className="min-h-screen bg-black text-white flex flex-col relative">
            <div className="p-4 z-10">
                <Link href="/customer">
                    <ArrowLeft className="w-6 h-6 text-white" />
                </Link>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center relative">
                <div className="w-64 h-64 border-2 border-brand-green rounded-3xl relative flex items-center justify-center overflow-hidden">
                    <div className="absolute inset-0 bg-brand-green/10 animate-pulse"></div>
                    <ScanLine className="w-full h-full text-brand-green/50 p-4" />
                    {/* Scanning Line */}
                    <div className="absolute top-0 left-0 right-0 h-1 bg-brand-green shadow-[0_0_20px_rgba(11,163,96,0.8)] animate-[scan_2s_ease-in-out_infinite]"></div>
                </div>
                <p className="mt-8 text-lg font-medium">
                    {scanned ? "QR Code Detected!" : "Point at QR Code inside bus"}
                </p>
            </div>

            <style jsx>{`
        @keyframes scan {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
      `}</style>
        </div>
    );
}
