import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import Button from '../components/Button'; 
import Footer from '../components/Footer'; 

const DonorLogin = () => { 
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({ phoneOrEmail: '', password: '' }); 
  const [errors, setErrors] = useState({}); 
  const [loading, setLoading] = useState(false); 
  const [success, setSuccess] = useState(false); 
  const [showPassword, setShowPassword] = useState(false);

  const validateForm = () => { 
    const newErrors = {}; 
    if (!formData.phoneOrEmail) { 
      newErrors.phoneOrEmail = 'Phone number or email is required'; 
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
        const response = await fetch('http://localhost:5000/api/donors/login', { 
          method: 'POST', 
          headers: { 'Content-Type': 'application/json' }, 
          body: JSON.stringify({ 
            email: formData.phoneOrEmail, 
            password: formData.password, 
          }), 
        }); 
        const data = await response.json(); 
        if (response.ok && data.success) { 
          setLoading(false); 
          setSuccess(true); 
          localStorage.setItem('donor', JSON.stringify(data.donor)); 
          setTimeout(() => { 
            navigate('/dashboard/donor'); 
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
    setFormData(prev => ({ ...prev, [name]: value })); 
  }; 

  return ( 
    <div className="w-full min-h-screen bg-gradient-to-br from-[#E6F4F1] via-[#F4FAF8] to-[#E6F4F1] flex flex-col justify-between relative overflow-hidden"> 
      
      {/* Faint Heartbeat Trace Overlay in background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] text-red-800">
        <svg className="w-full h-full" viewBox="0 0 1600 800" preserveAspectRatio="none">
          <path d="M 0 400 L 400 400 L 420 380 L 430 420 L 440 320 L 450 480 L 460 400 L 470 410 L 480 395 L 490 400 L 900 400 L 920 380 L 930 420 L 940 320 L 950 480 L 960 400 L 970 410 L 980 395 L 990 400 L 1600 400" fill="none" stroke="currentColor" strokeWidth="3" />
        </svg>
      </div>

      {/* Large watermark heart with pulse on the right side */}
      <div className="absolute right-[-100px] bottom-[-50px] w-[500px] h-[500px] text-red-600/[0.03] pointer-events-none hidden lg:block">
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-full h-full">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>

      {/* ECG Graph Grid Background */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.2]" style={{
        backgroundImage: `linear-gradient(to right, rgba(20, 184, 166, 0.08) 1px, transparent 1px),
                          linear-gradient(to bottom, rgba(20, 184, 166, 0.08) 1px, transparent 1px)`,
        backgroundSize: '24px 24px'
      }} />

      {/* ECG Heartbeat Lines with Advanced Glow */}
      <div className="absolute inset-0 flex items-start pt-60 justify-center pointer-events-none opacity-25">
        <svg className="w-full h-48 text-red-500" viewBox="0 0 1600 200" preserveAspectRatio="none">
          <defs>
            <filter id="super-glow-red" x="-20%" y="-20%" width="140%" height="140%">
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
            @keyframes ekg-sweep-donor {
              0% { stroke-dashoffset: 1600; }
              100% { stroke-dashoffset: 0; }
            }
            .ekg-pulse-donor-glow {
              stroke-dasharray: 150 1450;
              animation: ekg-sweep-donor 6s linear infinite;
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
            stroke="#EF4444" 
            strokeWidth="4.5" 
            className="ekg-pulse-donor-glow"
            filter="url(#super-glow-red)"
          />
          {/* Animated Glowing EKG Pulse Path - White Core Layer */}
          <path 
            d="M 0 100 L 200 100 C 210 100, 215 85, 220 85 C 225 85, 230 100, 240 100 L 270 100 L 280 115 L 295 20 L 310 160 L 320 100 L 350 100 C 365 100, 375 75, 385 75 C 395 75, 405 100, 420 100 L 600 100 C 610 100, 615 85, 620 85 C 625 85, 630 100, 640 100 L 670 100 L 680 115 L 695 20 L 710 160 L 720 100 L 750 100 C 765 100, 775 75, 785 75 C 795 75, 805 100, 820 100 L 1000 100 C 1010 100, 1015 85, 1020 85 C 1025 85, 1030 100, 1040 100 L 1070 100 L 1080 115 L 1095 20 L 1110 160 L 1120 100 L 1150 100 C 1165 100, 1175 75, 1185 75 C 1195 75, 1205 100, 1220 100 L 1600 100" 
            fill="none" 
            stroke="#FFFFFF" 
            strokeWidth="1.5" 
            className="ekg-pulse-donor-glow opacity-95"
          />
        </svg>
      </div>
      {/* Login Screen Wrapper */} 
      <div className="w-full flex-grow flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16 relative"> 
        
        {/* Card Component Container */}
        <div className="max-w-[420px] w-full relative z-10"> 
          <div className="bg-white/70 backdrop-blur-md border border-white/60 rounded-[2.5rem] shadow-[0_20px_50px_rgba(13,148,136,0.05)] py-12 px-8 sm:px-10 flex flex-col justify-between transition-all duration-300 hover:shadow-[0_25px_70px_rgba(13,148,136,0.08)] hover:border-white/80"> 
            <div className="flex-1 flex flex-col justify-between"> 
              
              {/* Droplet Header Badge with Pulse Line */}
              <div className="relative mx-auto w-28 h-28 mb-3 flex items-center justify-center">
                {/* Pulse Line behind droplet */}
                <svg className="absolute w-28 h-10 text-red-200/50" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth={1.8}>
                  <path d="M 0 15 L 25 15 L 30 5 L 35 25 L 40 15 L 60 15 L 65 5 L 70 25 L 75 15 L 100 15" />
                </svg>
                {/* Droplet SVG */}
                <div className="relative w-16 h-16 flex items-center justify-center drop-shadow-[0_4px_10px_rgba(20,184,166,0.15)]">
                  <svg className="w-full h-full text-red-500" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 2.69l5.66 5.66A8 8 0 1 1 6.34 8.35z" />
                  </svg>
                  {/* Heart inside droplet */}
                  <svg className="absolute w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
                  </svg>
                </div>
              </div>

              <div className="text-center mb-6"> 
                <h2 className="text-[25px] font-extrabold text-slate-800 tracking-tight"> Blood Donor Login </h2> 
                <p className="text-slate-400 text-xs font-semibold mt-1"> Welcome back! Please login to continue </p> 
              </div> 

              {success && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-lg text-center text-xs font-semibold"> 
                  Login successful! Redirecting... 
                </div> 
              )} 

              <form onSubmit={handleSubmit} className="space-y-4"> 
                <div>
                  {/* Email/Phone Input */}
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                    </span>
                    <input 
                      type="text" 
                      name="phoneOrEmail" 
                      value={formData.phoneOrEmail} 
                      onChange={handleChange} 
                      required 
                      placeholder="Email or Donor ID" 
                      className="w-full pl-12 pr-4 py-3.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-2xl text-[14px] bg-slate-50/20 text-slate-700 placeholder-slate-400 transition-all font-medium"
                    />
                  </div>
                  {errors.phoneOrEmail && <p className="text-red-500 text-[10px] font-semibold mt-1 pl-4">{errors.phoneOrEmail}</p>}
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
                      className="w-full pl-12 pr-12 py-3.5 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 rounded-2xl text-[14px] bg-slate-50/20 text-slate-700 placeholder-slate-400 transition-all font-medium"
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
                  <Link to="/forgot-password/donor" className="text-xs font-bold text-red-500 hover:underline" > 
                    Forgot Password? 
                  </Link> 
                </div>

                <div className="pt-1"> 
                  <Button 
                    type="submit" 
                    variant="donor" 
                    loading={loading} 
                    className="w-full text-white font-semibold py-3.5 rounded-2xl shadow-sm hover:shadow transition-all duration-200 bg-red-500 hover:bg-red-600 text-sm" 
                  > 
                    Login 
                  </Button> 
                </div> 
              </form> 
            </div> 

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
              <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
              <span>Secure</span>
              <span className="text-[8px] opacity-60">•</span>
              <span>Fast</span>
              <span className="text-[8px] opacity-60">•</span>
              <span>Reliable</span>
            </div>

            <div className="mt-6 text-center pt-4 border-t border-slate-200/40"> 
              <p className="text-xs text-slate-500 font-semibold"> 
                New donor?{' '} 
                <Link to="/register/donor" className="font-bold text-red-500 hover:text-red-600 underline decoration-red-500/30 hover:decoration-red-600 transition-colors" > 
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

export default DonorLogin;
