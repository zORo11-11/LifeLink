import React from 'react';

const BroadcastModal = ({ isOpen, onClose, newRequest, setNewRequest, onSubmit }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Fixed backdrop click */}
      <div 
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      <div className="relative bg-white border border-slate-200 max-w-md w-full rounded-[2rem] shadow-2xl p-6 overflow-hidden animate-slideUp text-slate-800 z-10">
        <h3 className="text-lg font-black text-slate-955 mb-2 flex items-center space-x-1.5">
          <span>🚨</span>
          <span>New Emergency Blood Sourcing</span>
        </h3>
        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-5">
          Broadcast push notification to active nearby donors
        </p>

        <form onSubmit={onSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label>
            <input 
              type="text" 
              value={newRequest?.patient || ''}
              onChange={(e) => setNewRequest(prev => ({ ...prev, patient: e.target.value }))}
              placeholder="e.g. Liam Carter"
              required
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Target Ward / Room</label>
              <input 
                type="text" 
                value={newRequest?.ward || ''}
                onChange={(e) => setNewRequest(prev => ({ ...prev, ward: e.target.value }))}
                placeholder="e.g. ICU Bed 3"
                required
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Blood</label>
              <select 
                value={newRequest?.bloodType || 'O-'}
                onChange={(e) => setNewRequest(prev => ({ ...prev, bloodType: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700 font-bold"
              >
                {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map(t => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Required Units (Bags)</label>
              <input 
                type="number" 
                value={newRequest?.units || 1}
                min={1}
                max={10}
                onChange={(e) => setNewRequest(prev => ({ ...prev, units: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Urgency Level</label>
              <select 
                value={newRequest?.urgency || 'Critical'}
                onChange={(e) => setNewRequest(prev => ({ ...prev, urgency: e.target.value }))}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700 font-bold"
              >
                <option value="Critical">🚨 Critical Priority</option>
                <option value="Moderate">⚡ Moderate Priority</option>
                <option value="Standard">🟢 Standard Priority</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Emergency Medical Details</label>
            <textarea 
              value={newRequest?.notes || ''}
              onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Include surgical reasons or specific donor matching prerequisites..."
              rows={2}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 font-bold rounded-xl text-xs uppercase tracking-wide transition-all border border-slate-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-red-500/10"
            >
              ⚡ Send Broadcast
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BroadcastModal;
