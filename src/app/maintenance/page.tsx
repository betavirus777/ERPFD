import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw, ServerOff } from "lucide-react";

export default function MaintenancePage() {
    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-white p-4">
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000" />
            </div>

            <div className="relative z-10 max-w-md w-full text-center space-y-8 backdrop-blur-sm bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl">
                <div className="flex justify-center">
                    <div className="relative">
                        <div className="absolute inset-0 bg-red-500/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative bg-gradient-to-b from-slate-800 to-slate-900 p-4 rounded-full border border-white/10 shadow-inner">
                            <ServerOff className="w-12 h-12 text-red-400" />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                        System Maintenance
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        We are currently experiencing connection issues with our database servers.
                        Our engineering team has been notified.
                    </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-200/80">
                        <span className="font-semibold text-red-400 block mb-1">Error Code: P1001</span>
                        Unable to reach database server. Please try again in a few minutes.
                    </div>
                </div>

                <div className="pt-4 flex flex-col gap-3">
                    <Button
                        asChild
                        className="w-full bg-white text-slate-900 hover:bg-slate-200 transition-all duration-300 font-semibold h-12 shadow-lg shadow-white/5"
                    >
                        <Link href="/">
                            <RefreshCw className="mr-2 w-4 h-4" />
                            Try Again
                        </Link>
                    </Button>

                    <div className="text-xs text-slate-500 pt-4">
                        If this persists, please contact support.
                    </div>
                </div>
            </div>
        </div>
    );
}
