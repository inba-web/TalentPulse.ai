import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { formatImageUrl } from '../utils/formatImageUrl';
import {
  X,
  Search,
  CheckCircle2,
  Users,
  Video,
  FileText,
  Loader2,
  UserPlus,
  Trash2,
  Play,
  Download,
  Filter,
  CheckSquare,
  Square,
  AlertCircle
} from 'lucide-react';

interface DriveManagementModalProps {
  isOpen: boolean;
  job: any;
  onClose: () => void;
}

export default function DriveManagementModal({ isOpen, job, onClose }: DriveManagementModalProps) {
  const [loading, setLoading] = useState(true);
  const [driveData, setDriveData] = useState<any>(null);
  const [activeStatusTab, setActiveStatusTab] = useState<string>('ALL');
  const [search, setSearch] = useState('');
  
  // Selection for bulk status updates
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);

  // Candidate register drawer state
  const [registerOpen, setRegisterOpen] = useState(false);
  const [availableStudents, setAvailableStudents] = useState<any[]>([]);
  const [registerSearch, setRegisterSearch] = useState('');
  const [selectedRegisterIds, setSelectedRegisterIds] = useState<string[]>([]);
  const [registerLoading, setRegisterLoading] = useState(false);

  const loadDriveData = async () => {
    if (!job?.id) return;
    setLoading(true);
    try {
      const url = `/api/drives/job/${job.id}/students?status=${activeStatusTab}&search=${encodeURIComponent(search)}`;
      const res = await apiFetch(url);
      const result = await res.json();
      if (result.success) {
        setDriveData(result.data);
      }
    } catch (err) {
      console.error('Failed to load drive candidates:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableStudents = async () => {
    try {
      const res = await apiFetch(`/api/students?limit=100&search=${encodeURIComponent(registerSearch)}`);
      const result = await res.json();
      if (result.success) {
        setAvailableStudents(result.data.students || []);
      }
    } catch (err) {
      console.error('Failed to load students for registration:', err);
    }
  };

  useEffect(() => {
    if (isOpen && job?.id) {
      loadDriveData();
      setSelectedIds([]);
    }
  }, [isOpen, job?.id, activeStatusTab, search]);

  useEffect(() => {
    if (registerOpen) {
      loadAvailableStudents();
    }
  }, [registerOpen, registerSearch]);

  if (!isOpen || !job) return null;

  const handleStatusChange = async (studentId: string, newStatus: string) => {
    try {
      const res = await apiFetch(`/api/drives/job/${job.id}/students/${studentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        await loadDriveData();
      } else {
        alert(result.error?.message || 'Failed to update candidate status');
      }
    } catch (err: any) {
      alert(err.message || 'Status update failed');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedIds.length === 0) return;
    setBulkLoading(true);
    try {
      const res = await apiFetch(`/api/drives/job/${job.id}/bulk-status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedIds, status: newStatus }),
      });
      const result = await res.json();
      if (result.success) {
        setSelectedIds([]);
        await loadDriveData();
      } else {
        alert(result.error?.message || 'Bulk status update failed');
      }
    } catch (err: any) {
      alert(err.message || 'Bulk update failed');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleRemoveCandidate = async (studentId: string) => {
    if (!confirm('Remove candidate from this drive registration list?')) return;
    try {
      const res = await apiFetch(`/api/drives/job/${job.id}/students/${studentId}`, {
        method: 'DELETE',
      });
      const result = await res.json();
      if (result.success) {
        await loadDriveData();
      }
    } catch (err: any) {
      alert(err.message || 'Removal failed');
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRegisterIds.length === 0) return;
    setRegisterLoading(true);
    try {
      const res = await apiFetch(`/api/drives/job/${job.id}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentIds: selectedRegisterIds }),
      });
      const result = await res.json();
      if (result.success) {
        setRegisterOpen(false);
        setSelectedRegisterIds([]);
        await loadDriveData();
      } else {
        alert(result.error?.message || 'Registration failed');
      }
    } catch (err: any) {
      alert(err.message || 'Registration failed');
    } finally {
      setRegisterLoading(false);
    }
  };

  const studentsList = driveData?.students || [];
  const stats = driveData?.stats || {
    totalRegistered: 0,
    totalAttended: 0,
    totalShortlisted: 0,
    totalSelected: 0,
    totalRejected: 0,
    totalCount: 0,
    aggregateAttended: 0,
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === studentsList.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(studentsList.map((s: any) => s.studentId));
    }
  };

  const toggleSelectStudent = (studentId: string) => {
    if (selectedIds.includes(studentId)) {
      setSelectedIds((prev) => prev.filter((id) => id !== studentId));
    } else {
      setSelectedIds((prev) => [...prev, studentId]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/70 backdrop-blur-sm flex justify-center items-center p-4 sm:p-6 animate-in fade-in duration-200">
      <div className="bg-surface-1 max-w-6xl w-full h-[90vh] rounded-2xl border border-border-primary shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        
        {/* Modal Top Header */}
        <div className="px-6 py-5 border-b border-border-primary bg-surface-2 flex justify-between items-center flex-shrink-0">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-extrabold text-text-primary tracking-tight">{job.jobTitle}</h2>
              <span className="text-xs font-extrabold bg-primary/10 text-primary border border-primary/20 px-2.5 py-0.5 rounded-full">
                {job.company?.name}
              </span>
            </div>
            <p className="text-xs text-text-muted mt-1">
              Package: <span className="font-bold text-text-primary">{job.ctc} LPA</span> &bull; Location: <span className="font-bold text-text-primary">{job.location}</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setRegisterOpen(true);
                setSelectedRegisterIds([]);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-primary hover:brightness-110 text-white text-xs font-bold rounded-lg shadow glow-primary transition cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Register Candidates</span>
            </button>
            <button onClick={onClose} className="p-2 hover:bg-surface-3 rounded-lg text-text-muted hover:text-text-primary transition cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drive Metrics Dashboard */}
        <div className="px-6 py-4 border-b border-border-primary bg-background-tertiary grid grid-cols-2 sm:grid-cols-5 gap-3 flex-shrink-0">
          <div className="bg-surface-1 p-3 border border-border-primary rounded-xl text-center shadow-xs">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Registered</div>
            <div className="text-xl font-extrabold text-text-primary mt-0.5">{stats.totalRegistered}</div>
          </div>
          <div className="bg-surface-1 p-3 border border-border-primary rounded-xl text-center shadow-xs">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Attended</div>
            <div className="text-xl font-extrabold text-primary mt-0.5">{stats.aggregateAttended}</div>
          </div>
          <div className="bg-surface-1 p-3 border border-border-primary rounded-xl text-center shadow-xs">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Shortlisted</div>
            <div className="text-xl font-extrabold text-warning mt-0.5">{stats.totalShortlisted}</div>
          </div>
          <div className="bg-surface-1 p-3 border border-border-primary rounded-xl text-center shadow-xs">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Selected</div>
            <div className="text-xl font-extrabold text-success mt-0.5">{stats.totalSelected}</div>
          </div>
          <div className="bg-surface-1 p-3 border border-border-primary rounded-xl text-center shadow-xs">
            <div className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Rejected</div>
            <div className="text-xl font-extrabold text-error mt-0.5">{stats.totalRejected}</div>
          </div>
        </div>

        {/* Filter Tabs and Search Bar */}
        <div className="px-6 py-3 border-b border-border-primary bg-surface-1 flex flex-col sm:flex-row justify-between items-center gap-4 flex-shrink-0">
          <div className="flex gap-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {[
              { key: 'ALL', label: `All (${stats.totalCount})` },
              { key: 'REGISTERED', label: `Registered (${stats.totalRegistered})` },
              { key: 'ATTENDED', label: `Attended (${stats.totalAttended})` },
              { key: 'SHORTLISTED', label: `Shortlisted (${stats.totalShortlisted})` },
              { key: 'SELECTED', label: `Selected (${stats.totalSelected})` },
              { key: 'REJECTED', label: `Rejected (${stats.totalRejected})` },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveStatusTab(key)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap cursor-pointer ${
                  activeStatusTab === key
                    ? 'bg-gradient-primary text-white shadow-xs'
                    : 'bg-surface-2 text-text-muted hover:bg-surface-3 hover:text-text-primary'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Search candidate name or roll no..."
              className="w-full h-9 pl-9 pr-3 border border-border-primary rounded-lg text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        {/* Floating Bulk Action Bar */}
        {selectedIds.length > 0 && (
          <div className="px-6 py-2.5 bg-primary/10 border-b border-primary/20 flex items-center justify-between animate-in slide-in-from-top-2 duration-150 flex-shrink-0">
            <div className="text-xs font-bold text-primary flex items-center gap-2">
              <CheckSquare className="w-4 h-4" />
              <span>{selectedIds.length} candidate(s) selected</span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-text-muted uppercase">Bulk Update:</span>
              <button
                onClick={() => handleBulkStatusChange('ATTENDED')}
                disabled={bulkLoading}
                className="px-2.5 py-1 bg-surface-1 border border-border-primary hover:bg-surface-2 text-text-primary text-xs font-bold rounded transition cursor-pointer"
              >
                Mark Attended
              </button>
              <button
                onClick={() => handleBulkStatusChange('SHORTLISTED')}
                disabled={bulkLoading}
                className="px-2.5 py-1 bg-warning/10 border border-warning/30 hover:bg-warning/20 text-warning text-xs font-bold rounded transition cursor-pointer"
              >
                Mark Shortlisted
              </button>
              <button
                onClick={() => handleBulkStatusChange('SELECTED')}
                disabled={bulkLoading}
                className="px-2.5 py-1 bg-success/15 border border-success/30 hover:bg-success/25 text-success text-xs font-extrabold rounded transition cursor-pointer"
              >
                Mark Selected (Placed)
              </button>
              <button
                onClick={() => handleBulkStatusChange('REJECTED')}
                disabled={bulkLoading}
                className="px-2.5 py-1 bg-error/10 border border-error/20 hover:bg-error/20 text-error text-xs font-bold rounded transition cursor-pointer"
              >
                Mark Rejected
              </button>
            </div>
          </div>
        )}

        {/* Drive Candidates Data Table */}
        <div className="flex-1 overflow-y-auto bg-surface-1">
          {loading ? (
            <div className="py-20 text-center text-text-muted">
              <Loader2 className="w-7 h-7 animate-spin text-primary mx-auto mb-2" />
              <span className="text-xs font-medium">Fetching drive candidates...</span>
            </div>
          ) : studentsList.length === 0 ? (
            <div className="py-20 text-center text-text-muted space-y-3">
              <AlertCircle className="w-8 h-8 text-text-muted mx-auto" />
              <div className="text-xs font-bold text-text-secondary">No candidate records found in this drive view.</div>
              <button
                onClick={() => setRegisterOpen(true)}
                className="px-4 py-2 bg-primary/10 border border-primary/20 text-primary text-xs font-bold rounded-lg hover:bg-primary/20 transition cursor-pointer"
              >
                + Register candidates to drive
              </button>
            </div>
          ) : (
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-background-tertiary border-b border-border-primary text-[10px] font-bold text-text-muted uppercase tracking-wider z-10">
                <tr>
                  <th className="px-4 py-3.5 w-10 text-center">
                    <button onClick={toggleSelectAll} className="cursor-pointer">
                      {selectedIds.length === studentsList.length && studentsList.length > 0 ? (
                        <CheckSquare className="w-4 h-4 text-primary" />
                      ) : (
                        <Square className="w-4 h-4 text-text-muted" />
                      )}
                    </button>
                  </th>
                  <th className="px-4 py-3.5">Roll No &amp; Candidate Name</th>
                  <th className="px-4 py-3.5">Department</th>
                  <th className="px-4 py-3.5 text-center">UG %</th>
                  <th className="px-4 py-3.5 text-center">Self Intro Video</th>
                  <th className="px-4 py-3.5 text-center">Resume CV</th>
                  <th className="px-4 py-3.5 text-center">Drive Status</th>
                  <th className="px-4 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary text-text-secondary">
                {studentsList.map((item: any) => {
                  const student = item.student;
                  const isSelected = selectedIds.includes(item.studentId);
                  const latestResume = (student?.documents || [])[0]?.fileUrl;

                  return (
                    <tr key={item.id} className={`hover:bg-surface-2/60 transition ${isSelected ? 'bg-primary/5' : ''}`}>
                      <td className="px-4 py-3 text-center">
                        <button onClick={() => toggleSelectStudent(item.studentId)} className="cursor-pointer">
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-primary" />
                          ) : (
                            <Square className="w-4 h-4 text-text-muted" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {student.studentPhotoUrl ? (
                            <img
                              src={formatImageUrl(student.studentPhotoUrl)}
                              className="w-8 h-8 rounded-full object-cover border border-primary/30 flex-shrink-0"
                              alt={student.fullName}
                              onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                              {student.fullName.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <div className="font-bold text-text-primary text-xs">{student.fullName}</div>
                            <div className="text-[10px] text-text-muted font-mono">{student.rollNumber}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs font-medium">{student.department?.name}</td>
                      <td className="px-4 py-3 text-center font-bold text-text-primary">{student.academics?.ugPercentage}%</td>
                      
                      {/* Self Intro Video Column */}
                      <td className="px-4 py-3 text-center">
                        {student.selfIntroVideoUrl ? (
                          <a
                            href={student.selfIntroVideoUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-primary/10 border border-primary/20 text-[10px] font-extrabold text-primary hover:bg-primary/20 transition cursor-pointer"
                            title="Watch Self Intro Video"
                          >
                            <Video className="w-3.5 h-3.5" />
                            <span>Intro Video</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-text-disabled">—</span>
                        )}
                      </td>

                      {/* Resume PDF Column */}
                      <td className="px-4 py-3 text-center">
                        {latestResume ? (
                          <a
                            href={latestResume}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-surface-2 border border-border-primary text-[10px] font-bold text-text-primary hover:bg-surface-3 transition cursor-pointer"
                            title="View Candidate Resume"
                          >
                            <FileText className="w-3.5 h-3.5 text-primary" />
                            <span>Resume PDF</span>
                          </a>
                        ) : (
                          <span className="text-[10px] text-text-disabled">—</span>
                        )}
                      </td>

                      {/* Drive Candidate Status Selector */}
                      <td className="px-4 py-3 text-center">
                        <select
                          value={item.status}
                          onChange={(e) => handleStatusChange(item.studentId, e.target.value)}
                          className={`px-2.5 py-1 rounded text-[11px] font-bold outline-none cursor-pointer border transition ${
                            item.status === 'SELECTED'
                              ? 'bg-success/15 text-success border-success/30 font-extrabold'
                              : item.status === 'SHORTLISTED'
                              ? 'bg-warning/15 text-warning border-warning/30 font-bold'
                              : item.status === 'ATTENDED'
                              ? 'bg-primary/15 text-primary border-primary/30 font-bold'
                              : item.status === 'REJECTED'
                              ? 'bg-error/15 text-error border-error/30'
                              : 'bg-surface-2 text-text-primary border-border-primary'
                          }`}
                        >
                          <option value="REGISTERED">REGISTERED</option>
                          <option value="ATTENDED">ATTENDED</option>
                          <option value="SHORTLISTED">SHORTLISTED</option>
                          <option value="SELECTED">SELECTED (OFFERED)</option>
                          <option value="REJECTED">REJECTED</option>
                        </select>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleRemoveCandidate(item.studentId)}
                          className="p-1.5 hover:bg-error/10 text-error rounded transition cursor-pointer"
                          title="Remove Candidate from Drive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ── REGISTER CANDIDATES SUB-MODAL ── */}
      {registerOpen && (
        <div className="fixed inset-0 z-[60] bg-black/70 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="bg-surface-1 max-w-xl w-full rounded-xl border border-border-primary shadow-2xl overflow-hidden animate-in zoom-in duration-150 flex flex-col max-h-[80vh]">
            <div className="px-5 py-4 border-b border-border-primary bg-surface-2 flex justify-between items-center">
              <h3 className="font-extrabold text-text-primary text-sm flex items-center gap-2">
                <UserPlus className="w-4.5 h-4.5 text-primary" />
                <span>Register Candidates to {job.company?.name} Drive</span>
              </h3>
              <button onClick={() => setRegisterOpen(false)} className="p-1 hover:bg-surface-3 rounded">
                <X className="w-4.5 h-4.5 text-text-muted" />
              </button>
            </div>

            <div className="p-4 border-b border-border-primary bg-background-secondary">
              <div className="relative">
                <Search className="w-4 h-4 text-text-muted absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search students by roll number or name..."
                  className="w-full h-9 pl-9 pr-3 border border-border-primary rounded text-xs outline-none bg-surface-1 text-text-primary focus:border-primary transition"
                  value={registerSearch}
                  onChange={(e) => setRegisterSearch(e.target.value)}
                />
              </div>
            </div>

            <form onSubmit={handleRegisterSubmit} className="flex-1 overflow-y-auto p-4 space-y-2 divide-y divide-border-primary/50">
              {availableStudents.length === 0 ? (
                <div className="py-8 text-center text-xs text-text-muted">No students found matching query.</div>
              ) : (
                availableStudents.map((st) => {
                  const isChecked = selectedRegisterIds.includes(st.id);
                  return (
                    <div
                      key={st.id}
                      onClick={() => {
                        if (isChecked) {
                          setSelectedRegisterIds((prev) => prev.filter((id) => id !== st.id));
                        } else {
                          setSelectedRegisterIds((prev) => [...prev, st.id]);
                        }
                      }}
                      className={`pt-2.5 pb-2.5 px-3 flex items-center justify-between rounded cursor-pointer transition ${
                        isChecked ? 'bg-primary/10' : 'hover:bg-surface-2'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {isChecked ? (
                          <CheckSquare className="w-4 h-4 text-primary" />
                        ) : (
                          <Square className="w-4 h-4 text-text-muted" />
                        )}
                        <div>
                          <div className="text-xs font-bold text-text-primary">{st.fullName}</div>
                          <div className="text-[10px] text-text-muted font-mono">{st.rollNumber} &bull; {st.department?.name}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs font-bold text-text-primary">{st.academics?.ugPercentage}% UG</div>
                      </div>
                    </div>
                  );
                })
              )}

              <div className="pt-4 flex justify-between items-center border-t border-border-primary sticky bottom-0 bg-surface-1">
                <span className="text-xs text-text-muted font-bold">{selectedRegisterIds.length} candidate(s) selected</span>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setRegisterOpen(false)}
                    className="px-4 py-2 border border-border-primary text-xs font-semibold rounded hover:bg-surface-2 transition text-text-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={selectedRegisterIds.length === 0 || registerLoading}
                    className="px-4 py-2 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white text-xs font-bold rounded transition cursor-pointer"
                  >
                    {registerLoading ? 'Registering...' : 'Register Selected'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
