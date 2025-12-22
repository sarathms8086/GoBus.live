"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, XCircle, Camera, Check, MapPin, Clock, Users, UserMinus, Ticket, Radio, Navigation } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const CURRENT_DRIVER_KEY = "go_bus_current_driver";

interface TripStop {
    id: string;
    name: string;
    arrival_time: string;
    sequence: number;
}

interface Trip {
    id: string;
    trip_number: number;
    start_time: string;
    end_time: string | null;
    days_of_week: string[];
    stops: TripStop[];
}

interface BusInfo {
    id: string;
    registration_number: string;
    route_from: string;
    route_to: string;
}

export default function DriverValidate() {
    const router = useRouter();
    const [status, setStatus] = useState<"idle" | "scanning" | "verifying" | "valid" | "invalid">("idle");
    const [cameraError, setCameraError] = useState<string | null>(null);
    const [manualCode, setManualCode] = useState("");
    const [ticketInfo, setTicketInfo] = useState<any>(null);
    const [currentTime, setCurrentTime] = useState(new Date());

    const [trips, setTrips] = useState<Trip[]>([]);
    const [bus, setBus] = useState<BusInfo | null>(null);
    const [currentTrip, setCurrentTrip] = useState<Trip | null>(null);
    const [tripStatus, setTripStatus] = useState<"live" | "upcoming" | "none">("none");
    const [nextStop, setNextStop] = useState<TripStop | null>(null);

    const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null);

    const [occupancy, setOccupancy] = useState(0);
    const [droppingNext, setDroppingNext] = useState(0);
    const [totalTickets, setTotalTickets] = useState(0);
    const [activeTickets, setActiveTickets] = useState<any[]>([]);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    useEffect(() => {
        const driverId = localStorage.getItem(CURRENT_DRIVER_KEY);
        if (!driverId) {
            router.push("/driver/auth/login");
            return;
        }

        loadDashboardData();
        startLocationTracking();

        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => { clearInterval(timer); stopCamera(); };
    }, [router]);

    useEffect(() => {
        if (trips.length > 0) updateTripStatus();
    }, [currentTime, trips]);

    const startLocationTracking = () => {
        if ("geolocation" in navigator) {
            navigator.geolocation.watchPosition(
                (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
                () => { },
                { enableHighAccuracy: true, timeout: 10000, maximumAge: 5000 }
            );
        }
    };

    const loadDashboardData = async () => {
        const driverId = localStorage.getItem(CURRENT_DRIVER_KEY);
        if (!driverId) return;
        try {
            const response = await fetch(`/api/driver/dashboard?driverId=${driverId}`);
            const result = await response.json();
            if (response.ok) {
                setBus(result.bus);
                setTrips(result.trips || []);
            }
        } catch (error) {
            console.error("Error loading data:", error);
        }
    };

    const parseTimeToDate = (timeStr: string): Date => {
        const [hours, minutes] = timeStr.split(':').map(Number);
        const date = new Date();
        date.setHours(hours, minutes, 0, 0);
        return date;
    };

    const formatTime = (time: string) => {
        if (!time) return '';
        const [hours, minutes] = time.split(':');
        const h = parseInt(hours);
        const ampm = h >= 12 ? 'PM' : 'AM';
        return `${h % 12 || 12}:${minutes} ${ampm}`;
    };

    const getTimeLeft = (targetTime: Date): string => {
        const diffMs = targetTime.getTime() - currentTime.getTime();
        if (diffMs <= 0) return "Now";
        const hours = Math.floor(diffMs / (1000 * 60 * 60));
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
    };

    const calculateETA = (stop: TripStop): string => {
        const scheduledTime = parseTimeToDate(stop.arrival_time);
        const diffMs = scheduledTime.getTime() - currentTime.getTime();
        const diffMinutes = Math.round(diffMs / (1000 * 60));
        if (diffMinutes <= 0) return "Arriving";
        return `${diffMinutes} min`;
    };

    const updateTripStatus = () => {
        const now = currentTime;
        const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const today = dayNames[now.getDay()];

        let liveTrip: Trip | null = null;
        let upcomingTrip: Trip | null = null;
        let earliestUpcoming: Date | null = null;

        for (const trip of trips) {
            if (!trip.days_of_week?.includes(today)) continue;
            const startTime = parseTimeToDate(trip.start_time);
            const lastStop = trip.stops?.[trip.stops.length - 1];
            const endTime = lastStop ? parseTimeToDate(lastStop.arrival_time) : new Date(startTime.getTime() + 2 * 60 * 60 * 1000);

            if (now >= startTime && now <= endTime) { liveTrip = trip; break; }
            else if (now < startTime && (!earliestUpcoming || startTime < earliestUpcoming)) {
                earliestUpcoming = startTime;
                upcomingTrip = trip;
            }
        }

        if (liveTrip) {
            setCurrentTrip(liveTrip);
            setTripStatus("live");
            updateNextStop(liveTrip);
        } else if (upcomingTrip) {
            setCurrentTrip(upcomingTrip);
            setTripStatus("upcoming");
            setNextStop(upcomingTrip.stops?.[0] || null);
        } else {
            setCurrentTrip(null);
            setTripStatus("none");
            setNextStop(null);
        }
    };

    const updateNextStop = (trip: Trip) => {
        if (!trip.stops?.length) return;
        for (let i = 0; i < trip.stops.length; i++) {
            if (currentTime < parseTimeToDate(trip.stops[i].arrival_time)) {
                setNextStop(trip.stops[i]);
                const dropping = activeTickets.filter(t => t.to_stop === trip.stops[i].name).length;
                setDroppingNext(dropping);
                return;
            }
        }
        setNextStop(trip.stops[trip.stops.length - 1]);
    };

    const startCamera = async () => {
        try {
            setCameraError(null);
            setStatus("scanning");
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
            streamRef.current = stream;
            if (videoRef.current) { videoRef.current.srcObject = stream; videoRef.current.play(); }
        } catch (error: any) {
            setCameraError(error.message || "Could not access camera");
            setStatus("idle");
        }
    };

    const stopCamera = () => {
        if (streamRef.current) { streamRef.current.getTracks().forEach(track => track.stop()); streamRef.current = null; }
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
                setOccupancy(prev => prev + (result.ticket.passengers || 1));
                setTotalTickets(prev => prev + 1);
                setActiveTickets(prev => [...prev, result.ticket]);
            } else {
                setStatus("invalid");
            }
        } catch { setStatus("invalid"); }
    };

    const reset = () => { setStatus("idle"); setManualCode(""); setTicketInfo(null); stopCamera(); };

    return (
        <div className="min-h-screen bg-brand-cloud pb-24 flex flex-col">
            {/* TOP: Trip Status Header */}
            <div className="bg-brand-blue px-4 py-4">
                <div className="flex items-center justify-between mb-2">
                    <h1 className="text-lg font-bold text-white">Validate Ticket</h1>
                    {bus && <span className="text-blue-100 text-xs">{bus.registration_number}</span>}
                </div>

                {/* Trip Status Banner */}
                {tripStatus === "live" && currentTrip && (
                    <div className="bg-green-500 rounded-xl p-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                            <span className="text-white font-bold">Trip {currentTrip.trip_number}</span>
                        </div>
                        <span className="bg-white text-green-600 px-3 py-1 rounded-full text-sm font-bold">LIVE NOW</span>
                    </div>
                )}
                {tripStatus === "upcoming" && currentTrip && (
                    <div className="bg-white/20 rounded-xl p-3 flex items-center justify-between">
                        <span className="text-white font-medium">Trip {currentTrip.trip_number}</span>
                        <span className="text-white text-sm">Starts in <span className="font-bold">{getTimeLeft(parseTimeToDate(currentTrip.start_time))}</span></span>
                    </div>
                )}
                {tripStatus === "none" && (
                    <div className="bg-white/10 rounded-xl p-3 text-center">
                        <span className="text-blue-100 text-sm">No trips scheduled for today</span>
                    </div>
                )}
            </div>

            {/* MIDDLE: Next Stop Box + Stats */}
            <div className="flex-1 p-4 space-y-4">
                {/* Next Stop Box */}
                {nextStop && (
                    <Card className="border-0 shadow-lg bg-white">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-brand-grey text-xs uppercase mb-2">
                                <MapPin className="w-4 h-4" />
                                <span>{tripStatus === "live" ? "Next Stop" : "First Stop"}</span>
                            </div>
                            <h2 className="text-2xl font-bold text-brand-slate mb-4">{nextStop.name}</h2>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-gray-50 rounded-xl p-3">
                                    <div className="flex items-center gap-1 text-brand-grey text-xs mb-1">
                                        <Clock className="w-3 h-3" />
                                        <span>Scheduled</span>
                                    </div>
                                    <p className="text-lg font-bold text-brand-slate">{formatTime(nextStop.arrival_time)}</p>
                                </div>
                                <div className="bg-blue-50 rounded-xl p-3">
                                    <div className="flex items-center gap-1 text-brand-blue text-xs mb-1">
                                        <Navigation className="w-3 h-3" />
                                        <span>Expected</span>
                                        {driverLocation && <span className="ml-1 text-green-500">📍</span>}
                                    </div>
                                    <p className="text-lg font-bold text-brand-blue">{calculateETA(nextStop)}</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-3 gap-2">
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-3 text-center">
                            <Users className="w-5 h-5 text-brand-blue mx-auto mb-1" />
                            <p className="text-2xl font-bold text-brand-slate">{occupancy}</p>
                            <p className="text-[10px] text-brand-grey">Occupancy</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-3 text-center">
                            <UserMinus className="w-5 h-5 text-orange-500 mx-auto mb-1" />
                            <p className="text-2xl font-bold text-brand-slate">{droppingNext}</p>
                            <p className="text-[10px] text-brand-grey">Drop Next</p>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-md">
                        <CardContent className="p-3 text-center">
                            <Ticket className="w-5 h-5 text-brand-green mx-auto mb-1" />
                            <p className="text-2xl font-bold text-brand-slate">{totalTickets}</p>
                            <p className="text-[10px] text-brand-grey">Total</p>
                        </CardContent>
                    </Card>
                </div>

                {/* Result Messages */}
                <AnimatePresence>
                    {status === "valid" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3">
                            <CheckCircle className="w-8 h-8 text-brand-green flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold text-brand-green">Valid Ticket ✓</p>
                                {ticketInfo && <p className="text-sm text-brand-grey">{ticketInfo.passengers || 1} pax • {ticketInfo.from_stop} → {ticketInfo.to_stop}</p>}
                            </div>
                            <Button onClick={reset} size="sm" className="bg-brand-green">Next</Button>
                        </motion.div>
                    )}
                    {status === "invalid" && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                            className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                            <XCircle className="w-8 h-8 text-red-500 flex-shrink-0" />
                            <div className="flex-1">
                                <p className="font-bold text-red-600">Invalid Ticket ✗</p>
                                <p className="text-sm text-brand-grey">Not found or already used</p>
                            </div>
                            <Button onClick={reset} size="sm" variant="outline">Retry</Button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Camera View */}
                {status === "scanning" && (
                    <Card className="overflow-hidden shadow-xl border-0">
                        <CardContent className="p-0">
                            <div className="relative bg-gray-900 aspect-video">
                                <video ref={videoRef} className="w-full h-full object-cover" playsInline muted />
                                <canvas ref={canvasRef} className="hidden" />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="w-40 h-40 border-2 border-white/30 rounded-xl relative">
                                        <div className="absolute top-0 left-0 w-5 h-5 border-t-4 border-l-4 border-brand-blue"></div>
                                        <div className="absolute top-0 right-0 w-5 h-5 border-t-4 border-r-4 border-brand-blue"></div>
                                        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-4 border-l-4 border-brand-blue"></div>
                                        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-4 border-r-4 border-brand-blue"></div>
                                    </div>
                                </div>
                            </div>
                            <button onClick={reset} className="w-full py-3 bg-red-500 text-white font-semibold">Cancel</button>
                        </CardContent>
                    </Card>
                )}
            </div>

            {/* BOTTOM: Ticket Entry Box (Fixed) */}
            {(status === "idle" || status === "verifying") && (
                <div className="fixed bottom-16 left-0 right-0 bg-white border-t shadow-lg p-3">
                    <div className="flex gap-2 items-center max-w-lg mx-auto">
                        <button onClick={startCamera}
                            className="w-12 h-12 bg-gradient-to-br from-brand-blue to-blue-600 rounded-xl flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform flex-shrink-0">
                            <Camera className="w-5 h-5 text-white" />
                        </button>
                        <input
                            type="tel"
                            inputMode="numeric"
                            pattern="[0-9]*"
                            value={manualCode}
                            onChange={(e) => setManualCode(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleVerify()}
                            placeholder="Enter ticket code"
                            className="flex-1 px-4 py-3 text-base font-mono bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-brand-blue text-center tracking-widest"
                        />
                        <button onClick={handleVerify}
                            disabled={!manualCode.trim() || status === "verifying"}
                            className="w-12 h-12 bg-brand-green rounded-xl flex items-center justify-center shadow disabled:bg-gray-300 hover:bg-green-600 active:scale-95 transition-all flex-shrink-0">
                            {status === "verifying" ? (
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                                <Check className="w-5 h-5 text-white" />
                            )}
                        </button>
                    </div>
                    {cameraError && <p className="text-red-500 text-xs text-center mt-2">{cameraError}</p>}
                </div>
            )}
        </div>
    );
}
