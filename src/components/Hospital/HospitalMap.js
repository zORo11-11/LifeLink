import React from 'react';

const HospitalMap = ({
  donors = [],
  filteredDonors = [],
  mapRadius = 20,
  setMapRadius,
  mapBloodType = 'ALL',
  setMapBloodType,
  mapAvailability = 'ALL',
  setMapAvailability,
  selectedDonor = null,
  setSelectedDonor,
  dispatchDonorFromMap,
  setVerificationDonorId,
  setActiveTab
}) => {
  const isDonorAvailable = (donor) => {
    if (!donor) return false;
    // Rule B: Exclude if donor manually set status to Unavailable
    if (donor.isAvailable === false || donor.available === false) return false;

    // Rule A: Exclude if donor completed a donation within last 90 days
    const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    const dates = [donor.lastDonatedDate, donor.lastDonated, donor.lastDonation].filter(Boolean);
    for (const d of dates) {
      const dateVal = new Date(d);
      if (!isNaN(dateVal.getTime()) && dateVal >= ninetyDaysAgo) return false;
    }
    return true;
  };

  const rawList = filteredDonors && filteredDonors.length > 0 ? filteredDonors : (donors || []);
  const activeDonorsToRender = rawList.filter(isDonorAvailable);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Filters header bar */}
      <div className="bg-white/60 p-6 rounded-2xl border border-white flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900">Interactive Live Donor Map</h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Visualize nearby registered donors. Filter by radius, compatibility, and readiness. Dispatch couriers instantly.
          </p>
        </div>
        
        {/* Map Filters */}
        <div className="flex flex-wrap gap-2.5">
          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Radius (Distance)</label>
            <select 
              value={mapRadius} 
              onChange={(e) => setMapRadius && setMapRadius(Number(e.target.value))}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-1 focus:ring-red-500"
            >
              <option value={5}>5 km Radius</option>
              <option value={10}>10 km Radius</option>
              <option value={20}>20 km Radius</option>
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Blood Type</label>
            <select 
              value={mapBloodType} 
              onChange={(e) => setMapBloodType && setMapBloodType(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-1 focus:ring-red-500"
            >
              <option value="ALL">All Groups</option>
              {['O-', 'O+', 'A-', 'A+', 'B-', 'B+', 'AB-', 'AB+'].map(g => (
                <option key={g} value={g}>{g}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Availability</label>
            <select 
              value={mapAvailability} 
              onChange={(e) => setMapAvailability && setMapAvailability(e.target.value)}
              className="bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:ring-1 focus:ring-red-500"
            >
              <option value="ALL">All Status</option>
              <option value="Available">Available</option>
              <option value="In-Transit">In-Transit</option>
              <option value="Busy">Busy</option>
            </select>
          </div>
        </div>
      </div>

      {/* Map Canvas & Details Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map SVG Canvas */}
        <div className="lg:col-span-2 custom-glass border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col justify-between min-h-[450px] relative">
          
          <div className="w-full flex-grow relative bg-slate-50/70 rounded-xl border border-slate-200/60 overflow-hidden flex items-center justify-center p-4 min-h-[380px]">
            
            {/* SVG Distance Radar Rings */}
            <svg className="absolute w-full h-full inset-0 pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
              <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(239, 68, 68, 0.08)" strokeWidth="0.5" />
              <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59, 130, 246, 0.06)" strokeWidth="0.5" />
              
              <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0, 0, 0, 0.03)" strokeWidth="0.2" strokeDasharray="2,2" />
              <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0, 0, 0, 0.03)" strokeWidth="0.2" strokeDasharray="2,2" />
            </svg>

            {/* Scale Labels */}
            <div className="absolute top-[35%] left-[52%] text-[8px] font-bold text-slate-400 pointer-events-none">5 km</div>
            <div className="absolute top-[20%] left-[52%] text-[8px] font-bold text-slate-400 pointer-events-none">10 km</div>
            <div className="absolute top-[5%] left-[52%] text-[8px] font-bold text-slate-400 pointer-events-none">20 km</div>

            {/* Hospital Node in Center */}
            <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
              <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-md cursor-default">
                <span className="text-sm">🏥</span>
              </div>
              <span className="text-[9px] bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700 font-extrabold uppercase mt-1 whitespace-nowrap shadow-sm">ST. JUDE</span>
            </div>

            {/* Donor Pin Nodes */}
            {activeDonorsToRender.map((donor, index) => {
              const donorId = donor._id || donor.id || index;
              const leftPos = `${donor.lng || 50}%`;
              const topPos = `${donor.lat || 50}%`;
              const isSelected = selectedDonor && (selectedDonor._id === donor._id || selectedDonor.id === donor.id);
              const donorStatus = donor.status || 'Available';
              const statusColor = 
                donorStatus === 'Available' ? 'bg-emerald-500' :
                donorStatus === 'In-Transit' ? 'bg-blue-500 animate-pulse' : 'bg-red-500';

              return (
                <button
                  key={donorId}
                  onClick={() => setSelectedDonor && setSelectedDonor(donor)}
                  style={{ left: leftPos, top: topPos }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
                >
                  <div className="relative flex items-center justify-center">
                    {donorStatus === 'Available' && (
                      <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-500/20 animate-ping" />
                    )}
                    
                    <div className={`w-5.5 h-5.5 rounded-full ${statusColor} border-2 border-white flex items-center justify-center shadow-md transition-all duration-300 ${
                      isSelected ? 'scale-130 ring-2 ring-red-500 z-30' : 'group-hover:scale-115'
                    }`}>
                      <span className="text-[7.5px] font-black text-white uppercase">{donor.bloodType || donor.bloodGroup || 'O+'}</span>
                    </div>

                    <div className="absolute bottom-6 bg-slate-900 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {donor.fullName || donor.name || 'Donor'} ({donor.distance || 5} km)
                    </div>
                  </div>
                </button>
              );
            })}

            {activeDonorsToRender.length === 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-slate-400">
                <span className="text-2xl">🗺️</span>
                <p className="text-xs font-bold mt-1">No active donors match current filter settings.</p>
              </div>
            )}

          </div>

          <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2 font-bold px-2">
            <span>🗺️ St. Jude Center coordinates mapping</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-emerald-500 mr-1.5" /> Ready</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-500 mr-1.5" /> Dispatch/Transit</span>
              <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1.5" /> Busy/Resting</span>
            </div>
          </div>

        </div>

        {/* Selected Donor Side Panel */}
        <div className="custom-glass rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[400px]">
          {selectedDonor ? (
            <div className="space-y-6 animate-fadeIn">
              
              <div className="border-b border-slate-100 pb-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-md font-extrabold text-slate-950">{selectedDonor.fullName || selectedDonor.name || 'Donor Profile'}</h3>
                  <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-lg uppercase">
                    Type {selectedDonor.bloodType || selectedDonor.bloodGroup}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-1 font-bold">Donor ID: {selectedDonor._id || selectedDonor.id}</p>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Proximity Range:</span>
                  <strong className="text-slate-700">{selectedDonor.distance || 5} km away</strong>
                </div>
                
                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Availability Status:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    (selectedDonor.status || 'Available') === 'Available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                    (selectedDonor.status || '') === 'In-Transit' ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' :
                    'bg-red-50 text-red-600 border border-red-100'
                  }`}>
                    {selectedDonor.status || 'Available'}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Last Donation:</span>
                  <strong className="text-slate-700">{selectedDonor.lastDonated || 'N/A'}</strong>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Eligibility Check:</span>
                  <span className={`font-bold ${selectedDonor.eligible !== false ? 'text-emerald-600' : 'text-red-500'}`}>
                    {selectedDonor.eligible !== false ? '✓ Eligible for Donation' : '🗙 Ineligible (90-day timer)'}
                  </span>
                </div>

                <div className="flex justify-between text-xs">
                  <span className="text-slate-400 font-bold">Secure Contact:</span>
                  <strong className="text-slate-700">{selectedDonor.phone || 'N/A'}</strong>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-5 space-y-2">
                <button
                  onClick={() => dispatchDonorFromMap && dispatchDonorFromMap(selectedDonor)}
                  disabled={selectedDonor.eligible === false || (selectedDonor.status && selectedDonor.status !== 'Available')}
                  className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                    selectedDonor.eligible !== false && (selectedDonor.status === 'Available' || !selectedDonor.status)
                      ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/10'
                      : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  }`}
                >
                  ⚡ Dispatch Push Notification
                </button>
                <button
                  onClick={() => {
                    if (setVerificationDonorId) setVerificationDonorId(selectedDonor._id || selectedDonor.id);
                    if (setActiveTab) setActiveTab('verification');
                  }}
                  className="w-full py-3 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl uppercase tracking-wider transition-all"
                >
                  📋 Proceed to Check-In Verification
                </button>
              </div>

            </div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-grow text-center text-slate-500 py-12">
              <span className="text-4xl mb-3">📍</span>
              <p className="text-sm font-bold text-slate-600">Select a Donor pin on the map</p>
              <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                View detailed profile data, proximity metrics, and trigger direct notification requests.
              </p>
            </div>
          )}
          
          {selectedDonor && (
            <button
              onClick={() => setSelectedDonor && setSelectedDonor(null)}
              className="mt-4 text-[10px] font-bold text-slate-400 hover:underline hover:text-red-500"
            >
              Clear Selection
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default HospitalMap;
