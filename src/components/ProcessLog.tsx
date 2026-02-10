'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, CheckCircle2, AlertCircle, Info } from 'lucide-react';

interface ProcessLogProps {
    logs: string[];
    isProcessing: boolean;
    onClose: () => void;
}

export function ProcessLog({ logs, isProcessing, onClose }: ProcessLogProps) {
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [logs]);

    if (logs.length === 0 && !isProcessing) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-24 left-6 right-6 z-[80] pointer-events-none"
        >
            <div className="max-w-md mx-auto pointer-events-auto">
                <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden">
                    <div className="bg-slate-800/50 px-5 py-3 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center gap-2">
                            <Terminal className="w-4 h-4 text-orange-500" />
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Process Logs</span>
                        </div>
                        {!isProcessing && (
                            <button
                                onClick={onClose}
                                className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-wider px-2 py-1 rounded-lg transition-colors"
                            >
                                Close
                            </button>
                        )}
                        {isProcessing && (
                            <div className="flex gap-1">
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse delay-75" />
                                <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse delay-150" />
                            </div>
                        )}
                    </div>

                    <div
                        ref={scrollRef}
                        className="p-5 max-h-[180px] overflow-y-auto font-mono text-[11px] leading-relaxed space-y-2 custom-scrollbar selection:bg-orange-500/30"
                    >
                        {logs.map((log, i) => {
                            const isError = log.includes('[ERROR]');
                            const isSuccess = log.includes('[SUCCESS]');
                            const isInfo = log.includes('[INFO]');

                            return (
                                <div key={i} className="flex gap-2">
                                    <span className="text-slate-600 shrink-0 select-none">›</span>
                                    <span className={`
                    ${isError ? 'text-red-400' : ''}
                    ${isSuccess ? 'text-emerald-400 font-bold' : ''}
                    ${isInfo ? 'text-blue-400' : ''}
                    {!isError && !isSuccess && !isInfo ? 'text-slate-300' : ''}
                  `}>
                                        {log}
                                    </span>
                                </div>
                            );
                        })}
                        {isProcessing && (
                            <div className="flex gap-2 items-center">
                                <span className="text-slate-600 shrink-0 animate-pulse">_</span>
                                <span className="text-slate-500 italic">Waiting for next step...</span>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
