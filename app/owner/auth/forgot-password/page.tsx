"use client";
import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, KeyRound, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function OwnerForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!email) {
            setError("Please enter your email");
            setIsLoading(false);
            return;
        }

        try {
            // Note: redirectTo should point to the page where they enter new password
            // For now we point to a route we haven't built or just let Supabase handle magic link login
            const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
                redirectTo: `${window.location.origin}/owner/auth/update-password`,
            });

            if (resetError) {
                setError(resetError.message);
            } else {
                setSuccess(true);
            }
        } catch (err) {
            setError("An error occurred. Please try again.");
        } finally {
            setIsLoading(false);
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
                <h1 className="text-2xl font-bold text-brand-slate">Reset Password</h1>
            </header>

            <div className="flex-1 flex items-center justify-center px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-3xl p-8 shadow-xl">
                        {success ? (
                            <div className="text-center py-8">
                                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <CheckCircle2 className="w-8 h-8 text-green-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-brand-slate mb-4">Check your email</h2>
                                <p className="text-brand-grey mb-8">
                                    We have sent a password reset link to <br />
                                    <span className="font-medium text-brand-slate">{email}</span>
                                </p>
                                <Button
                                    onClick={() => setSuccess(false)}
                                    variant="outline"
                                    className="w-full"
                                >
                                    Resend Link
                                </Button>
                                <Link href="/owner/auth/login" className="block mt-4">
                                    <Button variant="ghost" className="w-full">
                                        Back to Login
                                    </Button>
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="text-center mb-8">
                                    <div className="w-16 h-16 bg-brand-slate/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <KeyRound className="w-8 h-8 text-brand-slate" />
                                    </div>
                                    <h2 className="text-2xl font-bold text-brand-slate mb-2">
                                        Forgot Password?
                                    </h2>
                                    <p className="text-brand-grey">
                                        Enter your email to receive reset instructions
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-6">
                                    <Input
                                        label="Email Address"
                                        type="email"
                                        placeholder="Enter your registered email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        error={error && !email ? "This field is required" : ""}
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
                                        {isLoading ? "Sending..." : "Send Reset Link"}
                                    </Button>
                                </form>

                                <div className="mt-6 text-center">
                                    <Link
                                        href="/owner/auth/login"
                                        className="text-sm font-medium text-brand-grey hover:text-brand-slate transition-colors"
                                    >
                                        Back to Login
                                    </Link>
                                </div>
                            </>
                        )}
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
