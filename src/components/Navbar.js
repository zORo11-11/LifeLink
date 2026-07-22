import React from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  return (
    <nav className="bg-white shadow-sm border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Branding */}
          <div className="flex-shrink-0">
            <Link to="/" className="text-2xl font-bold text-[#2563EB] flex items-center">
              <span className="mr-2">🩺</span>
              LifeLink
            </Link>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex space-x-8">
            <Link to="/" className="text-gray-700 hover:text-[#2563EB] transition-colors">Home</Link>
            <Link to="/" className="text-gray-700 hover:text-[#2563EB] transition-colors">About</Link>
            <Link to="/" className="text-gray-700 hover:text-[#2563EB] transition-colors">Services</Link>
            <Link to="/" className="text-gray-700 hover:text-[#2563EB] transition-colors">How It Works</Link>
            <Link to="/" className="text-gray-700 hover:text-[#2563EB] transition-colors">Statistics</Link>
            <Link to="/" className="text-gray-700 hover:text-[#2563EB] transition-colors">FAQs</Link>
            <Link to="/" className="text-gray-700 hover:text-[#2563EB] transition-colors">Contact</Link>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex space-x-3">
            <Link 
              to="/login/hospital" 
              className="px-4 py-2 bg-[#2563EB] text-white rounded-lg font-medium hover:bg-[#1D4ED8] transition-colors focus:ring-2 focus:ring-[#60A5FA] focus:outline-none"
            >
              Hospital Login
            </Link>
            <Link 
              to="/login/donor" 
              className="px-4 py-2 bg-[#DC2626] text-white rounded-lg font-medium hover:bg-[#B91C1C] transition-colors focus:ring-2 focus:ring-[#F87171] focus:outline-none"
            >
              Blood Donor Login
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;