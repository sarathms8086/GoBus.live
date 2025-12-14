"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Mail, BusFront, Ticket } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";

export default function NotificationsPage() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const [preferences, setPreferences] = useState({
        email_alerts: true,
        booking_notifications: true,
        bus_status_updates: false
    });

    useEffect(() => {
        const loadPreferences = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session?.user) {
                    router.push("/owner/auth/login");
                    return;
                }

                const { data, error } = await supabase
                    .from('owner_profiles')
                    .select('notification_preferences')
                    .eq('id', session.user.id)
                    .single();

                if (error) throw error;
                if (data?.notification_preferences) {
                    setPreferences(data.notification_preferences as any);
                }
            } catch (err) {
                console.error('Error loading preferences:', err);
            } finally {
                setIsLoading(false);
            }
        };

        loadPreferences();
    }, [router]);

    const handleToggle = async (key: keyof typeof preferences) => {
        const newPreferences = { ...preferences, [key]: !preferences[key] };
        setPreferences(newPreferences);

        // Auto-save
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                await supabase
                    .from('owner_profiles')
                    .update({ notification_preferences: newPreferences })
                    .eq('id', session.user.id);
            }
        } catch (err) {
            console.error('Failed to save preference', err);
        }
    };

    const NotificationItem = ({
        title,
        description,
        icon: Icon,
        isOn,
        onToggle
    }: {
        title: string;
        description: string;
        icon: any;
        isOn: boolean;
        onToggle: () => void;
    }) => (
        <div className="flex items-center justify-between p-4 border-b border-gray-100 last:border-0">
            <div className="flex items-start gap-4">
                <div className={`p-2 rounded-lg ${isOn ? 'bg-orange-100' : 'bg-gray-100'}`}>
                    <Icon className={`w-6 h-6 ${isOn ? 'text-orange-600' : 'text-gray-400'}`} />
                </div>
                <div>
                    <h3 className="font-bold text-brand-slate">{title}</h3>
                    <p className="text-sm text-brand-grey">{description}</p>
                </div>
            </div>
            <button
                onClick={onToggle}
                className={`w-14 h-7 rounded-full p-1 transition-colors ${isOn ? 'bg-brand-green' : 'bg-gray-300'}`}
            >
                <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform transition-transform ${isOn ? 'translate-x-7' : 'translate-x-0'}`} />
            </button>
        </div>
    );

    if (isLoading) {
        return (
            <div className="min-h-screen bg-brand-cloud flex items-center justify-center">
                <p className="text-brand-grey">Loading settings...</p>
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
                    <h1 className="text-xl font-bold text-brand-slate">Notifications</h1>
                    <p className="text-sm text-brand-grey">Manage your alert preferences</p>
                </div>
            </header>

            <div className="p-4 max-w-2xl mx-auto">
                <Card>
                    <CardContent className="p-0">
                        <NotificationItem
                            title="Email Alerts"
                            description="Receive important updates via email"
                            icon={Mail}
                            isOn={preferences.email_alerts}
                            onToggle={() => handleToggle('email_alerts')}
                        />
                        <NotificationItem
                            title="Booking Notifications"
                            description="Get notified when tickets are booked"
                            icon={Ticket}
                            isOn={preferences.booking_notifications}
                            onToggle={() => handleToggle('booking_notifications')}
                        />
                        <NotificationItem
                            title="Bus Status Updates"
                            description="Alerts for bus delays or issues"
                            icon={BusFront}
                            isOn={preferences.bus_status_updates}
                            onToggle={() => handleToggle('bus_status_updates')}
                        />
                    </CardContent>
                </Card>
            </div>
        </main>
    );
}
