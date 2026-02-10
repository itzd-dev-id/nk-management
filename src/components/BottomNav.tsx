'use client';

import React from 'react';
import { Archive, LayoutGrid, Clock, User, PlusCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export type TabId = 'archive' | 'queue' | 'buildings' | 'profile';

interface BottomNavProps {
    activeTab: TabId;
    onTabChange: (tab: TabId) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
    const tabs = [
        { id: 'archive', label: 'Arsip', icon: Archive },
        { id: 'buildings', label: 'Gedung', icon: LayoutGrid },
        { id: 'queue', label: 'Antrean', icon: Clock },
        { id: 'profile', label: 'Profil', icon: User },
    ] as const;

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-[100] bg-white/80 backdrop-blur-xl border-t border-slate-200/50 pb-safe-area-inset-bottom pt-2">
            <div className="max-w-md mx-auto grid grid-cols-4 h-16">
                {tabs.map((tab) => {
                    const Icon = tab.icon;
                    const isActive = activeTab === tab.id;

                    return (
                        <button
                            key={tab.id}
                            onClick={() => onTabChange(tab.id)}
                            className="relative flex flex-col items-center justify-center gap-1 group"
                        >
                            <div className={`relative flex items-center justify-center transition-all duration-300 ${isActive ? 'scale-110' : 'scale-100'}`}>
                                <Icon
                                    className={`w-6 h-6 transition-colors duration-300 ${isActive ? 'text-orange-500 fill-orange-500/10' : 'text-slate-400 group-active:text-slate-600'
                                        }`}
                                />
                                {isActive && (
                                    <motion.div
                                        layoutId="activeTabIndicator"
                                        className="absolute -inset-2 bg-orange-500/5 rounded-2xl -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                                    />
                                )}
                            </div>
                            <span className={`text-[10px] font-bold tracking-tight transition-colors duration-300 ${isActive ? 'text-orange-600' : 'text-slate-400'
                                }`}>
                                {tab.label}
                            </span>
                        </button>
                    );
                })}
            </div>
        </nav>
    );
}
