import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { formatImageUrl } from '../utils/formatImageUrl';
import { useStudentStore } from '../store/studentStore';
import { Link, useNavigate } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import {
  Search, Upload, Loader2, FileSpreadsheet, X, AlertCircle,
  Edit2, Trash2, XOctagon, CheckCircle, Eye, RefreshCw, RotateCcw, Users, UserX, Undo2, Video, Plus, FileText, Globe
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import ConfirmDialog from '../components/ConfirmDialog';
import StudentAvatar from '../components/StudentAvatar';
import StudentFormModal from '../components/StudentFormModal';

type TabType = 'ALL' | 'TERMINATED' | 'DELETED';

export default function StudentsPage() {
  const navigate = useNavigate();
  const {
    students,
    total,
    loading,
    error,
    fetchStudents,
    importStudents,
    updateStudent,
    deleteStudent,
    recoverStudent,
    terminateStudent,
    revokeTermination,
  } = useStudentStore();
  const { hasPermission, user: authUser } = useAuthStore();
  const isAdmin = authUser?.roleName === 'ADMIN';

  // Tab state
  const [activeTab, setActiveTab] = useState<TabType>('ALL');

  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [gender, setGender] = useState('');
  const [hostelStatus, setHostelStatus] = useState('');
  const [page, setPage] = useState(1);
  const [refreshing, setRefreshing] = useState(false);

  const buildFilters = (tab: TabType) => {
    const base = {
      search,
      departmentId: dept,
      gender,
      hostelStatus,
      page,
      limit: 10,
    };
    if (tab === 'ALL') {
      return { ...base, placementStatus: status, includeDeleted: false };
    }
    if (tab === 'TERMINATED') {
      return { ...base, placementStatus: 'TERMINATED', includeDeleted: false };
    }
    // DELETED
    return { ...base, includeDeleted: true };
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchStudents(buildFilters(activeTab));
    } finally {
      setRefreshing(false);
    }
  };

  // Form Modal controls
  const [formModalOpen, setFormModalOpen] = useState(false);
  const [formStudent, setFormStudent] = useState<any>(null);

  // Modal controls
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
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
  const [editSelfIntroVideo, setEditSelfIntroVideo] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingStudentId, setDeletingStudentId] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [terminateOpen, setTerminateOpen] = useState(false);
  const [terminatingStudentId, setTerminatingStudentId] = useState<string | null>(null);
  const [terminateReason, setTerminateReason] = useState('');
  const [terminateLoading, setTerminateLoading] = useState(false);

  const [revokeOpen, setRevokeOpen] = useState(false);
  const [revokingStudentId, setRevokingStudentId] = useState<string | null>(null);
  const [revokeLoading, setRevokeLoading] = useState(false);

  const [recoverOpen, setRecoverOpen] = useState(false);
  const [recoveringStudentId, setRecoveringStudentId] = useState<string | null>(null);
  const [recoverLoading, setRecoverLoading] = useState(false);

  const [depts, setDepts] = useState<any[]>([]);

  const handleOpenEdit = (student: any) => {
    setFormStudent(student);
    setFormModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStudent) return;
    setEditLoading(true);
    try {
      await updateStudent(editingStudent.id, {
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
        selfIntroVideoUrl: editSelfIntroVideo || null,
      });
      setEditOpen(false);
      fetchStudents(buildFilters(activeTab));
    } catch (err: any) {
      alert(err.message || 'Update failed');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingStudentId) return;
    setDeleteLoading(true);
    try {
      await deleteStudent(deletingStudentId);
      setDeleteOpen(false);
      setDeletingStudentId(null);
      // Refresh — deleteStudent already calls refreshStudents in the store
    } catch (err: any) {
      alert(err.message || 'Deletion failed');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTerminateConfirm = async () => {
    if (!terminatingStudentId || !terminateReason) return;
    setTerminateLoading(true);
    try {
      await terminateStudent(terminatingStudentId, terminateReason);
      setTerminateOpen(false);
      setTerminatingStudentId(null);
      setTerminateReason('');
      fetchStudents(buildFilters(activeTab));
    } catch (err: any) {
      alert(err.message || 'Termination failed');
    } finally {
      setTerminateLoading(false);
    }
  };

  const handleRevokeConfirm = async () => {
    if (!revokingStudentId) return;
    setRevokeLoading(true);
    try {
      await revokeTermination(revokingStudentId);
      setRevokeOpen(false);
      setRevokingStudentId(null);
      fetchStudents(buildFilters(activeTab));
    } catch (err: any) {
      alert(err.message || 'Revocation failed');
    } finally {
      setRevokeLoading(false);
    }
  };

  const handleRecoverConfirm = async () => {
    if (!recoveringStudentId) return;
    setRecoverLoading(true);
    try {
      await recoverStudent(recoveringStudentId);
      setRecoverOpen(false);
      setRecoveringStudentId(null);
      // recoverStudent in store calls refreshStudents
    } catch (err: any) {
      alert(err.message || 'Recovery failed');
    } finally {
      setRecoverLoading(false);
    }
  };

  useEffect(() => {
    const loadDepts = async () => {
      try {
        const res = await apiFetch('/api/students/departments');
        const result = await res.json();
        if (result.success) setDepts(result.data);
      } catch (err) {
        console.error('Failed to load departments:', err);
      }
    };
    loadDepts();
  }, []);

  useEffect(() => {
    fetchStudents(buildFilters(activeTab));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, dept, status, gender, hostelStatus, page, activeTab]);

  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setPage(1);
    setStatus('');
  };

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;
    setImportLoading(true);
    setImportResult(null);
    try {
      const result = await importStudents(importFile);
      setImportResult(result);
      // importStudents in store already re-fetches list — no need to call again
    } catch (err) {
      console.error(err);
    } finally {
      setImportLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Students</h1>
          <p className="text-xs text-text-muted mt-1">Filter and manage student academic benchmarks and directory records.</p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-1.5 px-3 py-2 border border-border-primary hover:border-border-hover text-text-primary text-xs font-semibold rounded bg-surface-1 transition cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
          {hasPermission('STUDENT_CREATE') && (
            <button
              onClick={() => {
                setFormStudent(null);
                setFormModalOpen(true);
              }}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-primary hover:brightness-110 text-white text-xs font-semibold rounded glow-primary border-0 transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Student</span>
            </button>
          )}
          {hasPermission('STUDENT_IMPORT') && (
            <button
              onClick={() => {
                setImportOpen(true);
                setImportFile(null);
                setImportResult(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-border-primary bg-surface-1 text-text-primary hover:border-border-hover text-xs font-semibold rounded transition duration-150 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-0 border-b border-border-primary">
        {([
          { key: 'ALL', label: 'All Students', icon: Users },
          { key: 'TERMINATED', label: 'Terminated', icon: UserX },
          { key: 'DELETED', label: 'Deleted Records', icon: Trash2 },
        ] as const).map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => handleTabChange(key)}
            className={`flex items-center gap-2 px-5 py-3 text-xs font-bold border-b-2 transition cursor-pointer ${
              activeTab === key
                ? 'border-primary text-primary'
                : 'border-transparent text-text-muted hover:text-text-primary'
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface-1 p-4 rounded border border-border-primary flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-text-muted">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full h-10 pl-9 pr-4 border border-border-primary rounded text-xs outline-none bg-background-secondary focus:border-primary text-text-primary transition"
            placeholder="Search roll number, name, email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 w-full md:w-auto">
          {/* Department */}
          <select
            className="h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
            value={dept}
            onChange={(e) => { setDept(e.target.value); setPage(1); }}
          >
            <option value="">All Departments</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>

          {/* Status (only for ALL tab) */}
          {activeTab === 'ALL' && (
            <select
              className="h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
              value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); }}
            >
              <option value="">All Statuses</option>
              <option value="YET_TO_BE_PLACED">Yet To Be Placed</option>
              <option value="PLACED">Placed</option>
              <option value="TERMINATED">Terminated</option>
            </select>
          )}

          {/* Gender */}
          <select
            className="h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
            value={gender}
            onChange={(e) => { setGender(e.target.value); setPage(1); }}
          >
            <option value="">All Genders</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
          </select>

          {/* Hostel Status */}
          <select
            className="h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition"
            value={hostelStatus}
            onChange={(e) => { setHostelStatus(e.target.value); setPage(1); }}
          >
            <option value="">All Residencies</option>
            <option value="HOSTEL">Hostel</option>
            <option value="DAY_SCHOLAR">Day Scholar</option>
          </select>
        </div>
      </div>

      {/* Deleted tab warning */}
      {activeTab === 'DELETED' && (
        <div className="flex items-center gap-3 bg-warning/10 border border-warning/30 rounded px-4 py-3 text-xs text-warning font-semibold">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>These records have been soft-deleted. Use the <strong>Recover</strong> action to restore a student profile.</span>
        </div>
      )}

      {/* Students Data Table */}
      <div className="bg-surface-1 rounded border border-border-primary overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-background-tertiary border-b border-border-primary text-[11px] font-bold text-text-muted uppercase tracking-wider">
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4 text-center">SSLC %</th>
                <th className="px-6 py-4 text-center">HSC %</th>
                <th className="px-6 py-4 text-center">UG %</th>
                <th className="px-6 py-4 text-center">Self Intro Video</th>
                {activeTab !== 'DELETED' && <th className="px-6 py-4 text-center">Status</th>}
                {activeTab === 'DELETED' && <th className="px-6 py-4 text-center">Deleted On</th>}
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-primary text-sm text-text-secondary">
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-text-muted font-medium">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <span>Loading student directory...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={10} className="text-center py-12 text-text-muted font-medium">
                    {activeTab === 'DELETED'
                      ? 'No deleted records found.'
                      : activeTab === 'TERMINATED'
                      ? 'No terminated students found.'
                      : 'No matching student records found.'}
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-surface-2/40 cursor-pointer transition duration-150"
                    onClick={() => activeTab !== 'DELETED' && navigate(`/students/${student.id}`)}
                  >
                    <td className="px-6 py-4 font-mono text-xs font-bold text-text-muted">
                      {student.rollNumber || '—'}
                    </td>
                    <td className="px-6 py-4 font-semibold text-text-primary">
                      <div className="flex items-center gap-3">
                        <StudentAvatar name={student.fullName} photoUrl={(student as any).studentPhotoUrl} size="sm" />
                        <span>{student.fullName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs font-medium text-text-muted">{student.department?.name || '—'}</td>
                    <td className="px-6 py-4 text-xs font-medium">{student.gender || '—'}</td>
                    <td className="px-6 py-4 text-center text-xs font-semibold">{student.academics?.sslcPercentage ? `${student.academics.sslcPercentage}%` : '—'}</td>
                    <td className="px-6 py-4 text-center text-xs font-semibold">{student.academics?.hscPercentage ? `${student.academics.hscPercentage}%` : '—'}</td>
                    <td className="px-6 py-4 text-center text-xs font-semibold">{student.academics?.ugPercentage ? `${student.academics.ugPercentage}%` : '—'}</td>
                    <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                      {(student as any).selfIntroVideoUrl ? (
                        <a
                          href={(student as any).selfIntroVideoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-[11px] font-bold text-primary hover:bg-primary/20 transition cursor-pointer"
                          title="Watch Self Intro Video"
                        >
                          <Video className="w-3.5 h-3.5" />
                          <span>Watch Intro</span>
                        </a>
                      ) : (
                        <span className="text-[11px] text-text-disabled font-medium">—</span>
                      )}
                    </td>
                    {activeTab !== 'DELETED' && (
                      <td className="px-6 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {isAdmin ? (
                          <select
                            value={student.placementStatus}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                await updateStudent(student.id, { placementStatus: newStatus as any });
                                fetchStudents(buildFilters(activeTab));
                              } catch (err: any) {
                                alert(err.message || 'Status update failed');
                              }
                            }}
                            className="px-2 py-1 bg-surface-2 border border-border-primary rounded text-xs font-bold text-text-primary outline-none cursor-pointer focus:border-primary hover:border-border-hover transition"
                          >
                            <option value="YET_TO_BE_PLACED">Yet To Be Placed</option>
                            <option value="PLACED">Placed</option>
                            <option value="TERMINATED">Terminated</option>
                          </select>
                        ) : (
                          <StatusBadge status={student.placementStatus} />
                        )}
                      </td>
                    )}
                    {activeTab === 'DELETED' && (
                      <td className="px-6 py-4 text-center text-xs text-text-muted">
                        {student.deletedAt ? new Date(student.deletedAt).toLocaleDateString() : '—'}
                      </td>
                    )}
                    <td className="px-6 py-4 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex gap-2 justify-end items-center">
                        {/* View — not for deleted */}
                        {activeTab !== 'DELETED' && (
                          <Link
                            to={`/students/${student.id}`}
                            className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded hover:text-primary transition"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Link>
                        )}

                        {/* DELETED tab — recover button */}
                        {activeTab === 'DELETED' && isAdmin && (
                          <button
                            onClick={() => {
                              setRecoveringStudentId(student.id);
                              setRecoverOpen(true);
                            }}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 hover:bg-primary/20 border border-primary/30 rounded text-primary text-xs font-bold transition cursor-pointer"
                            title="Recover Student"
                          >
                            <Undo2 className="w-3.5 h-3.5" />
                            Recover
                          </button>
                        )}

                        {/* ALL tab admin actions */}
                        {activeTab !== 'DELETED' && isAdmin && (
                          <>
                            <button
                              onClick={() => handleOpenEdit(student)}
                              className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded hover:text-primary transition cursor-pointer"
                              title="Edit Student"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            {student.placementStatus !== 'TERMINATED' ? (
                              <button
                                onClick={() => {
                                  setTerminatingStudentId(student.id);
                                  setTerminateReason('');
                                  setTerminateOpen(true);
                                }}
                                className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-error hover:bg-error/10 transition cursor-pointer"
                                title="Terminate Eligibility"
                              >
                                <XOctagon className="w-3.5 h-3.5" />
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setRevokingStudentId(student.id);
                                  setRevokeOpen(true);
                                }}
                                className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-success hover:bg-success/10 transition cursor-pointer"
                                title="Revoke Termination"
                              >
                                <CheckCircle className="w-3.5 h-3.5" />
                              </button>
                            )}

                            <button
                              onClick={() => {
                                setDeletingStudentId(student.id);
                                setDeleteOpen(true);
                              }}
                              className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-error hover:bg-error/10 transition cursor-pointer"
                              title="Soft-Delete Student"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-border-primary bg-background-tertiary flex justify-between items-center text-xs">
            <span className="text-text-muted font-medium">
              Showing {students.length} of {total} records
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-border-primary rounded bg-surface-2 disabled:opacity-50 text-text-secondary text-xs font-semibold hover:bg-surface-elevated transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1.5 border border-border-primary rounded bg-surface-2 disabled:opacity-50 text-text-secondary text-xs font-semibold hover:bg-surface-elevated transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── IMPORT MODAL ── */}
      {importOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-background/80 flex justify-center items-center">
          <div className="bg-surface-1 max-w-xl w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary bg-surface-2">
              <h3 className="font-extrabold text-text-primary flex items-center gap-2 text-sm">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span>Import Student Records (Excel/CSV)</span>
              </h3>
              <button onClick={() => setImportOpen(false)} className="p-1 hover:bg-surface-elevated rounded">
                <X className="w-5 h-5 text-text-muted" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {!importResult ? (
                <form onSubmit={handleImportSubmit} className="space-y-4">
                  <div className="border-2 border-dashed border-border-primary hover:border-border-hover p-8 rounded text-center space-y-3 cursor-pointer relative bg-background-secondary">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <Upload className="w-8 h-8 text-text-muted mx-auto" />
                    <div className="text-xs font-bold text-text-primary">
                      {importFile ? importFile.name : 'Select or drag spreadsheet file here'}
                    </div>
                    <div className="text-[10px] text-text-muted">Supports Excel workbook formats (.xlsx) and CSV files up to 5MB.</div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border-primary">
                    <button
                      type="button"
                      onClick={() => setImportOpen(false)}
                      className="px-4 py-2 border border-border-primary text-xs font-semibold rounded hover:bg-surface-2 transition text-text-secondary"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!importFile || importLoading}
                      className="px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-50 text-white text-xs font-semibold rounded flex items-center gap-2 transition cursor-pointer"
                    >
                      {importLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading & Processing...</span>
                        </>
                      ) : (
                        <span>Verify &amp; Import</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-background-secondary p-3 rounded border border-border-primary">
                      <div className="text-lg font-extrabold text-text-primary">{importResult.totalRows}</div>
                      <div className="text-[10px] font-bold text-text-muted uppercase mt-0.5">Total Checked</div>
                    </div>
                    <div className="bg-success/10 p-3 rounded border border-success/20">
                      <div className="text-lg font-extrabold text-success">{importResult.successCount}</div>
                      <div className="text-[10px] font-bold text-success uppercase mt-0.5">Success</div>
                    </div>
                    <div className="bg-warning/10 p-3 rounded border border-warning/20">
                      <div className="text-lg font-extrabold text-warning">{importResult.duplicates?.length ?? 0}</div>
                      <div className="text-[10px] font-bold text-warning uppercase mt-0.5">Duplicates</div>
                    </div>
                    <div className="bg-danger/10 p-3 rounded border border-danger/20">
                      <div className="text-lg font-extrabold text-danger">{importResult.errors?.length ?? 0}</div>
                      <div className="text-[10px] font-bold text-danger uppercase mt-0.5">Errors</div>
                    </div>
                  </div>

                  {importResult.successCount > 0 && (
                    <div className="flex items-center gap-2 bg-success/10 border border-success/20 rounded px-4 py-2.5 text-xs text-success font-semibold">
                      <CheckCircle className="w-4 h-4" />
                      <span>{importResult.successCount} student(s) imported — the list below has been updated.</span>
                    </div>
                  )}

                  {importResult.errors?.length > 0 && (
                    <div className="border border-danger/20 rounded overflow-hidden max-h-48 overflow-y-auto">
                      <div className="bg-danger/10 px-4 py-2 border-b border-danger/20 text-xs font-bold text-danger flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Validation Failures (Row Breakdown)</span>
                      </div>
                      <table className="w-full text-left border-collapse text-xs">
                        <tbody className="divide-y divide-border-primary bg-background-secondary">
                          {importResult.errors.map((err: any, idx: number) => (
                            <tr key={idx}>
                              <td className="px-4 py-2.5 font-bold text-danger w-16">Row {err.row}</td>
                              <td className="px-4 py-2.5 text-text-secondary">{err.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-border-primary">
                    <button
                      onClick={() => setImportOpen(false)}
                      className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded hover:bg-primary/90 transition cursor-pointer"
                    >
                      Done
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ── */}
      {editOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-sm flex justify-center items-center animate-in fade-in duration-200">
          <div className="bg-surface-1 max-w-2xl w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary bg-surface-2">
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider">Edit Candidate Details</h3>
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
                  <input type="text" required className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={editFullName} onChange={(e) => setEditFullName(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Department</label>
                  <select required className="w-full h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition" value={editDeptId} onChange={(e) => setEditDeptId(e.target.value)}>
                    <option value="">Select Department</option>
                    {depts.map((d) => (<option key={d.id} value={d.id}>{d.name}</option>))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Gender</label>
                  <select required className="w-full h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition" value={editGender} onChange={(e) => setEditGender(e.target.value)}>
                    <option value="MALE">Male</option>
                    <option value="FEMALE">Female</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Hostel Status</label>
                  <select required className="w-full h-10 border border-border-primary rounded px-3 text-xs bg-background-secondary text-text-primary focus:border-primary outline-none transition" value={editHostelStatus} onChange={(e) => setEditHostelStatus(e.target.value)}>
                    <option value="HOSTEL">Hostel</option>
                    <option value="DAY_SCHOLAR">Day Scholar</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Graduation Date</label>
                  <input type="date" required className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={editGraduationDate} onChange={(e) => setEditGraduationDate(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Personal Email</label>
                  <input type="email" required className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={editPersonalEmail} onChange={(e) => setEditPersonalEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">College Email</label>
                  <input type="email" required className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={editCollegeEmail} onChange={(e) => setEditCollegeEmail(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Mobile Number</label>
                  <input type="text" required className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={editMobileNumber} onChange={(e) => setEditMobileNumber(e.target.value)} />
                </div>
              </div>
              <div className="border-b border-border-primary pb-2 pt-2 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Academics (%)</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'SSLC (10th)', val: editSslc, set: setEditSslc, required: true },
                  { label: 'HSC (12th)', val: editHsc, set: setEditHsc, required: true },
                  { label: 'UG Degree', val: editUg, set: setEditUg, required: true },
                  { label: 'PG Degree', val: editPg, set: setEditPg, required: false },
                ].map(({ label, val, set, required }) => (
                  <div key={label} className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">{label}</label>
                    <input type="number" step="0.01" required={required} className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={val} onChange={(e) => set(e.target.value)} />
                  </div>
                ))}
              </div>
              <div className="border-b border-border-primary pb-2 pt-2 mb-2">
                <span className="text-xs font-bold text-primary uppercase tracking-wider">Social Links</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">GitHub URL</label>
                  <input type="url" className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={editGithub} onChange={(e) => setEditGithub(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">LinkedIn URL</label>
                  <input type="url" className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={editLinkedin} onChange={(e) => setEditLinkedin(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Portfolio URL</label>
                  <input type="url" className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition" value={editPortfolio} onChange={(e) => setEditPortfolio(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Self Intro Video URL</label>
                  <input type="url" placeholder="https://youtube.com/watch?v=..." className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition font-mono" value={editSelfIntroVideo} onChange={(e) => setEditSelfIntroVideo(e.target.value)} />
                </div>
              </div>

              <button
                type="submit"
                disabled={editLoading}
                className="w-full h-10 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 border-0 cursor-pointer"
              >
                {editLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Save Candidate Changes</span>}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── DIALOGS ── */}
      <ConfirmDialog
        isOpen={deleteOpen}
        title="Move Candidate to Deleted"
        message="This will soft-delete the student record. The record will move to the 'Deleted Records' tab and can be recovered later by an admin."
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteOpen(false)}
        confirmText="Delete Record"
        type="danger"
        loading={deleteLoading}
      />

      <ConfirmDialog
        isOpen={recoverOpen}
        title="Recover Deleted Student"
        message="This will restore the student record to the active directory. They will appear on the Candidates list again."
        onConfirm={handleRecoverConfirm}
        onCancel={() => setRecoverOpen(false)}
        confirmText="Recover Student"
        type="info"
        loading={recoverLoading}
      />

      <ConfirmDialog
        isOpen={terminateOpen}
        title="Terminate Student Placement Eligibility"
        message="Are you sure you want to terminate this student from participating in placement drives? The student will be set as ineligible."
        onConfirm={handleTerminateConfirm}
        onCancel={() => setTerminateOpen(false)}
        confirmText="Terminate Eligibility"
        type="danger"
        loading={terminateLoading}
      >
        <div className="mt-4 px-6 pb-2">
          <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Termination Reason</label>
          <textarea
            className="w-full mt-1.5 p-3 border border-border-primary rounded text-xs outline-none focus:border-danger transition h-20 resize-none bg-background-secondary text-text-primary"
            placeholder="Specify reason for termination (required)..."
            value={terminateReason}
            onChange={(e) => setTerminateReason(e.target.value)}
          />
        </div>
      </ConfirmDialog>

      <ConfirmDialog
        isOpen={revokeOpen}
        title="Revoke Placement Termination"
        message="Are you sure you want to revoke this student's placement termination and reinstate their eligibility status?"
        onConfirm={handleRevokeConfirm}
        onCancel={() => setRevokeOpen(false)}
        confirmText="Revoke & Reinstate"
        type="info"
        loading={revokeLoading}
      />

      {/* Student Add & Edit Form Modal */}
      <StudentFormModal
        isOpen={formModalOpen}
        student={formStudent}
        onClose={() => setFormModalOpen(false)}
        onSuccess={() => fetchStudents({ page: 1, limit: 10 })}
      />
    </div>
  );
}
