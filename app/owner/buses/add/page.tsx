"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BusFront } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { busApi } from "@/lib/api/buses";

export default function AddBusPage() {
    const router = useRouter();
    const [ownerId, setOwnerId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        registrationNumber: "",
        routeFrom: "",
        routeTo: "",
        totalSeats: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);
    const [isAuthLoading, setIsAuthLoading] = useState(true);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session?.user) {
                router.push("/owner/auth/login");
                return;
            }

            // Verify user is an owner
            const { data: ownerData, error } = await supabase
                .from('owner_profiles')
                .select('id')
                .eq('id', session.user.id)
                .single();

            if (error || !ownerData) {
                router.push("/owner/auth/login");
                return;
            }

            setOwnerId(session.user.id);
            setIsAuthLoading(false);
        };

        checkAuth();
    }, [router]);

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

        if (!formData.totalSeats) {
            newErrors.totalSeats = "Number of seats is required";
        } else {
            const seats = parseInt(formData.totalSeats);
            if (isNaN(seats) || seats < 1) {
                newErrors.totalSeats = "Must be at least 1 seat";
            } else if (seats > 100) {
                newErrors.totalSeats = "Maximum 100 seats allowed";
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm() || !ownerId) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            const bus = await busApi.create({
                owner_id: ownerId,
                registration_number: formData.registrationNumber,
                route_from: formData.routeFrom,
                route_to: formData.routeTo,
                total_seats: parseInt(formData.totalSeats),
            });

            router.push(`/owner/buses/${bus.id}/setup`);
        } catch (error: any) {
            console.error('Error creating bus:', error);

            if (error.message.includes('duplicate') || error.code === '23505') {
                setErrors({ general: "A bus with this registration number already exists." });
            } else {
                setErrors({ general: error.message || "Failed to create bus. Please try again." });
            }
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

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading...</p>
            </div>
        );
    }

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

                                <Input
                                    label="Number of Seats"
                                    type="text"
                                    inputMode="numeric"
                                    placeholder="e.g., 40"
                                    value={formData.totalSeats}
                                    onChange={(e) => {
                                        const val = e.target.value;
                                        if (val === "" || /^\d+$/.test(val)) {
                                            handleChange("totalSeats", val);
                                        }
                                    }}
                                    error={errors.totalSeats}
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
                                    {isLoading ? "Adding Bus..." : "Continue to Trip Setup"}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </main>
    );
}
