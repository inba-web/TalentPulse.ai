import React, { useState } from 'react';
import { X, Download, ExternalLink, ZoomIn, ZoomOut, FileText, AlertCircle } from 'lucide-react';

interface JdPdfViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  companyName: string;
  pdfUrl?: string | null;
  jdText?: string | null;
}

export function formatGoogleDrivePreviewUrl(url?: string | null): { embedUrl: string | null; downloadUrl: string | null; originalUrl: string | null } {
  if (!url || typeof url !== 'string' || !url.startsWith('http')) {
    return { embedUrl: null, downloadUrl: null, originalUrl: null };
  }

  // Pattern 1: https://drive.google.com/file/d/FILE_ID/view...
  const fileDMatch = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (fileDMatch) {
    const fileId = fileDMatch[1];
    return {
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      originalUrl: url,
    };
  }

  // Pattern 2: https://drive.google.com/open?id=FILE_ID or uc?id=FILE_ID
  const openIdMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openIdMatch && url.includes('drive.google.com')) {
    const fileId = openIdMatch[1];
    return {
      embedUrl: `https://drive.google.com/file/d/${fileId}/preview`,
      downloadUrl: `https://drive.google.com/uc?export=download&id=${fileId}`,
      originalUrl: url,
    };
  }

  return {
    embedUrl: url,
    downloadUrl: url,
    originalUrl: url,
  };
}

export default function JdPdfViewerModal({
  isOpen,
  onClose,
  title,
  companyName,
  pdfUrl,
  jdText,
}: JdPdfViewerModalProps) {
  const [zoom, setZoom] = useState(100);
  const [loadError, setLoadError] = useState(false);

  if (!isOpen) return null;

  const { embedUrl, downloadUrl, originalUrl } = formatGoogleDrivePreviewUrl(pdfUrl);
  const hasValidUrl = !!embedUrl && !loadError;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/70 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-surface-1 max-w-4xl w-full h-[85vh] rounded border border-border-primary shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header Bar */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary bg-surface-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded border border-primary/20">
              <FileText className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider">
                {title} — Job Description PDF
              </h3>
              <p className="text-xs text-text-muted">{companyName}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasValidUrl && (
              <>
                <div className="flex items-center gap-1 bg-background-secondary border border-border-primary rounded px-2 py-1">
                  <button
                    onClick={() => setZoom((z) => Math.max(50, z - 10))}
                    className="p-1 text-text-muted hover:text-text-primary cursor-pointer border-0 bg-transparent"
                    title="Zoom Out"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  <span className="text-[11px] font-bold text-text-primary w-10 text-center">{zoom}%</span>
                  <button
                    onClick={() => setZoom((z) => Math.min(180, z + 10))}
                    className="p-1 text-text-muted hover:text-text-primary cursor-pointer border-0 bg-transparent"
                    title="Zoom In"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                </div>

                {originalUrl && (
                  <a
                    href={originalUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 bg-surface-3 hover:bg-surface-elevated text-text-primary rounded border border-border-primary transition cursor-pointer"
                    title="Open Google Drive Link in new tab"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}

                {downloadUrl && (
                  <a
                    href={downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download={`${companyName.replace(/\s+/g, '_')}_JD.pdf`}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-primary text-white text-xs font-bold rounded border-0 hover:brightness-110 transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </a>
                )}
              </>
            )}

            <button
              onClick={onClose}
              className="p-2 hover:bg-surface-3 rounded text-text-muted hover:text-text-primary transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Viewer Content Area */}
        <div className="flex-1 bg-background-secondary p-4 sm:p-6 overflow-y-auto flex flex-col items-center justify-center">
          {hasValidUrl ? (
            <div
              className="w-full h-full bg-white rounded shadow-lg overflow-hidden border border-border-primary transition-all duration-150"
              style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}
            >
              <iframe
                src={embedUrl!}
                className="w-full h-full border-0"
                title={`${companyName} JD PDF`}
                allow="autoplay"
                onError={() => setLoadError(true)}
              />
            </div>
          ) : (
            /* Default Fallback JD Document Viewer */
            <div className="max-w-2xl w-full bg-surface-1 p-8 rounded-lg border border-border-primary shadow-xl space-y-6 animate-in fade-in duration-200">
              <div className="flex items-center gap-3 p-4 bg-warning/10 border border-warning/20 rounded">
                <AlertCircle className="w-5 h-5 text-warning flex-shrink-0" />
                <div className="text-xs text-text-primary">
                  <span className="font-bold">Original PDF document preview:</span> Displaying verified Job Description specification for {companyName}.
                </div>
              </div>

              <div className="space-y-4 border-b border-border-primary pb-6">
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Position &amp; Role</span>
                  <h2 className="text-lg font-bold text-text-primary mt-0.5">{title}</h2>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Company</span>
                  <p className="text-sm font-semibold text-primary mt-0.5">{companyName}</p>
                </div>
              </div>

              <div className="space-y-3">
                <span className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Job Description Details</span>
                <div className="p-4 bg-background-tertiary rounded border border-border-primary text-xs text-text-secondary font-mono leading-relaxed whitespace-pre-wrap max-h-64 overflow-y-auto">
                  {jdText && jdText.trim() ? jdText : `No explicit job description text recorded for this opening at ${companyName}. Please contact the placement administrator.`}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

