import React, { useState } from 'react';
import OrganWaitlist from './OrganWaitlist';
import OrganDonorForm from './OrganDonorForm';
import OrganMatching from './OrganMatching';
import OrganOffers from './OrganOffers';

const HospitalOrganAllocation = ({ showToast }) => {
  const [subTab, setSubTab] = useState('waitlist'); // 'waitlist' | 'donors' | 'matching' | 'offers'

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Sub-navigation bar */}
      <div className="flex overflow-x-auto gap-2 p-1.5 bg-white/60 backdrop-blur rounded-2xl border border-white shadow-sm scrollbar-none">
        {[
          { id: 'waitlist', name: 'Recipient Waitlist', icon: '🫀' },
          { id: 'donors',   name: 'Register Donor',     icon: '🏥' },
          { id: 'matching', name: 'Matching Engine',    icon: '⚙️' },
          { id: 'offers',   name: 'Offers & Lifecycle', icon: '📋' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSubTab(tab.id)}
            className={`px-5 py-3 rounded-xl text-xs font-extrabold tracking-wide transition-all flex items-center space-x-2 whitespace-nowrap ${
              subTab === tab.id
                ? 'bg-purple-600 text-white shadow-md shadow-purple-500/20'
                : 'text-slate-600 hover:text-purple-600 hover:bg-white/80'
            }`}
          >
            <span>{tab.icon}</span>
            <span>{tab.name}</span>
          </button>
        ))}
      </div>

      {/* Render selected sub-component */}
      {subTab === 'waitlist' && <OrganWaitlist showToast={showToast} />}
      {subTab === 'donors'   && <OrganDonorForm showToast={showToast} />}
      {subTab === 'matching' && <OrganMatching showToast={showToast} onOfferInitiated={() => setSubTab('offers')} />}
      {subTab === 'offers'   && <OrganOffers showToast={showToast} />}
    </div>
  );
};

export default HospitalOrganAllocation;
