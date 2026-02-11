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
    const fileCode = sanitizePath(buildingCode).replace(/\s+/g, '_');
    const seqStr = sequence.toString().padStart(3, '0');

    // Format: 2026-02-01_Pekerjaan_C.1_10%_001.jpg
    // Building code is unique and building name already contains the code, so we only use code
    // If progress is empty, omit it
    const progressPart = progress ? `${progress}%_` : '';
    return `${dateStr}_${fileWork}_${fileCode}_${progressPart}${seqStr}.${extension}`;
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

    let buildingPart = keyword;
    const separator = keyword.includes(',') ? ',' : (keyword.includes(';') ? ';' : null);

    if (separator) {
        buildingPart = keyword.split(separator)[0].trim();
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
    const terms = normalizedInput.split(/\s+/).filter(Boolean);
    if (terms.length === 0) return null;

    for (const term of terms) {
        // For very short terms (1-3 chars), ONLY use exact match to avoid false positives
        // e.g., "A" should not match "Kursi Guru" just because "a" appears in "Guru"
        const isShortTerm = term.length <= 3;

        // Try exact code match
        const byCode = buildings.find(b => b.code.toLowerCase() === term);
        if (byCode) return byCode;

        // Try exact name match
        const byName = buildings.find(b => b.name.toLowerCase() === term);
        if (byName) return byName;

        // For longer terms, try partial match with word boundary
        if (!isShortTerm) {
            // Use word boundary regex to ensure we match whole words, not substrings
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
