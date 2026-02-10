'use client';

import React from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, Image as ImageIcon, Video } from 'lucide-react';

interface DropZoneProps {
    onFilesAdded: (files: File[]) => void;
    fileCount: number;
}

export function DropZone({ onFilesAdded, fileCount }: DropZoneProps) {
    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop: (acceptedFiles) => {
            onFilesAdded(acceptedFiles);
        },
        accept: {
            'image/*': ['.jpeg', '.jpg', '.png', '.webp'],
            'video/*': ['.mp4', '.mov', '.avi'],
            'application/pdf': ['.pdf'],
            'application/vnd.ms-powerpoint': ['.ppt'],
            'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
        },
    });

    return (
        <div
            {...getRootProps()}
            className={`group relative border-2 border-dashed rounded-3xl px-4 md:px-8 py-10 md:py-20 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden ${isDragActive
                ? 'border-orange-500 bg-orange-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-orange-400 hover:bg-orange-50/20'
                }`}
        >
            <input {...getInputProps()} />

            {/* Photo Stack Visual for Batch */}
            {fileCount > 0 ? (
                <div className="relative w-24 h-24 md:w-32 md:h-32 mb-8 group-hover:scale-110 transition-transform duration-500">
                    <div className="absolute inset-0 bg-white border-2 border-slate-200 rounded-3xl shadow-sm rotate-6 translate-x-4 translate-y-3 z-0" />
                    <div className="absolute inset-0 bg-white border-2 border-slate-200 rounded-3xl shadow-md -rotate-3 -translate-x-3 translate-y-2 z-10" />
                    <div className="absolute inset-0 bg-orange-500 border-4 border-white rounded-3xl shadow-xl z-20 flex items-center justify-center overflow-hidden">
                        <div className="flex flex-col items-center text-white">
                            <span className="text-2xl md:text-3xl font-black">{fileCount}</span>
                            <span className="text-[8px] md:text-[10px] font-bold uppercase tracking-widest">Files</span>
                        </div>
                        {/* Glossy overlay */}
                        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                    </div>
                </div>
            ) : (
                <div className={`w-16 h-16 md:w-20 md:h-20 rounded-[24px] md:rounded-3xl flex items-center justify-center transition-all duration-300 mb-6 ${isDragActive ? 'bg-orange-100 text-orange-600 scale-110 rotate-12' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500'
                    }`}>
                    <Upload className="w-8 h-8 md:w-10 md:h-10" />
                </div>
            )}

            <h3 className="text-lg md:text-xl font-bold text-slate-800 mb-2">
                {isDragActive ? 'Lepaskan file' : fileCount > 0 ? 'Tambah File Lagi' : 'Drag & Drop File Konstruksi'}
            </h3>
            <p className="text-slate-500 max-w-xs md:max-w-sm text-xs md:text-sm">
                {fileCount > 0
                    ? `Input lebih banyak file ke batch ini.`
                    : 'Tarik foto, video, atau PDF di sini.'}
            </p>

            <div className="mt-8 flex gap-8 text-slate-400">
                <div className="flex flex-col items-center gap-1.5">
                    <ImageIcon className="w-5 h-5 text-sky-500" />
                    <span className="text-[10px] uppercase tracking-tighter font-black">Photos</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <Video className="w-5 h-5 text-orange-500" />
                    <span className="text-[10px] uppercase tracking-tighter font-black">Videos</span>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                    <FileText className="w-5 h-5 text-emerald-500" />
                    <span className="text-[10px] uppercase tracking-tighter font-black">Docs</span>
                </div>
            </div>
        </div>
    );
}
