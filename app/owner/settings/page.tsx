"use client";

import Link from "next/link";
import {
    ArrowLeft,
    CreditCard,
    User,
    Bell,
    Shield,
    ChevronRight,
    Building2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const settingsItems = [
    {
        title: "Financial Settings",
        description: "Manage bank accounts for revenue collection",
        icon: CreditCard,
        href: "/owner/settings/financial",
        color: "text-green-500",
        bgColor: "bg-green-50",
    },
    {
        title: "Company Profile",
        description: "Update company name and contact info",
        icon: Building2,
        href: "/owner/settings/profile",
        color: "text-blue-500",
        bgColor: "bg-blue-50",
    },
    {
        title: "Notifications",
        description: "Configure alerts and notifications",
        icon: Bell,
        href: "/owner/settings/notifications",
        color: "text-orange-500",
        bgColor: "bg-orange-50",
    },
    {
        title: "Security",
        description: "Password and account security",
        icon: Shield,
        href: "/owner/settings/security",
        color: "text-purple-500",
        bgColor: "bg-purple-50",
    },
];

export default function OwnerSettings() {
    return (
        <main className="min-h-screen bg-brand-cloud pb-20">
            <header className="bg-white shadow-sm p-4">
                <h1 className="text-2xl font-bold text-brand-slate">Settings</h1>
                <p className="text-sm text-brand-grey">Manage your account and preferences</p>
            </header>

            <div className="p-4 space-y-3">
                {settingsItems.map((item) => (
                    <Link
                        key={item.title}
                        href={item.href}
                    >
                        <Card className="hover:shadow-md transition-shadow">
                            <CardContent className="p-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-12 h-12 ${item.bgColor} rounded-xl flex items-center justify-center`}>
                                            <item.icon className={`w-6 h-6 ${item.color}`} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-brand-slate">{item.title}</h3>
                                            <p className="text-sm text-brand-grey">{item.description}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-400" />
                                </div>
                            </CardContent>
                        </Card>
                    </Link>
                ))}
            </div>
        </main>
    );
}
