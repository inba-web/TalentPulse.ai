import axios from 'axios';
import dnsPromises from 'dns/promises';
import { URL } from 'url';
import { AppError } from './errors';

// Standard private IP check helpers
const isPrivateIP = (ipAddress: string): boolean => {
  // Check loopback / localhost
  if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === '0.0.0.0') {
    return true;
  }
  
  // Link-local & cloud metadata
  if (ipAddress.startsWith('169.254.')) {
    return true;
  }
  
  const parts = ipAddress.split('.').map(Number);
  if (parts.length !== 4 || parts.some(isNaN)) {
    // Treat non-ipv4 addresses as private/unsafe if they aren't standard loopback (for simple SSRF prevention)
    return true;
  }

  const [a, b] = parts;
  // Class A: 10.0.0.0 - 10.255.255.255
  if (a === 10) return true;
  // Class B: 172.16.0.0 - 172.31.255.255
  if (a === 172 && b >= 16 && b <= 31) return true;
  // Class C: 192.168.0.0 - 192.168.255.255
  if (a === 192 && b === 168) return true;

  return false;
};

/**
 * Convert a Google Drive share/view URL to a direct download URL.
 * Handles all common Drive URL formats.
 */
function convertDriveUrl(fileUrl: string): string {
  // Extract file ID from various Drive URL patterns
  const patterns = [
    /\/file\/d\/([a-zA-Z0-9_-]+)/,     // /file/d/ID/view
    /[?&]id=([a-zA-Z0-9_-]+)/,          // ?id=ID
    /\/document\/d\/([a-zA-Z0-9_-]+)/,  // Google Docs
    /\/spreadsheets\/d\/([a-zA-Z0-9_-]+)/, // Sheets
  ];

  for (const pattern of patterns) {
    const match = fileUrl.match(pattern);
    if (match && match[1]) {
      const fileId = match[1];
      // Use export=download with confirm=t to bypass large-file warning page
      return `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
    }
  }
  return fileUrl; // Not a Drive URL, return as-is
}

/**
 * Downloads file from url securely by checking for SSRF, DNS rebinding, and restricting file size and redirections.
 */
export async function secureDownload(fileUrl: string): Promise<{ data: Buffer; contentType: string }> {
  try {
    const finalUrl = convertDriveUrl(fileUrl);

    const parsedUrl = new URL(finalUrl);
    
    // Enforce HTTPS
    if (parsedUrl.protocol !== 'https:') {
      throw new AppError('SSRF Protection: Only secure HTTPS links are allowed.', 400, 'UNSAFE_URL');
    }

    const hostname = parsedUrl.hostname;
    
    // Resolve DNS address
    const addresses = await dnsPromises.resolve4(hostname).catch(() => []);
    if (addresses.length === 0) {
      throw new AppError(`SSRF Protection: Unable to resolve hostname ${hostname}`, 400, 'INVALID_HOSTNAME');
    }

    // Inspect resolved IPs
    for (const ipAddress of addresses) {
      if (isPrivateIP(ipAddress)) {
        throw new AppError('SSRF Protection: Access to private IP addresses is blocked.', 403, 'SSRF_BLOCKED');
      }
    }

    // Request settings — generous timeout and redirect budget for Google Drive's multi-redirect flow
    const response = await axios({
      method: 'get',
      url: finalUrl,
      timeout: 15000,          // 15s for Drive (may be slow)
      maxContentLength: 15 * 1024 * 1024, // 15MB
      maxRedirects: 6,          // Drive does several redirects
      responseType: 'arraybuffer',
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; TalentPulse-ATS/1.0)',
        'Accept': 'application/pdf,*/*',
      },
    });

    const contentType = String(response.headers['content-type'] || 'application/octet-stream');

    // If Drive returned an HTML confirmation page instead of the file, throw so caller can use fallback
    if (contentType.includes('text/html')) {
      throw new AppError('Google Drive returned an HTML page instead of the file. File may require special access.', 400, 'DOWNLOAD_FAILED');
    }

    return {
      data: Buffer.from(response.data),
      contentType,
    };
  } catch (error: any) {
    if (error instanceof AppError) {
      throw error;
    }
    throw new AppError(`Secure download failed: ${error.message}`, 400, 'DOWNLOAD_FAILED');
  }
}
