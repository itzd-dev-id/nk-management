'use client';

import React from 'react';
import { BUILDINGS, Building } from '@/lib/constants';

interface BuildingSelectorProps {
    selectedBuilding: Building | null;
    onSelect: (building: Building) => void;
}

export function BuildingSelector({ selectedBuilding, onSelect }: BuildingSelectorProps) {
    return (
        <div className="space-y-4">
            <h2 className="text-lg font-semibold text-slate-800">Pilih Gedung</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2 max-h-[40vh] md:max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
                {BUILDINGS.map((building) => (
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
                ))}
            </div>
        </div>
    );
}
