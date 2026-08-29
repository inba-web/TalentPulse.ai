import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, Loader2, Eye, Edit2, Trash2, X, Check } from 'lucide-react';
import { useStudentStore } from '../store/studentStore';

export default function ReportsPage() {
  const navigate = useNavigate();
  const { deleteStudent, updateStudent } = useStudentStore();

  const [activeTab, setActiveTab] = useState<'placed' | 'unplaced'>('placed');
  const [data, setData] = useState<{ placed: any[]; unplaced: any[] }>({ placed: [], unplaced: [] });
  const [loading, setLoading] = useState(true);

  // Edit Modal State
  const [editOpen, setEditOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<any>(null);
  
  // Placed Edit Fields
  const [editCtc, setEditCtc] = useState('');
  const [editDate, setEditDate] = useState('');

  // Unplaced Edit Fields
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  
  const [actionLoading, setActionLoading] = useState(false);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/reports/placements');
      const result = await response.json();
      if (result.success) {
        setData(result.data);
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

  // Export Excel helper (generates XML Spreadsheet format)
  const handleExportExcel = () => {
    const records = activeTab === 'placed' ? data.placed : data.unplaced;
    if (records.length === 0) return;

    let xmlContent = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <Worksheet ss:Name="Placements Report">
  <Table>`;

    // Headers
    xmlContent += '\n   <Row>';
    if (activeTab === 'placed') {
      ['Roll Number', 'Full Name', 'Department', 'Company', 'Location', 'CTC (LPA)', 'Offer Date'].forEach((h) => {
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
    <Cell><Data ss:Type="String">${r.location || ''}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.ctc || 0}</Data></Cell>
    <Cell><Data ss:Type="String">${formattedDate}</Data></Cell>
   </Row>`;
      });
    } else {
      ['Roll Number', 'Full Name', 'Department', 'College Email', 'UG Degree %'].forEach((h) => {
        xmlContent += `\n    <Cell><Data ss:Type="String">${h}</Data></Cell>`;
      });
      xmlContent += '\n   </Row>';
      records.forEach((r) => {
        xmlContent += `\n   <Row>
    <Cell><Data ss:Type="String">${r.rollNumber || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.fullName || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.department || ''}</Data></Cell>
    <Cell><Data ss:Type="String">${r.email || ''}</Data></Cell>
    <Cell><Data ss:Type="Number">${r.ugPercentage || 0}</Data></Cell>
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
    link.setAttribute('download', `talentpulse_${activeTab}_report_${Date.now()}.xls`);
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
      setEditEmail(record.email);
    }
    setEditOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord) return;
    setActionLoading(true);

    try {
      if (activeTab === 'placed') {
        // Update placement record
        const response = await fetch(`/api/reports/placements/${editingRecord.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ctc: Number(editCtc), date: editDate }),
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error?.message || 'Update failed');
      } else {
        // Update student record
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

  const handleDelete = async (record: any) => {
    const confirmMessage = activeTab === 'placed'
      ? `Are you sure you want to revoke ${record.fullName}'s placement offer at ${record.companyName}? This will reset their status to unplaced.`
      : `Are you sure you want to delete candidate ${record.fullName} from the database? This is irreversible.`;

    if (!window.confirm(confirmMessage)) return;
    setActionLoading(true);

    try {
      if (activeTab === 'placed') {
        // Revoke placement offer
        const response = await fetch(`/api/reports/placements/${record.id}`, {
          method: 'DELETE',
        });
        const result = await response.json();
        if (!result.success) throw new Error(result.error?.message || 'Revocation failed');
      } else {
        // Delete student record
        await deleteStudent(record.studentId);
      }
      fetchReport();
    } catch (err: any) {
      alert(err.message || 'Delete operation failed');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-text-primary tracking-tight">Reports</h1>
          <p className="text-xs text-text-muted mt-1">Analyze and export placement metrics and statistics.</p>
        </div>

        {!loading && (
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-2 px-4 py-2.5 bg-gradient-primary hover:brightness-110 text-white text-xs font-semibold rounded glow-primary border-0 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export to Excel</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border-primary flex gap-6">
        <button
          onClick={() => {
            setActiveTab('placed');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-150 ${
            activeTab === 'placed'
              ? 'border-primary text-text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Drive Completed (Placed)
        </button>
        <button
          onClick={() => {
            setActiveTab('unplaced');
          }}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-150 ${
            activeTab === 'unplaced'
              ? 'border-primary text-text-primary'
              : 'border-transparent text-text-muted hover:text-text-primary'
          }`}
        >
          Yet to Place (Unplaced)
        </button>
      </div>

      {/* Reports Table container */}
      <div className="bg-surface-1 rounded border border-border-primary overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-text-muted">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <span>Generating placement database report...</span>
          </div>
        ) : activeTab === 'placed' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-tertiary border-b border-border-primary text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Placed Company</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">CTC Package</th>
                  <th className="px-6 py-4 text-right">Offer Date</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary text-xs text-text-secondary">
                {data.placed.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-text-muted">
                      No placed student records to report.
                    </td>
                  </tr>
                ) : (
                  data.placed.map((r, idx) => (
                    <tr key={idx} className="hover:bg-surface-2 transition duration-150">
                      <td className="px-6 py-4 font-mono font-semibold text-text-primary">{r.rollNumber}</td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{r.fullName}</td>
                      <td className="px-6 py-4 text-text-muted">{r.department}</td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{r.companyName}</td>
                      <td className="px-6 py-4 text-text-muted max-w-xs truncate">{r.location}</td>
                      <td className="px-6 py-4 text-center font-semibold text-success">{r.ctc} LPA</td>
                      <td className="px-6 py-4 text-right text-text-muted">
                        {new Date(r.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => navigate(`/students/${r.studentId}`)}
                            className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded hover:text-primary transition cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded hover:text-primary transition cursor-pointer"
                            title="Edit Record"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary text-error hover:bg-error/10 rounded transition cursor-pointer"
                            title="Revoke Offer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* Unplaced Report list */
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-background-tertiary border-b border-border-primary text-[11px] font-bold text-text-muted uppercase tracking-wider">
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">College Email</th>
                  <th className="px-6 py-4 text-right">UG Degree %</th>
                  <th className="px-6 py-4 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-primary text-xs text-text-secondary">
                {data.unplaced.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-text-muted">
                      No unplaced student records to report. All eligible students placed.
                    </td>
                  </tr>
                ) : (
                  data.unplaced.map((r, idx) => (
                    <tr key={idx} className="hover:bg-surface-2 transition duration-150">
                      <td className="px-6 py-4 font-mono font-semibold text-text-primary">{r.rollNumber}</td>
                      <td className="px-6 py-4 font-semibold text-text-primary">{r.fullName}</td>
                      <td className="px-6 py-4 text-text-muted">{r.department}</td>
                      <td className="px-6 py-4 truncate text-text-secondary">{r.email}</td>
                      <td className="px-6 py-4 text-right font-semibold">{r.ugPercentage}%</td>
                      <td className="px-6 py-4">
                        <div className="flex gap-2 justify-center items-center">
                          <button
                            onClick={() => navigate(`/students/${r.studentId}`)}
                            className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded hover:text-primary transition cursor-pointer"
                            title="View Profile"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleOpenEdit(r)}
                            className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary rounded hover:text-primary transition cursor-pointer"
                            title="Edit Candidate"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(r)}
                            className="p-1.5 bg-surface-2 hover:bg-surface-3 border border-border-primary text-error hover:bg-error/10 rounded transition cursor-pointer"
                            title="Delete Candidate"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Dialog Modal */}
      {editOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto p-4 bg-black/60 backdrop-blur-sm flex justify-center items-center">
          <div className="bg-surface-1 max-w-md w-full rounded border border-border-primary shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center px-6 py-4 border-b border-border-primary">
              <h3 className="font-extrabold text-text-primary text-sm uppercase tracking-wider">
                {activeTab === 'placed' ? 'Edit Placement Details' : 'Edit Candidate Details'}
              </h3>
              <button
                onClick={() => setEditOpen(false)}
                className="p-1 hover:bg-surface-2 rounded text-text-secondary hover:text-text-primary transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSaveEdit} className="p-6 space-y-4">
              {activeTab === 'placed' ? (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Placed CTC Package (LPA)</label>
                    <input
                      type="number"
                      step="0.01"
                      required
                      className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                      value={editCtc}
                      onChange={(e) => setEditCtc(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Offer Date</label>
                    <input
                      type="date"
                      required
                      className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                      value={editDate}
                      onChange={(e) => setEditDate(e.target.value)}
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-text-muted uppercase tracking-wider">College Email</label>
                    <input
                      type="email"
                      required
                      className="w-full h-10 px-3 border border-border-primary rounded text-xs outline-none bg-background-secondary text-text-primary focus:border-primary transition"
                      value={editEmail}
                      onChange={(e) => setEditEmail(e.target.value)}
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full h-10 bg-gradient-primary hover:brightness-110 disabled:opacity-50 text-white font-bold text-xs rounded transition flex items-center justify-center gap-2 glow-primary border-0 cursor-pointer"
              >
                {actionLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <span>Save Changes</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
