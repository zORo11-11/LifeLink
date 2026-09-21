import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket, useJoinSocketRoom } from '../context/SocketContext';
import { api } from '../services/api';
import Footer from '../components/Footer';
import DonorAlert from '../components/Donor/DonorAlert';
import DonorOverview from '../components/Donor/DonorOverview';
import DonorBadges from '../components/Donor/DonorBadges';
import DonorCenters from '../components/Donor/DonorCenters';
import DonorProfile from '../components/Donor/DonorProfile';
import DonorActiveTracking from '../components/Donor/DonorActiveTracking';

const DonorDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout, updateUser } = useAuth();
  const socket = useSocket();

  // Ensure this client is in the correct Socket.IO room for targeted events
  useJoinSocketRoom(socket, authUser);

  const [donor, setDonor] = useState(authUser || {
    id: 'D-101',
    name: 'Sample Donor',
    bloodType: 'O+',
    bloodGroup: 'O+',
    available: true,
    totalDonations: 0,
    lastDonated: '',
    email: 'donor@lifelink.org',
    phone: '+1 555-0199'
  });

  useEffect(() => {
    if (authUser) setDonor(authUser);
  }, [authUser]);

  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00 AM');

  const [donorRequests, setDonorRequests] = useState([]);

  const [appointments, setAppointments] = useState(() => {
    const saved = localStorage.getItem('donor_appointments');
    return saved ? JSON.parse(saved) : [];
  });

  const [badges, setBadges] = useState([
    { id: 'B1', name: 'First Responder', desc: 'Responded to an urgent broadcast', icon: '🚨', unlocked: true },
    { id: 'B2', name: 'Life Saver', desc: 'Completed 1 successful donation', icon: '🩸', unlocked: true },
    { id: 'B3', name: 'Community Pillar', desc: 'Maintained active availability for 30 days', icon: '⭐', unlocked: true },
    { id: 'B4', name: 'Silver Donor', desc: 'Reached 5 total donations', icon: '🏆', unlocked: false }
  ]);

  // ── 1. REAL GEOLOCATION CAPTURE ─────────────────────────────────────────────
  useEffect(() => {
    const donorId = donor?._id || donor?.id;
    if (navigator.geolocation && donorId) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          console.log(`📍 Captured Real Geolocation: Lat ${latitude}, Lng ${longitude}`);
          const coords = [longitude, latitude];

          const updated = {
            ...donor,
            location: { type: 'Point', coordinates: coords }
          };
          setDonor(updated);

          try {
            await api.patch(`/api/donors/profile/${donorId}`, {
              location: { type: 'Point', coordinates: coords },
              coordinates: coords
            });
          } catch (err) {
            console.warn('Geolocation backend sync warning:', err);
          }
        },
        (error) => {
          console.warn('Geolocation capture warning/denied:', error.message);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 60000 }
      );
    }
  }, [donor?._id, donor?.id]);

  // ── 2. PERSISTENT APPOINTMENTS FETCHING (MongoDB with localStorage fallback) ──
  const fetchAppointments = useCallback(async () => {
    const donorId = donor?._id || donor?.id;
    if (!donorId) return;

    try {
      const res = await api.get(`/api/appointments/donor/${donorId}`);
      if (res && res.success && Array.isArray(res.data)) {
        const mapped = res.data.map(a => ({
          id: a._id || a.id,
          _id: a._id || a.id,
          centerName: a.centerName || a.hospitalName || 'Donation Center',
          hospitalName: a.hospitalName || a.centerName,
          date: a.appointmentDate,
          time: a.appointmentTime,
          status: a.status
        })).filter(a => a.status !== 'Cancelled');

        setAppointments(mapped);
        try {
          localStorage.setItem('donor_appointments', JSON.stringify(mapped));
        } catch (e) {
          /* offline cache fallback */
        }
      }
    } catch (err) {
      console.warn('Failed to fetch MongoDB appointments, falling back to localStorage:', err);
    }
  }, [donor?._id, donor?.id]);

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  // Fetch emergency requests dynamically
  const fetchEmergencyRequests = useCallback(async () => {
    try {
      const userBloodType = donor?.bloodType || donor?.bloodGroup;
      let endpoint = '/api/requests/donor-feed';
      if (userBloodType) {
        endpoint += `?bloodGroup=${encodeURIComponent(userBloodType)}`;
      }

      const data = await api.get(endpoint);

      if (data.success) {
        const activeOnly = (data.data || []).filter(r => r.status !== 'Completed' && r.step !== 4);
        setDonorRequests(activeOnly);
      }
    } catch (err) {
      console.error('Failed to load emergency requests:', err);
    }
  }, [donor?.bloodType, donor?.bloodGroup]);

  useEffect(() => {
    fetchEmergencyRequests();

    // Sockets: Listen for real-time broadcast creation and status updates instantly!
    if (socket) {
      const handleRequestChange = () => {
        fetchEmergencyRequests();
      };
      socket.on('request_created', handleRequestChange);
      socket.on('request_updated', handleRequestChange);

      return () => {
        socket.off('request_created', handleRequestChange);
        socket.off('request_updated', handleRequestChange);
      };
    } else {
      // Fallback light sync if sockets are disconnected
      const interval = setInterval(fetchEmergencyRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchEmergencyRequests, socket]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login/donor', { replace: true });
  };

  const handleToggleAvailability = async () => {
    const nextAvail = !donor.available;
    const updated = {
      ...donor,
      available: nextAvail,
      isAvailable: nextAvail
    };
    setDonor(updated);
    updateUser(updated);

    try {
      const donorId = donor._id || donor.id;
      if (donorId) {
        await api.patch(`/api/donors/profile/${donorId}`, { isAvailable: nextAvail });
      }
    } catch (e) {
      console.error('Error toggling availability on server:', e);
    }

    showToast(
      nextAvail 
        ? '📢 You are now marked as AVAILABLE. You will receive active emergency notifications.' 
        : '⏸️ You are now marked as UNAVAILABLE. Alerts have been paused.',
      nextAvail ? 'success' : 'info'
    );
  };

  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();
    updateUser(donor);

    try {
      const donorId = donor._id || donor.id;
      if (donorId) {
        await api.patch(`/api/donors/profile/${donorId}`, donor);
      }
      showToast('✓ Profile settings updated successfully.', 'success');
    } catch (err) {
      showToast('Profile updated locally.', 'info');
    }
  };

  const calculateEligibility = () => {
    if (!donor?.lastDonated) return { status: 'eligible', days: 0 };
    
    const lastDate = new Date(donor.lastDonated);
    const nextEligibleDate = new Date(lastDate.getTime() + 90 * 24 * 60 * 60 * 1000);
    const today = new Date();
    
    const diffTime = nextEligibleDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays <= 0) {
      return { status: 'eligible', days: 0 };
    } else {
      return { status: 'ineligible', days: diffDays };
    }
  };

  const eligibility = calculateEligibility();

  // Donor accepts a broadcasted request with Atomic Backend Lock
  const handleAcceptRequest = async (reqId) => {
    if (!donor.available) {
      showToast('Please toggle your availability active to accept emergency requests.', 'error');
      return;
    }
    if (eligibility.status === 'ineligible') {
      showToast('You are currently not eligible to donate. Wait for your recovery window to end.', 'error');
      return;
    }

    const targetReq = donorRequests.find(r => (r._id === reqId || r.id === reqId));

    try {
      const donorId = donor._id || donor.id;
      const data = await api.patch(`/api/requests/${reqId}/accept`, {
        donorId,
        status: 'Accepted',
        step: 1
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to accept request on server.');
      }

      // Also update donor live-status tracking record
      try {
        await api.patch(`/api/donors/${donorId}/live-status`, {
          status: 'Accepted',
          assignedRequestId: reqId,
          notes: 'Donor accepted emergency request pledge'
        });
      } catch (err) {
        console.warn('Live status sync warning:', err);
      }

      fetchEmergencyRequests();
      setActiveTab('tracking');
      const targetHospital = targetReq?.hospitalId?.name || targetReq?.hospitalName || targetReq?.hospital || 'the hospital';
      showToast(`🎯 Request accepted! Request moved to Active Tracking. Target: ${targetHospital}.`, 'success');

    } catch (error) {
      console.error('Error accepting request:', error);
      showToast(error.message || 'Server error while accepting request. Please try again.', 'error');
    }
  };

  // Donor handles transit step progression (Accepted -> In-Transit -> Arrived)
  const handleAdvanceTransit = async (reqId) => {
    const targetReq = donorRequests.find(r => (r._id === reqId || r.id === reqId));
    if (!targetReq) return;

    const currentStep = targetReq.step !== undefined ? targetReq.step : 1;
    let nextStep = currentStep;
    let nextStatus = targetReq.status;

    if (currentStep === 1) {
      nextStep = 2;
      nextStatus = 'In-Transit';
    } else if (currentStep === 2) {
      nextStep = 3;
      nextStatus = 'Arrived';
    } else {
      showToast('You have arrived at the facility. Please wait for hospital staff to verify and complete donation.', 'info');
      return;
    }

    try {
      const data = await api.patch(`/api/requests/status/${reqId}`, {
        donorId: donor._id || donor.id,
        step: nextStep,
        status: nextStatus
      });

      if (!data.success) {
        throw new Error(data.message || 'Failed to update transit status on server.');
      }

      showToast(`Transit status updated to ${nextStatus}!`, 'info');
      fetchEmergencyRequests();

    } catch (error) {
      console.error('Error advancing transit status:', error);
      showToast(error.message || 'Server error while updating status. Please try again.', 'error');
    }
  };

  const handleConfirmBooking = async (e) => {
    e.preventDefault();
    if (!bookingDate) {
      showToast('Select a booking date.', 'error');
      return;
    }

    const donorId = donor._id || donor.id;
    const centerTitle = selectedCenter?.name || 'Central Donation Center';

    const payload = {
      donorId,
      donorName: donor.fullName || donor.name || 'Donor',
      bloodGroup: donor.bloodGroup || donor.bloodType || 'O+',
      phone: donor.phone || '',
      centerName: centerTitle,
      hospitalName: centerTitle,
      appointmentDate: bookingDate,
      appointmentTime: bookingTime,
      coordinates: donor.location?.coordinates || [0, 0]
    };

    let createdApt = null;

    try {
      const res = await api.post('/api/appointments', payload);
      if (res && res.success) {
        const savedObj = res.appointment || res.data;
        createdApt = {
          id: savedObj._id || savedObj.id,
          _id: savedObj._id || savedObj.id,
          centerName: savedObj.centerName || centerTitle,
          hospitalName: savedObj.hospitalName || centerTitle,
          date: savedObj.appointmentDate,
          time: savedObj.appointmentTime,
          status: savedObj.status || 'Scheduled'
        };
      }
    } catch (err) {
      console.warn('Backend appointment booking failed, using offline fallback:', err);
    }

    if (!createdApt) {
      // Offline fallback
      createdApt = {
        id: `APT-${Math.floor(100 + Math.random() * 900)}`,
        centerName: centerTitle,
        date: bookingDate,
        time: bookingTime,
        status: 'Scheduled'
      };
    }

    const nextApts = [createdApt, ...appointments];
    setAppointments(nextApts);

    try {
      localStorage.setItem('donor_appointments', JSON.stringify(nextApts));
    } catch (err) {
      console.warn('Could not persist appointment to localStorage:', err);
    }

    setShowBookModal(false);
    showToast(`📅 Booking Confirmed at ${centerTitle} on ${bookingDate} at ${bookingTime}`, 'success');

    setBookingDate('');
    setBookingTime('09:00 AM');
  };

  const handleCancelAppointment = async (aptId) => {
    const nextApts = appointments.filter(a => (a.id !== aptId && a._id !== aptId));
    setAppointments(nextApts);

    try {
      localStorage.setItem('donor_appointments', JSON.stringify(nextApts));
    } catch (err) {
      console.warn('Could not persist appointment cancellation to localStorage:', err);
    }

    try {
      await api.patch(`/api/appointments/${aptId}/status`, { status: 'Cancelled' });
    } catch (err) {
      console.warn('Appointment status update on server warning:', err);
    }

    showToast('🗑️ Appointment cancelled successfully.', 'info');
  };

  return (
    <div className="lifelink-dashboard min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Ambient Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none network-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-400/10 rounded-full blur-3xl pointer-events-none network-pulse-glow" />

      <style>{`
        .custom-glass {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.85);
        }
        .pulse-heart {
          animation: beat 1.2s infinite;
        }
        @keyframes beat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.15); }
          40% { transform: scale(1.05); }
          60% { transform: scale(1.15); }
        }
        .pulse-dot {
          animation: scalePulse 1.8s infinite;
        }
        @keyframes scalePulse {
          0%, 100% { transform: scale(0.9); opacity: 0.8; }
          50% { transform: scale(1.2); opacity: 1; }
        }
        .network-pulse-glow {
          animation: networkPulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes networkPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.75; transform: scale(1.03); }
        }
        .switch-toggle {
          position: relative;
          display: inline-block;
          width: 50px;
          height: 26px;
        }
        .switch-toggle input {
          opacity: 0;
          width: 0;
          height: 0;
        }
        .slider-toggle {
          position: absolute;
          cursor: pointer;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: #cbd5e1;
          transition: .4s;
          border-radius: 34px;
        }
        .slider-toggle:before {
          position: absolute;
          content: "";
          height: 18px;
          width: 18px;
          left: 4px;
          bottom: 4px;
          background-color: white;
          transition: .4s;
          border-radius: 50%;
        }
        input:checked + .slider-toggle {
          background-color: #ef4444;
        }
        input:checked + .slider-toggle:before {
          transform: translateX(24px);
        }
      `}</style>

      {/* Toast Notification */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-slideIn">
          <div className={`px-5 py-4 rounded-2xl shadow-2xl border text-sm font-bold flex items-center space-x-3 bg-white/95 backdrop-blur border-slate-200 ${
            toast.type === 'error' ? 'text-red-600 border-red-200 bg-red-50' :
            toast.type === 'info' ? 'text-blue-600 border-blue-200 bg-blue-50' :
            'text-emerald-600 border-emerald-200 bg-emerald-50'
          }`}>
            <span className="text-lg">
              {toast.type === 'error' ? '⚠️' : toast.type === 'info' ? '📢' : '✓'}
            </span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="sticky top-4 z-40 px-4 md:px-8 max-w-7xl mx-auto w-full mt-4">
        <nav className="custom-glass shadow-md rounded-2xl">
          <div className="px-6 h-16 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-2xl pulse-heart">🩺</span>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                LifeLink Donor
              </span>
            </div>

            <div className="hidden lg:flex space-x-1 bg-slate-200/50 p-1 rounded-xl border border-white/60">
              {[
                { id: 'overview', name: 'Dashboard', icon: '📊' },
                { id: 'tracking', name: 'Live Tracking', icon: '📍' },
                { id: 'alerts', name: 'Emergency Alerts', icon: '🚨' },
                { id: 'centers', name: 'Donation Centers', icon: '🏥' },
                { id: 'badges', name: 'Badges', icon: '🏆' },
                { id: 'profile', name: 'Profile Settings', icon: '👤' }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 flex items-center space-x-1.5 ${
                    activeTab === tab.id 
                      ? 'bg-red-600 text-white shadow-md shadow-red-500/10' 
                      : 'text-slate-600 hover:text-red-600 hover:bg-white/60'
                  }`}
                >
                  <span>{tab.icon}</span>
                  <span>{tab.name}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800">{donor.name || donor.fullName || 'Donor'}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Group {donor.bloodType || donor.bloodGroup}</span>
              </div>
              <div className="w-8.5 h-8.5 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-black text-xs shadow-inner">
                {donor.bloodType || donor.bloodGroup}
              </div>
              <button 
                onClick={handleLogout}
                className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold rounded-xl text-xs transition-all shadow-sm"
              >
                Logout
              </button>
            </div>
          </div>
        </nav>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-grow relative z-10">
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-4 mb-6 scrollbar-none">
          {[
            { id: 'overview', name: 'Dashboard', icon: '📊' },
            { id: 'tracking', name: 'Live Tracking', icon: '📍' },
            { id: 'alerts', name: 'Alerts', icon: '🚨' },
            { id: 'centers', name: 'Centers', icon: '🏥' },
            { id: 'badges', name: 'Badges', icon: '🏆' },
            { id: 'profile', name: 'Profile', icon: '👤' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center space-x-1.5 transition-all ${
                activeTab === tab.id 
                  ? 'bg-red-600 text-white shadow-md' 
                  : 'bg-white/80 border border-slate-200 text-slate-600 hover:text-slate-800'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Status Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Availability Management</span>
              <span className="text-xl">📢</span>
            </div>
            <div className="flex justify-between items-center bg-white/70 border border-slate-200 rounded-2xl p-4 shadow-inner">
              <div>
                <p className="text-sm font-extrabold text-slate-800">Available to Donate</p>
                <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                  {donor.available ? 'Alerts active & visible' : 'Alerts paused (Muted)'}
                </p>
              </div>
              <label className="switch-toggle">
                <input 
                  type="checkbox" 
                  checked={Boolean(donor.available)} 
                  onChange={handleToggleAvailability}
                />
                <span className="slider-toggle"></span>
              </label>
            </div>
          </div>

          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100">Recovery Countdown</span>
              <span className="text-xl">⏳</span>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                {eligibility.status === 'eligible' ? (
                  <span className="text-3xl font-black text-emerald-600 animate-pulse">Eligible Now!</span>
                ) : (
                  <>
                    <span className="text-4xl font-black tracking-tight text-red-600">{eligibility.days}</span>
                    <span className="text-xs font-bold text-slate-400 uppercase">Days Recovery Left</span>
                  </>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-2.5 font-semibold">
                {eligibility.status === 'eligible' 
                  ? 'Ready to coordinate in case of emergency requirements.' 
                  : `Next donation allowed starting: ${donor.lastDonated ? new Date(new Date(donor.lastDonated).getTime() + 90*24*60*60*1000).toISOString().split('T')[0] : 'N/A'}.`}
              </p>
            </div>
          </div>

          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Impact Metrics</span>
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <span className="text-4xl font-black tracking-tight text-slate-800">
                {donor.totalDonations || 0} Donations
              </span>
              <p className="text-slate-500 text-xs mt-2.5 font-semibold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                Estimated <strong className="text-emerald-600 mx-1">{(donor.totalDonations || 0) * 3} Lives Impacted</strong> thus far!
              </p>
            </div>
          </div>
        </div>

        {/* Modular Tab Content Delegation */}
        {activeTab === 'overview' && (
          <DonorOverview 
            donor={donor}
            donorRequests={donorRequests}
            eligibility={eligibility}
            appointments={appointments}
            handleAcceptRequest={handleAcceptRequest}
            handleAdvanceTransit={handleAdvanceTransit}
            handleCancelAppointment={handleCancelAppointment}
            handleToggleAvailability={handleToggleAvailability}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'tracking' && (
          <DonorActiveTracking
            donor={donor}
            donorRequests={donorRequests}
            fetchEmergencyRequests={fetchEmergencyRequests}
            showToast={showToast}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'alerts' && (
          <DonorAlert 
            donor={donor}
            donorRequests={donorRequests}
            eligibility={eligibility}
            handleAcceptRequest={handleAcceptRequest}
            onAcceptRequest={handleAcceptRequest}
            handleAdvanceTransit={handleAdvanceTransit}
            onAdvanceTransit={handleAdvanceTransit}
            handleToggleAvailability={handleToggleAvailability}
          />
        )}

        {activeTab === 'centers' && (
          <DonorCenters 
            onSelectCenter={setSelectedCenter}
            setShowBookModal={setShowBookModal}
          />
        )}

        {activeTab === 'badges' && (
          <DonorBadges 
            badges={badges}
            donor={donor}
          />
        )}

        {activeTab === 'profile' && (
          <DonorProfile 
            donor={donor}
            setDonor={setDonor}
            handleSaveProfile={handleSaveProfile}
          />
        )}
      </main>

      <footer className="w-full bg-white/30 border-t border-slate-200/60 backdrop-blur">
        <Footer />
      </footer>

      {/* Booking Modal */}
      {showBookModal && selectedCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBookModal(false)} />
          <div className="relative bg-white border border-slate-200 max-w-md w-full rounded-[2rem] shadow-2xl p-6 text-slate-800">
            <h3 className="text-lg font-black mb-2">Schedule Donation Slot</h3>
            <p className="text-xs text-slate-400 font-bold uppercase mb-4">{selectedCenter.name}</p>
            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Date</label>
                <input 
                  type="date" 
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm"
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button type="button" onClick={() => setShowBookModal(false)} className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl text-xs uppercase">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-red-600 text-white font-extrabold rounded-xl text-xs uppercase shadow">
                  Confirm Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonorDashboard;