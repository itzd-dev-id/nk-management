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
    // workName format: "Category / Group / Task" or "Category / Task"
    const workParts = workName.split(' / ');
    const categoryPart = workParts.length > 0 ? workParts[0].replace(/^\d+\.\s*/, '').trim() : '';
    const groupPart = workParts.length > 2 ? workParts[1].trim() : '';
    const taskPart = workParts[workParts.length - 1].trim();

    const safeCategory = categoryPart.replace(/\s+/g, '_');
    const safeGroup = groupPart ? groupPart.replace(/\s+/g, '_') : '';
    const safeTask = taskPart.replace(/\s+/g, '_').replace(/\//g, '-');

    // Fix: Token-based deduplication to prevent "K3_K3"
    // 1. Combine all parts
    const rawParts = [safeCategory, safeGroup, safeTask].filter(Boolean).join('_');

    // 2. Split into tokens, remove duplicates, and rejoin
    const tokens = rawParts.split(/[_-]/).filter(Boolean);
    const uniqueTokens = tokens.filter((t, index) => {
        const lowerT = t.toLowerCase();
        // Keep first occurrence of each word/token only
        return tokens.findIndex(x => x.toLowerCase() === lowerT) === index;
    });

    const fileWork = uniqueTokens.join('_');
    const fileBuilding = sanitizePath(buildingName).replace(/\s+/g, '_').replace(/\//g, '-');
    const fileCode = sanitizePath(buildingCode).replace(/\s+/g, '_');
    const seqStr = sequence.toString().padStart(3, '0');

    const progressPart = progress ? `${progress}%_` : '';
    // Fix: Remove dateStr from start of filename as requested
    return `${fileWork}_${fileBuilding}_${fileCode}_${progressPart}${seqStr}.${extension}`;
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
    for (const item of allTasks) {
        const taskName = item.task.toLowerCase().replace(/_/g, ' ');
        // Use includes but prioritize longer matches because of the sort order
        if (normalizedInput.includes(taskName)) {
            return `${item.cat} / ${item.group} / ${item.task}`;
        }
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
