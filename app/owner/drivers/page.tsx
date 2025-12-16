"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Plus, UserPlus, Trash2, Edit2, Check, X, Eye, EyeOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase, DriverProfile } from "@/lib/supabase";
import { driverApi } from "@/lib/api/drivers";
import { busApi } from "@/lib/api/buses";

interface DriverWithBus extends DriverProfile {
    bus?: {
        id: string;
        registration_number: string;
        route_from: string;
        route_to: string;
    };
}

export default function DriversPage() {
    const router = useRouter();
    const [drivers, setDrivers] = useState<DriverWithBus[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRemarks, setEditRemarks] = useState("");
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});

    useEffect(() => {
        loadData();
    }, [router]);

    const loadData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            router.push("/owner/auth/login");
            return;
        }

        try {
            const [ownerDrivers, ownerBuses] = await Promise.all([
                driverApi.getByOwner(session.user.id),
                busApi.getByOwner(session.user.id),
            ]);
            setDrivers(ownerDrivers);
            setBuses(ownerBuses);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditRemarks = (driver: DriverWithBus) => {
        setEditingId(driver.id);
        setEditRemarks(driver.remarks || "");
    };

    const handleSaveRemarks = async (driverId: string) => {
        try {
            await driverApi.updateRemarks(driverId, editRemarks);
            setDrivers(drivers.map(d =>
                d.id === driverId ? { ...d, remarks: editRemarks } : d
            ));
            setEditingId(null);
        } catch (error) {
            console.error("Error saving remarks:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditRemarks("");
    };

    const handleDelete = async (driverId: string, slotName: string) => {
        if (!confirm(`Are you sure you want to delete ${slotName}? This action cannot be undone.`)) {
            return;
        }

        try {
            await driverApi.delete(driverId);
            setDrivers(drivers.filter(d => d.id !== driverId));
        } catch (error) {
            console.error("Error deleting driver:", error);
            alert("Failed to delete driver");
        }
    };

    const togglePassword = (driverId: string) => {
        setShowPasswords(prev => ({
            ...prev,
            [driverId]: !prev[driverId]
        }));
    };

    const getBusDisplay = (driver: DriverWithBus) => {
        if (driver.bus) {
            return driver.bus.registration_number;
        }
        return "—";
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
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
                <h1 className="text-2xl font-bold text-brand-slate">Driver Management</h1>
            </header>

            <div className="p-6">
                <Link href="/owner/drivers/add">
                    <Button className="w-full py-6 mb-6 bg-brand-green hover:bg-green-700">
                        <Plus className="w-5 h-5 mr-2" />
                        Create Driver Slot
                    </Button>
                </Link>

                {drivers.length === 0 ? (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <UserPlus className="w-16 h-16 text-brand-grey mx-auto mb-4 opacity-50" />
                            <p className="text-brand-grey mb-4">No driver slots created yet</p>
                            <Link href="/owner/drivers/add">
                                <Button className="bg-brand-green hover:bg-green-700">
                                    <Plus className="w-5 h-5 mr-2" />
                                    Create First Driver Slot
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                ) : (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full min-w-[600px]">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Slot</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Login ID</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Bus</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Remarks</th>
                                            <th className="text-right p-4 text-xs font-bold text-brand-grey uppercase tracking-wider">Actions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {drivers.map((driver, index) => (
                                            <tr
                                                key={driver.id}
                                                className={`border-b border-gray-100 ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                                            >
                                                <td className="p-4">
                                                    <span className="font-bold text-brand-slate">{driver.slot_name}</span>
                                                </td>
                                                <td className="p-4">
                                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">
                                                        {driver.username}
                                                    </code>
                                                </td>
                                                <td className="p-4">
                                                    <span className="text-brand-slate">{getBusDisplay(driver)}</span>
                                                </td>
                                                <td className="p-4">
                                                    {editingId === driver.id ? (
                                                        <div className="flex items-center gap-2">
                                                            <input
                                                                type="text"
                                                                value={editRemarks}
                                                                onChange={(e) => setEditRemarks(e.target.value)}
                                                                className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                                                                placeholder="Add remarks..."
                                                                autoFocus
                                                            />
                                                            <button
                                                                onClick={() => handleSaveRemarks(driver.id)}
                                                                className="p-1 text-green-600 hover:bg-green-50 rounded"
                                                            >
                                                                <Check className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="p-1 text-gray-500 hover:bg-gray-100 rounded"
                                                            >
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <span className="text-brand-grey text-sm">
                                                            {driver.remarks || "—"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        <button
                                                            onClick={() => handleEditRemarks(driver)}
                                                            className="p-2 text-brand-grey hover:text-brand-slate hover:bg-gray-100 rounded-lg transition-colors"
                                                            title="Edit remarks"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(driver.id, driver.slot_name)}
                                                            className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Delete driver slot"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>

                        <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                            <p className="text-xs text-blue-800">
                                ℹ️ Passwords are shown only when a driver slot is created. If you need to reset a password, delete the slot and create a new one.
                            </p>
                        </div>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
