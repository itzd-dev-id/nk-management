'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WORK_HIERARCHY } from '@/lib/constants';
import { Search, ChevronDown, Check, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBadgeColor } from '@/lib/utils';

interface WorkSelectorProps {
    value: string;
    onChange: (value: string) => void;
    hierarchy?: typeof WORK_HIERARCHY;
}

export function WorkSelector({ value, onChange, hierarchy = WORK_HIERARCHY }: WorkSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredHierarchy = (hierarchy as any[]).map(cat => ({
        ...cat,
        groups: cat.groups.map((group: any) => ({
            ...group,
            tasks: group.tasks.filter((task: string) =>
                task.toLowerCase().includes(search.toLowerCase()) ||
                group.name.toLowerCase().includes(search.toLowerCase()) ||
                cat.category.toLowerCase().includes(search.toLowerCase())
            )
        })).filter((group: any) => group.tasks.length > 0)
    })).filter(cat => cat.groups.length > 0);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={dropdownRef}>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Category & Work Name</label>
            <div
                className={`flex flex-col md:flex-row items-stretch md:items-center bg-slate-50 border rounded-2xl transition-all ${isOpen ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-sm' : 'border-slate-200'
                    }`}
            >
                {/* Dropdown Toggle & Display - NARROWED */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full md:w-48 flex items-center justify-between px-5 py-4 text-left border-b md:border-b-0 md:border-r border-slate-200 transition-colors hover:bg-slate-100/50 rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl"
                >
                    <div className="flex flex-col truncate">
                        {value ? (
                            <div className="flex flex-col">
                                <span className="text-[7px] text-slate-400 font-black uppercase tracking-widest leading-none mb-1">
                                    {value.split(' / ')[0]}
                                </span>
                                <div className="flex items-center gap-1.5">
                                    {value.split(' / ').length > 2 && (
                                        <span className={`px-1.5 py-0.5 rounded text-[8px] font-black uppercase tracking-tighter border ${getBadgeColor(value.split(' / ')[1])}`}>
                                            {value.split(' / ')[1]}
                                        </span>
                                    )}
                                    <span className="font-bold text-slate-800 truncate">
                                        {(value.split(' / ').pop() || '').replace(/_/g, ' ')}
                                    </span>
                                </div>
                            </div>
                        ) : (
                            <span className="font-bold text-slate-400">Select Work...</span>
                        )}
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Search Input Built-in - WIDER */}
                <div className="flex items-center px-4 py-3 md:py-0 flex-1 border-t md:border-t-0 border-slate-100">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Type to search (e.g. 'Galian' or 'Footplat')..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            if (!isOpen) setIsOpen(true);
                        }}
                        onFocus={() => setIsOpen(true)}
                        className="bg-transparent text-sm font-medium text-slate-600 outline-none w-full placeholder:text-slate-400"
                    />
                </div>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: -10, scaleY: 0.9, originY: 0 }}
                        animate={{ opacity: 1, y: 0, scaleY: 1 }}
                        exit={{ opacity: 0, y: -10, scaleY: 0.9 }}
                        transition={{ duration: 0.25, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute z-[60] w-full mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden"
                    >
                        <motion.div
                            initial="hidden"
                            animate="show"
                            variants={{
                                hidden: { opacity: 0 },
                                show: {
                                    opacity: 1,
                                    transition: { staggerChildren: 0.05 }
                                }
                            }}
                            className="max-h-[450px] overflow-y-auto custom-scrollbar"
                        >
                            {filteredHierarchy.length > 0 ? (
                                filteredHierarchy.map((cat) => (
                                    <motion.div
                                        key={cat.category}
                                        variants={{
                                            hidden: { opacity: 0, y: -10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                        className="border-b border-slate-100 last:border-0"
                                    >
                                        <div className="bg-slate-50/50 px-5 py-2 flex items-center gap-2 sticky top-0 z-10 backdrop-blur-sm border-b border-slate-100">
                                            <FolderOpen className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.category}</span>
                                        </div>
                                        <div className="py-2">
                                            {cat.groups.map((group: any) => (
                                                <div key={group.name} className="mb-2 last:mb-0">
                                                    <div className="px-5 py-1">
                                                        <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-wider border ${getBadgeColor(group.name)}`}>
                                                            {group.name}
                                                        </span>
                                                    </div>
                                                    <div className="space-y-0.5">
                                                        {group.tasks.map((task: string) => {
                                                            const fullName = `${cat.category} / ${group.name} / ${task}`;
                                                            const isSelected = value === fullName;
                                                            return (
                                                                <button
                                                                    key={task}
                                                                    onClick={() => {
                                                                        onChange(fullName);
                                                                        setIsOpen(false);
                                                                        setSearch('');
                                                                    }}
                                                                    className="w-full flex items-center justify-between px-10 py-2 hover:bg-orange-50 text-left transition-colors group"
                                                                >
                                                                    <span className={`text-sm font-medium ${isSelected ? 'text-orange-600' : 'text-slate-700'}`}>
                                                                        {task.replace(/_/g, ' ')}
                                                                    </span>
                                                                    {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </motion.div>
                                ))
                            ) : (
                                <motion.div
                                    variants={{
                                        hidden: { opacity: 0 },
                                        show: { opacity: 1 }
                                    }}
                                    className="px-5 py-8 text-center"
                                >
                                    <p className="text-sm text-slate-400 mb-2">Work not found</p>
                                    <button
                                        onClick={() => {
                                            onChange(`Custom / ${search}`);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className="text-xs font-bold text-orange-500 uppercase tracking-wider hover:underline"
                                    >
                                        Use "{search}" click here
                                    </button>
                                </motion.div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
