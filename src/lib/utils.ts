import { format } from 'date-fns';
import piexif from 'piexifjs';

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
    // For file names, we still use underscores for separation as requested
    // And we replace slashes (subfolders) with dashes in the filename
    // Split workName to clean category (remove leading numbers like "01. ")
    const workParts = workName.split(' / ');
    const categoryPart = workParts.length > 1 ? workParts[0].replace(/^\d+\.\s*/, '').trim() : null;
    const taskPart = workParts[workParts.length - 1].trim();

    const safeCategory = categoryPart ? categoryPart.replace(/\s+/g, '_') : '';
    const safeTask = taskPart.replace(/\s+/g, '_').replace(/\//g, '-');

    const fileWork = safeCategory ? `${safeCategory}_${safeTask}` : safeTask;
    const fileBuilding = sanitizePath(buildingName).replace(/\s+/g, '_').replace(/\//g, '-');
    const fileCode = sanitizePath(buildingCode).replace(/\s+/g, '_');
    const seqStr = sequence.toString().padStart(3, '0');

    // Format: 2026-02-01_Pekerjaan_Building_A_10%_001.jpg
    // Building name is now cleaned of redundant codes in buildings.json
    // If progress is empty, omit it
    const progressPart = progress ? `${progress}%_` : '';
    return `${dateStr}_${fileWork}_${fileBuilding}_${fileCode}_${progressPart}${seqStr}.${extension}`;
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

    let buildingPart = keyword;
    const separator = keyword.includes(',') ? ',' : (keyword.includes(';') ? ';' : null);

    if (separator) {
        buildingPart = keyword.split(separator)[0].trim();
    }

    // NEW PASS: Handle [Code] Name format from UI tags
    const badgeMatch = buildingPart.match(/^\[(.*?)\]\s*(.*)$/i);
    if (badgeMatch) {
        const codePart = badgeMatch[1].toLowerCase().trim();
        const namePart = badgeMatch[2].toLowerCase().trim();

        // Try code match first
        const b = buildings.find(b => b.code.toLowerCase() === codePart);
        if (b) return b;

        // Then name match
        const b2 = buildings.find(b => b.name.toLowerCase() === namePart);
        if (b2) return b2;
    }

    const normalizedInput = buildingPart.toLowerCase().trim();
    if (!normalizedInput) return null;

    // PASS 1: Try exact code match on full phrase
    const byExactCode = buildings.find(b => b.code.toLowerCase() === normalizedInput);
    if (byExactCode) return byExactCode;

    // PASS 2: Try exact name match on full phrase
    const byExactName = buildings.find(b => b.name.toLowerCase() === normalizedInput);
    if (byExactName) return byExactName;

    // PASS 3: Try partial name match on full phrase
    const byPartialName = buildings.find(b => b.name.toLowerCase().includes(normalizedInput));
    if (byPartialName) return byPartialName;

    // PASS 4: Fall back to individual word matching
    const terms = normalizedInput.replace(/[\[\]]/g, ' ').split(/\s+/).filter(Boolean);
    if (terms.length === 0) return null;

    for (const term of terms) {
        // For very short terms (1-3 chars), ONLY use exact match to avoid false positives
        const isShortTerm = term.length <= 3;

        // Try exact code match
        const byCode = buildings.find(b => b.code.toLowerCase() === term);
        if (byCode) return byCode;

        // Try exact name match
        const byName = buildings.find(b => b.name.toLowerCase() === term);
        if (byName) return byName;

        // For longer terms, try partial match with word boundary
        if (!isShortTerm) {
            const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
            const byPartial = buildings.find(b => wordBoundaryRegex.test(b.name));
            if (byPartial) return byPartial;
        }
    }

    return null;
}

export function detectWorkFromKeyword(
    keyword: string,
    hierarchy: { category: string; tasks: string[] }[],
    categoryFilter?: string
): string {
    if (!keyword) return '';

    let workPart = keyword;
    const separator = keyword.includes(',') ? ',' : (keyword.includes(';') ? ';' : null);

    if (separator) {
        const parts = keyword.split(separator);
        if (parts.length < 2) return ''; // No second part for work
        workPart = parts[1].trim();
    }

    const normalizedWorkPart = workPart.toLowerCase().replace(/_/g, ' ').trim();
    if (!normalizedWorkPart) return '';

    // Filter hierarchy if filter provided
    const filteredHierarchy = categoryFilter
        ? hierarchy.filter(h => h.category.toLowerCase() === categoryFilter.toLowerCase())
        : hierarchy;

    // PASS 1: Try exact match on full phrase
    for (const group of filteredHierarchy) {
        for (const task of group.tasks) {
            const taskNormalized = task.toLowerCase().replace(/_/g, ' ');
            if (taskNormalized === normalizedWorkPart) {
                return task;
            }
        }
    }

    // PASS 2: Try partial match on full phrase (must contain the entire search phrase)
    for (const group of filteredHierarchy) {
        for (const task of group.tasks) {
            const taskNormalized = task.toLowerCase().replace(/_/g, ' ');
            if (taskNormalized.includes(normalizedWorkPart)) {
                return task;
            }
        }
    }

    // PASS 3: Check if search phrase matches category
    for (const group of filteredHierarchy) {
        if (group.category.toLowerCase().includes(normalizedWorkPart)) {
            return group.tasks[0] || '';
        }
    }

    // PASS 4: Fall back to individual word matching (for queries like "tanah" or "batu")
    const terms = normalizedWorkPart.split(/\s+/).filter(Boolean);

    for (const term of terms) {
        // For very short terms (1-3 chars), ONLY use exact match to avoid false positives
        const isShortTerm = term.length <= 3;

        // Try exact match on individual word
        for (const group of filteredHierarchy) {
            for (const task of group.tasks) {
                const taskNormalized = task.toLowerCase().replace(/_/g, ' ');
                if (taskNormalized === term) {
                    return task;
                }
            }
        }

        // For longer terms, try partial match with word boundary
        if (!isShortTerm) {
            for (const group of filteredHierarchy) {
                for (const task of group.tasks) {
                    const taskNormalized = task.toLowerCase().replace(/_/g, ' ');
                    // Use word boundary regex to match whole words only
                    const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
                    if (wordBoundaryRegex.test(taskNormalized)) {
                        return task;
                    }
                }
            }

            // Try match in categories
            for (const group of filteredHierarchy) {
                const wordBoundaryRegex = new RegExp(`\\b${term}\\b`, 'i');
                if (wordBoundaryRegex.test(group.category.toLowerCase())) {
                    return group.tasks[0] || '';
                }
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
