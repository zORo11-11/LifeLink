import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const HospitalInventory = ({
  inventory = [],
  setInventory,
  batches = [],
  donors = [],
  setShowAddStockModal,
  handleDiscardBatch,
  handleVerifyCheckIn,
  verificationDonorId = '',
  setVerificationDonorId,
  verificationVolume = 450,
  setVerificationVolume,
  verificationNotes = '',
  setVerificationNotes,
  activeSubTab = 'inventory' // 'inventory' or 'verification'
}) => {
  const [scheduledAppointments, setScheduledAppointments] = useState([]);
  const [loadingAppointments, setLoadingAppointments]     = useState(false);

  // Fetch persistent MongoDB appointments for hospital check-in
  const fetchAppointments = useCallback(async () => {
    setLoadingAppointments(true);
    try {
      const res = await api.get('/api/appointments/hospital');
      if (res && res.success && Array.isArray(res.data)) {
        setScheduledAppointments(res.data);
      }
    } catch (err) {
      console.warn('Error fetching hospital appointments:', err);
    } finally {
      setLoadingAppointments(false);
    }
  }, []);

  useEffect(() => {
    if (activeSubTab === 'verification') {
      fetchAppointments();
    }
  }, [activeSubTab, fetchAppointments]);
  const defaultInventory = [
    { type: 'O-', units: 0, status: 'Critical' },
    { type: 'O+', units: 0, status: 'Critical' },
    { type: 'A-', units: 0, status: 'Critical' },
    { type: 'A+', units: 0, status: 'Critical' },
    { type: 'B-', units: 0, status: 'Critical' },
    { type: 'B+', units: 0, status: 'Critical' },
    { type: 'AB-', units: 0, status: 'Critical' },
    { type: 'AB+', units: 0, status: 'Critical' }
  ];

  const inventoryToRender = (inventory && inventory.length > 0) ? inventory : defaultInventory;

  return (
    <div className="space-y-8 animate-fadeIn">
      {activeSubTab === 'inventory' && (
        <>
          {/* Action Bar */}
          <div className="flex justify-between items-center bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
            <div>
              <h2 className="text-lg font-extrabold text-slate-900">Blood Bank Reserve Inventory</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                Monitor live bags on site. Log fresh donor packages and flag expired batches.
              </p>
            </div>
            <button
              onClick={() => setShowAddStockModal && setShowAddStockModal(true)}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all flex items-center space-x-2 text-xs uppercase tracking-wider shadow-sm"
            >
              <span>📥</span>
              <span>Log Incoming Donation</span>
            </button>
          </div>

          {/* Inventory Units Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {inventoryToRender.map((inv, index) => {
              const isCritical = inv.status === 'Critical';
              const isLow = inv.status === 'Low';
              
              return (
                <div key={inv.type || index} className="custom-glass p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow transition-all border border-slate-200">
                  <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                    isCritical ? 'bg-red-500 animate-pulse' :
                    isLow ? 'bg-amber-500' : 'bg-emerald-500'
                  }`} />

                  <div className="flex justify-between items-start">
                    <span className="text-md font-black text-slate-800">{inv.type}</span>
                    <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                      isCritical ? 'bg-red-50 border-red-200 text-red-600' :
                      isLow ? 'bg-amber-50 border-amber-200 text-amber-600' :
                      'bg-emerald-50 border-emerald-200 text-emerald-600'
                    }`}>
                      {inv.status}
                    </span>
                  </div>

                  <div className="mt-4 flex items-baseline space-x-1">
                    <span className="text-4xl font-black tracking-tight text-slate-900">{inv.units || 0}</span>
                    <span className="text-[10px] text-slate-400 font-extrabold uppercase">Units</span>
                  </div>

                  <div className="flex space-x-1.5 mt-4 pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        if (!setInventory) return;
                        const nextInv = inventoryToRender.map(item => {
                          if (item.type === inv.type) {
                            const units = Math.max(0, item.units - 1);
                            return { ...item, units, status: units > 10 ? 'Optimal' : units > 5 ? 'Low' : 'Critical' };
                          }
                          return item;
                        });
                        setInventory(nextInv);
                      }}
                      className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 text-xs font-bold rounded-lg border border-slate-200"
                    >
                      -1u
                    </button>
                    <button
                      onClick={() => {
                        if (!setInventory) return;
                        const nextInv = inventoryToRender.map(item => {
                          if (item.type === inv.type) {
                            const units = item.units + 1;
                            return { ...item, units, status: units > 10 ? 'Optimal' : units > 5 ? 'Low' : 'Critical' };
                          }
                          return item;
                        });
                        setInventory(nextInv);
                      }}
                      className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 text-xs font-bold rounded-lg border border-slate-200"
                    >
                      +1u
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Batches Tracker Table */}
          <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
            <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
              <span>📋</span>
              <span className="ml-2">Specific Batches & Blood Packs Tracker</span>
            </h3>

            {(!batches || batches.length === 0) ? (
              <div className="text-center py-8 bg-white/40 border border-slate-100 rounded-xl">
                <p className="text-xs text-slate-500 font-bold">No active blood batches logged in memory.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 font-bold tracking-wider">
                      <th className="pb-3 pl-3">Batch ID</th>
                      <th className="pb-3">Blood Type</th>
                      <th className="pb-3">Units</th>
                      <th className="pb-3">Expiry Date</th>
                      <th className="pb-3">Batch Status</th>
                      <th className="pb-3 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((batch, index) => {
                      const batchId = batch._id || batch.id || index;
                      const isExpired = batch.status === 'Expired' || new Date(batch.expiry) < new Date();
                      const isExpiringSoon = batch.status === 'Expiring Soon';

                      return (
                        <tr key={batchId} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 pl-3 font-mono text-xs font-bold text-slate-600">
                            {batchId}
                          </td>
                          <td className="py-4">
                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                              Type {batch.bloodType}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-slate-700 text-xs">
                            {batch.units} Bags (u)
                          </td>
                          <td className={`py-4 text-xs font-semibold ${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                            {batch.expiry} {isExpired ? '(EXPIRED)' : isExpiringSoon ? '(Expiring Soon)' : ''}
                          </td>
                          <td className="py-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              isExpired ? 'bg-red-50 text-red-600 border-red-200' :
                              isExpiringSoon ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' :
                              'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                              {isExpired ? 'Expired' : batch.status}
                            </span>
                          </td>
                          <td className="py-4 pr-3 text-right">
                            <button
                              onClick={() => handleDiscardBatch && handleDiscardBatch(batchId)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-600 border border-slate-200 hover:border-red-200 text-[10px] font-bold rounded-lg transition-all"
                            >
                              Discard & Deduct
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* VERIFICATION SUB-TAB */}
      {activeSubTab === 'verification' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
          <div className="lg:col-span-2 custom-glass rounded-2xl p-6 shadow-sm flex flex-col justify-between border border-slate-200">
            <div>
              <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
                <span>📋</span>
                <span className="ml-2">Donor Check-in & Verification</span>
              </h2>
              <p className="text-xs text-slate-500 font-semibold mb-6">
                Verify arriving donors at the triage center. Record actual blood volume collected, reset eligibility timers, and mark requests completed.
              </p>

              <form onSubmit={handleVerifyCheckIn} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Verify Donor (Select/Input ID or Name)</label>
                  <select
                    value={verificationDonorId}
                    onChange={(e) => setVerificationDonorId && setVerificationDonorId(e.target.value)}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700"
                  >
                    <option value="">-- Choose Arrived Donor --</option>
                    {(donors || []).map((d, index) => {
                      const dId = d._id || d.id || index;
                      const dName = d.fullName || d.name || 'Donor';
                      return (
                        <option key={dId} value={dId}>
                          {dName} ({dId}) - Type {d.bloodType || d.bloodGroup} [Status: {d.status || 'Available'}]
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Volume Extracted (ml)</label>
                    <input
                      type="number"
                      value={verificationVolume}
                      onChange={(e) => setVerificationVolume && setVerificationVolume(parseInt(e.target.value))}
                      placeholder="e.g. 450"
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estimated Unit Output</label>
                    <input
                      type="text"
                      disabled
                      value={`${Math.round((verificationVolume / 450) * 100) / 100} Bags (~1u)`}
                      className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Verification / Clinical Notes</label>
                  <textarea
                    value={verificationNotes}
                    onChange={(e) => setVerificationNotes && setVerificationNotes(e.target.value)}
                    placeholder="e.g. Cleared pre-screening, pulse stable, vitals optimal."
                    rows={3}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/10"
                >
                  ✓ Complete Check-in & Log Blood Donation
                </button>
              </form>
            </div>

            <div className="border-t border-slate-100 pt-6 mt-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">90-Day Eligibility Rule</h4>
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Completing check-in will automatically flag this donor as "Recently Donated". This triggers an automated 90-day block on their availability, ensuring compliance with clinical safety windows.
              </p>
            </div>
          </div>

          <div className="custom-glass rounded-2xl p-6 shadow-sm flex flex-col justify-between border border-slate-200 space-y-6">
            {/* Booked Appointments Feed */}
            <div>
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-sm font-extrabold text-slate-900 flex items-center space-x-2">
                  <span>📅</span>
                  <span>Upcoming Booked Appointments</span>
                </h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                  {scheduledAppointments.length} Active
                </span>
              </div>

              {loadingAppointments ? (
                <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
              ) : scheduledAppointments.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 font-semibold">No upcoming appointments booked for this center.</p>
              ) : (
                <div className="space-y-3 max-h-56 overflow-y-auto pr-1 scrollbar-thin">
                  {scheduledAppointments.map((apt, idx) => {
                    const donorName = apt.donorName || apt.donorId?.fullName || apt.donorId?.name || 'Booked Donor';
                    const bg = apt.bloodGroup || apt.donorId?.bloodGroup || 'O+';
                    const donorId = apt.donorId?._id || apt.donorId || apt._id;

                    return (
                      <div key={apt._id || idx} className="p-3 bg-white/80 border border-slate-200 rounded-xl flex items-center justify-between text-xs hover:border-red-200 transition-colors">
                        <div>
                          <p className="font-extrabold text-slate-800">{donorName}</p>
                          <p className="text-[10px] text-slate-500 font-semibold mt-0.5">
                            <strong className="text-red-600">{bg}</strong> &bull; {apt.appointmentDate} ({apt.appointmentTime})
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setVerificationDonorId && setVerificationDonorId(donorId)}
                          className="px-2.5 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] uppercase shadow-sm"
                        >
                          Check In
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Dispatched Donor Status */}
            <div className="border-t border-slate-200/60 pt-4">
              <h3 className="text-sm font-bold text-slate-900 mb-3">📢 Dispatched Donor Status</h3>
              <div className="space-y-3">
                {(donors || []).filter(d => d.status === 'In-Transit' || d.status === 'Arrived').map((donor, index) => {
                  const dId = donor._id || donor.id || index;
                  return (
                    <div key={dId} className="p-3 bg-white/70 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm text-xs">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-sm shadow-inner">
                          {donor.status === 'Arrived' ? '🏥' : '🚑'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{donor.fullName || donor.name}</p>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">ID: {dId} &bull; Type {donor.bloodType || donor.bloodGroup}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                          donor.status === 'Arrived' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
                        }`}>
                          {donor.status}
                        </span>
                        
                        <button
                          onClick={() => setVerificationDonorId && setVerificationDonorId(dId)}
                          className="block mt-1 text-[9px] font-bold text-red-500 hover:underline"
                        >
                          Fill Form
                        </button>
                      </div>
                    </div>
                  );
                })}
                {(donors || []).filter(d => d.status === 'In-Transit' || d.status === 'Arrived').length === 0 && (
                  <p className="text-xs text-slate-400 text-center py-3 font-semibold">No donors currently in transit or waiting at check-in.</p>
                )}
              </div>
            </div>

            <div className="bg-white/50 border border-slate-200 p-4 rounded-xl mt-4">
              <h4 className="text-xs font-bold text-slate-500 uppercase">Emergency Protocol</h4>
              <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                In case of urgent walk-in donors not listed in the directory, log their registration first using the registry system, or input custom ID DN-TEMP for fast tracking.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default HospitalInventory;
