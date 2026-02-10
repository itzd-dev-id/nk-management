'use client';

import React, { useState } from 'react';
import { BUILDINGS, Building } from '@/lib/constants';
import { Search, X } from 'lucide-react';

interface BuildingSelectorProps {
    selectedBuilding: Building | null;
    onSelect: (building: Building) => void;
}

export function BuildingSelector({ selectedBuilding, onSelect }: BuildingSelectorProps) {
    const [search, setSearch] = useState('');

    const filteredBuildings = BUILDINGS.filter(building =>
        building.name.toLowerCase().includes(search.toLowerCase()) ||
        building.code.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800 tracking-tight">Pilih Gedung</h2>
            </div>

            {/* Search Input */}
            <div className="relative group">
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-orange-500 transition-colors">
                    <Search className="w-4 h-4" />
                </div>
                <input
                    type="text"
                    placeholder="Cari gedung atau kode..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-10 py-2.5 text-sm font-medium text-slate-700 outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-400"
                />
                {search && (
                    <button
                        onClick={() => setSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-all"
                    >
                        <X className="w-3.5 h-3.5" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[40vh] md:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {filteredBuildings.length > 0 ? (
                    filteredBuildings.map((building) => (
                        <button
                            key={`${building.code}-${building.name}`}
                            onClick={() => onSelect(building)}
                            className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 flex items-center gap-3 ${selectedBuilding?.code === building.code
                                ? 'bg-orange-50 border-orange-200 text-orange-900 shadow-sm ring-1 ring-orange-100'
                                : 'bg-white border-slate-100 text-slate-600 hover:border-orange-100 hover:bg-slate-50'
                                }`}
                        >
                            <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-orange-100 text-orange-600 font-bold text-xs shrink-0">
                                {building.code}
                            </span>
                            <span className="text-sm font-medium truncate">{building.name}</span>
                        </button>
                    ))
                ) : (
                    <div className="py-12 flex flex-col items-center justify-center text-center px-4">
                        <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 text-slate-300">
                            <Search className="w-6 h-6" />
                        </div>
                        <p className="text-sm font-semibold text-slate-500">Gedung tidak ditemukan</p>
                        <p className="text-[11px] text-slate-400 mt-1">Coba masukkan kode atau nama lain</p>
                    </div>
                )}
            </div>
        </div>
    );
}
