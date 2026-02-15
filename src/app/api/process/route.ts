import { NextRequest, NextResponse } from 'next/server';
import { sanitizePath, extractGDriveId } from '@/lib/utils';
import { GoogleDriveService } from '@/lib/gdrive';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        const formData = await req.formData();
        const file = formData.get('file') as File;
        const metadataStr = formData.get('metadata') as string;

        if (!file || !metadataStr) {
            return NextResponse.json({ success: false, error: 'Missing file or metadata' }, { status: 400 });
        }

        const metadata = JSON.parse(metadataStr);
        console.log('API: Processing file:', file.name, 'with metadata:', metadata);

        const {
            detectedDate,
            workName,
            buildingCode,
            buildingName,
            buildingIndex,
            progress,
            outputPath,
            showBuildingIndex = true,
            isTimestamp = false
        } = metadata;

        if (!outputPath) {
            console.error('API: Missing Folder ID');
            return NextResponse.json({ success: false, error: 'Google Drive Folder ID is required' }, { status: 400 });
        }

        if (!session?.accessToken) {
            console.error('API: No session access token');
            return NextResponse.json({ success: false, error: 'Silakan login dengan Google terlebih dahulu' }, { status: 401 });
        }

        const sanitizedWork = sanitizePath(workName);

        // Split workName into category and task
        const workParts = workName.split(' / ');
        const categoryPart = workParts.length > 1 ? workParts[0] : null;
        const taskPart = workParts[workParts.length - 1];

        // Clean up category: Remove leading numbers and dots (e.g., "01. Persiapan" -> "Persiapan")
        let cleanCategory = categoryPart ? categoryPart.replace(/^\d+\.\s*/, '').trim() : null;

        const sanitizedBuildingName = sanitizePath(buildingName).replace(/_/g, ' ');
        const sanitizedBuildingCode = sanitizePath(buildingCode);
        const buildingFolder = `${sanitizedBuildingName} (${sanitizedBuildingCode})`;

        // User requested to remove indices from building folder name
        const extension = file.name.split('.').pop() || '';

        const folderId = extractGDriveId(outputPath);
        console.log('API: Preparing GDrive upload under Folder ID:', folderId);



        // GOOGLE DRIVE LOGIC
        const gdrive = new GoogleDriveService(session.accessToken);

        // New Requested Hierarchy: [Date] -> [Building Name]
        const folderParts = [];

        // 1. Date Folder
        folderParts.push(detectedDate);

        // 2. Building Folder
        folderParts.push(buildingFolder);

        // 3. Optional Timestamp Subfolder
        if (isTimestamp) {
            folderParts.push("Timestamp");
        }

        const targetFolderId = await gdrive.ensureFolderStructure(folderParts, folderId);
        console.log('API: Target Folder ID resolved:', targetFolderId);

        // 3. Filename Format: Category_Work_Index.ext
        // Clean category part - remove numbers if present (already done in cleanCategory)
        // If no category, just use taskPart
        const safeCategory = cleanCategory ? cleanCategory.replace(/\s+/g, '_') : '';
        const safeGroup = categoryPart ? categoryPart.replace(/^\d+\.\s*/, '').replace(/\s+/g, '_') : '';
        let safeTask = taskPart.trim().replace(/\s+/g, '_').replace(/\//g, '-');

        // Fix: Remove redundant Group Name if Task Name already contains it (match utils.ts logic)
        // e.g. Group="Kolom", Task="Bekisting Kolom" -> Result="Struktur_Bekisting-Kolom" (instead of "Struktur_Kolom_Bekisting-Kolom")
        if (safeGroup && safeTask.toLowerCase().includes(safeGroup.toLowerCase())) {
            // If task already has group name, we don't need to add it again.
        }

        const safeBuilding = sanitizedBuildingName.replace(/\s+/g, '_');
        const safeCode = sanitizedBuildingCode.replace(/\s+/g, '_');
        const progressPart = progress ? `${progress}%_` : '';

        // Remove detectedDate from prefix
        const prefix = `${safeCategory ? safeCategory + '_' : ''}${safeTask}_${safeBuilding}_${safeCode}_${progressPart}`;

        // 4. Calculate Sequence (Index)
        const sequence = await gdrive.getNextSequence(targetFolderId, prefix, extension);
        const finalName = `${prefix}${sequence}.${extension}`;

        console.log('API: Uploading file as:', finalName);
        const uploadRes = await gdrive.uploadFile(file, finalName, targetFolderId, file.type);

        if (uploadRes) {
            return NextResponse.json({ success: true, fileId: uploadRes.id, finalName });
        } else {
            return NextResponse.json({ success: false, error: 'Upload failed' }, { status: 500 });
        }

    } catch (error: any) {
        console.error('API: Process Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
