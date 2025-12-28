"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, BusFront, Settings } from "lucide-react";

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const pathname = usePathname();

    const navItems = [
        { href: "/owner", icon: LayoutDashboard, label: "Dashboard" },
        { href: "/owner/fleet", icon: BusFront, label: "Fleet" },
        { href: "/owner/settings", icon: Settings, label: "Settings" },
    ];

    const isActive = (href: string) => {
        if (href === "/owner") {
            return pathname === "/owner";
        }
        return pathname?.startsWith(href);
    };

    return (
        <div className="min-h-screen bg-brand-cloud pb-20">
            {children}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50 shadow-lg">
                {navItems.map((item) => {
                    const active = isActive(item.href);
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`flex flex-col items-center justify-center w-full h-full transition-all duration-200 ${active
                                ? "text-brand-blue"
                                : "text-brand-grey hover:text-brand-blue"
                                }`}
                        >
                            <div className={`relative ${active ? "scale-110" : ""} transition-transform`}>
                                <item.icon className={`w-6 h-6 mb-1 ${active ? "stroke-[2.5px]" : ""}`} />
                                {active && (
                                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand-blue rounded-full"></div>
                                )}
                            </div>
                            <span className={`text-[10px] font-medium ${active ? "font-bold" : ""}`}>
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </div>
    );
}
