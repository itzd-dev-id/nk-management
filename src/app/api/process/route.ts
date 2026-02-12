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
            showBuildingIndex = true
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

        // User requested to remove indices from building folder name
        const buildingFolder = `${sanitizedBuildingName} (${sanitizedBuildingCode})`;

        const extension = file.name.split('.').pop() || '';

        // Filename parts - KEEP underscores for filenames
        // We only use the task name part for the filename to match the preview
        const fileWork = sanitizePath(taskPart).replace(/\s+/g, '_').replace(/\//g, '-');
        const fileBuilding = sanitizePath(buildingName).replace(/\s+/g, '_').replace(/\//g, '-');
        const fileCode = sanitizePath(buildingCode).replace(/\s+/g, '_');

        const progressPart = progress ? `${progress}%_` : '';
        const prefix = `${detectedDate}_${fileWork}_${fileBuilding}_${fileCode}_${progressPart}`;

        const folderId = extractGDriveId(outputPath);
        console.log('API: Preparing GDrive upload under Folder ID:', folderId);

        // GOOGLE DRIVE LOGIC
        const gdrive = new GoogleDriveService(session.accessToken);

        // New Condensed Hierarchy: [Building Folder] -> [Category | Task]
        const folderParts = [];
        folderParts.push(buildingFolder);

        const combinedTaskFolder = cleanCategory
            ? `${cleanCategory} | ${taskPart.trim()}`
            : taskPart.trim();

        folderParts.push(combinedTaskFolder);

        const targetFolderId = await gdrive.ensureFolderStructure(folderParts, folderId);
        console.log('API: Target Folder ID resolved:', targetFolderId);

        // 2. Calculate Sequence
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
