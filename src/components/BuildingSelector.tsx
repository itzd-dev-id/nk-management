'use client';

import React, { useState, useRef, useEffect } from 'react';
import { BUILDINGS } from '@/lib/constants';
import { Building } from '@/types';
import { Search, ChevronDown, Check, Building as BuildingIcon, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface BuildingSelectorProps {
    selectedBuilding: Building | null;
    onSelect: (building: Building) => void;
    buildings?: Building[];
}

export function BuildingSelector({ selectedBuilding, onSelect, buildings = BUILDINGS }: BuildingSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState('');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const filteredBuildings = buildings.filter(building =>
        building.name.toLowerCase().includes(search.toLowerCase()) ||
        building.code.toLowerCase().includes(search.toLowerCase())
    );

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
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Project Location / Building</label>
            <div
                className={`flex flex-col md:flex-row items-stretch md:items-center bg-slate-50 border rounded-2xl transition-all ${isOpen ? 'border-orange-500 ring-2 ring-orange-500/20 shadow-sm' : 'border-slate-200'
                    }`}
            >
                {/* Dropdown Toggle & Display */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="w-full md:w-48 flex items-center justify-between px-5 py-4 text-left border-b md:border-b-0 md:border-r border-slate-200 transition-colors hover:bg-slate-100/50 rounded-t-2xl md:rounded-tr-none md:rounded-l-2xl"
                >
                    <div className="flex flex-col truncate">
                        <span className={`text-[10px] font-black uppercase tracking-tight ${selectedBuilding ? 'text-orange-500' : 'text-slate-400'}`}>
                            {selectedBuilding ? selectedBuilding.code : 'Location'}
                        </span>
                        <span className={`font-bold truncate ${selectedBuilding ? 'text-slate-800' : 'text-slate-400'}`}>
                            {selectedBuilding ? selectedBuilding.name : 'Select Building...'}
                        </span>
                    </div>
                    <ChevronDown className={`w-4 h-4 text-slate-400 shrink-0 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Search Input */}
                <div className="flex items-center px-4 py-3 md:py-0 flex-1 border-t md:border-t-0 border-slate-100">
                    <Search className="w-4 h-4 text-slate-400 mr-2" />
                    <input
                        type="text"
                        placeholder="Search by code or name..."
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
                        <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-2">
                            {filteredBuildings.length > 0 ? (
                                filteredBuildings.map((building) => {
                                    const isSelected = selectedBuilding?.code === building.code;
                                    return (
                                        <button
                                            key={building.code}
                                            onClick={() => {
                                                onSelect(building);
                                                setIsOpen(false);
                                                setSearch('');
                                            }}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-colors mb-1 last:mb-0 ${isSelected ? 'bg-orange-50 text-orange-600' : 'hover:bg-slate-50 text-slate-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                                                    {building.code}
                                                </div>
                                                <span className="text-sm font-bold">{building.name}</span>
                                            </div>
                                            {isSelected && <Check className="w-4 h-4 text-orange-500" />}
                                        </button>
                                    );
                                })
                            ) : (
                                <div className="py-8 text-center text-slate-400">
                                    <p className="text-xs font-bold uppercase tracking-widest mb-1">No Location Found</p>
                                    <p className="text-[10px]">Try another code or name</p>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
