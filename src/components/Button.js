import React from 'react';

const Button = ({ 
  children, 
  variant = 'primary', 
  type = 'button', 
  onClick, 
  disabled = false,
  loading = false,
  className = '' 
}) => {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors focus:ring-2 focus:outline-none disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#60A5FA]',
    admin: 'bg-[#2563EB] text-white hover:bg-[#1D4ED8] focus:ring-[#60A5FA]',
    donor: 'bg-[#DC2626] text-white hover:bg-[#B91C1C] focus:ring-[#F87171]',
    success: 'bg-[#16A34A] text-white hover:bg-[#15803C] focus:ring-[#4ADE80]',
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${baseClasses} ${variants[variant]} ${disabled || loading ? 'opacity-50' : ''} ${className}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
};

export default Button;