import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer';

const HospitalDashboard = () => {
  const navigate = useNavigate();

  // Hospital Profile Info
  const [hospital, setHospital] = useState({});
  const [activeTab, setActiveTab] = useState('emergency');

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
    urgency: 'Critical',
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

  // 1. Initial State for Donors
  const [donors, setDonors] = useState([
    { id: 'DN-001', name: 'Alex Rivera', bloodType: 'A+', lat: 52, lng: 48, status: 'Available', distance: 3.2, phone: '+1 (555) 123-4567', lastDonated: '2026-06-15', eligible: true },
    { id: 'DN-002', name: 'Beatrice Kim', bloodType: 'O-', lat: 42, lng: 55, status: 'In-Transit', distance: 4.8, phone: '+1 (555) 987-6543', lastDonated: '2026-05-10', eligible: true },
    { id: 'DN-003', name: 'Carlos Mendez', bloodType: 'B+', lat: 60, lng: 62, status: 'Busy', distance: 7.5, phone: '+1 (555) 345-6789', lastDonated: '2026-07-20', eligible: false },
    { id: 'DN-004', name: 'Diana Prince', bloodType: 'O+', lat: 48, lng: 44, status: 'Available', distance: 2.1, phone: '+1 (555) 234-5678', lastDonated: '2026-08-01', eligible: true },
    { id: 'DN-005', name: 'Evan Wright', bloodType: 'A-', lat: 30, lng: 35, status: 'Available', distance: 11.2, phone: '+1 (555) 876-5432', lastDonated: '2026-04-18', eligible: true },
    { id: 'DN-006', name: 'Fiona Gallagher', bloodType: 'O-', lat: 52, lng: 63, status: 'Arrived', distance: 5.4, phone: '+1 (555) 456-7890', lastDonated: '2026-08-05', eligible: true },
    { id: 'DN-007', name: 'George Smith', bloodType: 'AB-', lat: 65, lng: 38, status: 'In-Transit', distance: 9.1, phone: '+1 (555) 765-4321', lastDonated: '2026-07-02', eligible: true },
    { id: 'DN-008', name: 'Hannah Abbott', bloodType: 'B-', lat: 32, lng: 70, status: 'Busy', distance: 14.5, phone: '+1 (555) 678-9012', lastDonated: '2026-03-22', eligible: false }
  ]);

  // 2. Initial State for Active Emergency Requests
  const [activeRequests, setActiveRequests] = useState([
    {
      id: 'REQ-101',
      patient: 'Liam Carter',
      ward: 'ICU - Bed 3',
      bloodType: 'O-',
      units: 3,
      urgency: 'Critical',
      status: 'Donor In-Transit',
      step: 2, // 0: Broadcast Sent, 1: Donor Accepted, 2: Donor In-Transit, 3: Arrived, 4: Completed
      donor: 'Beatrice Kim (DN-002)',
      timestamp: '15 mins ago',
      notes: 'Aortic aneurysm emergency.'
    },
    {
      id: 'REQ-102',
      patient: 'Evelyn Vance',
      ward: 'Surgical B - Rm 402',
      bloodType: 'A+',
      units: 2,
      urgency: 'Moderate',
      status: 'Broadcast Sent',
      step: 0,
      donor: 'None Assigned',
      timestamp: '2 mins ago',
      notes: 'Post-op bypass bleeding stabilization.'
    },
    {
      id: 'REQ-103',
      patient: 'Baby John',
      ward: 'NICU - Incubator 5',
      bloodType: 'AB-',
      units: 1,
      urgency: 'Critical',
      status: 'Donor Accepted',
      step: 1,
      donor: 'George Smith (DN-007)',
      timestamp: '8 mins ago',
      notes: 'Severe neonatal anemia.'
    }
  ]);

  // 3. Initial State for Inventory
  const [inventory, setInventory] = useState([
    { type: 'A+', units: 45, status: 'Optimal' },
    { type: 'A-', units: 8, status: 'Low' },
    { type: 'B+', units: 28, status: 'Optimal' },
    { type: 'B-', units: 5, status: 'Critical' },
    { type: 'AB+', units: 15, status: 'Optimal' },
    { type: 'AB-', units: 2, status: 'Critical' },
    { type: 'O+', units: 60, status: 'Optimal' },
    { type: 'O-', units: 4, status: 'Critical' }
  ]);

  const [batches, setBatches] = useState([
    { id: 'B-9011', bloodType: 'O-', units: 4, expiry: '2026-08-15', status: 'Expiring Soon' },
    { id: 'B-9012', bloodType: 'A-', units: 8, expiry: '2026-08-28', status: 'Good' },
    { id: 'B-9013', bloodType: 'B-', units: 5, expiry: '2026-08-05', status: 'Expired' },
    { id: 'B-9014', bloodType: 'AB-', units: 2, expiry: '2026-08-11', status: 'Expiring Soon' },
    { id: 'B-9015', bloodType: 'O+', units: 45, expiry: '2026-09-12', status: 'Good' }
  ]);

  // 4. Initial State for History
  const [history, setHistory] = useState([
    { id: 'HST-201', patient: 'Robert Chen', bloodType: 'A-', units: 2, urgency: 'Critical', donor: 'Diana Prince', responseTime: '12 mins', status: 'Completed', date: '2026-08-08' },
    { id: 'HST-202', patient: 'Sofia Loren', bloodType: 'O-', units: 1, urgency: 'Critical', donor: 'Alex Rivera', responseTime: '8 mins', status: 'Completed', date: '2026-08-07' },
    { id: 'HST-203', patient: 'David Miller', bloodType: 'B+', units: 4, urgency: 'Standard', donor: 'Carlos Mendez', responseTime: '24 mins', status: 'Completed', date: '2026-08-06' }
  ]);

  useEffect(() => {
    const stored = localStorage.getItem('hospital');
    if (stored) {
      setHospital(JSON.parse(stored));
    } else {
      setHospital({
        name: 'St. Jude General Hospital',
        email: 'admin@stjude.org',
        licenseId: 'HOSP-77890',
        adminName: 'Dr. Evelyn Martinez',
        city: 'New York'
      });
    }

    // Load state from localStorage if exists
    const storedInventory = localStorage.getItem('blood_inventory');
    const storedDonors = localStorage.getItem('blood_donors');
    const storedRequests = localStorage.getItem('blood_requests');
    const storedHistory = localStorage.getItem('blood_history');
    const storedBatches = localStorage.getItem('blood_batches');

    if (storedInventory) setInventory(JSON.parse(storedInventory));
    if (storedDonors) setDonors(JSON.parse(storedDonors));
    if (storedRequests) setActiveRequests(JSON.parse(storedRequests));
    if (storedHistory) setHistory(JSON.parse(storedHistory));
    if (storedBatches) setBatches(JSON.parse(storedBatches));
  }, []);

  const saveToLocalStorage = (newInv, newDonors, newReqs, newHist, newBatches) => {
    if (newInv) localStorage.setItem('blood_inventory', JSON.stringify(newInv));
    if (newDonors) localStorage.setItem('blood_donors', JSON.stringify(newDonors));
    if (newReqs) localStorage.setItem('blood_requests', JSON.stringify(newReqs));
    if (newHist) localStorage.setItem('blood_history', JSON.stringify(newHist));
    if (newBatches) localStorage.setItem('blood_batches', JSON.stringify(newBatches));
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(null);
    }, 4000);
  };

  const handleLogout = () => {
    localStorage.removeItem('hospital');
    navigate('/login/hospital');
  };

  // Submit Emergency Request
  const handleSubmitRequest = (e) => {
    e.preventDefault();
    if (!newRequest.patient || !newRequest.ward) {
      showToast('Please fill out all patient information', 'error');
      return;
    }

    const createdReq = {
      id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
      patient: newRequest.patient,
      ward: newRequest.ward,
      bloodType: newRequest.bloodType,
      units: parseInt(newRequest.units),
      urgency: newRequest.urgency,
      status: 'Broadcast Sent',
      step: 0,
      donor: 'None Assigned',
      timestamp: 'Just now',
      notes: newRequest.notes
    };

    const updatedReqs = [createdReq, ...activeRequests];
    setActiveRequests(updatedReqs);
    saveToLocalStorage(null, null, updatedReqs, null, null);
    setShowRequestModal(false);

    // Simulate instant broadcast
    showToast(`🚨 Emergency Broadcast sent for ${newRequest.bloodType} (${newRequest.urgency})!`, 'info');

    // Simulate donor acceptance after 5 seconds
    setTimeout(() => {
      setActiveRequests(current => {
        const index = current.findIndex(r => r.id === createdReq.id);
        if (index !== -1 && current[index].step === 0) {
          const updated = [...current];
          // Find matching eligible donor
          const compatibleDonor = donors.find(d => d.bloodType === createdReq.bloodType && d.status === 'Available');
          const donorName = compatibleDonor ? `${compatibleDonor.name} (${compatibleDonor.id})` : 'Anonymous Donor (DN-482)';
          
          updated[index] = {
            ...updated[index],
            status: 'Donor Accepted',
            step: 1,
            donor: donorName
          };

          // Update donor status to In-Transit if we matched a real mock donor
          if (compatibleDonor) {
            setDonors(prevDonors => {
              const nextDonors = prevDonors.map(d => d.id === compatibleDonor.id ? { ...d, status: 'In-Transit' } : d);
              saveToLocalStorage(null, nextDonors, updated, null, null);
              return nextDonors;
            });
          }

          showToast(`⚡ Donor Accepted request: ${donorName} is preparing donation!`, 'success');
          return updated;
        }
        return current;
      });
    }, 4500);

    // Reset request form
    setNewRequest({
      patient: '',
      ward: '',
      bloodType: 'O-',
      units: 2,
      urgency: 'Critical',
      notes: ''
    });
  };

  // Pipeline Status Controller (Interactive Tracker)
  const advanceRequestStep = (reqId) => {
    const updated = activeRequests.map(req => {
      if (req.id === reqId) {
        let nextStep = req.step + 1;
        let nextStatus = '';
        let nextDonorStatus = '';

        switch (nextStep) {
          case 1:
            nextStatus = 'Donor Accepted';
            nextDonorStatus = 'In-Transit';
            break;
          case 2:
            nextStatus = 'Donor In-Transit';
            nextDonorStatus = 'In-Transit';
            break;
          case 3:
            nextStatus = 'Arrived';
            nextDonorStatus = 'Arrived';
            break;
          case 4:
            nextStatus = 'Completed';
            nextDonorStatus = 'Available';
            break;
          default:
            nextStep = req.step;
            nextStatus = req.status;
        }

        // Extract donor ID
        const donorIdMatch = req.donor.match(/DN-\d+/);
        const donorId = donorIdMatch ? donorIdMatch[0] : null;

        if (nextStep === 4) {
          // Move to History list
          const completedHistory = {
            id: `HST-${Math.floor(100 + Math.random() * 900)}`,
            patient: req.patient,
            bloodType: req.bloodType,
            units: req.units,
            urgency: req.urgency,
            donor: req.donor.split(' (')[0],
            responseTime: '15 mins',
            status: 'Completed',
            date: new Date().toISOString().split('T')[0]
          };

          // Update history and remove from active
          setTimeout(() => {
            setHistory(prevHist => {
              const nextHist = [completedHistory, ...prevHist];
              saveToLocalStorage(null, null, null, nextHist, null);
              return nextHist;
            });
            setActiveRequests(prevReqs => {
              const nextReqs = prevReqs.filter(r => r.id !== reqId);
              saveToLocalStorage(null, null, nextReqs, null, null);
              return nextReqs;
            });

            // Update blood stock inventory
            setInventory(prevInv => {
              const nextInv = prevInv.map(b => {
                if (b.type === req.bloodType) {
                  const updatedUnits = b.units + req.units;
                  return {
                    ...b,
                    units: updatedUnits,
                    status: updatedUnits > 10 ? 'Optimal' : updatedUnits > 5 ? 'Low' : 'Critical'
                  };
                }
                return b;
              });
              saveToLocalStorage(nextInv, null, null, null, null);
              return nextInv;
            });

            showToast(`✓ Donation Completed for patient ${req.patient}. Stock updated.`, 'success');
          }, 400);

          // Update donor eligibility if they checked in and finished
          if (donorId) {
            setDonors(prevDonors => {
              const nextDonors = prevDonors.map(d => d.id === donorId ? {
                ...d,
                status: 'Available',
                eligible: false,
                lastDonated: new Date().toISOString().split('T')[0]
              } : d);
              saveToLocalStorage(null, nextDonors, null, null, null);
              return nextDonors;
            });
          }
        } else {
          // Update donor status on map
          if (donorId && nextDonorStatus) {
            setDonors(prevDonors => {
              const nextDonors = prevDonors.map(d => d.id === donorId ? { ...d, status: nextDonorStatus } : d);
              saveToLocalStorage(null, nextDonors, null, null, null);
              return nextDonors;
            });
          }
        }

        return { ...req, step: nextStep, status: nextStatus };
      }
      return req;
    });

    const activeList = updated.filter(req => req.step < 4);
    setActiveRequests(activeList);
    saveToLocalStorage(null, null, activeList, null, null);
  };

  // Dispatch donor from Map
  const dispatchDonorFromMap = (donor) => {
    if (!donor.eligible) {
      showToast(`${donor.name} is currently ineligible (90-day rest timer).`, 'error');
      return;
    }
    
    // Check if there is a pending request waiting for this blood type
    const pendingRequest = activeRequests.find(r => r.bloodType === donor.bloodType && r.step === 0);
    
    if (pendingRequest) {
      setActiveRequests(prev => {
        const next = prev.map(r => r.id === pendingRequest.id ? {
          ...r,
          status: 'Donor Accepted',
          step: 1,
          donor: `${donor.name} (${donor.id})`
        } : r);
        saveToLocalStorage(null, null, next, null, null);
        return next;
      });

      setDonors(prev => {
        const next = prev.map(d => d.id === donor.id ? { ...d, status: 'In-Transit' } : d);
        saveToLocalStorage(null, next, null, null, null);
        return next;
      });

      showToast(`🎯 Dispatched ${donor.name} to patient ${pendingRequest.patient}!`, 'success');
      setSelectedDonor(null);
    } else {
      // Create new request
      const createdReq = {
        id: `REQ-${Math.floor(100 + Math.random() * 900)}`,
        patient: 'Incoming Dispatch',
        ward: 'Emergency Triage',
        bloodType: donor.bloodType,
        units: 1,
        urgency: 'Standard',
        status: 'Donor In-Transit',
        step: 2,
        donor: `${donor.name} (${donor.id})`,
        timestamp: 'Just now',
        notes: 'Pre-emptive emergency dispatch from Live Map.'
      };

      const nextReqs = [createdReq, ...activeRequests];
      setActiveRequests(nextReqs);

      setDonors(prev => {
        const next = prev.map(d => d.id === donor.id ? { ...d, status: 'In-Transit' } : d);
        saveToLocalStorage(null, next, nextReqs, null, null);
        return next;
      });

      showToast(`🚑 Dispatched ${donor.name} for urgent collection.`, 'info');
      setSelectedDonor(null);
    }
  };

  // Inventory Stock Add / Replenish
  const handleAddInventory = (e) => {
    e.preventDefault();
    const updatedInv = inventory.map(item => {
      if (item.type === newStock.bloodType) {
        const nextUnits = item.units + parseInt(newStock.units);
        return {
          ...item,
          units: nextUnits,
          status: nextUnits > 10 ? 'Optimal' : nextUnits > 5 ? 'Low' : 'Critical'
        };
      }
      return item;
    });

    const newBatchObj = {
      id: `B-${Math.floor(1000 + Math.random() * 9000)}`,
      bloodType: newStock.bloodType,
      units: parseInt(newStock.units),
      expiry: new Date(Date.now() + newStock.expiryDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      status: 'Good'
    };

    const updatedBatches = [newBatchObj, ...batches];
    setInventory(updatedInv);
    setBatches(updatedBatches);
    saveToLocalStorage(updatedInv, null, null, null, updatedBatches);
    setShowAddStockModal(false);

    showToast(`✓ Registered batch ${newBatchObj.id} of ${newStock.bloodType} (${newStock.units} units)`, 'success');
  };

  const handleDiscardBatch = (batchId) => {
    const batchToDiscard = batches.find(b => b.id === batchId);
    if (!batchToDiscard) return;

    const nextBatches = batches.filter(b => b.id !== batchId);
    
    // Decrement from main inventory
    const nextInv = inventory.map(item => {
      if (item.type === batchToDiscard.bloodType) {
        const nextUnits = Math.max(0, item.units - batchToDiscard.units);
        return {
          ...item,
          units: nextUnits,
          status: nextUnits > 10 ? 'Optimal' : nextUnits > 5 ? 'Low' : 'Critical'
        };
      }
      return item;
    });

    setBatches(nextBatches);
    setInventory(nextInv);
    saveToLocalStorage(nextInv, null, null, null, nextBatches);
    showToast(`🗑️ Batch ${batchId} discarded. Inventory adjusted.`, 'info');
  };

  // Donor Check-in Verification
  const handleVerifyCheckIn = (e) => {
    e.preventDefault();
    if (!verificationDonorId) {
      showToast('Select a donor to verify.', 'error');
      return;
    }

    const matchedDonor = donors.find(d => d.id === verificationDonorId || d.name.toLowerCase().includes(verificationDonorId.toLowerCase()));
    if (!matchedDonor) {
      showToast('No registered donor matches ID or Name.', 'error');
      return;
    }

    // Perform check-in: Set Donor to Available, eligibility to false, lastDonated to today
    const nextDonors = donors.map(d => {
      if (d.id === matchedDonor.id) {
        return {
          ...d,
          status: 'Available',
          eligible: false,
          lastDonated: new Date().toISOString().split('T')[0]
        };
      }
      return d;
    });

    // See if there's an active request in step 3 (Arrived) for this donor
    let activeMatchedReq = activeRequests.find(r => r.donor.includes(matchedDonor.id) && r.step === 3);

    // If no Arrived request, check for any In-Transit or Accepted matching request
    if (!activeMatchedReq) {
      activeMatchedReq = activeRequests.find(r => r.donor.includes(matchedDonor.id) && r.step < 4);
    }

    if (activeMatchedReq) {
      // Advance this active request directly to Complete!
      advanceRequestStep(activeMatchedReq.id);
    } else {
      // Walk-in donation: Add units to inventory directly
      const bloodGroup = matchedDonor.bloodType;
      
      const nextInv = inventory.map(item => {
        if (item.type === bloodGroup) {
          const nextUnits = item.units + 1; // Round to 1 unit
          return {
            ...item,
            units: nextUnits,
            status: nextUnits > 10 ? 'Optimal' : nextUnits > 5 ? 'Low' : 'Critical'
          };
        }
        return item;
      });

      const newBatchObj = {
        id: `B-${Math.floor(1000 + Math.random() * 9000)}`,
        bloodType: bloodGroup,
        units: 1,
        expiry: new Date(Date.now() + 42 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'Good'
      };

      const nextBatches = [newBatchObj, ...batches];
      
      setInventory(nextInv);
      setBatches(nextBatches);

      // Create new history log
      const walkInHist = {
        id: `HST-${Math.floor(100 + Math.random() * 900)}`,
        patient: 'Walk-In Stock replenishment',
        bloodType: bloodGroup,
        units: 1,
        urgency: 'Standard',
        donor: matchedDonor.name,
        responseTime: 'N/A',
        status: 'Completed',
        date: new Date().toISOString().split('T')[0]
      };
      
      setHistory(prev => {
        const nextHist = [walkInHist, ...prev];
        saveToLocalStorage(nextInv, nextDonors, null, nextHist, nextBatches);
        return nextHist;
      });

      showToast(`✓ Check-In Success! 1 Unit of ${bloodGroup} registered from donor ${matchedDonor.name}.`, 'success');
    }

    setDonors(nextDonors);
    saveToLocalStorage(null, nextDonors, null, null, null);
    
    // Reset fields
    setVerificationDonorId('');
    setVerificationVolume(450);
    setVerificationNotes('');
  };

  // CSV Report Generator
  const downloadCSVReport = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Case ID,Date,Patient,Blood Type,Units Required,Urgency,Assigned Donor,Fulfillment Time,Status\r\n';
    
    history.forEach(row => {
      csvContent += `"${row.id}","${row.date}","${row.patient}","${row.bloodType}",${row.units},"${row.urgency}","${row.donor}","${row.responseTime}","${row.status}"\r\n`;
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
    // Elegant mock printable window
    const printWindow = window.open('', '_blank');
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
            .badge { font-weight: bold; padding: 3px 8px; border-radius: 6px; font-size: 10px; text-transform: uppercase; }
            .critical { background: #fee2e2; color: #991b1b; }
            .standard { background: #f0fdf4; color: #166534; }
          </style>
        </head>
        <body>
          <h1>LifeLink Blood Sourcing Coordination Report</h1>
          <div class="meta font-bold">Generated on: ${new Date().toLocaleString()} | Facility: St. Jude General Hospital | License: HOSP-77890</div>
          
          <table class="header-table">
            <tr>
              <td><strong>Total Fulfilled Requests</strong><br><span style="font-size: 20px; font-weight: bold; color: #0f172a;">${history.length}</span></td>
              <td><strong>Active Emergency Queue</strong><br><span style="font-size: 20px; font-weight: bold; color: #0f172a;">${activeRequests.length}</span></td>
              <td><strong>Inventory Alerts (Low/Critical)</strong><br><span style="font-size: 20px; font-weight: bold; color: #dc2626;">${inventory.filter(i => i.status !== 'Optimal').length}</span></td>
            </tr>
          </table>

          <h3>Fulfillment History Logs</h3>
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
                <th>Response Time</th>
              </tr>
            </thead>
            <tbody>
              ${history.map(row => `
                <tr>
                  <td>${row.id}</td>
                  <td>${row.date}</td>
                  <td>${row.patient}</td>
                  <td><strong>${row.bloodType}</strong></td>
                  <td>${row.units} u</td>
                  <td><span class="badge ${row.urgency === 'Critical' ? 'critical' : 'standard'}">${row.urgency}</span></td>
                  <td>${row.donor}</td>
                  <td>${row.responseTime}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            LifeLink Healthcare Systems &copy; 2026. All rights reserved. Secure admin transmission document.
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
    showToast('📄 PDF Print interface opened.', 'success');
  };

  // Filtered Donors list for Map rendering
  const filteredDonors = donors.filter(d => {
    const matchRad = d.distance <= mapRadius;
    const matchBlood = mapBloodType === 'ALL' || d.bloodType === mapBloodType;
    const matchAvail = mapAvailability === 'ALL' || d.status.toUpperCase() === mapAvailability.toUpperCase();
    return matchRad && matchBlood && matchAvail;
  });

  // Calculate metrics
  const activeAlertsCount = activeRequests.filter(r => r.urgency === 'Critical').length;
  const criticalStockCount = inventory.filter(i => i.status === 'Critical').length;
  const lowStockCount = inventory.filter(i => i.status === 'Low').length;

  return (
    <div className="lifelink-dashboard min-h-screen bg-gradient-to-br from-[#F8FAFC] via-[#EEF2FF] to-[#E0E7FF] text-slate-800 flex flex-col justify-between relative overflow-hidden font-sans">
      
      {/* Background visual gradients / Ambient Orbs */}
      <div className="absolute top-10 left-10 w-96 h-96 bg-blue-400/20 rounded-full blur-3xl pointer-events-none network-pulse-glow" />
      <div className="absolute bottom-10 right-10 w-96 h-96 bg-red-400/10 rounded-full blur-3xl pointer-events-none network-pulse-glow" />

      {/* Global CSS Inject */}
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
        .pulse-heart {
          animation: beat 1.2s infinite;
        }
        @keyframes beat {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.15); }
          40% { transform: scale(1.05); }
          60% { transform: scale(1.15); }
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

      {/* Main Header / Navigation */}
      <header className="sticky top-4 z-40 px-4 md:px-8 max-w-7xl mx-auto w-full mt-4">
        <nav className="custom-glass shadow-md rounded-2xl">
          <div className="px-6 h-16 flex justify-between items-center">
            
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <span className="text-2xl pulse-heart">🩺</span>
              <span className="text-xl font-extrabold bg-gradient-to-r from-blue-800 to-blue-600 bg-clip-text text-transparent animate-pulse-slow">
                LifeLink Admin
              </span>
            </div>

            {/* Nav Tabs */}
            <div className="hidden lg:flex space-x-1 bg-slate-200/50 p-1 rounded-xl border border-white/60">
              {[
                { id: 'emergency', name: 'Emergency Hub', icon: '🚨' },
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

            {/* Profile Info Badge */}
            <div className="flex items-center space-x-4">
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

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8 w-full flex-grow relative z-10">
        
        {/* Dynamic Mobile Nav Header */}
        <div className="flex lg:hidden overflow-x-auto gap-2 pb-4 mb-6 scrollbar-none">
          {[
            { id: 'emergency', name: 'Emergency', icon: '🚨' },
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
          
          {/* Card 1: Critical Alerts */}
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

          {/* Card 2: Eligible Donors Nearby */}
          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">Active Donors (5-10km)</span>
              <span className="text-xl">👥</span>
            </div>
            <div>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black tracking-tight text-slate-800">
                  {donors.filter(d => d.distance <= 10 && d.eligible && d.status === 'Available').length}
                </span>
                <span className="text-xs font-bold text-slate-400 uppercase">Eligible & Ready</span>
              </div>
              <p className="text-slate-500 text-xs mt-2 font-semibold">
                Within direct response zone. Ready for dispatch.
              </p>
            </div>
          </div>

          {/* Card 3: Stock Inventory Highlights */}
          <div className="custom-glass p-6 rounded-2xl flex flex-col justify-between shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-widest bg-amber-50 px-2.5 py-1 rounded-full border border-amber-100 font-semibold">Stock Health</span>
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
                O- and AB- stocks require replenishment.
              </p>
            </div>
          </div>

        </div>

        {/* Tab Panel Content */}
        
        {/* TAB 1: EMERGENCY HUB */}
        {activeTab === 'emergency' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Call to action & header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/60 p-6 rounded-2xl border border-white">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Emergency Blood Dispatch Hub</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">Initiate instant broadcasts to nearby registered donors for patients in surgery or emergency wards.</p>
              </div>
              <button
                onClick={() => setShowRequestModal(true)}
                className="px-5 py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center space-x-2 text-xs uppercase tracking-wider"
              >
                <span>➕</span>
                <span>Send Emergency Blood Request</span>
              </button>
            </div>

            {/* Active Request Tracker */}
            <div className="custom-glass rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 mr-2 animate-ping" />
                Active Donation Cycles & Tracker Pipelines
              </h3>

              {activeRequests.length === 0 ? (
                <div className="text-center py-12 bg-white/40 border border-slate-100 rounded-2xl">
                  <span className="text-3xl">🎉</span>
                  <p className="text-sm font-bold text-slate-500 mt-2">All emergency requests completed and stabilized.</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {activeRequests.map((req) => (
                    <div key={req.id} className="bg-white/70 border border-slate-200 p-5 rounded-2xl shadow-sm flex flex-col space-y-4">
                      
                      {/* Top row info */}
                      <div className="flex flex-wrap justify-between items-start gap-4 pb-3 border-b border-slate-100">
                        <div>
                          <div className="flex items-center space-x-2.5">
                            <span className="text-sm font-extrabold text-slate-800">{req.patient}</span>
                            <span className={`px-2 py-0.5 text-[10px] font-bold rounded uppercase ${
                              req.urgency === 'Critical' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-amber-50 text-amber-600 border border-amber-100'
                            }`}>{req.urgency}</span>
                            <span className="px-2 py-0.5 text-[10px] bg-slate-100 border border-slate-200 text-slate-600 font-bold rounded">{req.ward}</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-1 font-semibold">Notes: <span className="italic text-slate-700">{req.notes || 'None'}</span></p>
                        </div>
                        <div className="text-right flex items-center space-x-4">
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Required Blood</p>
                            <p className="text-sm font-black text-red-600">{req.bloodType} &bull; {req.units} Units</p>
                          </div>
                          <div>
                            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Donor Assigned</p>
                            <p className="text-xs font-bold text-slate-700 bg-slate-50 px-2 py-1 rounded border border-slate-200">{req.donor}</p>
                          </div>
                        </div>
                      </div>

                      {/* Tracker pipeline status line */}
                      <div className="pt-2">
                        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                          
                          {/* Steps progress */}
                          <div className="flex flex-grow w-full justify-between items-center relative py-2">
                            {/* Connector line */}
                            <div className="absolute left-[3%] right-[3%] top-[40%] h-1 bg-slate-200 z-0 rounded-full" />
                            <div className="absolute left-[3%] top-[40%] h-1 bg-red-600 z-0 rounded-full transition-all duration-500" style={{ width: `${(req.step / 4) * 94}%` }} />

                            {[
                              { label: 'Broadcast Sent', icon: '📢' },
                              { label: 'Donor Accepted', icon: '🤝' },
                              { label: 'In-Transit', icon: '🚑' },
                              { label: 'Arrived', icon: '🏥' },
                              { label: 'Completed', icon: '✓' }
                            ].map((stepItem, sIdx) => {
                              const isActive = sIdx <= req.step;
                              const isCurrent = sIdx === req.step;
                              return (
                                <div key={sIdx} className="flex flex-col items-center z-10">
                                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shadow-sm transition-all duration-300 ${
                                    isCurrent ? 'bg-red-600 text-white scale-110 ring-4 ring-red-500/10 pulse-dot' :
                                    isActive ? 'bg-red-50 text-red-600 border border-red-200' :
                                    'bg-slate-100 text-slate-400 border border-slate-200'
                                  }`}>
                                    <span>{stepItem.icon}</span>
                                  </div>
                                  <span className={`text-[9px] font-bold mt-1.5 transition-colors uppercase tracking-wide ${
                                    isCurrent ? 'text-red-600 font-black' :
                                    isActive ? 'text-slate-700' :
                                    'text-slate-400'
                                  }`}>
                                    {stepItem.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>

                          {/* Controller button */}
                          <button
                            onClick={() => advanceRequestStep(req.id)}
                            className="px-4 py-2.5 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200 hover:border-slate-300 transition-all flex items-center space-x-1.5 shadow-sm whitespace-nowrap self-end sm:self-center"
                          >
                            <span>⚙️</span>
                            <span>
                              {req.step === 0 ? 'Accept Donor' :
                               req.step === 1 ? 'Start Transit' :
                               req.step === 2 ? 'Mark Arrived' :
                               'Verify & Complete'}
                            </span>
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: INTERACTIVE DONOR MAP */}
        {activeTab === 'map' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="bg-white/60 p-6 rounded-2xl border border-white flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Interactive Live Donor Map</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">Visualize nearby registered donors. Filter by radius, compatibility, and readiness. Dispatch couriers instantly.</p>
              </div>
              
              {/* Map Filters */}
              <div className="flex flex-wrap gap-2.5">
                <div>
                  <label className="block text-[9px] font-bold text-slate-400 uppercase mb-1">Radius (Distance)</label>
                  <select 
                    value={mapRadius} 
                    onChange={(e) => setMapRadius(Number(e.target.value))}
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
                    onChange={(e) => setMapBloodType(e.target.value)}
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
                    onChange={(e) => setMapAvailability(e.target.value)}
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

            {/* Map Plot & Details Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Map Canvas */}
              <div className="lg:col-span-2 custom-glass border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col justify-between min-h-[450px] relative">
                
                {/* SVG Visual Radar/Grid Map */}
                <div className="w-full flex-grow relative bg-slate-50/70 rounded-xl border border-slate-200/60 overflow-hidden flex items-center justify-center p-4 min-h-[380px]">
                  
                  {/* Distance Rings */}
                  <svg className="absolute w-full h-full inset-0 pointer-events-none z-0" viewBox="0 0 100 100" preserveAspectRatio="none">
                    {/* Radar sweep line */}
                    <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(59, 130, 246, 0.1)" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(239, 68, 68, 0.08)" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(59, 130, 246, 0.06)" strokeWidth="0.5" />
                    
                    {/* Compass marks */}
                    <line x1="50" y1="0" x2="50" y2="100" stroke="rgba(0, 0, 0, 0.03)" strokeWidth="0.2" strokeDasharray="2,2" />
                    <line x1="0" y1="50" x2="100" y2="50" stroke="rgba(0, 0, 0, 0.03)" strokeWidth="0.2" strokeDasharray="2,2" />
                  </svg>

                  {/* Distance Scale Labels */}
                  <div className="absolute top-[35%] left-[52%] text-[8px] font-bold text-slate-400 pointer-events-none">5 km</div>
                  <div className="absolute top-[20%] left-[52%] text-[8px] font-bold text-slate-400 pointer-events-none">10 km</div>
                  <div className="absolute top-[5%] left-[52%] text-[8px] font-bold text-slate-400 pointer-events-none">20 km</div>

                  {/* Hospital Icon Node in Center */}
                  <div className="absolute left-[50%] top-[50%] -translate-x-1/2 -translate-y-1/2 z-10 flex flex-col items-center">
                    <div className="w-8 h-8 rounded-full bg-red-600 border-2 border-white flex items-center justify-center shadow-md cursor-default">
                      <span className="text-sm">🏥</span>
                    </div>
                    <span className="text-[9px] bg-white border border-slate-200 px-2 py-0.5 rounded-full text-slate-700 font-extrabold uppercase mt-1 whitespace-nowrap shadow-sm">ST. JUDE</span>
                  </div>

                  {/* Donor Nodes */}
                  {filteredDonors.map((donor) => {
                    // Position mapping
                    const leftPos = `${donor.lng}%`;
                    const topPos = `${donor.lat}%`;
                    const isSelected = selectedDonor && selectedDonor.id === donor.id;
                    const statusColor = 
                      donor.status === 'Available' ? 'bg-emerald-500' :
                      donor.status === 'In-Transit' ? 'bg-blue-500 animate-pulse' : 'bg-red-500';

                    return (
                      <button
                        key={donor.id}
                        onClick={() => setSelectedDonor(donor)}
                        style={{ left: leftPos, top: topPos }}
                        className="absolute -translate-x-1/2 -translate-y-1/2 z-20 group focus:outline-none"
                      >
                        <div className="relative flex items-center justify-center">
                          {/* Pulse Ring */}
                          {donor.status === 'Available' && (
                            <span className="absolute inline-flex h-6 w-6 rounded-full bg-emerald-500/20 animate-ping" />
                          )}
                          
                          {/* Pin Point */}
                          <div className={`w-5.5 h-5.5 rounded-full ${statusColor} border-2 border-white flex items-center justify-center shadow-md transition-all duration-300 ${
                            isSelected ? 'scale-130 ring-2 ring-red-500 z-30' : 'group-hover:scale-115'
                          }`}>
                            <span className="text-[7.5px] font-black text-white uppercase">{donor.bloodType}</span>
                          </div>

                          {/* Hover Tooltip name */}
                          <div className="absolute bottom-6 bg-slate-900 text-white text-[8px] font-bold px-2 py-0.5 rounded shadow-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                            {donor.name} ({donor.distance} km)
                          </div>
                        </div>
                      </button>
                    );
                  })}

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

              {/* Side Panel: Selected Donor Profile */}
              <div className="custom-glass rounded-2xl p-6 shadow-sm flex flex-col justify-between min-h-[400px]">
                {selectedDonor ? (
                  <div className="space-y-6 animate-fadeIn">
                    
                    <div className="border-b border-slate-100 pb-4">
                      <div className="flex justify-between items-start">
                        <h3 className="text-md font-extrabold text-slate-950">{selectedDonor.name}</h3>
                        <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-3 py-1 rounded-lg uppercase">
                          Type {selectedDonor.bloodType}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1 font-bold">Donor ID: {selectedDonor.id}</p>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Proximity Range:</span>
                        <strong className="text-slate-700">{selectedDonor.distance} km away</strong>
                      </div>
                      
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Availability Status:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          selectedDonor.status === 'Available' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                          selectedDonor.status === 'In-Transit' ? 'bg-blue-50 text-blue-600 border border-blue-100 animate-pulse' :
                          'bg-red-50 text-red-600 border border-red-100'
                        }`}>
                          {selectedDonor.status}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Last Donation:</span>
                        <strong className="text-slate-700">{selectedDonor.lastDonated}</strong>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Eligibility Check:</span>
                        <span className={`font-bold ${selectedDonor.eligible ? 'text-emerald-600' : 'text-red-500'}`}>
                          {selectedDonor.eligible ? '✓ Eligible for Donation' : '🗙 Ineligible (90-day timer)'}
                        </span>
                      </div>

                      <div className="flex justify-between text-xs">
                        <span className="text-slate-400 font-bold">Secure Contact:</span>
                        <strong className="text-slate-700">{selectedDonor.phone}</strong>
                      </div>
                    </div>

                    <div className="border-t border-slate-100 pt-5 space-y-2">
                      <button
                        onClick={() => dispatchDonorFromMap(selectedDonor)}
                        disabled={!selectedDonor.eligible || selectedDonor.status !== 'Available'}
                        className={`w-full py-3 rounded-xl text-xs font-bold uppercase tracking-wider transition-all shadow-sm ${
                          selectedDonor.eligible && selectedDonor.status === 'Available'
                            ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-500/10'
                            : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                        }`}
                      >
                        ⚡ Dispatch Push Notification
                      </button>
                      <button
                        onClick={() => {
                          setVerificationDonorId(selectedDonor.id);
                          setActiveTab('verification');
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
                    <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">View detailed profile data, proximity metrics, and trigger direct notification requests.</p>
                  </div>
                )}
                
                <button
                  onClick={() => setSelectedDonor(null)}
                  className="mt-4 text-[10px] font-bold text-slate-400 hover:underline hover:text-red-500"
                >
                  Clear Selection
                </button>
              </div>

            </div>
          </div>
        )}

        {/* TAB 3: INVENTORY MANAGEMENT */}
        {activeTab === 'inventory' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Action Bar */}
            <div className="flex justify-between items-center bg-white/60 p-6 rounded-2xl border border-white">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Blood Bank Reserve Inventory</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">Monitor live bags on site. Log fresh donor packages and flag expired batches.</p>
              </div>
              <button
                onClick={() => setShowAddStockModal(true)}
                className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold rounded-xl border border-slate-200 transition-all flex items-center space-x-2 text-xs uppercase tracking-wider shadow-sm"
              >
                <span>📥</span>
                <span>Log Incoming Donation</span>
              </button>
            </div>

            {/* Inventory Units Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {inventory.map((inv) => {
                const isCritical = inv.status === 'Critical';
                const isLow = inv.status === 'Low';
                
                return (
                  <div key={inv.type} className="custom-glass p-5 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm hover:shadow transition-all border border-slate-200">
                    
                    {/* Backing color visual filler */}
                    <div className={`absolute bottom-0 left-0 right-0 h-1 ${
                      isCritical ? 'bg-red-500 animate-pulse' :
                      isLow ? 'bg-amber-500' : 'bg-emerald-500'
                    }`} />

                    <div className="flex justify-between items-start">
                      <span className="text-md font-black text-slate-800">{inv.type}</span>
                      <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                        isCritical ? 'bg-red-50 border-red-200 text-red-600' :
                        isLow ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        'bg-emerald-50 border-emerald-200 text-emerald-600'
                      }`}>
                        {inv.status}
                      </span>
                    </div>

                    <div className="mt-4 flex items-baseline space-x-1">
                      <span className="text-4xl font-black tracking-tight text-slate-900">{inv.units}</span>
                      <span className="text-[10px] text-slate-400 font-extrabold uppercase">Units</span>
                    </div>

                    {/* Stock level quick adjust */}
                    <div className="flex space-x-1.5 mt-4 pt-3 border-t border-slate-100">
                      <button
                        onClick={() => {
                          const nextInv = inventory.map(item => {
                            if (item.type === inv.type) {
                              const units = Math.max(0, item.units - 1);
                              return { ...item, units, status: units > 10 ? 'Optimal' : units > 5 ? 'Low' : 'Critical' };
                            }
                            return item;
                          });
                          setInventory(nextInv);
                          saveToLocalStorage(nextInv, null, null, null, null);
                        }}
                        className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 text-xs font-bold rounded-lg border border-slate-200"
                      >
                        -1u
                      </button>
                      <button
                        onClick={() => {
                          const nextInv = inventory.map(item => {
                            if (item.type === inv.type) {
                              const units = item.units + 1;
                              return { ...item, units, status: units > 10 ? 'Optimal' : units > 5 ? 'Low' : 'Critical' };
                            }
                            return item;
                          });
                          setInventory(nextInv);
                          saveToLocalStorage(nextInv, null, null, null, null);
                        }}
                        className="flex-1 py-1 bg-slate-50 hover:bg-slate-100 text-slate-650 text-xs font-bold rounded-lg border border-slate-200"
                      >
                        +1u
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Inventory Batches Table & Controls */}
            <div className="custom-glass rounded-2xl p-6 shadow-sm">
              <h3 className="text-sm font-bold text-slate-900 mb-4 flex items-center">
                <span>📋</span>
                <span className="ml-2">Specific Batches & Blood Packs Tracker</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 font-bold tracking-wider">
                      <th className="pb-3 pl-3">Batch ID</th>
                      <th className="pb-3">Blood Type</th>
                      <th className="pb-3">Units</th>
                      <th className="pb-3">Expiry Date</th>
                      <th className="pb-3">Batch Status</th>
                      <th className="pb-3 pr-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {batches.map((batch) => {
                      const isExpired = batch.status === 'Expired' || new Date(batch.expiry) < new Date();
                      const isExpiringSoon = batch.status === 'Expiring Soon';

                      return (
                        <tr key={batch.id} className="hover:bg-slate-50/40 transition-colors">
                          <td className="py-4 pl-3 font-mono text-xs font-bold text-slate-600">
                            {batch.id}
                          </td>
                          <td className="py-4">
                            <span className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 px-2.5 py-1 rounded-lg">
                              Type {batch.bloodType}
                            </span>
                          </td>
                          <td className="py-4 font-bold text-slate-700 text-xs">
                            {batch.units} Bags (u)
                          </td>
                          <td className={`py-4 text-xs font-semibold ${isExpired ? 'text-red-600 font-bold' : isExpiringSoon ? 'text-amber-600 font-bold' : 'text-slate-500'}`}>
                            {batch.expiry} {isExpired ? '(EXPIRED)' : isExpiringSoon ? '(Expiring Soon)' : ''}
                          </td>
                          <td className="py-4">
                            <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded border ${
                              isExpired ? 'bg-red-50 text-red-600 border-red-200' :
                              isExpiringSoon ? 'bg-amber-50 text-amber-600 border-amber-200 animate-pulse' :
                              'bg-emerald-50 text-emerald-600 border-emerald-200'
                            }`}>
                              {isExpired ? 'Expired' : batch.status}
                            </span>
                          </td>
                          <td className="py-4 pr-3 text-right">
                            <button
                              onClick={() => handleDiscardBatch(batch.id)}
                              className="px-3 py-1.5 bg-slate-50 hover:bg-red-50 text-slate-600 hover:text-red-650 border border-slate-200 hover:border-red-200 text-[10px] font-bold rounded-lg transition-all"
                            >
                              Discard & Deduct
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* TAB 4: DONOR VERIFICATION */}
        {activeTab === 'verification' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
            
            {/* Check-In Form */}
            <div className="lg:col-span-2 custom-glass rounded-2xl p-6 shadow-sm flex flex-col justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900 mb-2 flex items-center">
                  <span>📋</span>
                  <span className="ml-2">Donor Check-in & Verification</span>
                </h2>
                <p className="text-xs text-slate-500 font-semibold mb-6">Verify arriving donors at the triage center. Record actual blood volume collected, reset eligibility timers, and mark requests completed.</p>

                <form onSubmit={handleVerifyCheckIn} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Verify Donor (Select/Input ID or Name)</label>
                    <select
                      value={verificationDonorId}
                      onChange={(e) => setVerificationDonorId(e.target.value)}
                      required
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700"
                    >
                      <option value="">-- Choose Arrived Donor --</option>
                      {donors.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.id}) - Type {d.bloodType} [Status: {d.status}]
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Volume Extracted (ml)</label>
                      <input
                        type="number"
                        value={verificationVolume}
                        onChange={(e) => setVerificationVolume(parseInt(e.target.value))}
                        placeholder="e.g. 450"
                        required
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Estimated Unit Output</label>
                      <input
                        type="text"
                        disabled
                        value={`${Math.round((verificationVolume / 450) * 100) / 100} Bags (~1u)`}
                        className="w-full px-4 py-3 bg-slate-100 border border-slate-200 rounded-xl text-sm text-slate-500 cursor-not-allowed font-semibold"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Verification / Clinical Notes</label>
                    <textarea
                      value={verificationNotes}
                      onChange={(e) => setVerificationNotes(e.target.value)}
                      placeholder="e.g. Cleared pre-screening, pulse stable, vitals optimal."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-700"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider transition-all shadow-md shadow-red-500/10"
                  >
                    ✓ Complete Check-in & Log Blood Donation
                  </button>
                </form>
              </div>

              <div className="border-t border-slate-100 pt-6 mt-6">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">90-Day Eligibility Rule</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                  Completing check-in will automatically flag this donor as "Recently Donated". This triggers an automated 90-day block on their availability, ensuring compliance with clinical safety windows.
                </p>
              </div>
            </div>

            {/* Quick Check-in Queue summary */}
            <div className="custom-glass rounded-2xl p-6 shadow-sm flex flex-col justify-between border border-slate-200">
              <div>
                <h3 className="text-sm font-bold text-slate-900 mb-4">📢 Dispatched Donor Status</h3>
                <div className="space-y-4">
                  {donors.filter(d => d.status === 'In-Transit' || d.status === 'Arrived').map(donor => (
                    <div key={donor.id} className="p-4 bg-white/70 border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                      <div className="flex items-center space-x-3">
                        <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-sm shadow-inner">
                          {donor.status === 'Arrived' ? '🏥' : '🚑'}
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-800">{donor.name}</p>
                          <span className="text-[9px] text-slate-500 font-bold uppercase">ID: {donor.id} &bull; Type {donor.bloodType}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase border ${
                          donor.status === 'Arrived' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-blue-600 border-blue-100 animate-pulse'
                        }`}>
                          {donor.status}
                        </span>
                        
                        <button
                          onClick={() => {
                            setVerificationDonorId(donor.id);
                          }}
                          className="block mt-2 text-[9px] font-bold text-red-500 hover:underline"
                        >
                          Fill Form
                        </button>
                      </div>
                    </div>
                  ))}
                  {donors.filter(d => d.status === 'In-Transit' || d.status === 'Arrived').length === 0 && (
                    <p className="text-xs text-slate-500 text-center py-8">No donors are currently in transit or waiting at check-in.</p>
                  )}
                </div>
              </div>

              <div className="bg-white/50 border border-slate-200 p-4 rounded-xl mt-4">
                <h4 className="text-xs font-bold text-slate-500 uppercase">Emergency Protocol</h4>
                <p className="text-[10px] text-slate-500 mt-1 leading-relaxed font-semibold">
                  In case of urgent walk-in donors not listed in the directory, log their registration first using the registry system, or input custom ID DN-TEMP for fast tracking.
                </p>
              </div>
            </div>

          </div>
        )}

        {/* TAB 5: REPORTS & HISTORY */}
        {activeTab === 'reports' && (
          <div className="space-y-8 animate-fadeIn">
            
            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white/60 p-6 rounded-2xl border border-white gap-4 shadow-sm">
              <div>
                <h2 className="text-lg font-extrabold text-slate-900">Coordination Reports & Fulfillment History</h2>
                <p className="text-xs text-slate-500 font-semibold mt-1">Download official audits, track average donor response speeds, and check stock distribution logs.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={downloadCSVReport}
                  className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <span>📊</span>
                  <span>Export CSV</span>
                </button>
                <button
                  onClick={downloadPDFReport}
                  className="px-4 py-2.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-xl text-xs uppercase tracking-wider transition-all flex items-center space-x-1.5 shadow-sm"
                >
                  <span>📄</span>
                  <span>Print PDF Report</span>
                </button>
              </div>
            </div>

            {/* Performance charts mockup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Response Time Chart */}
              <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4">⏱️ Avg. Donor Response Time (by blood type)</h3>
                <div className="space-y-3.5">
                  {[
                    { type: 'O-', min: 8, pct: 35 },
                    { type: 'A+', min: 14, pct: 60 },
                    { type: 'B-', min: 18, pct: 75 },
                    { type: 'AB-', min: 22, pct: 90 }
                  ].map((chartRow) => (
                    <div key={chartRow.type} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>Group {chartRow.type}</span>
                        <strong className="text-slate-700">{chartRow.min} minutes average</strong>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div className="bg-red-500 h-full rounded-full" style={{ width: `${chartRow.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fulfilled volume share */}
              <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
                <h3 className="text-sm font-bold text-slate-800 mb-4">📈 Weekly Blood Volume Distribution (Units)</h3>
                <div className="space-y-3.5">
                  {[
                    { type: 'Emergency Surgery Allocation', units: 14, pct: 75, color: 'bg-red-500' },
                    { type: 'Surgical Wards Staged Reserves', units: 8, pct: 45, color: 'bg-blue-500' },
                    { type: 'Trauma & Triage Direct Dispense', units: 6, pct: 30, color: 'bg-amber-500' }
                  ].map((chartRow) => (
                    <div key={chartRow.type} className="space-y-1">
                      <div className="flex justify-between text-xs font-semibold text-slate-500">
                        <span>{chartRow.type}</span>
                        <strong className="text-slate-700">{chartRow.units} Units</strong>
                      </div>
                      <div className="w-full bg-slate-100 h-2.5 rounded-full overflow-hidden border border-slate-200">
                        <div className={`${chartRow.color} h-full rounded-full`} style={{ width: `${chartRow.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Past Request Log Table */}
            <div className="custom-glass rounded-2xl p-6 shadow-sm border border-slate-200">
              <h3 className="text-md font-bold text-slate-900 mb-4 flex items-center">
                <span>🕰️</span>
                <span className="ml-2">Fulfilled Request Audit History</span>
              </h3>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-200 text-xs uppercase text-slate-400 font-bold tracking-wider">
                      <th className="pb-3 pl-3">Case ID</th>
                      <th className="pb-3">Date</th>
                      <th className="pb-3">Patient</th>
                      <th className="pb-3">Blood Type</th>
                      <th className="pb-3">Units</th>
                      <th className="pb-3">Urgency</th>
                      <th className="pb-3">Verified Donor</th>
                      <th className="pb-3">Response Time</th>
                      <th className="pb-3 pr-3 text-right">Fulfillment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {history.map((row) => (
                      <tr key={row.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="py-4 pl-3 font-mono text-xs font-bold text-slate-600">
                          {row.id}
                        </td>
                        <td className="py-4 text-xs font-semibold text-slate-500">
                          {row.date}
                        </td>
                        <td className="py-4 text-xs font-bold text-slate-700">
                          {row.patient}
                        </td>
                        <td className="py-4">
                          <span className="text-xs font-bold text-red-650 bg-red-50 border border-red-100 px-2 py-0.5 rounded-md">
                            {row.bloodType}
                          </span>
                        </td>
                        <td className="py-4 font-bold text-slate-700 text-xs">
                          {row.units} u
                        </td>
                        <td className="py-4">
                          <span className={`text-[9px] font-bold uppercase px-2 py-0.5 rounded border ${
                            row.urgency === 'Critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-500 border-slate-200'
                          }`}>
                            {row.urgency}
                          </span>
                        </td>
                        <td className="py-4 text-xs font-semibold text-slate-750">
                          {row.donor}
                        </td>
                        <td className="py-4 text-xs font-bold text-slate-400">
                          {row.responseTime}
                        </td>
                        <td className="py-4 pr-3 text-right text-emerald-600 text-xs font-bold">
                          ✓ Completed
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="w-full relative z-10 mt-12 bg-white/30 border-t border-slate-200/60 backdrop-blur">
        <Footer />
      </footer>

      {/* MODAL 1: EMERGENCY BLOOD REQUEST MODAL */}
      {showRequestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setShowRequestModal(false)} />
          
          <div className="relative bg-white border border-slate-200 max-w-md w-full rounded-[2rem] shadow-2xl p-6 overflow-hidden animate-slideUp text-slate-800">
            <h3 className="text-lg font-black text-slate-950 mb-2 flex items-center space-x-1.5">
              <span>🚨</span>
              <span>New Emergency Blood Sourcing</span>
            </h3>
            <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-5">Broadcast push notification to active nearby donors</p>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Patient Name</label>
                <input 
                  type="text" 
                  value={newRequest.patient}
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
                    value={newRequest.ward}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, ward: e.target.value }))}
                    placeholder="e.g. ICU Bed 3"
                    required
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Required Blood</label>
                  <select 
                    value={newRequest.bloodType}
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
                    value={newRequest.units}
                    min={1}
                    max={10}
                    onChange={(e) => setNewRequest(prev => ({ ...prev, units: e.target.value }))}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Urgency Level</label>
                  <select 
                    value={newRequest.urgency}
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
                <label className="block text-xs font-bold text-slate-505 uppercase mb-1">Emergency Medical Details</label>
                <textarea 
                  value={newRequest.notes}
                  onChange={(e) => setNewRequest(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Include surgical reasons or specific donor matching prerequisites..."
                  rows={2}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 rounded-xl text-sm text-slate-800"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowRequestModal(false)}
                  className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-650 hover:text-slate-800 font-bold rounded-xl text-xs uppercase tracking-wide transition-all border border-slate-200"
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
      )}

      {/* MODAL 2: LOG INCOMING DONATION (ADD STOCK) */}
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