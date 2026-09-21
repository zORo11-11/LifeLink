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
  theme = 'admin', // 'admin' or 'donor'
  ...props
}) => {
  const focusRing = error 
    ? 'focus:ring-red-500 focus:border-red-500' 
    : theme === 'admin' 
      ? 'focus:ring-blue-500 focus:border-blue-500' 
      : 'focus:ring-red-500 focus:border-red-500';
      
  const borderColor = error 
    ? 'border-red-500 bg-red-50/20' 
    : theme === 'admin' 
      ? 'border-slate-300' 
      : 'border-red-200';

  return (
    <div className={`mb-4 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-slate-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      <input
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3.5 py-2.5 border ${borderColor} rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 ${focusRing} transition-all duration-150`}
        {...props}
      />
      {error && <p className="text-red-500 text-xs font-medium mt-1 flex items-center gap-1"><span className="text-red-500">⚠</span> {error}</p>}
    </div>
  );
};

export default FormInput;