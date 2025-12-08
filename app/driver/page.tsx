"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MapPin, Play, Pause, Users, Navigation } from "lucide-react";

export default function DriverDashboard() {
    const [isTripActive, setIsTripActive] = useState(false);

    return (
        <div className="p-4 space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-brand-slate">Driver Dashboard</h1>
                <div className="bg-brand-blue/10 text-brand-blue px-3 py-1 rounded-full text-sm font-bold">
                    Bus 402
                </div>
            </div>

            {!isTripActive ? (
                <Card className="border-brand-blue/20 shadow-md">
                    <CardContent className="p-6 flex flex-col items-center text-center">
                        <div className="w-16 h-16 bg-brand-blue/10 rounded-full flex items-center justify-center mb-4">
                            <Navigation className="w-8 h-8 text-brand-blue" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">Ready to Start?</h2>
                        <p className="text-brand-grey mb-6">Route: City Center - Airport</p>
                        <Button
                            onClick={() => setIsTripActive(true)}
                            className="w-full bg-brand-blue hover:bg-blue-700 py-6 text-lg"
                        >
                            <Play className="w-5 h-5 mr-2 fill-current" />
                            Start Trip
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-4">
                    <Card className="bg-brand-blue text-white border-none shadow-lg">
                        <CardContent className="p-6">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="opacity-80 text-sm">Current Stop</p>
                                    <h2 className="text-2xl font-bold">Market</h2>
                                </div>
                                <div className="bg-white/20 px-3 py-1 rounded-full text-sm font-bold animate-pulse">
                                    LIVE
                                </div>
                            </div>
                            <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/20">
                                <div>
                                    <p className="opacity-80 text-xs">Next Stop</p>
                                    <p className="font-bold">Central Station</p>
                                </div>
                                <div className="text-right">
                                    <p className="opacity-80 text-xs">Passengers</p>
                                    <p className="font-bold">24 / 40</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Button
                        onClick={() => setIsTripActive(false)}
                        variant="destructive"
                        className="w-full py-6"
                    >
                        <Pause className="w-5 h-5 mr-2 fill-current" />
                        End Trip
                    </Button>
                </div>
            )}

            {/* Recent Activity */}
            <div>
                <h3 className="font-bold text-brand-slate mb-3">Recent Validations</h3>
                <div className="space-y-2">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white p-3 rounded-xl border border-gray-100 flex justify-between items-center">
                            <div className="flex items-center">
                                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                                    <Users className="w-4 h-4 text-green-700" />
                                </div>
                                <div>
                                    <p className="font-bold text-sm">Ticket #882{i}</p>
                                    <p className="text-xs text-brand-grey">Just now</p>
                                </div>
                            </div>
                            <span className="text-green-600 font-bold text-sm">Verified</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
