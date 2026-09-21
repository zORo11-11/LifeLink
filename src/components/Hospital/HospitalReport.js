import React from 'react';

const HospitalReport = ({
  history = [],
  downloadCSVReport,
  downloadPDFReport
}) => {
  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/60 p-6 rounded-2xl border border-white gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Coordination Reports & Fulfillment History</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Download official audits, track average donor response speeds, and check stock distribution logs.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={downloadCSVReport}
            className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <span>📊</span>
            <span>Export CSV</span>
          </button>
          <button
            onClick={downloadPDFReport}
            className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm"
          >
            <span>📄</span>
            <span>Print PDF Report</span>
          </button>
        </div>
      </div>

      {/* Performance charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Response Time Chart */}
        <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-4">⏱️ Avg. Donor Response Time (by blood type)</h3>
          <div className="space-y-3.5">
            {[
              { type: 'O-', min: 8, pct: 35 },
              { type: 'A+', min: 14, pct: 60 },
              { type: 'B-', min: 18, pct: 75 },
              { type: 'AB-', min: 22, pct: 90 }
            ].map((chartRow, idx) => (
              <div key={chartRow.type || idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>Group {chartRow.type}</span>
                  <strong className="text-slate-700">{chartRow.min} minutes average</strong>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className="bg-red-500 h-full rounded-full" style={{ width: `${chartRow.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Fulfilled volume share */}
        <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-bold text-slate-800 mb-4">📈 Weekly Blood Volume Distribution (Units)</h3>
          <div className="space-y-3.5">
            {[
              { type: 'Emergency Surgery Allocation', units: 14, pct: 75, color: 'bg-red-500' },
              { type: 'Surgical Wards Staged Reserves', units: 8, pct: 45, color: 'bg-blue-500' },
              { type: 'Trauma & Triage Direct Dispense', units: 6, pct: 30, color: 'bg-amber-500' }
            ].map((chartRow, idx) => (
              <div key={chartRow.type || idx} className="space-y-1">
                <div className="flex justify-between text-xs font-semibold text-slate-500">
                  <span>{chartRow.type}</span>
                  <strong className="text-slate-700">{chartRow.units} Units</strong>
                </div>
                <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                  <div className={`${chartRow.color} h-full rounded-full`} style={{ width: `${chartRow.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Past Request Log Table */}
      <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center">
          <span>🕰️</span>
          <span className="ml-2">Fulfilled Request Audit History</span>
        </h3>

        {(!history || history.length === 0) ? (
          <div className="text-center py-12 bg-white/40 border border-slate-100 rounded-xl">
            <span className="text-2xl">📑</span>
            <p className="text-xs text-slate-500 font-bold mt-2">No fulfilled donation logs found in audit history.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 font-bold tracking-wider">
                  <th className="pb-3 pl-3">Case ID</th>
                  <th className="pb-3">Date</th>
                  <th className="pb-3">Patient</th>
                  <th className="pb-3">Blood Type</th>
                  <th className="pb-3">Units</th>
                  <th className="pb-3">Urgency</th>
                  <th className="pb-3">Verified Donor</th>
                  <th className="pb-3">Response Time</th>
                  <th className="pb-3 pr-3 text-right">Fulfillment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {history.map((row, index) => {
                  const caseId = row._id || row.id || index;
                  return (
                    <tr key={caseId} className="hover:bg-slate-50/40 transition-colors">
                      <td className="py-4 pl-3 font-mono text-xs font-bold text-slate-600">
                        {caseId}
                      </td>
                      <td className="py-4 text-xs font-semibold text-slate-500">
                        {row.date || 'N/A'}
                      </td>
                      <td className="py-4 text-xs font-bold text-slate-700">
                        {row.patient || 'Patient'}
                      </td>
                      <td className="py-4">
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                          {row.bloodType || 'O+'}
                        </span>
                      </td>
                      <td className="py-4 font-bold text-slate-700 text-xs">
                        {row.units || 1} u
                      </td>
                      <td className="py-4">
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          row.urgency === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {row.urgency || 'Standard'}
                        </span>
                      </td>
                      <td className="py-4 text-xs font-semibold text-slate-700">
                        {row.donor || 'Donor'}
                      </td>
                      <td className="py-4 text-xs font-bold text-slate-400">
                        {row.responseTime || '15 mins'}
                      </td>
                      <td className="py-4 pr-3 text-right text-emerald-600 text-xs font-bold">
                        ✓ Completed
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalReport;
