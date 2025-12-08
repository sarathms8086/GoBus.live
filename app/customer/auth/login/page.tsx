"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Mail, Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useLegacyAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function LoginPage() {
    const router = useRouter();
    const { login } = useLegacyAuth();
    const [emailOrPhone, setEmailOrPhone] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!emailOrPhone || !password) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        const success = await login(emailOrPhone, password);
        setIsLoading(false);

        if (success) {
            router.push("/customer/profile");
        } else {
            setError("Invalid email/phone or password");
        }
    };

    return (
        <main className="min-h-screen bg-brand-cloud flex flex-col">
            {/* Header */}
            <header className="p-6 flex items-center">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-brand-slate">Customer Login</h1>
            </header>

            {/* Login Form */}
            <div className="flex-1 flex items-center justify-center px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-3xl p-8 shadow-xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-brand-green/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <LogIn className="w-8 h-8 text-brand-green" />
                            </div>
                            <h2 className="text-2xl font-bold text-brand-slate mb-2">
                                Welcome Back!
                            </h2>
                            <p className="text-brand-grey">Login to continue your journey</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Email or Phone"
                                type="text"
                                placeholder="Enter your email or phone"
                                value={emailOrPhone}
                                onChange={(e) => setEmailOrPhone(e.target.value)}
                                error={error && !emailOrPhone ? "This field is required" : ""}
                            />

                            <Input
                                label="Password"
                                type="password"
                                placeholder="Enter your password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                error={error && !password ? "This field is required" : ""}
                            />

                            {error && (
                                <div className="bg-red-50 border border-red-200 rounded-xl p-3">
                                    <p className="text-sm text-red-600 text-center">{error}</p>
                                </div>
                            )}

                            <Button
                                type="submit"
                                className="w-full py-6 text-lg bg-brand-green hover:bg-green-700 shadow-lg shadow-brand-green/20"
                                disabled={isLoading}
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </form>

                        <div className="mt-6 text-center">
                            <Link
                                href="/customer/auth/forgot-password"
                                className="text-sm text-brand-blue hover:underline"
                            >
                                Forgot Password?
                            </Link>
                        </div>

                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="text-sm text-brand-grey mb-3">
                                Don't have an account?
                            </p>
                            <Link href="/customer/auth/signup">
                                <Button variant="outline" className="w-full">
                                    Create Account
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
