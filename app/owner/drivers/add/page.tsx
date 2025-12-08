"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { getCurrentOwner } from "@/lib/owner-storage";
import { getBusesByOwner } from "@/lib/bus-storage";
import { createDriver, generatePassword } from "@/lib/driver-storage";

export default function AddDriverPage() {
    const router = useRouter();
    const [buses, setBuses] = useState<any[]>([]);
    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        busId: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [createdDriver, setCreatedDriver] = useState<any>(null);
    const [generatedPassword, setGeneratedPassword] = useState("");

    useEffect(() => {
        const owner = getCurrentOwner();
        if (!owner) {
            router.push("/owner/auth/login");
            return;
        }

        const ownerBuses = getBusesByOwner(owner.id);
        setBuses(ownerBuses);
    }, [router]);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.name) {
            newErrors.name = "Driver name is required";
        }

        if (!formData.phone) {
            newErrors.phone = "Phone number is required";
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = "Phone must be 10 digits";
        }

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

        const owner = getCurrentOwner();
        if (!owner) {
            router.push("/owner/auth/login");
            return;
        }

        setIsLoading(true);

        try {
            const password = generatePassword();
            const driver = createDriver(
                owner.id,
                formData.busId,
                formData.name,
                formData.phone,
                password
            );

            setCreatedDriver(driver);
            setGeneratedPassword(password);
        } catch (error: any) {
            setErrors({ general: error.message });
        } finally {
            setIsLoading(false);
        }
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
                                    Driver Account Created!
                                </h2>
                                <p className="text-brand-grey mb-6">
                                    Share these credentials with the driver
                                </p>

                                <div className="bg-brand-cloud rounded-xl p-4 mb-6 text-left">
                                    <div className="mb-4">
                                        <p className="text-xs text-brand-grey mb-1">Username</p>
                                        <p className="font-bold text-brand-slate text-lg">{createdDriver.username}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-brand-grey mb-1">Password</p>
                                        <p className="font-bold text-brand-green text-2xl tracking-wider">{generatedPassword}</p>
                                    </div>
                                </div>

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
                <h1 className="text-2xl font-bold text-brand-slate">Create Driver</h1>
            </header>

            <div className="flex-1 p-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <Card>
                        <CardContent className="p-6">
                            <div className="text-center mb-6">
                                <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <User className="w-8 h-8 text-brand-blue" />
                                </div>
                                <h2 className="text-xl font-bold text-brand-slate mb-2">
                                    New Driver Account
                                </h2>
                                <p className="text-sm text-brand-grey">
                                    Create login credentials for a driver
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Input
                                    label="Driver Name"
                                    type="text"
                                    placeholder="Full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    error={errors.name}
                                />

                                <Input
                                    label="Phone Number"
                                    type="tel"
                                    placeholder="10-digit phone number"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    error={errors.phone}
                                />

                                <div>
                                    <label className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1 block ml-4">
                                        Assign Bus
                                    </label>
                                    <select
                                        value={formData.busId}
                                        onChange={(e) => setFormData({ ...formData, busId: e.target.value })}
                                        className="flex h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-brand-slate focus:outline-none focus:ring-2 focus:ring-brand-green"
                                    >
                                        <option value="">Select a bus</option>
                                        {buses.map((bus) => (
                                            <option key={bus.id} value={bus.id}>
                                                {bus.registrationNumber} ({bus.routeFrom} → {bus.routeTo})
                                            </option>
                                        ))}
                                    </select>
                                    {errors.busId && (
                                        <p className="text-xs text-red-500 mt-1 ml-4">{errors.busId}</p>
                                    )}
                                </div>

                                {errors.general && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                        <p className="text-sm text-red-600 text-center">{errors.general}</p>
                                    </div>
                                )}

                                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                    <p className="text-xs text-blue-800">
                                        ℹ️ Username and password will be auto-generated
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full py-6 text-lg bg-brand-green hover:bg-green-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Creating Driver..." : "Create Driver Account"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}
