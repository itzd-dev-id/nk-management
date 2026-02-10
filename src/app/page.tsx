'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BuildingSelector } from '@/components/BuildingSelector';
import { DropZone } from '@/components/DropZone';
import { FileList } from '@/components/FileList';
import { WorkSelector } from '@/components/WorkSelector';
import { Building, FileMetadata } from '@/types';
import { generateNewName, getFileExtension, getDefaultDate } from '@/lib/utils';
import exifr from 'exifr';
import { FolderOpen, HardHat, Cog, LayoutDashboard, ChevronRight, Play, LogIn, LogOut, User, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn, signOut } from "next-auth/react";
import imageCompression from 'browser-image-compression';
import { BottomNav, TabId } from '@/components/BottomNav';

export default function Home() {
  const { data: session } = useSession();
  // State
  const [activeTab, setActiveTab] = useState<TabId>('archive');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [workName, setWorkName] = useState('');
  const [progress, setProgress] = useState('10');
  const [storageType, setStorageType] = useState<'local' | 'gdrive'>('local');
  const [outputPath, setOutputPath] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeStep, setActiveStep] = useState<'building' | 'work' | 'upload'>('building');
  const [customBuildings, setCustomBuildings] = useState<Building[]>([]);
  const [customWorks, setCustomWorks] = useState<{ category: string; tasks: string[] }[]>([]);

  // Internal Data Merging
  const [mergedBuildings, setMergedBuildings] = useState<Building[]>([]);
  const [mergedHierarchy, setMergedHierarchy] = useState<{ category: string; tasks: string[] }[]>([]);

  // Persistence
  const savedPath = localStorage.getItem('nk_output_path');
  const savedBuilding = localStorage.getItem('nk_selected_building');
  const savedStorageType = localStorage.getItem('nk_storage_type') as 'local' | 'gdrive';
  const savedCustomBuildings = localStorage.getItem('nk_custom_buildings');
  const savedCustomWorks = localStorage.getItem('nk_custom_works');

  if (savedPath) setOutputPath(savedPath);
  if (savedBuilding) setSelectedBuilding(JSON.parse(savedBuilding));
  if (savedStorageType) setStorageType(savedStorageType);
  if (savedCustomBuildings) setCustomBuildings(JSON.parse(savedCustomBuildings));
  if (savedCustomWorks) setCustomWorks(JSON.parse(savedCustomWorks));
}, []);

// Update merged data whenever state changes
useEffect(() => {
  const { BUILDINGS, WORK_HIERARCHY } = require('@/lib/constants');
  setMergedBuildings([...BUILDINGS, ...customBuildings]);

  // Merge works: find existing categories or add new ones
  const newHierarchy = [...WORK_HIERARCHY];
  customWorks.forEach(custom => {
    const existing = newHierarchy.find(h => h.category === custom.category);
    if (existing) {
      existing.tasks = [...new Set([...existing.tasks, ...custom.tasks])];
    } else {
      newHierarchy.push(custom);
    }
  });
  setMergedHierarchy(newHierarchy);

  localStorage.setItem('nk_custom_buildings', JSON.stringify(customBuildings));
  localStorage.setItem('nk_custom_works', JSON.stringify(customWorks));
}, [customBuildings, customWorks]);

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
    if (activeStep === 'building') setActiveStep('work');
  }
}, [selectedBuilding]);

