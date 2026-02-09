'use client';

import React, { useState, useRef, useEffect } from 'react';
import { WORK_HIERARCHY } from '@/lib/constants';
import { Search, ChevronDown, Check, FolderOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface WorkSelectorProps {
    value: string;
    onChange: (value: string) => void;
}

export function WorkSelector({ value, onChange }: WorkSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredHierarchy = WORK_HIERARCHY.map(group => ({
        ...group,
        tasks: group.tasks.filter(task =>
            task.toLowerCase().includes(search.toLowerCase()) ||
            group.category.toLowerCase().includes(search.toLowerCase())
        )
    })).filter(group => group.tasks.length > 0);

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
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Kategori & Nama Pekerjaan</label>
            <div
                className={`flex items-center bg-slate-50 border rounded-2xl transition-all ${isOpen ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-sm' : 'border-slate-200'
                    }`}
            >
                {/* Dropdown Toggle & Display - NARROWED */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-64 flex items-center justify-between px-5 py-4 text-left border-r border-slate-200 transition-colors hover:bg-slate-100/50 rounded-l-2xl"
                >
                    <div className="flex flex-col truncate">
                        <span className={`text-[10px] font-black uppercase tracking-tight ${value ? 'text-orange-500' : 'text-slate-400'}`}>
                            {value ? value.split(' / ')[0] : 'Kategori'}
                        </span>
                        <span className={`font-bold truncate ${value ? 'text-slate-800' : 'text-slate-400'}`}>
                            {value ? value.split(' / ')[1] || value : 'Pilih Pekerjaan...'}
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Search Input Built-in - WIDER */}
                <div className="flex items-center px-4 flex-1">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Cari kategori atau jenis pekerjaan..."
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
                            className="max-h-[400px] overflow-y-auto custom-scrollbar"
                        >
                            {filteredHierarchy.length > 0 ? (
                                filteredHierarchy.map((group) => (
                                    <motion.div
                                        key={group.category}
                                        variants={{
                                            hidden: { opacity: 0, y: -10 },
                                            show: { opacity: 1, y: 0 }
                                        }}
                                        className="border-b border-slate-100 last:border-0"
                                    >
                                        <div className="bg-slate-50/50 px-5 py-2 flex items-center gap-2">
                                            <FolderOpen className="w-3 h-3 text-slate-400" />
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{group.category}</span>
                                        </div>
                                        <div className="py-1">
                                            {group.tasks.map((task) => {
                                                const fullName = `${group.category} / ${task}`;
                                                const isSelected = value === fullName;
                                                return (
                                                    <button
                                                        key={task}
                                                        onClick={() => {
                                                            onChange(fullName);
                                                            setIsOpen(false);
                                                            setSearch('');
                                                        }}
                                                        className="w-full flex items-center justify-between px-8 py-2.5 hover:bg-orange-50 text-left transition-colors group"
                                                    >
                                                        <span className={`text-sm font-medium ${isSelected ? 'text-orange-600' : 'text-slate-700'}`}>
                                                            {task}
                                                        </span>
                                                        {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                                                    </button>
                                                );
                                            })}
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
                                    <p className="text-sm text-slate-400 mb-2">Pekerjaan tidak ditemukan</p>
                                    <button
                                        onClick={() => {
                                            onChange(`Custom / ${search}`);
                                            setIsOpen(false);
                                            setSearch('');
                                        }}
                                        className="text-xs font-bold text-orange-500 uppercase tracking-wider hover:underline"
                                    >
                                        Gunakan "{search}" klik di sini
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
