'use client';

import React, { useState } from 'react';
import { BUILDINGS } from '@/lib/constants';
import { Building } from '@/types';
import { Search, X } from 'lucide-react';

interface BuildingSelectorProps {
    selectedBuilding: Building | null;
    onSelect: (building: Building) => void;
    buildings?: Building[];
}

export function BuildingSelector({ selectedBuilding, onSelect, buildings = BUILDINGS }: BuildingSelectorProps) {
    const [search, setSearch] = useState('');

    const filteredBuildings = buildings.filter(building =>
        building.name.toLowerCase().includes(search.toLowerCase()) ||
        building.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* iOS Style Search Bar */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    placeholder="Search building..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-200/50 border-none rounded-xl pl-9 pr-8 py-2 text-sm font-medium text-slate-900 outline-none focus:bg-slate-200/80 transition-all placeholder:text-slate-500"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 w-6 h-6 flex items-center justify-center bg-slate-400/50 text-white rounded-full active:scale-90 transition-all"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}
            </div>

            <div className="space-y-px rounded-2xl border border-slate-200/60 bg-white overflow-hidden shadow-sm">
                {filteredBuildings.length > 0 ? (
                    filteredBuildings.map((building, index) => {
                        const isSelected = selectedBuilding?.code === building.code;
                        return (
                            <button
                                key={`${building.code}-${building.name}`}
                                onClick={() => onSelect(building)}
                                className={`w-full text-left px-4 py-3.5 flex items-center justify-between transition-colors active:bg-slate-100 ${index !== 0 ? 'border-t border-slate-50' : ''
                                    } ${isSelected ? 'bg-orange-50/50' : ''}`}
                            >
                                <div className="flex items-center gap-3 min-w-0">
                                    <span className={`flex items-center justify-center w-8 h-8 rounded-lg font-black text-[10px] shrink-0 transition-colors ${isSelected ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400'
                                        }`}>
                                        {building.code}
                                    </span>
                                    <span className={`text-sm font-bold truncate ${isSelected ? 'text-orange-600' : 'text-slate-700'
                                        }`}>
                                        {building.name}
                                    </span>
                                </div>
                                {isSelected && (
                                    <div className="w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center shadow-lg shadow-orange-500/20">
                                        <div className="w-2 h-2 bg-white rounded-full" />
                                    </div>
                                )}
                            </button>
                        );
                    })
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center text-slate-400">
                        <Search className="w-8 h-8 mb-2 opacity-20" />
                        <p className="text-sm font-bold uppercase tracking-widest text-slate-500">No results found</p>
                        <p className="text-[10px] font-medium text-slate-400">Try a different building code or name</p>
                    </div>
                )}
            </div>
        </div>
    );
}
