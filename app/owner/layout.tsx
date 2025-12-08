import Link from "next/link";
import { LayoutDashboard, BusFront, Settings } from "lucide-react";

export default function OwnerLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-brand-cloud pb-20">
            {children}

            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 flex justify-around items-center h-16 z-50">
                <Link href="/owner" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-slate focus:text-brand-slate active:text-brand-slate">
                    <LayoutDashboard className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Dashboard</span>
                </Link>
                <Link href="/owner/fleet" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-slate focus:text-brand-slate active:text-brand-slate">
                    <BusFront className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Fleet</span>
                </Link>
                <Link href="/owner/settings" className="flex flex-col items-center justify-center w-full h-full text-brand-grey hover:text-brand-slate focus:text-brand-slate active:text-brand-slate">
                    <Settings className="w-6 h-6 mb-1" />
                    <span className="text-[10px] font-medium">Settings</span>
                </Link>
            </div>
        </div>
    );
}
