import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { formatImageUrl } from '../utils/formatImageUrl';
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
  XOctagon,
  Download,
  Play,
  Loader2,
  Edit2,
  Trash2,
  X
} from 'lucide-react';

export default function StudentProfilePage() {
  const { id } = useParams<{ id: string }>();
  const { fetchStudentById, terminateStudent, revokeTermination, updateStudent, deleteStudent } = useStudentStore();
  const { user: authUser } = useAuthStore();
  const navigate = useNavigate();

  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Dropdown select and evaluation loading states
  const [availableJobs, setAvailableJobs] = useState<any[]>([]);
  const [selectedJobId, setSelectedJobId] = useState('');
  const [evaluating, setEvaluating] = useState(false);

  // Termination Dialog control
  const [termOpen, setTermOpen] = useState(false);
  const [termReason, setTermReason] = useState('');
  const [termLoading, setTermLoading] = useState(false);

  // Revoke Dialog control
  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokeLoading, setRevokeLoading] = useState(false);

  // Edit dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editFullName, setEditFullName] = useState('');
  const [editDeptId, setEditDeptId] = useState('');
  const [editGender, setEditGender] = useState('');
  const [editHostelStatus, setEditHostelStatus] = useState('');
  const [editPersonalEmail, setEditPersonalEmail] = useState('');
  const [editCollegeEmail, setEditCollegeEmail] = useState('');
  const [editMobileNumber, setEditMobileNumber] = useState('');
  const [editGraduationDate, setEditGraduationDate] = useState('');
  const [editSslc, setEditSslc] = useState('');
  const [editHsc, setEditHsc] = useState('');
  const [editUg, setEditUg] = useState('');
  const [editPg, setEditPg] = useState('');
  const [editGithub, setEditGithub] = useState('');
  const [editLinkedin, setEditLinkedin] = useState('');
  const [editPortfolio, setEditPortfolio] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  // Delete dialog state
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [depts, setDepts] = useState<any[]>([]);

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await apiFetch('/api/students/departments');
        const result = await res.json();
        if (result.success) {
          setDepts(result.data);
        }
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    loadDepts();
  }, []);

  const handleOpenEdit = () => {
    if (!student) return;
    setEditFullName(student.fullName);
    setEditDeptId(student.departmentId);
    setEditGender(student.gender);
    setEditHostelStatus(student.hostelStatus);
    setEditPersonalEmail(student.personalEmail);
    setEditCollegeEmail(student.collegeEmail);
    setEditMobileNumber(student.mobileNumber);
    setEditGraduationDate(student.graduationDate ? new Date(student.graduationDate).toISOString().split('T')[0] : '');
    setEditSslc(student.academics?.sslcPercentage ? String(student.academics.sslcPercentage) : '');
    setEditHsc(student.academics?.hscPercentage ? String(student.academics.hscPercentage) : '');
    setEditUg(student.academics?.ugPercentage ? String(student.academics.ugPercentage) : '');
    setEditPg(student.academics?.pgPercentage ? String(student.academics.pgPercentage) : '');
    setEditGithub(student.links?.githubUrl || '');
    setEditLinkedin(student.links?.linkedinUrl || '');
    setEditPortfolio(student.links?.portfolioUrl || '');
    setEditOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !student) return;
    setEditLoading(true);
    try {
      await updateStudent(id, {
        fullName: editFullName,
        departmentId: editDeptId,
        gender: editGender,
        hostelStatus: editHostelStatus,
        personalEmail: editPersonalEmail,
        collegeEmail: editCollegeEmail,
        mobileNumber: editMobileNumber,
        graduationDate: editGraduationDate,
        sslcPercentage: Number(editSslc),
        hscPercentage: Number(editHsc),
        ugPercentage: Number(editUg),
        pgPercentage: editPg ? Number(editPg) : null,
        githubUrl: editGithub || null,
        linkedinUrl: editLinkedin || null,
        portfolioUrl: editPortfolio || null,
      });
      setEditOpen(false);
      await loadStudentData();
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!id) return;
    setDeleteLoading(true);
    try {
      await deleteStudent(id);
      setDeleteOpen(false);
      navigate('/students');
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    } finally {
      setDeleteLoading(false);
    }
  };

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

  const loadJobs = async () => {
    try {
      const response = await apiFetch('/api/jobs?limit=100&status=APPROVED');
      const result = await response.json();
      if (result.success) {
        setAvailableJobs(result.data.jobs || []);
      }
    } catch (err) {
      console.error('Failed to load available jobs:', err);
    }
  };

  useEffect(() => {
    loadStudentData();
    loadJobs();
  }, [id]);

  const handleEvaluateAts = async () => {
    if (!selectedJobId || !id) return;
    setEvaluating(true);
    try {
      const response = await apiFetch('/api/ats/resume/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: id, jobId: selectedJobId }),
      });
      const result = await response.json();
      if (result.success) {
        alert(`ATS Analysis completed successfully! Matching score: ${result.data.analysis.overallScore}/100`);
        setSelectedJobId('');
        loadStudentData(); // Reload profile so evaluation displays in list!
      } else {
        throw new Error(result.error?.message || 'ATS Evaluation failed');
      }
    } catch (err: any) {
      alert(err.message || 'ATS Evaluation failed');
    } finally {
      setEvaluating(false);
    }
  };

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
    return <div className="text-center py-20 text-text-secondary">Loading student profile...</div>;
  }

  if (errorMsg || !student) {
    return <div className="text-center py-20 text-error">{errorMsg || 'Student profile not found.'}</div>;
  }

  const isAdmin = authUser?.roleName === 'ADMIN';

  // Filters resumes
  const resumesList = student.documents?.filter((d: any) => d.documentType === 'RESUME') || [];

  return (
    <div className="space-y-6">

      {/* Profile Header */}
      <div className="bg-surface-1 p-6 rounded border border-border-primary flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-5">
          {student.studentPhotoUrl ? (
            <img
              src={formatImageUrl(student.studentPhotoUrl)}
              className="w-20 h-20 rounded-full object-cover border-2 border-primary/40 shadow-md flex-shrink-0"
              alt={`${student.fullName} profile photo`}
              onError={(e) => {
                // If Google Drive permissions or image fails to load, fallback gracefully
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="w-20 h-20 rounded-full bg-gradient-primary border-2 border-primary/40 flex justify-center items-center text-white text-2xl font-extrabold flex-shrink-0 glow-primary">
              {student.fullName.charAt(0).toUpperCase()}
            </div>
          )}
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-text-primary">{student.fullName}</h1>
              <StatusBadge status={student.placementStatus} />
            </div>
            <div className="text-xs font-mono font-medium text-text-muted">{student.rollNumber}</div>
            <div className="text-xs font-semibold text-text-secondary">{student.department.name}</div>
          </div>
        </div>

        {/* Administrative actions */}
        {isAdmin && (
          <div className="flex gap-3">
            <button
              onClick={handleOpenEdit}
              className="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border-primary text-text-primary text-xs font-semibold rounded transition cursor-pointer"
            >
              <Edit2 className="w-4 h-4 text-primary" />
              <span>Edit Profile</span>
            </button>
            <button
              onClick={() => setDeleteOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-surface-2 hover:bg-surface-3 border border-border-primary text-error hover:bg-error/10 rounded transition cursor-pointer"
            >
              <Trash2 className="w-4 h-4" />
              <span>Delete Profile</span>
            </button>
            {student.placementStatus !== 'TERMINATED' ? (
              <button
                onClick={() => setTermOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-error hover:brightness-110 text-white text-xs font-semibold rounded transition border-0 cursor-pointer"
              >
                <XOctagon className="w-4 h-4" />
                <span>Terminate placement eligibility</span>
              </button>
            ) : (
              <button
                onClick={() => setRevokeOpen(true)}
                className="flex items-center gap-2 px-4 py-2 bg-success hover:brightness-110 text-white text-xs font-semibold rounded transition border-0 cursor-pointer"
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
          <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <GraduationCap className="w-4 h-4 text-primary" />
              <span>Academic Performance</span>
            </h3>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-surface-2 p-4 border border-border-primary rounded text-center">
                <div className="text-xs text-text-muted font-medium">SSLC (10th)</div>
                <div className="text-lg font-extrabold text-text-primary mt-1">{student.academics?.sslcPercentage}%</div>
              </div>
              <div className="bg-surface-2 p-4 border border-border-primary rounded text-center">
                <div className="text-xs text-text-muted font-medium">HSC (12th)</div>
                <div className="text-lg font-extrabold text-text-primary mt-1">{student.academics?.hscPercentage}%</div>
              </div>
              <div className="bg-surface-2 p-4 border border-border-primary rounded text-center">
                <div className="text-xs text-text-muted font-medium">UG Degree</div>
                <div className="text-lg font-extrabold text-text-primary mt-1">{student.academics?.ugPercentage}%</div>
              </div>
              <div className="bg-surface-2 p-4 border border-border-primary rounded text-center">
                <div className="text-xs text-text-muted font-medium">PG Degree</div>
                <div className="text-lg font-extrabold text-text-primary mt-1">
                  {student.academics?.pgPercentage ? `${student.academics.pgPercentage}%` : 'N/A'}
                </div>
              </div>
            </div>
          </div>

          {/* Resume Viewer Card */}
          {resumesList.length > 0 && (
            <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>Resume / CV Document</span>
              </h3>

              {resumesList.map((doc: any, idx: number) => {
                // Convert Google Drive share links to preview-embeddable URLs
                const rawUrl: string = doc.fileUrl || '';
                let embedUrl = rawUrl;
                let downloadUrl = rawUrl;

                const driveMatch = rawUrl.match(/\/file\/d\/([^\/]+)/);
                if (driveMatch) {
                  const fileId = driveMatch[1];
                  embedUrl = `https://drive.google.com/file/d/${fileId}/preview`;
                  downloadUrl = `https://drive.google.com/uc?export=download&id=${fileId}`;
                }

                return (
                  <div key={doc.id || idx} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-[11px] font-semibold text-text-secondary">
                        {idx === 0 ? 'Latest Resume' : `Resume ${idx + 1}`}
                        {doc.isLatestResume && (
                          <span className="ml-2 text-[9px] font-bold bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded">CURRENT</span>
                        )}
                      </div>
                      <a
                        href={downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary text-xs font-bold rounded border border-primary/20 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Download Resume</span>
                      </a>
                    </div>
                    <div className="border border-border-primary rounded overflow-hidden bg-background-secondary">
                      <iframe
                        src={embedUrl}
                        title="Resume Preview"
                        className="w-full h-[480px]"
                        allow="autoplay"
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Placement History */}
          <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
              <History className="w-4 h-4 text-primary" />
              <span>Placement Offer History</span>
            </h3>

            {student.placementHistory.length === 0 ? (
              <div className="text-xs text-text-muted font-medium py-4 text-center">
                No active placement offers logged for this student.
              </div>
            ) : (
              <div className="space-y-3">
                {student.placementHistory.map((offer: any) => (
                  <div key={offer.id} className="bg-surface-2 p-4 border border-border-primary rounded flex items-center justify-between">
                    <div className="space-y-0.5">
                      <div className="text-sm font-bold text-text-primary">{offer.job.jobTitle}</div>
                      <div className="text-xs text-text-secondary font-medium">{offer.company.name}</div>
                      <div className="text-[10px] text-text-muted">Placed: {new Date(offer.placedAt).toLocaleDateString()}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-extrabold text-success">{offer.ctc} LPA</div>
                      <span className="text-[10px] font-bold bg-success/10 text-success px-2 py-0.5 rounded border border-success/20 uppercase mt-1 inline-block">
                        {offer.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* AI ATS Matching History & Evaluator */}
          <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-border-primary pb-4">
              <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-primary" />
                <span>AI ATS Evaluation Records</span>
              </h3>
              
              {/* ATS matching dropdown and trigger */}
              {resumesList.length > 0 && student.placementStatus !== 'TERMINATED' && (
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <select
                    className="h-9 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition w-full sm:w-56"
                    value={selectedJobId}
                    onChange={(e) => setSelectedJobId(e.target.value)}
                  >
                    <option value="">Select JD for Evaluation</option>
                    {availableJobs.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.company.name} - {j.jobTitle} ({j.averageCtc} LPA)
                      </option>
                    ))}
                  </select>
                  <button
                    onClick={handleEvaluateAts}
                    disabled={!selectedJobId || evaluating}
                    className="h-9 px-3 bg-gradient-primary text-white text-xs font-bold rounded flex items-center gap-1.5 hover:brightness-110 disabled:opacity-50 transition border-0 cursor-pointer flex-shrink-0"
                  >
                    {evaluating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5" />
                        <span>Evaluate</span>
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>

            {student.atsAnalyses.length === 0 ? (
              <div className="text-xs text-text-muted font-medium py-4 text-center">
                No ATS evaluations performed on this student's resume yet.
              </div>
            ) : (
              <div className="space-y-4">
                {student.atsAnalyses.map((analysis: any) => (
                  <div key={analysis.id} className="bg-surface-2 p-4 border border-border-primary rounded space-y-3">
                    <div className="flex justify-between items-center">
                      <div>
                        <div className="text-sm font-bold text-text-primary">{analysis.job.jobTitle}</div>
                        <div className="text-xs text-text-secondary font-medium">{analysis.job.company.name}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-extrabold text-primary">{analysis.overallScore} / 100</div>
                        <div className="text-[9px] text-text-muted">AI Semantics Checked</div>
                      </div>
                    </div>

                    {/* Matched/Missing Skills */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-border-primary">
                      <div>
                        <div className="text-[10px] font-bold text-text-secondary uppercase mb-1">Matched Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {analysis.matchedSkills.map((s: string, idx: number) => (
                            <span key={idx} className="text-[10px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded">
                              {s}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] font-bold text-text-secondary uppercase mb-1">Missing Skills</div>
                        <div className="flex flex-wrap gap-1">
                          {analysis.missingSkills.map((s: string, idx: number) => (
                            <span key={idx} className="text-[10px] font-bold bg-error/10 text-error px-1.5 py-0.5 rounded">
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
          {/* Contact & Profiles Card */}
          <div className="bg-surface-1 p-6 rounded border border-border-primary space-y-4">
            <h3 className="text-xs font-bold text-text-primary uppercase tracking-wider">Contact & Profiles</h3>

            <div className="space-y-3 text-xs">
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary font-semibold truncate">{student.collegeEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary font-medium truncate">{student.personalEmail}</span>
              </div>
              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary font-semibold">{student.mobileNumber}</span>
              </div>
              <div className="flex items-center gap-3">
                <Calendar className="w-4 h-4 text-text-muted" />
                <span className="text-text-primary font-medium">Graduation Date: {new Date(student.graduationDate).toLocaleDateString()}</span>
              </div>
            </div>

            {/* Resume Documents List */}
            <div className="pt-4 border-t border-border-primary space-y-2">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Resume Documents</div>
              {resumesList.length === 0 ? (
                <div className="text-[11px] text-text-disabled italic">No resume documents uploaded.</div>
              ) : (
                resumesList.map((resume: any, idx: number) => (
                  <a
                    key={resume.id}
                    href={resume.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded border border-border-primary hover:bg-surface-2 transition duration-150 text-xs font-bold text-text-primary cursor-pointer"
                  >
                    <span className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-primary" />
                      <span>Resume (Version {resumesList.length - idx})</span>
                    </span>
                    <Download className="w-4 h-4 text-text-muted" />
                  </a>
                ))
              )}
            </div>

            {/* Social profiles and Links */}
            <div className="pt-4 border-t border-border-primary space-y-2">
              <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider mb-2">Social & Portfolios</div>
              {student.links?.githubUrl && (
                <a
                  href={student.links.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded border border-border-primary hover:bg-surface-2 transition duration-150 text-xs font-bold text-text-primary cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Github className="w-4 h-4" />
                    <span>GitHub Profile</span>
                  </span>
                  <Globe className="w-4 h-4 text-text-muted" />
                </a>
              )}
              {student.links?.linkedinUrl && (
                <a
                  href={student.links.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded border border-border-primary hover:bg-surface-2 transition duration-150 text-xs font-bold text-text-primary cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Linkedin className="w-4 h-4 text-primary" />
                    <span>LinkedIn Profile</span>
                  </span>
                  <Globe className="w-4 h-4 text-text-muted" />
                </a>
              )}
              {student.links?.portfolioUrl && (
                <a
                  href={student.links.portfolioUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between p-2 rounded border border-border-primary hover:bg-surface-2 transition duration-150 text-xs font-bold text-text-primary cursor-pointer"
                >
                  <span className="flex items-center gap-2">
                    <Globe className="w-4 h-4 text-success" />
                    <span>Portfolio Website</span>
                  </span>
                  <Globe className="w-4 h-4 text-text-muted" />
                </a>
              )}
            </div>
          </div>

          {/* Active Termination logs */}
          {student.placementStatus === 'TERMINATED' && (
            <div className="bg-error/10 p-6 rounded border border-error/20 space-y-3">
              <h3 className="text-xs font-bold text-error uppercase tracking-wider flex items-center gap-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Eligibility Terminated</span>
              </h3>

              {student.terminations.filter((t: any) => t.isActive).map((term: any) => (
                <div key={term.id} className="space-y-2 text-xs text-error">
                  <p className="leading-relaxed font-semibold">"{term.reason}"</p>
                  <div className="text-[10px] text-error/80 mt-2 font-bold">
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
        <div className="mt-4 px-6 pb-2">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Termination Reason</label>
          <textarea
            className="w-full mt-1.5 p-3 border border-border-primary rounded text-xs outline-none focus:border-danger transition h-20 resize-none bg-background-secondary text-text-primary"
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
      {/* Edit Student Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-sm flex justify-center items-center animate-in fade-in duration-200">
          <div className="bg-surface-1 max-w-2xl w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary bg-surface-2">
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider">
                Edit Candidate Details
              </h3>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1 hover:bg-surface-elevated rounded text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="border-b border-border-primary pb-2 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Personal Info</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Full Name</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editFullName}
                    onChange={(e) => setEditFullName(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Department</label>
                  <select
                    required
                    className="w-full h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
                    value={editDeptId}
                    onChange={(e) => setEditDeptId(e.target.value)}
                  >
                    <option value="">Select Department</option>
                    {depts.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Gender</label>
                  <select
                    required
                    className="w-full h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
                    value={editGender}
                    onChange={(e) => setEditGender(e.target.value)}
                  >
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Hostel Status</label>
                  <select
                    required
                    className="w-full h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
                    value={editHostelStatus}
                    onChange={(e) => setEditHostelStatus(e.target.value)}
                  >
                    <option value="HOSTEL">Hostel</option>
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Graduation Date</label>
                  <input
                    type="date"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editGraduationDate}
                    onChange={(e) => setEditGraduationDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Personal Email</label>
                  <input
                    type="email"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editPersonalEmail}
                    onChange={(e) => setEditPersonalEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">College Email</label>
                  <input
                    type="email"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editCollegeEmail}
                    onChange={(e) => setEditCollegeEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Mobile Number</label>
                  <input
                    type="text"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editMobileNumber}
                    onChange={(e) => setEditMobileNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-b border-border-primary pb-2 pt-2 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Academics (%)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">SSLC (10th)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editSslc}
                    onChange={(e) => setEditSslc(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">HSC (12th)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editHsc}
                    onChange={(e) => setEditHsc(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">UG degree</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editUg}
                    onChange={(e) => setEditUg(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">PG degree</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editPg}
                    onChange={(e) => setEditPg(e.target.value)}
                  />
                </div>
              </div>

              <div className="border-b border-border-primary pb-2 pt-2 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Social Links</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">GitHub URL</label>
                  <input
                    type="url"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editGithub}
                    onChange={(e) => setEditGithub(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">LinkedIn URL</label>
                  <input
                    type="url"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editLinkedin}
                    onChange={(e) => setEditLinkedin(e.target.value)}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Portfolio URL</label>
                  <input
                    type="url"
                    className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                    value={editPortfolio}
                    onChange={(e) => setEditPortfolio(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full h-10 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 glow-primary border-0 cursor-pointer"
              >
                {editLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Save Candidate Changes</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <ConfirmDialog
        isOpen={deleteOpen}
        title="Delete Candidate Record"
        message="Are you sure you want to permanently delete this candidate's profile? This operation is irreversible and will delete all their records, resumes, and ATS scores."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
        confirmText="Delete Record"
        type="danger"
        loading={deleteLoading}
      />
    </div>
  );
}
