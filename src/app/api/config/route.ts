import { NextRequest, NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ success: false, error: 'Missing filename' }, { status: 400 });
        }

        // KV key format: config:buildings or config:works
        const key = `config:${filename.split('.')[0]}`;
        const data = await kv.get(key);

        return NextResponse.json({ success: true, data });

    } catch (error: any) {
        console.error('Config GET error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const { data, filename } = await req.json();

        if (!filename || data === undefined) {
            return NextResponse.json({ success: false, error: 'Missing filename or data' }, { status: 400 });
        }

        const key = `config:${filename.split('.')[0]}`;
        await kv.set(key, data);

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Config POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
