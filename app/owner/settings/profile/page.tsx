"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Building, Phone, Mail, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { supabase, OwnerProfile } from "@/lib/supabase";

export default function CompanyProfilePage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState("");

    const [formData, setFormData] = useState({
        company_name: "",
        email: "",
        phone: "",
        address: ""
    });

    useEffect(() => {
        const loadProfile = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push("/owner/auth/login");
                    return;
                }

                const { data, error } = await supabase
                    .from('owner_profiles')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;
                if (data) {
                    setFormData({
                        company_name: data.company_name || "",
                        email: data.email || session.user.email || "",
                        phone: data.phone || "",
                        address: data.address || ""
                    });
                }
            } catch (err: any) {
                console.error('Error loading profile:', err);
                setError('Failed to load profile');
            } finally {
                setIsLoading(false);
            }
        };

        loadProfile();
    }, [router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");
        setSuccess("");
        setIsSaving(true);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) return;

            const { error } = await supabase
                .from('owner_profiles')
                .update({
                    company_name: formData.company_name,
                    phone: formData.phone,
                    address: formData.address
                    // Email is typically updated via auth, not directly in profile often
                })
                .eq('id', session.user.id);

            if (error) throw error;
            setSuccess("Profile updated successfully");
        } catch (err: any) {
            console.error('Error updating profile:', err);
            setError(err.message || 'Failed to update profile');
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading profile...</p>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="bg-white shadow-sm p-4 flex items-center">
                <Link href="/owner/settings">
                    <Button variant="ghost" size="icon">
                        <ArrowLeft className="w-5 h-5 text-brand-slate" />
                    </Button>
                </Link>
                <div className="ml-2">
                    <h1 className="text-xl font-bold text-brand-slate">Company Profile</h1>
                    <p className="text-sm text-brand-grey">Update your business details</p>
                </div>
            </header>

            <div className="p-4 max-w-2xl mx-auto">
                <Card>
                    <CardContent className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <Input
                                label="Company Name"
                                value={formData.company_name}
                                onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                                placeholder="Enter company name"
                                suffix={<Building className="w-5 h-5" />}
                            />

                            <Input
                                label="Email Address"
                                value={formData.email}
                                disabled
                                className="bg-gray-50"
                                suffix={<Mail className="w-5 h-5" />}
                            />
                            <p className="text-xs text-brand-grey -mt-4 pl-4">
                                Contact support to change email address
                            </p>

                            <Input
                                label="Phone Number"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                placeholder="Enter phone number"
                                type="tel"
                                suffix={<Phone className="w-5 h-5" />}
                            />

                            <div>
                                <label className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1 block ml-4">
                                    Address
                                </label>
                                <div className="relative">
                                    <textarea
                                        value={formData.address}
                                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                        placeholder="Enter business address"
                                        className="w-full min-h-[100px] rounded-2xl border border-gray-200 bg-white px-4 py-3 text-base font-medium text-brand-slate placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent resize-y"
                                    />
                                    <div className="absolute right-4 top-4 text-gray-400">
                                        <MapPin className="w-5 h-5" />
                                    </div>
                                </div>
                            </div>

                            {error && (
                                <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm text-center">
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm text-center">
                                    {success}
                                </div>
                            )}

                            <Button
                                type="submit"
                                disabled={isSaving}
                                className="w-full py-6 bg-brand-green hover:bg-green-700 text-lg"
                            >
                                {isSaving ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
