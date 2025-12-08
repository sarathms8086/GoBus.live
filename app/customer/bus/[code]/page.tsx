"use client";

import { useParams, useRouter } from "next/navigation";
import { MOCK_BUSES } from "@/lib/mock-db";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Clock, Users, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

export default function BusDetails() {
    const params = useParams();
    const router = useRouter();
    const code = params?.code as string;
    const bus = MOCK_BUSES.find((b) => b.code === code);
    const [booking, setBooking] = useState(false);

    if (!bus) {
        return <div className="p-4">Bus not found</div>;
    }

    const handleBook = () => {
        setBooking(true);
        // Simulate API call
        setTimeout(() => {
            router.push("/customer/tickets?new=true");
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-brand-cloud pb-24 relative">
            {/* Header */}
            <div className="bg-brand-green text-white p-4 pt-8 pb-12 rounded-b-3xl shadow-md">
                <div className="flex items-center mb-4">
                    <Link href="/customer">
                        <ArrowLeft className="w-6 h-6 mr-4" />
                    </Link>
                    <h1 className="text-xl font-bold">Bus {bus.code}</h1>
                </div>
                <div className="flex justify-between items-end">
                    <div>
                        <p className="opacity-80 text-sm">Route</p>
                        <p className="font-bold text-lg">{bus.routeName}</p>
                    </div>
                    <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-medium backdrop-blur-sm">
                        {bus.numberPlate}
                    </div>
                </div>
            </div>

            <div className="p-4 -mt-8">
                {/* Live Status Card */}
                <Card className="mb-4 shadow-lg border-none">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center text-brand-slate">
                                <Clock className="w-5 h-5 mr-2 text-brand-green" />
                                <span className="font-bold">Arriving in {bus.etaNextStop}</span>
                            </div>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${bus.occupancy === "Low" ? "bg-green-100 text-green-700" :
                                    bus.occupancy === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                        "bg-red-100 text-red-700"
                                }`}>
                                {bus.occupancy} Occupancy
                            </span>
                        </div>

                        {/* Timeline */}
                        <div className="space-y-6 relative pl-4 border-l-2 border-dashed border-gray-200 ml-2">
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-gray-300 rounded-full border-2 border-white ring-1 ring-gray-200"></div>
                                <p className="text-sm text-brand-grey">{bus.currentStop}</p>
                                <p className="text-xs text-gray-400">Departed 10:25 AM</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[23px] top-0 w-4 h-4 bg-brand-green rounded-full border-2 border-white ring-2 ring-brand-green/30 animate-pulse"></div>
                                <p className="font-bold text-brand-slate">{bus.nextStop}</p>
                                <p className="text-xs text-brand-green">ETA {bus.etaNextStop}</p>
                            </div>
                            <div className="relative">
                                <div className="absolute -left-[21px] top-1 w-3 h-3 bg-gray-300 rounded-full border-2 border-white ring-1 ring-gray-200"></div>
                                <p className="text-sm text-brand-grey">Destination</p>
                                <p className="text-xs text-gray-400">11:00 AM</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Map Placeholder */}
                <div className="bg-gray-200 rounded-xl h-48 w-full flex items-center justify-center mb-4 relative overflow-hidden">
                    <div className="absolute inset-0 bg-[url('https://www.google.com/maps/d/thumbnail?mid=1yD5ig-8HjFj6s8HjFj6s8HjFj6s')] bg-cover opacity-50"></div>
                    <div className="bg-white/80 backdrop-blur-sm px-4 py-2 rounded-lg font-medium text-brand-slate z-10">
                        Live Map View
                    </div>
                </div>

                {/* Booking Action */}
                <div className="fixed bottom-20 left-4 right-4">
                    <Button
                        onClick={handleBook}
                        disabled={booking}
                        className="w-full py-6 text-lg shadow-xl bg-brand-green hover:bg-green-700"
                    >
                        {booking ? "Processing..." : "Book Ticket - ₹25"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
