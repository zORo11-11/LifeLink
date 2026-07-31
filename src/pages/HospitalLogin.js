import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

const HospitalLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    rememberMe: false
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

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
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1E293B]">
              Hospital Admin Login
            </h2>
            <p className="text-[#64748B] mt-2">
              Access your hospital administration portal
            </p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-[#16A34A] bg-opacity-10 border border-[#16A34A] text-[#16A34A] rounded-lg text-center">
              Login successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <FormInput
              label="Hospital Email Address"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              placeholder="admin@hospital.com"
              theme="admin"
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
              theme="admin"
            />

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="rememberMe"
                  name="rememberMe"
                  type="checkbox"
                  checked={formData.rememberMe}
                  onChange={handleChange}
                  className="h-4 w-4 text-[#2563EB] focus:ring-[#60A5FA] border-[#CBD5E1] rounded"
                />
                <label htmlFor="rememberMe" className="ml-2 text-sm text-gray-700">
                  Remember Me
                </label>
              </div>
              <Link 
                to="/" 
                className="text-sm text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
              >
                Forgot Password?
              </Link>
            </div>

            <Button 
              type="submit" 
              variant="admin" 
              loading={loading}
              className="w-full"
            >
              Login as Hospital Admin
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Don't have a registered hospital?{' '}
              <Link 
                to="/register/hospital" 
                className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
              >
                Register Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalLogin;