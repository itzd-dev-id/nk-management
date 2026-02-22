import { NextRequest, NextResponse } from 'next/server';
import { sanitizePath, extractGDriveId, generateNewName } from '@/lib/utils';
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

        const sanitizedBuildingName = sanitizePath(buildingName).replace(/_/g, ' ');
        const sanitizedBuildingCode = sanitizePath(buildingCode);
        const buildingFolder = `${sanitizedBuildingName} (${sanitizedBuildingCode})`;

        // User requested to remove indices from building folder name
        const videoExtensions = ['mp4', 'mov', 'avi', 'mkv', 'wmv', 'flv', 'webm'];
        const fileExt = (file.name.split('.').pop() || '').toLowerCase();
        const isVideo = file.type.startsWith('video/') || videoExtensions.includes(fileExt);
        const extension = isVideo ? 'mp4' : fileExt;

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

        // 3. Filename Format: Delegate entirely to generateNewName to match frontend exactly
        const dummySequenceName = generateNewName(
            detectedDate,
            workName,
            buildingName,
            buildingCode,
            progress,
            1, // Sequence 1
            extension
        );

        // Extract the prefix by removing the sequence and extension (e.g., "_001.mp4")
        const prefixMatch = dummySequenceName.match(/^(.*_)001\.[^.]+$/);
        const prefix = prefixMatch ? prefixMatch[1] : dummySequenceName.replace(/001\.[^.]+$/, '');

        // 4. Calculate Sequence (Index)
        const sequence = await gdrive.getNextSequence(targetFolderId, prefix, extension);
        const finalName = `${prefix}${sequence}.${extension}`;

        console.log('API: Uploading file as:', finalName);

        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const uploadRes = await gdrive.uploadFile(buffer, finalName, file.type, targetFolderId);

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
