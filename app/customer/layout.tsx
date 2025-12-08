import Link from "next/link";
import { Home, Ticket, Wallet, User } from "lucide-react";

export default function CustomerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-brand-cloud pb-20">
            {children}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
                <Link href="/customer" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-green focus:text-brand-green active:text-brand-green">
                    <Home className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Home</span>
                </Link>
                <Link href="/customer/tickets" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-green focus:text-brand-green active:text-brand-green">
                    <Ticket className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">My Tickets</span>
                </Link>
                <Link href="/customer/wallet" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-green focus:text-brand-green active:text-brand-green">
                    <Wallet className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Wallet</span>
                </Link>
                <Link href="/customer/profile" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-green focus:text-brand-green active:text-brand-green">
                    <User className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Profile</span>
                </Link>
            </div>
        </div>
    );
}
