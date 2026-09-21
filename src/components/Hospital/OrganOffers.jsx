import React, { useState, useEffect, useCallback } from 'react';
import { api } from '../../services/api';
import { useSocket } from '../../context/SocketContext';

const statusBadge = {
  Offered:   'bg-blue-50 text-blue-700 border-blue-200',
  Accepted:  'bg-emerald-50 text-emerald-700 border-emerald-200',
  Declined:  'bg-red-50 text-red-600 border-red-200',
  Expired:   'bg-slate-100 text-slate-500 border-slate-200',
  Allocated: 'bg-purple-50 text-purple-700 border-purple-200',
};

// ── Live Countdown Timer Component ─────────────────────────────────────────────
const CountdownTimer = ({ expiryDate, status }) => {
  const [timeLeft, setTimeLeft] = useState('');
  const [isExpired, setIsExpired] = useState(false);

  useEffect(() => {
    if (!expiryDate || status !== 'Offered') {
      setTimeLeft('—');
      return;
    }

    const calculate = () => {
      const diff = new Date(expiryDate).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft('Expired');
        setIsExpired(true);
        return;
      }
      const hours   = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      const pad = (n) => String(n).padStart(2, '0');
      setTimeLeft(`${pad(hours)}:${pad(minutes)}:${pad(seconds)}`);
    };

    calculate();
    const interval = setInterval(calculate, 1000);
    return () => clearInterval(interval);
  }, [expiryDate, status]);

  if (status !== 'Offered') return null;

  return (
    <div className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 ${
      isExpired ? 'bg-red-50 text-red-600 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200 animate-pulse'
    }`}>
      <span>⏱</span>
      <span>{timeLeft}</span>
    </div>
  );
};

const SkeletonRow = () => (
  <div className="animate-pulse bg-white/60 border border-slate-100 rounded-2xl p-5 space-y-3">
    <div className="h-4 bg-slate-200 rounded w-1/3" />
    <div className="h-3 bg-slate-200 rounded w-1/2" />
  </div>
);

const OrganOffers = ({ showToast }) => {
  const socket = useSocket();

  const [activeTab, setActiveTab]         = useState('incoming'); // 'incoming' | 'outgoing'
  const [incomingOffers, setIncomingOffers] = useState([]);
  const [outgoingOffers, setOutgoingOffers] = useState([]);
  const [loading, setLoading]             = useState(true);

  // Response Modal State
  const [targetOffer, setTargetOffer]     = useState(null); // offer object
  const [actionType, setActionType]       = useState('');   // 'accept' | 'decline'
  const [declineReason, setDeclineReason] = useState('');
  const [submitting, setSubmitting]       = useState(false);

  // ── Fetch Offers ─────────────────────────────────────────────────────────────
  const fetchOffers = useCallback(async () => {
    setLoading(true);
    try {
      const [incRes, outRes] = await Promise.all([
        api.get('/api/organ/offers/incoming'),
        api.get('/api/organ/offers/outgoing')
      ]);

      if (incRes && incRes.success) setIncomingOffers(incRes.data || []);
      if (outRes && outRes.success) setOutgoingOffers(outRes.data || []);
    } catch {
      showToast('Error fetching organ offers', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  // ── Real-time Socket.IO Listeners ─────────────────────────────────────────────
  useEffect(() => {
    if (!socket) return;

    const handleOfferEvent = (data) => {
      console.log('⚡ Socket event received in OrganOffers:', data);
      showToast('🔔 Real-time organ offer update received!', 'info');
      fetchOffers();
    };

    socket.on('organ_offer_received', handleOfferEvent);
    socket.on('organ_offer_updated', handleOfferEvent);

    return () => {
      socket.off('organ_offer_received', handleOfferEvent);
      socket.off('organ_offer_updated', handleOfferEvent);
    };
  }, [socket, fetchOffers, showToast]);

  // ── Handle Accept / Decline Response ─────────────────────────────────────────
  const handleRespondOffer = async (e) => {
    e.preventDefault();
    if (!targetOffer || !actionType) return;

    setSubmitting(true);
    try {
      const allocationId = targetOffer._id || targetOffer.id;
      const endpoint = `/api/organ/offers/${allocationId}/respond`;
      
      const payload = {
        action: actionType,
        reason: actionType === 'decline' ? declineReason : 'Accepted by receiving hospital.',
      };

      const res = await api.post(endpoint, payload);
      if (res.success) {
        showToast(
          actionType === 'accept'
            ? '✓ Organ Offer Accepted! Status set to Allocated.'
            : 'Organ Offer Declined. Organ released.',
          actionType === 'accept' ? 'success' : 'info'
        );
        setTargetOffer(null);
        setDeclineReason('');
        fetchOffers();
      } else {
        showToast(res.message || 'Failed to process offer response', 'error');
      }
    } catch {
      showToast('Network error responding to offer', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const displayedOffers = activeTab === 'incoming' ? incomingOffers : outgoingOffers;

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
        <div>
          <h2 className="text-lg font-extrabold text-slate-900 flex items-center space-x-2">
            <span>📋</span><span>Organ Offers & Lifecycle Management</span>
          </h2>
          <p className="text-xs text-slate-500 font-semibold mt-1">
            Monitor real-time incoming organ offers and manage response lifecycles with automated expiration timers.
          </p>
        </div>

        {/* Tab Selector */}
        <div className="flex bg-slate-200/60 p-1 rounded-xl border border-slate-300/40">
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'incoming' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📥</span>
            <span>Incoming Offers ({incomingOffers.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
              activeTab === 'outgoing' ? 'bg-blue-600 text-white shadow' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>📤</span>
            <span>Outgoing Offers ({outgoingOffers.length})</span>
          </button>
        </div>
      </div>

      {/* Offers Feed */}
      <div className="custom-glass rounded-2xl p-6 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-5">
          <h3 className="text-sm font-bold text-slate-800 flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <span>{activeTab === 'incoming' ? 'Incoming Organ Offers' : 'Outgoing Organ Offers'}</span>
          </h3>
          <button onClick={fetchOffers} className="text-xs text-slate-400 hover:text-blue-600 font-bold transition-colors">
            ↻ Refresh
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => <SkeletonRow key={i} />)}
          </div>
        ) : displayedOffers.length === 0 ? (
          <div className="text-center py-14 bg-white/40 border border-slate-100 rounded-2xl">
            <span className="text-3xl">📭</span>
            <p className="text-sm font-bold text-slate-500 mt-2">No {activeTab} organ offers active right now.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayedOffers.map((offer, idx) => {
              const offerId = offer._id || offer.id || idx;
              const organType = offer.organType || offer.donorId?.organType || 'Organ';
              const organIdentifier = offer.organIdentifier || 'ORG-001';
              
              const donorName = offer.donorId?.donorName || 'Registered Donor';
              const recipientName = offer.recipientId?.patientName || 'Candidate Recipient';
              const offeringHospital = offer.offeringHospitalId?.name || 'Partner Procurement Hospital';
              const receivingHospital = offer.receivingHospitalId?.name || 'Target Hospital';

              return (
                <div key={offerId} className="bg-white/80 border border-slate-200 p-5 rounded-2xl shadow-sm hover:shadow-md transition-all flex flex-col space-y-4">
                  
                  {/* Top Bar */}
                  <div className="flex flex-wrap justify-between items-start gap-4 pb-3 border-b border-slate-100">
                    <div>
                      <div className="flex items-center space-x-2.5">
                        <span className="text-sm font-extrabold text-slate-800">
                          {organType} ({organIdentifier})
                        </span>
                        <span className={`px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusBadge[offer.status] || 'bg-slate-50 text-slate-600'}`}>
                          {offer.status}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-semibold mt-1">
                        Donor: <strong className="text-slate-700">{donorName}</strong> &bull; Patient: <strong className="text-slate-700">{recipientName}</strong>
                      </p>
                    </div>

                    <div className="flex items-center space-x-3 self-end sm:self-center">
                      <CountdownTimer expiryDate={offer.offerExpiry} status={offer.status} />

                      {/* Action buttons for Incoming active offers */}
                      {activeTab === 'incoming' && offer.status === 'Offered' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => { setTargetOffer(offer); setActionType('accept'); }}
                            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all"
                          >
                            Accept Offer
                          </button>
                          <button
                            onClick={() => { setTargetOffer(offer); setActionType('decline'); }}
                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider shadow-md transition-all"
                          >
                            Decline Offer
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Offering Hospital</p>
                      <p className="font-bold text-slate-700 mt-0.5">{offeringHospital}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Receiving Hospital</p>
                      <p className="font-bold text-slate-700 mt-0.5">{receivingHospital}</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Priority Score</p>
                      <p className="font-extrabold text-blue-600 mt-0.5">{offer.priorityScore || 85} pts</p>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                      <p className="text-[10px] text-slate-400 font-bold uppercase">Offered Date</p>
                      <p className="font-bold text-slate-700 mt-0.5">
                        {offer.createdAt ? new Date(offer.createdAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' }) : 'Just now'}
                      </p>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Response Confirmation Modal */}
      {targetOffer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setTargetOffer(null)} />

          <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full border border-slate-200">
            <h4 className="text-base font-black text-slate-800 mb-2 flex items-center space-x-2">
              <span>{actionType === 'accept' ? '✅' : '❌'}</span>
              <span>{actionType === 'accept' ? 'Accept Organ Offer' : 'Decline Organ Offer'}</span>
            </h4>
            
            <p className="text-xs text-slate-500 mb-4 font-semibold">
              {actionType === 'accept'
                ? `Confirm acceptance of ${targetOffer.organType} (${targetOffer.organIdentifier}) for recipient ${targetOffer.recipientId?.patientName || 'Candidate'}.`
                : `Are you sure you want to decline this organ offer? The organ will be released back to the donor pool.`}
            </p>

            <form onSubmit={handleRespondOffer} className="space-y-4">
              {actionType === 'decline' && (
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Reason for Decline</label>
                  <textarea
                    rows={3}
                    value={declineReason}
                    onChange={e => setDeclineReason(e.target.value)}
                    placeholder="Provide reason (e.g. Clinical incompatibility, patient unready)..."
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-400 rounded-xl text-xs text-slate-800"
                    required
                  />
                </div>
              )}

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => setTargetOffer(null)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-600 font-bold rounded-xl text-xs uppercase"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 py-3 text-white font-extrabold rounded-xl text-xs uppercase shadow-md disabled:opacity-60 flex items-center justify-center space-x-2 ${
                    actionType === 'accept' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {submitting ? (
                    <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <span>{actionType === 'accept' ? 'Confirm Accept' : 'Confirm Decline'}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganOffers;
