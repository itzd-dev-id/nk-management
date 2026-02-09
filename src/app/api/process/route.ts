import { NextRequest, NextResponse } from 'next/server';
import fs from 'node:fs/promises';
import path from 'node:path';
import { sanitizePath } from '@/lib/utils';

export async function POST(req: NextRequest) {
    try {
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
            return NextResponse.json({ success: false, error: 'Output path is required' }, { status: 400 });
        }

        // 1. Sanitize & Construct Target Directory
        // Folder Format: Building Name (Building Code) / Work Name
        const sanitizedBuilding = `${sanitizePath(buildingName)} (${buildingCode})`;
        const sanitizedWork = sanitizePath(workName);

        const targetDir = path.join(outputPath, sanitizedBuilding, sanitizedWork);

        // 2. Ensure Directory Exists
        await fs.mkdir(targetDir, { recursive: true });

        // 3. Determine Sequence Number
        // Scan directory for files starting with the same prefix to find the next number
        const existingFiles = await fs.readdir(targetDir);
        const extension = file.name.split('.').pop() || '';

        // Prefix to match: YYYY-MM-DD_WorkName_BuildingName_BuildingCode_Progress%_
        // For file names, we use underscores and replace subfolder slashes with dashes
        const fileWork = sanitizedWork.replace(/\s+/g, '_').replace(/\//g, '-');
        const fileBuilding = sanitizePath(buildingName).replace(/\s+/g, '_').replace(/\//g, '-');
        const fileCode = sanitizePath(buildingCode).replace(/\s+/g, '_');
        const progressPart = progress ? `${progress}%_` : '';
        const prefix = `${detectedDate}_${fileWork}_${fileBuilding}_${fileCode}_${progressPart}`;

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

        // 4. Save File
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        await fs.writeFile(finalPath, buffer);

        return NextResponse.json({
            success: true,
            finalName,
            path: finalPath
        });

    } catch (error: any) {
        console.error('Processing error:', error);
        return NextResponse.json({
            success: false,
            error: error.message || 'Internal server error'
        }, { status: 500 });
    }
}
