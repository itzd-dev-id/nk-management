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
