"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, Check, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase, Bus, DayOfWeek } from "@/lib/supabase";
import { tripApi } from "@/lib/api/trips";

const DAY_LABELS: Record<DayOfWeek, string> = {
    mon: 'Mon',
    tue: 'Tue',
    wed: 'Wed',
    thu: 'Thu',
    fri: 'Fri',
    sat: 'Sat',
    sun: 'Sun',
};

const ALL_DAYS: DayOfWeek[] = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

interface TripConfig {
    tripNumber: number;
    startTime: string;
    daysOfWeek: DayOfWeek[];
    numberOfStops: number;
    stops: { name: string; arrivalTime: string }[];
}

// Helper component for 12-hour time input
const CustomTimeInput = ({ value, onChange }: { value: string, onChange: (val: string) => void }) => {
    // Parse initial value (HH:MM 24h format)
    const [hour, setHour] = useState("12");
    const [minute, setMinute] = useState("00");
    const [ampm, setAmpm] = useState("AM");

    useEffect(() => {
        if (value) {
            const [h, m] = value.split(':');
            let hNum = parseInt(h);
            const period = hNum >= 12 ? 'PM' : 'AM';
            if (hNum > 12) hNum -= 12;
            if (hNum === 0) hNum = 12;

            setHour(hNum.toString().padStart(2, '0'));
            setMinute(m);
            setAmpm(period);
        }
    }, [value]);

    const updateTime = (newHour: string, newMinute: string, newAmpm: string) => {
        let h = parseInt(newHour);
        if (newAmpm === 'PM' && h !== 12) h += 12;
        if (newAmpm === 'AM' && h === 12) h = 0;
        const timeStr = `${h.toString().padStart(2, '0')}:${newMinute}`;
        onChange(timeStr);

        // Update local state immediately for UI responsiveness
        setHour(newHour);
        setMinute(newMinute);
        setAmpm(newAmpm);
    };

    return (
        <div className="flex items-center gap-1">
            <select
                value={hour}
                onChange={(e) => updateTime(e.target.value, minute, ampm)}
                className="bg-white border border-gray-200 rounded px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green w-14"
            >
                {Array.from({ length: 12 }, (_, i) => i + 1).map(h => (
                    <option key={h} value={h.toString().padStart(2, '0')}>
                        {h.toString().padStart(2, '0')}
                    </option>
                ))}
            </select>
            <span className="text-gray-400 font-bold">:</span>
            <select
                value={minute}
                onChange={(e) => updateTime(hour, e.target.value, ampm)}
                className="bg-white border border-gray-200 rounded px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green w-14"
            >
                {Array.from({ length: 60 }, (_, i) => i).map(m => (
                    <option key={m} value={m.toString().padStart(2, '0')}>
                        {m.toString().padStart(2, '0')}
                    </option>
                ))}
            </select>
            <select
                value={ampm}
                onChange={(e) => updateTime(hour, minute, e.target.value)}
                className="bg-white border border-gray-200 rounded px-1 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand-green font-medium w-16"
            >
                <option value="AM">AM</option>
                <option value="PM">PM</option>
            </select>
        </div>
    );
};

