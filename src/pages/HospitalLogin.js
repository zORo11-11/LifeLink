import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import Footer from '../components/Footer';
import hospitalBg from '../assets/hospital_background.png';

const HospitalLogin = () => {
  const navigate = useNavigate();
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
        const response = await fetch('http://localhost:5000/api/hospitals/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        });

        const data = await response.json();

        if (response.ok && data.success) {
          setLoading(false);
          setSuccess(true);

          // Save session data
          localStorage.setItem('hospital', JSON.stringify(data.hospital));

          // Redirect to Hospital Dashboard
          setTimeout(() => {
            navigate('/dashboard/hospital');
          }, 1200);
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
    <div 
      className="w-full min-h-screen flex flex-col justify-between"
      style={{
        backgroundImage: `url(${hospitalBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat'
      }}
    > 
      {/* Login Screen Main Wrapper */} 
      <div className="w-full flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative bg-slate-900/[0.05] overflow-hidden"> 
        
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
            {/* Static Dim EKG Path */}
            <path 
              d="M 0 100 L 200 100 C 210 100, 215 85, 220 85 C 225 85, 230 100, 240 100 L 270 100 L 280 115 L 295 20 L 310 160 L 320 100 L 350 100 C 365 100, 375 75, 385 75 C 395 75, 405 100, 420 100 L 600 100 C 610 100, 615 85, 620 85 C 625 85, 630 100, 640 100 L 670 100 L 680 115 L 695 20 L 710 160 L 720 100 L 750 100 C 765 100, 775 75, 785 75 C 795 75, 805 100, 820 100 L 1000 100 C 1010 100, 1015 85, 1020 85 C 1025 85, 1030 100, 1040 100 L 1070 100 L 1080 115 L 1095 20 L 1110 160 L 1120 100 L 1150 100 C 1165 100, 1175 75, 1185 75 C 1195 75, 1205 100, 1220 100 L 1600 100" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              className="opacity-15"
            />
            {/* Animated Glowing EKG Pulse Path - Glow Layer */}
            <path 
              d="M 0 100 L 200 100 C 210 100, 215 85, 220 85 C 225 85, 230 100, 240 100 L 270 100 L 280 115 L 295 20 L 310 160 L 320 100 L 350 100 C 365 100, 375 75, 385 75 C 395 75, 405 100, 420 100 L 600 100 C 610 100, 615 85, 620 85 C 625 85, 630 100, 640 100 L 670 100 L 680 115 L 695 20 L 710 160 L 720 100 L 750 100 C 765 100, 775 75, 785 75 C 795 75, 805 100, 820 100 L 1000 100 C 1010 100, 1015 85, 1020 85 C 1025 85, 1030 100, 1040 100 L 1070 100 L 1080 115 L 1095 20 L 1110 160 L 1120 100 L 1150 100 C 1165 100, 1175 75, 1185 75 C 1195 75, 1205 100, 1220 100 L 1600 100" 
              fill="none" 
              stroke="#2563EB" 
              strokeWidth="4.5" 
              className="ekg-pulse-glow"
              filter="url(#super-glow-blue)"
            />
            {/* Animated Glowing EKG Pulse Path - White-Hot Core Layer */}
            <path 
              d="M 0 100 L 200 100 C 210 100, 215 85, 220 85 C 225 85, 230 100, 240 100 L 270 100 L 280 115 L 295 20 L 310 160 L 320 100 L 350 100 C 365 100, 375 75, 385 75 C 395 75, 405 100, 420 100 L 600 100 C 610 100, 615 85, 620 85 C 625 85, 630 100, 640 100 L 670 100 L 680 115 L 695 20 L 710 160 L 720 100 L 750 100 C 765 100, 775 75, 785 75 C 795 75, 805 100, 820 100 L 1000 100 C 1010 100, 1015 85, 1020 85 C 1025 85, 1030 100, 1040 100 L 1070 100 L 1080 115 L 1095 20 L 1110 160 L 1120 100 L 1150 100 C 1165 100, 1175 75, 1185 75 C 1195 75, 1205 100, 1220 100 L 1600 100" 
              fill="none" 
              stroke="#FFFFFF" 
              strokeWidth="1.5" 
              className="ekg-pulse-glow opacity-95"
            />
          </svg>
        </div>

        {/* Card Component Container */}
        <div className="max-w-[420px] w-full relative z-10"> 
          <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-[2.5rem] shadow-[0_20px_50px_rgba(15,23,42,0.06)] py-12 px-8 sm:px-10 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_25px_70px_rgba(15,23,42,0.09)] hover:border-white/80"> 
            <div className="flex-1 flex flex-col justify-between"> 
              
              {/* Detailed Hospital Icon Badge with Clouds */}
              <div className="relative mx-auto w-24 h-24 mb-3 flex items-center justify-center">
                {/* Cloud left */}
                <svg className="absolute left-[-10px] bottom-6 w-6 h-6 text-blue-300/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M19.305 13A6 6 0 0 0 9 9.365V9.5a3.5 3.5 0 0 0-4.09 3.5H4a4 4 0 0 0 0 8h15a3 3 0 0 0 .305-6z" />
                </svg>
                {/* Cloud right */}
                <svg className="absolute right-[-8px] top-6 w-5 h-5 text-blue-300/40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path d="M19.305 13A6 6 0 0 0 9 9.365V9.5a3.5 3.5 0 0 0-4.09 3.5H4a4 4 0 0 0 0 8h15a3 3 0 0 0 .305-6z" />
                </svg>
                {/* Circle badge */}
                <div className="w-20 h-20 rounded-full bg-blue-50/75 border border-blue-100/60 flex items-center justify-center shadow-inner relative">
                  <svg className="w-11 h-11 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 21h14M7 21V9a2 2 0 012-2h6a2 2 0 012 2v12" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 10h1M14 10h1M9 13h1M14 13h1" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M11 21v-3a1 1 0 011-1h0a1 1 0 011 1v3" />
                    {/* Cross on roof */}
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 2v3M10.5 3.5h3" />
                  </svg>
                </div>
              </div>

              <div className="text-center mb-6"> 
                <h2 className="text-[25px] font-extrabold text-slate-800 tracking-tight">
                  Hospital Login
                </h2> 
                <p className="text-slate-400 text-xs font-semibold mt-1">
                  Welcome back! Please login to continue
                </p> 
              </div> 

              {success && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-lg text-center text-xs font-semibold"> 
                  Login successful! Redirecting... 
                </div> 
              )} 

              <form onSubmit={handleSubmit} className="space-y-4"> 
                <div>
                  {/* Email Input */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-2xl text-[14px] bg-slate-50/20 text-slate-700 placeholder-slate-400 transition-all font-medium"
                    />
                  </div>
                  {errors.email && <p className="text-red-500 text-[10px] font-semibold mt-1 pl-4">{errors.email}</p>}
                </div>

                <div>
                  {/* Password Input */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
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
                      className="w-full pl-12 pr-12 py-3.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 rounded-2xl text-[14px] bg-slate-50/20 text-slate-700 placeholder-slate-400 transition-all font-medium"
                    />
                    <span 
                      onClick={() => setShowPassword(!showPassword)} 
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                    >
                      {showPassword ? (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </span>
                  </div>
                  {errors.password && <p className="text-red-500 text-[10px] font-semibold mt-1 pl-4">{errors.password}</p>}
                </div>

                <div className="text-center py-2"> 
                  <Link to="/forgot-password/hospital" className="text-xs font-bold text-blue-500 hover:underline"> 
                    Forgot Password? 
                  </Link> 
                </div>

                <div className="pt-1"> 
                  <Button 
                    type="submit" 
                    variant="admin" 
                    loading={loading} 
                    className="w-full text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:shadow transition-all duration-200 bg-blue-600 hover:bg-blue-700 text-sm" 
                  > 
                    Login 
                  </Button> 
                </div> 
              </form>

              {/* OR Separator */}
              <div className="relative my-5 flex items-center justify-center">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200/40"></div>
                </div>
                <span className="relative px-3 backdrop-blur-sm bg-white/40 border border-white/40 rounded-full text-[10px] font-bold text-slate-400 tracking-wider">OR</span>
              </div>

              {/* Social Logins */}
              <div className="text-center">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">Login with</p>
                <div className="flex justify-center space-x-4">
                  <div className="w-11 h-11 rounded-full border border-slate-200/60 flex items-center justify-center hover:bg-white/40 backdrop-blur-sm transition-all cursor-pointer shadow-sm">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" fill="#FBBC05"/>
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" fill="#EA4335"/>
                    </svg>
                  </div>
                  <div className="w-11 h-11 rounded-full border border-slate-200/60 flex items-center justify-center hover:bg-white/40 backdrop-blur-sm transition-all cursor-pointer shadow-sm">
                    <svg className="w-4 h-4" viewBox="0 0 23 23" fill="currentColor">
                      <path d="M0 0h11v11H0z" fill="#f25022" />
                      <path d="M12 0h11v11H12z" fill="#7fba00" />
                      <path d="M0 12h11v11H0z" fill="#00a4ef" />
                      <path d="M12 12h11v11H12z" fill="#ffb900" />
                    </svg>
                  </div>
                  <div className="w-11 h-11 rounded-full border border-slate-200/60 flex items-center justify-center hover:bg-white/40 backdrop-blur-sm transition-all cursor-pointer shadow-sm">
                    <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Secure Trust Badge */}
              <div className="mt-8 flex items-center justify-center space-x-1.5 text-[11px] text-slate-400 font-bold">
                <svg className="w-4 h-4 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
                <span>Secure</span>
                <span className="text-[8px] opacity-60">•</span>
                <span>Fast</span>
                <span className="text-[8px] opacity-60">•</span>
                <span>Reliable</span>
              </div>

            </div> 

            <div className="mt-6 text-center pt-4 border-t border-slate-200/40"> 
              <p className="text-xs text-slate-500 font-semibold"> 
                New hospital?{' '} 
                <Link to="/register/hospital" className="font-bold text-blue-600 hover:text-blue-700 underline decoration-blue-600/30 hover:decoration-blue-700 transition-colors"> 
                  Register Here 
                </Link> 
              </p> 
            </div> 
          </div> 
        </div> 

      </div> 

      {/* Footer Section */} 
      <div className="w-full m-0 p-0"> 
        <Footer /> 
      </div> 
    </div> 
  );
};

export default HospitalLogin;