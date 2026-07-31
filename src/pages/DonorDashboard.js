import React from 'react'
import { useNavigate } from 'react-router-dom'

const DonorDashboard = () => {
  const navigate = useNavigate();
  const donor = JSON.parse(localStorage.getItem('donor')||'{}');
  const handleLogout = () =>{
    localStorage.removeItem('donor');
    navigate('/login/donor');
  };

  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>🎉 Donor Dashboard (Logged In)</h1>
      <p>Welcome, <strong>{donor.name || donor.email || 'Donor'}</strong>!</p>
      <p>Your authentication was successful.</p>
      <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Log Out
      </button>
    </div>
  );
};

export default DonorDashboard;