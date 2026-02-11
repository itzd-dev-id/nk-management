import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Only initialize if we're not in a build environment or if the variables are present
const supabase = (supabaseUrl && supabaseServiceKey)
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

export async function GET(req: NextRequest) {
    try {
        const searchParams = req.nextUrl.searchParams;
        const filename = searchParams.get('filename');

        if (!filename) {
            return NextResponse.json({ success: false, error: 'Missing filename' }, { status: 400 });
        }

        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Supabase not initialized' }, { status: 500 });
        }

        const key = filename.split('.')[0];
        const { data, error } = await supabase
            .from('config')
            .select('value')
            .eq('key', key)
            .single();

        if (error && error.code !== 'PGRST116') {
            throw error;
        }

        return NextResponse.json({ success: true, data: data?.value || null });

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

        if (!supabase) {
            return NextResponse.json({ success: false, error: 'Supabase not initialized' }, { status: 500 });
        }

        const key = filename.split('.')[0];
        const { error } = await supabase
            .from('config')
            .upsert({ key, value: data }, { onConflict: 'key' });

        if (error) throw error;

        return NextResponse.json({ success: true });

    } catch (error: any) {
        console.error('Config POST error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
