import { NextRequest, NextResponse } from 'next/server';
import { extractGDriveId } from '@/lib/utils';
import { GoogleDriveService } from '@/lib/gdrive';
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/route";

const CONFIG_FILENAME = 'nk-management.json';

export async function GET(req: NextRequest) {
    try {
        const session = await getServerSession(authOptions) as any;
        const searchParams = req.nextUrl.searchParams;
        const outputPath = searchParams.get('outputPath');

        if (!outputPath || !session?.accessToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized or missing path' }, { status: 401 });
        }

        const folderId = extractGDriveId(outputPath);
        const gdrive = new GoogleDriveService(session.accessToken);

        const fileId = await gdrive.findFile(CONFIG_FILENAME, folderId);
        if (!fileId) {
            return NextResponse.json({ success: true, data: { buildings: [], works: [] } });
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
        const { outputPath, data } = await req.json();

        if (!outputPath || !session?.accessToken) {
            return NextResponse.json({ success: false, error: 'Unauthorized or missing path' }, { status: 401 });
        }

        const folderId = extractGDriveId(outputPath);
        const gdrive = new GoogleDriveService(session.accessToken);

        const fileId = await gdrive.findFile(CONFIG_FILENAME, folderId);
        const content = JSON.stringify(data, null, 2);

        if (fileId) {
            await gdrive.updateFile(fileId, content, 'application/json');
        } else {
            await gdrive.uploadFile(Buffer.from(content), CONFIG_FILENAME, 'application/json', folderId);
        }

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Config POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
