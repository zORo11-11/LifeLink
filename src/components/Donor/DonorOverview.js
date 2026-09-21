import React from "react";

const DonorOverview = ({
  donor = {},
  donorRequests = [],
  eligibility = {},
  appointments = [],
  handleAcceptRequest,
  handleAdvanceTransit,
  handleCancelAppointment,
  handleToggleAvailability,
  setActiveTab
}) => {
  const userBloodType = donor?.bloodType || donor?.bloodGroup || 'N/A';

  // Requests that are pending broadcast (not yet accepted, step === 0)
  const pendingRequests = (donorRequests || []).filter(
    r => (r.status === 'Broadcasted' || r.status === 'Broadcast Sent' || r.status === 'Pending Response' || r.status === 'Pending') &&
         r.status !== 'Accepted' && r.status !== 'In-Transit' && r.status !== 'Arrived' && r.status !== 'Completed' && (r.step === 0 || r.step === undefined)
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
      <div className="lg:col-span-2 space-y-6">
        {/* Pending Broadcast Requests */}
        <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
              <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-ping" />
              Pending Broadcast Requests Matching Group {userBloodType}
            </h3>
            <button onClick={() => setActiveTab('alerts')} className="text-xs font-bold text-red-600 hover:underline">
              View All
            </button>
          </div>

          {!donor?.available ? (
            <div className="text-center py-8 bg-slate-100/50 border border-slate-200 rounded-xl">
              <span className="text-2xl">⏸️</span>
              <p className="text-xs font-bold text-slate-500 mt-2">Alerts are paused because you are marked Unavailable.</p>
              <button onClick={handleToggleAvailability} className="mt-3 px-4 py-2 bg-red-600 text-white font-bold text-xs rounded-xl shadow">
                Go Available
              </button>
            </div>
          ) : eligibility?.status === 'ineligible' ? (
            <div className="text-center py-8 bg-red-50/50 border border-red-100 rounded-xl">
              <span className="text-2xl">⏳</span>
              <p className="text-xs font-bold text-slate-500 mt-2">Emergency alerts paused during your 90-day recovery window.</p>
            </div>
          ) : pendingRequests.length === 0 ? (
            <div className="text-center py-8 bg-white/40 border border-slate-100 rounded-xl">
              <span className="text-2xl">🎉</span>
              <p className="text-xs font-bold text-slate-500 mt-2">No urgent requests matching your blood group in your area.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.slice(0, 2).map((req, index) => {
                const reqId = req._id || req.id || index;
                const hospitalName = req.hospitalId?.name || req.hospitalName || req.hospital || 'Hospital Emergency Room';
                return (
                  <div key={reqId} className="p-4 bg-white/70 border border-slate-200 rounded-xl flex flex-col space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          {req.urgencyLevel || req.urgency || 'Urgent'} Alert
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-1">
                          {hospitalName}
                        </h4>
                        {req.hospitalId?.address && (
                          <p className="text-[10px] text-slate-400 font-semibold">{req.hospitalId.address}</p>
                        )}
                      </div>
                      <span className="text-xs font-black text-slate-500">{req.distance ? `${req.distance} km away` : 'Nearby'}</span>
                    </div>
                    <p className="text-xs text-slate-500">{req.medicalDetails || req.notes || req.description || `Target Ward: ${req.targetWard || 'Emergency'}`}</p>
                    <button
                      onClick={() => handleAcceptRequest(req._id || req.id)}
                      className="py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl uppercase tracking-wide shadow transition"
                    >
                      🤝 Accept Request & Respond
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Active Cycle Tracker Block */}
        {(donorRequests || []).some(r => ['Accepted', 'In-Transit', 'Arrived'].includes(r.status)) && (
          <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200 mt-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 animate-ping" />
                My Active Donation Cycle Tracker
              </h3>
              <button onClick={() => setActiveTab && setActiveTab('tracking')} className="text-xs font-black text-blue-600 hover:underline flex items-center space-x-1">
                <span>Open Live Tracker</span>
                <span>📍</span>
              </button>
            </div>

            {(donorRequests || [])
              .filter(r => ['Accepted', 'In-Transit', 'Arrived'].includes(r.status))
              .map(req => (
                <div key={req._id || req.id} className="p-4 bg-white/70 border border-slate-200 rounded-xl space-y-4 mb-4 last:mb-0">
                  <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                    <div>
                      <p className="text-xs font-bold text-slate-800">
                        {req.hospitalId?.name || req.hospitalName || req.hospital || 'Emergency Hospital'}
                      </p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Case ID: {req._id || req.id}</p>
                    </div>
                    <span className="text-xs font-extrabold text-red-600">Group {req.bloodType}</span>
                  </div>

                  {/* Stepper Timeline */}
                  <div className="flex justify-between items-center relative py-2">
                    <div className="absolute left-[3%] right-[3%] top-[40%] h-0.5 bg-slate-200 z-0 rounded-full" />
                    <div 
                      className="absolute left-[3%] top-[40%] h-0.5 bg-blue-600 z-0 rounded-full transition-all" 
                      style={{ width: `${(((req.step || 1) - 1) / 3) * 94}%` }} 
                    />

                    {['Accepted', 'In-Transit', 'Arrived at Desk', 'Verified & Complete'].map((label, idx) => {
                      const currentStepIndex = (req.step || 1) - 1;
                      return (
                        <div key={idx} className="flex flex-col items-center z-10">
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                            idx === currentStepIndex 
                              ? 'bg-blue-600 text-white ring-4 ring-blue-500/10 pulse-dot' 
                              : idx < currentStepIndex 
                              ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                              : 'bg-slate-100 text-slate-400 border border-slate-200'
                          }`}>
                            {idx + 1}
                          </div>
                          <span className={`text-[8px] font-bold mt-1 uppercase ${idx === currentStepIndex ? 'text-blue-600' : 'text-slate-400'}`}>
                            {label}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Donor Transit Control Action Button */}
                  <div className="flex justify-between items-center pt-2">
                    <p className="text-[10px] text-slate-400 font-semibold italic">Please drive safely to the destination.</p>
                    {req.step === 1 && (
                      <button
                        onClick={() => handleAdvanceTransit(req._id || req.id)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow uppercase"
                      >
                        🚗 Start Transit
                      </button>
                    )}
                    {req.step === 2 && (
                      <button
                        onClick={() => handleAdvanceTransit(req._id || req.id)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow uppercase"
                      >
                        🏥 Reach Destination / Check-In
                      </button>
                    )}
                    {req.step === 3 && (
                      <span className="text-xs font-bold text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-lg">
                        ⏳ Waiting for Hospital Verification
                      </span>
                    )}
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Bookings Side Panel */}
      <div className="space-y-6">
        <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
          <h3 className="text-sm font-extrabold text-slate-900 mb-4">📅 My Scheduled Bookings</h3>
          <div className="space-y-3">
            {(appointments || []).map((apt, index) => {
              const aptId = apt._id || apt.id || index;
              return (
                <div key={aptId} className="p-3 bg-white/70 border border-slate-200 rounded-xl flex flex-col space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs font-extrabold text-slate-800">{apt.centerName || 'Donation Center'}</p>
                      <p className="text-[9px] text-slate-400 font-bold mt-0.5">{apt.date} at {apt.time}</p>
                    </div>
                    <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-1.5 py-0.5 rounded">
                      {apt.status || 'Scheduled'}
                    </span>
                  </div>
                  <button onClick={() => handleCancelAppointment && handleCancelAppointment(aptId)} className="text-[9px] font-bold text-red-500 hover:underline text-left">
                    Cancel Booking
                  </button>
                </div>
              );
            })}
            {(!appointments || appointments.length === 0) && (
              <p className="text-xs text-slate-400 text-center py-6">No scheduled appointments.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonorOverview;