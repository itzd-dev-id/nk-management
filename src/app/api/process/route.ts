import { NextRequest, NextResponse } from 'next/server';
import { sanitizePath } from '@/lib/utils';
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
            progress,
            outputPath
        } = metadata;

        if (!outputPath) {
            console.error('API: Missing Folder ID');
            return NextResponse.json({ success: false, error: 'Google Drive Folder ID is required' }, { status: 400 });
        }

        if (!session?.accessToken) {
            console.error('API: No session access token');
            return NextResponse.json({ success: false, error: 'Silakan login dengan Google terlebih dahulu' }, { status: 401 });
        }

        const extension = file.name.split('.').pop() || '';
        const sanitizedWork = sanitizePath(workName);
        const sanitizedBuilding = `${sanitizePath(buildingName)} (${buildingCode})`;

        const fileWork = sanitizedWork.replace(/\s+/g, '_').replace(/\//g, '-');
        const fileBuilding = sanitizePath(buildingName).replace(/\s+/g, '_').replace(/\//g, '-');
        const fileCode = sanitizePath(buildingCode).replace(/\s+/g, '_');
        const progressPart = progress ? `${progress}%_` : '';
        const prefix = `${detectedDate}_${fileWork}_${fileBuilding}_${fileCode}_${progressPart}`;

        console.log('API: Preparing GDrive upload under Folder ID:', outputPath);
        // GOOGLE DRIVE LOGIC
        const gdrive = new GoogleDriveService(session.accessToken);

        console.log('API: Ensuring folder structure...');
        const folderParts = [sanitizedBuilding, sanitizedWork];
        const targetFolderId = await gdrive.ensureFolderStructure(folderParts, outputPath);
        console.log('API: Target Folder ID resolved:', targetFolderId);

        const finalName = `${prefix}${Date.now().toString().slice(-3)}.${extension}`;

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
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
