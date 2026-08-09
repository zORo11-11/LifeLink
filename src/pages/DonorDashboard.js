import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const DonorDashboard = () => {
  const navigate = useNavigate();

  // Donor state (from localStorage or mock default)
  const [donor, setDonor] = useState({
    id: 'DN-001',
    name: 'Alex Rivera',
    email: 'alex.rivera@mail.com',
    bloodType: 'A+',
    lastDonated: '2026-06-15',
    totalDonations: 4,
    available: true,
    phone: '+1 (555) 123-4567',
    city: 'New York',
    zipCode: '10001'
  });

  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);
  const [showBookModal, setShowBookModal] = useState(false);
  const [selectedCenter, setSelectedCenter] = useState(null);

  // Booking Form State
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('09:00');

  // Interactive Active Alert/Broadcast states
  const [donorRequests, setDonorRequests] = useState([
    {
      id: 'REQ-102',
      hospitalName: 'St. Jude General Hospital',
      distance: 3.2,
      bloodType: 'A+',
      units: 2,
      urgency: 'Critical',
      patientInitials: 'E.V.',
      notes: 'Scheduled CABG bypass surgery bleeding stabilization.',
      status: 'Pending Response', // 'Pending Response', 'Accepted', 'In-Transit', 'Arrived', 'Completed'
      step: 0
    },
    {
      id: 'REQ-105',
      hospitalName: 'Grace Memorial Hospital',
      distance: 5.4,
      bloodType: 'A+',
      units: 1,
      urgency: 'Moderate',
      patientInitials: 'M.S.',
      notes: 'Sickle cell crisis crisis transfusion support.',
      status: 'Pending Response',
      step: 0
    }
  ]);

  // Nearest Center Locations
  const [centers, setCenters] = useState([
    { id: 'C-01', name: 'St. Jude General Hospital Center', distance: 3.2, address: '450 First Avenue, New York, NY', phone: '+1 (555) 019-2834', hours: '24/7 Collections' },
    { id: 'C-02', name: 'Grace Memorial Donor Hub', distance: 5.4, address: '88 Eighth Avenue, New York, NY', phone: '+1 (555) 014-9988', hours: '08:00 - 20:00' },
    { id: 'C-03', name: 'Metro Health Blood Depot', distance: 7.5, address: '120 E 23rd St, New York, NY', phone: '+1 (555) 012-4411', hours: '09:00 - 18:00' }
  ]);

  // Appointments State
  const [appointments, setAppointments] = useState([
    { id: 'APT-801', centerName: 'St. Jude General Hospital Center', date: '2026-08-15', time: '10:30 AM', status: 'Scheduled' }
  ]);

  // Badges lists
  const [badges, setBadges] = useState([
    { id: 'B1', name: 'First Drop', desc: 'Completed your first blood donation.', icon: '💧', unlocked: true },
    { id: 'B2', name: 'Life Saver', desc: 'Saved up to 9 lives with your donations.', icon: '❤️', unlocked: true },
    { id: 'B3', name: 'Ready & Willing', desc: 'Toggled availability active for 30 consecutive days.', icon: '🔋', unlocked: true },
    { id: 'B4', name: 'Golden Drop', desc: 'Complete 10 donations.', icon: '🏆', unlocked: false },
    { id: 'B5', name: 'On-Call Hero', desc: 'Respond to an emergency broadcast within 15 minutes.', icon: '⚡', unlocked: false },
    { id: 'B6', name: 'Rare Breed', desc: 'Register as an O-Negative emergency donor.', icon: '💎', unlocked: false }
  ]);

  useEffect(() => {
    // Load local storage states
    const storedDonor = localStorage.getItem('donor');
    const storedAppointments = localStorage.getItem('donor_appointments');
    const storedRequests = localStorage.getItem('donor_requests');

    if (storedDonor) {
      setDonor(JSON.parse(storedDonor));
    } else {
      localStorage.setItem('donor', JSON.stringify(donor));
    }

    if (storedAppointments) setAppointments(JSON.parse(storedAppointments));
    if (storedRequests) setDonorRequests(JSON.parse(storedRequests));
  }, []);

  const saveToLocalStorage = (updatedDonor, updatedApts, updatedReqs) => {
    if (updatedDonor) localStorage.setItem('donor', JSON.stringify(updatedDonor));
    if (updatedApts) localStorage.setItem('donor_appointments', JSON.stringify(updatedApts));
    if (updatedReqs) localStorage.setItem('donor_requests', JSON.stringify(updatedReqs));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('donor');
    navigate('/login/donor');
  };

  // Toggle Availability state
  const handleToggleAvailability = () => {
    const updated = {
      ...donor,
      available: !donor.available
    };
    setDonor(updated);
    saveToLocalStorage(updated, null, null);
    showToast(
      updated.available 
        ? '📢 You are now marked as AVAILABLE. You will receive active emergency notifications.' 
        : '⏸️ You are now marked as UNAVAILABLE. Alerts have been paused.',
      updated.available ? 'success' : 'info'
    );
  };

  // Profile Save
  const handleSaveProfile = (e) => {
    e.preventDefault();
    saveToLocalStorage(donor, null, null);
    showToast('✓ Profile settings updated successfully.', 'success');
  };

  // Calculate Eligibility Countdown
  const calculateEligibility = () => {
    if (!donor.lastDonated) return { status: 'eligible', days: 0 };
    
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

  // Accept Emergency Broadcast
  const handleAcceptRequest = (reqId) => {
    if (!donor.available) {
      showToast('Please toggle your availability active to accept emergency requests.', 'error');
      return;
    }
    if (eligibility.status === 'ineligible') {
      showToast('You are currently not eligible to donate. Wait for your recovery window to end.', 'error');
      return;
    }

    const nextReqs = donorRequests.map(r => {
      if (r.id === reqId) {
        return {
          ...r,
          status: 'Accepted',
          step: 1
        };
      }
      return r;
    });

    setDonorRequests(nextReqs);
    saveToLocalStorage(null, null, nextReqs);
    showToast(`🎯 Request accepted! Prepare to dispatch to ${donorRequests.find(r => r.id === reqId).hospitalName}.`, 'success');
  };

  // Advance transit step
  const handleAdvanceTransit = (reqId) => {
    const nextReqs = donorRequests.map(r => {
      if (r.id === reqId) {
        let nextStep = r.step + 1;
        let nextStatus = '';

        switch (nextStep) {
          case 1:
            nextStatus = 'Accepted';
            break;
          case 2:
            nextStatus = 'In-Transit';
            break;
          case 3:
            nextStatus = 'Arrived';
            break;
          case 4:
            nextStatus = 'Completed';
            break;
          default:
            nextStep = r.step;
            nextStatus = r.status;
        }

        if (nextStep === 4) {
          // Increment Donor Stats
          const nextDonations = donor.totalDonations + 1;
          const nextDonor = {
            ...donor,
            totalDonations: nextDonations,
            lastDonated: new Date().toISOString().split('T')[0]
          };
          setDonor(nextDonor);
          saveToLocalStorage(nextDonor, null, null);
          showToast(`❤️ Thank you! Donation cycle completed. You saved up to 3 lives!`, 'success');

          // Unlocking Badges dynamically
          if (nextDonations >= 5) {
            setBadges(prev => prev.map(b => b.id === 'B4' ? { ...b, unlocked: true } : b));
          }
        }

        return { ...r, step: nextStep, status: nextStatus };
      }
      return r;
    });

    const activeList = nextReqs.filter(r => r.step < 4);
    setDonorRequests(activeList);
    saveToLocalStorage(null, null, activeList);
  };

  // Book Appointment
  const handleOpenBookModal = (center) => {
    setSelectedCenter(center);
    setShowBookModal(true);
  };

  const handleConfirmBooking = (e) => {
    e.preventDefault();
    if (!bookingDate) {
      showToast('Select a booking date.', 'error');
      return;
    }

    const newApt = {
      id: `APT-${Math.floor(100 + Math.random() * 900)}`,
      centerName: selectedCenter.name,
      date: bookingDate,
      time: bookingTime,
      status: 'Scheduled'
    };

    const nextApts = [newApt, ...appointments];
    setAppointments(nextApts);
    saveToLocalStorage(null, nextApts, null);
    setShowBookModal(false);

    showToast(`📅 Booking Confirmed at ${selectedCenter.name} on ${bookingDate} at ${bookingTime}`, 'success');

    // Reset date/time
    setBookingDate('');
    setBookingTime('09:00');
  };

  const handleCancelAppointment = (aptId) => {
    const nextApts = appointments.filter(a => a.id !== aptId);
    setAppointments(nextApts);
    saveToLocalStorage(null, nextApts, null);
    showToast('🗑️ Appointment cancelled successfully.', 'info');
  };

  return (
    <div className="lifelink-dashboard min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Ambient Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none network-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-400/10 rounded-full blur-3xl pointer-events-none network-pulse-glow" />

      {/* Embedded CSS Styles */}
      <style>{`
        .custom-glass {
          background: rgba(255, 255, 255, 0.55);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.85);
        }
        .pulse-urgent {
          animation: pulseRed 2s infinite;
        }
        @keyframes pulseRed {
          0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
          70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
          100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
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
        /* Toggle Switch Custom */
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

      {/* Header & Navigation */}
      <header className="sticky top-4 z-40 px-4 md:px-8 max-w-7xl mx-auto w-full mt-4">
        <nav className="custom-glass shadow-md rounded-2xl">
          <div className="px-6 h-16 flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <span className="text-2xl pulse-heart">🩺</span>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                LifeLink Donor
              </span>
            </div>

            {/* Nav Tabs */}
            <div className="hidden lg:flex space-x-1 bg-slate-200/50 p-1 rounded-xl border border-white/60">
              {[
                { id: 'overview', name: 'Dashboard', icon: '📊' },
                { id: 'alerts', name: 'Emergency Alerts', icon: '🚨' },
                { id: 'centers', name: 'Find Centers', icon: '🏥' },
                { id: 'badges', name: 'Impact & Badges', icon: '🏆' },
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

            {/* Profile Info Badge */}
            <div className="flex items-center space-x-4">
              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800">{donor.name}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Group {donor.bloodType}</span>
              </div>
              <div className="w-8.5 h-8.5 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-black text-xs shadow-inner">
                {donor.bloodType}
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
        
        {/* Dynamic Mobile Nav Header */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-4 mb-6 scrollbar-none">
          {[
            { id: 'overview', name: 'Dashboard', icon: '📊' },
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
                  : 'bg-white/80 border border-slate-200 text-slate-600 hover:text-slate-855'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.name}</span>
            </button>
          ))}
        </div>

        {/* Overview Bar Cards / Key Status Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          
          {/* Status Indicator 1: Availability Toggle */}
          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-100 px-2.5 py-1 rounded-full border border-slate-200">Availability Management</span>
              <span className="text-xl">📢</span>
            </div>
            <div>
              <div className="flex justify-between items-center bg-white/70 border border-slate-200 rounded-2xl p-4 shadow-inner">
                <div>
                  <p className="text-sm font-extrabold text-slate-800">Available to Donate</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                    {donor.available ? 'Alerts active & visible' : 'Alerts paused (Muted)'}
                  </p>
                </div>
                
                {/* Switch Toggle */}
                <label className="switch-toggle">
                  <input 
                    type="checkbox" 
                    checked={donor.available} 
                    onChange={handleToggleAvailability}
                  />
                  <span className="slider-toggle"></span>
                </label>
              </div>
            </div>
          </div>

          {/* Status Indicator 2: Eligibility Countdown */}
          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100">Recovery Countdown</span>
              <span className="text-xl">⏳</span>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                {eligibility.status === 'eligible' ? (
                  <>
                    <span className="text-3xl font-black text-emerald-600 animate-pulse">Eligible Now!</span>
                  </>
                ) : (
                  <>
                    <span className="text-4xl font-black tracking-tight text-red-600">
                      {eligibility.days}
                    </span>
                    <span className="text-xs font-bold text-slate-400 uppercase">Days Recovery Left</span>
                  </>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-2.5 font-semibold">
                {eligibility.status === 'eligible' 
                  ? 'Ready to coordinate in case of emergency requirements.' 
                  : `Next donation allowed starting: ${new Date(new Date(donor.lastDonated).getTime() + 90*24*60*60*1000).toISOString().split('T')[0]}.`}
              </p>
            </div>
          </div>

          {/* Status Indicator 3: Donation Impact Stat */}
          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden border border-slate-200">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Impact Metrics</span>
              <span className="text-xl">🏆</span>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black tracking-tight text-slate-800">
                  {donor.totalDonations} Donations
                </span>
              </div>
              <p className="text-slate-500 text-xs mt-2.5 font-semibold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 mr-2 animate-pulse" />
                Estimated <strong className="text-emerald-600 mx-1">{donor.totalDonations * 3} Lives Impacted</strong> thus far!
              </p>
            </div>
          </div>

        </div>

        {/* TAB 1: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Quick Emergency Alerts Queue */}
            <div className="lg:col-span-2 space-y-6">
              
              <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-sm font-extrabold text-slate-900 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-red-500 mr-2 animate-ping" />
                    Pending Broadcast Requests Matching Blood Group {donor.bloodType}
                  </h3>
                  <button onClick={() => setActiveTab('alerts')} className="text-xs font-bold text-red-600 hover:underline">View All</button>
                </div>

                {!donor.available ? (
                  <div className="text-center py-8 bg-slate-100/50 border border-slate-200 rounded-xl">
                    <span className="text-2xl">⏸️</span>
                    <p className="text-xs font-bold text-slate-500 mt-2">Alerts are paused because you are marked Unavailable.</p>
                    <button 
                      onClick={handleToggleAvailability}
                      className="mt-3 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all"
                    >
                      Go Available
                    </button>
                  </div>
                ) : eligibility.status === 'ineligible' ? (
                  <div className="text-center py-8 bg-red-50/50 border border-red-100 rounded-xl">
                    <span className="text-2xl">⏳</span>
                    <p className="text-xs font-bold text-slate-500 mt-2">Emergency alerts paused during your 90-day post-donation recovery window.</p>
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Recovery ends in {eligibility.days} days.</p>
                  </div>
                ) : donorRequests.length === 0 ? (
                  <div className="text-center py-8 bg-white/40 border border-slate-100 rounded-xl">
                    <span className="text-2xl">🎉</span>
                    <p className="text-xs font-bold text-slate-500 mt-2">No urgent requests matching your blood group in your area.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {donorRequests.slice(0, 1).map(req => (
                      <div key={req.id} className="p-4 bg-white/70 border border-slate-200 rounded-xl flex flex-col space-y-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <span className="text-[10px] font-bold uppercase text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                              {req.urgency} Alert
                            </span>
                            <h4 className="text-sm font-extrabold text-slate-900 mt-1">{req.hospitalName}</h4>
                          </div>
                          <span className="text-xs font-black text-slate-500">{req.distance} km away</span>
                        </div>
                        <p className="text-xs text-slate-500">{req.notes}</p>
                        
                        <div className="flex space-x-2 pt-2 border-t border-slate-100">
                          <button
                            onClick={() => handleAcceptRequest(req.id)}
                            className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow transition-all uppercase tracking-wide"
                          >
                            🤝 Accept Request & Respond
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Active Cycle Tracker */}
              {donorRequests.some(r => r.status === 'Accepted' || r.status === 'In-Transit' || r.status === 'Arrived') && (
                <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
                  <h3 className="text-sm font-extrabold text-slate-900 mb-4 flex items-center">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-500 mr-2 animate-ping" />
                    My Active Donation Cycle Tracker
                  </h3>

                  {donorRequests.filter(r => r.status !== 'Pending Response').map(req => (
                    <div key={req.id} className="p-4 bg-white/70 border border-slate-200 rounded-xl space-y-4">
                      
                      <div className="flex justify-between items-center pb-2 border-b border-slate-100">
                        <div>
                          <p className="text-xs font-bold text-slate-800">{req.hospitalName}</p>
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Emergency Collection Case: {req.id}</p>
                        </div>
                        <span className="text-xs font-extrabold text-red-600">Group {req.bloodType}</span>
                      </div>

                      {/* Timeline pipeline */}
                      <div className="flex justify-between items-center relative py-2">
                        <div className="absolute left-[3%] right-[3%] top-[40%] h-0.5 bg-slate-200 z-0 rounded-full" />
                        <div className="absolute left-[3%] top-[40%] h-0.5 bg-blue-600 z-0 rounded-full transition-all" style={{ width: `${(req.step / 4) * 94}%` }} />

                        {[
                          { label: 'Broadcast', icon: '📢' },
                          { label: 'Accepted', icon: '🤝' },
                          { label: 'In-Transit', icon: '🚑' },
                          { label: 'Arrived', icon: '🏥' },
                          { label: 'Completed', icon: '✓' }
                        ].map((stepItem, idx) => {
                          const isDone = idx <= req.step;
                          const isNow = idx === req.step;
                          return (
                            <div key={idx} className="flex flex-col items-center z-10">
                              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                isNow ? 'bg-blue-600 text-white ring-4 ring-blue-500/10 pulse-dot' :
                                isDone ? 'bg-blue-50 text-blue-600 border border-blue-200' :
                                'bg-slate-100 text-slate-400 border border-slate-200'
                              }`}>
                                <span>{stepItem.icon}</span>
                              </div>
                              <span className={`text-[8px] font-bold mt-1 uppercase ${isNow ? 'text-blue-600' : 'text-slate-400'}`}>
                                {stepItem.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between items-center pt-2">
                        <p className="text-[10px] text-slate-400 font-semibold italic">Please drive safely. Check-in at the reception.</p>
                        <button
                          onClick={() => handleAdvanceTransit(req.id)}
                          className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-sm uppercase tracking-wider"
                        >
                          {req.step === 1 ? 'Start Driving' :
                           req.step === 2 ? 'Check In At Desk' :
                           'Mock Admin Done'}
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              )}

            </div>

            {/* Upcoming Appointments & Reminders sidebar */}
            <div className="space-y-6">
              
              <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-extrabold text-slate-900 mb-4">📅 My Scheduled Bookings</h3>
                
                <div className="space-y-3">
                  {appointments.map(apt => (
                    <div key={apt.id} className="p-3 bg-white/70 border border-slate-200 rounded-xl flex flex-col justify-between space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-xs font-extrabold text-slate-800">{apt.centerName}</p>
                          <p className="text-[9px] text-slate-400 font-bold mt-0.5">{apt.date} at {apt.time}</p>
                        </div>
                        <span className="text-[8px] bg-emerald-50 text-emerald-600 border border-emerald-100 font-bold px-1.5 py-0.5 rounded">
                          {apt.status}
                        </span>
                      </div>
                      
                      <button
                        onClick={() => handleCancelAppointment(apt.id)}
                        className="text-[9px] font-bold text-red-500 hover:underline text-left"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  ))}
                  {appointments.length === 0 && (
                    <p className="text-xs text-slate-400 text-center py-6">No scheduled appointments. Keep checking centers.</p>
                  )}
                </div>
                
                <button
                  onClick={() => setActiveTab('centers')}
                  className="w-full mt-4 py-2.5 bg-slate-50 border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl shadow-inner uppercase tracking-wider"
                >
                  📅 Book New Donation Slot
                </button>
              </div>

              {/* Quick Health Tip Card */}
              <div className="bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl p-5 shadow-md relative overflow-hidden">
                <div className="absolute right-[-20px] bottom-[-20px] text-7xl opacity-10 pointer-events-none">🩺</div>
                <h4 className="text-xs font-bold uppercase tracking-wider">Before You Donate</h4>
                <p className="text-[11px] text-red-50 mt-1 leading-relaxed">
                  Make sure you hydrate properly, consume a healthy iron-rich meal, get at least 8 hours of sleep, and carry your official photo ID.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* TAB 2: EMERGENCY ALERTS */}
        {activeTab === 'alerts' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-white/60 p-6 rounded-2xl border border-white">
              <h2 className="text-lg font-extrabold text-slate-900">Active Emergency Broadcast Center</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Real-time alerts broadcasted directly by local hospitals waiting for compatible O-Negative and matching donor acceptances.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {donorRequests.map(req => {
                const isAccepted = req.status !== 'Pending Response';
                
                return (
                  <div key={req.id} className="custom-glass rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col justify-between space-y-4">
                    
                    <div className="flex justify-between items-start">
                      <div>
                        <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                          req.urgency === 'Critical' ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-amber-50 text-amber-600 border-amber-100'
                        }`}>
                          {req.urgency} Urgency
                        </span>
                        <h4 className="text-sm font-extrabold text-slate-900 mt-2">{req.hospitalName}</h4>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-0.5">Case ID: {req.id}</p>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-red-600 bg-red-50 border border-red-100 px-2 py-0.5 rounded uppercase">
                          Group {req.bloodType}
                        </span>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{req.distance} km away</p>
                      </div>
                    </div>

                    <p className="text-xs text-slate-500 leading-relaxed font-semibold">
                      {req.notes}
                    </p>

                    <div className="border-t border-slate-100 pt-4 flex justify-between items-center">
                      <span className={`text-[10px] font-bold uppercase ${isAccepted ? 'text-blue-500 font-black' : 'text-amber-500'}`}>
                        {req.status}
                      </span>
                      
                      {!isAccepted ? (
                        <button
                          onClick={() => handleAcceptRequest(req.id)}
                          disabled={!donor.available || eligibility.status === 'ineligible'}
                          className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                            donor.available && eligibility.status === 'eligible'
                              ? 'bg-red-600 hover:bg-red-700 text-white shadow shadow-red-500/10'
                              : 'bg-slate-100 text-slate-450 border border-slate-250 cursor-not-allowed'
                          }`}
                        >
                          Accept Broadcast
                        </button>
                      ) : (
                        <button
                          onClick={() => handleAdvanceTransit(req.id)}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow uppercase tracking-wide"
                        >
                          {req.step === 1 ? 'Go In-Transit' : req.step === 2 ? 'At Check-In' : 'Completed'}
                        </button>
                      )}
                    </div>

                  </div>
                );
              })}
              {donorRequests.length === 0 && (
                <div className="md:col-span-2 text-center py-12 bg-white/40 border border-slate-100 rounded-2xl">
                  <span className="text-3xl">🎉</span>
                  <p className="text-sm font-bold text-slate-500 mt-2">All notifications responded to.</p>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 3: FIND CENTERS */}
        {activeTab === 'centers' && (
          <div className="space-y-6 animate-fadeIn">
            
            <div className="bg-white/60 p-6 rounded-2xl border border-white">
              <h2 className="text-lg font-extrabold text-slate-900">Find Registered Blood Donation Centers</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Browse hospitals and mobile hubs in your area. Check current operations, distances, and book appointment schedules.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Centers Directory */}
              <div className="lg:col-span-2 space-y-4">
                {centers.map(center => (
                  <div key={center.id} className="custom-glass rounded-2xl p-5 shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">🏥</span>
                        <h4 className="text-sm font-extrabold text-slate-900">{center.name}</h4>
                      </div>
                      <p className="text-xs text-slate-500 mt-1 font-semibold">{center.address}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1.5">Hours: {center.hours} &bull; Contact: {center.phone}</p>
                    </div>

                    <div className="text-right flex flex-col items-stretch self-stretch sm:self-center sm:items-end justify-center">
                      <span className="text-xs font-bold text-slate-400 mb-2">{center.distance} km away</span>
                      <button
                        onClick={() => handleOpenBookModal(center)}
                        disabled={eligibility.status === 'ineligible'}
                        className={`px-4 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                          eligibility.status === 'eligible'
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow shadow-red-500/10'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        Book Slot
                      </button>
                    </div>

                  </div>
                ))}
              </div>

              {/* Map Mock representation */}
              <div className="custom-glass rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between min-h-[350px]">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-4">📍 Donation Center Map Guide</h3>
                  
                  <div className="relative bg-slate-50 rounded-xl border border-slate-200 h-60 flex items-center justify-center overflow-hidden">
                    
                    {/* Grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(0,0,0,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(0,0,0,0.02)_1px,transparent_1px)] bg-[size:14px_24px]" />
                    
                    {/* Compass */}
                    <div className="w-48 h-48 border border-red-500/5 rounded-full absolute" />
                    <div className="w-24 h-24 border border-red-500/10 rounded-full absolute" />

                    {/* Donor Node */}
                    <div className="absolute left-[45%] top-[55%] flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-blue-600 border border-white flex items-center justify-center text-[10px] shadow">👤</div>
                      <span className="text-[7.5px] bg-slate-900 text-white px-1 py-0.5 rounded font-black mt-1 uppercase">Me</span>
                    </div>

                    {/* St. Jude Center */}
                    <div className="absolute left-[52%] top-[40%] flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-red-600 border border-white flex items-center justify-center text-[10px] shadow">🏥</div>
                      <span className="text-[7.5px] bg-white border border-slate-250 px-1 py-0.5 rounded text-slate-700 font-extrabold mt-0.5">St. Jude</span>
                    </div>

                    {/* Grace Center */}
                    <div className="absolute left-[30%] top-[35%] flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-red-600 border border-white flex items-center justify-center text-[10px] shadow">🏥</div>
                      <span className="text-[7.5px] bg-white border border-slate-250 px-1 py-0.5 rounded text-slate-700 font-extrabold mt-0.5">Grace</span>
                    </div>

                  </div>
                </div>

                <p className="text-[10px] text-slate-500 mt-2 text-center font-bold">🗺️ Coordinate overlays mapped to your profile zip code</p>
              </div>

            </div>

          </div>
        )}

        {/* TAB 4: BADGES & IMPACT */}
        {activeTab === 'badges' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Action Bar */}
            <div className="bg-white/60 p-6 rounded-2xl border border-white shadow-sm">
              <h2 className="text-lg font-extrabold text-slate-900 font-black">Donor Gamification & Impact Leaderboard</h2>
              <p className="text-xs text-slate-500 font-semibold mt-1">Unlock badges and achievements by completing donations, responding to emergency callouts, and keeping availability toggled.</p>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
              {badges.map(badge => (
                <div key={badge.id} className={`p-4 rounded-xl text-center border transition-all flex flex-col justify-between min-h-[140px] ${
                  badge.unlocked 
                    ? 'custom-glass border-slate-200/80 shadow-sm' 
                    : 'bg-slate-100/40 border-slate-200 text-slate-400 opacity-60'
                }`}>
                  <div>
                    <span className="text-3xl block mb-2">{badge.icon}</span>
                    <h4 className="text-xs font-extrabold text-slate-800">{badge.name}</h4>
                  </div>
                  <p className="text-[9px] text-slate-500 font-semibold leading-relaxed mt-2">{badge.desc}</p>
                  
                  <span className={`text-[8px] font-black uppercase tracking-wider mt-2.5 block ${badge.unlocked ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {badge.unlocked ? '✓ Unlocked' : '🔒 Locked'}
                  </span>
                </div>
              ))}
            </div>

            {/* Leaderboard & Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Gamification Progress Bar */}
              <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200 md:col-span-2 flex flex-col justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">⭐ Level Progression</h3>
                  <div className="flex justify-between items-baseline mb-4">
                    <span className="text-xs font-bold text-slate-500">Tier: <strong className="text-red-500">Silver Blood Donor</strong></span>
                    <span className="text-[10px] text-slate-400 font-bold uppercase">{donor.totalDonations}/10 donations to Gold</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden border border-slate-200 relative">
                    <div className="bg-gradient-to-r from-red-500 to-rose-600 h-full rounded-full transition-all duration-500" style={{ width: `${(donor.totalDonations / 10) * 100}%` }} />
                    <span className="absolute inset-0 flex items-center justify-center text-[9px] font-black text-slate-800">
                      {Math.round((donor.totalDonations / 10) * 100)}% progress
                    </span>
                  </div>
                </div>

                <div className="border-t border-slate-150 pt-4 mt-6 flex justify-between text-xs text-slate-500">
                  <span>Current rank: <strong>#482</strong> (Local District)</span>
                  <span className="text-red-500 font-bold">50 XP until next rank</span>
                </div>
              </div>

              {/* Impact stats card */}
              <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col justify-between">
                <h3 className="text-sm font-bold text-slate-900 mb-4">🩸 LifeLink Estimation</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-lg">❤️</div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{donor.totalDonations * 450} ml</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Total volume donated</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-lg">🤝</div>
                    <div>
                      <p className="text-xs font-black text-slate-800">{donor.totalDonations * 3} Lives Saved</p>
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Estimated maximum impact</p>
                    </div>
                  </div>
                </div>

                <p className="text-[9.5px] text-slate-500 font-semibold italic mt-4">
                  Each donation unit can be separated into three components (red cells, plasma, platelets) to stabilize three unique patients.
                </p>
              </div>

            </div>

          </div>
        )}

        {/* TAB 5: PROFILE SETTINGS */}
        {activeTab === 'profile' && (
          <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200 animate-fadeIn max-w-2xl mx-auto">
            <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
              <span>👤</span>
              <span className="ml-2">My Donor Profile Settings</span>
            </h2>
            <p className="text-xs text-slate-500 font-semibold mb-6">Manage your contact information, verify your blood group details, and record past donations to update recovery schedules.</p>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Full Name</label>
                  <input
                    type="text"
                    value={donor.name}
                    onChange={(e) => setDonor(prev => ({ ...prev, name: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Email Address</label>
                  <input
                    type="email"
                    value={donor.email}
                    disabled
                    className="w-full px-4 py-3 bg-slate-100 border border-slate-200 text-slate-500 rounded-xl text-sm cursor-not-allowed font-semibold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blood Group</label>
                  <select
                    value={donor.bloodType}
                    onChange={(e) => setDonor(prev => ({ ...prev, bloodType: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700 font-bold"
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
                    value={donor.lastDonated}
                    onChange={(e) => setDonor(prev => ({ ...prev, lastDonated: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Phone Contact</label>
                  <input
                    type="text"
                    value={donor.phone}
                    onChange={(e) => setDonor(prev => ({ ...prev, phone: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Zip Code / Location</label>
                  <input
                    type="text"
                    value={donor.zipCode}
                    onChange={(e) => setDonor(prev => ({ ...prev, zipCode: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs uppercase tracking-wide transition-all shadow"
              >
                Save Settings
              </button>
            </form>
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="w-full relative z-10 mt-12 bg-white/30 border-t border-slate-200/60 backdrop-blur">
        <Footer />
      </footer>

      {/* MODAL: BOOK APPOINTMENT */}
      {showBookModal && selectedCenter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowBookModal(false)} />
          
          <div className="relative bg-white border border-slate-200 max-w-md w-full rounded-[2rem] shadow-2xl p-6 overflow-hidden animate-slideUp text-slate-800">
            <h3 className="text-lg font-black text-slate-950 mb-2 flex items-center space-x-1.5">
              <span>📅</span>
              <span>Schedule Donation Appointment</span>
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-5">Select date and time at {selectedCenter.name}</p>

            <form onSubmit={handleConfirmBooking} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Appointment Date</label>
                <input 
                  type="date" 
                  value={bookingDate}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Appointment Time Slot</label>
                <select 
                  value={bookingTime}
                  onChange={(e) => setBookingTime(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700 font-bold"
                >
                  <option value="08:00 AM">08:00 AM - 09:00 AM</option>
                  <option value="09:30 AM">09:30 AM - 10:30 AM</option>
                  <option value="11:00 AM">11:00 AM - 12:00 PM</option>
                  <option value="01:30 PM">01:30 PM - 02:30 PM</option>
                  <option value="03:00 PM">03:00 PM - 04:00 PM</option>
                </select>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBookModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-800 font-bold rounded-xl text-xs uppercase tracking-wide transition-all border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-red-500/10"
                >
                  ✓ Confirm Slot
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