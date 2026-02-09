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
        const response = await this.drive.files.list({
            q: `name = '${name}' and '${parentId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
            fields: 'files(id)',
            spaces: 'drive',
        });

        const files = response.data.files;
        return files && files.length > 0 ? files[0].id || null : null;
    }

    /**
     * Creates a folder under a parent folder.
     */
    async createFolder(name: string, parentId: string): Promise<string> {
        const fileMetadata = {
            name: name,
            mimeType: 'application/vnd.google-apps.folder',
            parents: [parentId],
        };

        const folder = await this.drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        return folder.data.id!;
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

        return {
            id: response.data.id!,
            webViewLink: response.data.webViewLink
        };
    }
}
