"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, MapPin, Clock, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase, BusWithStops, BusStop } from "@/lib/supabase";
import { busApi } from "@/lib/api/buses";

export default function BusDetailsPage({ params }: { params: Promise<{ busId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [bus, setBus] = useState<BusWithStops | null>(null);
    const [stopName, setStopName] = useState("");
    const [arrivalTime, setArrivalTime] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isAddingStop, setIsAddingStop] = useState(false);

    useEffect(() => {
        const loadBus = async () => {
            try {
                // Check auth
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push("/owner/auth/login");
                    return;
                }

                // Fetch bus with stops
                const busData = await busApi.getById(resolvedParams.busId);
                if (!busData) {
                    router.push("/owner");
                    return;
                }

                // Verify ownership
                if (busData.owner_id !== session.user.id) {
                    router.push("/owner");
                    return;
                }

                setBus(busData);
            } catch (err) {
                console.error('Error loading bus:', err);
                router.push("/owner");
            } finally {
                setIsLoading(false);
            }
        };

        loadBus();
    }, [resolvedParams.busId, router]);

    const handleAddStop = async () => {
        if (!stopName || !arrivalTime) {
            setError("Please fill in all fields");
            return;
        }

        if (!bus) return;

        setIsAddingStop(true);
        setError("");

        try {
            const updatedBus = await busApi.addStop(bus.id, {
                name: stopName,
                arrival_time: arrivalTime,
            });

            setBus(updatedBus);
            setStopName("");
            setArrivalTime("");
        } catch (err: any) {
            console.error('Error adding stop:', err);
            setError(err.message || "Failed to add stop");
        } finally {
            setIsAddingStop(false);
        }
    };

    const handleDeleteStop = async (stopId: string) => {
        if (!bus) return;

        try {
            const updatedBus = await busApi.deleteStop(bus.id, stopId);
            setBus(updatedBus);
        } catch (err: any) {
            console.error('Error deleting stop:', err);
            setError(err.message || "Failed to delete stop");
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
            </div>
        );
    }

    if (!bus) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Bus not found</p>
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
                    <h1 className="text-2xl font-bold text-brand-slate">{bus.registration_number}</h1>
                    <p className="text-sm text-brand-grey">Ref: {bus.ref_number}</p>
                </div>
            </header>

            <div className="p-6 space-y-6">
                {/* Route Info */}
                <Card>
                    <CardContent className="p-4">
                        <div className="flex items-center text-brand-slate mb-2">
                            <MapPin className="w-5 h-5 mr-2 text-brand-green" />
                            <span className="font-bold">{bus.route_from} → {bus.route_to}</span>
                        </div>
                        <div className="flex items-center text-sm text-brand-grey">
                            <Clock className="w-4 h-4 mr-2" />
                            <span>{bus.stops?.length || 0} stops configured</span>
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
                                disabled={isAddingStop}
                            >
                                <Plus className="w-5 h-5 mr-2" />
                                {isAddingStop ? "Adding..." : "Add Stop"}
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* Stops List */}
                <div>
                    <h2 className="text-lg font-bold text-brand-slate mb-4">Route Stops</h2>
                    {!bus.stops || bus.stops.length === 0 ? (
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
                                                        <p className="text-sm text-brand-grey">{stop.arrival_time}</p>
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
