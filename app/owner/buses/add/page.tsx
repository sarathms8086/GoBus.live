"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BusFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { getCurrentOwner } from "@/lib/owner-storage";
import { createBus } from "@/lib/bus-storage";

export default function AddBusPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        registrationNumber: "",
        routeFrom: "",
        routeTo: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.registrationNumber) {
            newErrors.registrationNumber = "Registration number is required";
        } else if (formData.registrationNumber.length < 6) {
            newErrors.registrationNumber = "Must be at least 6 characters";
        }

        if (!formData.routeFrom) {
            newErrors.routeFrom = "Starting point is required";
        }

        if (!formData.routeTo) {
            newErrors.routeTo = "Destination is required";
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
            const bus = createBus(
                owner.id,
                formData.registrationNumber,
                formData.routeFrom,
                formData.routeTo
            );

            router.push(`/owner/buses/${bus.id}`);
        } catch (error: any) {
            setErrors({ general: error.message });
        } finally {
            setIsLoading(false);
        }
    };

    const handleChange = (field: string, value: string) => {
        setFormData({ ...formData, [field]: value });
        if (errors[field]) {
            setErrors({ ...errors, [field]: "" });
        }
    };

    return (
        <main className="min-h-screen bg-brand-cloud flex flex-col">
            <header className="p-6 flex items-center bg-white shadow-sm">
                <Link href="/owner">
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-brand-slate">Add New Bus</h1>
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
                                    <BusFront className="w-8 h-8 text-brand-green" />
                                </div>
                                <h2 className="text-xl font-bold text-brand-slate mb-2">
                                    Register New Bus
                                </h2>
                                <p className="text-sm text-brand-grey">
                                    Enter bus details to add to your fleet
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <Input
                                    label="Bus Registration Number"
                                    type="text"
                                    placeholder="e.g., KA01AB1234"
                                    value={formData.registrationNumber}
                                    onChange={(e) => handleChange("registrationNumber", e.target.value.toUpperCase())}
                                    error={errors.registrationNumber}
                                />

                                <Input
                                    label="Route From"
                                    type="text"
                                    placeholder="Starting point"
                                    value={formData.routeFrom}
                                    onChange={(e) => handleChange("routeFrom", e.target.value)}
                                    error={errors.routeFrom}
                                />

                                <Input
                                    label="Route To"
                                    type="text"
                                    placeholder="Destination"
                                    value={formData.routeTo}
                                    onChange={(e) => handleChange("routeTo", e.target.value)}
                                    error={errors.routeTo}
                                />

                                {errors.general && (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                        <p className="text-sm text-red-600 text-center">{errors.general}</p>
                                    </div>
                                )}

                                <Button
                                    type="submit"
                                    className="w-full py-6 text-lg bg-brand-green hover:bg-green-700"
                                    disabled={isLoading}
                                >
                                    {isLoading ? "Adding Bus..." : "Add Bus & Configure Stops"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}
