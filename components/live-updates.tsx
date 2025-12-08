"use client";

import { motion } from "framer-motion";
import { AlertCircle, Clock, CheckCircle2 } from "lucide-react";

const updates = [
    { id: 1, text: "Bus 402 is arriving in 2 mins at Market", type: "info", icon: Clock },
    { id: 2, text: "Heavy traffic on Route 5 (Airport Road)", type: "warning", icon: AlertCircle },
    { id: 3, text: "Bus 101 has departed from Silk Board", type: "success", icon: CheckCircle2 },
];

export function LiveUpdates() {
    return (
        <div className="w-full overflow-hidden bg-brand-slate/5 border-y border-brand-slate/10 py-2 mb-6 backdrop-blur-sm">
            <motion.div
                className="flex whitespace-nowrap"
                animate={{ x: [0, -1000] }}
                transition={{
                    repeat: Infinity,
                    duration: 20,
                    ease: "linear",
                }}
            >
                {[...updates, ...updates, ...updates].map((update, i) => (
                    <div key={`${update.id}-${i}`} className="flex items-center mx-6">
                        <update.icon
                            className={`w-4 h-4 mr-2 ${update.type === "warning" ? "text-orange-500" :
                                    update.type === "success" ? "text-green-500" : "text-blue-500"
                                }`}
                        />
                        <span className="text-sm font-medium text-brand-slate/80">{update.text}</span>
                    </div>
                ))}
            </motion.div>
        </div>
    );
}
