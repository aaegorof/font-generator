import { FontSyncService } from './fontSync'
import { ImageSyncService } from './imageSync'

/**
 * Service for batch deletion of fonts and images
 * Handles multiple deletions with proper error reporting
 */
export class BatchDeleteService {
  /**
   * Delete multiple fonts
   * Returns array of failed font IDs if any deletions fail
   */
  static async deleteFonts(
    userId: string,
    fontIds: string[],
  ): Promise<{ succeeded: string[]; failed: Array<{ id: string; error: string }> }> {
    const results = await Promise.allSettled(
      fontIds.map((id) => FontSyncService.deleteFontWithFile(userId, id)),
    )

    const succeeded: string[] = []
    const failed: Array<{ id: string; error: string }> = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const fontId = fontIds[i]

      if (result.status === 'fulfilled') {
        succeeded.push(fontId)
      } else {
        const error = result.reason instanceof Error ? result.reason.message : 'Unknown error'
        failed.push({ id: fontId, error })
        console.error(`Failed to delete font ${fontId}:`, result.reason)
      }
    }

    return { succeeded, failed }
  }

  /**
   * Delete multiple images
   * Returns array of failed image URLs if any deletions fail
   */
  static async deleteImages(
    userId: string,
    urls: string[],
  ): Promise<{ succeeded: string[]; failed: Array<{ url: string; error: string }> }> {
    const results = await Promise.allSettled(
      urls.map((url) => ImageSyncService.deleteImageWithFile(userId, url)),
    )

    const succeeded: string[] = []
    const failed: Array<{ url: string; error: string }> = []

    for (let i = 0; i < results.length; i++) {
      const result = results[i]
      const url = urls[i]

      if (result.status === 'fulfilled') {
        succeeded.push(url)
      } else {
        const error = result.reason instanceof Error ? result.reason.message : 'Unknown error'
        failed.push({ url, error })
        console.error(`Failed to delete image ${url}:`, result.reason)
      }
    }

    return { succeeded, failed }
  }
}
