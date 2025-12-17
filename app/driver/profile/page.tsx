"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { LogOut, User, Bus, Phone, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { driverApi } from "@/lib/api/drivers";
import { DriverWithBus } from "@/lib/supabase";

const CURRENT_DRIVER_KEY = "go_bus_current_driver";

export default function DriverProfilePage() {
    const router = useRouter();
    const [driver, setDriver] = useState<DriverWithBus | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadDriver = async () => {
            const driverId = localStorage.getItem(CURRENT_DRIVER_KEY);
            if (!driverId) {
                router.push("/driver/auth/login");
                return;
            }

            try {
                const driverData = await driverApi.getById(driverId);
                if (driverData) {
                    setDriver(driverData);
                } else {
                    localStorage.removeItem(CURRENT_DRIVER_KEY);
                    router.push("/driver/auth/login");
                }
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
                <p className="text-brand-grey">Loading...</p>
            </div>
        );
    }

    if (!driver) {
        return null;
    }

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-slate">Profile</h1>
            </div>

            {/* Driver Info Card */}
            <Card className="border-brand-blue/20 shadow-md">
                <CardContent className="p-6">
                    <div className="flex items-center mb-6">
                        <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mr-4">
                            <User className="w-8 h-8 text-brand-blue" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-brand-slate">
                                {driver.slot_name}
                            </h2>
                            <p className="text-brand-grey text-sm">
                                Login ID: {driver.username}
                            </p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {driver.name && (
                            <div className="flex items-center">
                                <User className="w-5 h-5 text-brand-grey mr-3" />
                                <div>
                                    <p className="text-xs text-brand-grey">Name</p>
                                    <p className="font-medium text-brand-slate">{driver.name}</p>
                                </div>
                            </div>
                        )}

                        {driver.phone && (
                            <div className="flex items-center">
                                <Phone className="w-5 h-5 text-brand-grey mr-3" />
                                <div>
                                    <p className="text-xs text-brand-grey">Phone</p>
                                    <p className="font-medium text-brand-slate">{driver.phone}</p>
                                </div>
                            </div>
                        )}

                        {driver.bus && (
                            <div className="flex items-center">
                                <Bus className="w-5 h-5 text-brand-grey mr-3" />
                                <div>
                                    <p className="text-xs text-brand-grey">Assigned Bus</p>
                                    <p className="font-medium text-brand-slate">
                                        {driver.bus.registration_number}
                                    </p>
                                    <p className="text-xs text-brand-grey">
                                        {driver.bus.route_from} → {driver.bus.route_to}
                                    </p>
                                </div>
                            </div>
                        )}

                        {driver.remarks && (
                            <div className="flex items-center">
                                <FileText className="w-5 h-5 text-brand-grey mr-3" />
                                <div>
                                    <p className="text-xs text-brand-grey">Remarks</p>
                                    <p className="font-medium text-brand-slate">{driver.remarks}</p>
                                </div>
                            </div>
                        )}

                        {!driver.bus && (
                            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mt-4">
                                <p className="text-sm text-yellow-800">
                                    ⚠️ You are not assigned to any bus yet
                                </p>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Logout Button */}
            <Button
                onClick={handleLogout}
                variant="destructive"
                className="w-full py-6"
            >
                <LogOut className="w-5 h-5 mr-2" />
                Logout
            </Button>
        </div>
    );
}
