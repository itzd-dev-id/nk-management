'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { BuildingSelector } from '@/components/BuildingSelector';
import { DropZone } from '@/components/DropZone';
import { FileList } from '@/components/FileList';
import { WorkSelector } from '@/components/WorkSelector';
import { Building, FileMetadata } from '@/types';
import { generateNewName, getFileExtension, getDefaultDate, detectBuildingFromKeyword, formatDecimalMinutes, getDayNameIndo, detectWorkFromKeyword, getExifData, injectExif, createGpsExif, getBadgeColor } from '@/lib/utils';
import exifr from 'exifr';
import { FolderOpen, HardHat, Cog, LayoutDashboard, ChevronRight, ChevronDown, Play, LogIn, LogOut, User, Check, Loader2, Trash2, XCircle, Info, Edit3, Save, Database, PlusCircle, ClipboardList, Zap, FileIcon, UploadCloud, MapPin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signIn, signOut } from "next-auth/react";
import imageCompression from 'browser-image-compression';
import { BottomNav, TabId } from '@/components/BottomNav';
import { ProcessLog } from '@/components/ProcessLog';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(() => import('@/components/MapComponent'), {
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-slate-100 animate-pulse rounded-2xl flex items-center justify-center text-[10px] font-bold text-slate-400 mt-3">Loading Map...</div>
});




