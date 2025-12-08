"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { Menu, X, User, Car, Briefcase } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";

export function GlobalMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const menuItems = [
        {
            title: "Customer Login",
            description: "Manage tickets & wallet",
            icon: User,
            href: "/customer/auth/login",
            color: "text-brand-green",
            bgColor: "bg-green-100",
        },
        {
            title: "Driver Partner",
            description: "Login for drivers & conductors",
            icon: Car,
            href: "/driver/auth/login",
            color: "text-brand-blue",
            bgColor: "bg-blue-100",
        },
        {
            title: "Bus Owner",
            description: "Manage fleet & revenue",
            icon: Briefcase,
            href: "/owner/auth/login",
            color: "text-brand-slate",
            bgColor: "bg-gray-200",
        },
    ];

    return (
        <>
            <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(true)}
                className="relative z-50 hover:bg-transparent"
            >
                <Menu className="w-8 h-8 text-brand-slate" />
            </Button>

            {mounted && createPortal(
                <AnimatePresence>
                    {isOpen && (
                        <>
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                onClick={() => setIsOpen(false)}
                                className="fixed inset-0 bg-black/60 z-[9999] backdrop-blur-sm"
                            />

                            {/* Menu Panel */}
                            <motion.div
                                initial={{ x: "100%" }}
                                animate={{ x: 0 }}
                                exit={{ x: "100%" }}
                                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                                className="fixed top-0 right-0 bottom-0 w-80 bg-white z-[10000] shadow-2xl p-6 flex flex-col"
                            >
                                <div className="flex justify-between items-center mb-8">
                                    <h2 className="text-2xl font-bold text-brand-slate">Menu</h2>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        onClick={() => setIsOpen(false)}
                                        className="hover:bg-gray-100 rounded-full"
                                    >
                                        <X className="w-6 h-6 text-brand-slate" />
                                    </Button>
                                </div>

                                <div className="space-y-4">
                                    {menuItems.map((item) => (
                                        <Link href={item.href} key={item.title} onClick={() => setIsOpen(false)}>
                                            <div className="p-4 rounded-xl hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100 group cursor-pointer">
                                                <div className="flex items-center mb-2">
                                                    <div className={`p-2 rounded-lg ${item.bgColor} mr-3 group-hover:scale-110 transition-transform`}>
                                                        <item.icon className={`w-5 h-5 ${item.color}`} />
                                                    </div>
                                                    <h3 className="font-bold text-brand-slate">{item.title}</h3>
                                                </div>
                                                <p className="text-sm text-brand-grey pl-[52px]">{item.description}</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>

                                <div className="mt-auto">
                                    <div className="p-4 bg-brand-cloud rounded-xl">
                                        <p className="text-xs text-brand-grey text-center">
                                            GO BUS v0.1 • Built with Next.js
                                        </p>
                                    </div>
                                </div>
                            </motion.div>
                        </>
                    )}
                </AnimatePresence>,
                document.body
            )}
        </>
    );
}

