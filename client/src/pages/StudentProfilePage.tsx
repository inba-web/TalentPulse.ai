import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStudentStore } from '../store/studentStore';
import StatusBadge from '../components/StatusBadge';
import { useAuthStore } from '../store/authStore';
import ConfirmDialog from '../components/ConfirmDialog';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Building,
  GraduationCap,
  Github,
  Linkedin,
  Globe,
  AlertTriangle,
  History,
  CheckCircle,
  FileText,
  HelpCircle,
  XOctagon,
} from 'lucide-react';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { fetchStudentById, terminateStudent, revokeTermination } = useStudentStore();
  const { user: authUser } = useAuthStore();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Termination Dialog control
  const [termOpen, setTermOpen] = useState(false);
  const [termReason, setTermReason] = useState('');
  const [termLoading, setTermLoading] = useState(false);

  // Revoke Dialog control
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const loadStudentData = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const data = await fetchStudentById(id);
      setStudent(data);
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStudentData();
  }, [id]);

  const handleTerminate = async () => {
    if (!id || !termReason) return;
    setTermLoading(true);
    try {
      await terminateStudent(id, termReason);
      setTermOpen(false);
      setTermReason('');
      await loadStudentData();
    } catch (err: any) {
      alert(err.message || 'Termination failed');
    } finally {
      setTermLoading(false);
    }
  };

  const handleRevoke = async () => {
    if (!id) return;
    setRevokeLoading(true);
    try {
      await revokeTermination(id);
      setRevokeOpen(false);
      await loadStudentData();
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    } finally {
      setRevokeLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-secondary">Loading student profile...</div>;
  }

  if (errorMsg || !student) {
    return <div className="text-center py-20 text-danger">{errorMsg || 'Student profile not found.'}</div>;
  }

  const isAdmin = authUser?.roleName === 'ADMIN';

  return (
    <div className="space-y-6">
      
      {/* Profile Header */}
      <div className="bg-surface p-6 rounded-xl border border-border shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-xl bg-slate-100 border border-border flex justify-center items-center text-primary text-2xl font-bold">
            {student.fullName.charAt(0).toUpperCase()}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text">{student.fullName}</h1>
              <StatusBadge status={student.placementStatus} />
            </div>
            <div className="text-xs font-mono font-medium text-secondary">{student.rollNumber}</div>
            <div className="text-xs font-semibold text-secondary">{student.department.name}</div>
          </div>
        </div>

        {/* Administrative actions */}
        {isAdmin && (
          <div className="flex gap-3">
            {student.placementStatus !== 'TERMINATED' ? (
              <button
                onClick={() => setTermOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-danger hover:bg-red-700 text-white text-xs font-semibold rounded-lg transition shadow shadow-danger/10 cursor-pointer"
              >
                <XOctagon className="w-4 h-4" />
                <span>Terminate placement eligibility</span>
              </button>
            ) : (
              <button
                onClick={() => setRevokeOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow shadow-emerald-500/10 cursor-pointer"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Revoke placement termination</span>
              </button>
            )}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Contact and Academics */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Academics Card */}
          <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>Academic Performance</span>
            </h3>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-slate-50/50 p-4 border border-border rounded-xl text-center">
                <div className="text-xs text-secondary font-medium">SSLC (10th)</div>
                <div className="text-lg font-extrabold text-text mt-1">{student.academics?.sslcPercentage}%</div>
              </div>
              <div className="bg-slate-50/50 p-4 border border-border rounded-xl text-center">
                <div className="text-xs text-secondary font-medium">HSC (12th)</div>
                <div className="text-lg font-extrabold text-text mt-1">{student.academics?.hscPercentage}%</div>
              </div>
              <div className="bg-slate-50/50 p-4 border border-border rounded-xl text-center">
                <div className="text-xs text-secondary font-medium">UG Degree</div>
                <div className="text-lg font-extrabold text-text mt-1">{student.academics?.ugPercentage}%</div>
              </div>
              <div className="bg-slate-50/50 p-4 border border-border rounded-xl text-center">
                <div className="text-xs text-secondary font-medium">PG Degree</div>
                <div className="text-lg font-extrabold text-text mt-1">
                  {student.academics?.pgPercentage ? `${student.academics.pgPercentage}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Placement History */}
          <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span>Placement Offer History</span>
            </h3>

            {student.placementHistory.length === 0 ? (
              <div className="text-xs text-secondary font-medium py-4 text-center">
                No active placement offers logged for this student.
              </div>
            ) : (
              <div className="space-y-3">
                {student.placementHistory.map((offer: any) => (
                  <div key={offer.id} className="bg-slate-50/50 p-4 border border-border rounded-xl flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-text">{offer.job.jobTitle}</div>
                      <div className="text-xs text-secondary font-medium">{offer.company.name}</div>
                      <div className="text-[10px] text-secondary">Placed: {new Date(offer.placedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-emerald-600">{offer.ctc} LPA</div>
                      <span className="text-[10px] font-bold bg-emerald-50 text-emerald-600 px-2 py-0.5 rounded-full border border-emerald-100 uppercase mt-1 inline-block">
                        {offer.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI ATS Matching History */}
          <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span>AI ATS Evaluation Records</span>
            </h3>

            {student.atsAnalyses.length === 0 ? (
              <div className="text-xs text-secondary font-medium py-4 text-center">
                No ATS evaluations performed on this student's resume yet.
              </div>
            ) : (
              <div className="space-y-4">
                {student.atsAnalyses.map((analysis: any) => (
                  <div key={analysis.id} className="bg-slate-50/50 p-4 border border-border rounded-xl space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-text">{analysis.job.jobTitle}</div>
                        <div className="text-xs text-secondary font-medium">{analysis.job.company.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-primary">{analysis.overallScore} / 100</div>
                        <div className="text-[9px] text-secondary">Score calculated deterministically</div>
                      </div>
                    </div>

                    {/* Matched/Missing Skills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                      <div>
                        <div className="text-[10px] font-bold text-secondary uppercase mb-1">Matched Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {analysis.matchedSkills.map((s: string, idx: number) => (
                            <span key={idx} className="text-[10px] font-bold bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-secondary uppercase mb-1">Missing Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {analysis.missingSkills.map((s: string, idx: number) => (
                            <span key={idx} className="text-[10px] font-bold bg-red-50 text-red-600 px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Contact info and Links */}
        <div className="space-y-6">
          {/* Identity & Links Card */}
          <div className="bg-surface p-6 rounded-xl border border-border shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-text uppercase tracking-wider">Contact & Profiles</h3>
            
            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-secondary" />
                <span className="text-text font-semibold truncate">{student.collegeEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-secondary" />
                <span className="text-text font-medium truncate">{student.personalEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-secondary" />
                <span className="text-text font-semibold">{student.mobileNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-secondary" />
                <span className="text-text font-medium">Graduation Date: {new Date(student.graduationDate).toLocaleDateString()}</span>
              </div>
              {student.selfIntroVideoUrl && (
                <div className="flex items-center gap-3">
                  <Globe className="w-4 h-4 text-primary" />
                  <a
                    href={student.selfIntroVideoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary font-bold hover:underline"
                  >
                    Watch Intro Video Link
                  </a>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-border space-y-2">
              {student.links?.githubUrl && (
                <a
                  href={student.links.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-slate-50 transition duration-150 text-xs font-bold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    <span>GitHub Profile</span>
                  </span>
                  <Globe className="w-4 h-4 text-secondary" />
                </a>
              )}
              {student.links?.linkedinUrl && (
                <a
                  href={student.links.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-slate-50 transition duration-150 text-xs font-bold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-primary" />
                    <span>LinkedIn Profile</span>
                  </span>
                  <Globe className="w-4 h-4 text-secondary" />
                </a>
              )}
              {student.links?.portfolioUrl && (
                <a
                  href={student.links.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded-lg border border-border hover:bg-slate-50 transition duration-150 text-xs font-bold text-slate-700"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-emerald-600" />
                    <span>Portfolio Website</span>
                  </span>
                  <Globe className="w-4 h-4 text-secondary" />
                </a>
              )}
            </div>
          </div>

          {/* Active Termination logs */}
          {student.placementStatus === 'TERMINATED' && (
            <div className="bg-red-50 p-6 rounded-xl border border-red-200 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-red-700 uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Eligibility Terminated</span>
              </h3>
              
              {student.terminations.filter((t: any) => t.isActive).map((term: any) => (
                <div key={term.id} className="space-y-2 text-xs text-red-700">
                  <p className="leading-relaxed font-semibold">"{term.reason}"</p>
                  <div className="text-[10px] text-red-600 mt-2 font-bold">
                    By: {term.terminatedBy.fullName} on {new Date(term.terminatedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Terminate Dialog */}
      <ConfirmDialog
        isOpen={termOpen}
        title="Terminate Student Placement Eligibility"
        message="Are you sure you want to terminate this student from participating in placement drives? The student will be set as ineligible, and recruiters will be blocked from matching their resume."
        onConfirm={handleTerminate}
        onCancel={() => setTermOpen(false)}
        confirmText="Terminate Eligibility"
        type="danger"
        loading={termLoading}
      >
        {/* Render a custom textarea inside the modal for reason capture */}
        <div className="mt-4 px-6 pb-2">
          <label className="text-[10px] font-bold text-secondary uppercase tracking-wider">Termination Reason</label>
          <textarea
            className="w-full mt-1.5 p-3 border border-border rounded-lg text-xs outline-none focus:border-red-500 transition h-20 resize-none bg-background text-text"
            placeholder="Specify reason for termination (required)..."
            value={termReason}
            onChange={(e) => setTermReason(e.target.value)}
          />
        </div>
      </ConfirmDialog>

      {/* Revoke Dialog */}
      <ConfirmDialog
        isOpen={revokeOpen}
        title="Revoke Placement Termination"
        message="Are you sure you want to revoke this student's placement termination and reinstate their eligibility status? Reinstated students will be visible on recruiter matching boards."
        onConfirm={handleRevoke}
        onCancel={() => setRevokeOpen(false)}
        confirmText="Revoke & Reinstate"
        type="info"
        loading={revokeLoading}
      />
    </div>
  );
}
