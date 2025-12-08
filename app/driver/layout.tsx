import Link from "next/link";
import { Navigation, QrCode, User } from "lucide-react";

export default function DriverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-brand-cloud pb-20">
            {children}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
                <Link href="/driver" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-blue focus:text-brand-blue active:text-brand-blue">
                    <Navigation className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Trip</span>
                </Link>
                <Link href="/driver/validate" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-blue focus:text-brand-blue active:text-brand-blue">
                    <QrCode className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Validate</span>
                </Link>
                <Link href="/driver/profile" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-blue focus:text-brand-blue active:text-brand-blue">
                    <User className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </div>
        </div>
    );
}
