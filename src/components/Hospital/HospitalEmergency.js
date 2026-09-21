import React from 'react';

const HospitalEmergency = ({
  activeRequests = [],
  setShowRequestModal,
  advanceRequestStep,
  onOpenCheckIn
}) => {
  // Filter out any requests with status === 'Completed' or step === 4
  const uncompletedRequests = (activeRequests || []).filter(
    req => req.status !== 'Completed' && req.step !== 4
  );

  const handleVerifyClick = (req) => {
    if (onOpenCheckIn) {
      onOpenCheckIn(req);
    } else if (advanceRequestStep) {
      advanceRequestStep(req._id || req.id);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Call to action & header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Emergency Blood Dispatch Hub</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Initiate instant broadcasts to nearby registered donors for patients in surgery or emergency wards.
          </p>
        </div>
        <button
          onClick={() => setShowRequestModal && setShowRequestModal(true)}
          className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2 text-xs uppercase tracking-wider"
        >
          <span>➕</span>
          <span>Send Emergency Blood Request</span>
        </button>
      </div>

      {/* Active Request Tracker */}
      <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
        <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 animate-ping" />
          Active Emergency Requests & Live Dispatch Pipelines
        </h3>

        {uncompletedRequests.length === 0 ? (
          <div className="text-center py-12 bg-white/40 border border-slate-100 rounded-2xl">
            <span className="text-3xl">🎉</span>
            <p className="text-sm font-bold text-slate-500 mt-2">All emergency requests completed and stabilized.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {uncompletedRequests.map((req, index) => {
              const reqId = req._id || req.id || index;
              const patientName = req.patientName || req.patient || 'Emergency Patient';
              const targetWard = req.targetWard || req.ward || 'ICU';
              const requiredUnits = req.requiredUnits || req.units || 1;
              const urgencyLevel = req.urgencyLevel || req.urgency || 'Critical';
              const medicalNotes = req.medicalDetails || req.notes || 'None';
              
              // Safe object parsing for accepted donor details
              const donorName = req.acceptedByDonor?.fullName || 
                                req.acceptedByDonor?.name || 
                                req.assignedDonor || 
                                req.donor || 
                                null;

              const currentStep = req.step !== undefined ? req.step : 0;

              return (
                <div key={reqId} className="bg-white/70 border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col space-y-4">
                  {/* Top row info */}
                  <div className="flex flex-wrap justify-between items-start gap-4 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm font-extrabold text-slate-800">{patientName}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                          urgencyLevel.includes('Critical') || urgencyLevel === 'Critical'
                            ? 'bg-red-50 text-red-600 border border-red-100' 
                            : 'bg-amber-50 text-amber-600 border border-amber-100'
                        }`}>
                          {urgencyLevel}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded">
                          {targetWard}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">
                        Notes: <span className="italic text-slate-700">{medicalNotes}</span>
                      </p>
                    </div>

                    <div className="text-right flex items-center space-x-4">
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Required Blood</p>
                        <p className="text-sm font-black text-red-600">{req.bloodType} &bull; {requiredUnits} Units</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Assigned Donor</p>
                        <p className={`text-xs font-bold px-2.5 py-1 rounded border ${
                          donorName ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}>
                          {donorName || 'Awaiting Donor...'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dynamically Render Accepted Donor Contact Details under Active Request View */}
                  {req.acceptedByDonor && (
                    <div className="bg-emerald-50/80 border border-emerald-200/80 p-4 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-emerald-600 text-white font-black flex items-center justify-center text-xs shadow-sm">
                          👤
                        </div>
                        <div>
                          <p className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center space-x-2">
                            <span>Accepted Donor Contact Details</span>
                            <span className="text-[9px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded border border-emerald-200">Active</span>
                          </p>
                          <div className="flex flex-wrap items-center gap-x-5 gap-y-1 mt-1 text-xs text-slate-700 font-semibold">
                            <span>
                              <strong className="text-slate-500 font-bold">Full Name:</strong>{' '}
                              <span className="text-slate-900 font-extrabold">{req.acceptedByDonor.fullName || req.acceptedByDonor.name || donorName || 'N/A'}</span>
                            </span>
                            <span>
                              <strong className="text-slate-500 font-bold">Phone Number:</strong>{' '}
                              <a href={`tel:${req.acceptedByDonor.phone}`} className="text-emerald-700 font-extrabold hover:underline">
                                {req.acceptedByDonor.phone || 'N/A'}
                              </a>
                            </span>
                            <span>
                              <strong className="text-slate-500 font-bold">Email:</strong>{' '}
                              <a href={`mailto:${req.acceptedByDonor.email}`} className="text-emerald-700 font-extrabold hover:underline">
                                {req.acceptedByDonor.email || 'N/A'}
                              </a>
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Tracker pipeline status line */}
                  <div className="pt-2">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                      
                      {/* Steps progress */}
                      <div className="flex flex-grow w-full justify-between items-center relative py-2">
                        {/* Connector line */}
                        <div className="absolute left-[3%] right-[3%] top-[40%] h-1 bg-slate-200 z-0 rounded-full" />
                        <div 
                          className="absolute left-[3%] top-[40%] h-1 bg-red-600 z-0 rounded-full transition-all duration-500" 
                          style={{ width: `${(currentStep / 4) * 94}%` }} 
                        />

                        {[
                          { label: 'Broadcast Sent', icon: '📢' },
                          { label: 'Donor Accepted', icon: '🤝' },
                          { label: 'In-Transit', icon: '🚑' },
                          { label: 'Arrived', icon: '🏥' },
                          { label: 'Completed', icon: '✓' }
                        ].map((stepItem, sIdx) => {
                          const isActive = sIdx <= currentStep;
                          const isCurrent = sIdx === currentStep;
                          return (
                            <div key={sIdx} className="flex flex-col items-center z-10">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all duration-300 ${
                                isCurrent ? 'bg-red-600 text-white scale-110 ring-4 ring-red-500/10 pulse-dot' :
                                isActive ? 'bg-red-50 text-red-600 border border-red-200' :
                                'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                <span>{stepItem.icon}</span>
                              </div>
                              <span className={`text-[9px] font-bold mt-1.5 transition-colors uppercase tracking-wide ${
                                isCurrent ? 'text-red-600 font-black' :
                                isActive ? 'text-slate-700' :
                                'text-slate-400'
                              }`}>
                                {stepItem.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Hospital Controller Area */}
                      <div className="whitespace-nowrap self-end sm:self-center">
                        {currentStep === 0 && (
                          <span className="px-3.5 py-2 bg-slate-100 text-slate-600 text-xs font-bold rounded-xl border border-slate-200 flex items-center space-x-1.5">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                            <span>Awaiting Donor Acceptance</span>
                          </span>
                        )}

                        {currentStep === 1 && (
                          <span className="px-3.5 py-2 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl border border-blue-200 flex items-center space-x-1.5">
                            <span>🤝</span>
                            <span>Donor Accepted — Waiting for Transit</span>
                          </span>
                        )}

                        {currentStep === 2 && (
                          <span className="px-3.5 py-2 bg-blue-100 text-blue-800 text-xs font-bold rounded-xl border border-blue-300 flex items-center space-x-1.5 animate-pulse">
                            <span>🚑</span>
                            <span>Donor In-Transit</span>
                          </span>
                        )}

                        {currentStep === 3 && (
                          <button
                            onClick={() => handleVerifyClick(req)}
                            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-extrabold rounded-xl transition-all flex items-center space-x-1.5 shadow-md uppercase tracking-wider"
                          >
                            <span>✓</span>
                            <span>Verify & Complete Donation</span>
                          </button>
                        )}
                      </div>

                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HospitalEmergency;