export default function BusSetupPage({ params }: { params: Promise<{ busId: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [bus, setBus] = useState<Bus | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    // Wizard state
    const [step, setStep] = useState(1); // 1: Number of trips, 2: Configure trips, 3: Done
    const [numberOfTrips, setNumberOfTrips] = useState(1);
    const [tripConfigs, setTripConfigs] = useState<TripConfig[]>([]);
    const [currentTripIndex, setCurrentTripIndex] = useState(0);
    const [error, setError] = useState("");

    // Reverse trip feature
    const [showReversePrompt, setShowReversePrompt] = useState(false);
    const [selectedReverseTrip, setSelectedReverseTrip] = useState(0);

    useEffect(() => {
        const loadBus = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push("/owner/auth/login");
                return;
            }

            const { data: busData, error: busError } = await supabase
                .from('buses')
                .select('*')
                .eq('id', resolvedParams.busId)
                .single();

            if (busError || !busData || busData.owner_id !== session.user.id) {
                router.push("/owner");
                return;
            }

            setBus(busData);
            setIsLoading(false);
        };

        loadBus();
    }, [resolvedParams.busId, router]);

    const initializeTripConfigs = () => {
        const configs: TripConfig[] = [];
        for (let i = 0; i < numberOfTrips; i++) {
            configs.push({
                tripNumber: i + 1,
                startTime: "09:00", // Default 9 AM
                daysOfWeek: [...ALL_DAYS],
                numberOfStops: 3,
                stops: [
                    { name: "", arrivalTime: "09:15" },
                    { name: "", arrivalTime: "09:30" },
                    { name: "", arrivalTime: "09:45" },
                ],
            });
        }
        setTripConfigs(configs);
        setCurrentTripIndex(0);
        setStep(2);
    };

    // Check if we should show reverse trip prompt when moving to Trip 2+
    useEffect(() => {
        if (step === 2 && currentTripIndex > 0) {
            // Check if any previous trip has stops configured
            const hasPreviousStops = tripConfigs.slice(0, currentTripIndex).some(
                trip => trip.stops.some(stop => stop.name.trim() !== '')
            );
            if (hasPreviousStops) {
                setSelectedReverseTrip(0); // Default to first trip
                setShowReversePrompt(true);
            }
        }
    }, [currentTripIndex, step]);

    // Apply reverse trip stops
    const applyReverseTrip = () => {
        const sourceTrip = tripConfigs[selectedReverseTrip];
        const reversedStops = [...sourceTrip.stops].reverse().map(stop => ({
            name: stop.name,
            arrivalTime: "09:00", // Reset time for owner to fill
        }));

        const updated = [...tripConfigs];
        updated[currentTripIndex] = {
            ...updated[currentTripIndex],
            numberOfStops: reversedStops.length,
            stops: reversedStops,
        };
        setTripConfigs(updated);
        setShowReversePrompt(false);
    };

    const skipReverseTrip = () => {
        setShowReversePrompt(false);
    };

    const updateTripConfig = (field: keyof TripConfig, value: any) => {
        const updated = [...tripConfigs];
        updated[currentTripIndex] = { ...updated[currentTripIndex], [field]: value };
        setTripConfigs(updated);
    };

    const toggleDay = (day: DayOfWeek) => {
        const current = tripConfigs[currentTripIndex].daysOfWeek;
        if (current.includes(day)) {
            updateTripConfig('daysOfWeek', current.filter(d => d !== day));
        } else {
            updateTripConfig('daysOfWeek', [...current, day]);
        }
    };

    const setNumberOfStops = (count: number) => {
        const updated = [...tripConfigs];
        const trip = updated[currentTripIndex];

        // Create stops array with specified count
        const stops = [];
        for (let i = 0; i < count; i++) {
            stops.push(trip.stops[i] || { name: "", arrivalTime: "09:00" });
        }

        updated[currentTripIndex] = { ...trip, numberOfStops: count, stops };
        setTripConfigs(updated);
    };

    const updateStop = (stopIndex: number, field: 'name' | 'arrivalTime', value: string) => {
        const updated = [...tripConfigs];
        const stops = [...updated[currentTripIndex].stops];
        stops[stopIndex] = { ...stops[stopIndex], [field]: value };
        updated[currentTripIndex] = { ...updated[currentTripIndex], stops };
        setTripConfigs(updated);
    };

    const validateCurrentTrip = (): boolean => {
        const trip = tripConfigs[currentTripIndex];

        if (!trip.startTime) {
            setError("Please enter trip start time");
            return false;
        }

        if (trip.daysOfWeek.length === 0) {
            setError("Please select at least one day");
            return false;
        }

        for (let i = 0; i < trip.stops.length; i++) {
            if (!trip.stops[i].name || !trip.stops[i].arrivalTime) {
                setError(`Please fill in all stop details (Stop ${i + 1})`);
                return false;
            }
        }

        setError("");
        return true;
    };

    const goToNextTrip = () => {
        if (!validateCurrentTrip()) return;

        if (currentTripIndex < tripConfigs.length - 1) {
            setCurrentTripIndex(currentTripIndex + 1);
        } else {
            // All trips configured, save to database
            saveAllTrips();
        }
    };

    const saveAllTrips = async () => {
        if (!bus) return;

        setIsSaving(true);
        setError("");

        try {
            for (const tripConfig of tripConfigs) {
                // Create trip
                const trip = await tripApi.create({
                    bus_id: bus.id,
                    trip_number: tripConfig.tripNumber,
                    start_time: tripConfig.startTime,
                    days_of_week: tripConfig.daysOfWeek,
                });

                // Add all stops
                for (let i = 0; i < tripConfig.stops.length; i++) {
                    await tripApi.addStop(trip.id, {
                        name: tripConfig.stops[i].name,
                        arrival_time: tripConfig.stops[i].arrivalTime,
                    });
                }
            }

            setStep(3); // Done!
        } catch (err: any) {
            console.error('Error saving trips:', err);
            setError(err.message || "Failed to save trips");
        } finally {
            setIsSaving(false);
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

    // Step 3: Done
    if (step === 3) {
        return (
            <main className="min-h-screen bg-brand-cloud flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-20 h-20 bg-brand-green rounded-full flex items-center justify-center mb-6"
                >
                    <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h1 className="text-2xl font-bold text-brand-slate mb-2">Setup Complete!</h1>
                <p className="text-brand-grey mb-6">
                    {bus.registration_number} has been configured with {tripConfigs.length} trip(s)
                </p>
                <Link href="/owner">
                    <Button className="bg-brand-green hover:bg-green-700">
                        Go to Dashboard
                    </Button>
                </Link>
            </main>
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
                    <h1 className="text-2xl font-bold text-brand-slate">Setup {bus.registration_number}</h1>
                    <p className="text-sm text-brand-grey">{bus.route_from} → {bus.route_to}</p>
                </div>
            </header>

            <div className="p-6">
                {/* Step 1: Number of Trips */}
                {step === 1 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                            <CardContent className="p-6">
                                <h2 className="text-xl font-bold text-brand-slate mb-2">
                                    How many trips per day?
                                </h2>
                                <p className="text-brand-grey mb-6">
                                    Enter the number of trips this bus makes daily
                                </p>

                                <div className="flex items-center justify-center gap-4 mb-8">
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setNumberOfTrips(Math.max(1, numberOfTrips - 1))}
                                        disabled={numberOfTrips <= 1}
                                    >
                                        <Minus className="w-5 h-5" />
                                    </Button>
                                    <div className="w-20 h-20 bg-brand-green/10 rounded-2xl flex items-center justify-center">
                                        <span className="text-4xl font-bold text-brand-green">{numberOfTrips}</span>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => setNumberOfTrips(Math.min(10, numberOfTrips + 1))}
                                        disabled={numberOfTrips >= 10}
                                    >
                                        <Plus className="w-5 h-5" />
                                    </Button>
                                </div>

                                <Button
                                    onClick={initializeTripConfigs}
                                    className="w-full py-6 bg-brand-green hover:bg-green-700"
                                >
                                    Continue
                                    <ArrowRight className="w-5 h-5 ml-2" />
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Step 2: Configure Each Trip */}
                {step === 2 && tripConfigs.length > 0 && (
                    <motion.div
                        key={currentTripIndex}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="space-y-4"
                    >
                        {/* Progress */}
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-sm font-medium text-brand-slate">
                                Trip {currentTripIndex + 1} of {tripConfigs.length}
                            </span>
                            <div className="flex gap-1">
                                {tripConfigs.map((_, i) => (
                                    <div
                                        key={i}
                                        className={`w-8 h-2 rounded-full ${i <= currentTripIndex ? 'bg-brand-green' : 'bg-gray-200'
                                            }`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Reverse Trip Prompt */}
                        {showReversePrompt && (
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="border-2 border-brand-blue bg-brand-blue/5">
                                    <CardContent className="p-4">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 bg-brand-blue/20 rounded-full flex items-center justify-center flex-shrink-0">
                                                <span className="text-xl">🔄</span>
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-brand-slate mb-1">Is this a return trip?</h3>
                                                <p className="text-sm text-brand-grey mb-3">
                                                    Auto-fill stop names in reverse order from a previous trip. You'll only need to enter the times.
                                                </p>

                                                {currentTripIndex > 1 && (
                                                    <div className="mb-3">
                                                        <label className="block text-xs font-medium text-brand-slate mb-1">
                                                            Copy from:
                                                        </label>
                                                        <select
                                                            value={selectedReverseTrip}
                                                            onChange={(e) => setSelectedReverseTrip(parseInt(e.target.value))}
                                                            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                                                        >
                                                            {tripConfigs.slice(0, currentTripIndex).map((trip, i) => (
                                                                <option key={i} value={i}>
                                                                    Trip {trip.tripNumber} ({trip.stops.filter(s => s.name).length} stops)
                                                                </option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}

                                                <div className="flex gap-2">
                                                    <Button
                                                        onClick={applyReverseTrip}
                                                        size="sm"
                                                        className="bg-brand-blue hover:bg-blue-700"
                                                    >
                                                        Yes, Auto-fill
                                                    </Button>
                                                    <Button
                                                        onClick={skipReverseTrip}
                                                        variant="outline"
                                                        size="sm"
                                                    >
                                                        No, Enter Manually
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        )}

                        {/* Trip Configuration */}
                        <Card>
                            <CardContent className="p-6 space-y-6">
                                <h2 className="text-xl font-bold text-brand-slate">
                                    Configure Trip {tripConfigs[currentTripIndex].tripNumber}
                                </h2>

                                {/* Start Time */}
                                <div>
                                    <label className="block text-sm font-medium text-brand-slate mb-2">Trip Start Time</label>
                                    <CustomTimeInput
                                        value={tripConfigs[currentTripIndex].startTime}
                                        onChange={(val) => updateTripConfig('startTime', val)}
                                    />
                                </div>

                                {/* Days of Service */}
                                <div>
                                    <label className="block text-sm font-medium text-brand-slate mb-2">
                                        Days of Service
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        {ALL_DAYS.map(day => (
                                            <button
                                                key={day}
                                                type="button"
                                                onClick={() => toggleDay(day)}
                                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${tripConfigs[currentTripIndex].daysOfWeek.includes(day)
                                                    ? 'bg-brand-green text-white'
                                                    : 'bg-gray-100 text-brand-grey hover:bg-gray-200'
                                                    }`}
                                            >
                                                {DAY_LABELS[day]}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Number of Stops */}
                                <div>
                                    <label className="block text-sm font-medium text-brand-slate mb-2">
                                        Number of Stops
                                    </label>
                                    <div className="flex items-center gap-4">
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setNumberOfStops(Math.max(2, tripConfigs[currentTripIndex].numberOfStops - 1))}
                                            disabled={tripConfigs[currentTripIndex].numberOfStops <= 2}
                                        >
                                            <Minus className="w-4 h-4" />
                                        </Button>
                                        <span className="text-xl font-bold text-brand-slate w-8 text-center">
                                            {tripConfigs[currentTripIndex].numberOfStops}
                                        </span>
                                        <Button
                                            variant="outline"
                                            size="icon"
                                            onClick={() => setNumberOfStops(tripConfigs[currentTripIndex].numberOfStops + 1)}
                                        >
                                            <Plus className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Stops Table */}
                        <Card>
                            <CardContent className="p-4">
                                <h3 className="text-lg font-bold text-brand-slate mb-4">Enter Stop Details</h3>

                                {/* Table Header */}
                                <div className="grid grid-cols-12 gap-2 mb-2 px-2 hidden sm:grid">
                                    <div className="col-span-2 text-xs font-bold text-brand-slate uppercase">
                                        Stop #
                                    </div>
                                    <div className="col-span-6 text-xs font-bold text-brand-slate uppercase">
                                        Stop Name
                                    </div>
                                    <div className="col-span-4 text-xs font-bold text-brand-slate uppercase">
                                        Reaching Time
                                    </div>
                                </div>

                                {/* Table Rows */}
                                <div className="space-y-4">
                                    {tripConfigs[currentTripIndex].stops.map((stop, index) => (
                                        <div key={index} className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-gray-50 p-2 rounded-lg sm:bg-transparent sm:p-0">
                                            <div className="sm:col-span-2 flex items-center mb-2 sm:mb-0">
                                                <div className="w-6 h-6 bg-brand-green/20 text-brand-green rounded-full flex items-center justify-center text-xs font-bold mr-2 sm:mr-0">
                                                    {index + 1}
                                                </div>
                                                <span className="sm:hidden text-sm font-bold text-brand-slate">Stop #{index + 1}</span>
                                            </div>
                                            <div className="sm:col-span-6 mb-2 sm:mb-0">
                                                <input
                                                    type="text"
                                                    placeholder="Enter stop name"
                                                    value={stop.name}
                                                    onChange={(e) => updateStop(index, 'name', e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                                                />
                                            </div>
                                            <div className="sm:col-span-4">
                                                <CustomTimeInput
                                                    value={stop.arrivalTime}
                                                    onChange={(val) => updateStop(index, 'arrivalTime', val)}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </CardContent>
                        </Card>

                        {error && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                <p className="text-sm text-red-600 text-center">{error}</p>
                            </div>
                        )}

                        {/* Navigation */}
                        <div className="flex gap-3">
                            {currentTripIndex > 0 && (
                                <Button
                                    variant="outline"
                                    onClick={() => setCurrentTripIndex(currentTripIndex - 1)}
                                    className="flex-1"
                                >
                                    <ArrowLeft className="w-4 h-4 mr-2" />
                                    Previous Trip
                                </Button>
                            )}
                            <Button
                                onClick={goToNextTrip}
                                className="flex-1 bg-brand-green hover:bg-green-700"
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : currentTripIndex < tripConfigs.length - 1 ? (
                                    <>
                                        Next Trip
                                        <ArrowRight className="w-4 h-4 ml-2" />
                                    </>
                                ) : (
                                    <>
                                        <Check className="w-4 h-4 mr-2" />
                                        Complete Setup
                                    </>
                                )}
                            </Button>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
