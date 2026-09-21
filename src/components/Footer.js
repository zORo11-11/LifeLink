import React from "react";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-10 border-t border-slate-800 w-full">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 3-Column Responsive Layout without emergency contact/email/address */}
        <div 
          className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 mb-8 text-left"
          style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "2rem" }}
        >
          
          {/* Section 1 (Left): App Branding & Summary */}
          <div className="flex flex-col space-y-3">
            <Link to="/" className="text-2xl font-bold text-sky-400 flex items-center group">
              <span className="mr-2 text-2xl transition-transform group-hover:scale-110">🩺</span>
              <span className="text-white font-extrabold tracking-tight">Life<span className="text-sky-400">Link</span></span>
            </Link>
            <p className="text-sm text-slate-400 leading-relaxed">
              Connecting Hospitals with active blood donors and making organ donation simpler, quicker, and life-saving.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-medium pt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>24/7 Real-Time Emergency Matching Active</span>
            </div>
          </div>

          {/* Section 2 (Middle): Quick Links */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-white font-semibold text-base border-b border-slate-800 pb-2 mb-1">
              Quick Links
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/" className="hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500">›</span> System Overview
                </Link>
              </li>
              <li>
                <a href="#about" className="hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500">›</span> About LifeLink
                </a>
              </li>
              <li>
                <a href="#services" className="hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500">›</span> System Services
                </a>
              </li>
            </ul>
          </div>

          {/* Section 3 (Right): User Portals */}
          <div className="flex flex-col space-y-3">
            <h4 className="text-white font-semibold text-base border-b border-slate-800 pb-2 mb-1">
              User Portals
            </h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li>
                <Link to="/login/hospital" className="hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500">›</span> Hospital Admin Login
                </Link>
              </li>
              <li>
                <Link to="/login/donor" className="hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500">›</span> Blood Donor Login
                </Link>
              </li>
              <li>
                <Link to="/register/hospital" className="hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500">›</span> Hospital Registration
                </Link>
              </li>
              <li>
                <Link to="/register/donor" className="hover:text-sky-400 transition-colors flex items-center gap-1.5">
                  <span className="text-sky-500">›</span> Active Donor Registration
                </Link>
              </li>
            </ul>
          </div>

        </div>

        {/* Centered Bottom Copyright Bar */}
        <div 
          className="pt-6 text-center text-xs text-slate-500 border-t border-slate-800 flex flex-col sm:flex-row justify-between items-center gap-3"
          style={{ textAlign: "center", borderTop: "1px solid #1e293b", marginTop: "20px", paddingTop: "10px" }}
        >
          <p className="w-full sm:w-auto">
            © {new Date().getFullYear()} LifeLink Health Systems. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 text-slate-400">
            <a href="/privacy" className="hover:text-sky-400 transition-colors">Privacy Policy</a>
            <a href="/terms" className="hover:text-sky-400 transition-colors">Terms of Service</a>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
