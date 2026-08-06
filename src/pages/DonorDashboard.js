import React from 'react'
import { useNavigate } from 'react-router-dom'
import Footer from '../components/Footer'


const DonorDashboard = () => {
  const navigate = useNavigate();
  const donor = JSON.parse(localStorage.getItem('donor')||'{}');
  const handleLogout = () =>{
    localStorage.removeItem('donor');
    navigate('/login/donor');
  };

  return (
<div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800">      <h1>🎉 Donor Dashboard (Logged In)</h1>
      <p>Welcome, <strong>{donor.name || donor.email || 'Donor'}</strong>!</p>
      <p>Your authentication was successful.</p>
      <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Log Out
      </button>
      <div className="w-full m-0 p-0"> 
        <Footer /> 
      </div> 
    </div>
  );
};

export default DonorDashboard;