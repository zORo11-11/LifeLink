import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [gradientAngle, setGradientAngle] = useState(135);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;
    
    // Rotates gradient angle between 90deg and 220deg based on cursor position
    const calculatedAngle = Math.round(90 + (x / width) * 130);
    setGradientAngle(calculatedAngle);
  };

  const handleMouseLeave = () => {
    setGradientAngle(135); // Resets smoothly
  };

  return (
    <div className="sticky top-4 z-50 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto w-full">
      {/* Floating Glass Container */}
      <nav className="bg-white/40 backdrop-blur-xl border border-white/80 shadow-lg shadow-black/5 rounded-2xl transition-all duration-300">
        <div className="px-6 h-16 flex justify-between items-center">
          
          {/* Branding with Gradient Shift, Zoom, and Motion Delay */}
          <div className="flex-shrink-0">
            <Link 
              to="/" 
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
              className="text-2xl font-bold flex items-center group cursor-pointer select-none py-1 transition-all duration-500 delay-100 ease-out transform hover:scale-105"
            >
              {/* Emoji Icon */}
              <span className="mr-2 transition-transform duration-500 delay-100 ease-out transform group-hover:scale-110">
                🩺
              </span>

              {/* Text with dynamic blue-cyan-indigo gradient shift */}
              <span 
                className="font-extrabold bg-clip-text text-transparent transition-all duration-700 delay-150 ease-out"
                style={{
                  backgroundImage: `linear-gradient(${gradientAngle}deg, #1E40AF, #2563EB, #06B6D4, #3B82F6)`
                }}
              >
                LifeLink
              </span>
            </Link>
          </div>

          {/* Navigation Links with Glassy Hover Zoom & Pointer Delay */}
          <div className="hidden md:flex space-x-6 lg:space-x-8">
            {['Home', 'About', 'Services', 'How It Works', 'Statistics', 'FAQs', 'Contact'].map((item) => (
              <Link 
                key={item}
                to="/" 
                className="text-slate-700 hover:text-[#2563EB] font-medium transition-all duration-500 delay-75 ease-out transform hover:scale-110 hover:-translate-y-0.5 inline-block text-sm"
              >
                {item}
              </Link>
            ))}
          </div>

          {/* Quick Action Buttons with Hover Zoom & Smooth Lag Transition */}
          <div className="flex space-x-3">
            <Link 
              to="/login/hospital" 
              className="px-4 py-2 bg-[#2563EB] text-white rounded-xl text-sm font-medium hover:bg-[#1D4ED8] transition-all duration-500 delay-100 ease-out transform hover:scale-105 active:scale-95 shadow-md shadow-blue-500/20 focus:ring-2 focus:ring-[#60A5FA] focus:outline-none"
            >
              Hospital Login
            </Link>
            <Link 
              to="/login/donor" 
              className="px-4 py-2 bg-[#DC2626] text-white rounded-xl text-sm font-medium hover:bg-[#B91C1C] transition-all duration-500 delay-100 ease-out transform hover:scale-105 active:scale-95 shadow-md shadow-red-500/20 focus:ring-2 focus:ring-[#F87171] focus:outline-none"
            >
              Blood Donor Login
            </Link>
          </div>

        </div>
      </nav>
    </div>
  );
};

export default Navbar;