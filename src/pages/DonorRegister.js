import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import Button from '../components/Button';
import Footer from '../components/Footer';

const DonorRegister = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    age: '',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    allergies: '',
    conditions: '',
    lastDonation: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

  const validateForm = () => {
    const newErrors = {};

    // Full Name validation (no numbers allowed)
    if (!formData.fullName.trim()) {
      newErrors.fullName = 'Full name is required';
    } else if (/\d/.test(formData.fullName)) {
      newErrors.fullName = 'Full name cannot contain numbers';
    }

    // Age validation (18+)
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age, 10) < 18) {
      newErrors.age = 'You must be 18 or older to register';
    } else if (parseInt(formData.age, 10) > 100) {
      newErrors.age = 'Please enter a valid age';
    }

    // 10-digit phone number validation (Regex: /^[0-9]{10}$/)
    const cleanPhone = formData.phone.replace(/[\s\-\(\)]/g, '');
    if (!cleanPhone) {
      newErrors.phone = '10-digit phone number is required';
    } else if (!/^[0-9]{10}$/.test(cleanPhone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits';
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      newErrors.email = 'Email address is required';
    } else if (!emailRegex.test(formData.email.trim())) {
      newErrors.email = 'Please enter a valid email format';
    }

    // Residential Address validation
    if (!formData.address.trim()) {
      newErrors.address = 'Residential address is required';
    }

    // Blood group selection validation
    if (!formData.bloodGroup) {
      newErrors.bloodGroup = 'Blood group selection is required';
    } else if (!bloodGroups.includes(formData.bloodGroup)) {
      newErrors.bloodGroup = 'Please select a valid blood group';
    }

    // Password validation (min 8 chars & combination of letters and numbers)
    const passwordComboRegex = /^(?=.*[a-zA-Z])(?=.*[0-9])/;
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error for field as user types
    if (errors[name]) {
      setErrors(prev => ({
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
      const response = await fetch('http://localhost:5000/api/donors/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          phone: formData.phone.replace(/[\s\-\(\)]/g, '')
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Registration failed');
      }

      setSuccess(true);
      setTimeout(() => {
        navigate('/login/donor');
      }, 1500);

    } catch (err) {
      setErrors({ server: err.message });
    } finally {
      setLoading(false);
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
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-red-100 text-red-600 mb-3">
              🩸
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Register as Active Donor
            </h2>
            <p className="text-slate-500 text-sm mt-1">
              Create your blood donor profile to save lives
            </p>
          </div>

          {success && (
            <div className="mb-6 p-4 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-center text-sm font-semibold animate-fade-in flex items-center justify-center gap-2">
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
                label="Full Name"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                error={errors.fullName}
                required
                placeholder="John Doe"
                theme="donor"
              />

              <FormInput
                label="Age (18+)"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
                required
                placeholder="25"
                theme="donor"
                min="18"
                max="100"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormInput
                label="10-Digit Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                placeholder="9876543210"
                theme="donor"
              />

              <FormInput
                label="Email Address"
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                required
                placeholder="john@example.com"
                theme="donor"
              />
            </div>

            <FormInput
              label="Residential Address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              error={errors.address}
              required
              placeholder="123 Main Street, Apt 4B, City"
              theme="donor"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Blood Group <span className="text-red-500 ml-1">*</span>
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className={`w-full px-3.5 py-2.5 border rounded-lg text-sm text-slate-800 focus:outline-none focus:ring-2 transition-all duration-150 ${
                  errors.bloodGroup 
                    ? 'border-red-500 bg-red-50/20 focus:ring-red-500 focus:border-red-500' 
                    : 'border-red-200 focus:ring-red-500 focus:border-red-500'
                }`}
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              {errors.bloodGroup && (
                <p className="text-red-500 text-xs font-medium mt-1 flex items-center gap-1">
                  <span className="text-red-500">⚠</span> {errors.bloodGroup}
                </p>
              )}
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
                theme="donor"
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
                theme="donor"
              />
            </div>

            <FormInput
              label="Known Allergies (Optional)"
              name="allergies"
              value={formData.allergies}
              onChange={handleChange}
              placeholder="e.g., Penicillin, Latex"
              theme="donor"
            />

            <FormInput
              label="Pre-existing Medical Conditions (Optional)"
              name="conditions"
              value={formData.conditions}
              onChange={handleChange}
              placeholder="e.g., Diabetes, Hypertension"
              theme="donor"
            />

            <FormInput
              label="Date of Last Donation (Optional)"
              type="date"
              name="lastDonation"
              value={formData.lastDonation}
              onChange={handleChange}
              theme="donor"
            />

            <div className="pt-2">
              <Button 
                type="submit" 
                variant="donor" 
                loading={loading}
                className="w-full py-3 text-white font-semibold rounded-xl bg-red-600 hover:bg-red-700 shadow-md transition-all duration-200"
              >
                Register as Active Donor
              </Button>
            </div>
          </form>

          <div className="mt-6 text-center pt-4 border-t border-slate-100">
            <p className="text-sm text-slate-600">
              Already have a donor profile?{' '}
              <Link 
                to="/login/donor" 
                className="font-bold text-red-600 hover:text-red-700 underline decoration-red-300 hover:decoration-red-600 transition-colors"
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

export default DonorRegister;