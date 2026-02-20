import { format } from 'date-fns';
import piexif from 'piexifjs';
import exifr from 'exifr';

export function escapeRegExp(string: string): string {
    return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Build the keyword string for detection functions.
 * RULE: If the user has added manual tags, ONLY use tags (ignore filename entirely).
 * Filename is ONLY used as a fallback when there are NO tags.
 * This prevents long filenames from contaminating detection results.
 */
export function buildDetectionKeyword(tags: string[], fileName?: string): string {
    if (tags.length > 0) {
        return tags.join(', ');
    }
    return fileName || '';
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
            .replace(/[^a-zA-Z0-9_\-\.&]/g, '') // Remove other special chars, allow &
            .replace(/_+/g, '_');      // Collapse consecutive underscores
    };

    const safeCategory = sanitize(category);
    const safeGroup = sanitize(group);
    const safeTask = sanitize(task);
    const safeBuilding = sanitize(buildingName);
    const safeCode = sanitize(buildingCode);

    // Assemble parts: Category, Group, Task, Building, Code
    // Filter out empty parts
    const tempParts = [safeCategory, safeGroup, safeTask, safeBuilding, safeCode].filter(Boolean);

    // Remove duplicates recursively (e.g. if Task contains Group, or if they are identical)
    // "K3" and "K3" -> "K3"
    const parts: string[] = [];
    for (const part of tempParts) {
        // If the part is exactly the same as the LAST added part, skip it (e.g., Task == Group, or Building == Code)
        if (parts.length > 0 && parts[parts.length - 1].toLowerCase() === part.toLowerCase()) {
            continue;
        }
        // If the part is already contained as a standalone word in the previous part, skip it
        // e.g. "Pengecoran Kolom" then "Kolom", we don't need the second "Kolom"
        // But we must be careful: if previous is "Struktur Bawah" and current is "Tie Beam", keep both.
        // User example: SMKK_Keselamatan_Toolbox_Talks_K3. If group is "Keselamatan" and task is "Toolbox Talks K3"
        parts.push(part);
    }

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

    const phrases = keyword.split(/[,;]/).map(p => p.trim()).filter(Boolean);
    if (phrases.length === 0) return null;

    let bestMatch = null;
    let maxScore = 0;

    for (let pIndex = 0; pIndex < phrases.length; pIndex++) {
        const phrase = phrases[pIndex];
        const isTagPhrase = (phrases.length > 1 && pIndex < phrases.length - 1);

        let score = 0;
        let match = null;

        // PASS 0: [Code] Name format (highest priority)
        const badgeMatch = phrase.match(/^\[(.*?)\]\s*(.*)$/i);
        if (badgeMatch) {
            const codePart = badgeMatch[1].toLowerCase().trim();
            const b = buildings.find(b => b.code.toLowerCase() === codePart);
            if (b) { score += 1000; match = b; }
        }

        if (!match) {
            const normalizedPhrase = phrase.toLowerCase().replace(/_/g, ' ').trim();
            const allTokens = normalizedPhrase.replace(/[\[\]]/g, ' ').split(/[\s]+/).filter(Boolean);

            // PASS 1: Exact Code Match
            for (const token of allTokens) {
                const b = buildings.find(b => b.code.toLowerCase() === token);
                if (b) { score += 500; match = match || b; }
            }

            // PASS 2: Exact Name Match
            if (!match) {
                const b = buildings.find(b => b.name.toLowerCase() === normalizedPhrase);
                if (b) { score += 300; match = b; }
            }

            // PASS 3: Partial Name Match (Word Boundary)
            if (!match) {
                for (const token of allTokens) {
                    if (token.length <= 2) continue;
                    const escapedTerm = escapeRegExp(token);
                    const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');
                    const b = buildings.find(b => regex.test(b.name));
                    if (b) { score += 100; match = match || b; }
                }
            }
        }

        if (match && score > 0) {
            // Prioritize manual tags over the filename
            if (isTagPhrase) score += 10000;

            if (score > maxScore) {
                maxScore = score;
                bestMatch = match;
            }
        }
    }

    return bestMatch;
}

