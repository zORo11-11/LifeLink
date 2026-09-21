import React from 'react';

const DonorBadges = ({ badges = [], donor = {} }) => {
  const defaultBadges = [
    { id: 'B1', name: 'First Responder', desc: 'Responded to an urgent broadcast', icon: '🚨', unlocked: (donor.totalDonations || 0) >= 1 },
    { id: 'B2', name: 'Life Saver', desc: 'Completed 1 successful donation', icon: '🩸', unlocked: (donor.totalDonations || 0) >= 1 },
    { id: 'B3', name: 'Community Pillar', desc: 'Maintained active availability for 30 days', icon: '⭐', unlocked: Boolean(donor.available) },
    { id: 'B4', name: 'Silver Donor', desc: 'Reached 5 total donations', icon: '🏆', unlocked: (donor.totalDonations || 0) >= 5 },
    { id: 'B5', name: 'Gold Guardian', desc: 'Reached 10 total donations', icon: '👑', unlocked: (donor.totalDonations || 0) >= 10 }
  ];

  const listToRender = badges.length > 0 ? badges : defaultBadges;

  return (
    <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200 space-y-6 animate-fadeIn">
      <div>
        <h2 className="text-lg font-black text-slate-900 flex items-center">
          <span className="mr-2">🏆</span> Donor Badges & Milestones
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          Earn recognition badges as you respond to emergency requests and save lives in your community.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {listToRender.map((badge, index) => {
          const badgeId = badge.id || badge._id || index;
          const isUnlocked = badge.unlocked;

          return (
            <div
              key={badgeId}
              className={`p-4 rounded-xl border transition-all flex items-start space-x-3 ${
                isUnlocked
                  ? 'bg-white/80 border-slate-200 shadow-sm'
                  : 'bg-slate-100/40 border-slate-200 opacity-60'
              }`}
            >
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-inner ${
                isUnlocked ? 'bg-amber-50 border border-amber-200' : 'bg-slate-200/50 grayscale'
              }`}>
                {badge.icon}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-extrabold text-slate-900">{badge.name}</h4>
                  <span className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded ${
                    isUnlocked ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-200 text-slate-500'
                  }`}>
                    {isUnlocked ? 'Unlocked' : 'Locked'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-snug">{badge.desc}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default DonorBadges;
