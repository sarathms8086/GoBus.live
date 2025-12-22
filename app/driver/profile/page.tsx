"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Bus, Phone, FileText, IdCard } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";

const CURRENT_DRIVER_KEY = "go_bus_current_driver";

interface DriverInfo {
    id: string;
    username: string;
    slot_name: string;
    remarks: string | null;
    name: string | null;
    phone: string | null;
}

interface BusInfo {
    id: string;
    registration_number: string;
    route_from: string;
    route_to: string;
}

export default function DriverProfilePage() {
    const router = useRouter();
    const [driver, setDriver] = useState<DriverInfo | null>(null);
    const [bus, setBus] = useState<BusInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDriver = async () => {
            const driverId = localStorage.getItem(CURRENT_DRIVER_KEY);
            if (!driverId) {
                router.push("/driver/auth/login");
                return;
            }

            try {
                const response = await fetch(`/api/driver/dashboard?driverId=${driverId}`);
                const result = await response.json();

                if (!response.ok) {
                    localStorage.removeItem(CURRENT_DRIVER_KEY);
                    router.push("/driver/auth/login");
                    return;
                }

                setDriver(result.driver);
                setBus(result.bus);
            } catch (error) {
                console.error("Error loading driver:", error);
                router.push("/driver/auth/login");
            } finally {
                setIsLoading(false);
            }
        };

        loadDriver();
    }, [router]);

    const handleLogout = () => {
        localStorage.removeItem(CURRENT_DRIVER_KEY);
        router.push("/driver/auth/login");
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-brand-grey">Loading...</p>
                </div>
            </div>
        );
    }

    if (!driver) {
        return null;
    }

    return (
        <div className="min-h-screen bg-brand-cloud">
            {/* Header */}
            <div className="bg-brand-blue px-6 py-8 relative overflow-hidden">
                <div className="absolute inset-0 opacity-10">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white rounded-full -translate-y-32 translate-x-32"></div>
                </div>
                <div className="relative">
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <h1 className="text-2xl font-bold text-white">Profile</h1>
                    </motion.div>
                </div>
            </div>

            <div className="p-4 -mt-6 space-y-4">
                {/* Driver Info Card */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card className="shadow-lg border-0">
                        <CardContent className="p-6">
                            <div className="flex items-center mb-6">
                                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mr-4">
                                    <User className="w-8 h-8 text-brand-blue" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-brand-slate">
                                        {driver.remarks || driver.slot_name}
                                    </h2>
                                    <p className="text-brand-grey text-sm">
                                        {driver.slot_name}
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                                    <IdCard className="w-5 h-5 text-brand-blue mr-3" />
                                    <div>
                                        <p className="text-xs text-brand-grey">Login ID</p>
                                        <p className="font-bold text-brand-slate font-mono">{driver.username}</p>
                                    </div>
                                </div>

                                {driver.name && (
                                    <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                                        <User className="w-5 h-5 text-brand-grey mr-3" />
                                        <div>
                                            <p className="text-xs text-brand-grey">Full Name</p>
                                            <p className="font-medium text-brand-slate">{driver.name}</p>
                                        </div>
                                    </div>
                                )}

                                {driver.phone && (
                                    <div className="flex items-center p-3 bg-gray-50 rounded-xl">
                                        <Phone className="w-5 h-5 text-brand-grey mr-3" />
                                        <div>
                                            <p className="text-xs text-brand-grey">Phone</p>
                                            <p className="font-medium text-brand-slate">{driver.phone}</p>
                                        </div>
                                    </div>
                                )}

                                {bus ? (
                                    <div className="flex items-center p-3 bg-green-50 rounded-xl">
                                        <Bus className="w-5 h-5 text-brand-green mr-3" />
                                        <div>
                                            <p className="text-xs text-brand-grey">Assigned Bus</p>
                                            <p className="font-bold text-brand-slate">
                                                {bus.registration_number}
                                            </p>
                                            <p className="text-xs text-brand-grey">
                                                {bus.route_from} → {bus.route_to}
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3">
                                        <p className="text-sm text-yellow-800">
                                            ⚠️ You are not assigned to any bus yet
                                        </p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>

                {/* Logout Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <Button
                        onClick={handleLogout}
                        variant="destructive"
                        className="w-full py-6 shadow-lg"
                    >
                        <LogOut className="w-5 h-5 mr-2" />
                        Logout
                    </Button>
                </motion.div>
            </div>
        </div>
    );
}
