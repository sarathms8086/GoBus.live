"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Building2, Eye, EyeOff } from "lucide-react";
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

                            <div className="space-y-2">
                                <Input
                                    label="Password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    error={error && !password ? "This field is required" : ""}
                                    suffix={
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="focus:outline-none hover:text-brand-slate transition-colors"
                                        >
                                            {showPassword ? (
                                                <EyeOff className="w-5 h-5" />
                                            ) : (
                                                <Eye className="w-5 h-5" />
                                            )}
                                        </button>
                                    }
                                />
                                <div className="flex justify-end">
                                    <Link
                                        href="/owner/auth/forgot-password"
                                        className="text-sm font-medium text-brand-green hover:underline"
                                    >
                                        Forgot password?
                                    </Link>
                                </div>
                            </div>

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
