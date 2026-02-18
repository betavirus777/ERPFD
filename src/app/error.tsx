'use client';

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ServerOff, RefreshCw, AlertCircle } from 'lucide-react';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Application Error caught:', error);
    }, [error]);

    const isDatabaseError =
        error.message?.includes('P1001') ||
        error.message?.includes('P1002') ||
        error.message?.includes('P1003') ||
        error.message?.includes('P1017') ||
        error.message?.includes('Can\'t reach database server') ||
        error.message?.includes('connect ECONNREFUSED');

    return (
        <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-4">
            <div className="relative z-10 max-w-md w-full text-center space-y-8 backdrop-blur-sm bg-white/5 p-8 rounded-2xl border border-white/10 shadow-2xl bg-slate-900 text-white">
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
                        {isDatabaseError ? 'Connection Issue' : 'Something went wrong!'}
                    </h1>
                    <p className="text-slate-400 text-lg leading-relaxed">
                        {isDatabaseError
                            ? 'We lost connection to the database. Please check your internet connection or try again later.'
                            : 'we encountered an unexpected error.'}
                    </p>
                </div>

                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 flex items-start gap-3 text-left">
                    <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                    <div className="text-sm text-red-200/80 break-words w-full">
                        <span className="font-semibold text-red-400 block mb-1">Details</span>
                        {error.message || 'Unknown error'}
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        onClick={() => reset()}
                        className="w-full bg-white text-slate-900 hover:bg-slate-200 transition-all duration-300 font-semibold h-12 shadow-lg shadow-white/5"
                    >
                        <RefreshCw className="mr-2 w-4 h-4" />
                        Try Again
                    </Button>
                </div>
            </div>
        </div>
    );
}
