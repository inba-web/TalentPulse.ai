import React, { useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { X, Upload, FileSpreadsheet, Loader2, CheckCircle2, AlertTriangle, ArrowRight } from 'lucide-react';

interface ExcelImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelImportModal({ isOpen, onClose, onSuccess }: ExcelImportModalProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'importing' | 'results'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [importReport, setImportReport] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      setErrorMsg('');
      setStep('preview');
    }
  };

  const handleStartImport = async () => {
    if (!file) return;
    setImporting(true);
    setStep('importing');
    setErrorMsg('');

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await apiFetch('/api/companies/import', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (result.success) {
        setImportReport(result.data);
        setStep('results');
        onSuccess();
      } else {
        setErrorMsg(result.error?.message || 'Import failed. Check file format.');
        setStep('preview');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Network error while importing Excel file.');
      setStep('preview');
    } finally {
      setImporting(false);
    }
  };

  const resetModal = () => {
    setStep('upload');
    setFile(null);
    setImportReport(null);
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-sm flex justify-center items-center">
      <div className="bg-surface-1 max-w-2xl w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary bg-surface-2">
          <div className="flex items-center gap-2.5">
            <FileSpreadsheet className="w-5 h-5 text-primary" />
            <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider">
              Import Corporate Catalog from Excel
            </h3>
          </div>
          <button onClick={resetModal} className="p-1 hover:bg-surface-3 rounded text-text-muted hover:text-text-primary transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          {/* Step Indicators */}
          <div className="flex items-center justify-between border-b border-border-primary pb-4">
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 'upload' ? 'text-primary' : 'text-text-muted'}`}>
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">1</span>
              <span>Upload Workbook</span>
            </div>
            <ArrowRight className="w-4 h-4 text-border-primary" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 'preview' || step === 'importing' ? 'text-primary' : 'text-text-muted'}`}>
              <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center text-[10px]">2</span>
              <span>Validation &amp; Schema Mapping</span>
            </div>
            <ArrowRight className="w-4 h-4 text-border-primary" />
            <div className={`flex items-center gap-2 text-xs font-bold ${step === 'results' ? 'text-success' : 'text-text-muted'}`}>
              <span className="w-5 h-5 rounded-full bg-success/20 flex items-center justify-center text-[10px]">3</span>
              <span>Import Results</span>
            </div>
          </div>

          {errorMsg && (
            <div className="p-4 bg-error/10 border border-error/20 rounded flex items-center gap-3 text-xs text-error font-semibold">
              <AlertTriangle className="w-5 h-5 flex-shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: Upload File */}
          {step === 'upload' && (
            <div className="border-2 border-dashed border-border-primary rounded-lg p-10 text-center hover:border-primary/50 transition bg-background-secondary">
              <Upload className="w-10 h-10 text-primary mx-auto mb-3" />
              <h4 className="text-sm font-bold text-text-primary">Select Excel File (.xlsx, .xls)</h4>
              <p className="text-xs text-text-muted mt-1 max-w-sm mx-auto">
                Upload company placement records. Columns will be automatically mapped with safe application defaults for missing fields.
              </p>
              <label className="inline-flex items-center gap-2 px-5 py-2.5 mt-5 bg-gradient-primary hover:brightness-110 text-white text-xs font-bold rounded glow-primary border-0 cursor-pointer transition">
                <span>Browse Files</span>
                <input type="file" accept=".xlsx,.xls" className="hidden" onChange={handleFileChange} />
              </label>
            </div>
          )}

          {/* STEP 2: Preview & Schema Mapping */}
          {step === 'preview' && file && (
            <div className="space-y-4">
              <div className="p-4 bg-background-secondary border border-border-primary rounded flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileSpreadsheet className="w-8 h-8 text-primary" />
                  <div>
                    <div className="text-xs font-bold text-text-primary">{file.name}</div>
                    <div className="text-[10px] text-text-muted">{(file.size / 1024).toFixed(1)} KB — Ready for processing</div>
                  </div>
                </div>
                <button
                  onClick={() => { setFile(null); setStep('upload'); }}
                  className="text-xs text-error font-bold hover:underline cursor-pointer border-0 bg-transparent"
                >
                  Change File
                </button>
              </div>

              <div className="p-4 bg-surface-2 rounded border border-border-primary space-y-2">
                <h5 className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Automatic Column Detection &amp; Fallbacks</h5>
                <ul className="text-xs text-text-secondary space-y-1 list-disc pl-4 font-mono">
                  <li>Company Name &rarr; Mandatory (Skips row if missing)</li>
                  <li>Company Status &rarr; Standardized to Cold / Warm / Hot / Drive Completed (Default: Cold)</li>
                  <li>Headquarters Location &rarr; Verified Places resolution (Default: Not provided)</li>
                  <li>Deduplication &rarr; Updates existing company if name or email matches</li>
                </ul>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  onClick={resetModal}
                  className="px-4 py-2 border border-border-primary text-text-secondary text-xs font-semibold rounded hover:bg-surface-2 transition cursor-pointer bg-transparent"
                >
                  Cancel
                </button>
                <button
                  onClick={handleStartImport}
                  className="px-5 py-2.5 bg-gradient-primary text-white text-xs font-bold rounded border-0 hover:brightness-110 transition cursor-pointer flex items-center gap-2 glow-primary"
                >
                  <span>Run Import Pipeline</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Importing Spinner */}
          {step === 'importing' && (
            <div className="text-center py-12 space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto" />
              <div className="text-sm font-bold text-text-primary">Processing Excel Workbook...</div>
              <p className="text-xs text-text-muted">Validating data rows, applying defaults, and persisting to database.</p>
            </div>
          )}

          {/* STEP 4: Results Summary */}
          {step === 'results' && importReport && (
            <div className="space-y-5 animate-in fade-in duration-200">
              <div className="grid grid-cols-4 gap-3 text-center">
                <div className="p-3 bg-surface-2 border border-border-primary rounded">
                  <div className="text-[10px] font-bold text-text-muted uppercase">Total Rows</div>
                  <div className="text-lg font-extrabold text-text-primary mt-1">{importReport.totalRows}</div>
                </div>
                <div className="p-3 bg-success/10 border border-success/20 rounded">
                  <div className="text-[10px] font-bold text-success uppercase">Created</div>
                  <div className="text-lg font-extrabold text-success mt-1">{importReport.createdCount}</div>
                </div>
                <div className="p-3 bg-primary/10 border border-primary/20 rounded">
                  <div className="text-[10px] font-bold text-primary uppercase">Updated</div>
                  <div className="text-lg font-extrabold text-primary mt-1">{importReport.updatedCount}</div>
                </div>
                <div className="p-3 bg-warning/10 border border-warning/20 rounded">
                  <div className="text-[10px] font-bold text-warning uppercase">Skipped</div>
                  <div className="text-lg font-extrabold text-warning mt-1">{importReport.skippedCount}</div>
                </div>
              </div>

              {importReport.errorDetails && importReport.errorDetails.length > 0 && (
                <div className="space-y-2">
                  <h5 className="text-[10px] font-bold text-error uppercase tracking-wider">Skipped / Failed Records Breakdown</h5>
                  <div className="max-h-40 overflow-y-auto border border-border-primary rounded bg-background-secondary p-3 divide-y divide-border-primary text-xs">
                    {importReport.errorDetails.map((errItem: any, idx: number) => (
                      <div key={idx} className="py-1.5 flex justify-between gap-4">
                        <span className="font-bold text-text-primary">Row {errItem.row}: {errItem.companyName}</span>
                        <span className="text-error italic">{errItem.reason}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-2">
                <button
                  onClick={resetModal}
                  className="px-6 py-2.5 bg-gradient-primary text-white text-xs font-bold rounded border-0 hover:brightness-110 transition cursor-pointer glow-primary"
                >
                  Done
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
