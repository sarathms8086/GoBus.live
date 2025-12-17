"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Users, Plus, Minus, Edit2, Check, X, Eye, EyeOff, Wrench, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { motion, AnimatePresence } from "framer-motion";
import { supabase, DriverProfile } from "@/lib/supabase";
import { driverApi, decodePassword } from "@/lib/api/drivers";
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
    const [allBuses, setAllBuses] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isFirstTime, setIsFirstTime] = useState(false);
    const [initialCount, setInitialCount] = useState<string>("");
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
            setAllBuses(ownerBuses);
            setIsFirstTime(ownerDrivers.length === 0);
        } catch (error) {
            console.error("Error loading data:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleInitialSetup = async () => {
        const count = parseInt(initialCount);
        if (isNaN(count) || count < 1 || count > 50) {
            alert("Please enter a number between 1 and 50");
            return;
        }

        setIsCreating(true);
        try {
            const result = await driverApi.bulkCreate(ownerId, count);
            setNewCredentials(result.credentials);
            await loadData();
            setIsFirstTime(false);
        } catch (error: any) {
            console.error("Error creating drivers:", error);
            alert("Failed to create drivers: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleAddDriver = async () => {
        setIsCreating(true);
        try {
            const result = await driverApi.createOne(ownerId);
            setNewCredentials([{
                slotName: result.driver.slot_name,
                username: result.username,
                password: result.password
            }]);
            await loadData();
        } catch (error: any) {
            console.error("Error adding driver:", error);
            alert("Failed to add driver: " + error.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleRemoveDriver = async () => {
        if (drivers.length === 0) return;
        if (!confirm("Remove the last driver? This cannot be undone.")) return;

        try {
            await driverApi.deleteLastDriver(ownerId);
            setNewCredentials([]);
            await loadData();
        } catch (error: any) {
            console.error("Error removing driver:", error);
        }
    };

    const handleDeleteDriver = async (driver: DriverWithBus) => {
        if (!confirm(`Delete ${driver.slot_name}? This cannot be undone.`)) return;

        try {
            await driverApi.delete(driver.id);
            // Remove any stored credentials for this driver
            setNewCredentials(prev => prev.filter(c => c.username !== driver.username));
            await loadData();
        } catch (error: any) {
            console.error("Error deleting driver:", error);
            alert("Failed to delete driver: " + (error.message || "Unknown error"));
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
        } catch (error: any) {
            console.error("Error saving:", error);
            alert("Failed to save: " + (error.message || "Unknown error"));
        }
    };

    const handleCancelEdit = () => {
        setEditingId(null);
        setEditBusId("");
        setEditRemarks("");
    };

    const togglePassword = (id: string) => {
        setShowPasswords(prev => ({ ...prev, [id]: !prev[id] }));
    };

    // Decode password from storage - passwords are always retrievable
    const getDriverPassword = (driver: DriverWithBus): string => {
        // First check if there's a freshly created password in memory
        const cred = newCredentials.find(c => c.username === driver.username);
        if (cred?.password) {
            return cred.password;
        }
        // Otherwise decode from stored password_hash
        if (driver.password_hash) {
            return decodePassword(driver.password_hash);
        }
        return '••••';
    };

    // Check if driver has old format login ID (doesn't start with 'D')
    const hasOldLoginFormat = (driver: DriverWithBus): boolean => {
        return !driver.username?.startsWith('D');
    };

    // Fix driver's login ID to new format
    const handleFixLoginId = async (driver: DriverWithBus) => {
        if (!confirm(`Update login credentials for ${driver.slot_name} to the new format? The old login ID (${driver.username}) will no longer work.`)) {
            return;
        }

        try {
            const result = await driverApi.fixLoginId(driver.id);
            // Add to newCredentials to show the new password
            setNewCredentials(prev => [...prev, {
                slotName: driver.slot_name,
                username: result.username,
                password: result.password
            }]);
            await loadData();
        } catch (error: any) {
            console.error("Error fixing login ID:", error);
            alert("Failed to fix login ID: " + (error.message || "Unknown error"));
        }
    };

    // Get available buses for dropdown (unassigned + current driver's bus)
    const getAvailableBuses = (currentDriverId: string, currentBusId: string | null) => {
        const assignedBusIds = new Set(
            drivers
                .filter(d => d.id !== currentDriverId && d.bus_id)
                .map(d => d.bus_id)
        );
        return allBuses.filter(bus => !assignedBusIds.has(bus.id) || bus.id === currentBusId);
    };

    if (isLoading) {
        return (
            <main className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
            </main>
        );
    }

    // First time setup screen
    if (isFirstTime) {
        return (
            <main className="min-h-screen bg-brand-cloud flex flex-col">
                <header className="p-6 flex items-center bg-white shadow-sm">
                    <Link href="/owner">
                        <Button variant="ghost" size="icon" className="mr-4">
                            <ArrowLeft className="w-6 h-6 text-brand-slate" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-brand-slate">Driver Setup</h1>
                </header>

                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="w-full max-w-md"
                    >
                        <Card>
                            <CardContent className="p-8 text-center">
                                <div className="w-20 h-20 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Users className="w-10 h-10 text-brand-green" />
                                </div>
                                <h2 className="text-2xl font-bold text-brand-slate mb-2">
                                    How many drivers in your company?
                                </h2>
                                <p className="text-brand-grey mb-8">
                                    We'll create login credentials for each driver
                                </p>

                                <input
                                    type="number"
                                    min="1"
                                    max="50"
                                    placeholder="Enter number of drivers"
                                    value={initialCount}
                                    onChange={(e) => setInitialCount(e.target.value)}
                                    className="w-full h-14 rounded-2xl border-2 border-gray-200 px-6 text-2xl font-bold text-center focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-brand-green mb-6"
                                    autoFocus
                                />

                                <Button
                                    onClick={handleInitialSetup}
                                    disabled={isCreating || !initialCount}
                                    className="w-full py-6 text-lg bg-brand-green hover:bg-green-700"
                                >
                                    {isCreating ? "Creating Drivers..." : "Create Driver Profiles"}
                                </Button>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
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
                {/* Driver Counter with Plus/Minus */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-14 h-14 bg-brand-green/10 rounded-2xl flex items-center justify-center">
                                    <Users className="w-7 h-7 text-brand-green" />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-bold text-brand-slate">{drivers.length}</h2>
                                    <p className="text-sm text-brand-grey">Driver{drivers.length !== 1 ? 's' : ''} in Company</p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={handleRemoveDriver}
                                    disabled={drivers.length === 0 || isCreating}
                                    className="w-12 h-12 rounded-xl border-2 border-red-200 text-red-500 hover:bg-red-50 hover:border-red-300"
                                >
                                    <Minus className="w-6 h-6" />
                                </Button>
                                <Button
                                    size="icon"
                                    onClick={handleAddDriver}
                                    disabled={isCreating}
                                    className="w-12 h-12 rounded-xl bg-brand-green hover:bg-green-700"
                                >
                                    <Plus className="w-6 h-6" />
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* New Credential Alert */}
                <AnimatePresence>
                    {newCredentials.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <Card className="border-green-200 bg-green-50">
                                <CardContent className="p-4">
                                    <h3 className="font-bold text-green-800 mb-3">✅ New Driver Credentials</h3>
                                    <div className="space-y-2">
                                        {newCredentials.map((cred, i) => (
                                            <div key={i} className="flex items-center gap-4 bg-white rounded-lg p-3">
                                                <span className="font-bold text-brand-slate w-24">{cred.slotName}</span>
                                                <div className="flex-1">
                                                    <span className="text-xs text-brand-grey">Login:</span>
                                                    <code className="ml-2 text-sm bg-gray-100 px-2 py-1 rounded font-mono">{cred.username}</code>
                                                </div>
                                                <div>
                                                    <span className="text-xs text-brand-grey">Password:</span>
                                                    <code className="ml-2 text-sm bg-green-100 px-2 py-1 rounded font-bold text-green-700">{cred.password}</code>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <p className="text-xs text-green-700 mt-3">⚠️ Save these! Passwords won't be shown again.</p>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setNewCredentials([])}
                                        className="mt-2 text-green-700"
                                    >
                                        Dismiss
                                    </Button>
                                </CardContent>
                            </Card>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Drivers Table */}
                {drivers.length > 0 && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card>
                            <CardContent className="p-0 overflow-x-auto">
                                <table className="w-full min-w-[650px]">
                                    <thead>
                                        <tr className="border-b border-gray-200 bg-gray-50">
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Driver</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Login ID</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Password</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Assigned Bus</th>
                                            <th className="text-left p-4 text-xs font-bold text-brand-grey uppercase">Remarks</th>
                                            <th className="text-right p-4 text-xs font-bold text-brand-grey uppercase w-20">Edit</th>
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
                                                            {showPasswords[driver.id]
                                                                ? getDriverPassword(driver)
                                                                : "••••"}
                                                        </code>
                                                        <button
                                                            onClick={() => togglePassword(driver.id)}
                                                            className="p-1 text-brand-grey hover:text-brand-slate transition-colors"
                                                            title={showPasswords[driver.id] ? "Hide password" : "Show password"}
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
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                                                        >
                                                            <option value="">Not Assigned</option>
                                                            {getAvailableBuses(driver.id, driver.bus_id).map((bus) => (
                                                                <option key={bus.id} value={bus.id}>
                                                                    {bus.registration_number}
                                                                </option>
                                                            ))}
                                                        </select>
                                                    ) : (
                                                        <span className={driver.bus ? "text-brand-slate font-medium" : "text-brand-grey"}>
                                                            {driver.bus?.registration_number || "Not Assigned"}
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
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-brand-green"
                                                        />
                                                    ) : (
                                                        <span className="text-brand-grey text-sm">{driver.remarks || "—"}</span>
                                                    )}
                                                </td>
                                                <td className="p-4 text-right">
                                                    {editingId === driver.id ? (
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                onClick={() => handleSave(driver.id)}
                                                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg"
                                                            >
                                                                <Check className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={handleCancelEdit}
                                                                className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                                            >
                                                                <X className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center justify-end gap-1">
                                                            {hasOldLoginFormat(driver) && (
                                                                <button
                                                                    onClick={() => handleFixLoginId(driver)}
                                                                    className="p-2 text-orange-500 hover:text-orange-700 hover:bg-orange-50 rounded-lg"
                                                                    title="Fix login ID to new format"
                                                                >
                                                                    <Wrench className="w-4 h-4" />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleEdit(driver)}
                                                                className="p-2 text-brand-grey hover:text-brand-slate hover:bg-gray-100 rounded-lg"
                                                                title="Edit bus assignment & remarks"
                                                            >
                                                                <Edit2 className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteDriver(driver)}
                                                                className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                                                                title="Delete driver"
                                                            >
                                                                <Trash2 className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </div>
        </main>
    );
}
