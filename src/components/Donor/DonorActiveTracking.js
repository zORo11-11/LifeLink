import React, { useState, useEffect, useCallback } from 'react';
import { useSocket } from '../../context/SocketContext';
import { api } from '../../services/api';

const DonorActiveTracking = ({
  donor = {},
  donorRequests = [],
  fetchEmergencyRequests,
  showToast,
  setActiveTab
}) => {
  const socket = useSocket();
  const donorId = donor._id || donor.id;

  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [trackingData, setTrackingData] = useState(null);
  const [activeRequest, setActiveRequest] = useState(null);

  // Form states for manual updates
  const [etaInput, setEtaInput] = useState('15 mins');
  const [notesInput, setNotesInput] = useState('');

  // Fetch live tracking details from backend API
  const fetchActiveTracking = useCallback(async () => {
    if (!donorId) return;
    setLoading(true);
    try {
      const res = await api.get(`/api/donors/${donorId}/active-tracking`);
      if (res.success && res.data) {
        setTrackingData(res.data);
        if (res.data.activeRequest) {
          setActiveRequest(res.data.activeRequest);
        }
        if (res.data.estimatedArrival && res.data.estimatedArrival !== 'N/A') {
          setEtaInput(res.data.estimatedArrival);
        }
      } else {
        // Fallback: match from donorRequests prop
        const matchingReq = (donorRequests || []).find(r => 
          ['Accepted', 'In-Transit', 'Arrived', 'In_progress'].includes(r.status) ||
          r.acceptedByDonor === donorId || r.acceptedByDonor?._id === donorId
        );
        setActiveRequest(matchingReq || null);
      }
    } catch (err) {
      console.error('Error fetching active tracking info:', err);
      // Fallback matching
      const matchingReq = (donorRequests || []).find(r => 
        ['Accepted', 'In-Transit', 'Arrived', 'In_progress'].includes(r.status) ||
        r.acceptedByDonor === donorId || r.acceptedByDonor?._id === donorId
      );
      setActiveRequest(matchingReq || null);
    } finally {
      setLoading(false);
    }
  }, [donorId, donorRequests]);

  useEffect(() => {
    fetchActiveTracking();

    if (socket) {
      const handleLiveEvent = () => {
        fetchActiveTracking();
        if (fetchEmergencyRequests) fetchEmergencyRequests();
      };

      socket.on('donor_status_updated', handleLiveEvent);
      socket.on('request_updated', handleLiveEvent);

      return () => {
        socket.off('donor_status_updated', handleLiveEvent);
        socket.off('request_updated', handleLiveEvent);
      };
    }
  }, [fetchActiveTracking, fetchEmergencyRequests, socket]);

  // Determine current live tracking status
  const currentLiveStatus = trackingData?.liveStatus || activeRequest?.status || 'Pending';

  // Map status to progress step index (0 to 4)
  const getStepIndex = (statusStr) => {
    switch (statusStr) {
      case 'Broadcasted':
      case 'Broadcast Sent':
      case 'Pending':
        return 0;
      case 'Accepted':
        return 1;
      case 'In Transit':
      case 'In-Transit':
        return 2;
      case 'Reached':
      case 'Arrived':
        return 3;
      case 'Completed':
        return 4;
      default:
        return 1;
    }
  };

  const currentStepIdx = getStepIndex(currentLiveStatus);

  // Steps definition for visual progress tracker
  const trackingSteps = [
    { label: 'Requested', icon: '📢', desc: 'Emergency Request Created' },
    { label: 'Accepted', icon: '🤝', desc: 'Pledged by Donor' },
    { label: 'In Transit', icon: '🚗', desc: 'En-route to Hospital' },
    { label: 'Reached', icon: '🏥', desc: 'Arrived at Desk' },
    { label: 'Completed', icon: '🩸', desc: 'Donation Verified' }
  ];

  // Primary API handler to update live status
  const handleUpdateLiveStatus = async (nextStatus, customNotes) => {
    if (!donorId) {
      if (showToast) showToast('Donor session not found. Please log in again.', 'error');
      return;
    }

    setUpdating(true);
    try {
      const reqId = activeRequest?._id || activeRequest?.id || trackingData?.assignedRequestId;

      const payload = {
        status: nextStatus,
        currentLocationStatus: nextStatus === 'In Transit' ? 'En-route to target ward' :
                               nextStatus === 'Reached' ? 'Arrived at emergency desk' :
                               nextStatus === 'Completed' ? 'Donation finished' : 'Standing by',
        estimatedArrival: etaInput || '15 mins',
        assignedRequestId: reqId || null,
        notes: customNotes || notesInput || `Status advanced to ${nextStatus}`
      };

      const res = await api.patch(`/api/donors/${donorId}/live-status`, payload);

      if (!res.success) {
        throw new Error(res.message || 'Failed to update live status');
      }

      if (showToast) {
        showToast(`✅ Live Status updated to '${nextStatus}'!`, 'success');
      }

      setNotesInput('');
      fetchActiveTracking();
      if (fetchEmergencyRequests) fetchEmergencyRequests();

    } catch (err) {
      console.error('Error updating live status:', err);
      if (showToast) {
        showToast(err.message || 'Failed to update live status.', 'error');
      }
    } finally {
      setUpdating(false);
    }
  };

  if (loading && !activeRequest) {
    return (
      <div className="custom-glass rounded-3xl p-12 text-center border border-slate-200 shadow-sm animate-pulse">
        <div className="w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-sm font-extrabold text-slate-700">Loading live tracking information...</p>
      </div>
    );
  }

  const hospital = activeRequest?.hospitalId;
  const hospitalName = hospital?.name || activeRequest?.hospitalName || 'Emergency Medical Center';
  const hospitalAddress = hospital?.address || activeRequest?.hospitalAddress || 'City Central Ward';
  const hospitalPhone = hospital?.phone || activeRequest?.hospitalPhone || '+1 (800) 555-LIFE';

  return (
    <div className="space-y-8 animate-fadeIn">
      
      {/* Top Banner & Status Header */}
      <div className="custom-glass rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute -right-10 -top-10 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200/80 pb-6 mb-6">
          <div>
            <div className="flex items-center space-x-3 mb-1">
              <span className="text-2xl animate-bounce">📍</span>
              <h2 className="text-xl md:text-2xl font-black text-slate-900">
                Donor Active Request & Tracking
              </h2>
            </div>
            <p className="text-xs font-semibold text-slate-500">
              Real-time delivery & dispatch pipeline monitoring for emergency blood donation
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <span className={`px-4 py-2 rounded-2xl text-xs font-black tracking-wider uppercase flex items-center space-x-2 border shadow-sm ${
              currentLiveStatus === 'Completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
              currentLiveStatus === 'Reached' ? 'bg-amber-50 text-amber-700 border-amber-200' :
              currentLiveStatus === 'In Transit' || currentLiveStatus === 'In-Transit' ? 'bg-blue-50 text-blue-700 border-blue-200' :
              currentLiveStatus === 'Accepted' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
              'bg-slate-100 text-slate-600 border-slate-200'
            }`}>
              <span className="w-2.5 h-2.5 rounded-full bg-current animate-ping" />
              <span>Status: {currentLiveStatus}</span>
            </span>

            <button
              onClick={fetchActiveTracking}
              disabled={loading}
              className="p-2.5 bg-white border border-slate-200 text-slate-700 rounded-2xl hover:bg-slate-50 text-xs font-bold transition shadow-sm"
              title="Refresh tracking data"
            >
              🔄
            </button>
          </div>
        </div>

        {/* Real-Time Visual Step Tracker (Progress Bar) */}
        <div className="py-4">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">
            Live Progress Step Bar
          </h3>
          
          <div className="relative mb-8">
            {/* Background Track Line */}
            <div className="absolute top-1/2 left-[5%] right-[5%] -translate-y-1/2 h-2 bg-slate-200/80 rounded-full z-0" />
            
            {/* Active Progress Line */}
            <div
              className="absolute top-1/2 left-[5%] -translate-y-1/2 h-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-500 rounded-full z-0 transition-all duration-700 ease-in-out shadow-sm"
              style={{ width: `${(currentStepIdx / 4) * 90}%` }}
            />

            {/* Stepper Nodes */}
            <div className="relative z-10 flex justify-between items-center">
              {trackingSteps.map((step, idx) => {
                const isPassed = idx < currentStepIdx;
                const isCurrent = idx === currentStepIdx;

                return (
                  <div key={step.label} className="flex flex-col items-center group">
                    <div className={`w-11 h-11 md:w-13 md:h-13 rounded-2xl flex items-center justify-center font-black text-sm md:text-base transition-all duration-300 ${
                      isCurrent
                        ? 'bg-blue-600 text-white ring-8 ring-blue-500/20 shadow-lg scale-110'
                        : isPassed
                        ? 'bg-emerald-500 text-white shadow-md'
                        : 'bg-white text-slate-400 border-2 border-slate-200'
                    }`}>
                      {isPassed ? '✓' : step.icon}
                    </div>
                    <span className={`text-[10px] md:text-xs font-black mt-3 uppercase tracking-wide transition-colors ${
                      isCurrent ? 'text-blue-700' : isPassed ? 'text-emerald-700' : 'text-slate-400'
                    }`}>
                      {step.label}
                    </span>
                    <span className="text-[9px] font-semibold text-slate-400 hidden md:block">
                      {step.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Interactive Status Control Buttons Panel */}
        {activeRequest || trackingData?.assignedRequestId ? (
          <div className="bg-white/80 border border-slate-200/90 rounded-2xl p-5 md:p-6 mt-4 shadow-sm">
            <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mb-3 flex items-center">
              <span className="text-base mr-2">🎮</span> Donor Interactive Controls
            </h4>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {currentLiveStatus === 'Accepted' || currentLiveStatus === 'Pending' ? (
                <button
                  onClick={() => handleUpdateLiveStatus('In Transit')}
                  disabled={updating}
                  className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>🚗</span>
                  <span>Mark 'In Transit'</span>
                </button>
              ) : null}

              {currentLiveStatus === 'In Transit' || currentLiveStatus === 'In-Transit' ? (
                <button
                  onClick={() => handleUpdateLiveStatus('Reached')}
                  disabled={updating}
                  className="py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 animate-pulse"
                >
                  <span>🏥</span>
                  <span>Mark 'Reached'</span>
                </button>
              ) : null}

              {currentLiveStatus === 'Reached' || currentLiveStatus === 'Arrived' ? (
                <button
                  onClick={() => handleUpdateLiveStatus('Completed')}
                  disabled={updating}
                  className="py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2"
                >
                  <span>🩸</span>
                  <span>Complete Donation</span>
                </button>
              ) : null}

              {currentLiveStatus !== 'Completed' && currentLiveStatus !== 'Cancelled' ? (
                <button
                  onClick={() => {
                    if (window.confirm('Are you sure you want to cancel your pledge for this emergency request?')) {
                      handleUpdateLiveStatus('Cancelled', 'Donor cancelled active pledge');
                    }
                  }}
                  disabled={updating}
                  className="py-3 px-4 bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200 font-bold rounded-xl text-xs uppercase tracking-wide transition-all"
                >
                  <span>❌</span>
                  <span>Cancel Request</span>
                </button>
              ) : null}

              {currentLiveStatus === 'Completed' && (
                <div className="col-span-full py-3 px-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-bold text-center flex items-center justify-center space-x-2">
                  <span>🏆</span>
                  <span>Donation completed & logged! Thank you for saving lives today.</span>
                </div>
              )}
            </div>

            {/* Optional ETA & Notes Controls */}
            {currentLiveStatus !== 'Completed' && currentLiveStatus !== 'Cancelled' && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-100">
                <div>
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    Estimated Arrival (ETA)
                  </label>
                  <input
                    type="text"
                    value={etaInput}
                    onChange={(e) => setEtaInput(e.target.value)}
                    placeholder="e.g. 10 mins"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-extrabold text-slate-500 uppercase mb-1">
                    Tracking Note / Update
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={notesInput}
                      onChange={(e) => setNotesInput(e.target.value)}
                      placeholder="e.g. Crossing downtown traffic, arriving shortly"
                      className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                    />
                    <button
                      onClick={() => handleUpdateLiveStatus(currentLiveStatus, notesInput)}
                      disabled={updating || !notesInput.trim()}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs transition"
                    >
                      Post Note
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center mt-4">
            <span className="text-3xl mb-2 block">ℹ️</span>
            <h4 className="text-sm font-extrabold text-slate-800">No Active Donation Request Assigned</h4>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              You are not currently assigned to an in-progress request. Check out the Emergency Alerts tab to accept pending hospital broadcasts.
            </p>
            <button
              onClick={() => setActiveTab && setActiveTab('alerts')}
              className="mt-4 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold text-xs uppercase tracking-wide rounded-xl shadow"
            >
              Browse Emergency Alerts 🚨
            </button>
          </div>
        )}
      </div>

      {/* Information Cards Grid */}
      {activeRequest && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Card 1: Patient Details */}
          <div className="custom-glass rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-blue-600 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full">
                  Patient Info
                </span>
                <span className="text-xl">🩺</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-1">
                {activeRequest.patientName || 'Emergency Recipient'}
              </h4>
              <p className="text-xs font-bold text-slate-500 mb-3">
                Target Ward: <span className="text-slate-800">{activeRequest.targetWard || 'General Ward'}</span>
              </p>
              
              <div className="space-y-2 text-xs text-slate-600 bg-white/70 border border-slate-100 p-3 rounded-2xl">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Urgency Level:</span>
                  <span className="font-extrabold text-red-600">{activeRequest.urgencyLevel || 'Critical Priority'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Units Needed:</span>
                  <span className="font-extrabold text-slate-800">{activeRequest.requiredUnits || 1} Unit(s)</span>
                </div>
              </div>

              {activeRequest.medicalDetails && (
                <div className="mt-3 text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100">
                  <span className="font-bold text-slate-700 block mb-1">Medical Details:</span>
                  {activeRequest.medicalDetails}
                </div>
              )}
            </div>
          </div>

          {/* Card 2: Hospital & Destination Address */}
          <div className="custom-glass rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 border border-indigo-100 px-3 py-1 rounded-full">
                  Destination
                </span>
                <span className="text-xl">🏥</span>
              </div>
              <h4 className="text-lg font-black text-slate-900 mb-1">
                {hospitalName}
              </h4>
              <p className="text-xs text-slate-600 mb-4 font-semibold flex items-start">
                <span className="mr-1 mt-0.5">📍</span>
                <span>{hospitalAddress}</span>
              </p>

              <div className="bg-white/70 border border-slate-100 p-3 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Emergency Phone:</span>
                  <a href={`tel:${hospitalPhone}`} className="font-black text-indigo-600 hover:underline">
                    {hospitalPhone}
                  </a>
                </div>
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-slate-400">Dispatch Code:</span>
                  <span className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded">
                    {activeRequest.verificationCode || 'VERIFIED'}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <a
                href={`https://maps.google.com/?q=${encodeURIComponent(hospitalName + ' ' + hospitalAddress)}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-extrabold text-xs rounded-xl flex items-center justify-center space-x-2 border border-indigo-200 transition"
              >
                <span>🗺️</span>
                <span>Open Navigation in Google Maps</span>
              </a>
            </div>
          </div>

          {/* Card 3: Urgent Blood Group & ETA */}
          <div className="custom-glass rounded-3xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-center mb-4">
                <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 border border-red-100 px-3 py-1 rounded-full">
                  Urgent Blood Needed
                </span>
                <span className="text-xl">🩸</span>
              </div>
              
              <div className="flex items-center space-x-4 mb-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-700 text-white font-black text-2xl flex items-center justify-center shadow-lg shadow-red-500/20">
                  {activeRequest.bloodType || donor.bloodGroup || 'O+'}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">Target Type</span>
                  <span className="text-base font-extrabold text-slate-900">
                    Group {activeRequest.bloodType || donor.bloodGroup || 'O+'}
                  </span>
                </div>
              </div>

              <div className="bg-white/70 border border-slate-100 p-3 rounded-2xl space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Current ETA:</span>
                  <span className="font-extrabold text-blue-600">{etaInput || '15 mins'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-400">Location Status:</span>
                  <span className="font-bold text-slate-800">{trackingData?.currentLocationStatus || 'En-route'}</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Tracking Audit Logs Timeline Card */}
      {trackingData?.trackingLogs && trackingData.trackingLogs.length > 0 && (
        <div className="custom-glass rounded-3xl p-6 md:p-8 shadow-sm border border-slate-200">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider mb-4 flex items-center">
            <span className="text-base mr-2">📜</span> Tracking Audit Log History
          </h3>

          <div className="space-y-3">
            {trackingData.trackingLogs.map((log, index) => (
              <div key={index} className="bg-white/80 border border-slate-100 p-3.5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                  <div>
                    <span className="text-xs font-extrabold text-slate-800 uppercase tracking-wide mr-2">
                      {log.status}
                    </span>
                    <span className="text-xs text-slate-500">{log.notes}</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  {log.timestamp ? new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default DonorActiveTracking;
