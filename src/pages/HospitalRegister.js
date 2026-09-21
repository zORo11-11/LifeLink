import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Footer from '../components/Footer';

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
    phone: ''
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateForm = () => {
    const newErrors = {};

    // Hospital Name validation (no numbers allowed)
    if (!formData.hospitalName.trim()) {
      newErrors.hospitalName = 'Hospital name is required';
    } else if (/\d/.test(formData.hospitalName)) {
      newErrors.hospitalName = 'Hospital name cannot contain numbers';
    }

    // License / Registration Number validation
    if (!formData.licenseId.trim()) {
      newErrors.licenseId = 'License / Registration ID is required';
    }

    // Contact Person Name validation (no numbers allowed)
    if (!formData.adminName.trim()) {
      newErrors.adminName = 'Contact person name is required';
    } else if (/\d/.test(formData.adminName)) {
      newErrors.adminName = 'Contact person name cannot contain numbers';
    }

    // Official Email Format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Official email is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid official email format';
    }

    // 10-Digit Emergency Contact Phone validation (Regex: /^[0-9]{10}$/)
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone) {
      newErrors.phone = '10-digit emergency contact phone is required';
    } else if (!/^[0-9]{10}$/.test(cleanPhone)) {
      newErrors.phone = 'Emergency contact phone must be exactly 10 digits';
    }

    // Location Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Location address is required';
    }

    // City validation
    if (!formData.city.trim()) {
      newErrors.city = 'City is required';
    }

    // Password validation (min 8 chars & combination of letters and numbers)
    const passwordComboRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    } else if (!passwordComboRegex.test(formData.password)) {
      newErrors.password = 'Password must contain a combination of letters and numbers';
    }

    // Confirm password matching
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
    // Clear field error as user types
    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Prevent default form submission if any field fails validation
    if (!validateForm()) {
      return;
    }

    setLoading(true);
    setErrors({});

    try {
      const response = await fetch('http://localhost:5000/api/hospitals/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.replace(/[\s\-\(\)]/g, '')
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setLoading(false);
        setSuccess(true);
        setTimeout(() => {
          navigate('/login/hospital');
        }, 1500);
      } else {
        setLoading(false);
        setErrors({ server: data.message || 'Hospital registration failed.' });
      }
    } catch (error) {
      setLoading(false);
      console.error('Registration error:', error);
      setErrors({ server: 'Cannot connect to server. Ensure backend is running at http://localhost:5000' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50 text-slate-800">
      
      {/* Centered Main Layout */}
      <main 
        className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12 w-full"
        style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 'calc(100vh - 200px)' }}
      >
        {/* Form Container (max-width 550px centered) */}
        <div 
          className="w-full bg-white rounded-2xl shadow-xl border border-slate-100 p-6 sm:p-8 my-auto transition-all duration-300"
          style={{ maxWidth: '550px', margin: '0 auto' }}
        >
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-blue-100 text-blue-600 mb-3">
              🏥
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Register Hospital Account
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Create your hospital administration account
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-center text-sm font-semibold flex items-center justify-center gap-2">
              <span>✓</span> Registration successful! Redirecting to login...
            </div>
          )}

          {errors.server && (
            <div className="mb-6 p-4 bg-red-50 border border-red-300 text-red-700 rounded-xl text-center text-sm font-medium">
              ⚠ {errors.server}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                label="License / Reg ID"
                name="licenseId"
                value={formData.licenseId}
                onChange={handleChange}
                error={errors.licenseId}
                required
                placeholder="HOSP-12345"
                theme="admin"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Contact Person Name"
                name="adminName"
                value={formData.adminName}
                onChange={handleChange}
                error={errors.adminName}
                required
                placeholder="Dr. Jane Smith"
                theme="admin"
              />

              <FormInput
                label="Official Email Format"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                placeholder="admin@hospital.com"
                theme="admin"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="Password (min 8 chars)"
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
              label="Location Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
              placeholder="123 Medical Center Drive"
              theme="admin"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                label="10-Digit Emergency Phone"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                placeholder="9876543210"
                theme="admin"
              />
            </div>

            <div className="pt-2">
              <Button 
                type="submit" 
                variant="primary" 
                loading={loading}
                className="w-full py-3 text-white font-semibold rounded-xl bg-blue-600 hover:bg-blue-700 shadow-md transition-all duration-200"
              >
                Register Hospital Account
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Already registered?{' '}
              <Link 
                to="/login/hospital" 
                className="font-bold text-blue-600 hover:text-blue-700 underline decoration-blue-300 hover:decoration-blue-600 transition-colors"
              >
                Login Here
              </Link>
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HospitalRegister;