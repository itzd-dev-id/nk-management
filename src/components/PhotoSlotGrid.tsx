'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image as ImageIcon, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { getBadgeColor } from '@/lib/utils';

interface SlotData {
    id: number;
    file: File | null;
    keyword: string;
    detectedTask: string;
    detectedBuilding: { code: string; name: string } | null;
    previewName: string;
}

interface PhotoSlotGridProps {
    slots: SlotData[];
    onUpdateSlot: (id: number, data: Partial<SlotData>) => void;
    onRemoveFile: (id: number) => void;
    allHierarchy: { category: string; groups: { name: string; tasks: string[] }[] }[];
    allBuildings: { code: string; name: string; index?: number }[];
}

export function PhotoSlotGrid({ slots, onUpdateSlot, onRemoveFile, allHierarchy, allBuildings }: PhotoSlotGridProps) {
    return (
        <div className="grid grid-cols-2 gap-3 lg:gap-4">
            {slots.map((slot) => (
                <PhotoSlot
                    key={slot.id}
                    slot={slot}
                    onUpdate={(data) => onUpdateSlot(slot.id, data)}
                    onRemove={() => onRemoveFile(slot.id)}
                    allHierarchy={allHierarchy}
                    allBuildings={allBuildings}
                />
            ))}
        </div>
    );
}

