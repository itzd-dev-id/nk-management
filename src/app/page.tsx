'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BuildingSelector } from '@/components/BuildingSelector';
import { DropZone } from '@/components/DropZone';
import { FileList } from '@/components/FileList';
import { WorkSelector } from '@/components/WorkSelector';
import { Building, FileMetadata } from '@/types';
import { generateNewName, getFileExtension, getDefaultDate, detectBuildingFromKeyword } from '@/lib/utils';
import exifr from 'exifr';
import { FolderOpen, HardHat, Cog, LayoutDashboard, ChevronRight, Play, LogIn, LogOut, User, Check, Loader2, Trash2, XCircle, Info, Edit3, Save, Database } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn, signOut } from "next-auth/react";
import imageCompression from 'browser-image-compression';
import { BottomNav, TabId } from '@/components/BottomNav';
import { BUILDINGS, WORK_HIERARCHY } from '@/lib/constants';
import { ProcessLog } from '@/components/ProcessLog';
import { PhotoSlotGrid } from '@/components/PhotoSlotGrid';
import { detectWorkFromKeyword } from '@/lib/utils';

export interface SlotData {
  id: number;
  file: File | null;
  keyword: string;
  detectedTask: string;
  detectedBuilding: Building | null;
  previewName: string;
}

const INITIAL_SLOTS: SlotData[] = [
  { id: 1, file: null, keyword: '', detectedTask: '', detectedBuilding: null, previewName: '' },
  { id: 2, file: null, keyword: '', detectedTask: '', detectedBuilding: null, previewName: '' },
  { id: 3, file: null, keyword: '', detectedTask: '', detectedBuilding: null, previewName: '' },
  { id: 4, file: null, keyword: '', detectedTask: '', detectedBuilding: null, previewName: '' },
];

