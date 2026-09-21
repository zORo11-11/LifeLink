import React from 'react';

const DonorCenters = ({ centers = [], onSelectCenter, setShowBookModal }) => {
  const defaultCenters = [
    { id: 'C1', name: 'St. Jude Blood Bank', address: '124 Medical Center Dr, Downtown', phone: '+1 555-0199', hours: '08:00 AM - 08:00 PM', distance: '2.4 km' },
    { id: 'C2', name: 'City Care Trauma Center', address: '789 Life Care Ave, Metro', phone: '+1 555-0244', hours: '24/7 Open', distance: '4.8 km' },
    { id: 'C3', name: 'Red Cross Regional Center', address: '455 Harmony Blvd, Westside', phone: '+1 555-0888', hours: '09:00 AM - 05:00 PM', distance: '7.1 km' }
  ];

  const centersToRender = centers.length > 0 ? centers : defaultCenters;

  const handleBook = (center) => {
    if (onSelectCenter) onSelectCenter(center);
    if (setShowBookModal) setShowBookModal(true);
  };

  return (
    <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center">
          <span className="mr-2">🏥</span> Nearby Blood Donation Centers
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Locate verified blood donation facilities near you and schedule routine donation slots.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {centersToRender.map((center, index) => {
          const centerId = center.id || center._id || index;

          return (
            <div key={centerId} className="bg-white/80 border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow transition flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <h3 className="text-base font-extrabold text-slate-900">{center.name}</h3>
                  <span className="text-xs font-black text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                    {center.distance}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1">{center.address}</p>
                <div className="mt-3 space-y-1 text-xs text-slate-600 font-semibold">
                  <p>📞 Phone: {center.phone}</p>
                  <p>🕒 Hours: {center.hours}</p>
                </div>
              </div>

              <button
                onClick={() => handleBook(center)}
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow transition"
              >
                📅 Schedule Appointment Slot
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonorCenters;
