export interface Building {
    code: string;
    name: string;
    index?: number;
}

export interface FileMetadata {
    id: string;
    file: File;
    originalName: string;
    newName: string;
    detectedDate: string; // YYYY-MM-DD
    status: 'pending' | 'compressing' | 'processing' | 'success' | 'error';
    error?: string;
    building: Building;
    workName: string;
    progress: string; // percentage string e.g., "10"
    sequence: number;
}

export interface ProcessingResult {
    fileName: string;
    success: boolean;
    error?: string;
    newPath?: string;
}
