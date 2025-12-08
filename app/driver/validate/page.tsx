"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine, CheckCircle, XCircle } from "lucide-react";

export default function DriverValidate() {
    const [status, setStatus] = useState<"idle" | "scanning" | "valid" | "invalid">("idle");

    const handleScan = () => {
        setStatus("scanning");
        setTimeout(() => {
            // Randomly validate or fail for demo
            setStatus(Math.random() > 0.2 ? "valid" : "invalid");
        }, 2000);
    };

    const reset = () => setStatus("idle");

    return (
        <div className="p-4 space-y-6">
            <h1 className="text-2xl font-bold text-brand-slate">Validate Ticket</h1>

            {status === "idle" && (
                <div className="space-y-4">
                    <Card className="border-2 border-dashed border-brand-grey/30 bg-gray-50">
                        <CardContent className="p-8 flex flex-col items-center justify-center min-h-[300px]">
                            <ScanLine className="w-16 h-16 text-brand-grey mb-4" />
                            <p className="text-brand-grey text-center mb-6">
                                Point camera at passenger's QR code
                            </p>
                            <Button onClick={handleScan} className="w-full bg-brand-blue">
                                Scan QR Code
                            </Button>
                        </CardContent>
                    </Card>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-gray-300" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-brand-cloud px-2 text-brand-grey">Or enter code</span>
                        </div>
                    </div>

                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="e.g. 8821"
                            className="flex-1 px-4 py-2 rounded-xl border border-gray-300 focus:outline-none focus:border-brand-blue"
                        />
                        <Button variant="secondary">Verify</Button>
                    </div>
                </div>
            )}

            {status === "scanning" && (
                <div className="flex flex-col items-center justify-center min-h-[400px]">
                    <div className="w-20 h-20 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mb-4"></div>
                    <p className="font-bold text-brand-slate">Verifying...</p>
                </div>
            )}

            {status === "valid" && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <CheckCircle className="w-24 h-24 text-green-500 mb-4" />
                    <h2 className="text-3xl font-bold text-brand-slate mb-2">Valid Ticket</h2>
                    <p className="text-brand-grey mb-8">1 Passenger • Market to Central</p>
                    <Button onClick={reset} className="w-full bg-brand-blue">Scan Next</Button>
                </div>
            )}

            {status === "invalid" && (
                <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
                    <XCircle className="w-24 h-24 text-red-500 mb-4" />
                    <h2 className="text-3xl font-bold text-brand-slate mb-2">Invalid Ticket</h2>
                    <p className="text-brand-grey mb-8">Ticket expired or already used</p>
                    <Button onClick={reset} variant="outline" className="w-full">Try Again</Button>
                </div>
            )}
        </div>
    );
}