function PhotoSlot({ slot, onUpdate, onRemove, allHierarchy, allBuildings }: { slot: SlotData; onUpdate: (data: Partial<SlotData>) => void; onRemove: () => void; allHierarchy: { category: string; groups: { name: string; tasks: string[] }[] }[]; allBuildings: { code: string; name: string; index?: number }[] }) {
    const [inputValue, setInputValue] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [showDropdown, setShowDropdown] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            if (acceptedFiles.length > 0) {
                onUpdate({ file: acceptedFiles[0] });
            }
        },
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
            'video/*': ['.mp4', '.mov', '.avi'],
            'application/pdf': ['.pdf'],
        },
        multiple: false
    });

    // Update suggestions when input changes
    useEffect(() => {
        if (inputValue.trim().length > 0) {
            const normalizedInput = inputValue.toLowerCase().replace(/_/g, ' ');
            const matches: string[] = [];

            // Search through building names first
            for (const building of allBuildings) {
                const buildingNameNormalized = building.name.toLowerCase();
                const buildingCodeNormalized = building.code.toLowerCase();
                const displayString = `[${building.code}] ${building.name}`;

                if ((buildingNameNormalized.includes(normalizedInput) || buildingCodeNormalized.includes(normalizedInput)) && !tags.includes(displayString)) {
                    matches.push(displayString);
                    if (matches.length >= 10) break;
                }
            }

            // Then search through all tasks
            if (matches.length < 10) {
                for (const cat of allHierarchy) {
                    const catNormalized = cat.category.toLowerCase().replace(/_/g, ' ');
                    for (const group of cat.groups) {
                        const groupNormalized = group.name.toLowerCase().replace(/_/g, ' ');
                        for (const task of group.tasks) {
                            const taskNormalized = task.toLowerCase().replace(/_/g, ' ');

                            // Search in category, group, and task names for better matching
                            const searchableText = `${catNormalized} ${groupNormalized} ${taskNormalized}`;

                            if (searchableText.includes(normalizedInput) && !tags.includes(task)) {
                                // Include hierarchy for visual context
                                matches.push(`${cat.category} / ${group.name} / ${task}`);
                                if (matches.length >= 10) break;
                            }
                        }
                        if (matches.length >= 10) break;
                    }
                    if (matches.length >= 10) break;
                }
            }

            setSuggestions(matches);
            setShowDropdown(matches.length > 0);
            setSelectedIndex(0);
        } else {
            setSuggestions([]);
            setShowDropdown(false);
        }
    }, [inputValue, allHierarchy, allBuildings, tags]);

    // Initialize tags from slot.keyword on mount or when it changes externally
    useEffect(() => {
        if (slot.keyword && slot.keyword.trim()) {
            const rawTags = slot.keyword.split(',').map(t => t.trim()).filter(Boolean);

            // Map raw tags to [Code] Name if they match a building
            const mappedTags = rawTags.map(tag => {
                // Check if it's already in [Code] Name format
                if (tag.startsWith('[') && tag.includes(']')) return tag;

                const b = allBuildings.find(b => b.code.toLowerCase() === tag.toLowerCase() || b.name.toLowerCase() === tag.toLowerCase());
                if (b) return `[${b.code}] ${b.name}`;
                return tag;
            });

            if (JSON.stringify(mappedTags) !== JSON.stringify(tags)) {
                setTags(mappedTags);
            }
        } else if (!slot.keyword && tags.length > 0) {
            setTags([]);
        }
    }, [slot.keyword, allBuildings]);

    // Update parent keyword when tags change
    useEffect(() => {
        // Extract just the code or name for the backend keyword string
        // Actually, we should probably send the full string or just the code?
        // Let's send the full string but sanitize it if needed.
        // Actually, the API route uses the keyword to detect buildings.
        // If we send "[A] Rusun Guru", the detectBuildingFromKeyword might need adjustment.
        const newKeyword = tags.join(', ');
        if (newKeyword !== slot.keyword) {
            onUpdate({ keyword: newKeyword });
        }
    }, [tags]);

    const addTag = (tag: string) => {
        if (tag.includes(' / ')) {
            const parts = tag.split(' / ');
            const groupName = parts[1];
            const taskName = parts[parts.length - 1];

            // Add both group and task (if unique)
            const newTags = [...tags];
            if (!newTags.includes(groupName)) newTags.push(groupName);
            const cleanTaskName = taskName.replace(/_/g, ' ');
            if (!newTags.includes(cleanTaskName)) newTags.push(cleanTaskName);

            setTags(newTags);
        } else {
            if (tag && !tags.includes(tag)) {
                setTags([...tags, tag]);
            }
        }
        setInputValue('');
        setSuggestions([]);
        setShowDropdown(false);
        inputRef.current?.focus();
    };

    const removeTag = (index: number) => {
        setTags(tags.filter((_, i) => i !== index));
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            e.preventDefault();
            if (showDropdown && suggestions.length > 0) {
                addTag(suggestions[selectedIndex]);
            } else if (inputValue.trim()) {
                addTag(inputValue.trim());
            }
        } else if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev + 1) % suggestions.length);
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
        } else if (e.key === 'Escape') {
            setShowDropdown(false);
        } else if (e.key === 'Backspace' && !inputValue && tags.length > 0) {
            removeTag(tags.length - 1);
        }
    };

    return (
        <div className="space-y-2">
            <div
                {...getRootProps()}
                className={`relative aspect-square border-2 border-dashed rounded-3xl flex flex-col items-center justify-center transition-all overflow-hidden ${isDragActive ? 'border-orange-500 bg-orange-50' : 'border-slate-200 bg-white hover:border-orange-200'} ${slot.file ? 'border-none' : ''}`}
            >
                <input {...getInputProps()} />

                {/* Slot Number Indicator */}
                <div className="absolute top-3 left-3 w-6 h-6 bg-slate-900/10 backdrop-blur-md rounded-lg flex items-center justify-center z-20">
                    <span className="text-[10px] font-black text-slate-900">{slot.id}</span>
                </div>

                {/* Smart Badges - Bottom Left */}
                <div className="absolute bottom-3 left-3 flex flex-col items-start gap-1 z-20 w-auto pointer-events-none">
                    <AnimatePresence mode="popLayout">
                        {slot.detectedBuilding && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                className="px-2 py-0.5 bg-orange-500 text-white rounded-lg flex items-center shadow-md border border-white/20"
                            >
                                <span className="text-[9px] font-black tracking-tight">{slot.detectedBuilding.name}</span>
                            </motion.div>
                        )}
                        {slot.detectedTask && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8, x: -10 }}
                                animate={{ opacity: 1, scale: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.8, x: -10 }}
                                className={`px-2 py-1 rounded-xl flex flex-col shadow-md border border-white/20 min-w-0 ${slot.detectedTask.includes(' / ') ? getBadgeColor(slot.detectedTask.split(' / ')[1]) : 'bg-emerald-500 text-white'}`}
                            >
                                {slot.detectedTask.includes(' / ') && (
                                    <span className="text-[7px] font-black uppercase tracking-tighter opacity-70 leading-none mb-0.5 truncate">
                                        {slot.detectedTask.split(' / ')[1]}
                                    </span>
                                )}
                                <span className={`text-[9px] font-bold tracking-tight truncate leading-tight ${!slot.detectedTask.includes(' / ') ? 'text-white' : ''}`}>
                                    {slot.detectedTask.split(' / ').pop()?.replace(/_/g, ' ')}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>
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
                            className="absolute bottom-3 right-3 p-1.5 bg-white/90 backdrop-blur-md rounded-xl text-red-500 shadow-sm active:scale-90 transition-transform z-10"
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

            {/* Keyword Input with Tags */}
            <div className="relative">
                <div className="min-h-[40px] bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 flex items-center gap-1.5 overflow-x-auto">
                    <Search className={`w-3 h-3 shrink-0 ${tags.length > 0 || inputValue ? 'text-orange-500' : 'text-slate-300'}`} />

                    {/* Tags - horizontal scrollable */}
                    <div className="flex items-center gap-1.5 shrink-0">
                        <AnimatePresence mode="popLayout">
                            {tags.map((tag, index) => {
                                // Check if this tag is a work task (green) or building/other (orange)
                                const isWorkTask = allHierarchy.some(cat =>
                                    cat.groups.some(group =>
                                        group.tasks.some(task =>
                                            task.toLowerCase() === tag.toLowerCase()
                                        )
                                    )
                                );

                                // Check if tag is a group name
                                const matchedGroup = allHierarchy.flatMap(cat => cat.groups).find(g => g.name.toLowerCase() === tag.toLowerCase());

                                // Check if this tag is a building [Code] Name format
                                const isBuilding = tag.startsWith('[') && tag.includes(']');

                                return (
                                    <motion.div
                                        key={tag}
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0, scale: 0.8 }}
                                        className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 whitespace-nowrap border ${matchedGroup
                                            ? getBadgeColor(matchedGroup.name)
                                            : isWorkTask
                                                ? 'bg-emerald-500 border-emerald-600 text-white'
                                                : 'bg-orange-500 border-orange-600 text-white'
                                            }`}
                                    >
                                        {isBuilding ? (
                                            <>
                                                <span className="bg-white/20 px-1 rounded text-[8px] font-black">{tag.match(/\[(.*?)\]/)?.[1]}</span>
                                                <span className="text-[9px] font-bold">{tag.split(']')[1].trim()}</span>
                                            </>
                                        ) : matchedGroup ? (
                                            <span className="text-[8px] font-black uppercase tracking-tighter">{matchedGroup.name}</span>
                                        ) : (
                                            <span className="text-[9px] font-bold">{tag.replace(/_/g, ' ')}</span>
                                        )}
                                        <button
                                            onClick={() => removeTag(index)}
                                            className={`${matchedGroup ? 'hover:bg-black/5' : 'hover:bg-white/20'} rounded p-0.5 transition-colors`}
                                        >
                                            <X className="w-2.5 h-2.5" />
                                        </button>
                                    </motion.div>
                                );
                            })}
                        </AnimatePresence>
                    </div>

                    {/* Input */}
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onFocus={() => inputValue && setSuggestions.length > 0 && setShowDropdown(true)}
                        onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                        placeholder={tags.length === 0 ? "Keyword (cth: direksi, beton)" : ""}
                        className="flex-1 min-w-[80px] bg-transparent border-none outline-none text-[10px] font-bold text-slate-700 placeholder:text-slate-300"
                    />
                </div>

                {/* Autocomplete Dropdown */}
                <AnimatePresence>
                    {showDropdown && suggestions.length > 0 && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg overflow-hidden z-50 max-h-[200px] overflow-y-auto"
                        >
                            {suggestions.map((suggestion, index) => {
                                const isBuildingSug = suggestion.startsWith('[') && suggestion.includes(']');
                                return (
                                    <button
                                        key={suggestion}
                                        onClick={() => addTag(suggestion)}
                                        className={`w-full px-3 py-2 text-left text-[10px] font-bold transition-colors flex items-center gap-2 ${index === selectedIndex
                                            ? 'bg-orange-50 text-orange-600'
                                            : 'text-slate-700 hover:bg-slate-50'
                                            }`}
                                    >
                                        {isBuildingSug ? (
                                            <>
                                                <span className="bg-slate-100 px-1.5 py-0.5 rounded text-[8px] font-black text-slate-500">{suggestion.match(/\[(.*?)\]/)?.[1]}</span>
                                                <span>{suggestion.split(']')[1].trim()}</span>
                                            </>
                                        ) : suggestion.includes(' / ') ? (
                                            <div className="flex items-center gap-2">
                                                <span className={`px-1.5 py-0.5 rounded-md text-[7px] font-black uppercase tracking-tighter shrink-0 border ${getBadgeColor(suggestion.split(' / ')[1], index === selectedIndex)}`}>
                                                    {suggestion.split(' / ')[1]}
                                                </span>
                                                <span className="truncate">{suggestion.split(' / ').pop()?.replace(/_/g, ' ')}</span>
                                            </div>
                                        ) : (
                                            suggestion.replace(/_/g, ' ')
                                        )}
                                    </button>
                                );
                            })}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Final Preview Info */}
            <div className="min-h-[16px] px-1">
                <AnimatePresence mode="wait">
                    {slot.previewName && (
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="text-[7px] font-medium text-slate-400 truncate tracking-tight break-all"
                        >
                            {slot.previewName}
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