export default function Home() {
  const { data: session } = useSession() as any;

  // State
  const [activeTab, setActiveTab] = useState<TabId>('archive');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [workName, setWorkName] = useState('');
  const [progress, setProgress] = useState('');
  const [storageType, setStorageType] = useState<'local' | 'gdrive'>('local');
  const [outputPath, setOutputPath] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [slots, setSlots] = useState<SlotData[]>(INITIAL_SLOTS);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const skipNextSave = React.useRef(false);
  const [activeStep, setActiveStep] = useState<'building' | 'work' | 'upload'>('building');
  const [editingBuilding, setEditingBuilding] = useState<{ index: number; name: string } | null>(null);
  const [editingTask, setEditingTask] = useState<{ catIndex: number; taskIndex: number; name: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ index: number; name: string } | null>(null);
  const [buildingSearch, setBuildingSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);

  // Toast Helper
  const showToast = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Math.random().toString(36).substr(2, 9);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  }, []);

  // Handle Session Errors (e.g. Refresh Token Expired)
  useEffect(() => {
    if (session?.error === "RefreshAccessTokenError") {
      showToast("Sesi Google Drive telah habis. Silakan login kembali.", "error");
      signIn("google"); // Force re-login
    }
  }, [session, showToast]);

  const [processLogs, setProcessLogs] = useState<string[]>([]);
  const addLog = useCallback((message: string) => {
    const time = new Date().toLocaleTimeString('id-ID', { hour12: false });
    setProcessLogs(prev => [...prev, `[${time}] ${message}`]);
  }, []);

  // Unified Data State (Dynamic Database)
  const [allBuildings, setAllBuildings] = useState<Building[]>(BUILDINGS);
  const [allHierarchy, setAllHierarchy] = useState<{ category: string; tasks: string[] }[]>(WORK_HIERARCHY);

  // Update preview name for a specific slot
  const updateSlotPreview = useCallback((slotId: number, slot: SlotData) => {
    if (!slot.file || !selectedBuilding) return '';

    const ext = getFileExtension(slot.file.name);
    const dateStr = getDefaultDate();
    const task = slot.detectedTask || workName || 'Draft';

    return generateNewName(
      dateStr,
      task,
      selectedBuilding.name,
      selectedBuilding.code,
      progress,
      slot.id, // Use slot ID as sequence for now
      ext
    );
  }, [selectedBuilding, workName, progress]);

  // Handle slot updates
  const handleUpdateSlot = useCallback((id: number, data: Partial<SlotData>) => {
    setSlots(current => current.map(slot => {
      if (slot.id !== id) return slot;

      const updated = { ...slot, ...data };

      // If file or keyword changed, detect task AND building
      if (data.file || data.keyword !== undefined) {
        const searchTerms = [
          updated.keyword,
          updated.file?.name.split('.')[0] || ''
        ].filter(Boolean).join(' ');

        // Smart Building Detection (first pass to get detectedB for task logic)
        const detectedB_temp = detectBuildingFromKeyword(searchTerms, allBuildings);

        updated.detectedTask = detectWorkFromKeyword(
          searchTerms,
          allHierarchy,
          (detectedB_temp?.code === 'GL' || (!detectedB_temp && selectedBuilding?.code === 'GL')) ? 'Material On Site' : undefined
        );

        // Smart Building Detection (final assignment)
        const detectedB_new = detectBuildingFromKeyword(searchTerms, allBuildings);
        updated.detectedBuilding = detectedB_new;

        // Auto-select building if detected and none selected (or first slot)
        if (detectedB_new && (!selectedBuilding || id === 1)) {
          setSelectedBuilding(detectedB_new);
        }

        // Auto-select global Work Name if detected
        if (updated.detectedTask) {
          const category = allHierarchy.find(h => h.tasks.includes(updated.detectedTask))?.category;
          if (category) {
            const fullWorkName = `${category} / ${updated.detectedTask}`;
            // If global work is empty or we are on the first slot, update the global state
            if (!workName || id === 1 || workName === 'Work Name') {
              setWorkName(fullWorkName);
            }
          }
        }
      }

      // Update preview name
      updated.previewName = updateSlotPreview(id, updated);

      return updated;
    }));
  }, [allHierarchy, allBuildings, selectedBuilding, updateSlotPreview]);

  // Update all previews when global state changes
  useEffect(() => {
    setSlots(current => current.map(slot => ({
      ...slot,
      previewName: updateSlotPreview(slot.id, slot)
    })));
  }, [selectedBuilding, workName, progress, updateSlotPreview]);

  // Persistence
  useEffect(() => {
    const savedPath = localStorage.getItem('nk_output_path');
    const savedBuilding = localStorage.getItem('nk_selected_building');
    const savedStorageType = localStorage.getItem('nk_storage_type') as 'local' | 'gdrive';

    if (savedPath) setOutputPath(savedPath);
    if (savedBuilding) setSelectedBuilding(JSON.parse(savedBuilding));
    if (savedStorageType) setStorageType(savedStorageType);
  }, []);

  // Sync Config from Vercel KV
  const fetchConfig = useCallback(async (filename: string) => {
    try {
      const res = await fetch(`/api/config?filename=${filename}`);
      const { success, data } = await res.json();
      return success ? data : null;
    } catch (e) {
      console.error(`Failed to sync ${filename}`, e);
      return null;
    }
  }, []);

  const saveConfig = async (filename: string, data: any, message?: string) => {
    setIsSavingCloud(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename, data })
      });
      const resData = await res.json();
      if (resData.success && message) {
        showToast(message, 'success');
      }
    } catch (e) {
      console.error(`Failed to save ${filename}`, e);
      showToast(`Gagal menyimpan ${filename}`, 'error');
    } finally {
      setIsSavingCloud(false);
    }
  };

  const loadAllConfigs = useCallback(async () => {
    setIsSyncing(true);
    try {
      const bData = await fetchConfig('buildings.json');
      const wData = await fetchConfig('works.json');

      if (bData) {
        const sortedB = (bData as Building[]).map((b, idx) => ({
          ...b,
          index: b.index !== undefined ? b.index : idx
        })).sort((a, b) => (a.index || 0) - (b.index || 0));
        setAllBuildings(sortedB);
      } else {
        setAllBuildings(BUILDINGS);
      }

      if (wData) {
        setAllHierarchy(wData);
      } else {
        const sortedDefault = WORK_HIERARCHY
          .map(cat => ({ ...cat, tasks: [...cat.tasks].sort((a, b) => a.localeCompare(b)) }))
          .sort((a, b) => a.category.localeCompare(b.category));
        setAllHierarchy(sortedDefault);
      }

      skipNextSave.current = true;
      showToast('Database sinkron dengan Cloud', 'info');
    } catch (e) {
      console.error('Failed to load all configs', e);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchConfig]);

  // Separate saves for buildings and hierarchy
  useEffect(() => {
    if (skipNextSave.current) {
      // Handled by the next effect for reset
    } else {
      saveConfig('buildings.json', allBuildings);
    }
  }, [allBuildings]);

  useEffect(() => {
    if (skipNextSave.current) {
      skipNextSave.current = false;
    } else {
      saveConfig('works.json', allHierarchy);
    }
  }, [allHierarchy]);

  // Initial load
  useEffect(() => {
    loadAllConfigs();
  }, [loadAllConfigs]);

  // Re-sync when switching to settings tab
  useEffect(() => {
    if (activeTab === 'settings') {
      loadAllConfigs();
    }
  }, [activeTab, loadAllConfigs]);

  // UI helpers and other persistence
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
          f.file.type.startsWith('image/') ? 'jpg' : getFileExtension(f.originalName)
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
    setProcessLogs([]);
    addLog(`[INFO] Memulai proses pengarsipan untuk ${files.length} file...`);

    const updatedFiles = [...files];

    for (let i = 0; i < updatedFiles.length; i++) {
      const fileMeta = updatedFiles[i];
      if (fileMeta.status === 'success') continue;

      let fileToUpload = fileMeta.file;
      addLog(`[INFO] Memproses: ${fileMeta.originalName}`);

      // 1. Automatic Compression for Images
      if (fileMeta.file.type.startsWith('image/')) {
        setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'compressing' } : f));
        addLog(`[INFO] Mengompresi foto...`);

        try {
          const options = {
            maxSizeMB: 1.2,
            maxWidthOrHeight: 1920,
            useWebWorker: false,
            fileType: 'image/jpeg',
            preserveExif: true
          };
          const compressedBlob = await imageCompression(fileMeta.file, options);
          fileToUpload = new File([compressedBlob], fileMeta.originalName.replace(/\.[^/.]+$/, "") + ".jpg", {
            type: 'image/jpeg',
            lastModified: fileMeta.file.lastModified
          });
          addLog(`[INFO] Kompresi selesai (${(fileMeta.file.size / 1024 / 1024).toFixed(2)}MB -> ${(fileToUpload.size / 1024 / 1024).toFixed(2)}MB)`);
        } catch (error) {
          addLog(`[ERROR] Gagal kompresi: ${fileMeta.originalName}`);
        }
      }

      setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'processing' } : f));
      addLog(`[INFO] Mengunggah ke Google Drive...`);

      const formData = new FormData();
      formData.append('file', fileToUpload);
      formData.append('metadata', JSON.stringify({
        detectedDate: fileMeta.detectedDate,
        workName: fileMeta.workName,
        buildingCode: fileMeta.building.code,
        buildingName: fileMeta.building.name,
        buildingIndex: fileMeta.building.index,
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
          addLog(`[SUCCESS] Berhasil: ${result.finalName}`);
        } else {
          let errorMsg = result.error;
          if (result.details?.error?.message) {
            errorMsg = `${result.error}: ${result.details.error.message}`;
          }
          setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'error', error: errorMsg } : f));
          addLog(`[ERROR] Gagal: ${errorMsg}`);
        }
      } catch (e: any) {
        setFiles(prev => prev.map(f => f.id === fileMeta.id ? { ...f, status: 'error', error: 'Upload failed: ' + e.message } : f));
        addLog(`[ERROR] Gagal sistem: ${e.message}`);
      }
    }

    setIsProcessing(false);
    setSlots(INITIAL_SLOTS);
    addLog(`[SUCCESS] Seluruh proses selesai!`);
    showToast('Seluruh file berhasil diproses dan diarsipkan!', 'success');
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
            {activeTab === 'archive' && (selectedBuilding?.code || 'NK-POST')}
            {activeTab === 'edit' && 'EDIT DATABASE'}
            {activeTab === 'queue' && 'STATUS'}
            {activeTab === 'settings' && 'SETTINGS'}
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

              {/* Step 1: Location & Work */}
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden p-6 space-y-6">
                <BuildingSelector selectedBuilding={selectedBuilding} onSelect={setSelectedBuilding} buildings={allBuildings} />
                <WorkSelector value={workName} onChange={setWorkName} hierarchy={allHierarchy} />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Work Progress (%)</label>
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl py-4 flex items-center justify-center gap-1 group relative">
                      <span className="invisible absolute whitespace-pre text-2xl font-black px-1 min-w-[2ch]">
                        {progress || '0'}
                      </span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={progress}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, '');
                          if (val.length <= 3) setProgress(val);
                        }}
                        className="bg-transparent text-right text-2xl font-black text-slate-900 outline-none p-0 m-0 w-auto"
                        style={{ width: `${Math.max(progress.length, 1)}ch`, minWidth: '1ch' }}
                        placeholder="0"
                      />
                      <span className="text-lg font-black text-slate-400 mt-1">%</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center gap-1.5 pb-1">
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                      <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 text-center">Live Data</span>
                    </div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-tight text-center">
                      Actual Field<br />Progress Percentage
                    </p>
                  </div>
                </div>

                <PhotoSlotGrid
                  slots={slots}
                  onUpdateSlot={handleUpdateSlot}
                  onRemoveFile={(id) => handleUpdateSlot(id, { file: null, keyword: '', detectedTask: '', previewName: '' })}
                />
              </div>

              {slots.some(s => s.file) && (
                <button
                  onClick={async () => {
                    if (!selectedBuilding || !outputPath) {
                      showToast("Select building and set folder ID first", "error");
                      return;
                    }

                    // Convert occupied slots to FileMetadata
                    const newFilesToProcess: FileMetadata[] = await Promise.all(
                      slots
                        .filter(s => s.file)
                        .map(async (s) => {
                          let detectedDate = getDefaultDate();
                          if (s.file!.type.startsWith('image/')) {
                            try {
                              const exif = await exifr.parse(s.file!);
                              if (exif?.DateTimeOriginal) {
                                detectedDate = new Date(exif.DateTimeOriginal).toISOString().split('T')[0];
                              }
                            } catch (e) {
                              console.warn('Metadata skip', e);
                            }
                          }

                          return {
                            id: Math.random().toString(36).substring(7),
                            file: s.file!,
                            originalName: s.file!.name,
                            newName: s.previewName,
                            detectedDate,
                            status: 'pending' as const,
                            building: selectedBuilding,
                            workName: s.detectedTask || workName || 'Documentation',
                            progress: progress,
                            sequence: s.id
                          };
                        })
                    );

                    setFiles(newFilesToProcess);
                    // Defer execution slightly to ensure state is updated
                    setTimeout(() => processFiles(), 100);
                  }}
                  disabled={isProcessing || !selectedBuilding}
                  className="w-full bg-orange-500 text-white py-5 rounded-[2rem] font-black shadow-xl shadow-orange-500/30 flex items-center justify-center gap-3 active:scale-95 transition-all uppercase tracking-widest text-sm"
                >
                  {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                  {isProcessing ? 'Processing Slots...' : 'Process All Slots'}
                </button>
              )}

              {/* Naming Preview & Logs Section */}
              {(files.length > 0 || isProcessing || processLogs.length > 0) && (
                <div className="space-y-4">
                  {/* Preview Section */}
                  {files.length > 0 && !isProcessing && (
                    <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-3">
                      <div className="flex items-center gap-2 px-1">
                        <Info className="w-3.5 h-3.5 text-orange-500" />
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Naming Preview</span>
                      </div>
                      <div className="space-y-2">
                        {files.slice(0, 3).map((f, i) => (
                          <div key={i} className="bg-white border border-slate-100 rounded-xl px-4 py-2.5">
                            <p className="text-[10px] font-mono text-slate-400 truncate mb-0.5">{f.originalName}</p>
                            <p className="text-[11px] font-mono font-bold text-slate-800 break-all leading-tight">
                              {f.newName}
                            </p>
                          </div>
                        ))}
                        {files.length > 3 && (
                          <p className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-tight">
                            + {files.length - 3} more files in queue
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  <AnimatePresence>
                    {(isProcessing || processLogs.length > 0) && (
                      <ProcessLog
                        logs={processLogs}
                        isProcessing={isProcessing}
                        onClose={() => setProcessLogs([])}
                      />
                    )}
                  </AnimatePresence>
                </div>
              )}
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

          {activeTab === 'edit' && (
            <motion.div
              key="edit"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center pb-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Edit</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Manage Database Items</p>
              </div>

              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 space-y-8">
                {/* Manage Buildings Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage All Buildings</label>
                    <span className="text-[10px] font-bold text-slate-300 uppercase">{allBuildings.length} Items</span>
                  </div>

                  <div className="px-2">
                    <input
                      type="text"
                      placeholder="Search buildings..."
                      value={buildingSearch}
                      onChange={(e) => setBuildingSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-300"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="grid grid-cols-3 gap-2">
                      <input
                        id="new-building-code"
                        type="text"
                        placeholder="Code (ex: T02)"
                        defaultValue={(() => {
                          const last = allBuildings[allBuildings.length - 1];
                          if (!last) return 'A';
                          const code = last.code;
                          const match = code.match(/([A-Z]+)(\d*)/);
                          if (match) {
                            const letter = match[1];
                            const num = match[2];
                            if (num) {
                              return `${letter}${(parseInt(num) + 1).toString().padStart(num.length, '0')}`;
                            } else {
                              if (letter.length === 1 && letter !== 'Z') {
                                return String.fromCharCode(letter.charCodeAt(0) + 1);
                              }
                              return `${letter}01`;
                            }
                          }
                          return '';
                        })()}
                        className="bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        id="new-building-name"
                        type="text"
                        placeholder="Building Name"
                        className="col-span-2 bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      disabled={isSavingCloud}
                      onClick={() => {
                        const codeInput = document.getElementById('new-building-code') as HTMLInputElement;
                        const nameInput = document.getElementById('new-building-name') as HTMLInputElement;
                        if (codeInput.value && nameInput.value) {
                          const code = codeInput.value.toUpperCase();
                          if (allBuildings.some(b => b.code.toUpperCase() === code)) {
                            showToast(`Gedung dengan kode ${code} sudah ada!`, 'error');
                            return;
                          }
                          const newIndex = allBuildings.length > 0
                            ? Math.max(...allBuildings.map(b => b.index || 0)) + 1
                            : 0;
                          const newBuilding = { code, name: nameInput.value, index: newIndex };
                          const next = [...allBuildings, newBuilding].sort((a, b) => (a.index || 0) - (b.index || 0));
                          setAllBuildings(next);
                          showToast(`Gedung ${code} ditambahkan`, 'success');
                          const match = code.match(/([A-Z]+)(\d*)/);
                          if (match) {
                            const letter = match[1];
                            const num = match[2];
                            if (num) {
                              codeInput.value = `${letter}${(parseInt(num) + 1).toString().padStart(num.length, '0')}`;
                            } else if (letter.length === 1 && letter !== 'Z') {
                              codeInput.value = String.fromCharCode(letter.charCodeAt(0) + 1);
                            } else {
                              codeInput.value = '';
                            }
                          } else {
                            codeInput.value = '';
                          }
                          nameInput.value = '';
                        }
                      }}
                      className="w-full bg-slate-900 text-white py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingCloud ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {isSavingCloud ? 'Saving...' : 'Add New Building'}
                    </button>

                    <div className="pt-4 border-t border-slate-200 space-y-2 max-h-[300px] overflow-y-auto overflow-x-hidden pr-1">
                      {allBuildings
                        .filter(b =>
                          b.code.toLowerCase().includes(buildingSearch.toLowerCase()) ||
                          b.name.toLowerCase().includes(buildingSearch.toLowerCase())
                        )
                        .map((b, i) => (
                          <div key={i} className="flex items-center gap-3 bg-white px-3 py-2.5 rounded-xl border border-slate-100 min-w-0">
                            <div className="flex-1 flex items-center gap-2 min-w-0">
                              <span className="shrink-0 text-[9px] font-black bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{b.code}</span>
                              {editingBuilding?.index === i ? (
                                <input
                                  type="text"
                                  value={editingBuilding.name}
                                  onChange={(e) => setEditingBuilding({ ...editingBuilding, name: e.target.value })}
                                  autoFocus
                                  className="flex-1 min-w-0 bg-slate-50 border-none px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none rounded-lg"
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter') {
                                      const next = [...allBuildings];
                                      next[i].name = editingBuilding.name;
                                      setAllBuildings(next);
                                      setEditingBuilding(null);
                                      showToast(`Nama gedung ${b.code} diperbarui`, 'success');
                                    }
                                  }}
                                />
                              ) : (
                                <span className="text-xs font-bold text-slate-700 line-clamp-2 break-words leading-tight">{b.name}</span>
                              )}
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {editingBuilding?.index === i ? (
                                <>
                                  <button
                                    onClick={() => {
                                      const next = [...allBuildings];
                                      next[i].name = editingBuilding.name;
                                      setAllBuildings(next);
                                      setEditingBuilding(null);
                                      showToast(`Nama gedung ${b.code} diperbarui`, 'success');
                                    }}
                                    className="text-emerald-500 p-2"
                                  >
                                    <Save className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => setEditingBuilding(null)} className="text-slate-400 p-2">
                                    <XCircle className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => setEditingBuilding({ index: i, name: b.name })} className="text-slate-300 hover:text-orange-500 p-2 transition-colors">
                                    <Edit3 className="w-3.5 h-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (window.confirm(`Apakah Anda yakin ingin menghapus gedung "${b.name}"?`)) {
                                        setAllBuildings(allBuildings.filter((_, idx) => idx !== i));
                                        showToast(`Gedung ${b.name} dihapus`, 'info');
                                      }
                                    }}
                                    className="text-red-400 active:scale-90 p-2 opacity-30 hover:opacity-100 transition-opacity"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>

                {/* Manage Works Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Manage All Works</label>
                  </div>

                  <div className="px-2">
                    <input
                      type="text"
                      placeholder="Search tasks or categories..."
                      value={taskSearch}
                      onChange={(e) => setTaskSearch(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-2.5 text-xs font-bold text-slate-600 focus:outline-none focus:border-orange-500 transition-all placeholder:text-slate-300"
                    />
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="space-y-2">
                      <input
                        id="new-work-cat"
                        type="text"
                        placeholder="Category (ex: Arsitektur)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        id="new-work-task"
                        type="text"
                        placeholder="Task Name (ex: Cat Dinding)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      disabled={isSavingCloud}
                      onClick={() => {
                        const catInput = document.getElementById('new-work-cat') as HTMLInputElement;
                        const taskInput = document.getElementById('new-work-task') as HTMLInputElement;
                        if (catInput.value && taskInput.value) {
                          const next = [...allHierarchy];
                          const catName = catInput.value.trim();
                          const taskName = taskInput.value.trim().replace(/\s+/g, '_');
                          const existingCat = next.find(w => w.category.toLowerCase() === catName.toLowerCase());
                          if (existingCat) {
                            if (existingCat.tasks.some(t => t.toLowerCase() === taskName.toLowerCase())) {
                              showToast(`Pekerjaan "${taskInput.value}" sudah ada di kategori ini!`, 'error');
                              return;
                            }
                            existingCat.tasks = [...existingCat.tasks, taskName].sort((a, b) => a.localeCompare(b));
                          } else {
                            next.push({ category: catName, tasks: [taskName] });
                            next.sort((a, b) => a.category.localeCompare(b.category));
                          }
                          setAllHierarchy(next);
                          showToast(`Pekerjaan "${taskInput.value}" ditambahkan ke ${catName}`, 'success');
                          catInput.value = '';
                          taskInput.value = '';
                        }
                      }}
                      className="w-full bg-slate-200 text-slate-700 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      {isSavingCloud ? <Loader2 className="w-3 h-3 animate-spin" /> : null}
                      {isSavingCloud ? 'Saving Task...' : 'Add Work Task'}
                    </button>

                    <div className="pt-4 border-t border-slate-200 space-y-3 max-h-[400px] overflow-y-auto overflow-x-hidden pr-1">
                      {allHierarchy
                        .filter(w =>
                          w.category.toLowerCase().includes(taskSearch.toLowerCase()) ||
                          w.tasks.some(t => t.toLowerCase().includes(taskSearch.toLowerCase()))
                        )
                        .map((w, i) => (
                          <div key={i} className="space-y-1">
                            <div className="flex items-center justify-between px-2">
                              {editingCategory?.index === i ? (
                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                  <input
                                    type="text"
                                    value={editingCategory.name}
                                    onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                                    autoFocus
                                    className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[9px] font-black uppercase text-slate-900 focus:outline-none"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        const next = [...allHierarchy];
                                        next[i].category = editingCategory.name.trim();
                                        next.sort((a, b) => a.category.localeCompare(b.category));
                                        setAllHierarchy(next);
                                        setEditingCategory(null);
                                        showToast(`Kategori diperbarui`, 'success');
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const next = [...allHierarchy];
                                      next[i].category = editingCategory.name.trim();
                                      next.sort((a, b) => a.category.localeCompare(b.category));
                                      setAllHierarchy(next);
                                      setEditingCategory(null);
                                      showToast(`Kategori diperbarui`, 'success');
                                    }}
                                    className="text-emerald-500"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <>
                                  <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{w.category}</span>
                                  <button
                                    onClick={() => setEditingCategory({ index: i, name: w.category })}
                                    className="text-slate-300 hover:text-orange-500 px-1"
                                  >
                                    <Edit3 className="w-2.5 h-2.5" />
                                  </button>
                                </>
                              )}
                            </div>
                            <div className="space-y-1">
                              {w.tasks.map((t, ti) => (
                                <div key={ti} className="flex items-center gap-3 bg-white px-3 py-2.5 rounded-xl border border-slate-100 min-w-0">
                                  <div className="flex-1 min-w-0">
                                    {editingTask?.catIndex === i && editingTask?.taskIndex === ti ? (
                                      <input
                                        type="text"
                                        value={editingTask.name.replace(/_/g, ' ')}
                                        onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                                        autoFocus
                                        className="w-full bg-slate-50 border-none px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none rounded-lg"
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') {
                                            const next = [...allHierarchy];
                                            next[i].tasks[ti] = editingTask.name.replace(/\s+/g, '_');
                                            setAllHierarchy(next);
                                            setEditingTask(null);
                                            showToast(`Pekerjaan diperbarui`, 'success');
                                          }
                                        }}
                                      />
                                    ) : (
                                      <span className="text-xs font-bold text-slate-700 line-clamp-2 break-words leading-tight">{t.replace(/_/g, ' ')}</span>
                                    )}
                                  </div>
                                  <div className="flex items-center gap-1 shrink-0">
                                    {editingTask?.catIndex === i && editingTask?.taskIndex === ti ? (
                                      <>
                                        <button
                                          onClick={() => {
                                            const next = [...allHierarchy];
                                            next[i].tasks[ti] = editingTask.name.replace(/\s+/g, '_');
                                            setAllHierarchy(next);
                                            setEditingTask(null);
                                            showToast(`Pekerjaan diperbarui`, 'success');
                                          }}
                                          className="text-emerald-500 p-2"
                                        >
                                          <Save className="w-3.5 h-3.5" />
                                        </button>
                                        <button onClick={() => setEditingTask(null)} className="text-slate-400 p-2">
                                          <XCircle className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    ) : (
                                      <>
                                        <button onClick={() => setEditingTask({ catIndex: i, taskIndex: ti, name: t })} className="text-slate-300 hover:text-orange-500 p-2 transition-colors">
                                          <Edit3 className="w-3.5 h-3.5" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            if (window.confirm(`Apakah Anda yakin ingin menghapus tugas "${t}"?`)) {
                                              const next = [...allHierarchy];
                                              next[i].tasks = next[i].tasks.filter((_, idx) => idx !== ti);
                                              if (next[i].tasks.length === 0) {
                                                setAllHierarchy(next.filter((_, idx) => idx !== i));
                                              } else {
                                                setAllHierarchy(next);
                                              }
                                              showToast(`Tugas ${t} dihapus`, 'info');
                                            }
                                          }}
                                          className="text-red-400 active:scale-90 p-2 opacity-30 hover:opacity-100 transition-opacity"
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

            </motion.div>
          )}

          {activeTab === 'settings' && (
            <motion.div
              key="settings"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center pb-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Settings</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Global Configurations</p>
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
                        <p className="text-[10px] text-slate-400 truncate mb-1">{session.user?.email}</p>
                        <button onClick={() => signOut()} className="text-[10px] font-black text-orange-500 uppercase tracking-widest hover:underline">Sign Out</button>
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
                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed text-center">Data database (Gedung & Pekerjaan) akan otomatis tersimpan dalam folder Cloud ini.</p>
                  </div>
                </div>

                {/* Recommendations & Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-1">
                    <span className="text-xl font-black text-slate-900">{allBuildings.length}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Gedung</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-1">
                    <span className="text-xl font-black text-slate-900">{allHierarchy.reduce((acc, cat) => acc + cat.tasks.length, 0)}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Pekerjaan</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <button
                    onClick={() => {
                      loadAllConfigs();
                    }}
                    className="w-full flex items-center justify-between px-6 py-4 bg-white border border-slate-200 rounded-2xl active:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Database className="w-4 h-4 text-emerald-500" />
                      <div className="flex flex-col items-start translate-y-[1px]">
                        <span className="text-xs font-bold text-slate-700 leading-none">Sync Supabase Database</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                          <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600/70">Connected</span>
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>

                  <button className="w-full flex items-center justify-between px-6 py-4 bg-white border border-slate-200 rounded-2xl opacity-50 cursor-not-allowed">
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-slate-400" />
                      <span className="text-xs font-bold text-slate-500">System Documentation</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col items-center justify-center gap-4 pt-8 pb-4 opacity-40">
                <div className="flex items-center gap-2 grayscale">
                  <HardHat className="w-5 h-5" />
                  <span className="font-black tracking-widest text-base">NK-SYSTEMS</span>
                </div>
                <p className="text-slate-400 text-[10px] font-medium">Built for Construction Excellence</p>
              </div>

              <div className="flex flex-col items-center justify-center gap-2 py-4">
                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">NK-MANAGEMENT v3.0</p>
                <div className="h-1 w-10 bg-slate-200 rounded-full" />
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Toast Notifications */}
      <div className="fixed top-6 right-6 z-[100] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence>
          {toasts.map(toast => (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
              className={`
                pointer-events-auto flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md
                ${toast.type === 'success' ? 'bg-emerald-50/90 border-emerald-200 text-emerald-800' :
                  toast.type === 'error' ? 'bg-red-50/90 border-red-200 text-red-800' :
                    'bg-slate-900/90 border-slate-800 text-white'}
              `}
            >
              {toast.type === 'success' && <Check className="w-4 h-4" />}
              {toast.type === 'error' && <XCircle className="w-4 h-4" />}
              {toast.type === 'info' && <Info className="w-4 h-4" />}
              <span className="text-xs font-bold">{toast.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </main>
  );
}

