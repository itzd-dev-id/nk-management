import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function POST(req: NextRequest) {
    try {
        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Supabase not initialized' }, { status: 500 });
        }

        const saveDirPath = path.join(process.cwd(), 'save');
        const results = [];

        // Migrate buildings.json
        const buildingsPath = path.join(saveDirPath, 'buildings.json');
        if (fs.existsSync(buildingsPath)) {
            const buildingsData = JSON.parse(fs.readFileSync(buildingsPath, 'utf-8'));
            const { error: bError } = await supabase
                .from('config')
                .upsert({ key: 'buildings', value: buildingsData }, { onConflict: 'key' });

            if (bError) throw bError;
            results.push('Gedung (buildings.json) berhasil dimigrasi');
        }

        // Migrate works.json
        const worksPath = path.join(saveDirPath, 'works.json');
        if (fs.existsSync(worksPath)) {
            const worksData = JSON.parse(fs.readFileSync(worksPath, 'utf-8'));
            const { error: wError } = await supabase
                .from('config')
                .upsert({ key: 'works', value: worksData }, { onConflict: 'key' });

            if (wError) throw wError;
            results.push('Pekerjaan (works.json) berhasil dimigrasi');
        }

        if (results.length === 0) {
            return NextResponse.json({ success: false, error: 'Tidak ada file JSON ditemukan di folder save/' });
        }

        return NextResponse.json({ success: true, message: results.join(', ') });

    } catch (error: any) {
        console.error('Migration POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
