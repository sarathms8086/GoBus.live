"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function OwnerLoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!email || !password) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        try {
            // Sign in with Supabase Auth
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (authError) {
                setError(authError.message);
                setIsLoading(false);
                return;
            }

            if (data.user) {
                // Verify user is an owner - use maybeSingle for faster query
                const { data: profileData, error: profileError } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', data.user.id)
                    .maybeSingle();

                if (profileError || profileData?.role !== 'owner') {
                    await supabase.auth.signOut();
                    setError("This login is for fleet owners only");
                    setIsLoading(false);
                    return;
                }

                // Use replace for faster navigation (no history entry)
                router.replace("/owner");
                return; // Exit early, no need for finally block
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-brand-cloud flex flex-col">
            <header className="p-6 flex items-center">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="mr-4">
                        <ArrowLeft className="w-6 h-6 text-brand-slate" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-brand-slate">Owner Login</h1>
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
                                Welcome Back!
                            </h2>
                            <p className="text-brand-grey">Manage your fleet</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Email"
                                type="email"
                                placeholder="Enter your email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                error={error && !email ? "This field is required" : ""}
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
                                className="w-full py-6 text-lg bg-brand-slate hover:bg-gray-800 shadow-lg shadow-brand-slate/20"
                                disabled={isLoading}
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </form>

                        <div className="mt-8 pt-6 border-t border-gray-200 text-center">
                            <p className="text-sm text-brand-grey mb-3">
                                Don't have an account?
                            </p>
                            <Link href="/owner/auth/signup">
                                <Button variant="outline" className="w-full">
                                    Register Your Company
                                </Button>
                            </Link>
                        </div>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
