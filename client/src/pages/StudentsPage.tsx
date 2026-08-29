import React, { useEffect, useState } from 'react';
import { useStudentStore } from '../store/studentStore';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import { Search, Plus, Upload, Loader2, FileSpreadsheet, X, Check, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../store/authStore';

export default function StudentsPage() {
  const { students, total, loading, error, fetchStudents, importStudents, createStudent } = useStudentStore();
  const { hasPermission } = useAuthStore();
  
  const [search, setSearch] = useState('');
  const [dept, setDept] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  // Modal controls
  const [importOpen, setImportOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importLoading, setImportLoading] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);

  // Departments list for filter dropdown
  const depts = [
    { id: 'CSE', name: 'Computer Science & Engineering' },
    { id: 'IT', name: 'Information Technology' },
    { id: 'ECE', name: 'Electronics & Communication Engineering' },
    { id: 'EEE', name: 'Electrical & Electronics Engineering' },
    { id: 'MECH', name: 'Mechanical Engineering' },
  ];

  useEffect(() => {
    fetchStudents({ search, departmentId: dept, placementStatus: status, page, limit: 10 });
  }, [search, dept, status, page]);

  const handleImportSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!importFile) return;

    setImportLoading(true);
    setImportResult(null);

    try {
      const result = await importStudents(importFile);
      setImportResult(result);
      fetchStudents({ page: 1 });
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
          <h1 className="text-2xl font-extrabold text-text tracking-tight">Student Intelligence Directory</h1>
          <p className="text-sm text-secondary font-medium">Evaluate academic benchmarks and eligibility status.</p>
        </div>
        
        <div className="flex gap-3">
          {hasPermission('STUDENT_IMPORT') && (
            <button
              onClick={() => {
                setImportOpen(true);
                setImportFile(null);
                setImportResult(null);
              }}
              className="flex items-center gap-2 px-4 py-2.5 border border-border bg-surface text-text hover:border-slate-400 hover:shadow-sm text-xs font-semibold rounded-lg transition duration-150 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Import spreadsheet</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-surface p-4 rounded-xl border border-border shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        
        {/* Search */}
        <div className="relative w-full md:max-w-xs">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-secondary">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            className="w-full h-10 pl-9 pr-4 border border-border rounded-lg text-xs outline-none bg-background focus:border-primary transition"
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
            className="h-10 border border-border rounded-lg px-3 text-xs bg-background text-text focus:border-primary outline-none transition"
            value={dept}
            onChange={(e) => {
              setDept(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Departments</option>
            {depts.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>

          {/* Status */}
          <select
            className="h-10 border border-border rounded-lg px-3 text-xs bg-background text-text focus:border-primary outline-none transition"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All Statuses</option>
            <option value="YET_TO_BE_PLACED">Yet To Be Placed</option>
            <option value="PLACED">Placed</option>
            <option value="TERMINATED">Terminated</option>
          </select>
        </div>
      </div>

      {/* Students Data Table */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 border-b border-border text-[11px] font-bold text-secondary uppercase tracking-wider">
                <th className="px-6 py-4">Roll Number</th>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Department</th>
                <th className="px-6 py-4">Gender</th>
                <th className="px-6 py-4 text-center">SSLC %</th>
                <th className="px-6 py-4 text-center">HSC %</th>
                <th className="px-6 py-4 text-center">UG %</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4 text-right">Profile</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border text-sm text-text">
              {loading && students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-secondary font-medium">
                    <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
                    <span>Loading student directory...</span>
                  </td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={9} className="text-center py-12 text-secondary font-medium">
                    No matching student records found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/30 transition duration-150">
                    <td className="px-6 py-4 font-mono font-semibold text-xs">{student.rollNumber}</td>
                    <td className="px-6 py-4 font-semibold">{student.fullName}</td>
                    <td className="px-6 py-4 text-xs font-medium text-secondary">{student.department.name}</td>
                    <td className="px-6 py-4 text-xs font-medium">{student.gender}</td>
                    <td className="px-6 py-4 text-center text-xs font-semibold">{student.academics?.sslcPercentage}%</td>
                    <td className="px-6 py-4 text-center text-xs font-semibold">{student.academics?.hscPercentage}%</td>
                    <td className="px-6 py-4 text-center text-xs font-semibold">{student.academics?.ugPercentage}%</td>
                    <td className="px-6 py-4 text-center">
                      <StatusBadge status={student.placementStatus} />
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Link
                        to={`/students/${student.id}`}
                        className="text-xs font-bold text-primary hover:text-primary-dark hover:underline"
                      >
                        Inspect View
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        {total > 10 && (
          <div className="px-6 py-4 border-t border-border bg-slate-50/50 flex justify-between items-center text-xs">
            <span className="text-secondary font-medium">
              Showing {students.length} of {total} records
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 border border-border rounded-lg bg-surface disabled:opacity-50 text-xs font-semibold hover:bg-slate-100 transition"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 10 >= total}
                className="px-3 py-1.5 border border-border rounded-lg bg-surface disabled:opacity-50 text-xs font-semibold hover:bg-slate-100 transition"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Import Modal/Slide-out */}
      {importOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface max-w-xl w-full rounded-2xl border border-border shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            
            {/* Header */}
            <div className="flex justify-between items-center px-6 py-4 border-b border-border bg-slate-50/50">
              <h3 className="font-extrabold text-text flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5 text-primary" />
                <span>Import Student Records (Excel/CSV)</span>
              </h3>
              <button onClick={() => setImportOpen(false)} className="p-1 hover:bg-slate-200 rounded">
                <X className="w-5 h-5 text-secondary" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {!importResult ? (
                <form onSubmit={handleImportSubmit} className="space-y-4">
                  <div className="border-2 border-dashed border-border hover:border-slate-400 p-8 rounded-xl text-center space-y-3 cursor-pointer relative bg-slate-50/50">
                    <input
                      type="file"
                      accept=".xlsx,.xls,.csv"
                      className="absolute inset-0 opacity-0 cursor-pointer"
                      onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                    />
                    <Upload className="w-8 h-8 text-secondary mx-auto" />
                    <div className="text-xs font-bold text-text">
                      {importFile ? importFile.name : 'Select or drag spreadsheet file here'}
                    </div>
                    <div className="text-[10px] text-secondary">Supports Excel workbook formats (.xlsx) and CSV files up to 5MB.</div>
                  </div>

                  <div className="flex justify-end gap-3 pt-4 border-t border-border">
                    <button
                      type="button"
                      onClick={() => setImportOpen(false)}
                      className="px-4 py-2 border border-border text-xs font-semibold rounded-lg hover:bg-slate-100 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!importFile || importLoading}
                      className="px-4 py-2 bg-primary hover:bg-primary-dark disabled:opacity-50 text-white text-xs font-semibold rounded-lg flex items-center gap-2 transition"
                    >
                      {importLoading ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Uploading...</span>
                        </>
                      ) : (
                        <span>Verify & Import</span>
                      )}
                    </button>
                  </div>
                </form>
              ) : (
                /* Import Results breakdown */
                <div className="space-y-6">
                  <div className="grid grid-cols-4 gap-4 text-center">
                    <div className="bg-slate-50 p-3 rounded-lg border border-border">
                      <div className="text-lg font-extrabold text-text">{importResult.totalRows}</div>
                      <div className="text-[10px] font-bold text-secondary uppercase mt-0.5">Total Checked</div>
                    </div>
                    <div className="bg-emerald-50 p-3 rounded-lg border border-emerald-100">
                      <div className="text-lg font-extrabold text-success">{importResult.successCount}</div>
                      <div className="text-[10px] font-bold text-success uppercase mt-0.5">Success</div>
                    </div>
                    <div className="bg-amber-50 p-3 rounded-lg border border-amber-100">
                      <div className="text-lg font-extrabold text-amber-600">{importResult.duplicates.length}</div>
                      <div className="text-[10px] font-bold text-amber-600 uppercase mt-0.5">Duplicates</div>
                    </div>
                    <div className="bg-red-50 p-3 rounded-lg border border-red-100">
                      <div className="text-lg font-extrabold text-danger">{importResult.errors.length}</div>
                      <div className="text-[10px] font-bold text-danger uppercase mt-0.5">Errors</div>
                    </div>
                  </div>

                  {/* Errors Detail list */}
                  {importResult.errors.length > 0 && (
                    <div className="border border-red-200 rounded-lg overflow-hidden max-h-48 overflow-y-auto">
                      <div className="bg-red-50 px-4 py-2 border-b border-red-200 text-xs font-bold text-red-700 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Validation Failures (Row Breakdown)</span>
                      </div>
                      <table className="w-full text-left border-collapse text-xs">
                        <tbody className="divide-y divide-red-100">
                          {importResult.errors.map((err: any, idx: number) => (
                            <tr key={idx} className="bg-red-50/20">
                              <td className="px-4 py-2.5 font-bold text-red-700 w-16">Row {err.row}</td>
                              <td className="px-4 py-2.5 text-secondary">{err.error}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div className="flex justify-end pt-4 border-t border-border">
                    <button
                      onClick={() => setImportOpen(false)}
                      className="px-4 py-2 bg-primary text-white text-xs font-semibold rounded-lg hover:bg-primary-dark transition"
                    >
                      Complete
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
