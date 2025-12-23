"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Building2, Eye, EyeOff, Bus, Shield, BarChart3 } from "lucide-react";
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
    const [showPassword, setShowPassword] = useState(false);

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
            console.log('Attempting login via API for:', email.trim());

            // Use API route for more reliable server-side auth
            const response = await fetch('/api/owner/auth', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: email.trim(), password }),
            });

            const result = await response.json();

            if (!response.ok) {
                console.error('API auth error:', result.error);
                setError(result.error || 'Login failed');
                setIsLoading(false);
                return;
            }

            console.log('API auth success, user:', result.user.id);

            // Check role from API response or database
            if (result.role && result.role !== 'owner') {
                setError('This login is for fleet owners only');
                setIsLoading(false);
                return;
            }

            // Try to set session with timeout - don't block if it hangs
            if (result.session) {
                console.log('Setting session...');
                try {
                    const setSessionPromise = supabase.auth.setSession({
                        access_token: result.session.access_token,
                        refresh_token: result.session.refresh_token,
                    });

                    const timeoutPromise = new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('setSession timeout')), 5000)
                    );

                    await Promise.race([setSessionPromise, timeoutPromise]);
                    console.log('Session set successfully');
                } catch (sessionErr: any) {
                    // If setSession times out or fails, manually store in localStorage
                    // This is a fallback to ensure login works
                    console.warn('setSession failed/timed out, storing manually:', sessionErr.message);

                    // Store session data manually for the Supabase client to pick up
                    const storageKey = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split('.')[0]}-auth-token`;
                    const sessionData = {
                        access_token: result.session.access_token,
                        refresh_token: result.session.refresh_token,
                        expires_at: result.session.expires_at,
                        expires_in: 3600,
                        token_type: 'bearer',
                        user: result.user,
                    };
                    localStorage.setItem(storageKey, JSON.stringify(sessionData));
                }
            }

            console.log('Login successful, redirecting to dashboard...');
            window.location.href = "/owner";

        } catch (err: any) {
            console.error('Unexpected login error:', err);
            setError(err.message || "An error occurred. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex flex-col relative overflow-hidden">
            {/* Decorative Background Elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl -translate-y-48 translate-x-48" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl translate-y-48 -translate-x-48" />
                <div className="absolute top-1/2 left-1/2 w-64 h-64 bg-purple-500/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
            </div>

            {/* Floating Icons */}
            <motion.div
                className="absolute top-20 right-10 text-white/10"
                animate={{ y: [0, -10, 0], rotate: [0, 5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
                <Bus className="w-16 h-16" />
            </motion.div>
            <motion.div
                className="absolute bottom-32 left-10 text-white/10"
                animate={{ y: [0, 10, 0], rotate: [0, -5, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
                <BarChart3 className="w-12 h-12" />
            </motion.div>
            <motion.div
                className="absolute top-1/3 left-16 text-white/5"
                animate={{ y: [0, -15, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
                <Shield className="w-20 h-20" />
            </motion.div>

            {/* Header */}
            <header className="p-6 flex items-center relative z-10">
                <Link href="/">
                    <Button variant="ghost" size="icon" className="mr-4 text-white/80 hover:text-white hover:bg-white/10">
                        <ArrowLeft className="w-6 h-6" />
                    </Button>
                </Link>
                <h1 className="text-2xl font-bold text-white">Fleet Owner Portal</h1>
            </header>

            <div className="flex-1 flex items-center justify-center px-6 pb-12 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 30, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                    className="w-full max-w-md"
                >
                    {/* Glass Card */}
                    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 shadow-2xl border border-white/20">
                        <div className="text-center mb-8">
                            <motion.div
                                className="w-20 h-20 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-lg shadow-emerald-500/30"
                                initial={{ scale: 0, rotate: -180 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                            >
                                <Building2 className="w-10 h-10 text-white" />
                            </motion.div>
                            <motion.h2
                                className="text-3xl font-bold text-white mb-2"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                            >
                                Welcome Back!
                            </motion.h2>
                            <motion.p
                                className="text-white/60"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4 }}
                            >
                                Manage your fleet with ease
                            </motion.p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-5">
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.5 }}
                            >
                                <label className="block text-sm font-medium text-white/80 mb-2">Email</label>
                                <input
                                    type="email"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all"
                                />
                            </motion.div>

                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.6 }}
                                className="space-y-2"
                            >
                                <label className="block text-sm font-medium text-white/80 mb-2">Password</label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        placeholder="Enter your password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-emerald-400/50 focus:border-emerald-400/50 transition-all pr-12"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white/50 hover:text-white transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="w-5 h-5" />
                                        ) : (
                                            <Eye className="w-5 h-5" />
                                        )}
                                    </button>
                                </div>
                                <div className="flex justify-end">
                                    <Link
                                        href="/owner/auth/forgot-password"
                                        className="text-sm font-medium text-emerald-400 hover:text-emerald-300 transition-colors"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </motion.div>

                            {error && (
                                <motion.div
                                    className="bg-red-500/20 border border-red-500/30 rounded-xl p-3 backdrop-blur-sm"
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                >
                                    <p className="text-sm text-red-300 text-center">{error}</p>
                                </motion.div>
                            )}

                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.7 }}
                            >
                                <Button
                                    type="submit"
                                    className="w-full py-6 text-lg bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 shadow-lg shadow-emerald-500/30 border-0 font-semibold transition-all duration-300 hover:shadow-emerald-500/50 hover:scale-[1.02]"
                                    disabled={isLoading}
                                >
                                    {isLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <motion.div
                                                className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                                                animate={{ rotate: 360 }}
                                                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                                            />
                                            Logging in...
                                        </span>
                                    ) : (
                                        "Login to Dashboard"
                                    )}
                                </Button>
                            </motion.div>
                        </form>

                        <motion.div
                            className="mt-8 pt-6 border-t border-white/10 text-center"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.8 }}
                        >
                            <p className="text-sm text-white/50 mb-4">
                                New to GO BUS?
                            </p>
                            <Link href="/owner/auth/signup">
                                <Button
                                    variant="outline"
                                    className="w-full py-5 bg-transparent border-2 border-white/20 text-white hover:bg-white/10 hover:border-white/40 transition-all duration-300"
                                >
                                    Register Your Company
                                </Button>
                            </Link>
                        </motion.div>
                    </div>

                    {/* Trust Indicators */}
                    <motion.div
                        className="mt-8 text-center"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                    >
                        <p className="text-white/30 text-sm flex items-center justify-center gap-2">
                            <Shield className="w-4 h-4" />
                            Secure & Encrypted Login
                        </p>
                    </motion.div>
                </motion.div>
            </div>
        </main>
    );
}
