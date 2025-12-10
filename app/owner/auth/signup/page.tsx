"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function OwnerSignupPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        companyName: "",
        email: "",
        phone: "",
        password: "",
        confirmPassword: "",
    });
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isLoading, setIsLoading] = useState(false);

    const validateForm = () => {
        const newErrors: Record<string, string> = {};

        if (!formData.companyName) {
            newErrors.companyName = "Company name is required";
        } else if (formData.companyName.length < 3) {
            newErrors.companyName = "Company name must be at least 3 characters";
        }

        if (!formData.email) {
            newErrors.email = "Email is required";
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            newErrors.email = "Invalid email format";
        }

        if (!formData.phone) {
            newErrors.phone = "Phone number is required";
        } else if (!/^\d{10}$/.test(formData.phone)) {
            newErrors.phone = "Phone must be 10 digits";
        }

        if (!formData.password) {
            newErrors.password = "Password is required";
        } else if (formData.password.length < 6) {
            newErrors.password = "Password must be at least 6 characters";
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = "Passwords do not match";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        setIsLoading(true);
        setErrors({});

        try {
            // Sign up with Supabase Auth
            const { data, error } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        role: 'owner',
                        display_name: formData.companyName,
                        company_name: formData.companyName,
                        phone: formData.phone,
                    },
                },
            });

            if (error) {
                console.error('Signup error:', error);
                setErrors({ general: error.message });
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Check if email confirmation is required
                if (data.user.identities && data.user.identities.length === 0) {
                    setErrors({ general: "A user with this email already exists." });
                    setIsLoading(false);
                    return;
                }

                // Check if email needs verification
                if (data.session === null) {
                    setErrors({
                        success: "Account created! Please check your email to verify your account before logging in."
                    });
                    setIsLoading(false);
                    return;
                }

                router.push("/owner");
            }
        } catch (error) {
            console.error('Signup exception:', error);
            setErrors({ general: "An error occurred. Please try again." });
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
            <header className="p-6 flex items-center">
                <Link href="/owner/auth/login">
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-brand-slate">Register Company</h1>
            </header>

            <div className="flex-1 flex items-center justify-center px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-3xl p-8 shadow-xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-brand-slate/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Building2 className="w-8 h-8 text-brand-slate" />
                            </div>
                            <h2 className="text-2xl font-bold text-brand-slate mb-2">
                                Join GO BUS
                            </h2>
                            <p className="text-brand-grey">Register your bus company</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <Input
                                label="Company Name"
                                type="text"
                                placeholder="Enter company name"
                                value={formData.companyName}
                                onChange={(e) => handleChange("companyName", e.target.value)}
                                error={errors.companyName}
                            />

                            <Input
                                label="Email"
                                type="email"
                                placeholder="Enter your email"
                                value={formData.email}
                                onChange={(e) => handleChange("email", e.target.value)}
                                error={errors.email}
                            />

                            <Input
                                label="Phone Number"
                                type="tel"
                                placeholder="10-digit phone number"
                                value={formData.phone}
                                onChange={(e) => handleChange("phone", e.target.value)}
                                error={errors.phone}
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="Create a password"
                                value={formData.password}
                                onChange={(e) => handleChange("password", e.target.value)}
                                error={errors.password}
                            />

                            <Input
                                label="Confirm Password"
                                type="password"
                                placeholder="Re-enter your password"
                                value={formData.confirmPassword}
                                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                                error={errors.confirmPassword}
                            />

                            {errors.success && (
                                <div className="bg-green-50 border border-green-200 rounded-xl p-3">
                                    <p className="text-sm text-green-600 text-center">{errors.success}</p>
                                </div>
                            )}

                            {errors.general && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-sm text-red-600 text-center">{errors.general}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full py-6 text-lg bg-brand-slate hover:bg-gray-800 shadow-lg shadow-brand-slate/20"
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating Account..." : "Register Company"}
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="text-sm text-brand-grey mb-3">
                                Already have an account?
                            </p>
                            <Link href="/owner/auth/login">
                                <Button variant="outline" className="w-full">
                                    Login
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
