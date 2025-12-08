import Link from "next/link";
import { Search, QrCode, Hash, MapPin, Clock, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { MOCK_BUSES } from "@/lib/mock-db";

export default function CustomerHome() {
    return (
        <div className="p-4 space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <p className="text-sm text-brand-grey">Current Location</p>
                    <div className="flex items-center text-brand-slate font-bold">
                        <MapPin className="w-4 h-4 mr-1 text-brand-green" />
                        <span>Koramangala, Bangalore</span>
                    </div>
                </div>
                <div className="w-10 h-10 bg-brand-green/10 rounded-full flex items-center justify-center text-brand-green font-bold">
                    SM
                </div>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-3 w-5 h-5 text-brand-grey" />
                <input
                    type="text"
                    placeholder="Where do you want to go?"
                    className="w-full pl-10 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:border-brand-green focus:ring-1 focus:ring-brand-green bg-white shadow-sm"
                />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-4">
                <Link href="/customer/scan">
                    <Button variant="primary" className="w-full h-auto py-4 flex flex-col items-center gap-2">
                        <QrCode className="w-6 h-6" />
                        <span>Scan QR</span>
                    </Button>
                </Link>
                <Link href="/customer/enter-code">
                    <Button variant="outline" className="w-full h-auto py-4 flex flex-col items-center gap-2 bg-white">
                        <Hash className="w-6 h-6" />
                        <span>Enter Code</span>
                    </Button>
                </Link>
            </div>

            {/* Near Me */}
            <div>
                <div className="flex justify-between items-center mb-3">
                    <h2 className="text-lg font-bold text-brand-slate">Buses Near You</h2>
                    <Link href="/customer/map" className="text-sm text-brand-blue font-medium">View Map</Link>
                </div>

                <div className="space-y-3">
                    {MOCK_BUSES.map((bus) => (
                        <Link href={`/customer/bus/${bus.code}`} key={bus.id}>
                            <Card className="hover:border-brand-green transition-colors cursor-pointer">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                            <h3 className="font-bold text-lg text-brand-slate">{bus.code}</h3>
                                            <p className="text-sm text-brand-grey">{bus.routeName}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${bus.occupancy === "Low" ? "bg-green-100 text-green-700" :
                                            bus.occupancy === "Medium" ? "bg-yellow-100 text-yellow-700" :
                                                "bg-red-100 text-red-700"
                                            }`}>
                                            {bus.occupancy} Occupancy
                                        </span>
                                    </div>

                                    <div className="flex items-center justify-between text-sm text-brand-slate mt-3">
                                        <div className="flex items-center">
                                            <MapPin className="w-4 h-4 mr-1 text-brand-grey" />
                                            <span>Next: {bus.nextStop}</span>
                                        </div>
                                        <div className="flex items-center text-brand-green font-bold">
                                            <Clock className="w-4 h-4 mr-1" />
                                            <span>{bus.etaNextStop}</span>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            </div>
        </div>
    );
}
