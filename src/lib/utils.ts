import { format } from 'date-fns';
import piexif from 'piexifjs';
import exifr from 'exifr';

export function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function getExifData(file: Blob): Promise<string | null> {
    try {
        const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(file);
        });
        const exifObj = piexif.load(dataUrl);
        return piexif.dump(exifObj);
    } catch (e) {
        console.warn("Failed to extract EXIF:", e);
        return null;
    }
}


export async function detectFileDate(file: File): Promise<string> {
    try {
        // 1. Try to read EXIF DateTimeOriginal using exifr (Robust, supports HEIC/JPG)
        const output = await exifr.parse(file, { tiff: true, exif: true });
        const dateTimeOriginal = output?.DateTimeOriginal;

        if (dateTimeOriginal) {
            // Robust Parsing for "YYYY:MM:DD HH:MM:SS" or Date object
            let dateObj: Date | null = null;

            if (dateTimeOriginal instanceof Date) {
                dateObj = dateTimeOriginal;
            } else if (typeof dateTimeOriginal === 'string') {
                // Handle "YYYY:MM:DD HH:MM:SS"
                const [datePart, timePart] = dateTimeOriginal.split(' ');
                const cleanDate = datePart.replace(/:/g, '-');
                const dateString = timePart ? `${cleanDate}T${timePart}` : cleanDate;
                const parsed = new Date(dateString);
                if (!isNaN(parsed.getTime())) {
                    dateObj = parsed;
                }
            }

            if (dateObj) {
                return format(dateObj, 'yyyy-MM-dd');
            }
        }
    } catch (e) {
        console.warn("Failed to extract EXIF date via exifr:", e);
    }

    // 2. Fallback to Last Modified
    return format(new Date(file.lastModified), 'yyyy-MM-dd');
}

export async function injectExif(destBlob: Blob, exifStr: string, fileName: string, mimeType: string): Promise<File> {
    try {
        const destDataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target?.result as string);
            reader.readAsDataURL(destBlob);
        });

        const inserted = piexif.insert(exifStr, destDataUrl);
        const res = await fetch(inserted);
        const blob = await res.blob();

        return new File([blob], fileName, { type: mimeType, lastModified: Date.now() });
    } catch (e) {
        console.error("EXIF injection error:", e);
        // Fallback to converting Blob to File
        return new File([destBlob], fileName, { type: mimeType, lastModified: Date.now() });
    }
}

