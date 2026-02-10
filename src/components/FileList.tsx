'use client';

import React from 'react';
import { FileMetadata } from '@/types';
import { CheckCircle2, Circle, XCircle, Loader2, Calendar, FileType, Check } from 'lucide-react';

interface FileListProps {
    files: FileMetadata[];
    onRemove: (id: string) => void;
    onUpdateDate: (id: string, date: string) => void;
}

export function FileList({ files, onRemove, onUpdateDate }: FileListProps) {
    if (files.length === 0) return null;

    return (
        <div className="mt-8 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-slate-50/80 border-bottom border-slate-200">
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Original File</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">New Name (Preview)</th>
                            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-4"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {files.map((file) => (
                            <tr key={file.id} className="hover:bg-slate-50/50 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                            <FileType className="w-5 h-5" />
                                        </div>
                                        <div className="truncate max-w-[200px]">
                                            <p className="text-sm font-semibold text-slate-800 truncate">{file.originalName}</p>
                                            <p className="text-[11px] text-slate-400">{(file.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 w-fit">
                                        <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                        <input
                                            type="date"
                                            value={file.detectedDate}
                                            onChange={(e) => onUpdateDate(file.id, e.target.value)}
                                            className="bg-transparent text-sm font-medium text-slate-700 outline-none"
                                        />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="max-w-[300px]">
                                        <p className="text-xs font-mono bg-slate-900 text-orange-400 p-2 rounded-lg break-all leading-relaxed">
                                            {file.newName}
                                        </p>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <StatusBadge status={file.status} />
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={() => onRemove(file.id)}
                                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                    >
                                        <XCircle className="w-5 h-5" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-slate-100">
                {files.map((file) => (
                    <div key={file.id} className="p-4 space-y-4">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600 shrink-0">
                                    <FileType className="w-5 h-5" />
                                </div>
                                <div className="truncate max-w-[200px]">
                                    <p className="text-sm font-semibold text-slate-800 truncate">{file.originalName}</p>
                                    <p className="text-[11px] text-slate-400">{(file.file.size / (1024 * 1024)).toFixed(2)} MB</p>
                                </div>
                            </div>
                            <button
                                onClick={() => onRemove(file.id)}
                                className="p-2 text-slate-400 hover:text-red-500"
                            >
                                <XCircle className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal Deteksi</label>
                            <div className="flex items-center gap-2 bg-slate-100 border border-slate-200 rounded-lg px-3 py-1.5 w-full">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <input
                                    type="date"
                                    value={file.detectedDate}
                                    onChange={(e) => onUpdateDate(file.id, e.target.value)}
                                    className="bg-transparent text-sm font-medium text-slate-700 outline-none w-full"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">New Name (Preview)</label>
                            <p className="text-[10px] font-mono bg-slate-900 text-orange-400 p-3 rounded-lg break-all leading-normal">
                                {file.newName}
                            </p>
                        </div>

                        <div className="flex items-center justify-between pt-2">
                            <StatusBadge status={file.status} />
                            {file.error && (
                                <span className="text-[10px] text-red-500 font-medium max-w-[150px] truncate">{file.error}</span>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

function StatusBadge({ status }: { status: FileMetadata['status'] }) {
    switch (status) {
        case 'pending':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-slate-100 text-slate-500">
                    <Circle className="w-3 h-3" /> Ready
                </span>
            );
        case 'compressing':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-sky-100 text-sky-600">
                    <Loader2 className="w-3 h-3 animate-pulse" /> Compressing
                </span>
            );
        case 'processing':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-orange-100 text-orange-600">
                    <Loader2 className="w-3 h-3 animate-spin" /> Uploading
                </span>
            );
        case 'success':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-green-100 text-green-700">
                    <CheckCircle2 className="w-3 h-3" /> Success
                </span>
            );
        case 'error':
            return (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wide bg-red-100 text-red-600">
                    <XCircle className="w-3 h-3" /> Failed
                </span>
            );
    }
}
