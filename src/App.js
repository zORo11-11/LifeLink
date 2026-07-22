import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HospitalLogin from './pages/HospitalLogin';
import HospitalRegister from './pages/HospitalRegister';
import DonorLogin from './pages/DonorLogin';
import DonorRegister from './pages/DonorRegister';

function App() {
  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login/hospital" element={<HospitalLogin />} />
        <Route path="/register/hospital" element={<HospitalRegister />} />
        <Route path="/login/donor" element={<DonorLogin />} />
        <Route path="/register/donor" element={<DonorRegister />} />
      </Routes>
    </div>
  );
}

export default App;