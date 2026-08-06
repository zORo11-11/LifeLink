import React from 'react';
import { useNavigate } from 'react-router-dom';
import Footer from '../components/Footer'; 

const HospitalDashboard = () => {
  const navigate = useNavigate();
  const hospital = JSON.parse(localStorage.getItem('hospital')||'{}');
  const handleLogout = () => {
    localStorage.removeItem('hospital');
    navigate('/login/hospital')
  }
  return (
<div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800">      <h1>🎉 Hospital Dashboard (Logged In)</h1>
      <p>Welcome, <strong>{hospital.name || hospital.email || 'Hospital'}</strong>!</p>
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

export default HospitalDashboard;