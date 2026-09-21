import React from 'react';

const DonorProfile = ({ donor = {}, setDonor, handleSaveProfile }) => {
  return (
    <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200 max-w-2xl mx-auto animate-fadeIn">
      <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
        <span>👤</span>
        <span className="ml-2">My Donor Profile Settings</span>
      </h2>
      <p className="text-xs text-slate-500 font-semibold mb-6">
        Update your personal details, blood group, and last donated date to maintain accurate availability matching.
      </p>

      <form onSubmit={handleSaveProfile} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
            <input
              type="text"
              value={donor.name || donor.fullName || ''}
              onChange={(e) => setDonor && setDonor(prev => ({ ...prev, name: e.target.value, fullName: e.target.value }))}
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Email Address</label>
            <input
              type="email"
              value={donor.email || ''}
              disabled
              className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-sm cursor-not-allowed font-medium"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blood Group</label>
            <select
              value={donor.bloodType || donor.bloodGroup || 'O+'}
              onChange={(e) => setDonor && setDonor(prev => ({ ...prev, bloodType: e.target.value, bloodGroup: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
            >
              {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Last Donated Date</label>
            <input
              type="date"
              value={donor.lastDonated || ''}
              onChange={(e) => setDonor && setDonor(prev => ({ ...prev, lastDonated: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Number</label>
            <input
              type="text"
              value={donor.phone || ''}
              onChange={(e) => setDonor && setDonor(prev => ({ ...prev, phone: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zip Code / Location</label>
            <input
              type="text"
              value={donor.zipCode || donor.address || ''}
              onChange={(e) => setDonor && setDonor(prev => ({ ...prev, zipCode: e.target.value, address: e.target.value }))}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-800"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow transition"
        >
          Save Profile Settings
        </button>
      </form>
    </div>
  );
};

export default DonorProfile;
