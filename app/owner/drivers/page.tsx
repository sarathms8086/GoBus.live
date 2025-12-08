"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, User, Phone, BusFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { getCurrentOwner } from "@/lib/owner-storage";
import { getDriversByOwner, Driver } from "@/lib/driver-storage";
import { getBusesByOwner } from "@/lib/bus-storage";

export default function DriversPage() {
    const router = useRouter();
    const [drivers, setDrivers] = useState<Driver[]>([]);
    const [buses, setBuses] = useState<any[]>([]);

    useEffect(() => {
        const owner = getCurrentOwner();
        if (!owner) {
            router.push("/owner/auth/login");
            return;
        }

        const ownerDrivers = getDriversByOwner(owner.id);
        const ownerBuses = getBusesByOwner(owner.id);
        setDrivers(ownerDrivers);
        setBuses(ownerBuses);
    }, [router]);

    const getBusName = (busId: string) => {
        const bus = buses.find((b) => b.id === busId);
        return bus ? bus.registrationNumber : "Unknown";
    };

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="p-6 flex items-center bg-white shadow-sm">
                <Link href="/owner">
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-brand-slate">Manage Drivers</h1>
            </header>

            <div className="p-6">
                <Link href="/owner/drivers/add">
                    <Button className="w-full py-6 mb-6 bg-brand-green hover:bg-green-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Create New Driver
                    </Button>
                </Link>

                {drivers.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <User className="w-16 h-16 text-brand-grey mx-auto mb-4 opacity-50" />
                            <p className="text-brand-grey mb-4">No drivers created yet</p>
                            <Link href="/owner/drivers/add">
                                <Button className="bg-brand-green hover:bg-green-700">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create First Driver
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {drivers.map((driver, index) => (
                            <motion.div
                                key={driver.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <Card>
                                    <CardContent className="p-4">
                                        <div className="flex items-start justify-between mb-3">
                                            <div className="flex items-center">
                                                <div className="w-12 h-12 bg-brand-blue/10 rounded-xl flex items-center justify-center mr-3">
                                                    <User className="w-6 h-6 text-brand-blue" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-brand-slate">{driver.name}</h3>
                                                    <p className="text-xs text-brand-grey">@{driver.username}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center text-sm text-brand-grey mb-2">
                                            <Phone className="w-4 h-4 mr-2" />
                                            <span>{driver.phone}</span>
                                        </div>

                                        <div className="flex items-center text-sm text-brand-grey">
                                            <BusFront className="w-4 h-4 mr-2" />
                                            <span>Assigned: {getBusName(driver.busId)}</span>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
