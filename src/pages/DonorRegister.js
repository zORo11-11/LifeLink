import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import FormInput from '../components/FormInput';
import Button from '../components/Button';

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
    
    if (!formData.fullName) newErrors.fullName = 'Full name is required';
    
    if (!formData.age) {
      newErrors.age = 'Age is required';
    } else if (parseInt(formData.age) < 18) {
      newErrors.age = 'You must be 18 or older to register';
    }
    
    if (!formData.phone) newErrors.phone = 'Phone number is required';
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email format is invalid';
    }
    
    if (!formData.address) newErrors.address = 'Residential address is required';
    if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood group is required';
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
  setLoading(true);
  setErrors({});

  try {
    const response = await fetch('http://localhost:5000/api/donors/register', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(formData),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Registration failed');
    }

    setSuccess(true);
    setTimeout(() => {
      navigate('/donor/login');
    }, 2000);

  } catch (err) {
    setErrors({ server: err.message });
  } finally {
    setLoading(false);
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
      <div className="max-w-2xl w-full space-y-8">
        <div className="bg-white rounded-xl shadow-lg p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#991B1B]">
              Register as Active Donor
            </h2>
            <p className="text-[#374151] mt-2">
              Create your blood donor profile
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
                label="Age"
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                error={errors.age}
                required
                placeholder="25"
                theme="donor"
              />
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <FormInput
                label="Phone Number"
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                error={errors.phone}
                required
                placeholder="+1234567890"
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
              placeholder="123 Main Street, City"
              theme="donor"
            />

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Blood Group <span className="text-red-500">*</span>
              </label>
              <select
                name="bloodGroup"
                value={formData.bloodGroup}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-[#FECACA] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#F87171] focus:border-[#F87171] transition-colors"
              >
                <option value="">Select Blood Group</option>
                {bloodGroups.map(group => (
                  <option key={group} value={group}>{group}</option>
                ))}
              </select>
              {errors.bloodGroup && <p className="text-red-500 text-xs mt-1">{errors.bloodGroup}</p>}
            </div>
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
              label="Date of Last Donation"
              type="date"
              name="lastDonation"
              value={formData.lastDonation}
              onChange={handleChange}
              placeholder="YYYY-MM-DD"
              theme="donor"
            />

            <Button 
              type="submit" 
              variant="donor" 
              loading={loading}
              className="w-full"
            >
              Register as Active Donor
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have a donor profile?{' '}
              <Link 
                to="/login/donor" 
                className="font-medium text-[#DC2626] hover:text-[#B91C1C] transition-colors"
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

export default DonorRegister;