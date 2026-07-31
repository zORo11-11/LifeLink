import React, { useState } from 'react'; 
import { Link, useNavigate } from 'react-router-dom'; 
import FormInput from '../components/FormInput'; 
import Button from '../components/Button'; 
import Footer from '../components/Footer'; 

const DonorLogin = () => { 
  const navigate = useNavigate(); 
  const [formData, setFormData] = useState({ phoneOrEmail: '', password: '' }); 
  const [errors, setErrors] = useState({}); 
  const [loading, setLoading] = useState(false); 
  const [success, setSuccess] = useState(false); 

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
    <div className="w-full bg-gradient-to-br from-[#FFF0F0] via-[#FEE2E2] to-[#FFFBFB]"> 
      {/* Login Screen Wrapper - Locked tightly to 100% of the active viewport height */} 
      <div className="w-full h-[100dvh] flex items-center justify-center bg-white/20 backdrop-blur-xl border-b border-white/40 px-4 sm:px-6 lg:px-8 py-12 relative overflow-hidden"> 
        
        {/* Ambient Glow Orbs */}
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-[#DC2626] rounded-full filter blur-[100px] opacity-[0.08] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#7F1D1D] rounded-full filter blur-[120px] opacity-[0.05] pointer-events-none" />

        {/* Card Component Container */}
        <div className="max-w-md w-full relative z-10"> 
          <div className="bg-white/50 backdrop-blur-2xl border border-white/60 rounded-2xl shadow-xl py-12 px-10 min-h-[560px] flex flex-col justify-between transition-transform duration-500 ease-out hover:scale-[0.98]"> 
            <div className="flex-1 flex flex-col justify-between"> 
              <div className="text-center mb-4"> 
                <h2 className="text-3xl font-bold text-[#7F1D1D] tracking-tight"> Blood Donor Login </h2> 
                <p className="text-[#4B5563] mt-3 text-sm font-medium">  </p> 
              </div> 

              {success && (
                <div className="mb-4 p-3 bg-emerald-500/10 border border-emerald-500/30 text-emerald-800 rounded-lg text-center backdrop-blur-sm text-sm font-semibold"> 
                  Login successful! Redirecting... 
                </div> 
              )} 

              <form onSubmit={handleSubmit} className="space-y-6"> 
                <div className="space-y-5"> 
                  <FormInput 
                    label="Phone Number or Email" 
                    type="text" 
                    name="phoneOrEmail" 
                    value={formData.phoneOrEmail} 
                    onChange={handleChange} 
                    error={errors.phoneOrEmail} 
                    required 
                    placeholder="john@example.com or +1234567890" 
                    theme="donor" 
                  /> 
                  <FormInput 
                    label="Password" 
                    type="password" 
                    name="password" 
                    value={formData.password} 
                    onChange={handleChange} 
                    error={errors.password} 
                    required 
                    placeholder="••••••••" 
                    theme="donor" 
                  /> 
                </div> 

                <div className="pt-4 space-y-4 text-center"> 
                  <Button 
                    type="submit" 
                    variant="donor" 
                    loading={loading} 
                    className="w-full text-white font-medium py-3 rounded-lg shadow-md hover:shadow-lg transition-all duration-[350ms] ease-in-out [background:linear-gradient(135deg,#EF4444,#DC2626)] hover:[background:linear-gradient(135deg,#DC2626,#B91C1C)]" 
                  > 
                    Login as Blood Donor 
                  </Button> 
                  <div> 
                    <Link to="/forgot-password/donor" className="text-xs font-bold text-[#4B5563] hover:text-[#DC2626] transition-colors duration-200" > 
                      Forgot Password? 
                    </Link> 
                  </div> 
                </div> 
              </form> 
            </div> 

            <div className="mt-8 text-center pt-4 border-t border-white/30"> 
              <p className="text-sm text-[#4B5563] font-medium"> 
                New donor?{' '} 
                <Link to="/register/donor" className="font-bold text-[#DC2626] hover:text-[#B91C1C] underline decoration-[#DC2626]/40 hover:decoration-[#B91C1C] transition-colors" > 
                  Register Here 
                </Link> 
              </p> 
            </div> 
          </div> 
        </div> 

      </div> 

      {/* Footer Section - Pushed below the 100dvh viewport boundary */} 
      <div className="w-full m-0 p-0"> 
        <Footer /> 
      </div> 
    </div> 
  ); 
}; 

export default DonorLogin;
