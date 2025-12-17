"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Car } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { driverApi } from "@/lib/api/drivers";

const CURRENT_DRIVER_KEY = "go_bus_current_driver";

export default function DriverLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setIsLoading(true);

        if (!username || !password) {
            setError("Please fill in all fields");
            setIsLoading(false);
            return;
        }

        try {
            console.log("Attempting driver login for:", username);
            const driver = await driverApi.authenticate(username.trim(), password.trim());
            console.log("Auth result:", driver ? "Success" : "Failed");

            if (driver) {
                localStorage.setItem(CURRENT_DRIVER_KEY, driver.id);
                console.log("Driver ID stored, redirecting...");
                // Use window.location for reliable redirect
                window.location.href = "/driver";
                return;
            } else {
                setError("Invalid username or password");
                setIsLoading(false);
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError("Login failed: " + (err.message || "Please try again"));
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
                <h1 className="text-2xl font-bold text-brand-slate">Driver Login</h1>
            </header>

            <div className="flex-1 flex items-center justify-center px-6 pb-12">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-3xl p-8 shadow-xl">
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Car className="w-8 h-8 text-brand-blue" />
                            </div>
                            <h2 className="text-2xl font-bold text-brand-slate mb-2">
                                Welcome Driver!
                            </h2>
                            <p className="text-brand-grey">Login to start your trip</p>
                        </div>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Username"
                                type="text"
                                placeholder="Enter your username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                error={error && !username ? "This field is required" : ""}
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

                            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3">
                                <p className="text-xs text-blue-800">
                                    ℹ️ Use the credentials provided by your bus owner
                                </p>
                            </div>

                            <Button
                                type="submit"
                                className="w-full py-6 text-lg bg-brand-blue hover:bg-blue-700 shadow-lg shadow-brand-blue/20"
                                disabled={isLoading}
                            >
                                {isLoading ? "Logging in..." : "Login"}
                            </Button>
                        </form>
                    </div>
                </motion.div>
            </div>
        </main>
    );
}
