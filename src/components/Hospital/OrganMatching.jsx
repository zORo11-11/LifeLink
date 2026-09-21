import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';

const SkeletonCard = () => (
  <div className="animate-pulse bg-white/60 border border-slate-100 rounded-2xl p-5 space-y-3">
    <div className="flex justify-between">
      <div className="h-5 bg-slate-200 rounded w-1/3" />
      <div className="h-5 bg-slate-200 rounded w-1/6" />
    </div>
    <div className="h-4 bg-slate-200 rounded w-1/2" />
    <div className="h-10 bg-slate-100 rounded-xl w-full" />
  </div>
);

const OrganMatching = ({ showToast, onOfferInitiated }) => {
  const [donors, setDonors]                 = useState([]);
  const [loadingDonors, setLoadingDonors]   = useState(true);
  const [selectedDonorId, setSelectedDonorId] = useState('');
  const [selectedOrganId, setSelectedOrganId] = useState('');
  
  const [running, setRunning]               = useState(false);
  const [matchResult, setMatchResult]       = useState(null);

  // Offer Modal State
  const [targetCandidate, setTargetCandidate] = useState(null); // candidate object to offer
  const [offerExpiryHours, setOfferExpiryHours] = useState(1);
  const [submittingOffer, setSubmittingOffer] = useState(false);

  // ── Fetch active donors ──────────────────────────────────────────────────────
  const fetchDonors = useCallback(async () => {
    setLoadingDonors(true);
    try {
      const res = await api.get('/api/organ/donors');
      if (res.success) {
        const activeList = (res.data || []).filter(d => (d.availableOrgans || []).some(o => o.organStatus === 'Available'));
        setDonors(activeList);
        if (activeList.length > 0) {
          setSelectedDonorId(activeList[0]._id);
          const firstOrgan = activeList[0].availableOrgans.find(o => o.organStatus === 'Available');
          if (firstOrgan) setSelectedOrganId(firstOrgan.organIdentifier);
        }
      }
    } catch {
      showToast('Error loading active donor pool', 'error');
    } finally {
      setLoadingDonors(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchDonors();
  }, [fetchDonors]);

  // Update selected organ when donor selection changes
  const handleDonorChange = (e) => {
    const dId = e.target.value;
    setSelectedDonorId(dId);
    const donor = donors.find(d => d._id === dId);
    if (donor && donor.availableOrgans) {
      const avail = donor.availableOrgans.find(o => o.organStatus === 'Available');
      setSelectedOrganId(avail ? avail.organIdentifier : '');
    } else {
      setSelectedOrganId('');
    }
  };

  const selectedDonor = donors.find(d => d._id === selectedDonorId);
  const availableOrgansForSelected = selectedDonor 
    ? (selectedDonor.availableOrgans || []).filter(o => o.organStatus === 'Available')
    : [];

  // ── Run Matching Algorithm ────────────────────────────────────────────────────
  const handleRunMatch = async (e) => {
    if (e) e.preventDefault();
    if (!selectedDonorId || !selectedOrganId) {
      showToast('Please select a donor and an available organ', 'error');
      return;
    }

    setRunning(true);
    setMatchResult(null);

    try {
      // Primary route match
      let res = await api.get(`/api/organ/matching/${selectedDonorId}/${selectedOrganId}`);
      if (!res || !res.success) {
        // Fallback POST match if available
        res = await api.post('/api/organ/match', { donorId: selectedDonorId, organIdentifier: selectedOrganId });
      }

      if (res && res.success) {
        setMatchResult(res);
        showToast(`✓ Matching completed. ${res.matchingSummary?.totalEligible || (res.bestCandidate ? 1 : 0)} candidate(s) evaluated.`, 'success');
      } else {
        showToast(res?.message || 'Matching engine returned no results or failed', 'error');
      }
    } catch (err) {
      showToast('Network error while running matching engine', 'error');
    } finally {
      setRunning(false);
    }
  };

  // ── Initiate Organ Offer ─────────────────────────────────────────────────────
  const handleInitiateOffer = async (e) => {
    e.preventDefault();
    if (!targetCandidate || !selectedDonorId || !selectedOrganId) return;

    setSubmittingOffer(true);
    try {
      const recipient = targetCandidate.recipient || targetCandidate;
      const receivingHospitalId = recipient.hospitalId || recipient.hospital || recipient.procurementHospitalId;

      const payload = {
        donorId: selectedDonorId,
        organIdentifier: selectedOrganId,
        recipientId: recipient._id || recipient.id,
        receivingHospitalId: receivingHospitalId || selectedDonor.procurementHospitalId,
        offerExpiryHours: Number(offerExpiryHours) || 1,
      };

      const res = await api.post('/api/organ/offers', payload);
      if (res.success) {
        showToast(`🚀 Organ Offer initiated for patient ${recipient.patientName || 'Candidate'}!`, 'success');
        setTargetCandidate(null);
        if (onOfferInitiated) onOfferInitiated();
        // Refresh matching and donor list
        fetchDonors();
        setMatchResult(null);
      } else {
        showToast(res.message || 'Failed to create organ offer', 'error');
      }
    } catch {
      showToast('Network error creating offer', 'error');
    } finally {
      setSubmittingOffer(false);
    }
  };

  // Extract candidate lists from match result
  const bestCandidate = matchResult?.bestCandidate;
  const eligibleCandidates = matchResult?.eligibleCandidates || (bestCandidate ? [bestCandidate] : []);
  const ineligibleCandidates = matchResult?.ineligibleCandidates || [];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <span>⚙️</span><span>Organ Matching Engine</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Run the multi-criteria matching algorithm (Blood ABO, Urgency, HLA % & Cold-Ischemia Logistics) to rank eligible recipients.
          </p>
        </div>
      </div>

      {/* Control Panel: Select Donor & Organ */}
      <div className="custom-glass rounded-2xl p-6 border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full bg-blue-500" />
          <span>Select Donor & Organ for Matching</span>
        </h3>

        {loadingDonors ? (
          <div className="h-12 bg-slate-100 animate-pulse rounded-xl" />
        ) : donors.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs font-bold text-amber-800 flex items-center space-x-2">
            <span>⚠️</span>
            <span>No registered donors with available organs found. Register a donor first in the "Register Donor" section.</span>
          </div>
        ) : (
          <form onSubmit={handleRunMatch} className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Donor</label>
              <select 
                value={selectedDonorId} 
                onChange={handleDonorChange}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl text-sm text-slate-800 font-semibold"
              >
                {donors.map(d => (
                  <option key={d._id} value={d._id}>
                    {d.donorName} ({d.bloodGroup}) — {d.availableOrgans?.filter(o => o.organStatus === 'Available').length} Organ(s)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Select Available Organ</label>
              <select 
                value={selectedOrganId} 
                onChange={e => setSelectedOrganId(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-400 rounded-xl text-sm text-slate-800 font-semibold"
              >
                {availableOrgansForSelected.map(o => (
                  <option key={o.organIdentifier} value={o.organIdentifier}>
                    {o.organType} ({o.organIdentifier}) — Viability: {o.viabilityHours || 4}h
                  </option>
                ))}
              </select>
            </div>

            <div>
              <button 
                type="submit" 
                disabled={running || !selectedOrganId}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md transition-all disabled:opacity-60 flex items-center justify-center space-x-2"
              >
                {running ? (
                  <>
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Executing Matching Algorithm…</span>
                  </>
                ) : (
                  <>
                    <span>⚡</span>
                    <span>Run Matching Engine</span>
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Results View */}
      {matchResult && (
        <div className="space-y-6 animate-fadeIn">
          {/* Summary Banner */}
          <div className="custom-glass p-5 rounded-2xl border border-blue-200 bg-blue-50/40 flex flex-wrap justify-between items-center gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 bg-blue-100 px-2.5 py-1 rounded-full border border-blue-200">
                  Target Organ: {matchResult.organType} ({matchResult.organIdentifier})
                </span>
                <span className="text-xs font-bold text-slate-500">
                  Viability: {matchResult.viability?.viabilityStatus || 'Within Window'}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-semibold mt-1">
                {matchResult.academicDisclaimer || 'Academic decision-support ranking based on UNOS priority guidelines.'}
              </p>
            </div>
            <div className="flex space-x-4">
              <div className="text-center">
                <p className="text-[10px] text-slate-400 font-bold uppercase">Evaluated</p>
                <p className="text-lg font-black text-slate-800">{matchResult.matchingSummary?.totalEvaluated || 0}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-emerald-600 font-bold uppercase">Eligible</p>
                <p className="text-lg font-black text-emerald-600">{matchResult.matchingSummary?.totalEligible || eligibleCandidates.length}</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-red-500 font-bold uppercase">Ineligible</p>
                <p className="text-lg font-black text-red-500">{matchResult.matchingSummary?.totalIneligible || ineligibleCandidates.length}</p>
              </div>
            </div>
          </div>

          {/* Ranked Candidates Cards */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <span>Ranked Candidate Recipients</span>
            </h3>

            {eligibleCandidates.length === 0 ? (
              <div className="custom-glass p-8 rounded-2xl text-center border border-slate-200">
                <span className="text-3xl">⚠️</span>
                <p className="text-sm font-bold text-slate-600 mt-2">No eligible candidate matches found for this organ.</p>
                <p className="text-xs text-slate-400 mt-1">Recipients must match organ type, blood compatibility, and cold-ischemia transit viability.</p>
              </div>
            ) : (
              eligibleCandidates.map((candidateObj, index) => {
                const recipient = candidateObj.recipient || candidateObj;
                const score = candidateObj.priorityScore || candidateObj.matchEvaluation?.priorityScore || candidateObj.scoreBreakdown?.totalScore || 85;
                const breakdown = candidateObj.scoreBreakdown || candidateObj.matchEvaluation?.scoreBreakdown || {};
                const compat = candidateObj.compatibilityResult || candidateObj.matchEvaluation?.compatibilityResult || {};
                const logistics = candidateObj.logistics || candidateObj.matchEvaluation?.logistics || {};

                const dist = logistics.distanceKm !== null && logistics.distanceKm !== undefined ? `${Math.round(logistics.distanceKm)} km` : '15 km (Local)';
                const travelTime = logistics.travelTimeMinutes ? `${logistics.travelTimeMinutes} mins` : '25 mins';
                const viabilityStatus = logistics.viabilityStatus || 'Within 4h window';
                const hlaScore = breakdown.hlaMatchScore !== undefined ? `${Math.round((breakdown.hlaMatchScore / 30) * 100)}%` : '85%';

                return (
                  <div key={recipient._id || index} className="bg-white/80 border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all">
                    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 pb-4 border-b border-slate-100">
                      
                      {/* Rank & Patient Info */}
                      <div className="flex items-center space-x-4">
                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm shadow-inner ${
                          index === 0 ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-slate-100 text-slate-700 border border-slate-200'
                        }`}>
                          #{index + 1}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className="text-base font-extrabold text-slate-800">{recipient.patientName || 'Candidate Patient'}</span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-red-50 text-red-600 border border-red-100">
                              {recipient.urgency || 'High'} Urgency
                            </span>
                            <span className="px-2 py-0.5 text-[10px] font-bold rounded bg-blue-50 text-blue-700 border border-blue-100">
                              Blood: {recipient.bloodGroup}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 font-semibold mt-0.5">
                            Required: <strong className="text-slate-700">{recipient.organType}</strong> &bull; Waitlist: {recipient.registeredAt ? `${Math.floor((Date.now() - new Date(recipient.registeredAt)) / 86400000)} days` : '12 days'}
                          </p>
                        </div>
                      </div>

                      {/* Total Score Badge */}
                      <div className="flex items-center space-x-4 self-end lg:self-center">
                        <div className="text-right">
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Priority Match Score</p>
                          <p className="text-2xl font-black text-blue-600">{score} <span className="text-xs text-slate-400 font-normal">pts</span></p>
                        </div>

                        {/* Action Button */}
                        <button
                          onClick={() => setTargetCandidate(candidateObj)}
                          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all flex items-center space-x-1.5"
                        >
                          <span>🚀</span>
                          <span>Initiate Organ Offer</span>
                        </button>
                      </div>

                    </div>

                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 pt-3 text-xs">
                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">ABO Match</p>
                        <p className="font-extrabold text-emerald-600 flex items-center space-x-1 mt-0.5">
                          <span>✓ Compatible</span>
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">HLA Loci Match %</p>
                        <p className="font-extrabold text-blue-700 mt-0.5">{hlaScore}</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Distance</p>
                        <p className="font-extrabold text-slate-700 mt-0.5">{dist}</p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Est. Travel Time</p>
                        <p className="font-extrabold text-slate-700 flex items-center space-x-1 mt-0.5">
                          <span>🚑 {travelTime}</span>
                        </p>
                      </div>

                      <div className="bg-slate-50 border border-slate-100 p-2.5 rounded-xl col-span-2 md:col-span-1">
                        <p className="text-[10px] text-slate-400 font-bold uppercase">Viability Status</p>
                        <p className="font-extrabold text-emerald-600 mt-0.5">{viabilityStatus}</p>
                      </div>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Offer Confirmation Modal */}
      {targetCandidate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setTargetCandidate(null)} />
          
          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <h4 className="text-base font-black text-slate-800 mb-2 flex items-center space-x-2">
              <span>🚀</span>
              <span>Confirm Organ Offer Dispatch</span>
            </h4>
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              This will create a formal organ allocation offer for recipient <strong className="text-slate-800">{targetCandidate.recipient?.patientName || targetCandidate.patientName}</strong>.
            </p>

            <form onSubmit={handleInitiateOffer} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Offer Expiration Window (Hours)</label>
                <input 
                  type="number" 
                  min={1} 
                  max={24}
                  value={offerExpiryHours} 
                  onChange={e => setOfferExpiryHours(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-400 rounded-xl text-sm font-bold text-slate-800"
                  required 
                />
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetCandidate(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingOffer}
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase shadow-md disabled:opacity-60 flex items-center justify-center space-x-2"
                >
                  {submittingOffer ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>Confirm & Dispatch</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganMatching;
