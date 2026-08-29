import fs from 'fs';
import path from 'path';
import { logger } from '../../utils/logger';
import { AppError } from '../../utils/errors';

const UPLOADS_DIR = path.join(__dirname, '../../../../uploads');

// Ensure uploads folder exists
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

export class StorageService {
  /**
   * Saves a buffer of data to local disk storage and returns the local accessible file URL.
   */
  public static async saveFile(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string
  ): Promise<{ fileUrl: string; fileKey: string }> {
    try {
      const ext = path.extname(originalName) || '.bin';
      const fileKey = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${ext}`;
      const filePath = path.join(UPLOADS_DIR, fileKey);

      await fs.promises.writeFile(filePath, fileBuffer);
      logger.info({ fileKey, filePath }, 'File saved locally on server storage');

      // Return local URL (assumes server serves /uploads static folder)
      const fileUrl = `/uploads/${fileKey}`;
      return { fileUrl, fileKey };
    } catch (error: any) {
      logger.error({ error }, 'Local file storage write failure');
      throw new AppError('File storage write failed', 500, 'STORAGE_WRITE_FAILED');
    }
  }

  /**
   * Deletes a file from local server disk.
   */
  public static async deleteFile(fileKey: string): Promise<boolean> {
    try {
      const filePath = path.join(UPLOADS_DIR, fileKey);
      if (fs.existsSync(filePath)) {
        await fs.promises.unlink(filePath);
        logger.info({ fileKey }, 'File deleted from local disk');
        return true;
      }
      return false;
    } catch (error) {
      logger.error({ error, fileKey }, 'Local file deletion failure');
      return false;
    }
  }
}
