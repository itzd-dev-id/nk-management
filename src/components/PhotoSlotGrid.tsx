'use client';

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface SlotData {
    id: number;
    file: File | null;
    keyword: string;
    detectedTask: string;
    previewName: string;
}

interface PhotoSlotGridProps {
    slots: SlotData[];
    onUpdateSlot: (id: number, data: Partial<SlotData>) => void;
    onRemoveFile: (id: number) => void;
}

export function PhotoSlotGrid({ slots, onUpdateSlot, onRemoveFile }: PhotoSlotGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {slots.map((slot) => (
                <PhotoSlot
                    key={slot.id}
                    slot={slot}
                    onUpdate={(data) => onUpdateSlot(slot.id, data)}
                    onRemove={() => onRemoveFile(slot.id)}
                />
            ))}
        </div>
    );
}

function PhotoSlot({ slot, onUpdate, onRemove }: { slot: SlotData; onUpdate: (data: Partial<SlotData>) => void; onRemove: () => void }) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                onUpdate({ file: acceptedFiles[0] });
            }
        },
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
        },
        multiple: false
    });

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={`relative aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'} ${slot.file ? 'border-none' : ''}`}
            >
                <input {...getInputProps()} />

                {/* Slot Number Indicator */}
                <div className="absolute top-3 left-3 w-6 h-6 bg-slate-900/10 backdrop-blur-md rounded-lg flex items-center justify-center z-10">
                    <span className="text-[10px] font-black text-slate-900">{slot.id}</span>
                </div>

                {slot.file ? (
                    <>
                        <img
                            src={URL.createObjectURL(slot.file)}
                            alt={`Slot ${slot.id}`}
                            className="w-full h-full object-cover"
                        />
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                onRemove();
                            }}
                            className="absolute top-3 right-3 p-1.5 bg-white/90 backdrop-blur-md rounded-xl text-red-500 shadow-sm active:scale-90 transition-transform z-10"
                        >
                            <X className="w-3.5 h-3.5" />
                        </button>
                    </>
                ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-300">
                        <Upload className="w-6 h-6" />
                        <span className="text-[8px] font-black uppercase tracking-widest">Drop Photo</span>
                    </div>
                )}
            </div>

            {/* Keyword Input */}
            <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Search className={`w-3 h-3 ${slot.keyword ? 'text-orange-500' : 'text-slate-300'}`} />
                </div>
                <input
                    type="text"
                    value={slot.keyword}
                    onChange={(e) => onUpdate({ keyword: e.target.value })}
                    placeholder="Keyword / Detect..."
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-8 pr-3 py-2 text-[10px] font-bold text-slate-700 focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-300"
                />
            </div>

            {/* Final Preview & Detected Task */}
            <div className="min-h-[24px] px-1">
                <AnimatePresence mode="wait">
                    {slot.detectedTask ? (
                        <motion.div
                            key="detected"
                            initial={{ opacity: 0, y: 2 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-0.5"
                        >
                            <div className="flex items-center gap-1">
                                <span className="text-[8px] font-black text-emerald-500 uppercase">Match:</span>
                                <span className="text-[9px] font-bold text-slate-600 truncate">{slot.detectedTask.replace(/_/g, ' ')}</span>
                            </div>
                            <p className="text-[7px] font-medium text-slate-400 truncate tracking-tight break-all">
                                {slot.previewName}
                            </p>
                        </motion.div>
                    ) : slot.keyword ? (
                        <motion.p
                            key="no-match"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[8px] font-black text-slate-300 uppercase italic"
                        >
                            No match found...
                        </motion.p>
                    ) : null}
                </AnimatePresence>
            </div>
        </div>
    );
}
