"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, LogIn, Car, Camera, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";

const CURRENT_DRIVER_KEY = "go_bus_current_driver";
const PERMISSIONS_REQUESTED_KEY = "go_bus_permissions_requested";

export default function DriverLoginPage() {
    const router = useRouter();
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [showPermissionDialog, setShowPermissionDialog] = useState(false);
    const [permissionStatus, setPermissionStatus] = useState<{ camera: boolean; location: boolean }>({
        camera: false,
        location: false
    });

    const requestPermissions = async () => {
        const status = { camera: false, location: false };

        // Request camera permission
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: true });
            stream.getTracks().forEach(track => track.stop());
            status.camera = true;
        } catch (err) {
            console.log("Camera permission denied or unavailable");
        }

        // Request location permission
        try {
            await new Promise((resolve, reject) => {
                navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 5000 });
            });
            status.location = true;
        } catch (err) {
            console.log("Location permission denied or unavailable");
        }

        setPermissionStatus(status);
        localStorage.setItem(PERMISSIONS_REQUESTED_KEY, "true");

        // Redirect to dashboard after permissions
        window.location.href = "/driver";
    };

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

            // Use API route to bypass RLS
            const response = await fetch('/api/driver/auth', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    username: username.trim(),
                    password: password.trim(),
                }),
            });

            const result = await response.json();
            console.log("Auth response:", response.status);

            if (response.ok && result.driver) {
                localStorage.setItem(CURRENT_DRIVER_KEY, result.driver.id);
                console.log("Driver ID stored");

                // Check if permissions have been requested before
                const permissionsRequested = localStorage.getItem(PERMISSIONS_REQUESTED_KEY);
                if (!permissionsRequested) {
                    // Show permission dialog for first-time login
                    setShowPermissionDialog(true);
                    setIsLoading(false);
                } else {
                    // Already requested, go to dashboard
                    window.location.href = "/driver";
                }
                return;
            } else {
                setError(result.error || "Invalid username or password");
                setIsLoading(false);
            }
        } catch (err: any) {
            console.error("Login error:", err);
            setError("Login failed: " + (err.message || "Please try again"));
            setIsLoading(false);
        }
    };

    const skipPermissions = () => {
        localStorage.setItem(PERMISSIONS_REQUESTED_KEY, "true");
        window.location.href = "/driver";
    };

    if (showPermissionDialog) {
        return (
            <main className="min-h-screen bg-brand-cloud flex flex-col items-center justify-center p-6">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="w-full max-w-md"
                >
                    <div className="bg-white rounded-3xl p-8 shadow-xl text-center">
                        <div className="w-20 h-20 bg-brand-blue/10 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Camera className="w-10 h-10 text-brand-blue" />
                        </div>

                        <h2 className="text-2xl font-bold text-brand-slate mb-2">
                            Enable Permissions
                        </h2>
                        <p className="text-brand-grey mb-6">
                            GO BUS needs access to your camera and location for scanning tickets and tracking.
                        </p>

                        <div className="space-y-3 mb-6">
                            <div className="flex items-center p-4 bg-blue-50 rounded-xl">
                                <Camera className="w-6 h-6 text-brand-blue mr-3" />
                                <div className="text-left flex-1">
                                    <p className="font-semibold text-brand-slate">Camera</p>
                                    <p className="text-xs text-brand-grey">To scan passenger QR codes</p>
                                </div>
                                {permissionStatus.camera && (
                                    <span className="text-brand-green font-bold">✓</span>
                                )}
                            </div>
                            <div className="flex items-center p-4 bg-green-50 rounded-xl">
                                <MapPin className="w-6 h-6 text-brand-green mr-3" />
                                <div className="text-left flex-1">
                                    <p className="font-semibold text-brand-slate">Location</p>
                                    <p className="text-xs text-brand-grey">To track bus position</p>
                                </div>
                                {permissionStatus.location && (
                                    <span className="text-brand-green font-bold">✓</span>
                                )}
                            </div>
                        </div>

                        <Button
                            onClick={requestPermissions}
                            className="w-full py-6 text-lg bg-brand-blue hover:bg-blue-700 shadow-lg mb-3"
                        >
                            Allow Permissions
                        </Button>

                        <button
                            onClick={skipPermissions}
                            className="text-brand-grey text-sm hover:text-brand-slate"
                        >
                            Skip for now
                        </button>
                    </div>
                </motion.div>
            </main>
        );
    }

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
