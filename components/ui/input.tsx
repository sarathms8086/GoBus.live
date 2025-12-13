import * as React from "react";
import { cn } from "@/lib/utils";

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
    suffix?: React.ReactNode;
}


const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, type, label, error, suffix, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label className="text-xs font-bold text-brand-grey uppercase tracking-wider mb-1 block ml-4">
                        {label}
                    </label>
                )}
                <div className="relative">
                    <input
                        type={type}
                        className={cn(
                            "flex h-12 w-full rounded-2xl border border-gray-200 bg-white px-4 py-2 text-base font-medium text-brand-slate placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-green focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 transition-all",
                            error && "border-red-500 focus:ring-red-500",
                            suffix && "pr-12",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {suffix && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
                            {suffix}
                        </div>
                    )}
                </div>

                {error && (
                    <p className="text-xs text-red-500 mt-1 ml-4">{error}</p>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
