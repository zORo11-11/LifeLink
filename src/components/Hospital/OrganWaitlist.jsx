import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGANS       = ['Heart', 'Kidney', 'Liver', 'Lung', 'Pancreas'];
const URGENCIES    = ['Critical', 'High', 'Moderate'];

const statusColors = {
  Waiting:   'bg-amber-50 text-amber-700 border-amber-200',
  Offered:   'bg-blue-50 text-blue-700 border-blue-200',
  Allocated: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Transplanted: 'bg-purple-50 text-purple-700 border-purple-200',
  Removed:   'bg-red-50 text-red-600 border-red-200',
};

const urgencyColors = {
  Critical: 'bg-red-50 text-red-600 border-red-200',
  High:     'bg-orange-50 text-orange-600 border-orange-200',
  Moderate: 'bg-amber-50 text-amber-600 border-amber-200',
};

const SkeletonRow = () => (
  <tr className="animate-pulse">
    {[...Array(7)].map((_, i) => (
      <td key={i} className="px-4 py-3">
        <div className="h-4 bg-slate-200 rounded w-3/4" />
      </td>
    ))}
  </tr>
);

const OrganWaitlist = ({ showToast }) => {
  const [recipients, setRecipients]   = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [showForm, setShowForm]       = useState(false);
  const [editTarget, setEditTarget]   = useState(null); // recipient being edited
  const [confirmRemove, setConfirmRemove] = useState(null);

  const emptyForm = {
    patientName: '', age: '', gender: 'Male',
    bloodGroup: 'O+', organType: 'Kidney',
    urgency: 'High', hlaMarkers: '', medicalFile: null,
  };
  const [form, setForm] = useState(emptyForm);

  // ── Fetch recipients ────────────────────────────────────────────────────────
  const fetchRecipients = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/organ/recipients');
      if (res.success) setRecipients(res.data || []);
      else showToast(res.message || 'Failed to load waitlist', 'error');
    } catch {
      showToast('Network error loading waitlist', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchRecipients(); }, [fetchRecipients]);

  // ── Form helpers ────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    setForm(prev => ({ ...prev, [name]: files ? files[0] : value }));
  };

  const openEdit = (r) => {
    setEditTarget(r);
    setForm({
      patientName: r.patientName || '',
      age: r.age || '',
      gender: r.gender || 'Male',
      bloodGroup: r.bloodGroup || 'O+',
      organType: r.organType || 'Kidney',
      urgency: r.urgency || 'High',
      hlaMarkers: JSON.stringify(r.hlaMarkers || {}),
      medicalFile: null,
    });
    setShowForm(true);
  };

  const resetForm = () => {
    setForm(emptyForm);
    setEditTarget(null);
    setShowForm(false);
  };

  // ── Submit (create or patch) ────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.patientName.trim()) { showToast('Patient name is required', 'error'); return; }
    setSubmitting(true);
    try {
      let hlaObj = {};
      try { hlaObj = form.hlaMarkers ? JSON.parse(form.hlaMarkers) : {}; } catch { hlaObj = {}; }

      const payload = {
        patientName: form.patientName.trim(),
        age: Number(form.age) || undefined,
        gender: form.gender,
        bloodGroup: form.bloodGroup,
        organType: form.organType,
        urgency: form.urgency,
        hlaMarkers: hlaObj,
      };

      let res;
      if (editTarget) {
        res = await api.patch(`/api/organ/recipients/${editTarget._id}`, payload);
      } else {
        res = await api.post('/api/organ/recipients', payload);
      }

      if (res.success) {
        showToast(editTarget ? '✓ Recipient updated.' : '✓ Recipient added to waitlist.', 'success');
        resetForm();
        fetchRecipients();
      } else {
        showToast(res.message || 'Operation failed', 'error');
      }
    } catch {
      showToast('Network error', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Remove (PATCH status to Removed) ───────────────────────────────────────
  const handleRemove = async (id) => {
    try {
      const res = await api.patch(`/api/organ/recipients/${id}`, { status: 'Removed' });
      if (res.success) { showToast('Recipient removed from waitlist.', 'info'); fetchRecipients(); }
      else showToast(res.message || 'Remove failed', 'error');
    } catch { showToast('Network error', 'error'); }
    setConfirmRemove(null);
  };

  // ── Days on waitlist helper ─────────────────────────────────────────────────
  const daysSince = (date) => {
    if (!date) return '—';
    const diff = Date.now() - new Date(date).getTime();
    return Math.floor(diff / 86400000) + ' d';
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <span>🫀</span><span>Organ Recipient Waitlist</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Register and manage transplant candidates across all organ types.
          </p>
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(s => !s); }}
          className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl shadow-md transition-all flex items-center space-x-2 text-xs uppercase tracking-wider"
        >
          <span>{showForm ? '✕ Cancel' : '➕ Add Recipient'}</span>
        </button>
      </div>

      {/* Add / Edit Form */}
      {showForm && (
        <div className="custom-glass rounded-2xl p-6 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>{editTarget ? 'Edit Recipient Record' : 'Register New Transplant Recipient'}</span>
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Patient Name */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name *</label>
                <input name="patientName" value={form.patientName} onChange={handleChange} required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl text-sm text-slate-800 font-semibold transition-all"
                  placeholder="Full name" />
              </div>
              {/* Age */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Age</label>
                <input name="age" type="number" value={form.age} onChange={handleChange} min={1} max={120}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl text-sm text-slate-800 transition-all"
                  placeholder="e.g. 45" />
              </div>
              {/* Gender */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Gender</label>
                <select name="gender" value={form.gender} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl text-sm text-slate-700 font-bold transition-all">
                  {['Male','Female','Other'].map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              {/* Blood Group */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blood Group</label>
                <select name="bloodGroup" value={form.bloodGroup} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl text-sm text-slate-700 font-bold transition-all">
                  {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
                </select>
              </div>
              {/* Required Organ */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Organ</label>
                <select name="organType" value={form.organType} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl text-sm text-slate-700 font-bold transition-all">
                  {ORGANS.map(o => <option key={o}>{o}</option>)}
                </select>
              </div>
              {/* Urgency */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Base Urgency Level</label>
                <select name="urgency" value={form.urgency} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl text-sm text-slate-700 font-bold transition-all">
                  {URGENCIES.map(u => <option key={u}>{u}</option>)}
                </select>
              </div>
              {/* HLA Markers */}
              <div className="lg:col-span-2">
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HLA Markers <span className="text-slate-400 normal-case font-normal">(JSON, e.g. {"{"}"A":"24","B":"07"{"}"})</span></label>
                <input name="hlaMarkers" value={form.hlaMarkers} onChange={handleChange}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-purple-400 rounded-xl text-sm text-slate-800 transition-all font-mono"
                  placeholder='{"A":"24","B":"07","DR":"15"}' />
              </div>
              {/* Medical File */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Medical File <span className="text-slate-400 normal-case font-normal">(optional)</span></label>
                <input name="medicalFile" type="file" accept=".pdf,.jpg,.png" onChange={handleChange}
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 focus:outline-none rounded-xl text-xs text-slate-700 file:mr-3 file:py-1 file:px-3 file:rounded-lg file:border-0 file:bg-purple-50 file:text-purple-700 file:font-bold" />
              </div>
            </div>
            <div className="flex space-x-3 pt-2">
              <button type="button" onClick={resetForm}
                className="px-6 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase tracking-wide transition-all border border-slate-200">
                Cancel
              </button>
              <button type="submit" disabled={submitting}
                className="px-8 py-3 bg-purple-600 hover:bg-purple-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-60 flex items-center space-x-2">
                {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving…</span></> : <span>{editTarget ? '✓ Update Record' : '✓ Register Recipient'}</span>}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Waitlist Table */}
      <div className="custom-glass rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-purple-500" />
            <span>Active Waitlist — {recipients.filter(r => r.status !== 'Removed').length} recipients</span>
          </h3>
          <button onClick={fetchRecipients} className="text-xs text-slate-400 hover:text-purple-600 font-bold transition-colors">↻ Refresh</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-100">
                {['Patient Name','Organ','Blood Group','Urgency','Days on List','Status','Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-[10px] font-black uppercase tracking-widest text-slate-400">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, i) => <SkeletonRow key={i} />)
              ) : recipients.filter(r => r.status !== 'Removed').length === 0 ? (
                <tr><td colSpan={7} className="text-center py-14 text-slate-400 font-semibold text-sm">
                  <div className="flex flex-col items-center space-y-2">
                    <span className="text-3xl">🫀</span>
                    <span>No recipients on the waitlist yet.</span>
                  </div>
                </td></tr>
              ) : (
                recipients.filter(r => r.status !== 'Removed').map((r, idx) => (
                  <tr key={r._id || idx} className="border-b border-slate-50 hover:bg-white/70 transition-colors">
                    <td className="px-4 py-3 font-bold text-slate-800">{r.patientName}</td>
                    <td className="px-4 py-3">
                      <span className="flex items-center space-x-1.5">
                        <span className="text-base">
                          {r.organType === 'Heart' ? '🫀' : r.organType === 'Kidney' ? '🫘' : r.organType === 'Liver' ? '🏥' : r.organType === 'Lung' ? '🫁' : '🧫'}
                        </span>
                        <span className="font-semibold text-slate-700">{r.organType}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-black text-red-600 text-sm">{r.bloodGroup}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${urgencyColors[r.urgency] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {r.urgency}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-semibold">{daysSince(r.registeredAt || r.createdAt)}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${statusColors[r.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => openEdit(r)}
                          className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all">
                          Edit
                        </button>
                        <button onClick={() => setConfirmRemove(r._id)}
                          className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all">
                          Remove
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Confirm Remove Dialog */}
      {confirmRemove && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setConfirmRemove(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full border border-slate-200">
            <h4 className="text-base font-black text-slate-800 mb-2">Remove Recipient?</h4>
            <p className="text-sm text-slate-500 mb-5">This will mark the recipient as removed from the active waitlist. This action can be reversed by editing the record.</p>
            <div className="flex space-x-3">
              <button onClick={() => setConfirmRemove(null)}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs uppercase">
                Cancel
              </button>
              <button onClick={() => handleRemove(confirmRemove)}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase shadow-md">
                Confirm Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganWaitlist;
