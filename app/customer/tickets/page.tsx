import { MOCK_TICKETS } from "@/lib/mock-db";
import { Card, CardContent } from "@/components/ui/card";
import { QrCode, Calendar, MapPin } from "lucide-react";

export default function MyTickets() {
    return (
        <div className="p-4 pb-24">
            <h1 className="text-2xl font-bold text-brand-slate mb-6">My Tickets</h1>

            <div className="space-y-4">
                {MOCK_TICKETS.map((ticket) => (
                    <Card key={ticket.id} className={`border-l-4 ${ticket.status === 'Active' ? 'border-l-brand-green' : 'border-l-gray-300'}`}>
                        <CardContent className="p-0">
                            <div className="p-4 border-b border-dashed border-gray-200">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <h3 className="font-bold text-lg text-brand-slate">Bus {ticket.busCode}</h3>
                                        <p className="text-sm text-brand-grey">{ticket.routeName}</p>
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${ticket.status === "Active" ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                                        }`}>
                                        {ticket.status}
                                    </span>
                                </div>

                                <div className="flex items-center justify-between mt-4">
                                    <div className="text-sm">
                                        <p className="text-brand-grey text-xs">From</p>
                                        <p className="font-bold">{ticket.from}</p>
                                    </div>
                                    <div className="h-px w-8 bg-gray-300"></div>
                                    <div className="text-sm text-right">
                                        <p className="text-brand-grey text-xs">To</p>
                                        <p className="font-bold">{ticket.to}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-4 bg-gray-50 rounded-b-xl flex justify-between items-center">
                                <div className="flex items-center text-sm text-brand-slate">
                                    <Calendar className="w-4 h-4 mr-2 text-brand-grey" />
                                    {ticket.date}
                                </div>
                                {ticket.status === "Active" && (
                                    <div className="bg-white p-1 rounded border border-gray-200">
                                        <QrCode className="w-8 h-8 text-brand-slate" />
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>
    );
}
