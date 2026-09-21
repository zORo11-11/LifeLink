import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Button from '../components/Button';
import Footer from '../components/Footer';
import hospitalBg from '../assets/hospital_background.png';

const HospitalLogin = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }
    
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm()) {
      setLoading(true);

      try {
        const data = await api.post('/api/hospitals/login', {
          email: formData.email,
          password: formData.password,
        });

        if (data.success && data.hospital) {
          setLoading(false);
          setSuccess(true);
          login(data.hospital, data.token, 'hospital');

          setTimeout(() => {
            navigate('/dashboard/hospital');
          }, 800);
        } else {
          setLoading(false);
          alert(data.message || 'Invalid email or password.');
        }
      } catch (error) {
        setLoading(false);
        console.error('Login error:', error);
        alert('Cannot connect to server. Check if backend is running.');
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
<div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800">
      {/* Login Screen Main Area */} 
      <main className="flex-1 flex items-center justify-center bg-white/20 backdrop-blur-xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 relative w-full"> 
        
        {/* ECG Graph Grid Background */}
        <div className="absolute inset-0 pointer-events-none opacity-[0.25]" style={{
          backgroundImage: `linear-gradient(to right, rgba(96, 165, 250, 0.08) 1px, transparent 1px),
                            linear-gradient(to bottom, rgba(96, 165, 250, 0.08) 1px, transparent 1px)`,
          backgroundSize: '24px 24px'
        }} />

        {/* ECG Heartbeat Lines with Advanced Glow */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-30">
          <svg className="w-full h-48 text-blue-500" viewBox="0 0 1600 200" preserveAspectRatio="none">
            <defs>
              <filter id="super-glow-blue" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="5" result="blur1" />
                <feGaussianBlur stdDeviation="10" result="blur2" />
                <feMerge>
                  <feMergeNode in="blur2" />
                  <feMergeNode in="blur1" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>
            <style>{`
              @keyframes ekg-sweep {
                0% { stroke-dashoffset: 1600; }
                100% { stroke-dashoffset: 0; }
              }
              .ekg-pulse-glow {
                stroke-dasharray: 150 1450;
                animation: ekg-sweep 6s linear infinite;
              }
            `}</style>
            <path 
              d="M 0 100 L 200 100 C 210 100, 215 85, 220 85 C 225 85, 230 100, 240 100 L 270 100 L 280 115 L 295 20 L 310 160 L 320 100 L 350 100 C 365 100, 375 75, 385 75 C 395 75, 405 100, 420 100 L 600 100 C 610 100, 615 85, 620 85 C 625 85, 630 100, 640 100 L 670 100 L 680 115 L 695 20 L 710 160 L 720 100 L 750 100 C 765 100, 775 75, 785 75 C 795 75, 805 100, 820 100 L 1000 100 C 1010 100, 1015 85, 1020 85 C 1025 85, 1030 100, 1040 100 L 1070 100 L 1080 115 L 1095 20 L 1110 160 L 1120 100 L 1150 100 C 1165 100, 1175 75, 1185 75 C 1195 75, 1205 100, 1220 100 L 1600 100" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              className="opacity-15"
            />
            <path 
              d="M 0 100 L 200 100 C 210 100, 215 85, 220 85 C 225 85, 230 100, 240 100 L 270 100 L 280 115 L 295 20 L 310 160 L 320 100 L 350 100 C 365 100, 375 75, 385 75 C 395 75, 405 100, 420 100 L 600 100 C 610 100, 615 85, 620 85 C 625 85, 630 100, 640 100 L 670 100 L 680 115 L 695 20 L 710 160 L 720 100 L 750 100 C 765 100, 775 75, 785 75 C 795 75, 805 100, 820 100 L 1000 100 C 1010 100, 1015 85, 1020 85 C 1025 85, 1030 100, 1040 100 L 1070 100 L 1080 115 L 1095 20 L 1110 160 L 1120 100 L 1150 100 C 1165 100, 1175 75, 1185 75 C 1195 75, 1205 100, 1220 100 L 1600 100" 
              fill="none" 
              stroke="#2563EB" 
              strokeWidth="4.5" 
              className="ekg-pulse-glow"
              filter="url(#super-glow-blue)"
            />
            <path 
              d="M 0 100 L 200 100 C 210 100, 215 85, 220 85 C 225 85, 230 100, 240 100 L 270 100 L 280 115 L 295 20 L 310 160 L 320 100 L 350 100 C 365 100, 375 75, 385 75 C 395 75, 405 100, 420 100 L 600 100 C 610 100, 615 85, 620 85 C 625 85, 630 100, 640 100 L 670 100 L 680 115 L 695 20 L 710 160 L 720 100 L 750 100 C 765 100, 775 75, 785 75 C 795 75, 805 100, 820 100 L 1000 100 C 1010 100, 1015 85, 1020 85 C 1025 85, 1030 100, 1040 100 L 1070 100 L 1080 115 L 1095 20 L 1110 160 L 1120 100 L 1150 100 C 1165 100, 1175 75, 1185 75 C 1195 75, 1205 100, 1220 100 L 1600 100" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="1.5" 
              className="ekg-pulse-glow opacity-95"
            />
          </svg>
        </div>

        {/* Compact Card Component Container */}
        <div className="max-w-[400px] w-full relative z-10 my-auto"> 
          <div className="bg-white/80 backdrop-blur-md border border-white/70 rounded-3xl shadow-xl py-6 px-6 sm:px-8 flex flex-col justify-between transition-all duration-300"> 
            <div className="flex-1 flex flex-col justify-between"> 
              
              {/* Hospital Icon Badge */}
              <div className="relative mx-auto w-16 h-16 mb-2 flex items-center justify-center">
                <div className="w-14 h-14 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center shadow-sm">
                  <svg className="w-8 h-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14M7 21V9a2 2 0 012-2h6a2 2 0 012 2v12" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h1M14 10h1M9 13h1M14 13h1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 21v-3a1 1 0 011-1h0a1 1 0 011 1v3" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-4"> 
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">
                  Hospital Login
                </h2> 
                <p className="text-slate-400 text-xs font-medium mt-0.5">
                  Welcome back! Please login to continue
                </p> 
              </div> 

              {success && (
                <div className="mb-3 p-2.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-center text-xs font-semibold"> 
                  Login successful! Redirecting... 
                </div> 
              )} 

              <form onSubmit={handleSubmit} className="space-y-3"> 
                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      required 
                      placeholder="Email or Hospital ID" 
                      className="w-full pl-10 pr-4 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-xs bg-slate-50/50 text-slate-700 placeholder-slate-400 transition-all font-medium"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] font-semibold mt-1 pl-3">{errors.email}</p>}
                </div>

                <div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </span>
                    <input 
                      type={showPassword ? 'text' : 'password'} 
                      name="password" 
                      value={formData.password} 
                      onChange={handleChange} 
                      required 
                      placeholder="Password" 
                      className="w-full pl-10 pr-10 py-2.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-xl text-xs bg-slate-50/50 text-slate-700 placeholder-slate-400 transition-all font-medium"
                    />
                    <span 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </span>
                  </div>
                  {errors.password && <p className="text-red-500 text-[10px] font-semibold mt-1 pl-3">{errors.password}</p>}
                </div>

                <div className="text-right py-1"> 
                  <Link to="/forgot-password/hospital" className="text-[11px] font-bold text-blue-600 hover:underline"> 
                    Forgot Password? 
                  </Link> 
                </div>

                <div className="pt-1"> 
                  <Button 
                    type="submit" 
                    variant="primary" 
                    loading={loading} 
                    className="w-full text-white font-semibold py-2.5 rounded-xl shadow-sm hover:shadow transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-xs" 
                  > 
                    Login 
                  </Button> 
                </div> 
              </form>

              <div className="mt-4 text-center pt-3 border-t border-slate-100"> 
                <p className="text-xs text-slate-500 font-semibold"> 
                  New hospital?{' '} 
                  <Link to="/register/hospital" className="font-bold text-blue-600 hover:text-blue-700 underline decoration-blue-300 hover:decoration-blue-600 transition-colors"> 
                    Register Here 
                  </Link> 
                </p> 
              </div> 
            </div> 
          </div> 
        </div> 

      </main> 

      {/* Footer Section */} 
      <Footer /> 
    </div> 
  );
};

export default HospitalLogin;