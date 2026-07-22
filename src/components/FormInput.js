import React from 'react';

const FormInput = ({ 
  label, 
  type = 'text', 
  name, 
  value, 
  onChange, 
  error, 
  required = false,
  placeholder,
  className = '',
  theme = 'admin' // 'admin' or 'donor'
}) => {
  const focusRing = theme === 'admin' ? 'focus:ring-[#60A5FA] focus:border-[#60A5FA]' : 'focus:ring-[#F87171] focus:border-[#F87171]';
  const borderColor = theme === 'admin' ? 'border-[#CBD5E1]' : 'border-[#FECACA]';

  return (
    <div className={`mb-4 ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border ${borderColor} rounded-lg focus:outline-none focus:ring-2 ${focusRing} transition-colors`}
      />
      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
};

export default FormInput;