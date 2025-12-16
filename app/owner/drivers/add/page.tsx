"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, UserPlus, Check, Copy, CheckCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { busApi } from "@/lib/api/buses";
import { driverApi } from "@/lib/api/drivers";

export default function AddDriverPage() {
    const router = useRouter();
    const [buses, setBuses] = useState<any[]>([]);
    const [nextSlotName, setNextSlotName] = useState<string>("Driver A");
    const [formData, setFormData] = useState({
        busId: "",
        remarks: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [createdDriver, setCreatedDriver] = useState<any>(null);
    const [generatedPassword, setGeneratedPassword] = useState("");
    const [generatedUsername, setGeneratedUsername] = useState("");
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                router.push("/owner/auth/login");
                return;
            }

            // Load owner's buses
            const ownerBuses = await busApi.getByOwner(session.user.id);
            setBuses(ownerBuses);

            // Get next slot name preview
            const slotName = await driverApi.getNextSlotName(session.user.id);
            setNextSlotName(slotName);
        };

        loadData();
    }, [router]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.busId) {
            newErrors.busId = "Please select a bus";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user) {
            router.push("/owner/auth/login");
            return;
        }

        setIsLoading(true);

        try {
            const result = await driverApi.create(session.user.id, {
                busId: formData.busId,
                remarks: formData.remarks || undefined,
            });

            setCreatedDriver(result.driver);
            setGeneratedUsername(result.username);
            setGeneratedPassword(result.password);
        } catch (error: any) {
            console.error("Error creating driver:", error);
            setErrors({ general: error.message || "Failed to create driver" });
        } finally {
            setIsLoading(false);
        }
    };

    const copyCredentials = () => {
        const text = `Login ID: ${generatedUsername}\nPassword: ${generatedPassword}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    if (createdDriver) {
        return (
            <main className="min-h-screen bg-brand-cloud flex flex-col">
                <header className="p-6 flex items-center bg-white shadow-sm">
                    <Link href="/owner/drivers">
                        <Button variant="ghost" size="icon" className="mr-4">
                            <ArrowLeft className="w-6 h-6 text-brand-slate" />
                        </Button>
                    </Link>
                    <h1 className="text-2xl font-bold text-brand-slate">Driver Created</h1>
                </header>

                <div className="flex-1 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-md"
                    >
                        <Card>
                            <CardContent className="p-8 text-center">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Check className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-brand-slate mb-2">
                                    {createdDriver.slot_name} Created!
                                </h2>
                                <p className="text-brand-grey mb-6">
                                    Share these credentials with the driver
                                </p>

                                <div className="bg-brand-cloud rounded-xl p-4 mb-4 text-left">
                                    <div className="mb-4">
                                        <p className="text-xs text-brand-grey mb-1">Login ID</p>
                                        <p className="font-mono font-bold text-brand-slate text-lg">{generatedUsername}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-brand-grey mb-1">Password</p>
                                        <p className="font-mono font-bold text-brand-green text-2xl tracking-wider">{generatedPassword}</p>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    className="w-full mb-4"
                                    onClick={copyCredentials}
                                >
                                    {copied ? (
                                        <>
                                            <CheckCheck className="w-4 h-4 mr-2" />
                                            Copied!
                                        </>
                                    ) : (
                                        <>
                                            <Copy className="w-4 h-4 mr-2" />
                                            Copy Credentials
                                        </>
                                    )}
                                </Button>

                                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-3 mb-6">
                                    <p className="text-xs text-yellow-800">
                                        ⚠️ Save these credentials! They won't be shown again.
                                    </p>
                                </div>

                                <Link href="/owner/drivers">
                                    <Button className="w-full bg-brand-green hover:bg-green-700">
                                        Done
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    </motion.div>
                </div>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-brand-cloud flex flex-col">
            <header className="p-6 flex items-center bg-white shadow-sm">
                <Link href="/owner/drivers">
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-brand-slate">Create Driver Slot</h1>
            </header>

            <div className="flex-1 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <UserPlus className="w-8 h-8 text-brand-green" />
                                </div>
                                <h2 className="text-xl font-bold text-brand-slate mb-1">
                                    {nextSlotName}
                                </h2>
                                <p className="text-sm text-brand-grey">
                                    Login credentials will be auto-generated
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1 block ml-4">
                                        Assign to Bus *
                                    </label>
                                    <select
                                        value={formData.busId}
                                        onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                                        className="flex h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-green"
                                    >
                                        <option value="">Select a bus</option>
                                        {buses.map((bus) => (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.registration_number} ({bus.route_from} → {bus.route_to})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.busId && (
                                        <p className="text-xs text-red-500 mt-1 ml-4">{errors.busId}</p>
                                    )}
                                </div>

                                <Input
                                    label="Remarks (Optional)"
                                    type="text"
                                    placeholder="e.g., Raju - until Dec 20"
                                    value={formData.remarks}
                                    onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                                />

                                {errors.general && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                        <p className="text-sm text-red-600 text-center">{errors.general}</p>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                    <p className="text-xs text-blue-800">
                                        ℹ️ A unique Login ID and Password will be generated for this driver slot
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full py-6 text-lg bg-brand-green hover:bg-green-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Creating..." : `Create ${nextSlotName}`}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}
