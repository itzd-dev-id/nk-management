import { NextRequest, NextResponse } from 'next/server';
import { extractGDriveId } from '@/lib/utils';
import { GoogleDriveService } from '@/lib/gdrive';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        const searchParams = req.nextUrl.searchParams;
        const outputPath = searchParams.get('outputPath');
        const filename = searchParams.get('filename') || 'nk-management.json';

        if (!outputPath || !session?.accessToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized or missing path' }, { status: 401 });
        }

        const folderId = extractGDriveId(outputPath);
        const gdrive = new GoogleDriveService(session.accessToken);

        const fileId = await gdrive.findFile(filename, folderId);
        if (!fileId) {
            return NextResponse.json({ success: true, data: null });
        }

        const content = await gdrive.getFileContent(fileId);
        return NextResponse.json({ success: true, data: JSON.parse(content) });

    } catch (error: any) {
        console.error('Config GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        const { outputPath, data, filename = 'nk-management.json' } = await req.json();

        if (!outputPath || !session?.accessToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized or missing path' }, { status: 401 });
        }

        const folderId = extractGDriveId(outputPath);
        const gdrive = new GoogleDriveService(session.accessToken);

        // Find all files with this name to prevent duplicates
        const response = await (gdrive as any).drive.files.list({
            q: `name = '${filename}' and '${folderId}' in parents and trashed = false`,
            fields: 'files(id)',
        });
        const files = response.data.files || [];
        const content = JSON.stringify(data, null, 2);

        if (files.length > 0) {
            await gdrive.updateFile(files[0].id, content, 'application/json');

            // Clean up extras if any
            if (files.length > 1) {
                for (let i = 1; i < files.length; i++) {
                    await (gdrive as any).drive.files.delete({ fileId: files[i].id });
                }
            }
        } else {
            await gdrive.uploadFile(Buffer.from(content), filename, 'application/json', folderId);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Config POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