export function sanitizePath(path: string): string {
    // Only replace illegal characters, keep spaces and forward slashes (for subfolders) as requested
    return path.replace(/[<>:"\\|?*]/g, '_');
}

export function generateNewName(
    dateStr: string,
    workName: string,
    buildingName: string,
    buildingCode: string,
    progress: string,
    sequence: number,
    extension: string
): string {
    // workName format: "Category / Group / Task"
    const workParts = workName.split(/\s*\/\s*/);

    // Extract parts (Category, Group, Task)
    // If only 2 parts, treat as Category / Task. If 3, Category / Group / Task
    let category = '';
    let group = '';
    let task = '';

    if (workParts.length >= 3) {
        category = workParts[0];
        group = workParts[1];
        task = workParts[2];
    } else if (workParts.length === 2) {
        category = workParts[0];
        task = workParts[1];
    } else {
        task = workParts[0] || '';
    }

    // Sanitize function: replace spaces/slashes with underscores, remove special chars
    const sanitize = (str: string) => {
        return str
            .replace(/^\d+\.\s*/, '') // Remove leading numbering like "1. "
            .trim()
            .replace(/[\/\\]/g, '_')   // Replace slashes
            .replace(/\s+/g, '_')      // Replace spaces with underscores
            .replace(/[^a-zA-Z0-9_\-\.]/g, ''); // Remove other special chars
    };

    const safeCategory = sanitize(category);
    const safeGroup = sanitize(group);
    const safeTask = sanitize(task);
    const safeBuilding = sanitize(buildingName);
    const safeCode = sanitize(buildingCode);

    // Assemble parts: Category_Group_Task_Building_Code_Sequence
    // Filter out empty parts
    const parts = [safeCategory, safeGroup, safeTask, safeBuilding, safeCode].filter(Boolean);

    // Remove "duplicates" if Group is contained in Task or Category (e.g. Kolom_Pengecoran_Kolom -> Kolom_Pengecoran)
    // Actually, user wants: Struktur_Kolom_Bekisting...
    // Let's stick to the explicit parts. If Group is "Kolom" and Task is "Bekisting" -> Kolom_Bekisting.
    // If Group is "Kolom" and Task is "Pengecoran Kolom" -> Kolom_Pengecoran_Kolom.
    // The user's example was explicit: Struktur_Kolom_Bekisting...

    // Join with underscores
    const baseName = parts.join('_');

    // Sequence
    const seqStr = sequence.toString().padStart(3, '0');

    // Progress (Optional, added only if provided and not empty/0)
    // User example didn't have it, but usually progress is good.
    // If progress is provided (e.g. "50"), append it? 
    // The example "Struktur_Kolom_Bekisting_Rusun_Guru_A_001.JPG" has NO progress.
    // I will add it ONLY if it's explicitly passed as a non-empty string, just in case.
    // But based on the request "rekomendasi di preview ... menjadi seperti ini", I should probably omit it if it's not in the example.
    // However, keeping previous logic: if progress exists, add it.

    // Update: User said "like this result". I will stick to the format.
    // If progress is needed, user usually asks. 
    // Let's keep it optional.

    if (progress && progress !== '0') {
        return `${baseName}_${progress}%_${seqStr}.${extension}`;
    }

    return `${baseName}_${seqStr}.${extension}`;
}

export function getFileExtension(filename: string): string {
    return filename.split('.').pop() || '';
}

export function getDefaultDate(): string {
    return format(new Date(), 'yyyy-MM-dd');
}

export function formatDecimalMinutes(coord: number, isLat: boolean): string {
    const absolute = Math.abs(coord);
    const degrees = Math.floor(absolute);
    const minutes = ((absolute - degrees) * 60).toFixed(3);
    const direction = isLat
        ? (coord >= 0 ? 'N' : 'S')
        : (coord >= 0 ? 'E' : 'W');
    return `${degrees}° ${minutes}' ${direction}`;
}

export function getDayNameIndo(date: Date): string {
    const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
    return days[date.getDay()];
}

export function extractGDriveId(idOrUrl: string): string {
    if (!idOrUrl) return '';
    // If it's a URL, extract the ID
    const match = idOrUrl.match(/[-\w]{25,}/);
    return match ? match[0] : idOrUrl;
}

export function detectBuildingFromKeyword(keyword: string, buildings: any[]): any | null {
    if (!keyword) return null;

    // Split by comma or semicolon first to get phrases
    const rawParts = keyword.split(/[,;]/).map(p => p.trim()).filter(Boolean);
    if (rawParts.length === 0) return null;

    // PASS 0: Check each part for [Code] Name format (highest priority)
    for (const part of rawParts) {
        const badgeMatch = part.match(/^\[(.*?)\]\s*(.*)$/i);
        if (badgeMatch) {
            const codePart = badgeMatch[1].toLowerCase().trim();
            const b = buildings.find(b => b.code.toLowerCase() === codePart);
            if (b) return b;
        }
    }

    // Prepare all tokens for scanning
    // We treat the whole string as a bag of words/phrases
    const allTokens = keyword.toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ').split(/[,;\s]+/).filter(Boolean);

    // PASS 1: Exact Code Match
    for (const token of allTokens) {
        const b = buildings.find(b => b.code.toLowerCase() === token);
        if (b) return b;
    }

    // PASS 2: Exact Name Match
    // We need to check phrases for names with spaces, so we check rawParts again
    for (const part of rawParts) {
        const normalizedPart = part.toLowerCase().replace(/_/g, ' ').trim();
        const b = buildings.find(b => b.name.toLowerCase() === normalizedPart);
        if (b) return b;
    }

    // PASS 3: Partial Name Match (Word Boundary)
    for (const token of allTokens) {
        if (token.length <= 2) continue; // Skip very short tokens
        const escapedTerm = escapeRegExp(token);
        const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
        const b = buildings.find(b => regex.test(b.name));
        if (b) return b;
    }

    return null;
}

export function detectWorkFromKeyword(
    keyword: string,
    hierarchy: { category: string; groups: { name: string; tasks: string[] }[] }[],
    categoryFilter?: string
): string {
    if (!keyword) return '';

    // Normalize entire keyword string, splitting by common separators to get tokens
    // We do NOT stop at the first comma anymore
    const normalizedInput = keyword.toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ');

    // Filter hierarchy if filter provided
    const filteredHierarchy = categoryFilter
        ? hierarchy.filter(h => h.category.toLowerCase() === categoryFilter.toLowerCase())
        : hierarchy;

    // Flatten hierarchy into a list of { cat, group, task } objects
    // This allows us to sort by task name length to prioritize specific matches (e.g. "Bekisting Kolom") over generic ones (e.g. "Bekisting")
    const allTasks: { cat: string; group: string; task: string; priority: number }[] = [];

    for (const cat of filteredHierarchy) {
        for (const group of cat.groups) {
            for (const task of group.tasks) {
                // Priority Score: longer task name = higher priority
                // Also give slight boost to exact phrase match potential
                allTasks.push({
                    cat: cat.category,
                    group: group.name,
                    task: task,
                    priority: task.length
                });
            }
        }
    }

    // Sort by length of task name (descending)
    allTasks.sort((a, b) => b.priority - a.priority);

    // PASS 1: Exact Task Name Match (Full Phrase Check)
    const matches: { cat: string; group: string; task: string; priority: number; index: number; contextScore: number }[] = [];

    for (const item of allTasks) {
        const taskName = item.task.toLowerCase().replace(/_/g, ' ');
        // Use indexOf to find position
        const idx = normalizedInput.indexOf(taskName);
        if (idx !== -1) {
            // TIE BREAKING: Give bonus if category or group name exists in input
            const catMatch = normalizedInput.includes(item.cat.toLowerCase()) ? 1 : 0;
            const groupMatch = normalizedInput.includes(item.group.toLowerCase()) ? 1 : 0;

            // Context Position Bonus: Prioritize groups found EARLY in the string (tags)
            let posBonus = 0;
            if (groupMatch) {
                const groupIdx = normalizedInput.indexOf(item.group.toLowerCase());
                // NUCLEAR FIX: If the group is at index 0 (Tag), give it massive priority
                if (groupIdx === 0) {
                    posBonus = 10;
                } else {
                    // Regular decay for later positions
                    posBonus = 1 - (groupIdx / 10000);
                }
            }

            matches.push({ ...item, index: idx, contextScore: catMatch + groupMatch + posBonus });
        }
    }

    if (matches.length > 0) {
        // Sort matches: 
        // 1. Higher context score (prioritize matches backed by early Group Context)
        // 2. Earlier index (prioritize keywords at start)
        // 3. Longer length
        matches.sort((a, b) => {
            // Use epsilon for float comparison safety, though simple subtraction works for sort
            if (Math.abs(b.contextScore - a.contextScore) > 0.0001) return b.contextScore - a.contextScore;
            if (a.index !== b.index) return a.index - b.index;
            return b.priority - a.priority;
        });

        return `${matches[0].cat} / ${matches[0].group} / ${matches[0].task}`;
    }

    // PASS 2: Token-based Matching
    // We still use tokens for fuzzy matching if full phrase fails, but check sorted tasks first
    const tokens = normalizedInput.split(/[,;\s]+/).filter(t => t.length > 2 && !['work', 'name', 'select', 'building', 'date'].includes(t)); // Ignore common placeholders

    for (const token of tokens) {
        const escapedToken = escapeRegExp(token);
        const regex = new RegExp(`\\b${escapedToken}\\b`, 'i');

        // Check Task Names (Sorted)
        for (const item of allTasks) {
            if (regex.test(item.task.toLowerCase())) {
                return `${item.cat} / ${item.group} / ${item.task}`;
            }
        }

        // Check Group Names
        for (const cat of filteredHierarchy) {
            for (const group of cat.groups) {
                if (regex.test(group.name.toLowerCase())) {
                    return `${cat.category} / ${group.name} / ${group.tasks[0] || ''}`; // Default to first task if group matches
                }
            }
        }

        // Check Category Names
        for (const cat of filteredHierarchy) {
            if (regex.test(cat.category.toLowerCase())) {
                return `${cat.category} / ${cat.groups[0]?.name || ''} / ${cat.groups[0]?.tasks[0] || ''}`;
            }
        }
    }

    return '';
}

export function createGpsExif(lat: number, lon: number): string {
    const latDeg = Math.floor(Math.abs(lat));
    const latMin = Math.floor((Math.abs(lat) - latDeg) * 60);
    const latSec = ((Math.abs(lat) - latDeg) * 60 - latMin) * 60;

    const lonDeg = Math.floor(Math.abs(lon));
    const lonMin = Math.floor((Math.abs(lon) - lonDeg) * 60);
    const lonSec = ((Math.abs(lon) - lonDeg) * 60 - lonMin) * 60;

    const gpsIfd: any = {};
    gpsIfd[piexif.GPSIFD.GPSVersionID] = [2, 2, 0, 0];
    gpsIfd[piexif.GPSIFD.GPSLatitudeRef] = lat >= 0 ? "N" : "S";
    gpsIfd[piexif.GPSIFD.GPSLatitude] = [[latDeg, 1], [latMin, 1], [Math.round(latSec * 100), 100]];
    gpsIfd[piexif.GPSIFD.GPSLongitudeRef] = lon >= 0 ? "E" : "W";
    gpsIfd[piexif.GPSIFD.GPSLongitude] = [[lonDeg, 1], [lonMin, 1], [Math.round(lonSec * 100), 100]];

    const exifObj = { "GPS": gpsIfd };
    return piexif.dump(exifObj);
}
export function getBadgeColor(groupName: string, isSelected?: boolean): string {
    if (isSelected) return 'bg-white/20 border-white/20 text-white';

    const name = groupName.toLowerCase();

    // Structural Elements (Professional Palette)
    if (name.includes('footplat')) return 'bg-indigo-50 text-indigo-600 border-indigo-100';
    if (name.includes('tie beam')) return 'bg-sky-50 text-sky-600 border-sky-100';
    if (name.includes('kolom')) return 'bg-slate-50 text-slate-600 border-slate-100';
    if (name.includes('balok')) return 'bg-violet-50 text-violet-600 border-violet-100';
    if (name.includes('pelat')) return 'bg-rose-50 text-rose-600 border-rose-100';
    if (name.includes('ring balok')) return 'bg-emerald-50 text-emerald-600 border-emerald-100';

    // General Categories
    if (name.includes('tanah') || name.includes('galian')) return 'bg-amber-50 text-amber-600 border-amber-100';
    if (name.includes('dinding')) return 'bg-orange-50 text-orange-600 border-orange-100';
    if (name.includes('lantai')) return 'bg-blue-50 text-blue-600 border-blue-100';
    if (name.includes('smkk') || name.includes('keselamatan')) return 'bg-red-50 text-red-600 border-red-100';

    return 'bg-slate-50 text-slate-500 border-slate-100';
}
