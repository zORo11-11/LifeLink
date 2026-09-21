import React from "react";

const DonorAlert = ({
  donor = {},
  donorRequests = [],
  eligibility = {},
  handleAcceptRequest,
  onAcceptRequest,
  handleAdvanceTransit,
  onAdvanceTransit,
  handleToggleAvailability
}) => {
  const acceptFn = handleAcceptRequest || onAcceptRequest;
  const userBloodType = donor?.bloodType || donor?.bloodGroup;

  // Filter requests: MUST NOT be accepted, in-transit, arrived, or completed (step === 0)
  const matchingRequests = (donorRequests || []).filter(r => {
    const isBroadcastStatus = (
      (r.status === 'Broadcasted' ||
       r.status === 'Broadcast Sent' ||
       r.status === 'Pending Response' ||
       r.status === 'Pending') &&
      r.status !== 'Accepted' &&
      r.status !== 'In-Transit' &&
      r.status !== 'Arrived' &&
      r.status !== 'Completed' &&
      (r.step === 0 || r.step === undefined)
    );

    const matchesBlood = !userBloodType || r.bloodType === userBloodType;

    return isBroadcastStatus && matchesBlood;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-lg font-black text-slate-900 flex items-center">
            <span className="mr-2">🚨</span> Active Emergency Broadcasts
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time emergency requests matching Blood Group <strong>{userBloodType || 'All'}</strong>
          </p>
        </div>
        <span className="text-xs font-extrabold text-slate-600 bg-slate-200/60 px-3 py-1 rounded-full">
          {matchingRequests.length} Available
        </span>
      </div>

      {!donor?.available ? (
        <div className="text-center py-8 bg-slate-100/50 border border-slate-200 rounded-2xl p-6">
          <span className="text-3xl">⏸️</span>
          <h4 className="text-sm font-bold text-slate-700 mt-2">Emergency Alerts Paused</h4>
          <p className="text-xs text-slate-500 mt-1 mb-4">
            You are currently set to Unavailable. Switch to Available to receive broadcast notifications.
          </p>
          <button
            onClick={handleToggleAvailability}
            className="px-5 py-2.5 bg-red-600 text-white font-bold text-xs rounded-xl shadow hover:bg-red-700 transition"
          >
            Set to Available
          </button>
        </div>
      ) : eligibility?.status === 'ineligible' ? (
        <div className="text-center py-8 bg-red-50/50 border border-red-100 rounded-2xl p-6">
          <span className="text-3xl">⏳</span>
          <h4 className="text-sm font-bold text-red-800 mt-2">Recovery Window Active</h4>
          <p className="text-xs text-slate-600 mt-1">
            Broadcast alerts are muted during your 90-day recovery period. Days remaining: <strong className="text-red-600">{eligibility.days || 0}</strong>
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {matchingRequests.length === 0 ? (
            <div className="text-center py-12 bg-white/40 border border-slate-200 rounded-2xl">
              <span className="text-3xl">🎉</span>
              <p className="text-sm font-bold text-slate-700 mt-2">No Active Broadcasts</p>
              <p className="text-xs text-slate-400 mt-1">
                There are no immediate critical needs for Group {userBloodType || 'your type'} in your area.
              </p>
            </div>
          ) : (
            matchingRequests.map((request, index) => {
              const reqId = request._id || request.id || index;
              const hospitalName = request.hospitalId?.name || request.hospitalName || request.hospital || 'Emergency Hospital';
              const hospitalAddress = request.hospitalId?.address || request.address;
              const hospitalPhone = request.hospitalId?.phone || request.phone;

              return (
                <div key={reqId} className="p-5 bg-white/80 border border-slate-200 rounded-2xl shadow-sm hover:shadow-md transition space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-[10px] font-black uppercase text-red-600 bg-red-50 border border-red-200 px-2.5 py-0.5 rounded-full">
                        {request.urgencyLevel || request.urgency || 'Critical'} Alert
                      </span>
                      <h4 className="text-base font-extrabold text-slate-900 mt-1.5">{hospitalName}</h4>
                      {hospitalAddress && (
                        <p className="text-xs text-slate-500 font-semibold">{hospitalAddress}</p>
                      )}
                      {hospitalPhone && (
                        <p className="text-xs text-blue-600 font-bold mt-0.5">📞 {hospitalPhone}</p>
                      )}
                    </div>
                    <span className="text-xs font-black text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                      {request.distance ? `${request.distance} km away` : 'Nearby'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {request.medicalDetails || request.notes || request.description || `Ward: ${request.targetWard || 'ICU'} | Units Required: ${request.requiredUnits || 1}`}
                  </p>

                  <div className="pt-2 flex items-center justify-between">
                    <span className="text-xs font-bold text-red-600">
                      Required Group: <strong>{request.bloodType}</strong>
                    </span>
                    <button
                      onClick={() => acceptFn && acceptFn(request._id || request.id)}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow transition"
                    >
                      🤝 Respond & Accept
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default DonorAlert;