import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface LoadingScreenProps {
    message?: string;
    className?: string;
    variant?: "fullscreen" | "inline";
}

export function LoadingScreen({
    message = "Memuat...",
    className,
    variant = "fullscreen"
}: LoadingScreenProps) {
    const containerClasses = variant === "fullscreen"
        ? "fixed inset-0 z-50 flex flex-col items-center justify-center bg-background"
        : "flex flex-col items-center justify-center p-8";

    return (
        <div className={cn(containerClasses, className)}>
            <div className="flex flex-col items-center gap-4">
                {/* Animated logo/spinner container */}
                <div className="relative">
                    {/* Outer ring */}
                    <div className="absolute inset-0 rounded-full border-4 border-primary/20 animate-pulse" />

                    {/* Spinning ring */}
                    <div className="w-16 h-16 rounded-full border-4 border-transparent border-t-primary animate-spin" />

                    {/* Inner icon */}
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" style={{ animationDirection: "reverse" }} />
                    </div>
                </div>

                {/* Loading text */}
                <div className="flex flex-col items-center gap-2">
                    <p className="text-sm font-medium text-foreground animate-pulse">
                        {message}
                    </p>
                    <div className="flex gap-1">
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "0ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "150ms" }} />
                        <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: "300ms" }} />
                    </div>
                </div>
            </div>
        </div>
    );
}
