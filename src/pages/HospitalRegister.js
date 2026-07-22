import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

const HospitalRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    hospitalName: '',
    licenseId: '',
    adminName: '',
    email: '',
    password: '',
    confirmPassword: '',
    address: '',
    city: '',
    lat: '',
    lng: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.hospitalName) newErrors.hospitalName = 'Hospital name is required';
    if (!formData.licenseId) newErrors.licenseId = 'License ID is required';
    if (!formData.adminName) newErrors.adminName = 'Admin name is required';
    
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
    
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    if (!formData.address) newErrors.address = 'Address is required';
    if (!formData.city) newErrors.city = 'City is required';
    if (!formData.lat) newErrors.lat = 'Latitude is required';
    if (!formData.lng) newErrors.lng = 'Longitude is required';
    
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
          navigate('/login/hospital');
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
    <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#1E3A8A]">
              Register Hospital Account
            </h2>
            <p className="text-[#64748B] mt-2">
              Create your hospital administration account
            </p>
          </div>

          {success && (
            <div className="mb-4 p-3 bg-[#16A34A] bg-opacity-10 border border-[#16A34A] text-[#16A34A] rounded-lg text-center">
              Registration successful! Redirecting to login...
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-4">
              <FormInput
                label="Hospital Name"
                name="hospitalName"
                value={formData.hospitalName}
                onChange={handleChange}
                error={errors.hospitalName}
                required
                placeholder="City General Hospital"
                theme="admin"
              />

              <FormInput
                label="Official License / Registration ID"
                name="licenseId"
                value={formData.licenseId}
                onChange={handleChange}
                error={errors.licenseId}
                required
                placeholder="HOSP-12345"
                theme="admin"
              />
            </div>

            <FormInput
              label="Admin Full Name"
              name="adminName"
              value={formData.adminName}
              onChange={handleChange}
              error={errors.adminName}
              required
              placeholder="Dr. John Smith"
              theme="admin"
            />

            <FormInput
              label="Official Contact Email"
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              error={errors.email}
              required
              placeholder="admin@hospital.com"
              theme="admin"
            />

            <div className="grid md:grid-cols-2 gap-4">
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

              <FormInput
                label="Confirm Password"
                type="password"
                name="confirmPassword"
                value={formData.confirmPassword}
                onChange={handleChange}
                error={errors.confirmPassword}
                required
                placeholder="••••••••"
                theme="admin"
              />
            </div>

            <FormInput
              label="Full Hospital Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
              placeholder="123 Medical Drive, Suite 100"
              theme="admin"
            />

            <div className="grid md:grid-cols-3 gap-4">
              <FormInput
                label="City"
                name="city"
                value={formData.city}
                onChange={handleChange}
                error={errors.city}
                required
                placeholder="New York"
                theme="admin"
              />

              <FormInput
                label="Latitude"
                type="number"
                name="lat"
                value={formData.lat}
                onChange={handleChange}
                error={errors.lat}
                required
                placeholder="40.7128"
                theme="admin"
              />

              <FormInput
                label="Longitude"
                type="number"
                name="lng"
                value={formData.lng}
                onChange={handleChange}
                error={errors.lng}
                required
                placeholder="-74.0060"
                theme="admin"
              />
            </div>

            <Button 
              type="submit" 
              variant="admin" 
              loading={loading}
              className="w-full"
            >
              Register Hospital Account
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already registered?{' '}
              <Link 
                to="/login/hospital" 
                className="font-medium text-[#2563EB] hover:text-[#1D4ED8] transition-colors"
              >
                Login Here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HospitalRegister;