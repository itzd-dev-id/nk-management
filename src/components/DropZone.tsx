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
            className={`group relative border-2 border-dashed rounded-3xl px-6 py-12 transition-all duration-500 cursor-pointer flex flex-col items-center justify-center text-center overflow-hidden ${isDragActive
                ? 'border-orange-500 bg-orange-50/50 scale-[0.99]'
                : 'border-slate-200 hover:border-orange-400 hover:bg-slate-50'
                }`}
        >
            <input {...getInputProps()} />

            {fileCount > 0 ? (
                <div className="w-20 h-20 bg-orange-500 rounded-3xl shadow-xl shadow-orange-500/20 flex items-center justify-center mb-6 ring-4 ring-white">
                    <div className="flex flex-col items-center text-white">
                        <span className="text-2xl font-black">{fileCount}</span>
                        <span className="text-[8px] font-black uppercase tracking-widest">Selected</span>
                    </div>
                </div>
            ) : (
                <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 mb-6 ${isDragActive ? 'bg-orange-100 text-orange-600 scale-110' : 'bg-slate-100 text-slate-400 group-hover:bg-orange-100 group-hover:text-orange-500'
                    }`}>
                    <Upload className="w-8 h-8" />
                </div>
            )}

            <h3 className="text-lg font-black text-slate-900 mb-1">
                {isDragActive ? 'Lepaskan file' : fileCount > 0 ? 'Tambah Dokumen' : 'Mulai Upload'}
            </h3>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-tight max-w-[200px]">
                {fileCount > 0
                    ? `Klik di sini untuk menambah file ke antrean ini.`
                    : 'Tarik foto, video, atau PDF di sini.'}
            </p>

            <div className="mt-8 flex gap-6 text-slate-300">
                <ImageIcon className="w-4 h-4" />
                <Video className="w-4 h-4" />
                <FileText className="w-4 h-4" />
            </div>
        </div>
    );
}
