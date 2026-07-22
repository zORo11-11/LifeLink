import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

const DonorLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    phoneOrEmail: '',
    password: ''
  });
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      setLoading(true);
      // Simulate API call
      setTimeout(() => {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          navigate('/');
        }, 1500);
      }, 1000);
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
    <div className="min-h-screen bg-[#FFF5F5] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#7F1D1D]">
              Blood Donor Login
            </h2>
            <p className="text-[#374151] mt-2">
              Access your donor profile and manage donations
            </p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-[#16A34A] bg-opacity-10 border border-[#16A34A] text-[#16A34A] rounded-lg text-center">
              Login successful! Redirecting...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
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

            <Button 
              type="submit" 
              variant="donor" 
              loading={loading}
              className="w-full"
            >
              Login as Blood Donor
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New donor?{' '}
              <Link 
                to="/register/donor" 
                className="font-medium text-[#DC2626] hover:text-[#B91C1C] transition-colors"
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

export default DonorLogin;