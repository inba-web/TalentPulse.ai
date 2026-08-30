import React, { useState, useEffect } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useStudentStore } from '../store/studentStore';
import { X, Loader2, User, BookOpen, Mail, Globe, Award, Image, Upload } from 'lucide-react';
import StudentAvatar from './StudentAvatar';

interface StudentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: any | null; // Null for creation, student object for editing
  onSuccess?: () => void;
}

export default function StudentFormModal({ isOpen, onClose, student, onSuccess }: StudentFormModalProps) {
  const isEditing = Boolean(student);
  const { updateStudent, fetchStudents } = useStudentStore();

  const [departments, setDepartments] = useState<any[]>([]);
  const [loadingDepts, setLoadingDepts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State Fields
  const [fullName, setFullName] = useState('');
  const [rollNumber, setRollNumber] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [gender, setGender] = useState('MALE');
  const [hostelStatus, setHostelStatus] = useState('DAY_SCHOLAR');
  const [graduationDate, setGraduationDate] = useState('');
  const [studentPhotoUrl, setStudentPhotoUrl] = useState('');

  const [personalEmail, setPersonalEmail] = useState('');
  const [collegeEmail, setCollegeEmail] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');

  const [sslcPercentage, setSslcPercentage] = useState('');
  const [hscPercentage, setHscPercentage] = useState('');
  const [ugPercentage, setUgPercentage] = useState('');
  const [pgPercentage, setPgPercentage] = useState('');

  const [githubUrl, setGithubUrl] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [portfolioUrl, setPortfolioUrl] = useState('');
  const [selfIntroVideoUrl, setSelfIntroVideoUrl] = useState('');

  const [placementStatus, setPlacementStatus] = useState('YET_TO_BE_PLACED');

  useEffect(() => {
    const loadDepartments = async () => {
      setLoadingDepts(true);
      try {
        const res = await apiFetch('/api/students/departments');
        const result = await res.json();
        if (result.success) setDepartments(result.data || []);
      } catch (err) {
        console.error('Failed to load departments:', err);
      } finally {
        setLoadingDepts(false);
      }
    };
    if (isOpen) loadDepartments();
  }, [isOpen]);

  useEffect(() => {
    if (student) {
      setFullName(student.fullName || '');
      setRollNumber(student.rollNumber || '');
      setDepartmentId(student.departmentId || student.department?.id || '');
      setGender(student.gender || 'MALE');
      setHostelStatus(student.hostelStatus || 'DAY_SCHOLAR');
      setGraduationDate(student.graduationDate ? new Date(student.graduationDate).toISOString().split('T')[0] : '');
      setStudentPhotoUrl(student.studentPhotoUrl || '');

      setPersonalEmail(student.personalEmail || '');
      setCollegeEmail(student.collegeEmail || '');
      setMobileNumber(student.mobileNumber || '');

      setSslcPercentage(student.academics?.sslcPercentage !== undefined ? String(student.academics.sslcPercentage) : '');
      setHscPercentage(student.academics?.hscPercentage !== undefined ? String(student.academics.hscPercentage) : '');
      setUgPercentage(student.academics?.ugPercentage !== undefined ? String(student.academics.ugPercentage) : '');
      setPgPercentage(student.academics?.pgPercentage !== undefined && student.academics?.pgPercentage !== null ? String(student.academics.pgPercentage) : '');

      setGithubUrl(student.links?.githubUrl || '');
      setLinkedinUrl(student.links?.linkedinUrl || '');
      setPortfolioUrl(student.links?.portfolioUrl || '');
      setSelfIntroVideoUrl(student.selfIntroVideoUrl || '');

      setPlacementStatus(student.placementStatus || 'YET_TO_BE_PLACED');
    } else {
      // Creation Defaults
      setFullName('');
      setRollNumber('');
      setDepartmentId('');
      setGender('MALE');
      setHostelStatus('DAY_SCHOLAR');
      setGraduationDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
      setStudentPhotoUrl('');

      setPersonalEmail('');
      setCollegeEmail('');
      setMobileNumber('');

      setSslcPercentage('');
      setHscPercentage('');
      setUgPercentage('');
      setPgPercentage('');

      setGithubUrl('');
      setLinkedinUrl('');
      setPortfolioUrl('');
      setSelfIntroVideoUrl('');

      setPlacementStatus('YET_TO_BE_PLACED');
    }
    setErrorMsg('');
  }, [student, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    const payload = {
      fullName: fullName.trim(),
      rollNumber: rollNumber.trim().toUpperCase(),
      departmentId,
      gender,
      hostelStatus,
      graduationDate,
      studentPhotoUrl: studentPhotoUrl.trim() || null,
      personalEmail: personalEmail.trim(),
      collegeEmail: collegeEmail.trim(),
      mobileNumber: mobileNumber.trim(),
      sslcPercentage: Number(sslcPercentage),
      hscPercentage: Number(hscPercentage),
      ugPercentage: Number(ugPercentage),
      pgPercentage: pgPercentage ? Number(pgPercentage) : null,
      githubUrl: githubUrl.trim() || null,
      linkedinUrl: linkedinUrl.trim() || null,
      portfolioUrl: portfolioUrl.trim() || null,
      selfIntroVideoUrl: selfIntroVideoUrl.trim() || null,
      placementStatus,
    };

    try {
      if (isEditing) {
        await updateStudent(student.id, payload);
      } else {
        const res = await apiFetch('/api/students', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error?.message || 'Failed to create student profile');
      }

      fetchStudents({ page: 1, limit: 10 });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/75 backdrop-blur-sm flex justify-center items-center animate-in fade-in duration-200">
      <div className="bg-surface-1 max-w-3xl w-full rounded-xl border border-border-primary shadow-2xl overflow-hidden animate-in zoom-in duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary bg-surface-2">
          <div>
            <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span>{isEditing ? 'Edit Student Directory Profile' : 'Add New Student Record'}</span>
            </h3>
            <p className="text-[11px] text-text-muted mt-0.5">Fill academic benchmarks and contact info into the directory.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-surface-elevated rounded text-text-muted hover:text-text-primary transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {errorMsg && (
            <div className="p-3 bg-error/15 border border-error/30 text-error text-xs rounded font-semibold">
              {errorMsg}
            </div>
          )}

          {/* Avatar Preview Header */}
          <div className="flex items-center gap-4 bg-background-secondary p-4 rounded-lg border border-border-primary">
            <StudentAvatar name={fullName || 'New Student'} photoUrl={studentPhotoUrl} size="lg" />
            <div className="flex-1 space-y-1">
              <div className="text-xs font-bold text-text-primary">
                {fullName || 'Student Full Name'}
              </div>
              <div className="text-[10px] text-text-muted font-mono">
                {rollNumber || 'ROLL-NUMBER'} &bull; {placementStatus}
              </div>
            </div>
          </div>

          {/* 1. Personal Information */}
          <div className="space-y-3">
            <div className="border-b border-border-primary pb-1 flex items-center gap-2">
              <User className="w-4 h-4 text-primary" />
              <span className="text-xs font-extrabold text-primary uppercase tracking-wider">1. Personal Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. INBAVARUNAN S"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Roll Number *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. RCAS2026CSE001"
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition font-mono uppercase"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Gender *</label>
                <select
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
                >
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Residency *</label>
                <select
                  value={hostelStatus}
                  onChange={(e) => setHostelStatus(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
                >
                  <option value="DAY_SCHOLAR">Day Scholar</option>
                  <option value="HOSTEL">Hostel</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Graduation Date *</label>
                <input
                  type="date"
                  required
                  value={graduationDate}
                  onChange={(e) => setGraduationDate(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Profile Photo URL (Direct image or Google Drive link)</label>
              <input
                type="url"
                placeholder="https://..."
                value={studentPhotoUrl}
                onChange={(e) => setStudentPhotoUrl(e.target.value)}
                className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
              />
            </div>
          </div>

          {/* 2. Academic Information */}
          <div className="space-y-3">
            <div className="border-b border-border-primary pb-1 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-xs font-extrabold text-primary uppercase tracking-wider">2. Academic Information</span>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Department *</label>
              <select
                required
                value={departmentId}
                onChange={(e) => setDepartmentId(e.target.value)}
                className="w-full h-9 px-3 border border-border-primary rounded text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
              >
                <option value="">Select Academic Department</option>
                {departments.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} ({d.code})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">SSLC % *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 92.5"
                  value={sslcPercentage}
                  onChange={(e) => setSslcPercentage(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">HSC % *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 88.0"
                  value={hscPercentage}
                  onChange={(e) => setHscPercentage(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">UG Degree % *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  placeholder="e.g. 84.2"
                  value={ugPercentage}
                  onChange={(e) => setUgPercentage(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">PG Degree % (Optional)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g. 89.0"
                  value={pgPercentage}
                  onChange={(e) => setPgPercentage(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
            </div>
          </div>

          {/* 3. Contact Information */}
          <div className="space-y-3">
            <div className="border-b border-border-primary pb-1 flex items-center gap-2">
              <Mail className="w-4 h-4 text-primary" />
              <span className="text-xs font-extrabold text-primary uppercase tracking-wider">3. Contact Information</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">College Email *</label>
                <input
                  type="email"
                  required
                  placeholder="student@college.edu"
                  value={collegeEmail}
                  onChange={(e) => setCollegeEmail(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Personal Email *</label>
                <input
                  type="email"
                  required
                  placeholder="student@gmail.com"
                  value={personalEmail}
                  onChange={(e) => setPersonalEmail(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 9876543210"
                  value={mobileNumber}
                  onChange={(e) => setMobileNumber(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition font-mono"
                />
              </div>
            </div>
          </div>

          {/* 4. Professional Links */}
          <div className="space-y-3">
            <div className="border-b border-border-primary pb-1 flex items-center gap-2">
              <Globe className="w-4 h-4 text-primary" />
              <span className="text-xs font-extrabold text-primary uppercase tracking-wider">4. Professional Profiles</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">GitHub Profile URL</label>
                <input
                  type="url"
                  placeholder="https://github.com/username"
                  value={githubUrl}
                  onChange={(e) => setGithubUrl(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">LinkedIn Profile URL</label>
                <input
                  type="url"
                  placeholder="https://linkedin.com/in/username"
                  value={linkedinUrl}
                  onChange={(e) => setLinkedinUrl(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-text-muted uppercase">Portfolio / Website URL</label>
                <input
                  type="url"
                  placeholder="https://portfolio.dev"
                  value={portfolioUrl}
                  onChange={(e) => setPortfolioUrl(e.target.value)}
                  className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Self Introduction Video Link (YouTube/Loom)</label>
              <input
                type="url"
                placeholder="https://youtube.com/watch?v=..."
                value={selfIntroVideoUrl}
                onChange={(e) => setSelfIntroVideoUrl(e.target.value)}
                className="w-full h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
              />
            </div>
          </div>

          {/* 5. Placement Status */}
          <div className="space-y-3">
            <div className="border-b border-border-primary pb-1 flex items-center gap-2">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-xs font-extrabold text-primary uppercase tracking-wider">5. Initial Placement Status</span>
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-text-muted uppercase">Status *</label>
              <select
                value={placementStatus}
                onChange={(e) => setPlacementStatus(e.target.value)}
                className="w-full h-9 px-3 border border-border-primary rounded text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition font-bold"
              >
                <option value="YET_TO_BE_PLACED">Yet To Be Placed</option>
                <option value="PLACED">Placed</option>
                <option value="TERMINATED">Terminated</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-border-primary text-xs font-semibold rounded hover:bg-surface-2 transition text-text-secondary cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold rounded flex items-center gap-2 transition cursor-pointer glow-primary border-0"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving Record...</span>
                </>
              ) : (
                <span>{isEditing ? 'Save Changes' : 'Create Student Record'}</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
