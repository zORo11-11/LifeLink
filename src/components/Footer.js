import React from "react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 py-12 border-t border-slate-800">
      <div className="max-w-7xl w-full px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="col-span-1 md:col-span-1">
            <h3 className="text-2xl font-bold text-sky-400 mb-3 flex items-center">
              <span className="mr-2">🩺</span>LifeLink
            </h3>
            <p className="text-sm text-slate-400">
              Connecting Hospitals with active blood donors and making organ
              donation simpler and quicker
            </p>
          </div>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="#overview" className="hover:text-sky-400 transition-colors">System overview</a></li>
            <li><a href="#hospitals" className="hover:text-sky-400 transition-colors">Hospitals</a></li>
            <li><a href="#about" className="hover:text-sky-400 transition-colors">About</a></li>
            <li><a href="#contact" className="hover:text-sky-400 transition-colors">Contact Us</a></li>
          </ul>
        </div>
        
        <div><br></br>
          <h4 className="text-white font-semibold mb-3">User Portals</h4>
          <ul className="space-y-2 text-sm">
            <li><a href="/login/hospital" className="hover:text-sky-400 transition-colors">Hospital Admin Login</a></li>
            <li><a href="/login/donor" className="hover:text-sky-400 transition-colors">Blood Donor Login</a></li>
            
          </ul>
        </div>
        <div className="pt-8 border-t border-slate-800 text-center text-xs text-slate-500 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>© {new Date().getFullYear()} LifeLink Health Systems. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="/privacy" className="hover:text-slate-400">Privacy Policy</a>
            <a href="/terms" className="hover:text-slate-400">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
