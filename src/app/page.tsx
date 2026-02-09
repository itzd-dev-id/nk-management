'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BuildingSelector } from '@/components/BuildingSelector';
import { DropZone } from '@/components/DropZone';
import { FileList } from '@/components/FileList';
import { WorkSelector } from '@/components/WorkSelector';
import { Building, FileMetadata } from '@/types';
import { generateNewName, getFileExtension, getDefaultDate } from '@/lib/utils';
import exifr from 'exifr';
import { FolderOpen, HardHat, Cog, LayoutDashboard, ChevronRight, Play, LogIn, LogOut, User } from 'lucide-react';
import { motion } from 'framer-motion';
import { useSession, signIn, signOut } from "next-auth/react";

export default function Home() {
  const { data: session } = useSession();
  // State
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [workName, setWorkName] = useState('');
  const [progress, setProgress] = useState('10');
  const [storageType, setStorageType] = useState<'local' | 'gdrive'>('local');
  const [outputPath, setOutputPath] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Persistence
  useEffect(() => {
    const savedPath = localStorage.getItem('nk_output_path');
    const savedBuilding = localStorage.getItem('nk_selected_building');
    const savedStorageType = localStorage.getItem('nk_storage_type') as 'local' | 'gdrive';

    if (savedPath) setOutputPath(savedPath);
    if (savedBuilding) setSelectedBuilding(JSON.parse(savedBuilding));
    if (savedStorageType) setStorageType(savedStorageType);
  }, []);

  useEffect(() => {
    if (!outputPath) {
      setSaveStatus('idle');
      return;
    }

    setSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem('nk_output_path', outputPath);
      setSaveStatus('saved');

      const hideTimer = setTimeout(() => setSaveStatus('idle'), 2000);
      return () => clearTimeout(hideTimer);
    }, 600);

    return () => clearTimeout(timer);
  }, [outputPath]);

  useEffect(() => {
    if (storageType) localStorage.setItem('nk_storage_type', storageType);
  }, [storageType]);

  useEffect(() => {
    if (selectedBuilding) {
      localStorage.setItem('nk_selected_building', JSON.stringify(selectedBuilding));
    }
  }, [selectedBuilding]);

  // File Handlers
  const handleFilesAdded = useCallback(async (newFiles: File[]) => {
    const fileMetadatas: FileMetadata[] = await Promise.all(
      newFiles.map(async (file) => {
        let detectedDate = getDefaultDate();

        // Extract metadata based on type
        if (file.type.startsWith('image/')) {
          try {
            const exif = await exifr.parse(file);
            if (exif?.DateTimeOriginal) {
              const date = new Date(exif.DateTimeOriginal);
              detectedDate = date.toISOString().split('T')[0];
            }
          } catch (e) {
            console.warn('Failed to parse EXIF', e);
          }
        }

        const id = Math.random().toString(36).substring(7);
        const extension = getFileExtension(file.name);

        return {
          id,
          file,
          originalName: file.name,
          newName: '', // Calculated later
          detectedDate,
          status: 'pending',
          building: selectedBuilding || { code: '?-?', name: 'Pilih Gedung' },
          workName: workName || 'Nama Pekerjaan',
          progress,
          sequence: 1, // Default sequence, server will adjust
        };
      })
    );

    setFiles((prev) => [...prev, ...fileMetadatas]);
  }, [selectedBuilding, workName, progress]);

  // Update file metadata when global states change
  useEffect(() => {
    setFiles((prev) =>
      prev.map((f, index) => ({
        ...f,
        building: selectedBuilding || f.building,
        workName: workName || f.workName,
        progress: progress || f.progress,
        newName: generateNewName(
          f.detectedDate,
          workName || 'Pekerjaan',
          selectedBuilding?.name || 'Gedung',
          selectedBuilding?.code || 'X',
          progress,
          index + 1, // Visual preview index
          getFileExtension(f.originalName)
        )
      }))
    );
  }, [selectedBuilding, workName, progress]);

  const handleUpdateDate = (id: string, newDate: string) => {
    setFiles((prev) =>
      prev.map((f) => {
        if (f.id === id) {
          const extension = getFileExtension(f.originalName);
          return {
            ...f,
            detectedDate: newDate,
            newName: generateNewName(
              newDate,
              f.workName,
              f.building.name,
              f.building.code,
              f.progress,
              f.sequence,
              extension
            )
          };
        }
        return f;
      })
    );
  };

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const processFiles = async () => {
    if (!selectedBuilding || !workName || !outputPath) {
      alert('Pilih gedung, isi nama pekerjaan, dan tentukan folder output!');
      return;
    }

    setIsProcessing(true);

    // Process files one by one (or in batches)
    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const fileMeta = updatedFiles[i];

      // Vercel Limit Check
      if (fileMeta.file.size > 4.5 * 1024 * 1024) {
        setFiles(prev => prev.map(f => f.id === fileMeta.id ? {
          ...f,
          status: 'error',
          error: 'Ukuran file terlalu besar (> 4.5MB). Harap kompres atau kecilkan resolusi foto.'
        } : f));
        continue;
      }

      setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'processing' } : f));

      const formData = new FormData();
      formData.append('file', fileMeta.file);
      formData.append('metadata', JSON.stringify({
        detectedDate: fileMeta.detectedDate,
        workName: fileMeta.workName,
        buildingCode: fileMeta.building.code,
        buildingName: fileMeta.building.name,
        progress: fileMeta.progress,
        outputPath: outputPath,
      }));

      try {
        const response = await fetch('/api/process', {
          method: 'POST',
          body: formData,
        });

        const result = await response.json();

        if (result.success) {
          setFiles(prev => prev.map(f => f.id === fileMeta.id ? {
            ...f,
            status: 'success',
            newName: result.finalName || f.newName
          } : f));
        } else {
          let errorMsg = result.error;
          if (result.details?.error?.message) {
            errorMsg = `${result.error}: ${result.details.error.message}`;
          }
          setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'error', error: errorMsg } : f));
        }
      } catch (e: any) {
        setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'error', error: 'Upload failed: ' + e.message } : f));
      }
    }

    setIsProcessing(false);
  };

  return (
    <main className="min-h-screen bg-[#F8FAFC]">
      {/* Header */}
      <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50">
        <div className="max-w-[1600px] mx-auto px-8 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-orange-500 rounded-xl flex items-center justify-center shadow-lg transform rotate-3 hover:rotate-0 transition-transform cursor-pointer">
              <HardHat className="text-white w-7 h-7" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
                NK-MANAGEMENT <span className="text-[10px] bg-sky-500 px-1.5 py-0.5 rounded text-white font-bold tracking-widest uppercase">PRO</span>
              </h1>
              <p className="text-xs text-slate-400 font-medium">Sistem Pengarsipan Dokumentasi Konstruksi v2.0</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-4">
              {session ? (
                <div className="flex items-center gap-3 bg-slate-800/50 rounded-2xl pl-2 pr-4 py-1.5 border border-slate-700">
                  {session.user?.image ? (
                    <img src={session.user.image} alt="User" className="w-8 h-8 rounded-full border border-slate-600" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
                      <User className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black text-slate-200 leading-tight">{session.user?.name}</span>
                    <button onClick={() => signOut()} className="text-[8px] font-black text-slate-500 hover:text-orange-500 uppercase tracking-widest text-left">Logout</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => signIn('google')}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl border border-slate-700 transition-all text-xs font-bold"
                >
                  <LogIn className="w-4 h-4 text-orange-500" />
                  Login Google
                </button>
              )}
            </div>

            <div className="flex items-center gap-4 bg-slate-800/80 rounded-2xl px-5 py-2.5 border border-slate-700/50 hover:border-slate-600 transition-all">
              <div className="flex items-center gap-3 w-64">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">
                  G-Drive Folder ID:
                </span>
                <div className="relative w-full">
                  <input
                    type="text"
                    value={outputPath}
                    onChange={(e) => setOutputPath(e.target.value)}
                    placeholder="Masukkan Folder ID G-Drive"
                    className="bg-slate-900/50 border border-slate-700 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500 w-full pr-10"
                  />

                  <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center">
                    {saveStatus === 'saving' && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="w-3.5 h-3.5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin"
                      />
                    )}
                    {saveStatus === 'saved' && outputPath && (
                      <motion.div
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        className="flex items-center gap-1"
                      >
                        <div className="w-4 h-4 bg-green-500/20 rounded-full flex items-center justify-center border border-green-500/50">
                          <motion.svg
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="w-2.5 h-2.5 text-green-500"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                          >
                            <polyline points="20 6 9 17 4 12" />
                          </motion.svg>
                        </div>
                        <span className="text-[7px] font-black text-green-500 uppercase tracking-tighter">Saved</span>
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 hover:text-white cursor-pointer transition-colors border border-slate-700">
              <Cog className="w-5 h-5" />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-[1600px] mx-auto px-8 py-8 grid grid-cols-12 gap-8">
        {/* Sidebar */}
        <motion.aside
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="col-span-3"
        >
          <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm sticky top-28">
            <BuildingSelector selectedBuilding={selectedBuilding} onSelect={setSelectedBuilding} />
          </div>
        </motion.aside>

        {/* Main Content */}
        <section className="col-span-9 space-y-6">
          {/* Top Config Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-3xl border border-slate-200 p-8 shadow-sm"
          >
            <div className="grid grid-cols-12 gap-8 mb-8">
              <div className="col-span-8">
                <WorkSelector value={workName} onChange={setWorkName} />
              </div>
              <div className="col-span-4 h-full flex flex-col justify-end">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2 block">Progres & Milestone</label>
                <div className="grid grid-cols-5 gap-3 h-[74px]">
                  {/* Progress Input Frame - Bento 1 */}
                  <div className="col-span-2 relative group bg-slate-50 border border-slate-200 rounded-2xl transition-all hover:bg-slate-100/50 focus-within:ring-2 focus-within:ring-orange-500 focus-within:border-orange-500">
                    <div className="h-full flex items-center justify-center">
                      <div className="flex items-baseline gap-1">
                        <input
                          type="number"
                          min="0"
                          max="100"
                          value={progress}
                          onChange={(e) => setProgress(e.target.value)}
                          placeholder="0"
                          className="bg-transparent text-right text-3xl font-black text-slate-800 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                          style={{ width: `${Math.max(progress.toString().length || 1, 1)}ch` }}
                        />
                        <span className="text-3xl font-black text-slate-400">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Milestone Bento Grid */}
                  <div className="col-span-3 grid grid-cols-3 gap-1.5 h-full">
                    {['0', '25', '50', '75', '100'].map((val) => (
                      <button
                        key={val}
                        onClick={() => setProgress(val)}
                        className={`flex items-center justify-center text-[10px] font-black rounded-xl border transition-all ${progress === val ? 'bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20' : 'bg-white border-slate-200 text-slate-400 hover:border-orange-200 hover:text-orange-500'}`}
                      >
                        {val}%
                      </button>
                    ))}
                    <div className="bg-slate-50/50 border border-dashed border-slate-200 rounded-xl flex items-center justify-center opacity-40">
                      <div className="w-1 h-1 bg-slate-300 rounded-full" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <DropZone onFilesAdded={handleFilesAdded} fileCount={files.length} />
          </motion.div>

          {/* Action Header */}
          {files.length > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex items-center justify-between pb-2 bg-[#F8FAFC]"
            >
              <div className="flex items-center gap-3">
                <div className="bg-orange-100 text-orange-600 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-tight">
                  Queue: {files.length} Files
                </div>
                {selectedBuilding && (
                  <div className="flex items-center gap-2 text-slate-400">
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-sm font-bold text-slate-600">{selectedBuilding.name} ({selectedBuilding.code})</span>
                  </div>
                )}
              </div>
              <motion.button
                whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(249, 115, 22, 0.3)" }}
                whileTap={{ scale: 0.98 }}
                onClick={processFiles}
                disabled={isProcessing || files.length === 0}
                className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white px-8 py-3.5 rounded-2xl font-black shadow-lg shadow-orange-500/20 transition-all flex items-center gap-3 uppercase tracking-wider text-sm"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" /> Sedang Memproses...
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5 fill-current" /> Mulai Pengarsipan
                  </>
                )}
              </motion.button>
            </motion.div>
          )}

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <FileList
              files={files}
              onRemove={removeFile}
              onUpdateDate={handleUpdateDate}
            />
          </motion.div>
        </section>
      </div>

      {/* Footer Branding */}
      <footer className="mt-20 border-t border-slate-200 py-12 px-8">
        <div className="max-w-[1600px] mx-auto flex flex-col items-center justify-center gap-4 text-center">
          <div className="flex items-center gap-2 grayscale brightness-50 opacity-30">
            <HardHat className="w-6 h-6" />
            <span className="font-black tracking-widest text-lg">NK-SYSTEMS</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">PT. Nindya Karya (Persero) - Built for Construction Excellence</p>
        </div>
      </footer>
    </main>
  );
}

function Loader2({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
  )
}