useEffect(() => {
  if (workName && activeStep === 'work') {
    setActiveStep('upload');
  }
}, [workName]);

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
        building: selectedBuilding || { code: '?-?', name: 'Select Building' },
        workName: workName || 'Work Name',
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
        workName || 'Work',
        selectedBuilding?.name || 'Building',
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
    alert('Select building, enter work name, and set output folder!');
    return;
  }

  setIsProcessing(true);

  const updatedFiles = [...files];

  for (let i = 0; i < updatedFiles.length; i++) {
    const fileMeta = updatedFiles[i];
    if (fileMeta.status === 'success') continue;

    let fileToUpload = fileMeta.file;

    // 1. Automatic Compression for Images
    if (fileMeta.file.type.startsWith('image/')) {
      setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'compressing' } : f));

      try {
        const options = {
          maxSizeMB: 1.2,
          maxWidthOrHeight: 1920,
          useWebWorker: true
        };
        fileToUpload = await imageCompression(fileMeta.file, options);
        console.log(`Compressed: ${fileMeta.file.size} -> ${fileToUpload.size}`);
      } catch (error) {
        console.error("Compression Error:", error);
        // Fallback to original if compression fails
      }
    }

    setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'processing' } : f));

    const formData = new FormData();
    formData.append('file', fileToUpload);
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
  <main className="min-h-dvh bg-[#F2F2F7] pb-24 relative overflow-x-hidden">
    {/* iOS Style Sticky Header */}
    <header className="sticky top-0 z-[90] bg-white/80 backdrop-blur-xl border-b border-slate-200/50 pt-safe-area-inset-top">
      <div className="px-6 py-4 flex items-center justify-between">
        <div className="w-10 h-10 flex items-center justify-start">
          <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
            <HardHat className="text-white w-5 h-5" />
          </div>
        </div>

        <h1 className="text-sm font-black tracking-widest text-slate-900 uppercase">
          {activeTab === 'archive' && (selectedBuilding?.code || 'NK-ARCHIVE')}
          {activeTab === 'buildings' && 'LOCATION'}
          {activeTab === 'queue' && 'STATUS'}
          {activeTab === 'profile' && 'SETTINGS'}
        </h1>

        <div className="w-10 h-10 flex items-center justify-end">
          {activeTab === 'archive' && files.length > 0 && (
            <div className="bg-orange-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-pulse">
              {files.length}
            </div>
          )}
          {activeTab !== 'archive' && (
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <LayoutDashboard className="w-4 h-4 text-slate-400" />
            </div>
          )}
        </div>
      </div>
    </header>

    <div className="max-w-md mx-auto px-5 py-6">
      <AnimatePresence mode="wait">
        {activeTab === 'archive' && (
          <motion.div
            key="archive"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center pb-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Post Archive</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Daily Construction Documentation</p>
            </div>

            {/* Step 2: Work & Progress */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
              <WorkSelector value={workName} onChange={setWorkName} hierarchy={mergedHierarchy} />

              <div className="space-y-4">
                <label className="text-xs font-black text-slate-400 uppercase tracking-widest block text-center">Work Progress (%)</label>
                <div className="bg-slate-50 border border-slate-200 rounded-3xl py-6 flex flex-col items-center justify-center gap-2">
                  <div className="flex items-baseline gap-1">
                    <input
                      type="number"
                      value={progress}
                      onChange={(e) => setProgress(e.target.value)}
                      className="bg-transparent text-center text-5xl font-black text-slate-900 w-32 outline-none"
                      placeholder="0"
                    />
                    <span className="text-2xl font-black text-slate-400">%</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Manual Input from Report</p>
                </div>
              </div>

              <DropZone onFilesAdded={handleFilesAdded} fileCount={files.length} />
            </div>

            {files.length > 0 && (
              <button
                onClick={processFiles}
                disabled={isProcessing}
                className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-sm"
              >
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                {isProcessing ? 'Processing...' : 'Start Archiving'}
              </button>
            )}
          </motion.div>
        )}

        {activeTab === 'buildings' && (
          <motion.div
            key="buildings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center pb-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Location</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Building / Project Location</p>
            </div>
            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6">
              <BuildingSelector selectedBuilding={selectedBuilding} onSelect={setSelectedBuilding} buildings={mergedBuildings} />
            </div>
          </motion.div>
        )}

        {activeTab === 'queue' && (
          <motion.div
            key="queue"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center pb-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Status</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">{files.length} Items in Queue</p>
            </div>
            <FileList
              files={files}
              onRemove={removeFile}
              onUpdateDate={handleUpdateDate}
            />
          </motion.div>
        )}

        {activeTab === 'profile' && (
          <motion.div
            key="profile"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            <div className="space-y-2 text-center pb-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h2>
              <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Account & Configuration</p>
            </div>

            <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 space-y-8">
              {/* User Section */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Connected Account</label>
                {session ? (
                  <div className="flex items-center gap-4 p-4 bg-slate-50 border border-slate-200 rounded-3xl">
                    {session.user?.image ? (
                      <img src={session.user.image} alt="User" className="w-12 h-12 rounded-full border-2 border-white shadow-sm" />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-slate-200 flex items-center justify-center">
                        <User className="w-6 h-6 text-slate-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-black text-slate-900 leading-tight truncate">{session.user?.name}</p>
                      <button onClick={() => signOut()} className="text-[10px] font-black text-orange-500 uppercase tracking-widest">Sign Out</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => signIn('google')}
                    className="w-full flex items-center justify-center gap-3 bg-slate-900 text-white py-4 rounded-3xl font-black text-xs shadow-lg active:scale-95 transition-all uppercase tracking-widest"
                  >
                    <LogIn className="w-4 h-4 text-orange-500" />
                    Login with Google
                  </button>
                )}
              </div>

              {/* Storage Config */}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Destination Cloud Storage</label>
                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <div className="flex items-center gap-3 text-slate-400">
                    <FolderOpen className="w-5 h-5 text-orange-500" />
                    <span className="text-xs font-black uppercase tracking-tight text-slate-900">Google Drive Folder ID</span>
                  </div>
                  <div className="relative">
                    <input
                      type="text"
                      value={outputPath}
                      onChange={(e) => setOutputPath(e.target.value)}
                      placeholder="Enter Folder ID..."
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-300"
                    />
                    {saveStatus === 'saved' && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-green-500 bg-white pl-2">
                        <Check className="w-4 h-4" />
                        <span className="text-[9px] font-black uppercase">Saved</span>
                      </div>
                    )}
                  </div>
                  <p className="text-[10px] font-medium text-slate-400 leading-relaxed text-center">Data will be automatically saved to the cloud folder specified above.</p>
                </div>
              </div>

              {/* Manage Buildings Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Buildings</label>
                  <span className="text-[10px] font-bold text-slate-300 uppercase">{customBuildings.length} Added</span>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      id="new-building-code"
                      type="text"
                      placeholder="Code (ex: T02)"
                      className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500"
                    />
                    <input
                      id="new-building-name"
                      type="text"
                      placeholder="Building Name"
                      className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const codeInput = document.getElementById('new-building-code') as HTMLInputElement;
                      const nameInput = document.getElementById('new-building-name') as HTMLInputElement;
                      if (codeInput.value && nameInput.value) {
                        setCustomBuildings([...customBuildings, { code: codeInput.value, name: nameInput.value }]);
                        codeInput.value = '';
                        nameInput.value = '';
                      }
                    }}
                    className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Add New Building
                  </button>

                  {customBuildings.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 space-y-2">
                      {customBuildings.map((b, i) => (
                        <div key={i} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{b.code}</span>
                            <span className="text-xs font-bold text-slate-700">{b.name}</span>
                          </div>
                          <button onClick={() => setCustomBuildings(customBuildings.filter((_, idx) => idx !== i))} className="text-red-400 active:scale-90 px-2">
                            <Check className="w-3 h-3 rotate-45" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Manage Works Section */}
              <div className="space-y-4">
                <div className="flex items-center justify-between px-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manual Work Types</label>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                  <div className="space-y-2">
                    <input
                      id="new-work-cat"
                      type="text"
                      placeholder="Category (ex: Arsitektur)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-orange-500"
                    />
                    <input
                      id="new-work-task"
                      type="text"
                      placeholder="Task Name (ex: Cat Dinding)"
                      className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold focus:outline-none focus:border-orange-500"
                    />
                  </div>
                  <button
                    onClick={() => {
                      const catInput = document.getElementById('new-work-cat') as HTMLInputElement;
                      const taskInput = document.getElementById('new-work-task') as HTMLInputElement;
                      if (catInput.value && taskInput.value) {
                        const newCustomWorks = [...customWorks];
                        const existing = newCustomWorks.find(w => w.category === catInput.value);
                        if (existing) {
                          existing.tasks = [...new Set([...existing.tasks, taskInput.value])];
                        } else {
                          newCustomWorks.push({ category: catInput.value, tasks: [taskInput.value] });
                        }
                        setCustomWorks(newCustomWorks);
                        catInput.value = '';
                        taskInput.value = '';
                      }
                    }}
                    className="w-full bg-slate-200 text-slate-700 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all"
                  >
                    Add Work Task
                  </button>

                  {customWorks.length > 0 && (
                    <div className="pt-4 border-t border-slate-200 space-y-3">
                      {customWorks.map((w, i) => (
                        <div key={i} className="space-y-1">
                          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest px-2">{w.category}</span>
                          <div className="space-y-1">
                            {w.tasks.map((t, ti) => (
                              <div key={ti} className="flex items-center justify-between bg-white px-3 py-2 rounded-xl border border-slate-100">
                                <span className="text-xs font-bold text-slate-700">{t}</span>
                                <button onClick={() => {
                                  const next = [...customWorks];
                                  next[i].tasks = next[i].tasks.filter((_, idx) => idx !== ti);
                                  if (next[i].tasks.length === 0) {
                                    setCustomWorks(next.filter((_, idx) => idx !== i));
                                  } else {
                                    setCustomWorks(next);
                                  }
                                }} className="text-red-400 active:scale-90 px-2">
                                  <Check className="w-3 h-3 rotate-45" />
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center gap-4 py-8 opacity-40">
              <div className="flex items-center gap-2 grayscale">
                <HardHat className="w-5 h-5" />
                <span className="font-black tracking-widest text-base">NK-SYSTEMS</span>
              </div>
              <p className="text-slate-400 text-xs font-medium">Built for Construction Excellence</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>

    <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
  </main>
);
}

