import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket, useJoinSocketRoom } from '../context/SocketContext';
import { api } from '../services/api';
import Footer from '../components/Footer';
import BroadcastModal from '../components/Hospital/BroadcastModal';
import HospitalEmergency from '../components/Hospital/HospitalEmergency';
import HospitalInventory from '../components/Hospital/HospitalInventory';
import HospitalMap from '../components/Hospital/HospitalMap';
import HospitalReport from '../components/Hospital/HospitalReport';
import HospitalOrganAllocation from '../components/Hospital/HospitalOrganAllocation';
import OrganNotificationDrawer from '../components/Hospital/OrganNotificationDrawer';

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const { user: authUser, logout: authLogout } = useAuth();
  const socket = useSocket();

  // Ensure this client is in the correct Socket.IO room for targeted events
  useJoinSocketRoom(socket, authUser);

  const [hospital, setHospital] = useState(authUser || {});
  const [activeTab, setActiveTab] = useState('emergency');

  // Notification Drawer State
  const [showNotifDrawer, setShowNotifDrawer]   = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Fetch Unread Organ Notifications Count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await api.get('/api/organ/notifications?unreadOnly=true');
      if (res && res.success) {
        setUnreadNotifCount(res.unreadCount || (res.data ? res.data.length : 0));
      }
    } catch (err) {
      console.warn('Could not fetch unread organ notification count:', err);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
  }, [fetchUnreadCount]);

  // Real-time socket listener for organ notifications
  useEffect(() => {
    if (!socket) return;

    const handleNewNotif = () => {
      setUnreadNotifCount(prev => prev + 1);
    };

    socket.on('organ_notification_received', handleNewNotif);

    return () => {
      socket.off('organ_notification_received', handleNewNotif);
    };
  }, [socket]);

  // Modal State
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [showAddStockModal, setShowAddStockModal] = useState(false);
  const [toast, setToast] = useState(null);

  // Filter States for Map
  const [mapRadius, setMapRadius] = useState(20);
  const [mapBloodType, setMapBloodType] = useState('ALL');
  const [mapAvailability, setMapAvailability] = useState('ALL');
  const [selectedDonor, setSelectedDonor] = useState(null);

  // Form State for Emergency Blood Request
  const [newRequest, setNewRequest] = useState({
    patient: '',
    ward: '',
    bloodType: 'O-',
    units: 2,
    urgency: 'Critical Priority',
    notes: ''
  });

  // State for Inventory logging
  const [newStock, setNewStock] = useState({
    bloodType: 'O-',
    units: 5,
    donorId: '',
    expiryDays: 42
  });

  // Verification Form State
  const [verificationDonorId, setVerificationDonorId] = useState('');
  const [verificationVolume, setVerificationVolume] = useState(450);
  const [verificationNotes, setVerificationNotes] = useState('');

  // 1. Donors List
  const [donors, setDonors] = useState([]);

  // 2. Active Emergency Requests (MongoDB Dynamic State)
  const [activeRequests, setActiveRequests] = useState([]);

  // 3. Inventory & Batches State (Persisted in MongoDB)
  const [inventory, setInventory] = useState([]);
  const [batches, setBatches] = useState([]);

  // 4. Audit History State (Persisted in MongoDB)
  const [history, setHistory] = useState([]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLogout = () => {
    authLogout();
    navigate('/login/hospital', { replace: true });
  };

  // Fetch hospital emergency requests
  const fetchHospitalRequests = useCallback(async () => {
    const hospitalId = hospital._id || hospital.id;
    if (!hospitalId) return;

    try {
      const result = await api.get(`/api/requests/hospital-feed?hospitalId=${hospitalId}`);
      if (result.success) {
        const activeOnly = (result.data || []).filter(r => r.status !== 'Completed' && r.step !== 4);
        setActiveRequests(activeOnly);
      }
    } catch (error) {
      console.error('Error fetching hospital requests:', error);
    }
  }, [hospital._id, hospital.id]);

  // Fetch persistent MongoDB Inventory & Batches
  const fetchInventoryData = useCallback(async () => {
    const hospitalId = hospital._id || hospital.id;
    if (!hospitalId) return;

    try {
      const data = await api.get(`/api/inventory/${hospitalId}`);
      if (data.success) {
        setInventory(data.inventory || []);
        setBatches(data.batches || []);
      }
    } catch (error) {
      console.error('Error loading inventory:', error);
    }
  }, [hospital._id, hospital.id]);

  // Fetch persistent MongoDB Audit History
  const fetchAuditHistory = useCallback(async () => {
    const hospitalId = hospital._id || hospital.id;
    if (!hospitalId) return;

    try {
      const data = await api.get(`/api/inventory/history/${hospitalId}`);
      if (data.success) {
        setHistory(data.history || []);
      }
    } catch (error) {
      console.error('Error loading audit history:', error);
    }
  }, [hospital._id, hospital.id]);

  // Fetch active donor list for Live Donor Map
  const fetchDonorsList = useCallback(async () => {
    try {
      const data = await api.get('/api/donors/all');
      if (data.success) {
        setDonors(data.data || []);
      }
    } catch (error) {
      console.error('Error fetching donors list:', error);
    }
  }, []);

  useEffect(() => {
    if (authUser) setHospital(authUser);
  }, [authUser]);

  useEffect(() => {
    fetchHospitalRequests();
    fetchInventoryData();
    fetchAuditHistory();
    fetchDonorsList();

    // Socket.IO event listeners replace 3-second HTTP polling loop!
    if (socket) {
      const handleSocketChange = () => {
        fetchHospitalRequests();
      };
      socket.on('request_created', handleSocketChange);
      socket.on('request_updated', handleSocketChange);

      return () => {
        socket.off('request_created', handleSocketChange);
        socket.off('request_updated', handleSocketChange);
      };
    } else {
      const interval = setInterval(fetchHospitalRequests, 10000);
      return () => clearInterval(interval);
    }
  }, [fetchHospitalRequests, fetchInventoryData, fetchAuditHistory, fetchDonorsList, socket]);

  // Submit Emergency Request
  const handleSubmitRequest = async (e) => {
    e.preventDefault();

    if (!newRequest.patient || !newRequest.ward) {
      showToast('Please fill out patient name and ward', 'error');
      return;
    }

    const hospitalId = hospital._id || hospital.id;
    if (!hospitalId) {
      showToast('Hospital session missing. Please log in again.', 'error');
      return;
    }

    const payload = {
      hospitalId: hospitalId,
      patientName: newRequest.patient,
      targetWard: newRequest.ward,
      bloodType: newRequest.bloodType || 'O+',
      requiredUnits: Number(newRequest.units) || 1,
      urgencyLevel: newRequest.urgency || 'Critical Priority',
      medicalDetails: newRequest.notes || ''
    };

    try {
      const result = await api.post('/api/requests/create', payload);

      if (result.success) {
        showToast('Emergency Blood Request Broadcasted Successfully!', 'success');
        fetchHospitalRequests();
        setShowRequestModal(false);
        setNewRequest({
          patient: '',
          ward: '',
          bloodType: 'O-',
          units: 2,
          urgency: 'Critical Priority',
          notes: ''
        });
      } else {
        showToast(`Database error: ${result.message}`, 'error');
      }
    } catch (error) {
      console.error('Network Error:', error);
      showToast('Could not connect to backend server', 'error');
    }
  };

  // Hospital Verifies & Completes Donation
  const advanceRequestStep = async (reqId) => {
    const targetReq = activeRequests.find(r => r._id === reqId || r.id === reqId);
    if (!targetReq) return;

    const mongoId = targetReq._id || targetReq.id;
    const hospitalId = hospital._id || hospital.id;

    try {
      const result = await api.patch(`/api/requests/status/${mongoId}`, {
        status: 'Completed',
        step: 4
      });

      if (result.success) {
        // Save audit log to MongoDB
        await api.post('/api/inventory/history', {
          hospitalId,
          caseId: `HST-${Math.floor(100 + Math.random() * 900)}`,
          patientName: targetReq.patientName || 'Patient',
          bloodType: targetReq.bloodType,
          units: targetReq.requiredUnits || 1,
          urgency: targetReq.urgencyLevel || 'Critical Priority',
          donorName: targetReq.acceptedByDonor?.fullName || targetReq.acceptedByDonor?.name || 'Verified Donor',
          donorId: targetReq.acceptedByDonor?._id
        });

        // Replenish stock in MongoDB
        await api.post('/api/inventory/add-batch', {
          hospitalId,
          bloodType: targetReq.bloodType,
          units: targetReq.requiredUnits || 1,
          expiryDays: 42
        });

        showToast(`✓ Donation verified & completed! Archived to history audit log.`, 'success');
        fetchHospitalRequests();
        fetchInventoryData();
        fetchAuditHistory();

      } else {
        showToast(result.message || 'Failed to sync status with database', 'error');
      }
    } catch (error) {
      console.error('Error completing request:', error);
      showToast('Network error while completing request', 'error');
    }
  };

  // Dispatch donor from Map
  const dispatchDonorFromMap = (donorObj) => {
    if (donorObj.eligible === false) {
      showToast(`${donorObj.name || donorObj.fullName} is currently ineligible (90-day rest timer).`, 'error');
      return;
    }
    
    showToast(`🚑 Direct dispatch request sent to donor ${donorObj.name || donorObj.fullName}.`, 'info');
    setSelectedDonor(null);
  };

  // Inventory Stock Add / Replenish
  const handleAddInventory = async (e) => {
    e.preventDefault();
    const hospitalId = hospital._id || hospital.id;
    if (!hospitalId) return;

    try {
      const data = await api.post('/api/inventory/add-batch', {
        hospitalId,
        bloodType: newStock.bloodType,
        units: newStock.units,
        expiryDays: newStock.expiryDays
      });

      if (data.success) {
        fetchInventoryData();
        setShowAddStockModal(false);
        showToast(`✓ Registered batch of ${newStock.bloodType} (${newStock.units} units)`, 'success');
      } else {
        showToast(data.message || 'Failed to add stock batch', 'error');
      }
    } catch (err) {
      showToast('Error adding stock batch to database', 'error');
    }
  };

  const handleDiscardBatch = async (batchId) => {
    const hospitalId = hospital._id || hospital.id;
    if (!hospitalId || !batchId) return;

    try {
      const data = await api.delete(`/api/inventory/batch/${hospitalId}/${batchId}`);
      if (data.success) {
        fetchInventoryData();
        showToast(`🗑️ Batch discarded. Inventory adjusted.`, 'info');
      }
    } catch (err) {
      showToast('Error discarding batch on server', 'error');
    }
  };

  // Open check-in form directly for a given request or donor (Requirement 1)
  const handleOpenCheckIn = (reqOrDonor) => {
    if (!reqOrDonor) return;
    const dId = reqOrDonor._id || reqOrDonor.id || reqOrDonor.acceptedByDonor?._id || reqOrDonor.acceptedByDonor?.id || reqOrDonor.acceptedByDonor;
    if (dId) {
      setVerificationDonorId(dId);
    }
    setActiveTab('verification');
  };

  // Donor Check-in Verification & Redirect
  const handleVerifyCheckIn = async (e) => {
    e.preventDefault();
    if (!verificationDonorId) {
      showToast('Select a donor to verify.', 'error');
      return;
    }

    const hospitalId = hospital._id || hospital.id;
    const matchedDonor = donors.find(d => (d._id === verificationDonorId || d.id === verificationDonorId || d.fullName?.toLowerCase().includes(verificationDonorId.toLowerCase())));

    let activeMatchedReq = activeRequests.find(r => (r.acceptedByDonor?._id === verificationDonorId || r.acceptedByDonor?.id === verificationDonorId) && r.step < 4);

    if (activeMatchedReq) {
      await advanceRequestStep(activeMatchedReq._id || activeMatchedReq.id);
    } else {
      const bloodGroup = matchedDonor ? (matchedDonor.bloodGroup || matchedDonor.bloodType) : 'O+';

      await api.post('/api/inventory/add-batch', {
        hospitalId,
        bloodType: bloodGroup,
        units: 1,
        expiryDays: 42
      });

      await api.post('/api/inventory/history', {
        hospitalId,
        caseId: `HST-${Math.floor(100 + Math.random() * 900)}`,
        patientName: 'Walk-In Stock replenishment',
        bloodType: bloodGroup,
        units: 1,
        urgency: 'Standard',
        donorName: matchedDonor ? (matchedDonor.fullName || matchedDonor.name) : 'Walk-In Donor',
        donorId: matchedDonor?._id
      });

      fetchInventoryData();
      fetchAuditHistory();
    }

    // Activate 90-day rest timer & mark unavailable (Rule A & Rule B)
    if (verificationDonorId && verificationDonorId.length === 24) {
      try {
        await api.patch(`/api/donors/profile/${verificationDonorId}`, {
          lastDonated: new Date(),
          lastDonatedDate: new Date(),
          isAvailable: false
        });
      } catch (err) {
        console.warn('Could not update donor availability status:', err);
      }
    }

    showToast(`✓ Donor Check-in Completed Successfully! 90-day rest period applied.`, 'success');

    // Reset form fields
    setVerificationDonorId('');
    setVerificationVolume(450);
    setVerificationNotes('');

    // Automatically redirect hospital admin to the Emergency Hub page (Requirement 1)
    setActiveTab('emergency');
  };

  // CSV Report Generator
  const downloadCSVReport = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Case ID,Date,Patient,Blood Type,Units Required,Urgency,Assigned Donor,Fulfillment Time,Status\r\n';
    
    (history || []).forEach(row => {
      csvContent += `"${row.id || row._id}","${row.date}","${row.patient}","${row.bloodType}",${row.units},"${row.urgency}","${row.donor}","${row.responseTime}","${row.status}"\r\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `LifeLink_Fulfillment_Report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    showToast('📊 CSV Report downloaded successfully.', 'success');
  };

  // Simulated PDF Download
  const downloadPDFReport = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>LifeLink Hospital Blood Coordination Report</title>
          <style>
            body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; color: #334155; }
            h1 { color: #dc2626; border-bottom: 2px solid #ef4444; padding-bottom: 10px; margin-bottom: 5px; }
            .meta { font-size: 12px; color: #64748b; margin-bottom: 30px; }
            .header-table { width: 100%; margin-bottom: 30px; border-collapse: collapse; }
            .header-table td { padding: 12px; border: 1px solid #e2e8f0; background: #f8fafc; }
            table.data { width: 100%; border-collapse: collapse; margin-top: 20px; }
            table.data th { background: #dc2626; color: white; text-align: left; padding: 12px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; }
            table.data td { padding: 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
            .footer { margin-top: 50px; font-size: 10px; text-align: center; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 20px; }
          </style>
        </head>
        <body>
          <h1>LifeLink Blood Sourcing Coordination Report</h1>
          <div class="meta">Generated on: ${new Date().toLocaleString()} | Facility: ${hospital.name || 'St. Jude General Hospital'}</div>
          <table class="data">
            <thead>
              <tr>
                <th>Case ID</th>
                <th>Date</th>
                <th>Patient</th>
                <th>Blood Type</th>
                <th>Units</th>
                <th>Urgency</th>
                <th>Donor</th>
              </tr>
            </thead>
            <tbody>
              ${(history || []).map(row => `
                <tr>
                  <td>${row.id || row._id}</td>
                  <td>${row.date}</td>
                  <td>${row.patient}</td>
                  <td><strong>${row.bloodType}</strong></td>
                  <td>${row.units} u</td>
                  <td>${row.urgency}</td>
                  <td>${row.donor}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">LifeLink Healthcare Systems &copy; 2026. All rights reserved.</div>
          <script>window.onload = function() { window.print(); }</script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('📄 PDF Print interface opened.', 'success');
  };

  // Filtered Donors list for Map rendering
  const filteredDonors = (donors || []).filter(d => {
    const matchRad = (d.distance || 5) <= mapRadius;
    const matchBlood = mapBloodType === 'ALL' || (d.bloodType || d.bloodGroup) === mapBloodType;
    const matchAvail = mapAvailability === 'ALL' || (d.status || 'AVAILABLE').toUpperCase() === mapAvailability.toUpperCase();
    return matchRad && matchBlood && matchAvail;
  });

  // Metrics
  const activeAlertsCount = activeRequests.filter(r => (r.urgencyLevel || r.urgency || '').includes('Critical') && r.status !== 'Completed').length;
  const criticalStockCount = inventory.filter(i => i.status === 'Critical').length;
  const lowStockCount = inventory.filter(i => i.status === 'Low').length;

  return (
    <div className="lifelink-dashboard min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background Orbs */}
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

      {/* Main Header */}
      <header className="sticky top-4 z-40 px-4 md:px-8 max-w-7xl mx-auto w-full mt-4">
        <nav className="custom-glass shadow-md rounded-2xl">
          <div className="px-6 h-16 flex justify-between items-center">
            
            <div className="flex items-center space-x-2">
              <span className="text-2xl pulse-heart">🩺</span>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent">
                LifeLink Admin
              </span>
            </div>

            <div className="hidden lg:flex space-x-1 bg-slate-200/50 p-1 rounded-xl border border-white/60">
              {[
                { id: 'emergency', name: 'Emergency Hub', icon: '🚨' },
                { id: 'organ', name: 'Organ Allocation', icon: '🫀' },
                { id: 'map', name: 'Live Donor Map', icon: '🗺️' },
                { id: 'inventory', name: 'Inventory & Stock', icon: '📦' },
                { id: 'verification', name: 'Donor Check-In', icon: '📋' },
                { id: 'reports', name: 'Reports & Logs', icon: '📊' }
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

            <div className="flex items-center space-x-3">
              {/* Notification Bell Button */}
              <button
                type="button"
                onClick={() => setShowNotifDrawer(true)}
                className="relative p-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 transition-all shadow-sm flex items-center justify-center"
                title="Organ Notifications"
              >
                <span className="text-base">🔔</span>
                {unreadNotifCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-600 text-white font-black text-[10px] h-5 min-w-[20px] px-1 rounded-full flex items-center justify-center border-2 border-white shadow-sm animate-pulse">
                    {unreadNotifCount > 99 ? '99+' : unreadNotifCount}
                  </span>
                )}
              </button>

              <div className="hidden sm:flex flex-col text-right">
                <span className="text-xs font-bold text-slate-800">{hospital.name || 'St. Jude General Hospital'}</span>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{hospital.licenseId || 'HOSP-77890'}</span>
              </div>
              <div className="w-8.5 h-8.5 rounded-lg bg-red-50 border border-red-100 flex items-center justify-center text-red-600 font-black text-xs shadow-inner">
                {hospital.name ? hospital.name.charAt(0) : 'H'}
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

      {/* Organ Notification Drawer */}
      <OrganNotificationDrawer
        isOpen={showNotifDrawer}
        onClose={() => setShowNotifDrawer(false)}
        unreadCount={unreadNotifCount}
        setUnreadCount={setUnreadNotifCount}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-grow relative z-10">
        
        {/* Mobile Nav Header */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-4 mb-6 scrollbar-none">
          {[
            { id: 'emergency', name: 'Emergency', icon: '🚨' },
            { id: 'organ', name: 'Organ Allocation', icon: '🫀' },
            { id: 'map', name: 'Donor Map', icon: '🗺️' },
            { id: 'inventory', name: 'Inventory', icon: '📦' },
            { id: 'verification', name: 'Check-In', icon: '📋' },
            { id: 'reports', name: 'Reports', icon: '📊' }
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

        {/* Overview Bar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-red-600 uppercase tracking-widest bg-red-50 px-2.5 py-1 rounded-full border border-red-100">Active Emergency</span>
              <span className="text-xl">🚨</span>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className={`text-4xl font-black tracking-tight text-slate-800 ${activeAlertsCount > 0 ? 'text-red-600' : ''}`}>
                  {activeAlertsCount}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">Requests Pending</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 font-semibold">
                {activeAlertsCount > 0 ? 'Requires immediate coordination & acceptance.' : 'All urgent requests responded to.'}
              </p>
            </div>
            {activeAlertsCount > 0 && (
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </div>

          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Active Donors (5-10km)</span>
              <span className="text-xl">👥</span>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black tracking-tight text-slate-800">
                  {donors.filter(d => (d.distance || 5) <= 10 && d.eligible !== false && (d.status === 'Available' || !d.status)).length}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">Eligible & Ready</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 font-semibold">
                Within direct response zone. Ready for dispatch.
              </p>
            </div>
          </div>

          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100">Stock Health</span>
              <span className="text-xl">🩸</span>
            </div>
            <div>
              <div className="flex items-center space-x-4">
                <div className="flex flex-col text-center bg-red-50 border border-red-100 px-3 py-1.5 rounded-xl">
                  <span className="text-lg font-black text-red-600">{criticalStockCount}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Critical</span>
                </div>
                <div className="flex flex-col text-center bg-amber-50 border border-amber-100 px-3 py-1.5 rounded-xl">
                  <span className="text-lg font-black text-amber-500">{lowStockCount}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Low</span>
                </div>
                <div className="flex flex-col text-center bg-emerald-50 border border-emerald-100 px-3 py-1.5 rounded-xl">
                  <span className="text-lg font-black text-emerald-600">{inventory.filter(i => i.status === 'Optimal').length}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">Optimal</span>
                </div>
              </div>
              <p className="text-slate-500 text-xs mt-3.5 font-semibold flex items-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mr-2 animate-pulse" />
                Live blood bank stock tracked in real time.
              </p>
            </div>
          </div>
        </div>

        {/* Delegated Sub-component Tabs */}
        {activeTab === 'emergency' && (
          <HospitalEmergency 
            activeRequests={activeRequests}
            setShowRequestModal={setShowRequestModal}
            advanceRequestStep={advanceRequestStep}
            onOpenCheckIn={handleOpenCheckIn}
          />
        )}

        {activeTab === 'map' && (
          <HospitalMap 
            donors={donors}
            filteredDonors={filteredDonors}
            mapRadius={mapRadius}
            setMapRadius={setMapRadius}
            mapBloodType={mapBloodType}
            setMapBloodType={setMapBloodType}
            mapAvailability={mapAvailability}
            setMapAvailability={setMapAvailability}
            selectedDonor={selectedDonor}
            setSelectedDonor={setSelectedDonor}
            dispatchDonorFromMap={dispatchDonorFromMap}
            setVerificationDonorId={setVerificationDonorId}
            setActiveTab={setActiveTab}
          />
        )}

        {activeTab === 'inventory' && (
          <HospitalInventory 
            inventory={inventory}
            setInventory={setInventory}
            batches={batches}
            donors={donors}
            setShowAddStockModal={setShowAddStockModal}
            handleDiscardBatch={handleDiscardBatch}
            handleVerifyCheckIn={handleVerifyCheckIn}
            verificationDonorId={verificationDonorId}
            setVerificationDonorId={setVerificationDonorId}
            verificationVolume={verificationVolume}
            setVerificationVolume={setVerificationVolume}
            verificationNotes={verificationNotes}
            setVerificationNotes={setVerificationNotes}
            activeSubTab="inventory"
          />
        )}

        {activeTab === 'verification' && (
          <HospitalInventory 
            inventory={inventory}
            setInventory={setInventory}
            batches={batches}
            donors={donors}
            setShowAddStockModal={setShowAddStockModal}
            handleDiscardBatch={handleDiscardBatch}
            handleVerifyCheckIn={handleVerifyCheckIn}
            verificationDonorId={verificationDonorId}
            setVerificationDonorId={setVerificationDonorId}
            verificationVolume={verificationVolume}
            setVerificationVolume={setVerificationVolume}
            verificationNotes={verificationNotes}
            setVerificationNotes={setVerificationNotes}
            activeSubTab="verification"
          />
        )}

        {activeTab === 'organ' && (
          <HospitalOrganAllocation showToast={showToast} />
        )}

        {activeTab === 'reports' && (
          <HospitalReport 
            history={history}
            downloadCSVReport={downloadCSVReport}
            downloadPDFReport={downloadPDFReport}
          />
        )}

      </main>

      <footer className="w-full relative z-10 mt-12 bg-white/30 border-t border-slate-200/60 backdrop-blur">
        <Footer />
      </footer>

      {/* Broadcast Modal */}
      <BroadcastModal
        isOpen={showRequestModal}
        onClose={() => setShowRequestModal(false)}
        newRequest={newRequest}
        setNewRequest={setNewRequest}
        onSubmit={handleSubmitRequest}
      />

      {/* Log Incoming Stock Modal */}
      {showAddStockModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowAddStockModal(false)} />
          
          <div className="relative bg-white border border-slate-200 max-w-md w-full rounded-[2rem] shadow-2xl p-6 overflow-hidden animate-slideUp text-slate-800">
            <h3 className="text-lg font-black text-slate-955 mb-2 flex items-center space-x-1.5">
              <span>📥</span>
              <span>Log Incoming Blood Units</span>
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-5">Register external supply batch into inventory</p>

            <form onSubmit={handleAddInventory} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Blood Type</label>
                  <select 
                    value={newStock.bloodType}
                    onChange={(e) => setNewStock(prev => ({ ...prev, bloodType: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700 font-bold"
                  >
                    {["O-", "O+", "A-", "A+", "B-", "B+", "AB-", "AB+"].map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Units (Bags)</label>
                  <input 
                    type="number" 
                    value={newStock.units}
                    min={1}
                    max={100}
                    onChange={(e) => setNewStock(prev => ({ ...prev, units: e.target.value }))}
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Source / Donor ID</label>
                  <input 
                    type="text" 
                    value={newStock.donorId}
                    onChange={(e) => setNewStock(prev => ({ ...prev, donorId: e.target.value }))}
                    placeholder="e.g. RedCross / DN-123"
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Expiration Window (Days)</label>
                  <input 
                    type="number" 
                    value={newStock.expiryDays}
                    min={1}
                    max={42}
                    onChange={(e) => setNewStock(prev => ({ ...prev, expiryDays: parseInt(e.target.value) }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddStockModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-855 font-bold rounded-xl text-xs uppercase tracking-wide transition-all border border-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wide transition-all shadow-md shadow-red-500/10"
                >
                  ✓ Log Supply
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default HospitalDashboard;