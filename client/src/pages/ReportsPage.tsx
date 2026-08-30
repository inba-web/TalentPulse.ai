import React, { useEffect, useState } from 'react';
import { apiFetch } from '../utils/apiFetch';
import { useNavigate } from 'react-router-dom';
import { Download, Loader2, Eye, Edit2, Trash2, X, RefreshCw, FileSpreadsheet, CheckCircle2, Users, UserX, Award } from 'lucide-react';
import { useStudentStore } from '../store/studentStore';
import ConfirmDialog from '../components/ConfirmDialog';

type ReportTab = 'placed' | 'unplaced' | 'overall';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { deleteStudent, updateStudent } = useStudentStore();

  const [activeTab, setActiveTab] = useState<ReportTab>('placed');
  const [data, setData] = useState<{ placed: any[]; unplaced: any[]; overall: any[] }>({
    placed: [],
    unplaced: [],
    overall: [],
  });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  const [editCtc, setEditCtc] = useState('');
  const [editDate, setEditDate] = useState('');
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await apiFetch('/api/reports/placements');
      const result = await response.json();
      if (result.success) {
        setData({
          placed: result.data.placed || [],
          unplaced: result.data.unplaced || [],
          overall: result.data.overall || [],
        });
      }
    } catch (err) {
      console.error('Failed to load report data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await fetchReport();
    } finally {
      setRefreshing(false);
    }
  };

  // Export Excel helper (generates XML Spreadsheet format compatible with Excel)
  const handleExportExcel = (type: ReportTab = activeTab) => {
    const records = data[type] || [];
    if (records.length === 0) return;

    let sheetTitle = 'Placed Students Report';
    if (type === 'unplaced') sheetTitle = 'Yet To Be Placed Report';
    if (type === 'overall') sheetTitle = 'Overall Student Population Report';

    let xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="${sheetTitle}">
  <Table>`;

    xmlContent += '\n   <Row>';
    if (type === 'placed') {
      ['Roll Number', 'Student Name', 'Department', 'Placed Company', 'Job Role', 'Location', 'CTC (LPA)', 'Offer Date', 'Status'].forEach((h) => {
        xmlContent += `\n    <Cell><Data ss:Type="String">${h}</Data></Cell>`;
      });
      xmlContent += '\n   </Row>';
      records.forEach((r) => {
        const formattedDate = r.date ? new Date(r.date).toLocaleDateString() : '';
        xmlContent += `\n   <Row>
    <Cell><Data ss:Type="String">${r.rollNumber || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.fullName || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.department || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.companyName || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.role || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.location || ''}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.ctc || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${formattedDate}</Data></Cell>
    <Cell><Data ss:Type="String">${r.status || 'OFFERED'}</Data></Cell>
   </Row>`;
      });
    } else if (type === 'unplaced') {
      ['Roll Number', 'Student Name', 'Department', 'College Email', 'Mobile Number', 'SSLC %', 'HSC %', 'UG %', 'Placement Status'].forEach((h) => {
        xmlContent += `\n    <Cell><Data ss:Type="String">${h}</Data></Cell>`;
      });
      xmlContent += '\n   </Row>';
      records.forEach((r) => {
        xmlContent += `\n   <Row>
    <Cell><Data ss:Type="String">${r.rollNumber || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.fullName || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.department || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.email || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.mobileNumber || ''}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.sslcPercentage || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.hscPercentage || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.ugPercentage || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${r.placementStatus || 'YET_TO_BE_PLACED'}</Data></Cell>
   </Row>`;
      });
    } else {
      ['Roll Number', 'Student Name', 'Department', 'Gender', 'Residency', 'Personal Email', 'College Email', 'Mobile', 'SSLC %', 'HSC %', 'UG %', 'Status', 'Placed Company', 'Placed Role', 'CTC (LPA)'].forEach((h) => {
        xmlContent += `\n    <Cell><Data ss:Type="String">${h}</Data></Cell>`;
      });
      xmlContent += '\n   </Row>';
      records.forEach((r) => {
        xmlContent += `\n   <Row>
    <Cell><Data ss:Type="String">${r.rollNumber || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.fullName || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.department || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.gender || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.hostelStatus || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.personalEmail || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.collegeEmail || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.mobileNumber || ''}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.sslcPercentage || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.hscPercentage || 0}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.ugPercentage || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${r.placementStatus || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.placedCompany || '—'}</Data></Cell>
    <Cell><Data ss:Type="String">${r.placedRole || '—'}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.ctc || 0}</Data></Cell>
   </Row>`;
      });
    }

    xmlContent += `\n  </Table>
 </Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `talentpulse_${type}_report_${Date.now()}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleOpenEdit = (record: any) => {
    setEditingRecord(record);
    if (activeTab === 'placed') {
      setEditCtc(String(record.ctc));
      setEditDate(record.date ? new Date(record.date).toISOString().split('T')[0] : '');
    } else {
      setEditName(record.fullName);
      setEditEmail(record.collegeEmail || record.email || '');
    }
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setActionLoading(true);

    try {
      if (activeTab === 'placed') {
        const response = await apiFetch(`/api/reports/placements/${editingRecord.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ctc: Number(editCtc), date: editDate }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error?.message || 'Update failed');
      } else {
        await updateStudent(editingRecord.studentId, {
          fullName: editName,
          collegeEmail: editEmail,
        });
      }
      setEditOpen(false);
      fetchReport();
    } catch (err: any) {
      alert(err.message || 'Operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  const currentRecords = (data[activeTab] || []).filter((r) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      (r.fullName && r.fullName.toLowerCase().includes(q)) ||
      (r.rollNumber && r.rollNumber.toLowerCase().includes(q)) ||
      (r.department && r.department.toLowerCase().includes(q)) ||
      (r.companyName && r.companyName.toLowerCase().includes(q))
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Placement Reports &amp; Exports</h1>
          <p className="text-xs text-text-muted mt-1">Generate verified placement spreadsheets directly from live database metrics.</p>
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
          {!loading && (
            <button
              onClick={() => handleExportExcel(activeTab)}
              className="flex items-center gap-2 px-4 py-2.5 bg-gradient-primary hover:brightness-110 text-white text-xs font-semibold rounded glow-primary border-0 transition cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export {activeTab.toUpperCase()} to Excel</span>
            </button>
          )}
        </div>
      </div>

      {/* 3 Major Report Option Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Option 1: Placed Students */}
        <div
          onClick={() => setActiveTab('placed')}
          className={`p-6 rounded-lg border transition duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'placed'
              ? 'bg-surface-1 border-primary ring-2 ring-primary/20 shadow-lg'
              : 'bg-surface-1/60 border-border-primary hover:border-border-hover'
          }`}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-success/10 rounded-lg border border-success/20">
                <Award className="w-6 h-6 text-success" />
              </div>
              <span className="px-2.5 py-1 bg-success/15 text-success font-extrabold text-xs rounded-full">
                {data.placed.length} Students
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-text-primary text-base">1. Placed Students Report</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Download an Excel file containing all placed students with hired company, job role, CTC package, and offer date.
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleExportExcel('placed'); }}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-success/10 hover:bg-success/20 border border-success/30 text-success text-xs font-bold rounded transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>
        </div>

        {/* Option 2: Yet To Be Placed */}
        <div
          onClick={() => setActiveTab('unplaced')}
          className={`p-6 rounded-lg border transition duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'unplaced'
              ? 'bg-surface-1 border-primary ring-2 ring-primary/20 shadow-lg'
              : 'bg-surface-1/60 border-border-primary hover:border-border-hover'
          }`}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-warning/10 rounded-lg border border-warning/20">
                <UserX className="w-6 h-6 text-warning" />
              </div>
              <span className="px-2.5 py-1 bg-warning/15 text-warning font-extrabold text-xs rounded-full">
                {data.unplaced.length} Students
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-text-primary text-base">2. Yet To Be Placed Report</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Download an Excel file containing students who have not yet been placed along with contact details and academic benchmarks.
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleExportExcel('unplaced'); }}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-warning/10 hover:bg-warning/20 border border-warning/30 text-warning text-xs font-bold rounded transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>
        </div>

        {/* Option 3: Overall Students */}
        <div
          onClick={() => setActiveTab('overall')}
          className={`p-6 rounded-lg border transition duration-200 cursor-pointer flex flex-col justify-between ${
            activeTab === 'overall'
              ? 'bg-surface-1 border-primary ring-2 ring-primary/20 shadow-lg'
              : 'bg-surface-1/60 border-border-primary hover:border-border-hover'
          }`}
        >
          <div className="space-y-3">
            <div className="flex justify-between items-start">
              <div className="p-2.5 bg-primary/10 rounded-lg border border-primary/20">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <span className="px-2.5 py-1 bg-primary/15 text-primary font-extrabold text-xs rounded-full">
                {data.overall.length} Students
              </span>
            </div>
            <div>
              <h3 className="font-extrabold text-text-primary text-base">3. Overall Students Report</h3>
              <p className="text-xs text-text-muted mt-1 leading-relaxed">
                Download an Excel file containing the complete student population directory and full placement history details.
              </p>
            </div>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); handleExportExcel('overall'); }}
            className="mt-5 w-full flex items-center justify-center gap-2 py-2 bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary text-xs font-bold rounded transition cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Excel</span>
          </button>
        </div>

      </div>

      {/* Interactive Table Container */}
      <div className="bg-surface-1 rounded border border-border-primary overflow-hidden space-y-4 p-4">
        
        {/* Table Search & Tab Switcher */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex gap-2 border-b border-border-primary pb-2">
            <button
              onClick={() => setActiveTab('placed')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition ${
                activeTab === 'placed' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:text-text-primary'
              }`}
            >
              Placed ({data.placed.length})
            </button>
            <button
              onClick={() => setActiveTab('unplaced')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition ${
                activeTab === 'unplaced' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:text-text-primary'
              }`}
            >
              Yet To Be Placed ({data.unplaced.length})
            </button>
            <button
              onClick={() => setActiveTab('overall')}
              className={`px-3 py-1.5 text-xs font-bold rounded transition ${
                activeTab === 'overall' ? 'bg-primary text-white' : 'bg-surface-2 text-text-muted hover:text-text-primary'
              }`}
            >
              Overall Population ({data.overall.length})
            </button>
          </div>

          <input
            type="text"
            className="w-full sm:w-64 h-9 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
            placeholder="Search report records..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {loading ? (
          <div className="text-center py-16 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <span>Loading live report table...</span>
          </div>
        ) : activeTab === 'placed' ? (
          <div className="overflow-x-auto border border-border-primary rounded">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-tertiary border-b border-border-primary text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Placed Company</th>
                  <th className="px-4 py-3">Job Role</th>
                  <th className="px-4 py-3 text-center">CTC Package</th>
                  <th className="px-4 py-3 text-right">Offer Date</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary text-xs text-text-secondary">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">No placed records matching search.</td>
                  </tr>
                ) : (
                  currentRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-surface-2 transition duration-150">
                      <td className="px-4 py-3 font-mono font-bold text-text-primary">{r.rollNumber}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{r.fullName}</td>
                      <td className="px-4 py-3 text-text-muted">{r.department}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{r.companyName}</td>
                      <td className="px-4 py-3 text-text-secondary">{r.role}</td>
                      <td className="px-4 py-3 text-center font-extrabold text-success">₹ {r.ctc} LPA</td>
                      <td className="px-4 py-3 text-right text-text-muted">{new Date(r.date).toLocaleDateString()}</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/students/${r.studentId}`)}
                          className="px-2.5 py-1 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-[10px] font-bold text-primary transition cursor-pointer"
                        >
                          View Profile &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === 'unplaced' ? (
          <div className="overflow-x-auto border border-border-primary rounded">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-tertiary border-b border-border-primary text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">College Email</th>
                  <th className="px-4 py-3">Mobile Number</th>
                  <th className="px-4 py-3 text-right">UG Degree %</th>
                  <th className="px-4 py-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary text-xs text-text-secondary">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-text-muted">No unplaced records matching search.</td>
                  </tr>
                ) : (
                  currentRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-surface-2 transition duration-150">
                      <td className="px-4 py-3 font-mono font-bold text-text-primary">{r.rollNumber}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{r.fullName}</td>
                      <td className="px-4 py-3 text-text-muted">{r.department}</td>
                      <td className="px-4 py-3 text-text-secondary">{r.email}</td>
                      <td className="px-4 py-3 font-mono text-text-muted">{r.mobileNumber}</td>
                      <td className="px-4 py-3 text-right font-bold">{r.ugPercentage}%</td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => navigate(`/students/${r.studentId}`)}
                          className="px-2.5 py-1 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-[10px] font-bold text-primary transition cursor-pointer"
                        >
                          View Profile &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto border border-border-primary rounded">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-tertiary border-b border-border-primary text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="px-4 py-3">Roll Number</th>
                  <th className="px-4 py-3">Student Name</th>
                  <th className="px-4 py-3">Dept</th>
                  <th className="px-4 py-3">Email &amp; Phone</th>
                  <th className="px-4 py-3 text-center">UG %</th>
                  <th className="px-4 py-3 text-center">Placement Status</th>
                  <th className="px-4 py-3">Placed Company</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary text-xs text-text-secondary">
                {currentRecords.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">No overall records matching search.</td>
                  </tr>
                ) : (
                  currentRecords.map((r, idx) => (
                    <tr key={idx} className="hover:bg-surface-2 transition duration-150">
                      <td className="px-4 py-3 font-mono font-bold text-text-primary">{r.rollNumber}</td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{r.fullName}</td>
                      <td className="px-4 py-3 text-text-muted">{r.department}</td>
                      <td className="px-4 py-3">
                        <div className="text-text-primary font-medium">{r.collegeEmail}</div>
                        <div className="text-[10px] text-text-muted font-mono">{r.mobileNumber}</div>
                      </td>
                      <td className="px-4 py-3 text-center font-bold">{r.ugPercentage}%</td>
                      <td className="px-4 py-3 text-center">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${
                          r.placementStatus === 'PLACED'
                            ? 'bg-success/15 text-success border-success/30'
                            : r.placementStatus === 'TERMINATED'
                            ? 'bg-error/15 text-error border-error/30'
                            : 'bg-warning/15 text-warning border-warning/30'
                        }`}>
                          {r.placementStatus}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-text-primary">{r.placedCompany}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => navigate(`/students/${r.studentId}`)}
                          className="px-2.5 py-1 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded text-[10px] font-bold text-primary transition cursor-pointer"
                        >
                          View Profile &rarr;
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}
