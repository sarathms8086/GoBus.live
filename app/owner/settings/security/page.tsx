"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Lock, Shield, KeyRound, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";

export default function SecurityPage() {
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [passwords, setPasswords] = useState({
        newPassword: "",
        confirmPassword: ""
    });

    const handlePasswordChange = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: "", text: "" });

        if (passwords.newPassword.length < 6) {
            setMessage({ type: "error", text: "Password must be at least 6 characters" });
            return;
        }

        if (passwords.newPassword !== passwords.confirmPassword) {
            setMessage({ type: "error", text: "Passwords do not match" });
            return;
        }

        setIsSaving(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: passwords.newPassword
            });

            if (error) throw error;
            setMessage({ type: "success", text: "Password updated successfully" });
            setPasswords({ newPassword: "", confirmPassword: "" });
        } catch (err: any) {
            console.error('Error changing password:', err);
            setMessage({ type: "error", text: err.message || "Failed to update password" });
        } finally {
            setIsSaving(false);
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/owner/auth/login");
    };

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="bg-white shadow-sm p-4 flex items-center">
                <Link href="/owner/settings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5 text-brand-slate" />
                    </Button>
                </Link>
                <div className="ml-2">
                    <h1 className="text-xl font-bold text-brand-slate">Security</h1>
                    <p className="text-sm text-brand-grey">Password and account security</p>
                </div>
            </header>

            <div className="p-4 max-w-2xl mx-auto space-y-6">

                {/* Change Password */}
                <Card>
                    <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-purple-100 p-2 rounded-lg">
                                <KeyRound className="w-6 h-6 text-purple-600" />
                            </div>
                            <h2 className="font-bold text-brand-slate">Change Password</h2>
                        </div>

                        <form onSubmit={handlePasswordChange} className="space-y-4">
                            <Input
                                type="password"
                                label="New Password"
                                placeholder="Enter new password"
                                value={passwords.newPassword}
                                onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                suffix={<Lock className="w-4 h-4" />}
                            />

                            <Input
                                type="password"
                                label="Confirm Password"
                                placeholder="Confirm new password"
                                value={passwords.confirmPassword}
                                onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                suffix={<Shield className="w-4 h-4" />}
                            />

                            {message.text && (
                                <div className={`p-3 rounded-xl text-sm text-center ${message.type === 'error' ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
                                    {message.text}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full bg-brand-slate hover:bg-slate-800"
                            >
                                {isSaving ? 'Updating...' : 'Update Password'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Sign Out */}
                <Card className="border-red-100">
                    <CardContent className="p-6">
                        <h2 className="font-bold text-red-600 mb-2">Danger Zone</h2>
                        <p className="text-sm text-brand-grey mb-4">
                            Sign out of your account on this device.
                        </p>
                        <Button
                            variant="outline"
                            onClick={handleLogout}
                            className="w-full border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                        >
                            <LogOut className="w-4 h-4 mr-2" />
                            Sign Out
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
