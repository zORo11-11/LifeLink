import React from 'react';
import { Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import HospitalLogin from './pages/HospitalLogin';
import HospitalRegister from './pages/HospitalRegister';
import DonorLogin from './pages/DonorLogin';
import DonorRegister from './pages/DonorRegister';

import DonorDashboard from './pages/DonorDashboard';
import HospitalDashboard from './pages/HospitalDashboard';

import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
    <AuthProvider>
      <SocketProvider>
        <div className="min-h-screen">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/login/hospital" element={<HospitalLogin />} />
            <Route path="/register/hospital" element={<HospitalRegister />} />
            <Route path="/login/donor" element={<DonorLogin />} />
            <Route path="/register/donor" element={<DonorRegister />} />
            
            {/* Protected Verification Dashboards */}
            <Route 
              path="/dashboard/donor" 
              element={
                <ProtectedRoute requiredRole="donor">
                  <DonorDashboard />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/dashboard/hospital" 
              element={
                <ProtectedRoute requiredRole="hospital">
                  <HospitalDashboard />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </SocketProvider>
    </AuthProvider>
  );
}

export default App;