import { google } from 'googleapis';
import { Readable } from 'stream';
import { OAuth2Client } from 'google-auth-library';

export class GoogleDriveService {
    private drive;

    constructor(accessToken?: string) {
        if (accessToken) {
            const auth = new OAuth2Client();
            auth.setCredentials({ access_token: accessToken });
            this.drive = google.drive({ version: 'v3', auth });
        } else {
            // Fallback to Service Account for backward compatibility if needed, 
            // but ideally we should only use OAuth2 now.
            const auth = new google.auth.GoogleAuth({
                scopes: ['https://www.googleapis.com/auth/drive.file'],
            });
            this.drive = google.drive({ version: 'v3', auth });
        }
    }

    /**
     * Finds a folder by name under a parent folder.
     */
    async findFolder(name: string, parentId: string): Promise<string | null> {
        console.log(`GDrive: Searching for folder "${name}" under parent "${parentId}"`);
        try {
            const response = await this.drive.files.list({
                q: `name = '${name.replace(/'/g, "\\'")}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
                fields: 'files(id)',
                spaces: 'drive',
            });

            const files = response.data.files;
            const id = files && files.length > 0 ? files[0].id || null : null;
            console.log(`GDrive: Found folder ID: ${id}`);
            return id;
        } catch (error: any) {
            console.error(`GDrive: Error in findFolder:`, error.message);
            throw error;
        }
    }

    /**
     * Creates a folder under a parent folder.
     */
    async createFolder(name: string, parentId: string): Promise<string> {
        console.log(`GDrive: Creating folder "${name}" under parent "${parentId}"`);
        try {
            const fileMetadata = {
                name: name,
                mimeType: 'application/vnd.google-apps.folder',
                parents: [parentId],
            };

            const folder = await this.drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });

            console.log(`GDrive: Created folder ID: ${folder.data.id}`);
            return folder.data.id!;
        } catch (error: any) {
            console.error(`GDrive: Error in createFolder:`, error.message);
            throw error;
        }
    }

    /**
     * Ensures a folder structure exists and returns the ID of the leaf folder.
     */
    async ensureFolderStructure(pathParts: string[], rootFolderId: string): Promise<string> {
        let currentParentId = rootFolderId;

        for (const part of pathParts) {
            let folderId = await this.findFolder(part, currentParentId);
            if (!folderId) {
                folderId = await this.createFolder(part, currentParentId);
            }
            currentParentId = folderId;
        }

        return currentParentId;
    }

    /**
     * Uploads a file to a specific folder.
     */
    async uploadFile(
        file: Buffer | Uint8Array,
        fileName: string,
        mimeType: string,
        parentId: string
    ): Promise<{ id: string; webViewLink?: string | null }> {
        console.log(`GDrive: Uploading "${fileName}" to parent "${parentId}"`);
        try {
            const fileMetadata = {
                name: fileName,
                parents: [parentId],
            };

            const media = {
                mimeType: mimeType,
                body: Readable.from(Buffer.from(file)),
            };

            const response = await this.drive.files.create({
                requestBody: fileMetadata,
                media: media,
                fields: 'id, webViewLink',
            });

            console.log(`GDrive: Upload successful, ID: ${response.data.id}`);
            return {
                id: response.data.id!,
                webViewLink: response.data.webViewLink
            };
        } catch (error: any) {
            console.error(`GDrive: Error in uploadFile:`, error.message);
            throw error;
        }
    }

    /**
     * Finds the next sequence number (001, 002, ...) for files in a folder with a given prefix.
     */
    async getNextSequence(folderId: string, prefix: string, extension: string): Promise<string> {
        console.log(`GDrive: Calculating next sequence for prefix "${prefix}" in folder "${folderId}"`);
        try {
            // List files that start with the prefix and have the matching extension
            const response = await this.drive.files.list({
                q: `'${folderId}' in parents and name contains '${prefix}' and trashed = false`,
                fields: 'files(name)',
                spaces: 'drive',
            });

            const files = response.data.files || [];
            let maxSeq = 0;
            const escapedPrefix = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
            // Regex to match prefix followed by 3 digits and the extension
            const seqRegex = new RegExp(`^${escapedPrefix}(\\d+)\\.${extension}$`, 'i');

            for (const f of files) {
                if (!f.name) continue;
                const match = f.name.match(seqRegex);
                if (match) {
                    const seq = parseInt(match[1], 10);
                    if (seq > maxSeq) maxSeq = seq;
                }
            }

            const nextSeq = (maxSeq + 1).toString().padStart(3, '0');
            console.log(`GDrive: Next sequence calculated: ${nextSeq}`);
            return nextSeq;
        } catch (error: any) {
            console.error(`GDrive: Error calculating sequence:`, error.message);
            // Fallback to timestamp to avoid failing the upload if listing fails
            return Date.now().toString().slice(-3);
        }
    }
}
