import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const BLOOD_GROUPS  = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
const ORGANS        = ['Heart', 'Kidney', 'Liver', 'Lung', 'Pancreas'];
const ORGAN_VIABILITY = { Heart: 4, Lung: 4, Liver: 8, Pancreas: 12, Kidney: 24 };

const organEmoji = { Heart:'🫀', Kidney:'🫘', Liver:'🏥', Lung:'🫁', Pancreas:'🧫' };

const statusBadge = {
  Active:      'bg-emerald-50 text-emerald-700 border-emerald-200',
  Completed:   'bg-slate-100 text-slate-500 border-slate-200',
  Cancelled:   'bg-red-50 text-red-600 border-red-200',
};

const organStatusBadge = {
  Available: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Offered:   'bg-blue-50 text-blue-700 border-blue-200',
  Allocated: 'bg-purple-50 text-purple-700 border-purple-200',
};

const SkeletonCard = () => (
  <div className="animate-pulse bg-white/60 border border-slate-100 rounded-2xl p-5 space-y-3">
    <div className="h-4 bg-slate-200 rounded w-1/2" />
    <div className="h-3 bg-slate-200 rounded w-1/3" />
    <div className="h-8 bg-slate-100 rounded-xl w-full" />
  </div>
);

// ─── Remaining Viability Badge ─────────────────────────────────────────────────
const ViabilityBadge = ({ organ }) => {
  const [remaining, setRemaining] = useState('');

  useEffect(() => {
    const update = () => {
      const procured = new Date(organ.procurementTimestamp || organ.createdAt);
      const expiry   = new Date(procured.getTime() + (organ.viabilityHours || 4) * 3600 * 1000);
      const diff     = expiry - Date.now();
      if (diff <= 0) { setRemaining('Expired'); return; }
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      setRemaining(`${h}h ${m}m left`);
    };
    update();
    const id = setInterval(update, 60000);
    return () => clearInterval(id);
  }, [organ]);

  const isExpired  = remaining === 'Expired';
  const isWarning  = remaining && !isExpired && parseInt(remaining) <= 2;

  return (
    <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${
      isExpired  ? 'bg-red-50 text-red-600 border-red-200' :
      isWarning  ? 'bg-amber-50 text-amber-600 border-amber-200' :
                   'bg-emerald-50 text-emerald-700 border-emerald-200'
    }`}>
      ⏱ {remaining}
    </span>
  );
};

const OrganDonorForm = ({ showToast }) => {
  const [donors, setDonors]       = useState([]);
  const [loading, setLoading]     = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [addingOrgan, setAddingOrgan] = useState(null); // donorId being targeted

  // Donor registration form
  const emptyDonor = {
    donorName: '', donorId: '',
    donorType: 'Deceased',
    bloodGroup: 'O+', hlaMarkers: '',
    locationLat: '', locationLng: '', locationCity: '',
  };
  const [donorForm, setDonorForm] = useState(emptyDonor);

  // Organ-add form
  const emptyOrgan = {
    organType: 'Kidney',
    organIdentifier: '',
    viabilityHours: '',
    procurementTimestamp: '',
  };
  const [organForm, setOrganForm] = useState(emptyOrgan);

  // ── Fetch donors ─────────────────────────────────────────────────────────────
  const fetchDonors = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/api/organ/donors');
      if (res.success) setDonors(res.data || []);
      else showToast(res.message || 'Failed to load donors', 'error');
    } catch {
      showToast('Network error loading donors', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => { fetchDonors(); }, [fetchDonors]);

  // ── Register donor ───────────────────────────────────────────────────────────
  const handleRegisterDonor = async (e) => {
    e.preventDefault();
    if (!donorForm.donorName.trim()) { showToast('Donor name is required', 'error'); return; }
    setSubmitting(true);
    try {
      let hla = {};
      try { hla = donorForm.hlaMarkers ? JSON.parse(donorForm.hlaMarkers) : {}; } catch { hla = {}; }

      const payload = {
        donorName: donorForm.donorName.trim(),
        donorId:   donorForm.donorId.trim() || undefined,
        donorType: donorForm.donorType,
        bloodGroup: donorForm.bloodGroup,
        hlaMarkers: hla,
        location: (donorForm.locationLat && donorForm.locationLng) ? {
          type: 'Point',
          coordinates: [parseFloat(donorForm.locationLng), parseFloat(donorForm.locationLat)],
          city: donorForm.locationCity || undefined,
        } : undefined,
      };

      const res = await api.post('/api/organ/donors', payload);
      if (res.success) {
        showToast('✓ Organ donor registered successfully.', 'success');
        setDonorForm(emptyDonor);
        fetchDonors();
      } else {
        showToast(res.message || 'Registration failed', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  // ── Add organ to existing donor ──────────────────────────────────────────────
  const handleAddOrgan = async (e) => {
    e.preventDefault();
    if (!organForm.organIdentifier.trim()) { showToast('Organ identifier is required', 'error'); return; }
    setSubmitting(true);
    try {
      const defaultVia = ORGAN_VIABILITY[organForm.organType] || 4;
      const payload = {
        organType: organForm.organType,
        organIdentifier: organForm.organIdentifier.trim(),
        viabilityHours: organForm.viabilityHours ? Number(organForm.viabilityHours) : defaultVia,
        procurementTimestamp: organForm.procurementTimestamp || new Date().toISOString(),
      };

      const res = await api.post(`/api/organ/donors/${addingOrgan}/organs`, payload);
      if (res.success) {
        showToast(`✓ ${payload.organType} (${payload.organIdentifier}) added.`, 'success');
        setOrganForm(emptyOrgan);
        setAddingOrgan(null);
        fetchDonors();
      } else {
        showToast(res.message || 'Failed to add organ', 'error');
      }
    } catch { showToast('Network error', 'error'); }
    finally { setSubmitting(false); }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <span>🏥</span><span>Register Organ Donor / Procurement</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Register deceased or brain-dead donors and log available organs with cold-chain timestamps.
          </p>
        </div>
      </div>

      {/* Registration Form */}
      <div className="custom-glass rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-5 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-teal-500" />
          <span>New Donor Registration</span>
        </h3>
        <form onSubmit={handleRegisterDonor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Donor Name */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Donor Name / Alias *</label>
              <input value={donorForm.donorName} onChange={e => setDonorForm(p => ({...p, donorName: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800 font-semibold transition-all"
                placeholder="e.g. John Doe / DONOR-A1" required />
            </div>
            {/* Donor ID */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Donor ID / Alias</label>
              <input value={donorForm.donorId} onChange={e => setDonorForm(p => ({...p, donorId: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800 transition-all"
                placeholder="e.g. DN-2025-001 (optional)" />
            </div>
            {/* Donor Type */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Donor Type</label>
              <select value={donorForm.donorType} onChange={e => setDonorForm(p => ({...p, donorType: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-700 font-bold transition-all">
                <option value="Deceased">Deceased / Brain-Dead</option>
                <option value="Living">Living Donor</option>
              </select>
            </div>
            {/* Blood Group */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blood Group</label>
              <select value={donorForm.bloodGroup} onChange={e => setDonorForm(p => ({...p, bloodGroup: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-700 font-bold transition-all">
                {BLOOD_GROUPS.map(g => <option key={g}>{g}</option>)}
              </select>
            </div>
            {/* HLA Markers */}
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">HLA Markers <span className="text-slate-400 normal-case font-normal">(JSON)</span></label>
              <input value={donorForm.hlaMarkers} onChange={e => setDonorForm(p => ({...p, hlaMarkers: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800 transition-all font-mono"
                placeholder='{"A":"24","B":"07","DR":"15"}' />
            </div>
          </div>
          {/* Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hospital Latitude</label>
              <input type="number" step="any" value={donorForm.locationLat} onChange={e => setDonorForm(p => ({...p, locationLat: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800 transition-all"
                placeholder="e.g. 13.0827" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Hospital Longitude</label>
              <input type="number" step="any" value={donorForm.locationLng} onChange={e => setDonorForm(p => ({...p, locationLng: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800 transition-all"
                placeholder="e.g. 80.2707" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">City / Location Name</label>
              <input value={donorForm.locationCity} onChange={e => setDonorForm(p => ({...p, locationCity: e.target.value}))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800 transition-all"
                placeholder="e.g. Chennai" />
            </div>
          </div>
          <div className="flex space-x-3 pt-2">
            <button type="submit" disabled={submitting}
              className="px-8 py-3 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-60 flex items-center space-x-2">
              {submitting ? <><span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /><span>Saving…</span></> : <span>✓ Register Donor</span>}
            </button>
          </div>
        </form>
      </div>

      {/* Add Organ Modal */}
      {addingOrgan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setAddingOrgan(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <h4 className="text-base font-black text-slate-800 mb-4 flex items-center space-x-2">
              <span>➕</span><span>Add Available Organ</span>
            </h4>
            <form onSubmit={handleAddOrgan} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Organ Type</label>
                  <select value={organForm.organType} onChange={e => setOrganForm(p => ({...p, organType: e.target.value}))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-700 font-bold">
                    {ORGANS.map(o => <option key={o}>{o}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Organ Identifier *</label>
                  <input value={organForm.organIdentifier} onChange={e => setOrganForm(p => ({...p, organIdentifier: e.target.value}))}
                    required className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800 font-mono"
                    placeholder="e.g. KID-001" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">
                    Viability (hrs) <span className="font-normal text-slate-400">— default: {ORGAN_VIABILITY[organForm.organType]}h</span>
                  </label>
                  <input type="number" min={1} max={72} value={organForm.viabilityHours}
                    onChange={e => setOrganForm(p => ({...p, viabilityHours: e.target.value}))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800"
                    placeholder={String(ORGAN_VIABILITY[organForm.organType])} />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Cold Ischemia Start</label>
                  <input type="datetime-local" value={organForm.procurementTimestamp}
                    onChange={e => setOrganForm(p => ({...p, procurementTimestamp: e.target.value}))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-teal-400 rounded-xl text-sm text-slate-800" />
                </div>
              </div>
              <div className="flex space-x-3 pt-2">
                <button type="button" onClick={() => setAddingOrgan(null)}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase">Cancel</button>
                <button type="submit" disabled={submitting}
                  className="flex-1 py-2.5 bg-teal-600 hover:bg-teal-700 text-white font-extrabold rounded-xl text-xs uppercase shadow-md disabled:opacity-60 flex items-center justify-center space-x-2">
                  {submitting ? <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <span>✓ Add Organ</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Donors List */}
      <div className="custom-glass rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-teal-500 animate-pulse" />
            <span>Active Donor Records — {donors.filter(d => d.status === 'Active').length} active</span>
          </h3>
          <button onClick={fetchDonors} className="text-xs text-slate-400 hover:text-teal-600 font-bold transition-colors">↻ Refresh</button>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {[...Array(4)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : donors.length === 0 ? (
          <div className="text-center py-14">
            <span className="text-3xl">🏥</span>
            <p className="text-sm font-bold text-slate-400 mt-3">No organ donors registered yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-5">
            {donors.map((d, idx) => (
              <div key={d._id || idx} className="bg-white/70 border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                {/* Donor header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-sm font-extrabold text-slate-800">{d.donorName}</p>
                    {d.donorId && <p className="text-[10px] font-mono text-slate-400 mt-0.5">{d.donorId}</p>}
                    <div className="flex items-center space-x-2 mt-1.5">
                      <span className="px-2 py-0.5 text-[10px] font-bold rounded border bg-slate-50 text-slate-600 border-slate-200">{d.donorType || 'Deceased'}</span>
                      <span className="font-black text-red-600 text-xs">{d.bloodGroup}</span>
                    </div>
                  </div>
                  <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border ${statusBadge[d.status] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                    {d.status || 'Active'}
                  </span>
                </div>

                {/* Available organs */}
                <div className="space-y-2 mb-3">
                  {(d.availableOrgans || []).length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No organs registered yet.</p>
                  ) : (
                    d.availableOrgans.map((organ, oi) => (
                      <div key={oi} className="flex items-center justify-between bg-slate-50 border border-slate-100 rounded-xl px-3 py-2">
                        <div className="flex items-center space-x-2">
                          <span className="text-base">{organEmoji[organ.organType] || '🫁'}</span>
                          <div>
                            <p className="text-xs font-bold text-slate-700">{organ.organType}</p>
                            <p className="text-[10px] font-mono text-slate-400">{organ.organIdentifier}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ViabilityBadge organ={organ} />
                          <span className={`px-2 py-0.5 text-[10px] font-bold rounded border ${organStatusBadge[organ.organStatus] || 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                            {organ.organStatus}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Add organ button */}
                {d.status !== 'Completed' && d.status !== 'Cancelled' && (
                  <button onClick={() => { setAddingOrgan(d._id); setOrganForm(emptyOrgan); }}
                    className="w-full py-2 mt-1 bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-700 font-bold rounded-xl text-[10px] uppercase tracking-wider transition-all flex items-center justify-center space-x-1.5">
                    <span>➕</span><span>Add Available Organ</span>
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrganDonorForm;
