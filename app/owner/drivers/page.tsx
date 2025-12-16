"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Trash2, Edit2, Check, X, Eye, EyeOff, Plus, RefreshCw } from "lucide-react";
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

interface Credential {
    slotName: string;
    username: string;
    password: string;
}

export default function DriversPage() {
    const router = useRouter();
    const [drivers, setDrivers] = useState<DriverWithBus[]>([]);
    const [buses, setBuses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [driverCount, setDriverCount] = useState<number>(0);
    const [inputCount, setInputCount] = useState<string>("");
    const [isCreating, setIsCreating] = useState(false);
    const [newCredentials, setNewCredentials] = useState<Credential[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editBusId, setEditBusId] = useState<string>("");
    const [editRemarks, setEditRemarks] = useState("");
    const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({});
    const [ownerId, setOwnerId] = useState<string>("");

    useEffect(() => {
        loadData();
    }, [router]);

    const loadData = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            router.push("/owner/auth/login");
            return;
        }

        setOwnerId(session.user.id);

        try {
            const [ownerDrivers, ownerBuses] = await Promise.all([
                driverApi.getByOwner(session.user.id),
                busApi.getByOwner(session.user.id),
            ]);
            setDrivers(ownerDrivers);
            setBuses(ownerBuses);
            setDriverCount(ownerDrivers.length);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateDrivers = async () => {
        const count = parseInt(inputCount);
        if (isNaN(count) || count < 1 || count > 26) {
            alert("Please enter a number between 1 and 26");
            return;
        }

        setIsCreating(true);
        try {
            const result = await driverApi.bulkCreate(ownerId, count);
            setNewCredentials(result.credentials);
            await loadData();
            setInputCount("");
        } catch (error: any) {
            console.error("Error creating drivers:", error);
            alert("Failed to create drivers: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleEdit = (driver: DriverWithBus) => {
        setEditingId(driver.id);
        setEditBusId(driver.bus_id || "");
        setEditRemarks(driver.remarks || "");
    };

    const handleSave = async (driverId: string) => {
        try {
            await driverApi.update(driverId, {
                bus_id: editBusId || null,
                remarks: editRemarks || null,
            });
            await loadData();
            setEditingId(null);
        } catch (error) {
            console.error("Error saving:", error);
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditBusId("");
        setEditRemarks("");
    };

    const handleDelete = async (driverId: string, slotName: string) => {
        if (!confirm(`Delete ${slotName}? This cannot be undone.`)) return;

        try {
            await driverApi.delete(driverId);
            setDrivers(drivers.filter(d => d.id !== driverId));
            setDriverCount(prev => prev - 1);
        } catch (error) {
            console.error("Error deleting:", error);
            alert("Failed to delete driver");
        }
    };

    const handleDeleteAll = async () => {
        if (!confirm("Delete ALL drivers? This cannot be undone.")) return;

        try {
            await driverApi.deleteAllByOwner(ownerId);
            setDrivers([]);
            setDriverCount(0);
            setNewCredentials([]);
        } catch (error) {
            console.error("Error deleting all:", error);
        }
    };

    const togglePassword = (id: string) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    const getStoredPassword = (driver: DriverWithBus): string => {
        // Check if we have the password in newCredentials
        const cred = newCredentials.find(c => c.username === driver.username);
        return cred?.password || "••••••";
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

            <div className="p-6 space-y-6">
                {/* Driver Count Input */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4 mb-4">
                            <Users className="w-8 h-8 text-brand-green" />
                            <div>
                                <h2 className="text-lg font-bold text-brand-slate">
                                    {driverCount > 0 ? `${driverCount} Driver(s) Created` : "No Drivers Yet"}
                                </h2>
                                <p className="text-sm text-brand-grey">Enter the number of drivers in your company</p>
                            </div>
                        </div>

                        <div className="flex gap-3">
                            <input
                                type="number"
                                min="1"
                                max="26"
                                placeholder="How many drivers?"
                                value={inputCount}
                                onChange={(e) => setInputCount(e.target.value)}
                                className="flex-1 h-12 rounded-xl border border-gray-200 px-4 text-lg font-medium focus:outline-none focus:ring-2 focus:ring-brand-green"
                            />
                            <Button
                                onClick={handleCreateDrivers}
                                disabled={isCreating || !inputCount}
                                className="h-12 px-6 bg-brand-green hover:bg-green-700"
                            >
                                {isCreating ? (
                                    <RefreshCw className="w-5 h-5 animate-spin" />
                                ) : (
                                    <>
                                        <Plus className="w-5 h-5 mr-2" />
                                        Create
                                    </>
                                )}
                            </Button>
                        </div>

                        {driverCount > 0 && (
                            <Button
                                variant="outline"
                                onClick={handleDeleteAll}
                                className="mt-4 text-red-500 border-red-200 hover:bg-red-50"
                            >
                                <Trash2 className="w-4 h-4 mr-2" />
                                Reset All Drivers
                            </Button>
                        )}
                    </CardContent>
                </Card>

                {/* New Credentials Alert */}
                {newCredentials.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="border-green-200 bg-green-50">
                            <CardContent className="p-4">
                                <h3 className="font-bold text-green-800 mb-3">✅ New Driver Credentials Created</h3>
                                <div className="space-y-2">
                                    {newCredentials.map((cred, i) => (
                                        <div key={i} className="flex items-center gap-4 bg-white rounded-lg p-3">
                                            <span className="font-bold text-brand-slate w-20">{cred.slotName}</span>
                                            <code className="text-sm bg-gray-100 px-2 py-1 rounded">{cred.username}</code>
                                            <code className="text-sm bg-green-100 px-2 py-1 rounded font-bold text-green-700">{cred.password}</code>
                                        </div>
                                    ))}
                                </div>
                                <p className="text-xs text-green-700 mt-3">⚠️ Save these passwords! They won't be shown again.</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Drivers Table */}
                {drivers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full min-w-[700px]">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Slot</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Login ID</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Password</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Assigned Bus</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Remarks</th>
                                            <th className="text-right p-4 text-xs font-bold text-brand-grey uppercase">Actions</th>
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
                                                    <code className="text-sm bg-gray-100 px-2 py-1 rounded font-mono">{driver.username}</code>
                                                </td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2">
                                                        <code className="text-sm font-mono">
                                                            {showPasswords[driver.id] ? getStoredPassword(driver) : "••••••"}
                                                        </code>
                                                        <button
                                                            onClick={() => togglePassword(driver.id)}
                                                            className="p-1 text-brand-grey hover:text-brand-slate"
                                                        >
                                                            {showPasswords[driver.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                                <td className="p-4">
                                                    {editingId === driver.id ? (
                                                        <select
                                                            value={editBusId}
                                                            onChange={(e) => setEditBusId(e.target.value)}
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                                                        >
                                                            <option value="">Not Assigned</option>
                                                            {buses.map((bus) => (
                                                                <option key={bus.id} value={bus.id}>
                                                                    {bus.registration_number}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className="text-brand-slate">
                                                            {driver.bus?.registration_number || "—"}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="p-4">
                                                    {editingId === driver.id ? (
                                                        <input
                                                            type="text"
                                                            value={editRemarks}
                                                            onChange={(e) => setEditRemarks(e.target.value)}
                                                            placeholder="Add note..."
                                                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                                                        />
                                                    ) : (
                                                        <span className="text-brand-grey text-sm">{driver.remarks || "—"}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    <div className="flex items-center justify-end gap-1">
                                                        {editingId === driver.id ? (
                                                            <>
                                                                <button
                                                                    onClick={() => handleSave(driver.id)}
                                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                                >
                                                                    <Check className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={handleCancelEdit}
                                                                    className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                                >
                                                                    <X className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <button
                                                                    onClick={() => handleEdit(driver)}
                                                                    className="p-2 text-brand-grey hover:text-brand-slate hover:bg-gray-100 rounded-lg"
                                                                >
                                                                    <Edit2 className="w-4 h-4" />
                                                                </button>
                                                                <button
                                                                    onClick={() => handleDelete(driver.id, driver.slot_name)}
                                                                    className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg"
                                                                >
                                                                    <Trash2 className="w-4 h-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Empty State */}
                {drivers.length === 0 && !newCredentials.length && (
                    <Card>
                        <CardContent className="p-8 text-center">
                            <Users className="w-16 h-16 text-brand-grey mx-auto mb-4 opacity-50" />
                            <p className="text-brand-grey">Enter the number of drivers above to create driver slots</p>
                        </CardContent>
                    </Card>
                )}
            </div>
        </main>
    );
}
