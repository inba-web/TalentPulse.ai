import React, { useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useRecruiterStore } from '../store/recruiterStore';
import { Upload, BrainCircuit, Loader2, Trophy, ArrowRight, Eye, RefreshCw, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function JdUploadAtsPage() {
  const { candidates, loading, error, analyzeCustomJd } = useRecruiterStore();
  const [jdText, setJdText] = useState('');
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jdText.trim() && !jdFile) return;
    try {
      await analyzeCustomJd(jdText, jdFile || undefined);
    } catch (err) {
      console.error(err);
    }
  };

  const handleRefresh = async () => {
    if (!jdText.trim() && !jdFile) return;
    setRefreshing(true);
    try {
      await analyzeCustomJd(jdText, jdFile || undefined);
    } catch (err) {
      console.error(err);
    } finally {
      setRefreshing(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJdFile(e.target.files[0]);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-success bg-success/10 border-success/20';
    if (score >= 80) return 'text-primary bg-primary/10 border-primary/20';
    if (score >= 70) return 'text-primary bg-primary/10 border-primary/20';
    if (score >= 60) return 'text-warning bg-warning/10 border-warning/20';
    return 'text-danger bg-danger/10 border-danger/20';
  };

  return (
    <div className="space-y-6 relative">
      {/* Ambient glows */}
      <div className="absolute top-[-100px] left-[20%] w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">ATS JD Matcher</h1>
          <p className="text-xs text-text-muted mt-1">Upload job descriptions to instantly rank all candidate resumes in the system.</p>
        </div>
        {candidates.length > 0 && (
          <button
            onClick={handleRefresh}
            disabled={refreshing || loading}
            className="flex items-center gap-1.5 px-3 py-2 border border-border-primary hover:border-border-hover text-text-primary text-xs font-semibold rounded bg-surface-1 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh Matching</span>
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Input Form */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Upload className="w-4 h-4 text-primary" />
              <span>Job Description Specification</span>
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded border border-error/20 bg-error/10 text-error text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Paste JD Text</label>
                <textarea
                  className="w-full h-44 p-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition resize-none"
                  placeholder="Paste details, role responsibilities, required skills and experience details here..."
                  value={jdText}
                  onChange={(e) => setJdText(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Or Upload JD Document (PDF/Text)</label>
                <div className="border border-dashed border-border-primary rounded-lg p-4 hover:border-primary/50 transition bg-background-secondary relative flex flex-col items-center justify-center text-center cursor-pointer">
                  <input
                    type="file"
                    accept=".pdf,.txt"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    onChange={handleFileChange}
                  />
                  <Upload className="w-6 h-6 text-text-muted mb-2" />
                  <span className="text-[11px] font-semibold text-text-secondary truncate max-w-xs">
                    {jdFile ? jdFile.name : 'Choose PDF/TXT file'}
                  </span>
                  <span className="text-[9px] text-text-muted mt-0.5">Maximum size: 10MB</span>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading || (!jdText.trim() && !jdFile)}
                className="w-full h-10 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 glow-primary border-0 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Scoring Resumes...</span>
                  </>
                ) : (
                  <>
                    <BrainCircuit className="w-4 h-4" />
                    <span>Analyze & Rank Candidates</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right: Matches Listing */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
            <h3 className="text-sm font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span>ATS Ranked Matching Results</span>
            </h3>

            {loading ? (
              <div className="text-center py-24 text-text-secondary">
                <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                <span className="text-sm font-medium">Extracting resumes, checking drive folders, and calculating scores...</span>
              </div>
            ) : candidates.length === 0 ? (
              <div className="text-center py-24 text-text-muted border border-dashed border-border-primary rounded-lg bg-background-secondary">
                <BrainCircuit className="w-8 h-8 mx-auto mb-2 text-text-disabled" />
                <p className="text-xs font-semibold">No active analysis results visible.</p>
                <p className="text-[10px] mt-1">Specify job description details on the left side to begin evaluation.</p>
              </div>
            ) : (
              <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
                {candidates.map((cand, idx) => (
                  <div
                    key={cand.studentId}
                    className="bg-background-secondary p-5 rounded border border-border-primary hover:border-border-hover transition duration-200 flex flex-col sm:flex-row justify-between gap-6"
                  >
                    <div className="flex-1 space-y-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-surface-1 border border-border-primary rounded-full flex justify-center items-center font-bold text-[10px] text-primary">
                          {idx + 1}
                        </div>
                        <div>
                          <h4 className="font-bold text-text-primary text-sm leading-none flex items-center gap-2">
                            <span>{cand.fullName}</span>
                            <Link to={`/students/${cand.studentId}`} className="text-primary hover:text-primary-hover" title="View Profile">
                              <Eye className="w-3.5 h-3.5" />
                            </Link>
                          </h4>
                          <div className="text-[10px] font-mono text-text-muted mt-1.5">
                            {cand.rollNumber} &bull; {cand.department}
                          </div>
                        </div>
                      </div>

                      <div className="text-xs text-text-secondary leading-relaxed font-medium">
                        "{cand.explanation}"
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-primary/50">
                        <div>
                          <div className="text-[9px] font-bold text-text-secondary uppercase mb-1.5">Matched Skills</div>
                          <div className="flex flex-wrap gap-1">
                            {cand.matchedSkills.slice(0, 6).map((s, idx) => (
                              <span key={idx} className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                            {cand.matchedSkills.length === 0 && <span className="text-[9px] text-text-disabled">None</span>}
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-bold text-text-secondary uppercase mb-1.5">Missing Skills</div>
                          <div className="flex flex-wrap gap-1">
                            {cand.missingSkills.slice(0, 6).map((s, idx) => (
                              <span key={idx} className="text-[9px] font-bold bg-error/10 text-error px-1.5 py-0.5 rounded">
                                {s}
                              </span>
                            ))}
                            {cand.missingSkills.length === 0 && <span className="text-[9px] text-text-disabled">None</span>}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-col items-center justify-center border-t sm:border-t-0 sm:border-l border-border-primary pt-4 sm:pt-0 sm:pl-6 min-w-[100px]">
                      <div className={`w-12 h-12 rounded border flex flex-col justify-center items-center shadow-inner ${getScoreColor(cand.atsScore)}`}>
                        <span className="text-base font-extrabold">{cand.atsScore}</span>
                      </div>
                      <div className="text-[8px] font-bold text-text-muted uppercase tracking-widest mt-1.5">ATS SCORE</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
