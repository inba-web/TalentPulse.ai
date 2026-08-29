/**
 * Formats image URLs so that Google Drive links (which point to HTML preview pages)
 * are automatically converted to direct binary image stream URLs suitable for HTML <img> tags.
 */
export function formatImageUrl(url?: string | null): string {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();

  // If it's a Google Drive link, convert to direct image CDN endpoint
  if (trimmed.includes('drive.google.com')) {
    const fileIdMatch = trimmed.match(/\/file\/d\/([^\/\?#]+)/) || trimmed.match(/[?&]id=([^&]+)/);
    if (fileIdMatch && fileIdMatch[1]) {
      const fileId = fileIdMatch[1];
      return `https://lh3.googleusercontent.com/d/${fileId}`;
    }
  }

  return trimmed;
}
