import React from 'react';
import { useNavigate } from 'react-router-dom';

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const hospital = JSON.parse(localStorage.getItem('hospital')||'{}');
  const handleLogout = () => {
    localStorage.removeItem('hospital');
    navigate('/login/hospital')
  }
  return (
    <div style={{ padding: '40px', fontFamily: 'sans-serif' }}>
      <h1>🎉 Hospital Dashboard (Logged In)</h1>
      <p>Welcome, <strong>{hospital.name || hospital.email || 'Hospital'}</strong>!</p>
      <p>Your authentication was successful.</p>
      <button onClick={handleLogout} style={{ padding: '8px 16px', cursor: 'pointer' }}>
        Log Out
      </button>
    </div>
  );
};

export default HospitalDashboard;