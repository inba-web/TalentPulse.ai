import React, { useEffect, useState } from 'react';
import { FileSpreadsheet, Download, Loader2 } from 'lucide-react';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<'placed' | 'unplaced'>('placed');
  const [data, setData] = useState<{ placed: any[]; unplaced: any[] }>({ placed: [], unplaced: [] });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReport = async () => {
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
    fetchReport();
  }, []);

  // Export CSV helper
  const handleExportCSV = () => {
    const records = activeTab === 'placed' ? data.placed : data.unplaced;
    if (records.length === 0) return;

    let csvContent = '';
    
    if (activeTab === 'placed') {
      csvContent += 'Roll Number,Full Name,Department,Company,Location,CTC (LPA),Offer Date\n';
      records.forEach((r) => {
        csvContent += `"${r.rollNumber}","${r.fullName}","${r.department}","${r.companyName}","${r.location}",${r.ctc},"${new Date(r.date).toLocaleDateString()}"\n`;
      });
    } else {
      csvContent += 'Roll Number,Full Name,Department,College Email,UG %\n';
      records.forEach((r) => {
        csvContent += `"${r.rollNumber}","${r.fullName}","${r.department}","${r.email}",${r.ugPercentage}\n`;
      });
    }

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `talentpulse_${activeTab}_report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-text tracking-tight">Placement Intelligence Reports</h1>
          <p className="text-sm text-secondary font-medium">Export batch statistics, offer listings, and student pipelines.</p>
        </div>

        {!loading && (
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary hover:bg-primary-dark text-white text-xs font-semibold rounded-lg shadow shadow-primary/10 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export to CSV</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-border flex gap-6">
        <button
          onClick={() => setActiveTab('placed')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-150 ${
            activeTab === 'placed'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-text'
          }`}
        >
          Drive Completed (Placed)
        </button>
        <button
          onClick={() => setActiveTab('unplaced')}
          className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition duration-150 ${
            activeTab === 'unplaced'
              ? 'border-primary text-primary'
              : 'border-transparent text-secondary hover:text-text'
          }`}
        >
          Yet to Place (Unplaced)
        </button>
      </div>

      {/* Reports Table container */}
      <div className="bg-surface rounded-xl border border-border shadow-sm overflow-hidden">
        {loading ? (
          <div className="text-center py-16 text-secondary">
            <Loader2 className="w-6 h-6 animate-spin text-primary mx-auto mb-2" />
            <span>Generating placement database report...</span>
          </div>
        ) : activeTab === 'placed' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/50 border-b border-border text-[11px] font-bold text-secondary uppercase tracking-wider">
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">Placed Company</th>
                  <th className="px-6 py-4">Location</th>
                  <th className="px-6 py-4 text-center">CTC Package</th>
                  <th className="px-6 py-4 text-right">Offer Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text">
                {data.placed.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-12 text-secondary">
                      No placed student records to report.
                    </td>
                  </tr>
                ) : (
                  data.placed.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition duration-150">
                      <td className="px-6 py-4 font-mono font-semibold text-xs">{r.rollNumber}</td>
                      <td className="px-6 py-4 font-semibold">{r.fullName}</td>
                      <td className="px-6 py-4 text-xs font-medium text-secondary">{r.department}</td>
                      <td className="px-6 py-4 font-semibold text-xs">{r.companyName}</td>
                      <td className="px-6 py-4 text-xs text-secondary max-w-xs truncate">{r.location}</td>
                      <td className="px-6 py-4 text-center text-xs font-semibold text-emerald-600">{r.ctc} LPA</td>
                      <td className="px-6 py-4 text-right text-xs font-medium text-secondary">
                        {new Date(r.date).toLocaleDateString()}
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
                <tr className="bg-slate-50/50 border-b border-border text-[11px] font-bold text-secondary uppercase tracking-wider">
                  <th className="px-6 py-4">Roll Number</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Department</th>
                  <th className="px-6 py-4">College Email</th>
                  <th className="px-6 py-4 text-right">UG Degree Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm text-text">
                {data.unplaced.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-12 text-secondary">
                      No unplaced student records to report. All eligible students placed.
                    </td>
                  </tr>
                ) : (
                  data.unplaced.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/30 transition duration-150">
                      <td className="px-6 py-4 font-mono font-semibold text-xs">{r.rollNumber}</td>
                      <td className="px-6 py-4 font-semibold">{r.fullName}</td>
                      <td className="px-6 py-4 text-xs font-medium text-secondary">{r.department}</td>
                      <td className="px-6 py-4 text-xs font-medium truncate">{r.email}</td>
                      <td className="px-6 py-4 text-right text-xs font-semibold">{r.ugPercentage}%</td>
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
