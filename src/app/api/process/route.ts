import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sanitizePath } from '@/lib/utils';
import { GoogleDriveService } from '@/lib/gdrive';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

// Helper to check if a path is a Google Drive ID (usually a long alphanumeric string)
// Local paths usually start with / (macOS/Linux) or C:\ (Windows)
function isGDriveId(pathStr: string): boolean {
    // Simple heuristic: Google Drive IDs are typically ~33 characters and don't contain path separators
    return !pathStr.startsWith('/') && !pathStr.includes('\\') && pathStr.length > 20;
}

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
        const {
            detectedDate,
            workName,
            buildingCode,
            buildingName,
            progress,
            outputPath
        } = metadata;

        if (!outputPath) {
            return NextResponse.json({ success: false, error: 'Output path or Folder ID is required' }, { status: 400 });
        }

        const extension = file.name.split('.').pop() || '';
        const sanitizedWork = sanitizePath(workName);
        const sanitizedBuilding = `${sanitizePath(buildingName)} (${buildingCode})`;

        // File name parts for both Local and GDrive
        const fileWork = sanitizedWork.replace(/\s+/g, '_').replace(/\//g, '-');
        const fileBuilding = sanitizePath(buildingName).replace(/\s+/g, '_').replace(/\//g, '-');
        const fileCode = sanitizePath(buildingCode).replace(/\s+/g, '_');
        const progressPart = progress ? `${progress}%_` : '';
        const prefix = `${detectedDate}_${fileWork}_${fileBuilding}_${fileCode}_${progressPart}`;

        if (isGDriveId(outputPath)) {
            // GOOGLE DRIVE LOGIC
            if (!session?.accessToken) {
                return NextResponse.json({ success: false, error: 'Silakan login dengan Google terlebih dahulu' }, { status: 401 });
            }

            const gdrive = new GoogleDriveService(session.accessToken);

            // 1. Ensure Folder Structure: Building / Work
            const folderParts = [sanitizedBuilding, sanitizedWork];
            const targetFolderId = await gdrive.ensureFolderStructure(folderParts, outputPath);

            // 2. Determine Name (Note: Checking for duplicates on GDrive is slower, 
            // but we can skip it for initial implementation or implement findFile similar to findFolder)
            // For now, let's use a timestamp or random suffix if we want to avoid collisions,
            // or just let GDrive handle it (it allows duplicate names). 
            // To maintain sequence numbering logic, we'd need to list files in that folder.

            // Simplified sequence (optional: implement listing if sequence is critical for Drive too)
            const finalName = `${prefix}${Date.now().toString().slice(-3)}.${extension}`;

            // 3. Upload
            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            const uploadResult = await gdrive.uploadFile(buffer, finalName, file.type, targetFolderId);

            return NextResponse.json({
                success: true,
                finalName,
                path: `https://drive.google.com/open?id=${uploadResult.id}`,
                isGDrive: true
            });

        } else {
            // LOCAL FILE SYSTEM LOGIC
            const targetDir = path.join(outputPath, sanitizedBuilding, sanitizedWork);
            await fs.mkdir(targetDir, { recursive: true });

            const existingFiles = await fs.readdir(targetDir);
            let maxSeq = 0;
            const seqRegex = new RegExp(`^${prefix}(\\d+)\\.${extension}$`, 'i');

            for (const f of existingFiles) {
                const match = f.match(seqRegex);
                if (match) {
                    const seq = parseInt(match[1], 10);
                    if (seq > maxSeq) maxSeq = seq;
                }
            }

            const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
            const finalName = `${prefix}${nextSeq}.${extension}`;
            const finalPath = path.join(targetDir, finalName);

            const arrayBuffer = await file.arrayBuffer();
            const buffer = Buffer.from(arrayBuffer);
            await fs.writeFile(finalPath, buffer);

            return NextResponse.json({
                success: true,
                finalName,
                path: finalPath,
                isGDrive: false
            });
        }

    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
