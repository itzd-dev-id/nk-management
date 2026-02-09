import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

export async function GET() {
    try {
        // AppleScript command to open folder picker on macOS
        const { stdout, stderr } = await execPromise(`osascript -e 'POSIX path of (choose folder with prompt "Pilih Folder Output NK-Management")'`);

        if (stderr && !stdout) {
            console.error('AppleScript Stderr:', stderr);
            return NextResponse.json({ success: false, error: stderr }, { status: 500 });
        }

        const selectedPath = stdout.trim();
        if (!selectedPath) {
            return NextResponse.json({ success: false, error: 'No path selected' });
        }

        return NextResponse.json({ success: true, path: selectedPath });
    } catch (error: any) {
        // If user clicks "Cancel" in the AppleScript dialog, it throws an error
        if (error.message?.includes('User canceled') || error.code === 1) {
            return NextResponse.json({ success: false, error: 'Canceled by user' });
        }
        console.error('AppleScript Error:', error);
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