export function detectWorkFromKeyword(
    keyword: string,
    hierarchy: { category: string; groups: { name: string; tasks: string[] }[] }[],
    categoryFilter?: string
): string {
    if (!keyword) return '';

    // Split by comma. Early phrases are manual tags, the last phrase is usually the generated filename.
    const phrases = keyword.split(',').map(s => s.trim()).filter(Boolean);

    const aliases: { [key: string]: string } = {
        'plat': 'pelat',
        'plafond': 'plafon',
        'ac': 'hvac',
    };

    // Filter hierarchy if filter provided
    const filteredHierarchy = categoryFilter
        ? hierarchy.filter(h => h.category.toLowerCase() === categoryFilter.toLowerCase())
        : hierarchy;

    const allTasks: { cat: string; group: string; task: string }[] = [];
    for (const cat of filteredHierarchy) {
        for (const group of cat.groups) {
            for (const task of group.tasks) {
                allTasks.push({
                    cat: cat.category,
                    group: group.name,
                    task: task
                });
            }
        }
    }

    let bestMatch: any = null;
    let maxScore = 0;

    for (let pIndex = 0; pIndex < phrases.length; pIndex++) {
        let cleanPhrase = phrases[pIndex].toLowerCase().replace(/_/g, ' ').replace(/[\[\]]/g, ' ');
        for (const [alias, realName] of Object.entries(aliases)) {
            cleanPhrase = cleanPhrase.replace(new RegExp(`\\b${alias}\\b`, 'gi'), realName);
        }

        const tokens = cleanPhrase.split(/[\s\/]+/).filter(t => t.length > 2 && !['work', 'name', 'select', 'building', 'date', 'jpeg', 'jpg', 'png'].includes(t));
        if (tokens.length === 0) continue;

        // Prioritize manual tags (all phrases except the last one, which is the filename)
        const isTagPhrase = (phrases.length > 1 && pIndex < phrases.length - 1);

        for (const item of allTasks) {
            let score = 0;

            const catStr = item.cat.toLowerCase();
            const groupStr = item.group.toLowerCase();
            const taskStr = item.task.toLowerCase();

            // 1. Explicit path logic (e.g. "kolom/bekisting")
            if (phrases[pIndex].includes('/')) {
                const parts = phrases[pIndex].split('/').map(s => s.trim().toLowerCase());
                if (parts.length >= 2) {
                    const parent = aliases[parts[parts.length - 2]] || parts[parts.length - 2];
                    const child = aliases[parts[parts.length - 1]] || parts[parts.length - 1];

                    if ((groupStr === parent || groupStr.includes(parent)) && (taskStr === child || taskStr.includes(child))) {
                        score += 1000;
                    }
                }
            }

            // 2. Exact Token Matches
            const catTokens = catStr.split(/[\s\/]+/).filter(Boolean);
            const groupTokens = groupStr.split(/[\s\/]+/).filter(Boolean);
            const taskTokens = taskStr.split(/[\s\/]+/).filter(Boolean);

            for (const token of tokens) {
                if (taskTokens.includes(token)) score += 30;
                else if (taskTokens.some(t => t.includes(token))) score += 15;

                if (groupTokens.includes(token)) score += 20;
                else if (groupTokens.some(t => t.includes(token))) score += 10;

                if (catTokens.includes(token)) score += 5;
            }

            // 3. Implicit Grouping (e.g. "kolom bekisting")
            const groupIdx = cleanPhrase.indexOf(groupStr);
            const taskIdx = cleanPhrase.indexOf(taskStr);
            if (groupIdx !== -1 && taskIdx !== -1 && groupIdx < taskIdx) {
                score += 500;
            }

            // 4. Exact phrase match
            if (cleanPhrase === taskStr) score += 200;
            if (cleanPhrase === groupStr) score += 100;

            if (score > 0) {
                // MASSIVE boost if this phrase is a manual tag (not the filename)
                if (isTagPhrase) {
                    score += 10000;
                }

                if (score > maxScore) {
                    maxScore = score;
                    bestMatch = item;
                } else if (score === maxScore && bestMatch) {
                    if (item.task.length < bestMatch.task.length) {
                        bestMatch = item;
                    }
                }
            }
        }
    }

    if (bestMatch) {
        return `${bestMatch.cat} / ${bestMatch.group} / ${bestMatch.task}`;
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
