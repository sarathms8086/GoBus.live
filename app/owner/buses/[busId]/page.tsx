"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { getBusById, addStopToBus, deleteStopFromBus, Bus, BusStop } from "@/lib/bus-storage";

export default function BusDetailsPage({ params }: { params: { busId: string } }) {
    const router = useRouter();
    const [bus, setBus] = useState<Bus | null>(null);
    const [stopName, setStopName] = useState("");
    const [arrivalTime, setArrivalTime] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        const busData = getBusById(params.busId);
        if (!busData) {
            router.push("/owner");
            return;
        }
        setBus(busData);
    }, [params.busId, router]);

    const handleAddStop = () => {
        if (!stopName || !arrivalTime) {
            setError("Please fill in all fields");
            return;
        }

        try {
            const updatedBus = addStopToBus(params.busId, stopName, arrivalTime);
            setBus(updatedBus);
            setStopName("");
            setArrivalTime("");
            setError("");
        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleDeleteStop = (stopId: string) => {
        try {
            const updatedBus = deleteStopFromBus(params.busId, stopId);
            setBus(updatedBus);
        } catch (err: any) {
            setError(err.message);
        }
    };

    if (!bus) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="p-6 flex items-center bg-white shadow-sm">
                <Link href="/owner">
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-brand-slate">{bus.registrationNumber}</h1>
                    <p className="text-sm text-brand-grey">Ref: {bus.refNumber}</p>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Route Info */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center text-brand-slate mb-2">
                            <MapPin className="w-5 h-5 mr-2 text-brand-green" />
                            <span className="font-bold">{bus.routeFrom} → {bus.routeTo}</span>
                        </div>
                        <div className="flex items-center text-sm text-brand-grey">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{bus.stops.length} stops configured</span>
                        </div>
                    </CardContent>
                </Card>

                {/* Add Stop Form */}
                <Card>
                    <CardContent className="p-6">
                        <h2 className="text-lg font-bold text-brand-slate mb-4">Add Stop</h2>
                        <div className="space-y-4">
                            <Input
                                label="Stop Name"
                                type="text"
                                placeholder="e.g., Silk Board Junction"
                                value={stopName}
                                onChange={(e) => setStopName(e.target.value)}
                            />
                            <Input
                                label="Arrival Time"
                                type="time"
                                value={arrivalTime}
                                onChange={(e) => setArrivalTime(e.target.value)}
                            />
                            {error && (
                                <p className="text-sm text-red-500">{error}</p>
                            )}
                            <Button
                                onClick={handleAddStop}
                                className="w-full bg-brand-green hover:bg-green-700"
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                Add Stop
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stops List */}
                <div>
                    <h2 className="text-lg font-bold text-brand-slate mb-4">Route Stops</h2>
                    {bus.stops.length === 0 ? (
                        <Card>
                            <CardContent className="p-8 text-center">
                                <MapPin className="w-16 h-16 text-brand-grey mx-auto mb-4 opacity-50" />
                                <p className="text-brand-grey">No stops added yet</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {bus.stops.map((stop, index) => (
                                <motion.div
                                    key={stop.id}
                                    initial={{ opacity: 0, x: -20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: index * 0.05 }}
                                >
                                    <Card>
                                        <CardContent className="p-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center flex-1">
                                                    <div className="w-8 h-8 bg-brand-green rounded-full flex items-center justify-center mr-3 shrink-0">
                                                        <span className="text-white text-sm font-bold">{stop.sequence}</span>
                                                    </div>
                                                    <div className="flex-1">
                                                        <h3 className="font-bold text-brand-slate">{stop.name}</h3>
                                                        <p className="text-sm text-brand-grey">{stop.arrivalTime}</p>
                                                    </div>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() => handleDeleteStop(stop.id)}
                                                    className="text-red-500 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-5 h-5" />
                                                </Button>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
