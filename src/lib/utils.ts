import { format } from 'date-fns';

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
    const fileWork = sanitizePath(workName).replace(/\s+/g, '_').replace(/\//g, '-');
    const fileBuilding = sanitizePath(buildingName).replace(/\s+/g, '_').replace(/\//g, '-');
    const fileCode = sanitizePath(buildingCode).replace(/\s+/g, '_');
    const seqStr = sequence.toString().padStart(3, '0');

    // Format: 2026-02-01_Pekerjaan_Pemancangan_Rusun_Guru_A_10%_001.jpg
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

export function extractGDriveId(idOrUrl: string): string {
    if (!idOrUrl) return '';
    // If it's a URL, extract the ID
    const match = idOrUrl.match(/[-\w]{25,}/);
    return match ? match[0] : idOrUrl;
}

export function detectBuildingFromKeyword(keyword: string, buildings: any[]): any | null {
    if (!keyword) return null;
    const terms = keyword.toLowerCase().split(/[\s,;|]+/).filter(Boolean);

    for (const term of terms) {
        // Try exact code match
        const byCode = buildings.find(b => b.code.toLowerCase() === term);
        if (byCode) return byCode;

        // Try exact name match
        const byName = buildings.find(b => b.name.toLowerCase() === term);
        if (byName) return byName;

        // Try partial name match
        const byPartial = buildings.find(b => b.name.toLowerCase().includes(term));
        if (byPartial) return byPartial;
    }

    return null;
}

export function detectWorkFromKeyword(keyword: string, hierarchy: { category: string; tasks: string[] }[]): string {
    if (!keyword) return '';
    const terms = keyword.toLowerCase().split(/[\s,;|]+/).filter(Boolean);

    for (const term of terms) {
        const normalizedTerm = term.replace(/_/g, ' ');

        // Try exact match in tasks
        for (const group of hierarchy) {
            for (const task of group.tasks) {
                if (task.toLowerCase() === normalizedTerm || task.toLowerCase().replace(/_/g, ' ') === normalizedTerm) return task;
            }
        }

        // Try partial match in tasks
        for (const group of hierarchy) {
            for (const task of group.tasks) {
                const taskLower = task.toLowerCase().replace(/_/g, ' ');
                if (taskLower.includes(normalizedTerm)) return task;
            }
        }

        // Try match in categories
        for (const group of hierarchy) {
            if (group.category.toLowerCase().includes(normalizedTerm)) {
                return group.tasks[0] || '';
            }
        }
    }

    return '';
}
