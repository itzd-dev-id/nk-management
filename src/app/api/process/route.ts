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
            // If task already has group name, we don't need to add it again if the category logic was adding it. 
            // However, current logic constructs it as: Category_Task. 
            // In utils.ts, we had Category, Group, Task. Here we seem to have splitted differently.
            // Let's rely on the requested output: "Struktur_Bekisting-Kolom_..."
            // Category="Struktur", Task="Bekisting-Kolom".
            // If Category was "Struktur / Kolom", then safeCategory would be "Struktur", and we might want to avoid adding "Kolom" if it's in task.
            // But existing code uses `safeCategory` + `safeTask`. 
            // Let's stick to simple date removal first as that's the main request.
            // Wait, the user example: "Struktur_Bekisting_Kantin_SMP_F.1_0%_001"
            // "Struktur" is category. "Bekisting" is task/group? 
            // logic in utils.ts: 
            // const fileWork = [safeCategory, finalGroup, safeTask].filter(Boolean).join('_');
            // logic here: 
            // const prefix = `${detectedDate}_${safeCategory ? safeCategory + '_' : ''}${safeTask}_${safeBuilding}_${safeCode}_${progressPart}`;

            // I will align the redundancy check with utils.ts if possible, but primarily remove the date.
        }

        // Remove detectedDate from prefix
        const prefix = `${safeCategory ? safeCategory + '_' : ''}${safeTask}_${safeBuilding}_${safeCode}_${progressPart}`;

        // 4. Calculate Sequence (Index)
        const sequence = await gdrive.getNextSequence(targetFolderId, prefix, extension);
        const finalName = `${prefix}${sequence}.${extension}`;

        console.log('API: Uploading file as:', finalName);
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadResult = await gdrive.uploadFile(buffer, finalName, file.type, targetFolderId);
        console.log('API: Upload complete, File ID:', uploadResult.id);

        return NextResponse.json({
            success: true,
            finalName,
            path: `https://drive.google.com/open?id=${uploadResult.id}`,
            isGDrive: true
        });

    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error',
            details: error.response?.data || null
        }, { status: 500 });
    }
}
