"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScanLine, CheckCircle, XCircle, Camera, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CURRENT_DRIVER_KEY = "go_bus_current_driver";

export default function DriverValidate() {
    const router = useRouter();
    const [status, setStatus] = useState<"idle" | "scanning" | "verifying" | "valid" | "invalid">("idle");
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState("");
    const [ticketInfo, setTicketInfo] = useState<any>(null);
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const driverId = localStorage.getItem(CURRENT_DRIVER_KEY);
        if (!driverId) {
            router.push("/driver/auth/login");
        }
        return () => stopCamera();
    }, [router]);

    const startCamera = async () => {
        try {
            setCameraError(null);
            setStatus("scanning");

            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "environment" }
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.play();
            }
        } catch (error: any) {
            console.error("Camera error:", error);
            setCameraError(error.message || "Could not access camera");
            setStatus("idle");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const handleVerify = async () => {
        if (!manualCode.trim()) return;

        setStatus("verifying");

        try {
            const response = await fetch(`/api/ticket/verify?code=${encodeURIComponent(manualCode.trim())}`);
            const result = await response.json();

            if (response.ok && result.valid) {
                setTicketInfo(result.ticket);
                setStatus("valid");
            } else {
                setTicketInfo(null);
                setStatus("invalid");
            }
        } catch (error) {
            console.error("Verification error:", error);
            setStatus("invalid");
        }
    };

    const reset = () => {
        setStatus("idle");
        setManualCode("");
        setTicketInfo(null);
        stopCamera();
    };

    return (
        <div className="min-h-screen bg-brand-cloud">
            {/* Header */}
            <div className="bg-brand-blue px-6 py-6">
                <h1 className="text-2xl font-bold text-white">Validate Ticket</h1>
            </div>

            <div className="p-4">
                <AnimatePresence mode="wait">
                    {(status === "idle" || status === "verifying") && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="space-y-6"
                        >
                            {/* Scan QR Button - Compact Icon */}
                            <div className="flex justify-center">
                                <button
                                    onClick={startCamera}
                                    className="group flex flex-col items-center gap-2"
                                >
                                    <div className="w-20 h-20 bg-gradient-to-br from-brand-blue to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-brand-blue/30 group-hover:scale-105 group-active:scale-95 transition-transform relative overflow-hidden">
                                        <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        <Camera className="w-9 h-9 text-white" />
                                    </div>
                                    <span className="text-sm font-medium text-brand-slate">Scan QR</span>
                                </button>
                            </div>

                            {cameraError && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-red-600 text-sm text-center">
                                    ⚠️ {cameraError}
                                </div>
                            )}

                            {/* Divider */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-brand-cloud px-4 text-sm text-brand-grey">or enter code</span>
                                </div>
                            </div>

                            {/* Manual Entry - Text Box with Check Button */}
                            <Card className="shadow-lg border-0">
                                <CardContent className="p-4">
                                    <div className="flex gap-3">
                                        <input
                                            type="text"
                                            value={manualCode}
                                            onChange={(e) => setManualCode(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                                            placeholder="Enter ticket code"
                                            className="flex-1 px-4 py-4 text-lg font-mono bg-gray-50 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue focus:bg-white transition-all"
                                        />
                                        <button
                                            onClick={handleVerify}
                                            disabled={!manualCode.trim() || status === "verifying"}
                                            className="w-14 h-14 bg-brand-green rounded-xl flex items-center justify-center shadow-lg disabled:bg-gray-300 disabled:shadow-none hover:bg-green-600 active:scale-95 transition-all"
                                        >
                                            {status === "verifying" ? (
                                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            ) : (
                                                <Check className="w-6 h-6 text-white" />
                                            )}
                                        </button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stats */}
                            <div className="flex justify-center gap-8 pt-4">
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-brand-green">0</p>
                                    <p className="text-xs text-brand-grey">Valid Today</p>
                                </div>
                                <div className="w-px bg-gray-200"></div>
                                <div className="text-center">
                                    <p className="text-3xl font-bold text-red-500">0</p>
                                    <p className="text-xs text-brand-grey">Invalid Today</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {status === "scanning" && (
                        <motion.div
                            key="scanning"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                        >
                            <Card className="overflow-hidden shadow-xl">
                                <CardContent className="p-0">
                                    <div className="relative bg-gray-900 aspect-square">
                                        <video
                                            ref={videoRef}
                                            className="w-full h-full object-cover"
                                            playsInline
                                            muted
                                        />
                                        <canvas ref={canvasRef} className="hidden" />

                                        {/* Scanning Overlay */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-56 h-56 border-2 border-white/30 rounded-2xl relative">
                                                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-brand-blue rounded-tl-lg"></div>
                                                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-brand-blue rounded-tr-lg"></div>
                                                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-brand-blue rounded-bl-lg"></div>
                                                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-brand-blue rounded-br-lg"></div>

                                                <motion.div
                                                    className="absolute left-4 right-4 h-0.5 bg-brand-blue"
                                                    animate={{ top: ["10%", "90%", "10%"] }}
                                                    transition={{ duration: 2, repeat: Infinity }}
                                                />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-4 left-0 right-0 text-center">
                                            <span className="bg-black/60 text-white px-4 py-2 rounded-full text-sm">
                                                Point at QR code
                                            </span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={reset}
                                        className="w-full py-4 bg-red-500 text-white font-semibold hover:bg-red-600"
                                    >
                                        Cancel
                                    </button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}

                    {status === "valid" && (
                        <motion.div
                            key="valid"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.1 }}
                                className="w-28 h-28 bg-brand-green rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-brand-green/30"
                            >
                                <CheckCircle className="w-16 h-16 text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-brand-slate mb-2">Valid ✓</h2>
                            {ticketInfo && (
                                <Card className="mt-4 border-brand-green/20">
                                    <CardContent className="p-4 text-left">
                                        <p className="text-brand-grey text-sm">
                                            <span className="font-bold text-brand-slate">{ticketInfo.passengers || 1}</span> Passenger(s)
                                        </p>
                                        <p className="text-brand-grey text-sm">
                                            {ticketInfo.from_stop} → {ticketInfo.to_stop}
                                        </p>
                                    </CardContent>
                                </Card>
                            )}
                            <Button onClick={reset} className="w-full mt-6 py-6 bg-brand-blue">
                                Scan Next
                            </Button>
                        </motion.div>
                    )}

                    {status === "invalid" && (
                        <motion.div
                            key="invalid"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center py-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: "spring", delay: 0.1 }}
                                className="w-28 h-28 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-red-500/30"
                            >
                                <XCircle className="w-16 h-16 text-white" />
                            </motion.div>
                            <h2 className="text-3xl font-bold text-brand-slate mb-2">Invalid ✗</h2>
                            <p className="text-brand-grey">Ticket not found or already used</p>
                            <Button onClick={reset} variant="outline" className="w-full mt-6 py-6">
                                Try Again
                            </Button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