const fetchReverseGeocode = async (lat: number, lon: number): Promise<string> => {
  // Tier 1: BigDataCloud (Fast, keyless, very robust)
  try {
    const res = await fetch(`https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lon}&localityLanguage=id`);
    if (res.ok) {
      const data = await res.json();
      const area = data.locality || data.principalSubdivision || '';
      const city = data.city || '';
      const result = [area, city].filter(Boolean).join(', ');
      if (result) return result;
    }
  } catch (e: any) {
    console.warn("BigDataCloud failed:", e.message);
  }

  // Tier 2: Photon (by Komoot - Faster OSM search)
  try {
    const res = await fetch(`https://photon.komoot.io/reverse?lon=${lon}&lat=${lat}`);
    if (res.ok) {
      const data = await res.json();
      if (data.features && data.features.length > 0) {
        const p = data.features[0].properties;
        const area = p.district || p.locality || p.suburb || '';
        const city = p.city || p.county || '';
        const result = [area, city].filter(Boolean).join(', ');
        if (result) return result;
      }
    }
  } catch (e: any) {
    console.warn("Photon failed:", e.message);
  }

  // Tier 3: OpenStreetMap Nominatim (Standard)
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&accept-language=id`, {
      headers: { 'User-Agent': 'NK-Management-App/1.0' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data.address) {
        const area = data.address.suburb || data.address.village || data.address.hamlet || data.address.neighbourhood || '';
        const city = data.address.city || data.address.town || data.address.city_district || data.address.county || '';
        return [area, city].filter(Boolean).join(', ') || data.display_name || "Lokasi tidak ditemukan";
      }
    }
  } catch (e: any) {
    console.error("All geocoding sources failed:", e);
  }

  return "Lokasi tidak ditemukan (API Error)";
};

const processTimestampImage = async (
  file: File,
  addLog: (msg: string) => void
): Promise<File> => {
  addLog(`[INFO] Processing Timestamp for ${file.name}...`);

  try {
    // 1. Extract GPS & Date
    const buffer = await file.arrayBuffer();
    // Explicitly scan all possible metadata segments
    let exif = await exifr.parse(buffer, {
      gps: true,
      exif: true,
      tiff: true,
      xmp: true,
      jfif: true,
      iptc: true,
      mergeOutput: true
    });

    let lat = exif?.latitude;
    let lon = exif?.longitude;

    // TIER 2 GPS Extraction Fallback (Manual Key Check for raw arrays/strings)
    if (!lat || !lon) {
      const rawLat = exif?.GPSLatitude || exif?.['0x0002'];
      const rawLon = exif?.GPSLongitude || exif?.['0x0004'];

      if (rawLat && rawLon) {
        const parseCoord = (c: any) => {
          if (typeof c === 'number') return c;
          if (Array.isArray(c)) {
            // standard format: [degrees, minutes, seconds]
            return (c[0] || 0) + (c[1] || 0) / 60 + (c[2] || 0) / 3600;
          }
          return parseFloat(c);
        };

        lat = parseCoord(rawLat);
        lon = parseCoord(rawLon);

        const latRef = exif?.GPSLatitudeRef || exif?.['0x0001'];
        const lonRef = exif?.GPSLongitudeRef || exif?.['0x0003'];

        if (latRef === 'S' || latRef === 's') lat = -lat;
        if (lonRef === 'W' || lonRef === 'w') lon = -lon;

        if (lat && lon) {
          addLog(`[SUCCESS] Metadata lokasi ditemukan via Manual Key parsing!`);
        }
      }
    }

    // TIER 3 GPS Extraction Fallback (Specific GPS Helper)
    if (!lat || !lon) {
      try {
        const gpsOnly = await exifr.gps(buffer);
        if (gpsOnly?.latitude) {
          lat = gpsOnly.latitude;
          lon = gpsOnly.longitude;
          addLog(`[SUCCESS] Metadata lokasi ditemukan via GPS-Specific helper!`);
        }
      } catch (ge: any) {
        console.warn("GPS-Specific helper failed", ge);
      }
    }

    const dateObj = exif?.DateTimeOriginal ? new Date(exif.DateTimeOriginal.toString().replace(/:/g, '-')) : new Date();

    if (!lat || !lon) {
      const allKeys = Object.keys(exif || {}).join(', ');
      addLog(`[WARN] Data GPS tidak ditemukan di metadata ${file.name}.`);
      if (allKeys) {
        addLog(`[DEBUG] Keys ditemukan: ${allKeys.slice(0, 150)}...`);
      } else {
        addLog(`[DEBUG] Segment metadata terbaca kosong (Coba ambil foto ulang dengan GPS ON).`);
      }
    }

    // 2. Fetch Location (Nominatim)
    let address = "Lokasi tidak ditemukan";
    if (lat && lon) {
      addLog(`[INFO] Koordinat ditemukan: ${lat}, ${lon}. Mengambil nama lokasi...`);
      address = await fetchReverseGeocode(lat, lon);
      if (address.includes("API Error")) {
        addLog(`[ERROR] Gagal menghubungi OpenStreetMap.`);
      } else {
        addLog(`[SUCCESS] Lokasi ditemukan: ${address}`);
      }
    }

    // 3. Fetch Weather (Open-Meteo)
    let weather = "Cuaca tidak diketahui";
    if (lat && lon) {
      try {
        const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`);
        const data = await res.json();
        if (data.current_weather) {
          weather = `${data.current_weather.temperature}°C`;
        }
      } catch (e: any) {
        console.error("Weather error", e);
      }
    }

    // 4. Create Canvas
    const img = new Image();
    img.src = URL.createObjectURL(file);
    await new Promise((resolve) => (img.onload = resolve));

    const canvas = document.createElement('canvas');
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;

    // Draw original image
    ctx.drawImage(img, 0, 0);

    // Define scale based on image size
    const scale = canvas.width / 1500;
    const padding = 40 * scale;

    // DRAW LOGO (Top-Left)
    try {
      const logo = new Image();
      logo.src = '/logo.png';
      await new Promise((resolve) => {
        logo.onload = resolve;
        logo.onerror = resolve;
      });

      if (logo.complete && logo.naturalWidth > 0) {
        const logoHeight = 65 * scale; // Balanced visibility
        const logoWidth = (logo.naturalWidth / logo.naturalHeight) * logoHeight;
        const cornerRadius = 10 * scale;

        // Draw rounded background box
        ctx.beginPath();
        if (ctx.roundRect) {
          ctx.roundRect(padding - (8 * scale), padding - (8 * scale), logoWidth + (16 * scale), logoHeight + (16 * scale), cornerRadius);
        } else {
          // Fallback for older environments
          ctx.rect(padding - (8 * scale), padding - (8 * scale), logoWidth + (16 * scale), logoHeight + (16 * scale));
        }
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.fill();
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.05)';
        ctx.lineWidth = 1 * scale;
        ctx.stroke();

        ctx.drawImage(logo, padding, padding, logoWidth, logoHeight);
      }
    } catch (e: any) { }



    // DRAW OVERLAY BACKGROUND (Bottom Footer)
    const overlayHeight = 130 * scale; // Slightly taller for larger fonts
    const gradient = ctx.createLinearGradient(0, canvas.height - overlayHeight, 0, canvas.height);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
    gradient.addColorStop(0.5, 'rgba(0, 0, 0, 0.4)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, canvas.height - overlayHeight, canvas.width, overlayHeight);

    // DRAW INFORMATION (Single Horizontal Line with Drawn Dividers)
    const textXStart = padding;
    const textY = canvas.height - (overlayHeight / 2.2);
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';

    const drawDivider = (x: number) => {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
      ctx.lineWidth = 1 * scale;
      ctx.beginPath();
      ctx.moveTo(x, textY - (10 * scale));
      ctx.lineTo(x, textY + (10 * scale));
      ctx.stroke();
    };

    const gap = 24 * scale; // Breathable category gap

    // 1. Time
    const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    ctx.fillStyle = '#f97316'; // Orange
    ctx.font = `bold ${20 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(timeStr, textXStart, textY);
    let currentX = textXStart + ctx.measureText(timeStr).width + gap;

    // Divider 1
    drawDivider(currentX - (gap / 2));

    // 2. Day & Date 
    const dateStr = dateObj.toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' });
    const dayStr = getDayNameIndo(dateObj);
    const dayDateStr = `${dayStr}, ${dateStr}`;
    ctx.fillStyle = 'white';
    ctx.font = `bold ${20 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(dayDateStr, currentX, textY);
    currentX += ctx.measureText(dayDateStr).width + gap;

    // Divider 2
    drawDivider(currentX - (gap / 2));

    // 3. Location (Simplified)
    ctx.fillStyle = 'white';
    ctx.font = `bold ${20 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(address, currentX, textY);
    currentX += ctx.measureText(address).width + gap;

    // Divider 3
    drawDivider(currentX - (gap / 2));

    // 4. GPS
    const gpsStr = (lat && lon)
      ? `${formatDecimalMinutes(lat, true)} ${formatDecimalMinutes(lon, false)}`
      : 'GPS tidak tersedia';
    ctx.fillStyle = '#fbbf24'; // Yellow
    ctx.font = `bold ${20 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(gpsStr, currentX, textY);
    currentX += ctx.measureText(gpsStr).width + gap;

    // Divider 4
    drawDivider(currentX - (gap / 2));

    // 5. Weather
    ctx.fillStyle = 'white';
    ctx.font = `bold ${20 * scale}px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;
    ctx.fillText(weather, currentX, textY);

    // Convert back to File
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        if (!blob) return resolve(file);
        const newFile = new File([blob], file.name, { type: 'image/jpeg' });
        URL.revokeObjectURL(img.src);
        resolve(newFile);
      }, 'image/jpeg', 0.9);
    });
  } catch (err) {
    console.error("Timestamp processing failed", err);
    addLog(`[WARN] Terdapat kendala saat menambahkan timestamp. Menggunakan file asli.`);
    return file;
  }
};

export default function Home() {
  const { data: session } = useSession() as any;

  // State
  const [activeTab, setActiveTab] = useState<TabId>('archive');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [workName, setWorkName] = useState('');
  const [progress, setProgress] = useState('');
  const [selectedDate, setSelectedDate] = useState(getDefaultDate());
  const [useTimestamp, setUseTimestamp] = useState(false);
  const [storageType, setStorageType] = useState<'local' | 'gdrive'>('local');
  const [outputPath, setOutputPath] = useState('');
  const [terminPath, setTerminPath] = useState('');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [terminSaveStatus, setTerminSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [files, setFiles] = useState<FileMetadata[]>([]);
  const [postKeyword, setPostKeyword] = useState('');
  const [postTags, setPostTags] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const keywordInputRef = React.useRef<HTMLInputElement>(null);
  const [pendingPostFile, setPendingPostFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);

  const [isSavingCloud, setIsSavingCloud] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [activeStep, setActiveStep] = useState<'building' | 'work' | 'upload'>('building');
  const [editingBuilding, setEditingBuilding] = useState<{ index?: number, name: string } | null>(null);
  const [editingTask, setEditingTask] = useState<{ catIndex?: number, groupIndex?: number, taskIndex?: number, name: string } | null>(null);
  const [editingCategory, setEditingCategory] = useState<{ index?: number, name: string } | null>(null);
  const [buildingSearch, setBuildingSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [toasts, setToasts] = useState<{ id: string; message: string; type: 'success' | 'error' | 'info' }[]>([]);
  const [showBuildingIndex, setShowBuildingIndex] = useState(true);
  const [testLocation, setTestLocation] = useState<string | null>(null);
  const [testCoords, setTestCoords] = useState<{ lat: number; lon: number } | null>(null);
  const [isTestingLocation, setIsTestingLocation] = useState(false);

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

  // Unified Data State (Dynamic Database) - Load from Supabase only
  const [allBuildings, setAllBuildings] = useState<Building[]>([]);
  const [allHierarchy, setAllHierarchy] = useState<{ category: string; groups: { name: string; tasks: string[] }[] }[]>([]);

  // Persistence
  useEffect(() => {
    const savedPath = localStorage.getItem('nk_output_path');
    const savedTerminPath = localStorage.getItem('nk_termin_path');
    const savedStorageType = localStorage.getItem('nk_storage_type') as 'local' | 'gdrive';
    const savedShowIndex = localStorage.getItem('nk_show_building_index');
    const savedUseTimestamp = localStorage.getItem('nk_use_timestamp');

    if (savedPath) setOutputPath(savedPath);
    if (savedTerminPath) setTerminPath(savedTerminPath);
    if (savedStorageType) setStorageType(savedStorageType);
    if (savedShowIndex !== null) setShowBuildingIndex(savedShowIndex === 'true');
    if (savedUseTimestamp !== null) setUseTimestamp(savedUseTimestamp === 'true');
  }, []);

  // Keyword Suggestions Logic
  useEffect(() => {
    if (postKeyword.trim().length > 0) {
      const normalizedInput = postKeyword.toLowerCase().replace(/_/g, ' ');
      const matches: string[] = [];

      // Search through building names first
      for (const building of allBuildings) {
        const buildingNameNormalized = building.name.toLowerCase();
        const buildingCodeNormalized = building.code.toLowerCase();
        const displayString = `[${building.code}] ${building.name}`;

        if ((buildingNameNormalized.includes(normalizedInput) || buildingCodeNormalized.includes(normalizedInput)) && !postTags.includes(displayString)) {
          matches.push(displayString);
          if (matches.length >= 10) break;
        }
      }

      // Then search through all tasks
      if (matches.length < 10) {
        for (const cat of allHierarchy) {
          for (const group of cat.groups) {
            for (const task of group.tasks) {
              const taskNormalized = task.toLowerCase().replace(/_/g, ' ');
              if (taskNormalized.includes(normalizedInput) && !postTags.includes(task)) {
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
  }, [postKeyword, allHierarchy, allBuildings, postTags]);

  const addTag = useCallback((tag: string) => {
    if (tag.includes(' / ')) {
      const parts = tag.split(' / ');
      const groupName = parts[1];
      const taskName = parts[parts.length - 1];

      // Add both group and task (if unique)
      setPostTags(prev => {
        const newTags = [...prev];
        if (!newTags.includes(groupName)) newTags.push(groupName);
        const cleanTaskName = taskName.replace(/_/g, ' ');
        if (!newTags.includes(cleanTaskName)) newTags.push(cleanTaskName);
        return newTags;
      });
    } else {
      if (tag && !postTags.includes(tag)) {
        setPostTags(prev => [...prev, tag]);
      }
    }
    setPostKeyword('');
    setSuggestions([]);
    setShowDropdown(false);
    keywordInputRef.current?.focus();
  }, [postTags]);

  const removeTag = useCallback((index: number) => {
    setPostTags(prev => prev.filter((_, i) => i !== index));
  }, []);

  const handleKeywordKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && suggestions.length > 0) {
        addTag(suggestions[selectedIndex]);
      } else if (postKeyword.trim()) {
        addTag(postKeyword.trim());
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
    } else if (e.key === 'Backspace' && !postKeyword && postTags.length > 0) {
      removeTag(postTags.length - 1);
    }
  };

  // Deferred Detection Effect: Run when tags or pending file changes
  useEffect(() => {
    if (!pendingPostFile) return;

    const fileName = pendingPostFile.name.split('.')[0];
    const fullKeyword = [...postTags, fileName].join(', ');

    // Detect Building
    const detectedB = detectBuildingFromKeyword(fullKeyword, allBuildings);
    if (detectedB) {
      setSelectedBuilding(detectedB);
    }

    // Detect Task
    const detectedT = detectWorkFromKeyword(
      fullKeyword,
      allHierarchy,
      (detectedB?.code === 'GL' || detectedB?.code === 'GLO') ? '10. Logistik & Material' : undefined
    );

    if (detectedT) {
      if (detectedT.includes(' / ')) {
        setWorkName(detectedT);
      } else {
        for (const cat of allHierarchy) {
          const group = cat.groups.find(g => g.tasks.includes(detectedT));
          if (group) {
            setWorkName(`${cat.category} / ${group.name} / ${detectedT}`);
            break;
          }
        }
      }
    }
  }, [postTags, pendingPostFile, allBuildings, allHierarchy]);

  // Sync Config from Vercel KV
  const fetchConfig = useCallback(async (filename: string) => {
    try {
      const res = await fetch(`/api/config?filename=${filename}`);
      const { success, data } = await res.json();
      return success ? data : null;
    } catch (e: any) {
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
    } catch (e: any) {
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
        // Enforce Sorting: Global/Persiapan first, then alphabetical A-V
        const sortedB = (bData as Building[]).sort((a, b) => {
          const aCode = a.code.toLowerCase();
          const bCode = b.code.toLowerCase();
          const aName = a.name.toLowerCase();
          const bName = b.name.toLowerCase();
          const isGlobalA = aCode === 'gl' || aCode === 'glo' || aName.includes('global') || aName.includes('persiapan');
          const isGlobalB = bCode === 'gl' || bCode === 'glo' || bName.includes('global') || bName.includes('persiapan');
          if (isGlobalA && !isGlobalB) return -1;
          if (!isGlobalA && isGlobalB) return 1;
          return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
        });
        setAllBuildings(sortedB);
      } else {
        // Start with empty array if no data in Supabase
        setAllBuildings([]);
      }

      if (wData) {
        // Enforce Sorting: Persiapan first, then alphabetical
        const sortedW = (wData as any[]).sort((a, b) => {
          return a.category.localeCompare(b.category, undefined, { numeric: true, sensitivity: 'base' });
        });
        setAllHierarchy(sortedW);
      } else {
        // Start with empty array if no data in Supabase
        setAllHierarchy([]);
      }

      showToast('Database sinkron dengan Cloud', 'info');
    } catch (e: any) {
      console.error('Failed to load all configs', e);
    } finally {
      setIsSyncing(false);
    }
  }, [fetchConfig, showToast]);

  // Consolidated Cloud Save Effect
  useEffect(() => {
    // Don't auto-save during initial sync
    if (isSyncing) return;
    // Don't auto-save if there are no changes
    if (!hasUnsavedChanges) return;

    const timer = setTimeout(() => {
      const saveAll = async () => {
        setIsSavingCloud(true);
        try {
          // Save both in parallel
          const results = await Promise.all([
            fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: 'buildings.json', data: allBuildings })
            }),
            fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ filename: 'works.json', data: allHierarchy })
            })
          ]);

          // Check if both succeeded
          const [buildingsRes, worksRes] = results;
          const buildingsData = await buildingsRes.json();
          const worksData = await worksRes.json();

          if (buildingsData.success && worksData.success) {
            setLastSynced(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
            setHasUnsavedChanges(false);
            showToast('Data tersimpan ke Cloud', 'success');
          } else {
            throw new Error(buildingsData.error || worksData.error || 'Failed to save');
          }
        } catch (e: any) {
          console.error('Auto-save failed', e);
          showToast(`Gagal menyimpan: ${e.message}`, 'error');
        } finally {
          setIsSavingCloud(false);
        }
      };

      saveAll();
    }, 1500); // 1.5s debounce

    return () => clearTimeout(timer);
  }, [allBuildings, allHierarchy, isSyncing, hasUnsavedChanges, showToast]);

  // Initial load
  useEffect(() => {
    loadAllConfigs();
  }, [loadAllConfigs]);

  // Re-sync when switching to settings tab (only if no unsaved changes)
  useEffect(() => {
    if (activeTab === 'settings' && !hasUnsavedChanges) {
      loadAllConfigs();
    }
  }, [activeTab, loadAllConfigs, hasUnsavedChanges]);

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
    if (!terminPath) {
      setTerminSaveStatus('idle');
      return;
    }

    setTerminSaveStatus('saving');
    const timer = setTimeout(() => {
      localStorage.setItem('nk_termin_path', terminPath);
      setTerminSaveStatus('saved');
      const hideTimer = setTimeout(() => setTerminSaveStatus('idle'), 2000);
      return () => clearTimeout(hideTimer);
    }, 600);

    return () => clearTimeout(timer);
  }, [terminPath]);

  useEffect(() => {
    if (storageType) localStorage.setItem('nk_storage_type', storageType);
  }, [storageType]);

  useEffect(() => {
    localStorage.setItem('nk_show_building_index', String(showBuildingIndex));
  }, [showBuildingIndex]);

  useEffect(() => {
    localStorage.setItem('nk_use_timestamp', String(useTimestamp));
  }, [useTimestamp]);

  useEffect(() => {
    if (selectedBuilding) {
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
          } catch (e: any) {
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
            {activeTab === 'termin' && 'DOKUMEN TERMIN'}
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
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm p-6 space-y-6">
                <BuildingSelector selectedBuilding={selectedBuilding} onSelect={setSelectedBuilding} buildings={allBuildings} />
                <WorkSelector value={workName} onChange={setWorkName} hierarchy={allHierarchy} />

                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Work Progress (%)</label>
                  <div className="flex items-center gap-4">
                    <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-2xl px-6 py-3 shadow-sm shadow-slate-100 group transition-all focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500">
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
                    <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-slate-200 to-transparent" />
                  </div>

                  {/* Date Picker */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block text-center">Work Date</label>
                    <div className="flex items-center gap-4">
                      <div className="flex-1 h-[1px] bg-gradient-to-r from-transparent via-slate-200 to-transparent" />
                      <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-2xl px-4 py-2 shadow-sm shadow-slate-100 group transition-all focus-within:ring-2 focus-within:ring-orange-500/10 focus-within:border-orange-500">
                        <input
                          type="date"
                          value={selectedDate}
                          onChange={(e) => setSelectedDate(e.target.value)}
                          className="bg-transparent text-center text-lg font-bold text-slate-900 outline-none p-0 m-0 w-auto"
                        />
                      </div>
                      <div className="flex-1 h-[1px] bg-gradient-to-l from-transparent via-slate-200 to-transparent" />
                    </div>
                  </div>
                </div>

                {/* New Single Drop Zone for Post */}
                <div className="relative group">
                  <input
                    type="file"
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file) return;
                      setPendingPostFile(file);
                      addLog(`[FILE] File terpilih: ${file.name}`);
                    }}
                  />
                  {pendingPostFile ? (
                    <div className="bg-orange-50/50 border-2 border-orange-200 rounded-[2rem] p-4 flex items-center gap-4 relative overflow-hidden group">
                      <div className="absolute top-2 right-2 z-20">
                        <button
                          onClick={() => {
                            setPendingPostFile(null);
                            setPostTags([]);
                          }}
                          className="bg-white/80 backdrop-blur shadow-sm text-slate-400 hover:text-red-500 rounded-full p-1.5 transition-colors"
                        >
                          <XCircle className="w-5 h-5" />
                        </button>
                      </div>

                      <div className="w-20 h-20 rounded-2xl overflow-hidden bg-white border border-orange-100 shrink-0 shadow-sm">
                        {pendingPostFile.type.startsWith('image/') ? (
                          <img
                            src={URL.createObjectURL(pendingPostFile)}
                            alt="Preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <FileIcon className="w-8 h-8 text-orange-200" />
                          </div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0 pr-8">
                        <p className="text-xs font-black text-slate-900 truncate uppercase mt-1">{pendingPostFile.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] font-bold text-orange-500/60 uppercase tracking-tight">READY TO PROCESS</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="border-2 border-dashed border-slate-200 rounded-[2rem] py-16 flex flex-col items-center justify-center gap-3 group-hover:border-orange-500 group-hover:bg-orange-50/30 transition-all bg-slate-50/50">
                      <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform">
                        {isProcessing ? (
                          <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
                        ) : (
                          <PlusCircle className="w-8 h-8 text-orange-500" />
                        )}
                      </div>
                      <div className="text-center">
                        <span className="text-base font-black text-slate-900 uppercase tracking-widest">{isProcessing ? 'Processing...' : 'Capture / Upload'}</span>
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-tight mt-1">
                          {selectedBuilding ? `Ready for ${selectedBuilding.code}` : 'Take Photo or Select File'}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative space-y-2">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Quick Detect Keyword / Hints</label>
                  <div className="min-h-[56px] bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 flex items-center gap-2 flex-wrap transition-all focus-within:ring-2 focus-within:ring-orange-500/20 focus-within:border-orange-500">
                    <Zap className={`w-4 h-4 shrink-0 ${(postTags.length > 0 || postKeyword) ? 'text-orange-500' : 'text-slate-300'}`} />

                    {/* Tags */}
                    <AnimatePresence mode="popLayout">
                      {postTags.map((tag, index) => {
                        const isWorkTask = allHierarchy.some(cat => cat.groups.some(group => group.tasks.some(task => task.toLowerCase() === tag.toLowerCase())));
                        const isBuildingMatch = tag.startsWith('[') && tag.includes(']');

                        return (
                          <motion.div
                            key={tag}
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className={`inline-flex items-center gap-1.5 text-white rounded-xl px-3 py-1.5 whitespace-nowrap shadow-sm ${isWorkTask ? 'bg-emerald-500' : 'bg-orange-500'}`}
                          >
                            {isBuildingMatch ? (
                              <div className="flex items-center gap-1.5">
                                <span className="bg-white/20 px-1.5 py-0.5 rounded text-[10px] font-black">{tag.match(/\[(.*?)\]/)?.[1]}</span>
                                <span className="text-xs font-bold">{tag.split(']')[1].trim()}</span>
                              </div>
                            ) : (
                              <span className="text-xs font-bold">{tag.replace(/_/g, ' ')}</span>
                            )}
                            <button onClick={() => removeTag(index)} className="hover:bg-white/20 rounded-full p-0.5 transition-colors">
                              <XCircle className="w-3.5 h-3.5" />
                            </button>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>

                    <input
                      ref={keywordInputRef}
                      type="text"
                      value={postKeyword}
                      onChange={(e) => setPostKeyword(e.target.value)}
                      onKeyDown={handleKeywordKeyDown}
                      onFocus={() => postKeyword && suggestions.length > 0 && setShowDropdown(true)}
                      onBlur={() => setTimeout(() => setShowDropdown(false), 200)}
                      placeholder={postTags.length === 0 ? "Type building or work keywords..." : ""}
                      className="flex-1 min-w-[120px] bg-transparent border-none outline-none text-sm font-bold text-slate-900 placeholder:text-slate-300"
                    />
                  </div>

                  {/* Autocomplete Dropdown */}
                  <AnimatePresence>
                    {showDropdown && suggestions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-[2rem] shadow-2xl overflow-hidden z-[100] max-h-[250px] overflow-y-auto"
                      >
                        <div className="p-2 space-y-1">
                          {suggestions.map((suggestion, index) => {
                            const isBuildingSug = suggestion.startsWith('[') && suggestion.includes(']');
                            return (
                              <button
                                key={suggestion}
                                onClick={() => addTag(suggestion)}
                                className={`w-full px-4 py-3 text-left text-sm font-bold transition-all flex items-center gap-3 rounded-2xl ${index === selectedIndex ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20' : 'text-slate-700 hover:bg-slate-50'}`}
                              >
                                {isBuildingSug ? (
                                  <>
                                    <span className={`px-2 py-0.5 rounded text-[10px] font-black ${index === selectedIndex ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>{suggestion.match(/\[(.*?)\]/)?.[1]}</span>
                                    <span>{suggestion.split(']')[1].trim()}</span>
                                  </>
                                ) : suggestion.includes(' / ') ? (
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-tighter shrink-0 border ${getBadgeColor(suggestion.split(' / ')[1], index === selectedIndex)}`}>
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
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
              {/* Submit Button */}
              {pendingPostFile && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={async () => {
                    if (!selectedBuilding || !outputPath) {
                      showToast("Pilih Gedung dan Isi Folder ID di Settings dulu!", "error");
                      return;
                    }

                    setIsProcessing(true);
                    setProcessLogs([]);
                    addLog(`[INFO] Submitting documentation...`);

                    const fileToProcess = pendingPostFile;
                    let file = fileToProcess;
                    const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true, preserveExif: true };

                    const uploadToApi = async (f: File | Blob, isTs: boolean) => {
                      const formData = new FormData();
                      formData.append('file', f, fileToProcess.name);
                      formData.append('metadata', JSON.stringify({
                        detectedDate: selectedDate,
                        workName: workName || 'Documentation',
                        buildingCode: selectedBuilding.code,
                        buildingName: selectedBuilding.name,
                        buildingIndex: selectedBuilding.index,
                        progress: progress || '0',
                        outputPath: outputPath,
                        showBuildingIndex: showBuildingIndex,
                        isTimestamp: isTs,
                      }));

                      const res = await fetch('/api/process', { method: 'POST', body: formData });
                      return await res.json();
                    };

                    try {
                      // 0. GUARANTEE: Save original EXIF metadata before ANY processing
                      addLog(`[INFO] Capturing original metadata before compression...`);
                      let originalExif = await getExifData(file);

                      // IMPROVED DETECTION: Use exifr to check if GPS actually exists
                      const buffer = await file.arrayBuffer();
                      const existingExif = await exifr.parse(buffer, { gps: true });
                      const hasGps = !!(existingExif?.latitude && existingExif?.longitude);

                      // LIVE INJECTION: If photo lacks GPS (Camera photo/Social media), use browser GPS
                      if (!hasGps && navigator.geolocation) {
                        addLog(`[INFO] GPS tidak ditemukan di metadata. Mencoba Live Injection via HP...`);
                        try {
                          const pos = await new Promise<GeolocationPosition>((res, rej) => {
                            navigator.geolocation.getCurrentPosition(res, rej, {
                              enableHighAccuracy: true,
                              timeout: 8000
                            });
                          });

                          addLog(`[INFO] Lokasi HP didapat: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`);
                          originalExif = createGpsExif(pos.coords.latitude, pos.coords.longitude);

                          // ENRICH FILE: Inject the new GPS so that both Clean and Timestamp processes use it
                          file = await injectExif(file, originalExif, file.name, file.type);

                          addLog(`[SUCCESS] Metadata lokasi berhasil disuntikkan secara otomatis.`);
                        } catch (gpsErr: any) {
                          addLog(`[WARN] Gagal mengambil GPS HP: ${gpsErr.message}. Foto tetap diunggah tanpa GPS.`);
                        }
                      } else if (!hasGps && !navigator.geolocation) {
                        addLog(`[WARN] Metadata GPS kosong & Browser tidak mengijinkan akses lokas (non-HTTPS?).`);
                      } else if (hasGps) {
                        addLog(`[INFO] Metadata GPS ditemukan (${existingExif.latitude.toFixed(6)}, ${existingExif.longitude.toFixed(6)}).`);
                      }

                      // 1. Process and Upload Original (Clean)
                      addLog(`[INFO] Compressing original...`);
                      const compressedBlob = await imageCompression(file, options);

                      let finalOriginal: File;
                      if (originalExif) {
                        addLog(`[INFO] Restoring original metadata...`);
                        finalOriginal = await injectExif(compressedBlob, originalExif, file.name, file.type);
                      } else {
                        finalOriginal = new File([compressedBlob], file.name, { type: file.type });
                      }

                      addLog(`[INFO] Uploading original version...`);
                      const mainRes = await uploadToApi(finalOriginal, false);

                      if (mainRes.success) {
                        addLog(`[SUCCESS] Original: ${mainRes.finalName}`);
                      } else {
                        throw new Error(`Original upload failed: ${mainRes.error}`);
                      }

                      // 2. Process and Upload Timestamp (if enabled)
                      if (useTimestamp && file.type.startsWith('image/')) {
                        addLog(`[INFO] Processing timestamped version...`);
                        const timestampedFile = await processTimestampImage(file, addLog);
                        addLog(`[INFO] Compressing timestamped version...`);
                        const compressedTsBlob = await imageCompression(timestampedFile, options);

                        let finalTs: File;
                        if (originalExif) {
                          addLog(`[INFO] Restoring metadata to timestamped version...`);
                          finalTs = await injectExif(compressedTsBlob, originalExif, file.name, file.type);
                        } else {
                          finalTs = new File([compressedTsBlob], file.name, { type: file.type });
                        }

                        addLog(`[INFO] Uploading timestamped version...`);
                        const tsRes = await uploadToApi(finalTs, true);

                        if (tsRes.success) {
                          addLog(`[SUCCESS] Timestamped: ${tsRes.finalName}`);
                        } else {
                          addLog(`[WARN] Timestamped upload failed: ${tsRes.error}`);
                        }
                      }

                      // Final success state
                      setPendingPostFile(null);
                      // Keywords and tags are now persisted until refresh as requested
                      showToast(useTimestamp ? "Both versions uploaded!" : "Original uploaded!", "success");

                    } catch (err: any) {
                      addLog(`[ERROR] Gagal: ${err.message}`);
                      showToast(err.message, "error");
                    }

                    setIsProcessing(false);
                  }}
                  disabled={isProcessing}
                  className="w-full bg-slate-900 text-white rounded-[2rem] py-4 text-sm font-black uppercase tracking-widest shadow-xl shadow-slate-200 flex items-center justify-center gap-3 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud className="w-5 h-5" />
                      <span>Submit Documentation</span>
                    </>
                  )}
                </motion.button>
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

              {/* Spacer to allow scrolling when autocomplete is active */}
              <div className="h-64" />
            </motion.div>
          )}

          {activeTab === 'termin' && (
            <motion.div
              key="termin"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="space-y-2 text-center pb-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tight">Termin</h2>
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">Stage Payment Documentation</p>
              </div>

              {allHierarchy.map((cat, idx) => (
                <div key={idx} className="bg-white rounded-[2rem] border border-slate-200 shadow-sm p-6 space-y-4">
                  <div className="flex items-center justify-between px-2">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{cat.category}</span>
                    <span className="text-[10px] font-bold text-orange-500 uppercase">{allHierarchy.reduce((acc, cat) => acc + cat.groups.reduce((gAcc, g) => gAcc + g.tasks.length, 0), 0)} Tasks</span>
                  </div>

                  <div className="relative group">
                    <input
                      type="file"
                      multiple
                      className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                      onChange={async (e) => {
                        const fileList = e.target.files;
                        if (!fileList || fileList.length === 0) return;
                        if (!selectedBuilding || !terminPath) {
                          showToast("Select building and set Termin Folder ID first", "error");
                          return;
                        }

                        setIsProcessing(true);
                        setProcessLogs([]);
                        addLog(`[INFO] [TERMIN] Memproses ${fileList.length} file untuk kategori ${cat.category}...`);

                        for (let i = 0; i < fileList.length; i++) {
                          const file = fileList[i];
                          addLog(`[INFO] Mengunggah: ${file.name}`);

                          const formData = new FormData();
                          formData.append('file', file);
                          formData.append('metadata', JSON.stringify({
                            detectedDate: getDefaultDate(),
                            workName: `${cat.category} / Documentation`,
                            buildingCode: selectedBuilding.code,
                            buildingName: selectedBuilding.name,
                            buildingIndex: selectedBuilding.index,
                            progress: 100, // Termin usually 100% per milestone
                            outputPath: terminPath, // Use termin folder
                            showBuildingIndex: showBuildingIndex,
                          }));

                          try {
                            const res = await fetch('/api/process', { method: 'POST', body: formData });
                            const result = await res.json();
                            if (result.success) {
                              addLog(`[SUCCESS] Berhasil: ${result.finalName}`);
                            } else {
                              addLog(`[ERROR] Gagal: ${result.error}`);
                            }
                          } catch (err: any) {
                            addLog(`[ERROR] Gagal sistem: ${err.message}`);
                          }
                        }
                        setIsProcessing(false);
                        showToast(`File Termin ${cat.category} berhasil diproses!`, 'success');
                      }}
                    />
                    <div className="border-2 border-dashed border-slate-200 rounded-2xl py-8 flex flex-col items-center justify-center gap-2 group-hover:border-orange-500 group-hover:bg-orange-50/30 transition-all">
                      <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center group-hover:bg-orange-100 mb-1 transition-colors">
                        <PlusCircle className="w-5 h-5 text-slate-400 group-hover:text-orange-500" />
                      </div>
                      <span className="text-xs font-black text-slate-400 group-hover:text-orange-600 uppercase tracking-widest">Drop Termin Files</span>
                      <p className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">PDF or Images for {cat.category.split('. ')[1] || cat.category}</p>
                    </div>
                  </div>
                </div>
              ))}

              {/* Common Logs for Termin */}
              {(isProcessing || processLogs.length > 0) && (
                <ProcessLog
                  logs={processLogs}
                  isProcessing={isProcessing}
                  onClose={() => setProcessLogs([])}
                />
              )}
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
                          const next = [...allBuildings, newBuilding].sort((a, b) => {
                            const aCode = a.code.toLowerCase();
                            const bCode = b.code.toLowerCase();
                            const aName = a.name.toLowerCase();
                            const bName = b.name.toLowerCase();
                            const isGlobalA = aCode === 'gl' || aCode === 'glo' || aName.includes('global') || aName.includes('persiapan');
                            const isGlobalB = bCode === 'gl' || bCode === 'glo' || bName.includes('global') || bName.includes('persiapan');
                            if (isGlobalA && !isGlobalB) return -1;
                            if (!isGlobalA && isGlobalB) return 1;
                            return a.code.localeCompare(b.code, undefined, { numeric: true, sensitivity: 'base' });
                          });
                          setAllBuildings(next);
                          setHasUnsavedChanges(true);
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
                                      setHasUnsavedChanges(true);
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
                                      setHasUnsavedChanges(true);
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
                                        setHasUnsavedChanges(true);
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
                      <div className="relative">
                        <select
                          id="new-work-cat"
                          className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500 appearance-none"
                          defaultValue=""
                        >
                          <option value="" disabled>Select Category...</option>
                          {allHierarchy.map((h, i) => (
                            <option key={i} value={h.category}>{h.category}</option>
                          ))}
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-slate-400">
                          <ChevronDown className="w-4 h-4" />
                        </div>
                      </div>
                      <input
                        id="new-work-group"
                        type="text"
                        placeholder="Group Name (ex: Balok)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        id="new-work-task"
                        type="text"
                        placeholder="Task Name (ex: Bekisting)"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-xs font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-orange-500"
                      />
                    </div>
                    <button
                      disabled={isSavingCloud}
                      onClick={() => {
                        const catInput = document.getElementById('new-work-cat') as HTMLSelectElement;
                        const groupInput = document.getElementById('new-work-group') as HTMLInputElement;
                        const taskInput = document.getElementById('new-work-task') as HTMLInputElement;
                        if (catInput.value && groupInput.value && taskInput.value) {
                          const next = [...allHierarchy];
                          const catName = catInput.value.trim();
                          const groupName = groupInput.value.trim();
                          const taskName = taskInput.value.trim().replace(/\s+/g, '_');

                          const existingCat = next.find(w => w.category.toLowerCase() === catName.toLowerCase());
                          if (existingCat) {
                            const existingGroup = existingCat.groups.find(g => g.name.toLowerCase() === groupName.toLowerCase());
                            if (existingGroup) {
                              if (existingGroup.tasks.some(t => t.toLowerCase() === taskName.toLowerCase())) {
                                showToast(`Pekerjaan "${taskInput.value}" sudah ada di grup ini!`, 'error');
                                return;
                              }
                              existingGroup.tasks = [...existingGroup.tasks, taskName].sort((a, b) => a.localeCompare(b));
                            } else {
                              existingCat.groups.push({ name: groupName, tasks: [taskName] });
                              existingCat.groups.sort((a, b) => a.name.localeCompare(b.name));
                            }
                          } else {
                            next.push({
                              category: catName,
                              groups: [{ name: groupName, tasks: [taskName] }]
                            });
                            next.sort((a, b) => a.category.localeCompare(b.category, undefined, { numeric: true, sensitivity: 'base' }));
                          }
                          setAllHierarchy(next);
                          setHasUnsavedChanges(true);
                          showToast(`Pekerjaan "${taskInput.value}" ditambahkan ke ${catName} / ${groupName}`, 'success');
                          catInput.value = '';
                          groupInput.value = '';
                          taskInput.value = '';
                        } else {
                          showToast('Mohon isi semua bidang (Kategori, Grup, dan Tugas)', 'error');
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
                          w.groups.some(g =>
                            g.name.toLowerCase().includes(taskSearch.toLowerCase()) ||
                            g.tasks.some(t => t.toLowerCase().includes(taskSearch.toLowerCase()))
                          )
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
                                        next[i].category = (editingCategory?.name || '').trim();
                                        next.sort((a, b) => a.category.localeCompare(b.category, undefined, { numeric: true, sensitivity: 'base' }));
                                        setAllHierarchy(next);
                                        setHasUnsavedChanges(true);
                                        setEditingCategory(null);
                                        showToast(`Kategori diperbarui`, 'success');
                                      }
                                    }}
                                  />
                                  <button
                                    onClick={() => {
                                      const next = [...allHierarchy];
                                      next[i].category = editingCategory.name.trim();
                                      next.sort((a, b) => a.category.localeCompare(b.category, undefined, { numeric: true, sensitivity: 'base' }));
                                      setAllHierarchy(next);
                                      setHasUnsavedChanges(true);
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
                            <div className="space-y-3">
                              {w.groups.map((g, gi) => (
                                <div key={gi} className="space-y-1">
                                  <div className="px-4 py-1">
                                    <span className="text-[8px] font-bold text-orange-400 uppercase tracking-wider">{g.name}</span>
                                  </div>
                                  <div className="space-y-1">
                                    {g.tasks.map((t, ti) => (
                                      <div key={ti} className="flex items-center gap-3 bg-white px-3 py-2.5 rounded-xl border border-slate-100 min-w-0">
                                        <div className="flex-1 min-w-0">
                                          {editingTask?.catIndex === i && editingTask?.groupIndex === gi && editingTask?.taskIndex === ti ? (
                                            <input
                                              type="text"
                                              value={editingTask.name.replace(/_/g, ' ')}
                                              onChange={(e) => setEditingTask({ ...editingTask, name: e.target.value })}
                                              autoFocus
                                              className="w-full bg-slate-50 border-none px-2 py-1 text-xs font-bold text-slate-900 focus:outline-none rounded-lg"
                                              onKeyDown={(e) => {
                                                if (e.key === 'Enter') {
                                                  const next = [...allHierarchy];
                                                  next[i].groups[gi].tasks[ti] = editingTask.name.replace(/\s+/g, '_');
                                                  setAllHierarchy(next);
                                                  setHasUnsavedChanges(true);
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
                                          {editingTask?.catIndex === i && editingTask?.groupIndex === gi && editingTask?.taskIndex === ti ? (
                                            <>
                                              <button
                                                onClick={() => {
                                                  const next = [...allHierarchy];
                                                  next[i].groups[gi].tasks[ti] = editingTask.name.replace(/\s+/g, '_');
                                                  setAllHierarchy(next);
                                                  setHasUnsavedChanges(true);
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
                                              <button onClick={() => setEditingTask({ catIndex: i, groupIndex: gi, taskIndex: ti, name: t })} className="text-slate-300 hover:text-orange-500 p-2 transition-colors">
                                                <Edit3 className="w-3.5 h-3.5" />
                                              </button>
                                              <button
                                                onClick={() => {
                                                  if (window.confirm(`Apakah Anda yakin ingin menghapus tugas "${t}"?`)) {
                                                    const next = [...allHierarchy];
                                                    next[i].groups[gi].tasks = next[i].groups[gi].tasks.filter((_, idx) => idx !== ti);
                                                    if (next[i].groups[gi].tasks.length === 0) {
                                                      next[i].groups = next[i].groups.filter((_, idx) => idx !== gi);
                                                      if (next[i].groups.length === 0) {
                                                        setAllHierarchy(next.filter((_, idx) => idx !== i));
                                                      } else {
                                                        setAllHierarchy(next);
                                                      }
                                                    } else {
                                                      setAllHierarchy(next);
                                                    }
                                                    setHasUnsavedChanges(true);
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
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Manual Save Button */}
              {hasUnsavedChanges && (
                <div className="bg-orange-50 border border-orange-200 rounded-3xl p-5">
                  <div className="flex items-center gap-3 mb-3">
                    <Info className="w-4 h-4 text-orange-500" />
                    <span className="text-xs font-bold text-orange-700">Perubahan belum tersimpan</span>
                  </div>
                  <button
                    onClick={async () => {
                      setIsSavingCloud(true);
                      try {
                        const results = await Promise.all([
                          fetch('/api/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: 'buildings.json', data: allBuildings })
                          }),
                          fetch('/api/config', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ filename: 'works.json', data: allHierarchy })
                          })
                        ]);

                        const [buildingsRes, worksRes] = results;
                        const buildingsData = await buildingsRes.json();
                        const worksData = await worksRes.json();

                        if (buildingsData.success && worksData.success) {
                          setLastSynced(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
                          setHasUnsavedChanges(false);
                          showToast('Data berhasil disimpan ke Cloud!', 'success');
                        } else {
                          throw new Error(buildingsData.error || worksData.error || 'Failed to save');
                        }
                      } catch (e: any) {
                        console.error('Manual save failed', e);
                        showToast(`Gagal menyimpan: ${e.message}`, 'error');
                      } finally {
                        setIsSavingCloud(false);
                      }
                    }}
                    disabled={isSavingCloud}
                    className="w-full bg-orange-500 text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {isSavingCloud ? <Loader2 className="w-4 h-4 animate-spin" /> : <Database className="w-4 h-4" />}
                    {isSavingCloud ? 'Menyimpan...' : 'Simpan ke Cloud'}
                  </button>
                </div>
              )}

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

                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5 space-y-4">
                    <div className="flex items-center gap-3 text-slate-400">
                      <ClipboardList className="w-5 h-5 text-orange-500" />
                      <span className="text-xs font-black uppercase tracking-tight text-slate-900">Google Drive Termin Folder ID</span>
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        value={terminPath}
                        onChange={(e) => setTerminPath(e.target.value)}
                        placeholder="Enter Folder ID for Termin..."
                        className="w-full bg-white border border-slate-200 rounded-2xl px-4 py-3 text-sm font-bold text-slate-700 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-500/10 transition-all placeholder:text-slate-300"
                      />
                      {terminSaveStatus === 'saved' && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 text-green-500 bg-white pl-2">
                          <Check className="w-4 h-4" />
                          <span className="text-[9px] font-black uppercase">Saved</span>
                        </div>
                      )}
                    </div>
                    <p className="text-[10px] font-medium text-slate-400 leading-relaxed text-center">Dokumen pembiayaan termin akan otomatis tersimpan dalam folder Cloud khusus ini.</p>
                  </div>

                  {/* GPS TEST SECTION */}
                  <div className="bg-white border border-slate-200 rounded-3xl p-5 space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-50 rounded-2xl flex items-center justify-center text-orange-500 shrink-0">
                        <MapPin className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-[11px] font-black text-slate-800 uppercase tracking-wider">Test Lokasi (GPS)</h4>
                        <p className="text-[10px] text-slate-400 font-medium">Verifikasi koordinat & API OpenStreetMap</p>
                      </div>
                      <button
                        disabled={isTestingLocation}
                        onClick={async () => {
                          setIsTestingLocation(true);
                          setTestLocation("Mengambil koordinat...");

                          if (!window.isSecureContext) {
                            addLog("[WARN] Akses via non-HTTPS detected. GPS browser mungkin diblokir.");
                          }

                          if (!navigator.geolocation) {
                            addLog("[ERROR] Browser tidak mendukung fitur GPS Geolocation.");
                            setTestLocation("Browser tidak mendukung GPS.");
                            setIsTestingLocation(false);
                            return;
                          }

                          navigator.geolocation.getCurrentPosition(
                            async (pos) => {
                              const lat = pos.coords.latitude;
                              const lon = pos.coords.longitude;
                              addLog(`[SUCCESS] Sensor GPS terbaca: ${lat.toFixed(6)}, ${lon.toFixed(6)}`);
                              setTestCoords({ lat, lon });
                              setTestLocation(`Mencari alamat untuk koord: ${lat.toFixed(6)}, ${lon.toFixed(6)}...`);

                              const addr = await fetchReverseGeocode(lat, lon);
                              setTestLocation(addr);
                              showToast("GPS & API Berjalan Normal", "success");
                              setIsTestingLocation(false);
                            },
                            async (err) => {
                              console.warn("GPS Error:", err);
                              let errMsg = "Akses GPS Gagal";
                              if (err.code === 1) errMsg = "Izin lokasi ditolak (Gunakan HTTPS)";
                              else if (err.code === 2) errMsg = "Posisi tidak tersedia (Sensor GPS HP mati)";
                              else if (err.code === 3) errMsg = "Waktu habis (Pindah ke area terbuka)";

                              addLog(`[ERROR] GPS Error: ${errMsg} (${err.message})`);
                              setTestLocation(`Gagal: ${errMsg}.`);
                              showToast(errMsg, "error");
                              setIsTestingLocation(false);
                            },
                            { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
                          );
                        }}
                        className="bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2"
                      >
                        {isTestingLocation && <Loader2 className="w-3 h-3 animate-spin" />}
                        Test
                      </button>
                    </div>

                    {testLocation && (
                      <div className="bg-slate-50 rounded-2xl p-3 border border-slate-100">
                        <p className="text-[11px] font-bold text-slate-600 break-words leading-relaxed">
                          {testLocation}
                        </p>
                        {testCoords && (
                          <MapComponent lat={testCoords.lat} lon={testCoords.lon} address={testLocation} />
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Naming Options */}
                <div className="space-y-4">
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center block">Folder Naming Options</label>
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-5">
                    <button
                      onClick={() => setShowBuildingIndex(!showBuildingIndex)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl active:bg-slate-50 transition-all group"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${showBuildingIndex ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-300'}`}>
                          {showBuildingIndex && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex flex-col items-start">
                          <span className="text-sm font-black text-slate-900 leading-tight">Show Building Index</span>
                          <span className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                            {showBuildingIndex ? '101. Direksi Keet (T-DK)' : 'Direksi Keet (T-DK)'}
                          </span>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${showBuildingIndex ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                        {showBuildingIndex ? 'ON' : 'OFF'}
                      </div>
                    </button>

                    <button
                      onClick={() => setUseTimestamp(!useTimestamp)}
                      className="w-full flex items-center justify-between p-4 bg-white border border-slate-200 rounded-2xl active:bg-slate-50 transition-all group mt-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${useTimestamp ? 'bg-orange-500 border-orange-500' : 'bg-white border-slate-300'}`}>
                          {useTimestamp && <Check className="w-4 h-4 text-white" />}
                        </div>
                        <div className="flex flex-col items-start text-left">
                          <span className="text-sm font-black text-slate-900 leading-tight">Auto-Timestamp Overlay</span>
                          <span className="text-[10px] font-medium text-slate-400 leading-tight mt-0.5">
                            Visual time & location on photos
                          </span>
                        </div>
                      </div>
                      <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-colors ${useTimestamp ? 'bg-orange-100 text-orange-600' : 'bg-slate-100 text-slate-400'}`}>
                        {useTimestamp ? 'ON' : 'OFF'}
                      </div>
                    </button>
                  </div>
                </div>

                {/* Recommendations & Stats */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-1">
                    <span className="text-xl font-black text-slate-900">{allBuildings.length}</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Gedung</span>
                  </div>
                  <div className="bg-slate-50 border border-slate-200 rounded-3xl p-4 flex flex-col items-center justify-center text-center gap-1">
                    <span className="text-xl font-black text-slate-900">{allHierarchy.reduce((acc, cat) => acc + cat.groups.reduce((gAcc, g) => gAcc + g.tasks.length, 0), 0)}</span>
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
                          {isSavingCloud || isSyncing ? (
                            <>
                              <Loader2 className="w-1.5 h-1.5 animate-spin text-orange-500" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-orange-500/70">Syncing...</span>
                            </>
                          ) : (
                            <>
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              <span className="text-[8px] font-black uppercase tracking-widest text-emerald-600/70">
                                {lastSynced ? `Synced ${lastSynced}` : 'Connected'}
                              </span>
                            </>
                          )}
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
    </main >
  );
}

