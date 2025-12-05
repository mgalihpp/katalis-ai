import { Toaster } from "@/components/ui/sonner";
import { VoiceProvider } from "@/context/VoiceContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <main className="max-w-lg mx-auto shadow-xl">
            <VoiceProvider>{children}</VoiceProvider>
            <Toaster richColors position="top-center" />
        </main>
    );
}   